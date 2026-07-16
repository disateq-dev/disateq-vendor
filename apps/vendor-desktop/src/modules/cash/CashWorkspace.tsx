import { useState, useEffect, useRef, useMemo } from "react";
import { Clock, LogIn, LogOut, Lock, CheckCircle, Printer, AlertTriangle, X, Wallet, ShoppingCart, Pencil, CircleCheck, Monitor, ShieldAlert, ClipboardList, ListChecks } from "lucide-react";
import { type CashSubView } from "../../App";
import { SupervisionCajaWorkspace } from "./SupervisionCajaWorkspace";
import { usePOS, type CashBox, type MoveType, type CashMove } from "../../context/POSContext";
import type { TurnEvent } from "../../domains/cash/turn-events.store";
import {
  printCashMoveVoucher, printCashMoveVoucherThermal, type VoucherMoveData,
  printArqueo, printArqueoThermal, type ArqueoData,
} from "../../print/printTicket";
import { calcConciliation } from "./services/cash-conciliation.service";
import {
  prereqCode,
  canOpenSession, validateCanAddMove,
  MIN_MOTIVO_LEN,
  detectOpeningMode, type OpeningMode,
} from "./services/cash-rules.service";
import { loadBusinessConfig } from "../../config/business";
import { loadOpsConfig } from "../../config/ops";
import {
  getCurrentSessionId, loadSessionHistory, actualizarSesionCajaCorrection, type SessionEntry,
} from "./services/session-history.service";
import { AutorizacionEjecucionCard } from "./AutorizacionEjecucionCard";
import {
  loadAuthorizations, markAuthorizationExecuted, getActiveAuthorizationsForBlock,
  type CajaAuthorization,
} from "./services/supervision-authorization.service";
import { moneyAdd, moneySub, moneySum, moneyGt, moneyGte, moneyIsZero } from "../../lib/money";
import { useAutorizacion } from "../../hooks/useAutorizacion";

// ── helpers ────────────────────────────────────────────────────

function formatTime(d: Date): string {
  return d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(d: Date): string {
  const days = ["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${days[d.getDay()]} ${dd}/${mm}/${yyyy}`;
}

function formatDuration(from: Date): string {
  const mins = Math.floor((Date.now() - from.getTime()) / 60_000);
  const h = Math.floor(mins / 60);
  const m = String(mins % 60).padStart(2, "0");
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// ── inline calc helpers ────────────────────────────────────────

function safeCalc(expr: string): number | null {
  const s = expr.trim().replace(/\s+/g, "");
  if (!s) return null;
  if (!/^[0-9+\-*/.]+$/.test(s)) return null;
  const parts = s.match(/[+\-*/]|[0-9]*\.?[0-9]+/g);
  if (!parts) return null;
  const nums: number[] = [];
  const ops:  string[] = [];
  for (const p of parts) {
    if (/^[+\-*/]$/.test(p)) { ops.push(p); }
    else {
      const n = parseFloat(p);
      if (isNaN(n)) return null;
      nums.push(n);
    }
  }
  if (!nums.length || nums.length !== ops.length + 1) return null;
  let i = 0;
  while (i < ops.length) {
    if (ops[i] === "*" || ops[i] === "/") {
      if (ops[i] === "/" && nums[i + 1] === 0) return null;
      const r = ops[i] === "*" ? nums[i] * nums[i + 1] : nums[i] / nums[i + 1];
      if (!isFinite(r)) return null;
      nums.splice(i, 2, Math.round(r * 10000) / 10000);
      ops.splice(i, 1);
    } else { i++; }
  }
  let result = nums[0];
  for (let j = 0; j < ops.length; j++)
    result = ops[j] === "+" ? result + nums[j + 1] : result - nums[j + 1];
  const rounded = Math.round(result * 100) / 100;
  return isFinite(rounded) ? rounded : null;
}

function hasExpr(v: string): boolean { return /[+\-*/]/.test(v); }

function numericValue(v: string): number {
  if (!v.trim()) return 0;
  if (hasExpr(v)) { const r = safeCalc(v); return r !== null && r >= 0 ? r : 0; }
  const n = parseFloat(v);
  return isNaN(n) || n < 0 ? 0 : n;
}

// ── constants ──────────────────────────────────────────────────

type ClosingStage = 0 | 1 | 2 | 3 | 4 | 5;
type ClosingPhase = "none" | "fondo" | "caja";
type CajaStage = "conteo" | "validacion" | "comparacion" | "cierre";

// ── sub-components ─────────────────────────────────────────────

function InfoRow({ label, value, accent, red }: { label: string; value: string; accent?: boolean; red?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">{label}</span>
      <span className={`text-[12px] font-semibold ${red ? "text-[#ef4444]" : accent ? "text-emerald-600" : "text-[#374151]"}`}>{value}</span>
    </div>
  );
}

function Helper({ text }: { text: string }) {
  return (
    <span
      title={text}
      className="inline-flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full bg-[#e4e9f0] text-[8px] font-bold text-[#9ca3af] transition hover:bg-[#d1d9e1] hover:text-[#6b7280]"
    >
      ?
    </span>
  );
}

function BoxRow({ box, isActive, isSelected, onSelect }: {
  box: CashBox; isActive: boolean; isSelected: boolean; onSelect?: () => void;
}) {
  const estado: "en_uso" | "disponible" | "cerrada" | "bloqueada" =
    isActive      ? "en_uso"    :
    box.used      ? "cerrada"   :
    box.available ? "disponible" :
                    "bloqueada";

  const typeLabel =
    box.type === "normal"        ? "PRINCIPAL"     :
    box.type === "contingency-1" ? "SECUNDARIA 01" :
    box.type === "contingency-2" ? "SECUNDARIA 02" :
    "CONTINGENCIA";

  const comentario =
    box.type === "normal"        ? "Flujo principal de ventas"          :
    box.type === "contingency-1" ? "Primera continuación operacional"    :
    box.type === "contingency-2" ? "Segunda continuación operacional"    :
    "Apertura excepcional autorizada";

  const prereq = prereqCode(box);
  const observacion = estado === "bloqueada"
    ? (box.type === "contingencia"
        ? `Requiere caja ${prereq} sin apertura`
        : `Requiere caja ${prereq} cerrada`)
    : "";

  const clickable = !isActive && box.available && !!onSelect;
  const isContg = box.type === "contingencia";

  return (
    <div
      onClick={clickable ? onSelect : undefined}
      className={`flex flex-col gap-1 rounded-2xl px-3 py-2.5 transition select-none ${
        isActive   ? "bg-[#EEF9EF] ring-1 ring-emerald-200" :
        isSelected ? "bg-[#EEF3FD] ring-1 ring-[#2154d8]/25" :
        clickable  ? "cursor-pointer hover:bg-white/80" :
        estado === "bloqueada" ? "opacity-50 cursor-default" :
        "cursor-default"
      }`}
    >
      {/* Fila principal: icono + código + tipo + badge estado */}
      <div className="flex items-center gap-2">
        {estado === "en_uso"    && <Monitor     size={12} strokeWidth={2} className="shrink-0 text-[#2154d8]"   />}
        {estado === "disponible" && !isContg && <CircleCheck size={12} strokeWidth={2} className="shrink-0 text-emerald-500" />}
        {estado === "disponible" &&  isContg && <ShieldAlert size={12} strokeWidth={2} className="shrink-0 text-amber-500"   />}
        {estado === "cerrada"   && <Lock        size={12} strokeWidth={2} className="shrink-0 text-[#9ca3af]"   />}
        {estado === "bloqueada" && <Lock        size={12} strokeWidth={2} className="shrink-0 text-[#d1d9e1]"   />}

        <span className={`text-[12px] font-bold tabular-nums ${
          estado === "en_uso"    ? "text-[#2154d8]"  :
          estado === "disponible" ? "text-[#374151]" :
          estado === "cerrada"   ? "text-[#9ca3af]"  :
          "text-[#c0cad4]"
        }`}>{box.code}</span>

        <span className={`text-[9.5px] font-bold uppercase tracking-wide ${
          estado === "en_uso"    ? "text-[#2154d8]/70"  :
          estado === "disponible" ? (isContg ? "text-amber-600" : "text-[#C59B6D]") :
          estado === "cerrada"   ? "text-[#c0cad4]"     :
          "text-[#d1d9e1]"
        }`}>{typeLabel}</span>

        <div className="ml-auto shrink-0">
          {estado === "en_uso" && (
            <span className="rounded-lg bg-[#dbeafe] px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#2154d8]">EN USO</span>
          )}
          {estado === "disponible" && (
            <span className={`rounded-lg px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest ${
              isContg ? "bg-amber-50 text-amber-600" : "bg-[#f0fdf4] text-emerald-600"
            }`}>DISPONIBLE</span>
          )}
          {estado === "cerrada" && (
            <span className="rounded-lg bg-[#f4f7fb] px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#9ca3af]">CERRADA</span>
          )}
          {isSelected && estado === "disponible" && (
            <span className="ml-1 rounded bg-[#2154d8]/10 px-1.5 py-0.5 text-[8.5px] font-bold text-[#2154d8]">SEL</span>
          )}
        </div>
      </div>

      {/* Comentario + Observación */}
      <div className="pl-5 flex flex-col gap-0.5">
        <p className={`text-[10px] ${estado === "bloqueada" ? "text-[#d1d9e1]" : "text-[#b0bac8]"}`}>
          {comentario}
        </p>
        {observacion && (
          <p className="text-[9.5px] font-semibold text-amber-500">⚡ {observacion}</p>
        )}
      </div>
    </div>
  );
}

// ── main component ─────────────────────────────────────────────

interface CashWorkspaceProps {
  onOpened?: () => void;
  cashSubView: CashSubView;
  onCashSubViewChange?: (sv: CashSubView) => void;
}

export function CashWorkspace({ onOpened, cashSubView, onCashSubViewChange }: CashWorkspaceProps) {
  const {
    cashSession, cashBoxes, suggestedCashBox,
    openCashSession, closeCashSession, correctAperturaData,
    sessionStats, cashMoves, addCashMove, updateCashMove,
    showNotice, operators, activeOperator, currentSessionEvents,
    acknowledgedAuthIds, acknowledgeAuthorization,
  } = usePOS();
  const {
    isOpen, cashBox: activeBox, operator, terminal, openedAt,
    apertura, motivo: sessionMotivo,
    observacion: sessionObservacion, refOp: sessionRefOp,
  } = cashSession;

  // ── pre-open state ────────────────────────────────────────────
  const [lastArqueo, setLastArqueo] = useState<ArqueoData | null>(() => {
    try {
      const raw = localStorage.getItem("disateq.pos.lastArqueo");
      return raw ? (JSON.parse(raw) as ArqueoData) : null;
    } catch { return null; }
  });
  const [sessionHistory, setSessionHistory] = useState<SessionEntry[]>([]);
  const [selectedCode,    setSelectedCode]    = useState<string>(() => {
    const principalCode = activeOperator?.baseBloque != null ? String(activeOperator.baseBloque) : null;
    const principalBox  = principalCode ? cashBoxes.find(b => b.code === principalCode) : null;
    return (principalBox?.available ? principalBox.code : suggestedCashBox?.code) ?? "100";
  });
  const [aperturaInput,   setAperturaInput]   = useState("");
  const [aperturaMotivo,  setAperturaMotivo]  = useState("");
  const [aperturaRefOp,   setAperturaRefOp]   = useState("");
  const [ctgPin,          setCtgPin]          = useState("");
  const [ctgJustif,       setCtgJustif]       = useState("");
  const [ctgPinError,     setCtgPinError]     = useState(false);
  const aperturaRef = useRef<HTMLInputElement>(null);

  // ── corrección datos apertura state ──────────────────────────
  const [editingApertura,    setEditingApertura]    = useState(false);
  const [editAperturaInput,  setEditAperturaInput]  = useState("");
  const [editMotivo,         setEditMotivo]         = useState("");
  const [editObservacion,    setEditObservacion]    = useState("");
  const [editRefOp,          setEditRefOp]          = useState("");

  // ── timer ─────────────────────────────────────────────────────
  const [duration, setDuration] = useState("");
  useEffect(() => {
    loadSessionHistory().then(setSessionHistory);
  }, []);

  useEffect(() => {
    if (!openedAt) { setDuration(""); return; }
    const update = () => setDuration(formatDuration(openedAt));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [openedAt]);

  // ── closing state ─────────────────────────────────────────────
  const [closingPhase, setClosingPhase] = useState<ClosingPhase>(() => {
    if (!isOpen) return "none";
    try {
      const p = localStorage.getItem("disateq:cash:ui:closingPhase");
      return (p === "fondo" || p === "caja") ? p : "none";
    } catch { return "none"; }
  });
  const [cajaStage, setCajaStage] = useState<CajaStage>(() => {
    if (!isOpen) return "conteo";
    try {
      const s = localStorage.getItem("disateq:cash:ui:cajaStage");
      return (s === "conteo" || s === "validacion" || s === "comparacion" || s === "cierre") ? s : "conteo";
    } catch { return "conteo"; }
  });
  const closingStage: ClosingStage = (() => {
    if (closingPhase === "none") return 0;
    if (closingPhase === "fondo") return 1;
    if (cajaStage === "conteo") return 2;
    if (cajaStage === "validacion") return 3;
    if (cajaStage === "comparacion") return 4;
    return 5;
  })();
  function setClosingStage(n: ClosingStage) {
    if (n === 0) {
      setClosingPhase("none");
      setCajaStage("conteo");
      setMotivoFondo("");
      fondoDiferenciaFinal.current = null;
      fondoMotivoFinal.current = "";
      return;
    }
    if (n === 1) { setClosingPhase("fondo"); return; }
    setClosingPhase("caja");
    if (n === 2) setCajaStage("conteo");
    else if (n === 3) setCajaStage("validacion");
    else if (n === 4) setCajaStage("comparacion");
    else setCajaStage("cierre");
  }
  function loadContadoField(field: string): string {
    if (!isOpen) return "";
    try {
      if (closingStage >= 1) {
        const raw = localStorage.getItem("disateq:cash:ui:contado");
        if (raw) return (JSON.parse(raw) as Record<string, string>)[field] ?? "";
      }
    } catch {}
    return "";
  }
  const [contadoFondo, setContadoFondo] = useState(() => loadContadoField("fondo"));
  const [contadoEfe,  setContadoEfe]  = useState(() => loadContadoField("efe"));
  const [contadoYape, setContadoYape] = useState(() => loadContadoField("yape"));
  const [contadoTar,  setContadoTar]  = useState(() => loadContadoField("tar"));
  const [validatedAt,       setValidatedAt]       = useState<string | null>(null);
  const [observations,      setObservations]      = useState("");
  const [zeroMotive,        setZeroMotive]        = useState("");
  const [motivoFondo,       setMotivoFondo]       = useState("");
  const fondoDiferenciaFinal = useRef<number | null>(null);
  const fondoMotivoFinal = useRef("");
  const contadoFondoRef = useRef<HTMLInputElement>(null);
  const contadoEfeRef  = useRef<HTMLInputElement>(null);
  const contadoYapeRef = useRef<HTMLInputElement>(null);
  const contadoTarRef  = useRef<HTMLInputElement>(null);

  const { PinAutorizacionModal } = useAutorizacion();
  const [cierreAutorizado, setCierreAutorizado] = useState(false);

  useEffect(() => {
    if (closingPhase !== "none") {
      localStorage.setItem("disateq:cash:ui:closingPhase", closingPhase);
      localStorage.setItem("disateq:cash:ui:cajaStage", cajaStage);
    } else {
      localStorage.removeItem("disateq:cash:ui:closingPhase");
      localStorage.removeItem("disateq:cash:ui:cajaStage");
    }
  }, [closingPhase, cajaStage]);

  useEffect(() => {
    if (closingStage >= 1 && (contadoFondo !== "" || contadoEfe !== "")) {
      localStorage.setItem("disateq:cash:ui:contado", JSON.stringify({
        fondo: contadoFondo, efe: contadoEfe, yape: contadoYape, tar: contadoTar,
      }));
    } else {
      localStorage.removeItem("disateq:cash:ui:contado");
    }
  }, [closingStage, contadoFondo, contadoEfe, contadoYape, contadoTar]);

  useEffect(() => {
    if (closingStage === 1) setTimeout(() => contadoFondoRef.current?.focus(), 80);
    if (closingStage === 2) setTimeout(() => contadoEfeRef.current?.focus(), 80);
  }, [closingStage]);

  useEffect(() => {
    if (!isOpen) {
      setClosingStage(0);
      setContadoFondo(""); setContadoEfe(""); setContadoYape(""); setContadoTar("");
      setValidatedAt(null); setObservations(""); setZeroMotive("");
      setMotivoFondo(""); fondoDiferenciaFinal.current = null; fondoMotivoFinal.current = "";
      localStorage.removeItem("disateq:cash:ui:closingPhase");
      localStorage.removeItem("disateq:cash:ui:cajaStage");
      localStorage.removeItem("disateq:cash:ui:contado");
      setAperturaInput(""); setAperturaMotivo(""); setAperturaRefOp("");
      setCtgPin(""); setCtgJustif(""); setCtgPinError(false);
      setEditingApertura(false);
      setEditAperturaInput(""); setEditMotivo(""); setEditObservacion(""); setEditRefOp("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      const principalCode = activeOperator?.baseBloque != null ? String(activeOperator.baseBloque) : null;
      const principalBox  = principalCode ? cashBoxes.find(b => b.code === principalCode) : null;
      const best = principalBox?.available ? principalBox : suggestedCashBox;
      if (best) setSelectedCode(best.code);
    }
  }, [isOpen, suggestedCashBox, cashBoxes, activeOperator]);

  // ── movements panel tab ───────────────────────────────────────
  const [movPanel, setMovPanel] = useState<"vendido" | "fondo">("vendido");

  // ── movements state ── Área 1: CAJA DEL DÍA ──────────────────
  const [vendidoMoveType, setVendidoMoveType] = useState<MoveType>(() => {
    const { fondoVendidoEsp } = calcConciliation(
      cashMoves.filter(m => m.regularizationStatus !== "anulado"),
      sessionStats.cash,
      apertura,
    );
    return moneyGt(fondoVendidoEsp, 0) ? "egreso" : "ingreso";
  });
  const [vendidoAmount,   setVendidoAmount]   = useState("");
  const [vendidoMotivo,   setVendidoMotivo]   = useState("");
  const [lastVendidoMove, setLastVendidoMove] = useState<CashMove | null>(null);
  const vendidoAmountRef = useRef<HTMLInputElement>(null);
  const vendidoMotivoRef = useRef<HTMLInputElement>(null);
  // ── movements state ── Área 2: FONDO DE CAMBIO ───────────────
  const [fondoSubTab,   setFondoSubTab]   = useState<"retiro" | "deposito" | "prestado" | "devolver">("retiro");
  const [fondoAmount,   setFondoAmount]   = useState("");
  const [fondoMotivo,   setFondoMotivo]   = useState("");
  const [lastFondoMove, setLastFondoMove] = useState<CashMove | null>(null);
  const fondoAmountRef = useRef<HTMLInputElement>(null);
  const fondoMotivoRef = useRef<HTMLInputElement>(null);
  const [showFondoMotivoSugerencias, setShowFondoMotivoSugerencias] = useState(false);
  // ── reintegro state (ciclo RETIRO → REINTEGRO) ────────────────
  const [reintegroTargetId, setReintegroTargetId] = useState<string | null>(null);
  const [reintegroAmount,   setReintegroAmount]   = useState("");
  const [reintegroMotivo,   setReintegroMotivo]   = useState("");
  const reintegroAmountRef = useRef<HTMLInputElement>(null);
  // ── prestado/devolver state (ciclo PRÉSTAMO RECIBIDO → DEVOLUCIÓN) ──
  const [prestadoAmount,    setPrestadoAmount]    = useState("");
  const [prestadoMotivo,    setPrestadoMotivo]    = useState("");
  const [devolverTargetId,  setDevolverTargetId]  = useState<string | null>(null);
  const [devolverMotivo,    setDevolverMotivo]    = useState("");
  const prestadoAmountRef = useRef<HTMLInputElement>(null);
  const prestadoMotivoRef = useRef<HTMLInputElement>(null);
  const [showPrestadoMotivoSugerencias, setShowPrestadoMotivoSugerencias] = useState(false);

  useEffect(() => {
    setMovPanel("vendido");
    setVendidoMoveType("egreso"); setVendidoAmount(""); setVendidoMotivo(""); setLastVendidoMove(null);
    setFondoSubTab("retiro"); setFondoAmount(""); setFondoMotivo(""); setLastFondoMove(null); setShowFondoMotivoSugerencias(false);
    setReintegroTargetId(null); setReintegroAmount(""); setReintegroMotivo("");
    setPrestadoAmount(""); setPrestadoMotivo(""); setShowPrestadoMotivoSugerencias(false); setDevolverTargetId(null); setDevolverMotivo("");
  }, [isOpen]);

  useEffect(() => {
    if (closingStage > 0) {
      setEditingApertura(false);
    }
  }, [closingStage]);

  // ── config — loaded once at mount; changes take effect on remount ─
  const configuredCtgPin = useMemo(() => loadOpsConfig().ctgPin, []);

  // ── derived ───────────────────────────────────────────────────
  const esVEN = activeOperator?.codigoRol === "VEN";
  const activeMoves = useMemo(() => cashMoves.filter(m => m.regularizationStatus !== "anulado"), [cashMoves]);
  const selectedBox        = isOpen ? activeBox : (cashBoxes.find(b => b.code === selectedCode) ?? null);
  const openingMode: OpeningMode = isOpen ? "normal" : detectOpeningMode(selectedBox);
  const canOpen            = canOpenSession(isOpen, selectedBox, aperturaInput, openingMode, ctgPin, ctgJustif, configuredCtgPin);
  const canCorrectApertura = isOpen && cashMoves.length === 0 && sessionStats.count === 0 && closingStage === 0;

  // Bloque del operador activo — usa operador autenticado real
  const currentOpBlockBase  = activeOperator?.baseBloque ?? null;
  const operatorBlockPrefix = activeBox?.code[0] ?? (currentOpBlockBase !== null ? String(currentOpBlockBase)[0] : suggestedCashBox?.code[0] ?? "1");
  const operatorBoxes       = cashBoxes.filter(b => b.code[0] === operatorBlockPrefix);
  const operatorName        = activeOperator?.alias ?? operators.find(o => o.baseBloque !== null && String(o.baseBloque)[0] === operatorBlockPrefix && o.estado === "ACTIVO")?.alias ?? "Operador";
  const operatorFullName    = activeOperator?.nombreCompleto ?? operators.find(o => o.baseBloque !== null && String(o.baseBloque)[0] === operatorBlockPrefix && o.estado === "ACTIVO")?.nombreCompleto ?? "Operador";

  // ── autorización supervisora pendiente — solo bloque del operador ──
  const [authRefresh, setAuthRefresh] = useState(0);
  const pendingCorrectionAuth: CajaAuthorization | null = useMemo(() => {
    const auths = getActiveAuthorizationsForBlock(operatorBlockPrefix)
      .filter(a => a.type !== "cierre_activo")
      .sort((a, b) => a.authorizedAt.localeCompare(b.authorizedAt));
    return auths[0] ?? null;
  }, [operatorBlockPrefix, authRefresh]);
  const targetSessionForAuth = pendingCorrectionAuth
    ? sessionHistory.find(e => e.id === pendingCorrectionAuth.sessionId) ?? null
    : null;
  function handleCorrectionExecuted() {
    loadSessionHistory().then(setSessionHistory);
    setAuthRefresh(v => v + 1);
    if (pendingCorrectionAuth) acknowledgeAuthorization(pendingCorrectionAuth.id);
  }
  function handleCorrectionPostponed() {
    if (pendingCorrectionAuth) acknowledgeAuthorization(pendingCorrectionAuth.id);
  }

  useEffect(() => {
    if (!canCorrectApertura) setEditingApertura(false);
  }, [canCorrectApertura]);

  // move form derived
  const vendidoTotalAmt = parseFloat(vendidoAmount) || 0;
  const fondoTotalAmt   = parseFloat(fondoAmount)   || 0;
  const canAddVendido    = validateCanAddMove(vendidoTotalAmt, vendidoMotivo);
  const canAddFondo      = validateCanAddMove(fondoTotalAmt,   fondoMotivo);
  const prestadoTotalAmt = parseFloat(prestadoAmount) || 0;
  const canAddPrestado   = validateCanAddMove(prestadoTotalAmt, prestadoMotivo);

  // fondo breakdown — excluye anulados
  const {
    ingresosTotal, egresosTotal, ingVendido, arqueoOperacional, egVendido, fondoApertEsp, fondoVendidoEsp,
  } = calcConciliation(activeMoves, sessionStats.cash, apertura);
  const exceedsFondoVendido = vendidoMoveType === "egreso" && moneyGt(vendidoTotalAmt, fondoVendidoEsp);
  const canSubmitVendido = canAddVendido && (vendidoMoveType === "ingreso" || !exceedsFondoVendido);
  useEffect(() => {
    if (!moneyGt(fondoVendidoEsp, 0) && vendidoMoveType === "egreso") {
      setVendidoMoveType("ingreso");
    }
  }, [fondoVendidoEsp, vendidoMoveType]);
  // ventasDescomp: total de ventas por método (informativo, para pantalla de contexto)
  const ventasDescomp  = moneySum([sessionStats.cash, sessionStats.yape, sessionStats.tarjeta]);
  // préstamos externos pendientes de resolver (por_regularizar)
  const externosPendientes    = activeMoves.filter(m => m.sourceType === "externo" && m.regularizationStatus === "por_regularizar");
  const totalExternosPendientes = moneySum(externosPendientes.map(m => m.amount));
  // préstamos integrados al fondo (su dinero permanece en el fondo)
  const externosIntegrados    = activeMoves.filter(m => m.sourceType === "externo" && m.regularizationMode === "integracion_fondo");
  const totalExternosIntegrados = moneySum(externosIntegrados.map(m => m.amount));
  // fondoEsperado = (apertura + reintegros − retiros) + integrados + préstamos pendientes de devolver
  const fondoEsperado = moneyAdd(moneyAdd(fondoApertEsp, totalExternosIntegrados), totalExternosPendientes);
  // salidas del fondo de cambio pendientes de devolver
  const pendientesApertura = activeMoves.filter(m => m.sourceType === "apertura" && m.regularizationStatus === "por_regularizar");
  const totalPendienteApertura = moneySum(pendientesApertura.map(m => m.amount));
  // totalEsperado: arqueo operacional EFE (sin apertura) + verificaciones digitales
  const totalEsperado   = moneySum([arqueoOperacional, sessionStats.yape, sessionStats.tarjeta]);
  const contadoFondoNum = numericValue(contadoFondo);
  const contadoEfeNum   = numericValue(contadoEfe);
  const contadoYapeNum  = numericValue(contadoYape);
  const contadoTarNum   = numericValue(contadoTar);
  const contadoTotal   = moneySum([contadoEfeNum, contadoYapeNum, contadoTarNum]);
  const diferencia     = moneySub(contadoTotal, totalEsperado);
  const fondoContadoValue = safeCalc(contadoFondo);
  const fondoContadoValido = fondoContadoValue !== null && fondoContadoValue >= 0;
  const diferenciaFondo = fondoContadoValido ? moneySub(fondoContadoValue, fondoEsperado) : null;
  const requiereMotivoFondo = diferenciaFondo !== null && !moneyIsZero(diferenciaFondo);
  const canContinueToCaja = fondoContadoValido && (!requiereMotivoFondo || motivoFondo.trim().length >= MIN_MOTIVO_LEN);
  const progresoCierre: Array<{ label: string; estado: "activo" | "completado" | "pendiente" }> = closingPhase === "none"
    ? []
    : [
        {
          label: "Arqueo Fondo de Cambio",
          estado: closingPhase === "fondo" ? "activo" : "completado",
        },
        {
          label: "Arqueo de Caja",
          estado: closingPhase === "fondo"
            ? "pendiente"
            : cajaStage === "cierre"
              ? "completado"
              : "activo",
        },
        {
          label: "Confirmar Cierre",
          estado: closingPhase === "caja" && cajaStage === "cierre" ? "activo" : "pendiente",
        },
      ];
  const pasosCaja = [
    { key: "conteo" as const, label: "Conteo", color: "#2154d8" },
    { key: "validacion" as const, label: "Validación", color: "#d97706" },
    { key: "comparacion" as const, label: "Comparación", color: "#16a34a" },
    { key: "cierre" as const, label: "Cierre", color: "#C05050" },
  ];
  const currentIndex = pasosCaja.findIndex(p => p.key === cajaStage);
  const contadoValid   = contadoEfe !== "";
  const canClose       = moneyGt(contadoTotal, 0) || zeroMotive !== "";

  // ── handlers ──────────────────────────────────────────────────

  function handleOpen() {
    if (!selectedBox) return;
    const amt = parseFloat(aperturaInput);
    if (isNaN(amt) || amt < 0) return;

    if (openingMode === "exceptional") {
      if (ctgPin !== configuredCtgPin) { setCtgPinError(true); return; }
      if (!ctgJustif.trim()) return;
      // Marcar caja principal como omitida + abrir contingente excepcionalmente
      const primaryCode = selectedBox.type === "contingencia"
        ? selectedBox.code[0] + "00"          // 150 → "100"
        : selectedBox.code.slice(0, 2) + "0"; // 101 → "100"
      openCashSession(selectedBox.code, amt, ctgJustif.trim(), aperturaRefOp.trim() || undefined, [primaryCode]);
    } else if (openingMode === "contingency") {
      if (!ctgJustif.trim() || ctgJustif.trim().length < MIN_MOTIVO_LEN) return;
      openCashSession(selectedBox.code, amt, ctgJustif.trim(), aperturaRefOp.trim() || undefined);
    } else {
      // normal — sin autorización adicional
      if (!selectedBox.available) return;
      openCashSession(selectedBox.code, amt, aperturaMotivo.trim() || undefined, aperturaRefOp.trim() || undefined);
    }
    loadSessionHistory().then(setSessionHistory);
    onOpened?.();
  }

  function openEditApertura() {
    setEditAperturaInput(apertura.toFixed(2));
    setEditMotivo(sessionMotivo ?? "");
    setEditObservacion(sessionObservacion ?? "");
    setEditRefOp(sessionRefOp ?? "");
    setEditingApertura(true);
  }

  function handleSaveCorrection() {
    if (!canCorrectApertura) return;
    const amt = parseFloat(editAperturaInput) || 0;
    correctAperturaData(
      amt,
      editMotivo.trim() || undefined,
      editObservacion.trim() || undefined,
      editRefOp.trim() || undefined,
    );
    setEditingApertura(false);
    showNotice("Datos de apertura corregidos");
  }

  function cancelEditApertura() {
    setEditingApertura(false);
  }

  function handleContinueToCaja() {
    if (!canContinueToCaja || fondoContadoValue === null || diferenciaFondo === null) return;
    setContadoFondo(fondoContadoValue.toFixed(2));
    if (moneyIsZero(diferenciaFondo)) {
      fondoDiferenciaFinal.current = 0;
      fondoMotivoFinal.current = "";
    } else {
      fondoDiferenciaFinal.current = diferenciaFondo;
      fondoMotivoFinal.current = motivoFondo.trim();
    }
    setClosingStage(2);
  }

  function handleAddVendido() {
    if (!canSubmitVendido) return;
    const amt = vendidoTotalAmt;
    const move = addCashMove(vendidoMoveType, amt, vendidoMotivo.trim(), "vendido", 0, amt, undefined);
    setLastVendidoMove(move);
    setVendidoAmount(""); setVendidoMotivo("");
    showNotice(`${vendidoMoveType === "ingreso" ? "Ingreso" : "Egreso"} registrado · S/ ${amt.toFixed(2)}`);
    setTimeout(() => vendidoAmountRef.current?.focus(), 10);
  }

  function handleAddFondo() {
    if (!canAddFondo || fondoSubTab !== "retiro") return;
    const amt = fondoTotalAmt;
    const move = addCashMove("egreso", amt, fondoMotivo.trim(), "apertura", amt, 0, undefined, undefined, "por_regularizar");
    setLastFondoMove(move);
    setFondoAmount(""); setFondoMotivo(""); setShowFondoMotivoSugerencias(false);
    showNotice(`Retiro del fondo registrado · S/ ${amt.toFixed(2)}`);
    setTimeout(() => fondoAmountRef.current?.focus(), 10);
  }

  function handleReintegro() {
    const original = cashMoves.find(m => m.id === reintegroTargetId);
    if (!original) return;
    const amt = parseFloat(reintegroAmount) || 0;
    if (amt <= 0 || reintegroMotivo.trim().length < MIN_MOTIVO_LEN) return;
    const move = addCashMove("ingreso", amt, reintegroMotivo.trim(), "apertura", amt, 0, undefined, original.id);
    if (moneyGte(amt, original.amount)) updateCashMove(original.id, "regularizado", "reposicion");
    setLastFondoMove(move);
    setReintegroTargetId(null); setReintegroAmount(""); setReintegroMotivo("");
    showNotice(`Reintegro registrado · S/ ${amt.toFixed(2)}`);
  }

  function handleAddPrestado() {
    if (!canAddPrestado) return;
    const move = addCashMove("ingreso", prestadoTotalAmt, prestadoMotivo.trim(), "externo", 0, 0, undefined, undefined, "por_regularizar");
    setLastFondoMove(move);
    setPrestadoAmount(""); setPrestadoMotivo(""); setShowPrestadoMotivoSugerencias(false);
    showNotice(`Préstamo recibido registrado · S/ ${prestadoTotalAmt.toFixed(2)}`);
    setTimeout(() => prestadoAmountRef.current?.focus(), 10);
  }

  function handleDevolver() {
    const original = cashMoves.find(m => m.id === devolverTargetId);
    if (!original) return;
    if (devolverMotivo.trim().length < MIN_MOTIVO_LEN) return;
    // Egreso de auditoría — fromApertura/fromVendido=0 para no afectar fondoApertEsp
    const move = addCashMove("egreso", original.amount, devolverMotivo.trim(), "externo", 0, 0, undefined, original.id);
    updateCashMove(original.id, "regularizado", "reposicion");
    setLastFondoMove(move);
    setDevolverTargetId(null); setDevolverMotivo("");
    showNotice(`Devolución registrada · S/ ${original.amount.toFixed(2)}`);
  }

  async function handlePrintVoucher(move: CashMove) {
    const ts = new Date(move.timestamp);
    const p  = (n: number) => String(n).padStart(2, "0");
    const data: VoucherMoveData = {
      businessName: loadBusinessConfig().nombreComercial,
      moveType:     move.type,
      sourceLabel:  move.refId ? "REPOSICIÓN" : undefined,
      amount:       move.amount,
      motivo:       move.motivo,
      observacion:  move.observacion,
      operator:     move.operator,
      cashBoxCode:  move.cashBoxCode,
      terminal:     move.terminal,
      dateTime:     `${p(ts.getDate())}/${p(ts.getMonth() + 1)}/${ts.getFullYear()} ${p(ts.getHours())}:${p(ts.getMinutes())}`,
    };
    try {
      await printCashMoveVoucherThermal("TIQUE", data);
    } catch {
      printCashMoveVoucher(data);
    }
  }

  async function handleConfirmClose() {
    const now = new Date();
    const p   = (n: number) => String(n).padStart(2, "0");
    const arqueo: ArqueoData = {
      businessName:     loadBusinessConfig().nombreComercial,
      alias:            loadBusinessConfig().alias,
      cashBoxCode:      activeBox?.code ?? "?",
      operator,
      terminal,
      dateTime:         `${p(now.getDate())}/${p(now.getMonth()+1)}/${now.getFullYear()} ${p(now.getHours())}:${p(now.getMinutes())}`,
      apertura,
      ingresosTotal,
      egresosTotal,
      totalVentas:      ventasDescomp,
      salesCount:       sessionStats.count,
      efectivoEsperado: arqueoOperacional,
      contadoEfe:       contadoEfeNum,
      contadoYape:      contadoYapeNum,
      contadoTar:       contadoTarNum,
      contadoTotal,
      diferencia,
      observations:     observations.trim() || undefined,
      zeroMotive:       (moneyIsZero(contadoTotal) && zeroMotive) ? zeroMotive : undefined,
      sistemaEsperado: {
        efe:     arqueoOperacional,
        yape:    sessionStats.yape,
        tarjeta: sessionStats.tarjeta,
        total:   totalEsperado,
      },
    };
    // Persistir snapshot del arqueo antes de destruir la sesión — permite reimprimir si el print falla
    try { localStorage.setItem("disateq.pos.lastArqueo", JSON.stringify(arqueo)); } catch { /* quota */ }
    setLastArqueo(arqueo);
    const closeSid = await getCurrentSessionId();
    const closeSignal = moneyIsZero(diferencia) ? "ok" as const : "warn" as const;
    if (closeSid) {
      if (cierreAutorizado) {
        const pendingAuth = loadAuthorizations().find(
          a => a.sessionId === closeSid && a.type === "cierre_activo" && a.status === "emitida",
        );
        if (pendingAuth) markAuthorizationExecuted(pendingAuth.id, operatorName);
      }
    }
    closeCashSession();
    if (closeSid) {
      await actualizarSesionCajaCorrection(closeSid, closeSignal, null, JSON.stringify(arqueo));
      loadSessionHistory().then(setSessionHistory);
    }
    setClosingStage(0);
    setContadoEfe(""); setContadoYape(""); setContadoTar("");
    setValidatedAt(null); setObservations(""); setZeroMotive("");
    setCierreAutorizado(false);
    localStorage.removeItem("disateq:cash:ui:closingPhase");
    localStorage.removeItem("disateq:cash:ui:cajaStage");
    localStorage.removeItem("disateq:cash:ui:contado");
    if (closingStage >= 3) {
      setTimeout(() => {
        printArqueoThermal("TIQUE", arqueo).catch(() => printArqueo(arqueo));
      }, 120);
    }
  }

  // ── CTRL+INSERT: corregir apertura ────────────────────────
  useEffect(() => {
    if (!isOpen || closingStage !== 0 || !canCorrectApertura || editingApertura) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Insert" && e.ctrlKey) { e.preventDefault(); openEditApertura(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, closingStage, canCorrectApertura, editingApertura]);

  // ── keyboard shortcuts del flujo de cierre ─────────────────
  useEffect(() => {
    if (!isOpen || closingStage === 0) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Enter" && closingStage === 1 && canContinueToCaja) {
        e.preventDefault();
        handleContinueToCaja();
      } else if (e.key === "F9" && closingStage === 2 && contadoValid) {
        e.preventDefault();
        const eR = safeCalc(contadoEfe);  if (eR !== null && eR >= 0) setContadoEfe(eR.toFixed(2));
        const yR = safeCalc(contadoYape); if (yR !== null && yR >= 0) setContadoYape(yR.toFixed(2));
        const tR = safeCalc(contadoTar);  if (tR !== null && tR >= 0) setContadoTar(tR.toFixed(2));
        setValidatedAt(new Date().toISOString());
        setClosingStage(3);
      } else if (e.key === "F4" && (closingStage === 3 || closingStage === 4)) {
        e.preventDefault();
        setValidatedAt(null);
        setClosingStage(2);
      } else if (e.key === "F10" && closingStage === 3) {
        e.preventDefault();
        setClosingStage(4);
      } else if (e.key === "Enter" && e.ctrlKey && closingStage === 5) {
        e.preventDefault();
        handleConfirmClose();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, closingStage, contadoValid, canContinueToCaja, handleContinueToCaja]);

  // ── ENTER global: IR A CIERRE DE TURNO (footsheet RESUMEN) ──
  useEffect(() => {
    if (!isOpen || closingStage !== 0 || editingApertura) return;
    if (pendingCorrectionAuth && !acknowledgedAuthIds.has(pendingCorrectionAuth.id)) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Enter") return;
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "BUTTON") return;
      e.preventDefault();
      setClosingStage(1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, closingStage, editingApertura, pendingCorrectionAuth, acknowledgedAuthIds]);

  // Refresca historial al volver a Gestión Turno desde Corregir arqueo
  useEffect(() => {
    if (cashSubView === "turno") {
      loadSessionHistory().then(setSessionHistory);
      setAuthRefresh(v => v + 1);
    }
  }, [cashSubView]);

  // ── sub-view routing ─────────────────────────────────────────

  if (cashSubView === "supervision-caja") return (
    <SupervisionCajaWorkspace
      onAutorizarCierre={() => {
        setCierreAutorizado(true);
        onCashSubViewChange?.("turno");
      }}
    />
  );

  // ── render ────────────────────────────────────────────────────

  return (
    <section className="flex min-h-0 flex-1 gap-2">
      <PinAutorizacionModal />

      {/* ── LEFT ── */}
      <div className="flex flex-[3] shrink-0 flex-col gap-2">

        {/* Autorización supervisora pendiente — reemplaza la card de apertura/resumen mientras esté activa */}
        {closingStage === 0 && pendingCorrectionAuth && !acknowledgedAuthIds.has(pendingCorrectionAuth.id) ? (
          <AutorizacionEjecucionCard
            activeAuth={pendingCorrectionAuth}
            targetSession={targetSessionForAuth}
            operatorName={operatorName}
            onExecuted={handleCorrectionExecuted}
            onPostponed={handleCorrectionPostponed}
          />
        ) : isOpen ? editingApertura ? (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[#C59B6D]/50 bg-[#FDFCF9]">
            <div className="shrink-0 flex h-[42px] items-center gap-2 px-4 border-b bg-[#FFF5E6] border-[#C59B6D]/15">
              <Pencil size={13} strokeWidth={2} className="shrink-0 text-[#C59B6D]" />
              <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">
                CORREGIR FONDO DE CAMBIO
              </span>
              <button onClick={cancelEditApertura} className="ml-auto text-[#c0cad4] transition hover:text-[#374151]">
                <X size={12} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto flex flex-col gap-3 px-4 pt-3 pb-3">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">Fondo inicial S/</span>
                <input
                  autoFocus
                  type="number"
                  value={editAperturaInput}
                  onChange={e => setEditAperturaInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleSaveCorrection(); if (e.key === "Escape") cancelEditApertura(); }}
                  placeholder="0.00"
                  min="0" step="0.50"
                  className="w-full rounded-xl border border-[#e4e9f0] px-3 py-2 text-[18px] font-bold text-[#2F3E46] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
                />
              </div>
            </div>
            <div className="shrink-0 border-t border-[#e4e9f0] px-4 py-3">
              <button
                onClick={handleSaveCorrection}
                title="Tecla [Enter]"
                className="flex h-10 w-full items-center justify-center gap-1.5 rounded-md bg-[#45b356] px-4 text-[13px] font-semibold uppercase tracking-wider text-white transition hover:bg-[#35994a] active:scale-[0.98] focus:outline focus:outline-1 focus:outline-[#45b356]/60"
              >
                <CheckCircle size={14} strokeWidth={2} />
                Guardar corrección
              </button>
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[#C59B6D]/50 bg-[#FDFCF9]">
            <div className="shrink-0 flex h-[42px] items-center gap-2 px-4 border-b bg-[#FFF5E6] border-[#C59B6D]/15">
              {closingStage > 0
                ? <LogOut size={13} strokeWidth={2} className="shrink-0 text-[#C59B6D]" />
                : <Clock  size={13} strokeWidth={2} className="shrink-0 text-[#C59B6D]" />
              }
              <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">
                {closingStage > 0 ? "CIERRE DE TURNO" : "RESUMEN DEL TURNO"}
              </span>
              {closingStage > 0 && (
                <span className="ml-auto text-[9px] font-bold uppercase tracking-widest text-red-400">{closingStage}/5</span>
              )}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto flex flex-col gap-3 px-4 pt-3 pb-3">
            {closingStage > 0 && (
              <div className="flex flex-col gap-1 rounded-[20px] border border-[#C59B6D]/20 bg-white px-4 py-3.5">
                <p className="px-0.5 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-[#9aa6b8]">
                  PROGRESO
                </p>
                {progresoCierre.map(({ label, estado }, idx) => (
                  <div key={label} className="flex items-start gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                        estado === "completado" ? "bg-emerald-500 text-white" :
                        estado === "activo" ? "bg-[#2154d8] text-white" :
                        "bg-[#e2e8f0] text-[#9aa6b8]"
                      }`}>
                        {estado === "completado" ? <CheckCircle size={14} strokeWidth={2.5} /> : idx + 1}
                      </div>
                      {idx < progresoCierre.length - 1 && (
                        <div className={`w-[2px] flex-1 ${estado === "completado" ? "bg-emerald-300" : "bg-[#e2e8f0]"}`} style={{ minHeight: "20px" }} />
                      )}
                    </div>
                    <div className={`flex-1 pb-3 pt-0.5 text-[12px] font-semibold ${
                      estado === "activo" ? "text-[#2154d8]" :
                      estado === "completado" ? "text-emerald-600" : "text-[#9aa6b8]"
                    }`}>
                      {label}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#f4f7fb] ${
                closingStage > 0 ? "text-[#b91c1c]" : "text-emerald-600"
              }`}>
                {closingStage > 0 ? <LogOut size={20} strokeWidth={1.5} /> : <Clock size={20} strokeWidth={1.5} />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${closingStage > 0 ? "bg-red-400" : "bg-emerald-500"}`} />
                  <span className={`text-[12px] font-semibold uppercase tracking-wider ${closingStage > 0 ? "text-red-500" : "text-emerald-600"}`}>
                    {closingStage > 0 ? `CERRANDO TURNO · ${closingStage}/5` : "TURNO ABIERTO"}
                  </span>
                </div>
                <p className="mt-0.5 truncate pl-3 text-[11px] font-semibold text-[#374151]">
                  CAJA {activeBox?.code}
                </p>
              </div>
            </div>


            <div className="flex flex-col gap-2">
              <InfoRow label="Operador"     value={operatorName} />
              {openedAt && <InfoRow label="Fecha"    value={formatDate(openedAt)} />}
              {openedAt && <InfoRow label="Activo"   value={`${formatTime(openedAt)} · ${duration}`} accent />}
              <InfoRow label="Terminal"     value={terminal} />
              <InfoRow label="Fondo de cambio" value={`S/ ${apertura.toFixed(2)}`} />
              {closingStage === 0 && (
                <div className="-mx-1 mt-0.5">
                  <button
                    onClick={() => canCorrectApertura ? openEditApertura() : undefined}
                    disabled={!canCorrectApertura}
                    title={
                      canCorrectApertura
                        ? "Sujeta a turno sin operaciones · TECLA [Ctrl + Insert]"
                        : cashMoves.length > 0
                          ? "No disponible — ya hay movimientos registrados"
                          : sessionStats.count > 0
                            ? "No disponible — ya hay ventas realizadas"
                            : "No disponible — sujeta a turno sin operaciones"
                    }
                    className={`flex w-full items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-[10px] font-semibold transition ${
                      canCorrectApertura
                        ? "text-[#2154d8] hover:bg-[#f0f4ff] cursor-pointer"
                        : "text-[#c0cad4] cursor-not-allowed"
                    }`}
                  >
                    <Pencil size={10} strokeWidth={2} className="shrink-0" />
                    <span>Corregir fondo de cambio</span>
                  </button>
                </div>
              )}
              {sessionStats.count > 0 && closingStage === 0 && (() => {
                const { efe, yap, tar, mix } = sessionStats.byMethod;
                const breakdown = [
                  { key: "EFE", n: efe }, { key: "YAP", n: yap },
                  { key: "TAR", n: tar }, { key: "MIX", n: mix },
                ].filter(m => m.n > 0);
                const docEntries = Object.entries(sessionStats.docRanges).filter(([, r]) => r != null) as [string, NonNullable<typeof sessionStats.docRanges[string]>][];
                const fmt = (n: number) => String(n).padStart(6, "0");
                const docLabel: Record<string, string> = { nota: "Notas", boleta: "Boletas", factura: "Facturas", cotizacion: "Cotiza" };
                return (
                  <>
                    <InfoRow label="Operaciones" value={String(sessionStats.count)} />
                    {breakdown.length > 0 && (
                      <p className="text-right text-[10px] font-semibold tabular-nums text-[#9ca3af] -mt-1">
                        {breakdown.map((m, i) => (i > 0 ? ` · ${m.key} ${m.n}` : `${m.key} ${m.n}`)).join("")}
                      </p>
                    )}
                    {docEntries.map(([type, r]) => {
                      const range = r.count === 1
                        ? `${r.series}-${fmt(r.first)}`
                        : `${r.series}-${fmt(r.first)} → ${r.series}-${fmt(r.last)}`;
                      return <InfoRow key={type} label={`${docLabel[type] ?? type} (${r.count})`} value={range} />;
                    })}
                  </>
                );
              })()}

              {closingStage === 0 && (moneyGt(ingVendido, 0) || moneyGt(egVendido, 0)) && (
                <>
                  {moneyGt(ingVendido, 0) && <InfoRow label="Ingresos ↑" value={`S/ ${ingVendido.toFixed(2)}`} accent />}
                  {moneyGt(egVendido, 0)  && <InfoRow label="Egresos ↓"  value={`S/ ${egVendido.toFixed(2)}`}  red />}
                </>
              )}
            </div>
            </div>
            {closingStage === 0 && (
              <div className="shrink-0 px-4 py-3">
                <button
                  onClick={() => setClosingStage(1)}
                  title="Tecla [Enter]"
                  className="flex w-full items-center justify-center rounded-2xl bg-[#dc2626] py-3 text-[12px] font-bold uppercase tracking-widest text-white shadow-[0_4px_12px_rgba(220,38,38,0.28)] transition hover:bg-[#b91c1c] active:scale-[0.98]"
                >
                  {cierreAutorizado ? "CIERRE AUTORIZADO" : "IR A CIERRE DE TURNO"}
                </button>
              </div>
            )}
          </div>

        ) : (
          /* Pre-open: operator + apertura card */
          <div className={`flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border bg-[#FDFCF9] ${
            openingMode === "exceptional" ? "border-amber-300/60" : "border-[#C59B6D]/50"
          }`}>
            <div className={`shrink-0 flex h-[42px] items-center gap-2 px-4 border-b ${
              openingMode === "exceptional"
                ? "bg-amber-50 border-amber-200/60"
                : "bg-[#FFF5E6] border-[#C59B6D]/15"
            }`}>
              {openingMode === "exceptional"
                ? <AlertTriangle size={13} strokeWidth={2} className="shrink-0 text-amber-500" />
                : <LogIn         size={13} strokeWidth={2} className="shrink-0 text-[#C59B6D]" />
              }
              <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">
                {openingMode === "exceptional" ? "APERTURA ESPECIAL" : "APERTURA DE TURNO"}
              </span>
              {openingMode === "exceptional" && (
                <span className="ml-auto text-[9px] font-bold uppercase tracking-widest text-amber-600">PIN + MOTIVO</span>
              )}
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto flex flex-col gap-3 px-4 pt-3 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#f1f5f9] text-[#9ca3af]">
                <Clock size={20} strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <span className="text-[10.5px] font-bold uppercase tracking-widest text-[#9ca3af]">SIN TURNO OPERATIVO</span>
                <p className="mt-0.5 truncate text-[12px] font-semibold text-[#374151]">
                  {selectedBox ? `CAJA ${selectedBox.code} · ${operatorName}` : "Sin caja seleccionada"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">Fondo de cambio S/</span>
                <Helper text="Dinero que pones en el cajón para dar vueltos. Se separa del dinero de ventas." />
              </div>
              <input
                ref={aperturaRef}
                autoFocus
                type="number"
                value={aperturaInput}
                onChange={e => setAperturaInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && canOpen) { e.preventDefault(); handleOpen(); }
                }}
                placeholder="0.00"
                min="0"
                step="0.50"
                className={`w-full rounded-xl border px-3.5 py-2.5 text-[20px] font-bold text-[#2F3E46] outline-none placeholder:text-[#d1d9e1] transition focus:ring-2 focus:ring-[#2154d8]/10 ${
                  aperturaInput.trim() === "" ? "border-[#e4e9f0]" : "border-[#2154d8]/40 focus:border-[#2154d8]"
                }`}
              />
              {aperturaInput.trim() === "" && (
                <span className="inline-flex items-center gap-1.5 self-start rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                  Requerido · 0.00 es válido
                </span>
              )}
            </div>

            {/* ── Autorización: CONTINGENCIA NORMAL (motivo solo, sin PIN) ── */}
            {openingMode === "contingency" && selectedBox && (
              <div className="flex flex-col gap-2 rounded-xl border border-orange-200 bg-[#fffbf0] px-3.5 py-3">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle size={12} strokeWidth={2.5} className="text-orange-500 shrink-0" />
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-orange-600">CAJA DE RESPALDO</span>
                </div>
                <p className="text-[10px] text-orange-600/80 -mt-1">
                  Caja {prereqCode(selectedBox)} cerrada — motivo obligatorio para continuar.
                </p>
                <input
                  type="text"
                  value={ctgJustif}
                  onChange={e => setCtgJustif(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && canOpen) handleOpen(); }}
                  placeholder="Motivo para usar esta caja..."
                  maxLength={200}
                  className="w-full rounded-xl border border-[#e4e9f0] px-3 py-2 text-[12px] text-[#374151] outline-none placeholder:text-[#d1d9e1] focus:border-[#d97706] focus:ring-2 focus:ring-amber-300/20"
                />
                {ctgJustif.trim().length > 0 && ctgJustif.trim().length < MIN_MOTIVO_LEN && (
                  <p className="text-[10px] font-semibold text-red-500">Mínimo {MIN_MOTIVO_LEN} caracteres</p>
                )}
              </div>
            )}

            {/* ── Autorización: APERTURA EXCEPCIONAL (PIN + motivo) ── */}
            {openingMode === "exceptional" && selectedBox && (
              <div className="flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50/60 px-3.5 py-3">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle size={12} strokeWidth={2.5} className="text-red-500 shrink-0" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-red-600">APERTURA EXCEPCIONAL</span>
                </div>
                <p className="text-[10px] text-red-600/80 -mt-1">
                  La caja principal (CAJA {prereqCode(selectedBox)}) no fue usada hoy.
                  Se omitirá del ciclo diario. Requiere PIN + motivo.
                </p>
                <input
                  type="password"
                  value={ctgPin}
                  onChange={e => { setCtgPin(e.target.value); setCtgPinError(false); }}
                  placeholder="PIN de autorización"
                  maxLength={8}
                  className={`w-full rounded-xl border px-3 py-2 text-[13px] font-bold tracking-[0.3em] text-[#2F3E46] outline-none placeholder:font-normal placeholder:tracking-normal ${
                    ctgPinError ? "border-red-400 focus:ring-red-300/20" : "border-[#e4e9f0] focus:border-red-400"
                  } focus:ring-2`}
                />
                {ctgPinError && <p className="text-[10px] text-red-500 font-semibold">PIN incorrecto</p>}
                <input
                  type="text"
                  value={ctgJustif}
                  onChange={e => setCtgJustif(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && canOpen) handleOpen(); }}
                  placeholder="Motivo obligatorio para apertura especial..."
                  maxLength={200}
                  className="w-full rounded-xl border border-[#e4e9f0] px-3 py-2 text-[12px] text-[#374151] outline-none placeholder:text-[#d1d9e1] focus:border-red-300 focus:ring-2 focus:ring-red-200/30"
                />
                {ctgJustif.trim().length > 0 && ctgJustif.trim().length < MIN_MOTIVO_LEN && (
                  <p className="text-[10px] font-semibold text-red-500">Mínimo {MIN_MOTIVO_LEN} caracteres</p>
                )}
              </div>
            )}
            </div>
            <div className="shrink-0 px-4 py-3">
              <button
                onClick={handleOpen}
                disabled={!canOpen}
                title="Tecla [Enter]"
                className={`flex h-10 w-full items-center justify-center gap-1.5 rounded-md px-4 text-[13px] font-semibold uppercase tracking-wider transition focus:outline focus:outline-1 ${
                  openingMode === "exceptional"
                    ? canOpen
                      ? "bg-amber-600 text-white hover:bg-amber-700 active:scale-[0.98] focus:outline-amber-500/60"
                      : "cursor-not-allowed bg-amber-600/40 text-white/60"
                    : canOpen
                      ? "bg-[#45b356] text-white hover:bg-[#35994a] active:scale-[0.98] focus:outline-[#45b356]/60"
                      : "cursor-not-allowed bg-[#45b356]/[0.15] text-[#45b356]/50"
                }`}
              >
                <LogIn size={14} strokeWidth={2} />
                {openingMode === "exceptional" ? "Aperturar excepcionalmente" : "Aperturar"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── RIGHT ── */}
      {!isOpen ? (
        <>

          {/* CENTER: CAJAS DISPONIBLES — ancho fijo */}
          <div className="flex flex-[3] shrink-0 flex-col overflow-hidden rounded-[28px] border border-[#C59B6D]/50 bg-[#FDFCF9]">
            <div className="shrink-0 flex h-[42px] items-center gap-2 px-4 bg-[#FFF5E6] border-b border-[#C59B6D]/15">
              <Monitor size={13} strokeWidth={2} className="shrink-0 text-[#C59B6D]" />
              <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">CAJAS DISPONIBLES</span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-3">
              <div className="mb-1.5 px-1">
                <p className="text-[11px] font-semibold text-[#6b7280]">{operatorFullName}</p>
              </div>
              <div className="flex flex-col gap-0.5">
                {operatorBoxes.map(box => (
                  <BoxRow
                    key={box.code}
                    box={box}
                    isActive={false}
                    isSelected={selectedCode === box.code}
                    onSelect={() => {
                      if (box.available) {
                        setSelectedCode(box.code);
                        setCtgPin(""); setCtgJustif(""); setCtgPinError(false);
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: ESTADO DE APERTURAS Y CIERRES — worksheet completa */}
          {(() => {
            const fmtTime = (iso: string) =>
              new Date(iso).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
            const fmtDay = (iso: string) => {
              const d = new Date(iso);
              return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`;
            };
            const historialVisible = esVEN
              ? sessionHistory.filter(s => s.operator === operatorName)
              : sessionHistory;
            const blockEntries = historialVisible
              .filter(e => e.boxCode[0] === operatorBlockPrefix)
              .slice(0, 20);
            // Para entradas antiguas sin arqueo guardado, usar lastArqueo si coincide la caja
            const resolveArqueo = (e: (typeof blockEntries)[number]) =>
              e.arqueo ?? (lastArqueo && lastArqueo.cashBoxCode === e.boxCode && e.closedAt ? lastArqueo : null);
            return (
              <div className="flex min-h-0 flex-[4] shrink-0 flex-col overflow-hidden rounded-[28px] border border-[#C59B6D]/30 bg-[#FDFCF9]">

                {/* Header */}
                <div className="shrink-0 flex h-[42px] items-center gap-2 px-4 bg-[#FFF5E6] border-b border-[#C59B6D]/15">
                  <ClipboardList size={13} strokeWidth={2} className="shrink-0 text-[#C59B6D]" />
                  <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">APERTURAS Y CIERRES ANTERIORES</span>
                </div>

                {blockEntries.length === 0 ? (

                  /* Empty state */
                  <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
                    <ClipboardList size={28} strokeWidth={1.2} className="text-[#d1d5db]" />
                    <p className="text-[11px] font-semibold text-[#9ca3af]">Sin aperturas ni cierres en este bloque</p>
                    <p className="text-[10px] text-[#c0c8d4]">Las sesiones aparecerán aquí al cerrar el primer turno</p>
                  </div>

                ) : (

                  <div className="min-h-0 flex-1 overflow-y-auto">

                    {/* Cabecera de columnas */}
                    <div className="sticky top-0 z-10 grid grid-cols-[52px_1fr_110px_72px_82px_32px] gap-x-3 border-b border-[#f0f4f8] bg-[#F8FAFB] px-4 py-2">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[#9ca3af]">Caja</span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[#9ca3af]">Función</span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[#9ca3af]">Apertura</span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[#9ca3af]">Cierre</span>
                      <span className="text-[9px] font-bold uppercase tracking-widest text-[#9ca3af]">Estado</span>
                      <span />
                    </div>

                    {/* Filas */}
                    <div className="flex flex-col divide-y divide-[#f4f6f9]">
                      {blockEntries.map(e => (
                        <div
                          key={e.id}
                          className="grid grid-cols-[52px_1fr_110px_72px_82px_32px] items-center gap-x-3 px-4 py-2.5 hover:bg-[#f8fafc] transition-colors"
                        >
                          <span className="text-[11px] font-bold tabular-nums text-[#C59B6D]">C{e.boxCode}</span>
                          <span className="truncate text-[10.5px] font-semibold text-[#374151]">{e.boxLabel}</span>
                          <span className="text-[10.5px] tabular-nums text-[#6b7280]">
                            {fmtDay(e.openedAt)} {fmtTime(e.openedAt)}
                          </span>
                          <span className="text-[10.5px] tabular-nums text-[#6b7280]">
                            {e.closedAt ? `→ ${fmtTime(e.closedAt)}` : <span className="text-[#d1d5db]">—</span>}
                          </span>
                          <div className="flex items-center gap-1 justify-start">
                            {e.closeSignal === "ok"  && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700">
                                ✓ correcto
                              </span>
                            )}
                            {e.closeSignal === "warn" && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-600">
                                ⚠ revisar
                              </span>
                            )}
                            {e.closeSignal === null && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#f4f6f9] px-2 py-0.5 text-[9px] font-semibold text-[#9ca3af]">
                                ~ pendiente
                              </span>
                            )}
                            {e.correction && (() => {
                              const c = e.correction;
                              const tipo: Record<string, string> = {
                                regularizar_cierre:    "Cierre regularizado",
                                cierre_extemporaneo:   "Cierre extemporáneo",
                                documentar_diferencia: "Diferencia documentada",
                                correccion_apertura:   "Apertura corregida",
                              };
                              const tip = `${tipo[c.accion] ?? c.accion} · ${c.correctedBy} · ${fmtDay(c.correctedAt)} ${fmtTime(c.correctedAt)}${c.motivo ? ` · ${c.motivo}` : ""}${c.accion === "cierre_extemporaneo" && c.fechaOperacional ? ` · Fecha real: ${fmtDay(c.fechaOperacional)} ${fmtTime(c.fechaOperacional)}` : ""}`;
                              return (
                                <span
                                  title={tip}
                                  className="inline-flex items-center gap-1 rounded-full bg-[#EEF3FD] px-2 py-0.5 text-[9px] font-bold text-[#2154d8] cursor-help"
                                >
                                  ✎ corregido
                                </span>
                              );
                            })()}
                          </div>
                          <div className="flex justify-end">
                            {(() => {
                              const arq = resolveArqueo(e);
                              return arq ? (
                                <button
                                  onClick={() => printArqueoThermal("TIQUE", arq).catch(() => printArqueo(arq))}
                                  title="Reimprimir arqueo"
                                  className="flex h-6 w-6 items-center justify-center rounded-md text-[#c0cad4] transition hover:bg-[#f0f4f8] hover:text-[#374151]"
                                >
                                  <Printer size={12} strokeWidth={2} />
                                </button>
                              ) : null;
                            })()}
                          </div>
                        </div>
                      ))}
                    </div>

                  </div>
                )}

              </div>
            );
          })()}

        </>

      ) : closingStage > 0 ? (

        <>

          {/* ── SHEET 2: ARQUEO FONDO DE CAMBIO (30%) ── */}
          <div className="flex min-h-0 flex-[3] shrink-0 flex-col overflow-hidden rounded-[28px] border border-[#C59B6D]/50 bg-[#FDFCF9]">
            <div className="shrink-0 flex h-[42px] items-center gap-2 px-4 bg-[#FFF5E6] border-b border-[#C59B6D]/15">
              <ListChecks size={13} strokeWidth={2} className="shrink-0 text-[#C59B6D]" />
              <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">
                ARQUEO FONDO DE CAMBIO
              </span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-3 flex flex-col gap-3">

              {/* ── STAGE 1: FONDO DE CAMBIO ── */}
              {closingStage === 1 && (
                <>
                  {/* 1. Desglose fondo */}
                  <div className="flex flex-col divide-y divide-[#f1f5f9] rounded-xl border border-[#e4e9f0] bg-white overflow-hidden">
                    <div className="flex justify-between items-center px-3.5 py-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">FONDO DE CAMBIO INICIAL</span>
                      <span className="text-[12px] font-bold tabular-nums text-[#374151]">S/ {apertura.toFixed(2)}</span>
                    </div>
                    {moneyGt(totalPendienteApertura, 0) && (
                      <div className="flex justify-between items-center px-3.5 py-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-600">SALIDAS PENDIENTES</span>
                        <span className="text-[12px] font-bold tabular-nums text-amber-600">−S/ {totalPendienteApertura.toFixed(2)}</span>
                      </div>
                    )}
                    {moneyGt(totalExternosIntegrados, 0) && (
                      <div className="flex justify-between items-center px-3.5 py-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#2154d8]">PRÉSTAMOS INTEGRADOS</span>
                        <span className="text-[12px] font-bold tabular-nums text-[#2154d8]">+S/ {totalExternosIntegrados.toFixed(2)}</span>
                      </div>
                    )}
                    {moneyGt(totalExternosPendientes, 0) && (
                      <div className="flex justify-between items-center px-3.5 py-2">
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700">PRÉSTAMOS · pdte. resolver</span>
                        <span className="text-[12px] font-bold tabular-nums text-emerald-700">+S/ {totalExternosPendientes.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center px-3.5 py-2.5 bg-[#f8fafd]">
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#374151]">FONDO ESPERADO</span>
                      <span className="text-[13px] font-bold tabular-nums text-[#374151]">S/ {fondoEsperado.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* 2. Pendientes unificados — salidas + préstamos */}
                  {(pendientesApertura.length > 0 || externosPendientes.length > 0) && (
                    <div className="flex flex-col rounded-xl border border-[#e4e9f0] bg-[#fafbfc] overflow-hidden">
                      <div className="flex items-center gap-1.5 px-3.5 py-2 border-b border-[#f0f4f8] bg-white">
                        <AlertTriangle size={10} strokeWidth={2} className="shrink-0 text-[#9ca3af]" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6b7280]">Pendientes del fondo</span>
                      </div>

                      {/* Salidas pendientes de reintegro */}
                      {pendientesApertura.map(m => {
                        const ts  = new Date(m.timestamp);
                        const hm  = `${String(ts.getHours()).padStart(2,"0")}:${String(ts.getMinutes()).padStart(2,"0")}`;
                        const isT = reintegroTargetId === m.id;
                        return (
                          <div key={m.id} className="flex flex-col border-b border-[#f0f4f8] last:border-0">
                            <div className="flex items-center gap-2 px-3.5 py-2">
                              <span className="shrink-0 text-[9px] tabular-nums font-bold text-amber-600 w-[30px]">{hm}</span>
                              <span className="shrink-0 text-[11px] font-bold text-amber-500">↓</span>
                              <p className="flex-1 min-w-0 text-[10px] font-semibold text-[#374151] truncate">{m.motivo}</p>
                              <span className="shrink-0 text-[11px] font-bold tabular-nums text-amber-600">S/ {m.amount.toFixed(2)}</span>
                              {!isT && (
                                <button
                                  onClick={() => { setReintegroTargetId(m.id); setReintegroAmount(m.amount.toFixed(2)); setReintegroMotivo(`Reintegro: ${m.motivo}`); setTimeout(() => reintegroAmountRef.current?.focus(), 50); }}
                                  className="shrink-0 rounded-lg bg-amber-500 px-2.5 py-1 text-[9px] font-bold uppercase text-white hover:bg-amber-600 active:scale-95 transition"
                                >Reintegrar</button>
                              )}
                            </div>
                            {isT && (
                              <div className="flex flex-col gap-1.5 px-3.5 pb-2.5">
                                <div className="flex gap-2">
                                  <input ref={reintegroAmountRef} type="number" min="0" step="0.01" value={reintegroAmount} onChange={e => setReintegroAmount(e.target.value)} placeholder="Monto"
                                    className="w-24 rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-[13px] font-bold tabular-nums text-[#2F3E46] outline-none focus:border-amber-500" />
                                  <input type="text" value={reintegroMotivo} onChange={e => setReintegroMotivo(e.target.value)} placeholder="Motivo"
                                    className="flex-1 rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-[11px] text-[#374151] outline-none focus:border-amber-500" />
                                </div>
                                <div className="flex gap-2">
                                  <button onClick={() => { setReintegroTargetId(null); setReintegroAmount(""); setReintegroMotivo(""); }}
                                    className="flex-1 rounded-lg border border-amber-200 bg-white py-1 text-[9px] font-bold uppercase text-amber-600 hover:bg-amber-50 transition">Cancelar</button>
                                  <button onClick={handleReintegro} disabled={!(parseFloat(reintegroAmount) > 0 && reintegroMotivo.trim().length > 0)}
                                    className="flex-1 rounded-lg bg-amber-500 py-1 text-[9px] font-bold uppercase text-white hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition">Confirmar</button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Préstamos pendientes */}
                      {externosPendientes.map(m => {
                        const ts = new Date(m.timestamp);
                        const hm = `${String(ts.getHours()).padStart(2,"0")}:${String(ts.getMinutes()).padStart(2,"0")}`;
                        return (
                          <div key={m.id} className="flex items-center gap-2 px-3.5 py-2 border-b border-[#f0f4f8] last:border-0">
                            <span className="shrink-0 text-[9px] tabular-nums font-bold text-emerald-600 w-[30px]">{hm}</span>
                            <span className="shrink-0 text-[11px] font-bold text-emerald-500">↑</span>
                            <p className="flex-1 min-w-0 text-[10px] font-semibold text-[#374151] truncate">{m.motivo}</p>
                            <span className="shrink-0 text-[11px] font-bold tabular-nums text-emerald-600">S/ {m.amount.toFixed(2)}</span>
                            <button onClick={() => updateCashMove(m.id, "regularizado")}
                              className="shrink-0 rounded-lg bg-emerald-600 px-2.5 py-1 text-[9px] font-bold uppercase text-white hover:bg-emerald-700 active:scale-95 transition">Devolver</button>
                            <button onClick={() => updateCashMove(m.id, "regularizado", "integracion_fondo")}
                              className="shrink-0 rounded-lg border border-[#2154d8] bg-white px-2.5 py-1 text-[9px] font-bold uppercase text-[#2154d8] hover:bg-[#eff6ff] active:scale-95 transition">Al fondo</button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 3. Fondo contado */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">FONDO CONTADO S/</span>
                      <Helper text="Cuenta físicamente el dinero del cajón de vueltos. Sin incluir dinero de ventas." />
                    </div>
                    <input
                      ref={contadoFondoRef}
                      type="text" inputMode="decimal" value={contadoFondo}
                      onChange={e => setContadoFondo(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && canContinueToCaja) {
                          e.preventDefault(); e.stopPropagation();
                          handleContinueToCaja();
                        }
                      }}
                      onBlur={() => { if (hasExpr(contadoFondo)) { const r = safeCalc(contadoFondo); if (r !== null && r >= 0) setContadoFondo(r.toFixed(2)); } }}
                      placeholder="0.00"
                      className="w-full rounded-xl border border-[#2154d8]/30 px-3 py-2 text-[18px] font-bold text-[#2F3E46] outline-none placeholder:text-[#d1d9e1] tabular-nums focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
                    />
                    {diferenciaFondo !== null && (
                      moneyIsZero(diferenciaFondo) ? (
                        <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                          <CheckCircle size={11} className="shrink-0 text-emerald-500" />
                          <span className="text-[10px] font-semibold text-emerald-700">
                            Fondo cuadrado
                          </span>
                        </div>
                      ) : (
                        <>
                          <div className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
                            diferenciaFondo > 0 ? "border-[#dbeafe] bg-[#eff6ff]" : "border-red-200 bg-[#fef2f2]"
                          }`}>
                            <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${
                              diferenciaFondo > 0 ? "text-[#2154d8]" : "text-red-600"
                            }`}>
                              {diferenciaFondo > 0 ? "SOBRANTE" : "FALTANTE"}
                            </span>
                            <span className={`text-[13px] font-bold tabular-nums ${
                              diferenciaFondo > 0 ? "text-[#2154d8]" : "text-red-600"
                            }`}>
                              S/ {Math.abs(diferenciaFondo).toFixed(2)}
                            </span>
                          </div>
                          <div className="space-y-1">
                            <label className="px-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[#9aa6b8]">
                              Motivo de la diferencia
                            </label>
                            <textarea
                              value={motivoFondo}
                              onChange={e => setMotivoFondo(e.target.value)}
                              placeholder="Indica el motivo para continuar..."
                              className="w-full resize-none rounded-xl border border-[#e2e8f0] px-3 py-2 text-[11px]"
                              rows={2}
                            />
                          </div>
                        </>
                      )
                    )}
                    <p className="text-[10px] text-[#9ca3af]">
                      <span className="font-mono bg-[#f1f5f9] px-1 rounded">ENTER</span> continuar al arqueo de caja
                    </p>
                  </div>
                </>
              )}

              {/* ── FONDO DE CAMBIO — resumen validado (solo lectura) ── */}
              {closingPhase === "caja" && (
                <>
                  <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-[#f0fdf4] px-3.5 py-2.5">
                    <CheckCircle size={15} className="text-emerald-500 shrink-0" />
                    <p className="text-[10.5px] font-bold uppercase tracking-wide text-emerald-700">
                      Fondo de cambio validado
                    </p>
                  </div>

                  <div className="flex flex-col divide-y divide-[#f1f5f9] rounded-xl border border-[#e4e9f0] bg-white overflow-hidden">
                    <div className="flex justify-between items-center px-3.5 py-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">FONDO ESPERADO</span>
                      <span className="text-[12px] font-bold tabular-nums text-[#374151]">S/ {fondoEsperado.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center px-3.5 py-2.5 bg-[#f8fafd]">
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#374151]">FONDO CONTADO</span>
                      <span className="text-[13px] font-bold tabular-nums text-[#374151]">S/ {contadoFondoNum.toFixed(2)}</span>
                    </div>
                  </div>

                  {fondoDiferenciaFinal.current === 0 || fondoDiferenciaFinal.current === null ? (
                    <div className="flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                      <CheckCircle size={11} className="shrink-0 text-emerald-500" />
                      <span className="text-[10px] font-semibold text-emerald-700">
                        Fondo cuadrado
                      </span>
                    </div>
                  ) : (
                    <>
                      <div className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
                        fondoDiferenciaFinal.current > 0 ? "border-[#dbeafe] bg-[#eff6ff]" : "border-red-200 bg-[#fef2f2]"
                      }`}>
                        <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${
                          fondoDiferenciaFinal.current > 0 ? "text-[#2154d8]" : "text-red-600"
                        }`}>
                          {fondoDiferenciaFinal.current > 0 ? "SOBRANTE" : "FALTANTE"}
                        </span>
                        <span className={`text-[13px] font-bold tabular-nums ${
                          fondoDiferenciaFinal.current > 0 ? "text-[#2154d8]" : "text-red-600"
                        }`}>
                          S/ {Math.abs(fondoDiferenciaFinal.current).toFixed(2)}
                        </span>
                      </div>
                      {fondoMotivoFinal.current && (
                        <div className="space-y-1">
                          <span className="px-0.5 text-[9px] font-bold uppercase tracking-[0.1em] text-[#9aa6b8]">
                            Motivo registrado
                          </span>
                          <p className="rounded-xl border border-[#e2e8f0] bg-[#fafbfc] px-3 py-2 text-[11px] text-[#374151]">
                            {fondoMotivoFinal.current}
                          </p>
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
            {closingStage === 1 && (
              <div className="shrink-0 flex flex-col gap-2 px-4 pb-4 pt-2">
                <button
                  onClick={handleContinueToCaja}
                  disabled={!canContinueToCaja}
                  className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[13px] font-bold uppercase tracking-widest transition ${
                    canContinueToCaja
                      ? "bg-[#45b356] text-white shadow-[0_4px_14px_rgba(69,179,86,0.24)] hover:bg-[#35994a] active:scale-[0.98]"
                      : "cursor-not-allowed bg-[#45b356]/[0.15] text-[#45b356]/50"
                  }`}
                >
                  CONTINUAR A ARQUEO DE CAJA
                  {canContinueToCaja && <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[9px] font-bold tracking-widest">ENTER</span>}
                </button>
                <button
                  onClick={() => setClosingStage(0)}
                  className="flex w-full items-center justify-center rounded-2xl border border-[#e4e9f0] bg-white py-2.5 text-[12px] font-semibold text-[#374151] hover:bg-[#f8fafd]"
                >
                  CANCELAR
                </button>
              </div>
            )}
          </div>

          {/* ── SHEET 3: ARQUEO CAJA · CIERRE DE TURNO (40%) ── */}
          <div className="flex min-h-0 flex-[4] shrink-0 flex-col overflow-hidden rounded-[28px] border border-[#C59B6D]/50 bg-[#FDFCF9]">
            <div className="shrink-0 flex h-[42px] items-center gap-2 px-4 bg-[#FFF5E6] border-b border-[#C59B6D]/15">
              <ListChecks size={13} strokeWidth={2} className="shrink-0 text-[#C59B6D]" />
              <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">
                ARQUEO CAJA · CIERRE DE TURNO
              </span>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-3 flex flex-col gap-3">
              {/* ── PLACEHOLDER: arqueo de caja pendiente ── */}
              {closingPhase === "fondo" && (
                <>
                  <div className="mb-2 flex items-center gap-1">
                    {pasosCaja.map((paso) => (
                      <div
                        key={paso.key}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-[#f4f5f7] py-1.5 text-[9.5px] font-bold uppercase tracking-[0.08em] text-[#9aa6b8]"
                      >
                        {paso.label}
                      </div>
                    ))}
                  </div>

                  <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
                    <ListChecks size={28} strokeWidth={1.2} className="text-[#d1d5db]" />
                    <p className="text-[11px] font-semibold text-[#9ca3af]">
                      Completa el arqueo de fondo de cambio para continuar
                    </p>
                    <p className="text-[10px] text-[#c0c8d4]">
                      El conteo de caja se habilitará al finalizar este paso
                    </p>
                  </div>
                </>
              )}

              {closingPhase === "caja" && (
                <div className="mb-2 flex items-center gap-1">
                  {pasosCaja.map((paso, i) => {
                    const estado = i < currentIndex ? "completado" : i === currentIndex ? "activo" : "pendiente";
                    return (
                      <div
                        key={paso.key}
                        className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-1.5 text-[9.5px] font-bold uppercase tracking-[0.08em] transition ${
                          estado === "activo" ? "text-white" :
                          estado === "completado" ? "" : "bg-[#f4f5f7] text-[#9aa6b8]"
                        }`}
                        style={
                          estado === "activo" ? { backgroundColor: paso.color } :
                          estado === "completado" ? { backgroundColor: `${paso.color}1f`, color: paso.color } : undefined
                        }
                      >
                        {estado === "completado" && <CheckCircle size={10} />}
                        {paso.label}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ── STAGE 2: CONTEO OPERACIONAL ── */}
              {closingStage === 2 && (
                <>
                  {/* Fondo validado en stage 1 */}
                  <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-[#f0fdf4] px-3.5 py-2">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600">Fondo de cambio validado</span>
                    </div>
                    <span className="text-[11px] font-bold tabular-nums text-emerald-700">S/ {contadoFondoNum.toFixed(2)}</span>
                  </div>

                  <p className="text-[11px] text-[#6b7280] leading-relaxed">
                    Cuenta el <strong className="text-[#374151]">efectivo de ventas</strong>, Yape y Tarjeta. El sistema compara con lo que debería haber.
                  </p>
                  <div className="flex flex-col gap-2">
                    {([
                      { label: "EFECTIVO",  value: contadoEfe,  set: setContadoEfe,  ref: contadoEfeRef,  nextRef: contadoYapeRef },
                      { label: "YAPE",      value: contadoYape, set: setContadoYape, ref: contadoYapeRef, nextRef: contadoTarRef  },
                      { label: "TARJETAS",  value: contadoTar,  set: setContadoTar,  ref: contadoTarRef,  nextRef: null          },
                    ] as const).map(({ label, value, set, ref, nextRef }) => {
                      const exprResult = hasExpr(value) ? safeCalc(value) : null;
                      return (
                        <div key={label} className="flex flex-col gap-0.5">
                          <div className="flex items-center gap-2.5">
                            <span className="w-[64px] shrink-0 text-[10px] font-bold uppercase tracking-[0.13em] text-[#9ca3af]">{label}</span>
                            {label === "EFECTIVO" && <Helper text="Efectivo de ventas del turno. Sin incluir el fondo de cambio." />}
                            <span className="shrink-0 text-[10px] font-bold text-[#b0bac8]">S/</span>
                            <input
                              ref={ref}
                              type="text"
                              inputMode="decimal"
                              value={value}
                              onChange={e => set(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  if (hasExpr(value)) {
                                    const r = safeCalc(value);
                                    if (r !== null && r >= 0) {
                                      set(r.toFixed(2));
                                      setTimeout(() => nextRef ? nextRef.current?.focus() : undefined, 10);
                                    }
                                  } else if (nextRef) {
                                    nextRef.current?.focus();
                                  }
                                } else if (e.key === "Escape") {
                                  set("");
                                }
                              }}
                              onBlur={() => {
                                if (hasExpr(value)) {
                                  const r = safeCalc(value);
                                  if (r !== null && r >= 0) set(r.toFixed(2));
                                }
                              }}
                              placeholder="0.00"
                              className={`flex-1 rounded-xl border px-3 py-2 text-[15px] font-bold text-[#2F3E46] outline-none placeholder:text-[#d1d9e1] tabular-nums transition ${
                                label === "EFECTIVO"
                                  ? "border-[#2154d8]/30 focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
                                  : "border-[#e4e9f0] focus:border-[#2154d8] focus:ring-1 focus:ring-[#2154d8]/10"
                              }`}
                            />
                          </div>
                          {exprResult !== null && (
                            <div className="pl-[74px]">
                              <span className="text-[9px] font-mono tabular-nums text-[#2154d8]">= {exprResult.toFixed(2)}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  {moneyGt(contadoTotal, 0) && (
                    <div className="flex justify-between items-center rounded-xl border border-[#e4e9f0] bg-white px-3.5 py-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">TOTAL CONTADO</span>
                      <span className="text-[13px] font-bold tabular-nums text-[#374151]">S/ {contadoTotal.toFixed(2)}</span>
                    </div>
                  )}
                  <p className="text-[10.5px] text-[#9ca3af]">
                    <span className="font-mono bg-[#f1f5f9] px-1 rounded">F9</span> guardar conteo ·{" "}
                    <span className="font-mono bg-[#f1f5f9] px-1 rounded">ENTER</span> avanza ·{" "}
                    <span className="font-mono bg-[#f1f5f9] px-1 rounded">200+50</span> suma
                  </p>
                </>
              )}

              {/* ── STAGE 3: VALIDACIÓN ── */}
              {closingStage === 3 && (
                <>
                  <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-[#f0fdf4] px-3.5 py-2.5">
                    <CheckCircle size={15} className="text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-[10.5px] font-bold uppercase tracking-wide text-emerald-700">CONTEO GUARDADO</p>
                      {validatedAt && (
                        <p className="text-[9px] tabular-nums text-emerald-600">
                          {new Date(validatedAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col divide-y divide-[#f1f5f9] rounded-xl border border-[#e4e9f0] bg-white overflow-hidden">
                    {/* Fondo apertura validado en stage 1 */}
                    <div className="flex justify-between items-center px-3.5 py-1.5 bg-[#f8fafd]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">FONDO DE CAMBIO</span>
                        <span className="text-[8px] text-[#c0cad4]">stage 1</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold tabular-nums text-[#374151]">S/ {contadoFondoNum.toFixed(2)}</span>
                        {moneyIsZero(moneySub(contadoFondoNum, fondoEsperado))
                          ? <span className="text-[9px] font-bold text-emerald-600">✓</span>
                          : <span className="text-[9px] font-bold text-red-500">≠{fondoEsperado.toFixed(2)}</span>
                        }
                      </div>
                    </div>
                    {[
                      { label: "EFECTIVO", val: contadoEfeNum  },
                      { label: "YAPE",     val: contadoYapeNum },
                      { label: "TARJETAS", val: contadoTarNum  },
                    ].map(({ label, val }) => (
                      <div key={label} className="flex justify-between items-center px-3.5 py-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">{label}</span>
                        <span className="text-[11px] font-semibold tabular-nums text-[#374151]">S/ {val.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center px-3.5 py-2 bg-[#f8fafd]">
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#374151]">TOTAL CONTADO</span>
                      <span className="text-[13px] font-bold tabular-nums text-[#374151]">S/ {contadoTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  <p className="text-[10.5px] text-[#9ca3af]">
                    Tecla <span className="font-mono bg-[#f1f5f9] px-1 rounded">F10</span> para comparar totales · <span className="font-mono bg-[#f1f5f9] px-1 rounded">F4</span> para recontar
                  </p>
                </>
              )}

              {/* ── STAGE 4: CONCILIACIÓN ── */}
              {closingStage === 4 && (
                <>
                  {validatedAt && (() => {
                    const vt = new Date(validatedAt);
                    const hm = `${String(vt.getHours()).padStart(2,"0")}:${String(vt.getMinutes()).padStart(2,"0")}`;
                    return (
                      <div className="flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2">
                        <CheckCircle size={11} strokeWidth={2} className="shrink-0 text-emerald-500" />
                        <span className="text-[10px] font-semibold text-emerald-700">
                          Conteos registrados a las {hm}
                        </span>
                      </div>
                    );
                  })()}
                  <p className="text-[11px] text-[#6b7280] leading-relaxed">
                    Revisa los totales y confirma el cierre del turno.
                  </p>

                  {/* Fondo apertura — resultado validación stage 1 */}
                  {(() => {
                    const diffFondo = moneySub(contadoFondoNum, fondoEsperado);
                    const fondoCuadrado = moneyIsZero(diffFondo);
                    return (
                      <div className={`flex items-center justify-between rounded-xl border px-3.5 py-2 ${
                        fondoCuadrado ? "border-[#e4e9f0] bg-[#f8fafd]" : "border-red-200 bg-[#fef2f2]"
                      }`}>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">Fondo de cambio</span>
                          <span className="ml-2 text-[8.5px] text-[#c0cad4]">esp. {fondoEsperado.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] font-semibold tabular-nums text-[#374151]">S/ {contadoFondoNum.toFixed(2)}</span>
                          {fondoCuadrado
                            ? <span className="text-[9px] font-bold text-emerald-600">✓</span>
                            : <span className="text-[9px] font-bold text-red-500">≠</span>
                          }
                        </div>
                      </div>
                    );
                  })()}

                  {/* Arqueo contado */}
                  <div className="flex flex-col divide-y divide-[#f1f5f9] rounded-xl border border-amber-200 bg-white overflow-hidden">
                    {[
                      { label: "EFECTIVO", val: contadoEfeNum  },
                      { label: "YAPE",     val: contadoYapeNum },
                      { label: "TARJETAS", val: contadoTarNum  },
                    ].map(({ label, val }) => (
                      <div key={label} className="flex items-center px-3.5 py-1.5 gap-2">
                        <span className="w-[68px] shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">{label}</span>
                        <span className="flex-1 text-right text-[11px] font-semibold tabular-nums text-[#374151]">S/ {val.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center px-3.5 py-2.5 bg-[#fffbf0]">
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#92400e]">TOTAL ARQUEO</span>
                      <span className="text-[14px] font-bold tabular-nums text-[#92400e]">S/ {contadoTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}

              {/* ── STAGE 5: CIERRE ── */}
              {closingStage === 5 && (
                <>
                  {/* Cierre en cero — evento operacional excepcional */}
                  {contadoTotal === 0 ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-[#fffbf0] px-3.5 py-2.5">
                        <AlertTriangle size={13} className="text-amber-500 shrink-0 mt-px" />
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-wide text-amber-700">CIERRE SIN MOVIMIENTO</p>
                          <p className="text-[10px] text-amber-600 mt-0.5 leading-snug">Evento operacional excepcional. Motivo requerido.</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">
                          Motivo <span className="text-amber-500">*</span>
                        </span>
                        {moneyIsZero(contadoTotal) && (
                          <p className="text-[10px] font-semibold text-amber-600 px-0.5">
                            Declaras S/ 0.00 en caja — indica el motivo para continuar
                          </p>
                        )}
                        <select
                          value={zeroMotive}
                          onChange={e => setZeroMotive(e.target.value)}
                          className="w-full rounded-xl border border-amber-200 bg-white px-3 py-2 text-[11px] font-semibold text-[#374151] outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-200/40"
                        >
                          <option value="">Seleccionar motivo...</option>
                          {["SIN OPERACIONES","SALIDA MÉDICA","EMERGENCIA","RETIRO AUTORIZADO","CAMBIO OPERADOR","CONTINGENCIA","OTRO"].map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-[#fef2f2] px-3.5 py-2.5">
                      <AlertTriangle size={13} className="text-red-500 shrink-0 mt-px" />
                      <p className="text-[10.5px] font-semibold text-[#b91c1c] leading-snug">
                        Esta acción finaliza el turno y no podrá revertirse.
                      </p>
                    </div>
                  )}

                  <div className="flex flex-col divide-y divide-[#f1f5f9] rounded-xl border border-[#e4e9f0] bg-white overflow-hidden">
                    <div className="flex justify-between items-center px-3.5 py-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">CAJA</span>
                      <span className="text-[11px] font-bold text-[#374151]">CAJA {activeBox?.code}</span>
                    </div>
                    <div className="flex justify-between items-center px-3.5 py-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">OPERADOR</span>
                      <span className="text-[11px] font-semibold text-[#374151]">{operatorName}</span>
                    </div>
                    {sessionStats.count > 0 && (
                      <div className="flex justify-between items-center px-3.5 py-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">VENTAS</span>
                        <span className="text-[11px] font-semibold tabular-nums text-[#374151]">{sessionStats.count} op.</span>
                      </div>
                    )}
                    <div className={`flex justify-between items-center px-3.5 py-2 ${contadoTotal > 0 ? "bg-[#f8fafd]" : "bg-[#fffbf0]"}`}>
                      <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#374151]">CONTEO TOTAL</span>
                      <span className={`text-[13px] font-bold tabular-nums ${contadoTotal > 0 ? "text-emerald-600" : "text-amber-600"}`}>
                        S/ {contadoTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">Observaciones (opcional)</span>
                    <textarea
                      value={observations}
                      onChange={e => setObservations(e.target.value)}
                      placeholder="Novedades del turno, incidencias..."
                      rows={2}
                      className="w-full resize-none rounded-xl border border-[#e4e9f0] px-3.5 py-2 text-[11.5px] text-[#374151] outline-none placeholder:text-[#c8d4e0] focus:border-red-300 focus:ring-2 focus:ring-red-200/30"
                    />
                  </div>
                </>
              )}

            </div>
            {closingPhase === "caja" && (
              <div className="shrink-0 flex flex-col gap-2 px-4 pb-4 pt-2">
                {closingStage === 2 ? (
                  <>
                    <button
                      onClick={() => {
                        if (!contadoValid) return;
                        const eR = safeCalc(contadoEfe);  if (eR !== null && eR >= 0) setContadoEfe(eR.toFixed(2));
                        const yR = safeCalc(contadoYape); if (yR !== null && yR >= 0) setContadoYape(yR.toFixed(2));
                        const tR = safeCalc(contadoTar);  if (tR !== null && tR >= 0) setContadoTar(tR.toFixed(2));
                        setValidatedAt(new Date().toISOString());
                        setClosingStage(3);
                      }}
                      disabled={!contadoValid}
                      className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[13px] font-bold uppercase tracking-widest transition ${
                        contadoValid
                          ? "bg-[#2154d8] text-white shadow-[0_4px_14px_rgba(33,84,216,0.24)] hover:bg-[#1a44be] active:scale-[0.98]"
                          : "cursor-not-allowed bg-[#2154d8]/[0.15] text-[#2154d8]/50"
                      }`}
                    >
                      GUARDAR CONTEO
                      <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[9px] font-bold tracking-widest">F9</span>
                    </button>
                    <button
                      onClick={() => setClosingStage(0)}
                      className="flex w-full items-center justify-center rounded-2xl border border-[#e4e9f0] bg-white py-2.5 text-[12px] font-semibold text-[#374151] hover:bg-[#f8fafd]"
                    >
                      CANCELAR
                    </button>
                  </>
                ) : closingStage === 3 ? (
                  <>
                    <button
                      onClick={() => setClosingStage(4)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#c2410c] py-3.5 text-[13px] font-bold uppercase tracking-widest text-white shadow-[0_4px_12px_rgba(194,65,12,0.24)] transition hover:bg-[#9a3412] active:scale-[0.98]"
                    >
                      COMPARAR TOTALES
                      <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[9px] font-bold tracking-widest">F10</span>
                    </button>
                    <button
                      onClick={() => { setValidatedAt(null); setClosingStage(2); }}
                      className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-[#e4e9f0] bg-white py-2.5 text-[12px] font-semibold text-[#374151] hover:bg-[#f8fafd]"
                    >
                      RECONTAR
                      <span className="rounded-md bg-[#f1f5f9] px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-[#9ca3af]">F4</span>
                    </button>
                  </>
                ) : closingStage === 4 ? (
                  <>
                    <button
                      onClick={() => setClosingStage(5)}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#b91c1c] py-3.5 text-[13px] font-bold uppercase tracking-widest text-white shadow-[0_4px_12px_rgba(185,28,28,0.20)] transition hover:bg-[#991b1b] active:scale-[0.98]"
                    >
                      <CheckCircle size={14} strokeWidth={2.5} />
                      CONFIRMAR CIERRE
                    </button>
                    <button
                      onClick={() => { setValidatedAt(null); setClosingStage(2); }}
                      className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-[#e4e9f0] bg-white py-2.5 text-[12px] font-semibold text-[#374151] hover:bg-[#f8fafd]"
                    >
                      RECONTAR
                      <span className="rounded-md bg-[#f1f5f9] px-1.5 py-0.5 text-[9px] font-bold tracking-widest text-[#9ca3af]">F4</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleConfirmClose}
                      disabled={!canClose}
                      className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[13px] font-bold uppercase tracking-widest transition ${
                        canClose
                          ? "bg-[#b91c1c] text-white shadow-[0_4px_12px_rgba(185,28,28,0.20)] hover:bg-[#991b1b] active:scale-[0.98]"
                          : "cursor-not-allowed bg-[#dc2626]/[0.15] text-[#dc2626]/50"
                      }`}
                    >
                      <CheckCircle size={14} strokeWidth={2.5} />
                      {cierreAutorizado ? "CIERRE AUTORIZADO" : "CERRAR TURNO"}
                      {canClose && <span className="rounded-md bg-white/20 px-1.5 py-0.5 text-[9px] font-bold tracking-widest">CTRL+↵</span>}
                    </button>
                    <button
                      onClick={() => setClosingStage(0)}
                      className="flex w-full items-center justify-center rounded-2xl border border-[#e4e9f0] bg-white py-2.5 text-[12px] font-semibold text-[#374151] hover:bg-[#f8fafd]"
                    >
                      CANCELAR
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </>

      ) : (

        /* MOVEMENTS + HISTORY — panels operacionales independientes */
        <>

          {/* ─── MOVEMENTS PANEL ─── */}
          <div className="flex min-h-0 flex-[3] shrink-0 flex-col overflow-hidden rounded-[28px] border border-[#C59B6D]/50 bg-[#FDFCF9]">

            {/* SheetHeader */}
            <div className="shrink-0 flex h-[42px] items-center gap-2 px-4 bg-[#FFF5E6] border-b border-[#C59B6D]/15">
              <Wallet size={13} strokeWidth={2} className="shrink-0 text-[#C59B6D]" />
              <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">MOVIMIENTOS</span>
            </div>

            {/* Tab switcher — fijo */}
            <div className="shrink-0 px-3 py-2 border-b border-[#e8edf3]">
              <div className="flex gap-px rounded-xl bg-[#f1f5f9] p-0.5">
                <button
                  onClick={() => setMovPanel("vendido")}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-[9px] py-1.5 text-[11px] font-bold uppercase tracking-wide transition ${
                    movPanel === "vendido" ? "bg-white text-[#374151] shadow-sm" : "text-[#9ca3af] hover:text-[#374151]"
                  }`}
                >
                  <ShoppingCart size={11} strokeWidth={2} />
                  <span title="Ingresos y egresos del dinero de ventas del turno.">CAJA DEL DÍA</span>
                </button>
                <button
                  onClick={() => setMovPanel("fondo")}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-[9px] py-1.5 text-[11px] font-bold uppercase tracking-wide transition ${
                    movPanel === "fondo" ? "bg-white text-[#374151] shadow-sm" : "text-[#9ca3af] hover:text-[#374151]"
                  }`}
                >
                  <Wallet size={11} strokeWidth={2} />
                  <span title="Movimientos del cajón de vueltos — salidas y préstamos.">FONDO DE CAMBIO</span>
                </button>
              </div>
            </div>

            {/* Content — sheets switcheables */}
            <div className="relative min-h-0 flex-1">

              {/* Sheet: CAJA DEL DÍA */}
              <div className={`absolute inset-0 overflow-y-auto transition-opacity duration-150 ${
                movPanel === "vendido" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
              }`}>
                <div className="flex flex-col gap-2.5 px-4 py-4">

                <div className="flex gap-px rounded-xl bg-[#f1f5f9] p-0.5">
                  {(["egreso", "ingreso"] as MoveType[]).map(t => (
                      <button key={t}
                        onClick={() => {
                          if (t === "egreso" && !moneyGt(fondoVendidoEsp, 0)) return;
                          setVendidoMoveType(t); setVendidoMotivo(""); setLastVendidoMove(null);
                        }}
                        disabled={t === "egreso" && !moneyGt(fondoVendidoEsp, 0)}
                        title={t === "egreso" && !moneyGt(fondoVendidoEsp, 0) ? "No disponible — no hay saldo en Caja del Día" : undefined}
                        className={`flex-1 rounded-[9px] py-1.5 text-[11px] font-bold uppercase tracking-wide transition ${
                          vendidoMoveType === t
                            ? t === "ingreso" ? "bg-emerald-600 text-white shadow-sm" : "bg-red-500 text-white shadow-sm"
                            : t === "egreso" && !moneyGt(fondoVendidoEsp, 0)
                              ? "cursor-not-allowed text-[#c0cad4]"
                              : "text-[#9ca3af] hover:text-[#374151]"
                        }`}
                      >
                        {t === "ingreso" ? "↑ INGRESAR" : "↓ SACAR"}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span className={`shrink-0 text-[13px] font-bold ${vendidoMoveType === "ingreso" ? "text-emerald-500" : "text-red-500"}`}>S/</span>
                    <input
                      ref={vendidoAmountRef}
                      type="number"
                      value={vendidoAmount}
                      onChange={e => setVendidoAmount(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); vendidoMotivoRef.current?.focus(); } }}
                      placeholder="0.00"
                      min="0.01"
                      step="0.01"
                      className={`w-full rounded-xl border px-3 py-1.5 text-[22px] font-bold text-[#2F3E46] outline-none placeholder:text-[#d1d9e1] focus:ring-2 transition ${
                        vendidoMoveType === "ingreso"
                          ? "border-emerald-300 focus:border-emerald-500 focus:ring-emerald-400/15"
                          : "border-red-300 focus:border-red-500 focus:ring-red-400/15"
                      }`}
                    />
                  </div>
                  {exceedsFondoVendido && (
                    <p className="px-0.5 text-[10px] font-semibold text-red-500">
                      Excede el saldo disponible (S/ {fondoVendidoEsp.toFixed(2)})
                    </p>
                  )}

                  <input
                    ref={vendidoMotivoRef}
                    type="text"
                    value={vendidoMotivo}
                    onChange={e => setVendidoMotivo(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && canSubmitVendido) handleAddVendido(); }}
                    placeholder={vendidoMoveType === "egreso" ? "Ej: Pago mototaxi, pago proveedor..." : "Ej: Depósito, ajuste de caja..."}
                    maxLength={120}
                    className="w-full rounded-xl border border-[#e4e9f0] bg-white px-3 py-1.5 text-[12px] text-[#374151] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
                  />

                  <button
                    onClick={handleAddVendido}
                    disabled={!canSubmitVendido}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl py-2 text-[12px] font-bold uppercase tracking-wide transition ${
                      canSubmitVendido
                        ? vendidoMoveType === "ingreso"
                          ? "bg-[#45b356] text-white shadow-sm hover:bg-[#35994a] active:scale-[0.98]"
                          : "bg-red-500 text-white shadow-sm hover:bg-red-600 active:scale-[0.98]"
                        : "bg-[#45b356]/[0.15] text-[#45b356]/50 cursor-not-allowed"
                    }`}
                  >
                    {vendidoMoveType === "ingreso" ? "INGRESAR DINERO" : "SACAR DINERO"}
                  </button>

                  {lastVendidoMove && (
                    <div className={`flex flex-col gap-1.5 rounded-xl border bg-white px-3 py-2.5 ${
                      lastVendidoMove.type === "ingreso" ? "border-emerald-200" : "border-red-200"
                    }`}>
                      <div className="flex items-center gap-2">
                        <CheckCircle size={11} className={`shrink-0 ${
                          lastVendidoMove.type === "ingreso" ? "text-emerald-500" : "text-red-500"
                        }`} />
                        <div className="min-w-0 flex-1">
                          <p className={`text-[10px] font-bold uppercase tracking-wide ${
                            lastVendidoMove.type === "ingreso" ? "text-emerald-700" : "text-red-700"
                          }`}>
                            {lastVendidoMove.type === "ingreso" ? "INGRESO REGISTRADO" : "RETIRO REGISTRADO"}
                          </p>
                          <p className="truncate text-[10px] text-[#9ca3af]">
                            {lastVendidoMove.type === "ingreso" ? "↑" : "↓"} S/ {lastVendidoMove.amount.toFixed(2)} · {lastVendidoMove.motivo}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => void handlePrintVoucher(lastVendidoMove)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#2154d8] py-1.5 text-[10px] font-bold uppercase tracking-wide text-white transition hover:bg-[#1a44be] active:scale-[0.98]"
                        >
                          <Printer size={10} strokeWidth={2} /> IMPRIMIR
                        </button>
                        <button onClick={() => setLastVendidoMove(null)}
                          className="flex items-center justify-center rounded-lg border border-[#e4e9f0] px-2.5 py-1.5 text-[#9ca3af] transition hover:bg-[#f1f5f9] hover:text-[#374151]"
                        >
                          <X size={11} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* Sheet: FONDO DE CAMBIO */}
              <div className={`absolute inset-0 overflow-y-auto transition-opacity duration-150 ${
                movPanel === "fondo" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
              }`}>
                <div className="flex flex-col gap-2.5 px-4 py-4">

                  {/* Mini-selector: RETIRO / REINTEGRO / PRESTADO / DEVOLVER */}
                  <div className="flex gap-px rounded-xl bg-[#f1f5f9] p-0.5">
                    {([
                      { tab: "retiro"   as const, label: "DI SENCILLO"     },
                      { tab: "deposito" as const, label: "ME DEVOLVIERON"  },
                      { tab: "prestado" as const, label: "RECIBÍ SENCILLO" },
                      { tab: "devolver" as const, label: "YO DEVOLVÍ"      },
                    ]).map(({ tab, label }) => {
                      const active = fondoSubTab === tab;
                      const color =
                        tab === "retiro"   ? "bg-amber-500"   :
                        tab === "deposito" ? "bg-[#2154d8]"   :
                        tab === "prestado" ? "bg-emerald-600" :
                                            "bg-rose-500";
                      const badge =
                        tab === "devolver" && externosPendientes.length > 0
                          ? externosPendientes.length : 0;
                      return (
                        <button key={tab}
                          onClick={() => {
                            setFondoSubTab(tab);
                            setFondoMotivo("");
                            setShowFondoMotivoSugerencias(false);
                            setPrestadoMotivo("");
                            setShowPrestadoMotivoSugerencias(false);
                            setLastFondoMove(null);
                          }}
                          className={`relative flex-1 rounded-[9px] py-1.5 text-[9.5px] font-bold uppercase tracking-wide transition ${
                            active ? `${color} text-white shadow-sm` : "text-[#9ca3af] hover:text-[#374151]"
                          }`}
                        >
                          {label}
                          {badge > 0 && (
                            <span className="absolute -top-1 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-rose-500 text-[7px] font-bold text-white">
                              {badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* ── RETIRO form ── */}
                  {fondoSubTab === "retiro" && (
                    <>
                      <p className="text-[10px] text-amber-600 font-semibold px-1">
                        Retiro del fondo de cambio · quedará pendiente de reintegro
                      </p>

                      <div className="flex items-center gap-1.5">
                        <span className="shrink-0 text-[13px] font-bold text-amber-500">S/</span>
                        <input ref={fondoAmountRef} type="number" value={fondoAmount}
                          onChange={e => setFondoAmount(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); fondoMotivoRef.current?.focus(); } }}
                          placeholder="0.00" min="0.01" step="0.01"
                          className="w-full rounded-xl border border-amber-300 px-3 py-1.5 text-[22px] font-bold text-[#2F3E46] outline-none placeholder:text-[#d1d9e1] focus:border-amber-500 focus:ring-2 focus:ring-amber-400/15 transition"
                        />
                      </div>

                      <input ref={fondoMotivoRef} type="text" value={fondoMotivo}
                        onChange={e => setFondoMotivo(e.target.value)}
                        onFocus={() => { if (!fondoMotivo.trim()) setShowFondoMotivoSugerencias(true); }}
                        onBlur={() => { setTimeout(() => setShowFondoMotivoSugerencias(false), 150); }}
                        onKeyDown={e => { if (e.key === "Enter" && canAddFondo) handleAddFondo(); }}
                        placeholder="Ej: Préstamo temporal, sencillo para cambio..."
                        maxLength={120}
                        className="w-full rounded-xl border border-[#e4e9f0] bg-white px-3 py-1.5 text-[12px] text-[#374151] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
                      />

                      {showFondoMotivoSugerencias && (
                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                          {["Préstamo temporal", "Cambio para otra caja", "Compra operacional menor", "Contingencia", "Retiro autorizado"].map(s => (
                            <button
                              key={s}
                              type="button"
                              onMouseDown={e => e.preventDefault()}
                              onClick={() => {
                                setFondoMotivo(s);
                                setShowFondoMotivoSugerencias(false);
                              }}
                              className="rounded-full border border-[#e2e8f0] bg-white px-2.5 py-1 text-[10px] font-medium text-[#697387] transition hover:border-[#2154d8]/30 hover:text-[#2154d8]"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}

                      <button onClick={handleAddFondo} disabled={!canAddFondo}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl py-2 text-[12px] font-bold uppercase tracking-wide transition ${
                          canAddFondo
                            ? "bg-amber-500 text-white shadow-sm hover:bg-amber-600 active:scale-[0.98]"
                            : "bg-amber-500/15 text-amber-500/50 cursor-not-allowed"
                        }`}
                      >
                        REGISTRAR RETIRO
                      </button>
                    </>
                  )}

                  {/* ── REINTEGRO: lista retiros pendientes → formulario ── */}
                  {fondoSubTab === "deposito" && (
                    <>
                      <p className="text-[10px] text-[#2154d8] font-semibold px-1">
                        Reintegrar un retiro pendiente del fondo
                      </p>

                      {pendientesApertura.length === 0 ? (
                        <div className="flex flex-col items-center gap-1.5 py-6 text-center">
                          <CheckCircle size={20} strokeWidth={1.5} className="text-emerald-400" />
                          <p className="text-[10.5px] font-semibold text-emerald-600">Sin retiros pendientes</p>
                          <p className="text-[9.5px] text-[#9ca3af]">Todos los retiros han sido reintegrados</p>
                        </div>
                      ) : reintegroTargetId === null ? (
                        <div className="flex flex-col gap-px rounded-xl border border-amber-200 overflow-hidden">
                          {pendientesApertura.filter(m => m.type === "egreso").map(m => {
                            const ts = new Date(m.timestamp);
                            const hm = `${String(ts.getHours()).padStart(2,"0")}:${String(ts.getMinutes()).padStart(2,"0")}`;
                            return (
                              <button key={m.id}
                                onClick={() => {
                                  setReintegroTargetId(m.id);
                                  setReintegroAmount(m.amount.toFixed(2));
                                  setReintegroMotivo(`Reintegro: ${m.motivo}`);
                                  setTimeout(() => reintegroAmountRef.current?.focus(), 50);
                                }}
                                className="flex items-center gap-2 px-3 py-2.5 text-left bg-amber-50/50 hover:bg-amber-100/60 transition border-b border-amber-100 last:border-0"
                              >
                                <span className="shrink-0 text-[9.5px] tabular-nums text-amber-600 font-bold">{hm}</span>
                                <span className="flex-1 text-[11px] font-semibold text-[#374151] truncate">{m.motivo}</span>
                                <span className="shrink-0 text-[11px] font-bold tabular-nums text-amber-700">S/ {m.amount.toFixed(2)}</span>
                                <span className="shrink-0 rounded-lg bg-[#2154d8] px-2 py-0.5 text-[8.5px] font-bold uppercase text-white">REINTEGRAR →</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (() => {
                        const original = cashMoves.find(m => m.id === reintegroTargetId);
                        const canConfirm = (parseFloat(reintegroAmount) || 0) > 0 && reintegroMotivo.trim().length >= MIN_MOTIVO_LEN;
                        return (
                          <>
                            <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                <span className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-amber-600">Reintegrando retiro</span>
                                <span className="text-[11px] font-semibold text-[#374151] truncate">{original?.motivo}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                <span className="text-[11px] font-bold tabular-nums text-amber-700">S/ {original?.amount.toFixed(2)}</span>
                                <button onClick={() => { setReintegroTargetId(null); setReintegroAmount(""); setReintegroMotivo(""); }}
                                  className="text-[#c0cad4] hover:text-[#374151] transition"
                                >
                                  <X size={12} strokeWidth={2} />
                                </button>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="shrink-0 text-[13px] font-bold text-emerald-500">S/</span>
                              <input ref={reintegroAmountRef} type="number" value={reintegroAmount}
                                onChange={e => setReintegroAmount(e.target.value)}
                                onKeyDown={e => { if (e.key === "Enter") e.preventDefault(); }}
                                placeholder="0.00" min="0.01" step="0.01"
                                className="w-full rounded-xl border border-emerald-300 px-3 py-1.5 text-[22px] font-bold text-[#2F3E46] outline-none placeholder:text-[#d1d9e1] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/15 transition"
                              />
                            </div>

                            <input type="text" value={reintegroMotivo}
                              onChange={e => setReintegroMotivo(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter" && canConfirm) handleReintegro(); }}
                              placeholder="Motivo del reintegro"
                              maxLength={120}
                              className="w-full rounded-xl border border-[#e4e9f0] bg-white px-3 py-1.5 text-[12px] text-[#374151] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
                            />

                            <button onClick={handleReintegro} disabled={!canConfirm}
                              className={`flex w-full items-center justify-center gap-2 rounded-xl py-2 text-[12px] font-bold uppercase tracking-wide transition ${
                                canConfirm
                                  ? "bg-[#2154d8] text-white shadow-sm hover:bg-[#1a44be] active:scale-[0.98]"
                                  : "bg-[#2154d8]/15 text-[#2154d8]/50 cursor-not-allowed"
                              }`}
                            >
                              CONFIRMAR REINTEGRO
                            </button>
                          </>
                        );
                      })()}
                    </>
                  )}

                  {/* ── PRESTADO: registrar préstamo recibido al fondo ── */}
                  {fondoSubTab === "prestado" && (
                    <>
                      <p className="text-[10px] text-emerald-700 font-semibold px-1">
                        Préstamo recibido al fondo · quedará pendiente de devolución
                      </p>

                      <div className="flex items-center gap-1.5">
                        <span className="shrink-0 text-[13px] font-bold text-emerald-600">S/</span>
                        <input ref={prestadoAmountRef} type="number" value={prestadoAmount}
                          onChange={e => setPrestadoAmount(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); prestadoMotivoRef.current?.focus(); } }}
                          placeholder="0.00" min="0.01" step="0.01"
                          className="w-full rounded-xl border border-emerald-300 px-3 py-1.5 text-[22px] font-bold text-[#2F3E46] outline-none placeholder:text-[#d1d9e1] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-400/15 transition"
                        />
                      </div>

                      <input ref={prestadoMotivoRef} type="text" value={prestadoMotivo}
                        onChange={e => setPrestadoMotivo(e.target.value)}
                        onFocus={() => { if (!prestadoMotivo.trim()) setShowPrestadoMotivoSugerencias(true); }}
                        onBlur={() => { setTimeout(() => setShowPrestadoMotivoSugerencias(false), 150); }}
                        onKeyDown={e => { if (e.key === "Enter" && canAddPrestado) handleAddPrestado(); }}
                        placeholder="Ej: Monedas prestadas para dar vuelto..."
                        maxLength={120}
                        className="w-full rounded-xl border border-[#e4e9f0] bg-white px-3 py-1.5 text-[12px] text-[#374151] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
                      />

                      {showPrestadoMotivoSugerencias && (
                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                          {["Monedas operación", "Fondo contingencia", "Sencillo extra", "Billete cambio"].map(s => (
                            <button
                              key={s}
                              type="button"
                              onMouseDown={e => e.preventDefault()}
                              onClick={() => {
                                setPrestadoMotivo(s);
                                setShowPrestadoMotivoSugerencias(false);
                              }}
                              className="rounded-full border border-[#e2e8f0] bg-white px-2.5 py-1 text-[10px] font-medium text-[#697387] transition hover:border-[#2154d8]/30 hover:text-[#2154d8]"
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      )}

                      <button onClick={handleAddPrestado} disabled={!canAddPrestado}
                        className={`flex w-full items-center justify-center gap-2 rounded-xl py-2 text-[12px] font-bold uppercase tracking-wide transition ${
                          canAddPrestado
                            ? "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:scale-[0.98]"
                            : "bg-emerald-600/15 text-emerald-600/50 cursor-not-allowed"
                        }`}
                      >
                        REGISTRAR PRÉSTAMO
                      </button>
                    </>
                  )}

                  {/* ── DEVOLVER: lista de préstamos recibidos pendientes ── */}
                  {fondoSubTab === "devolver" && (
                    <>
                      <p className="text-[10px] text-rose-600 font-semibold px-1">
                        Devolver préstamo recibido al fondo
                      </p>

                      {externosPendientes.length === 0 ? (
                        <div className="flex flex-col items-center gap-1.5 py-6 text-center">
                          <CheckCircle size={20} strokeWidth={1.5} className="text-emerald-400" />
                          <p className="text-[10.5px] font-semibold text-emerald-600">Sin préstamos pendientes</p>
                          <p className="text-[9.5px] text-[#9ca3af]">Todos los préstamos han sido devueltos</p>
                        </div>
                      ) : devolverTargetId === null ? (
                        <div className="flex flex-col gap-px rounded-xl border border-emerald-200 overflow-hidden">
                          {externosPendientes.map(m => {
                            const ts = new Date(m.timestamp);
                            const hm = `${String(ts.getHours()).padStart(2,"0")}:${String(ts.getMinutes()).padStart(2,"0")}`;
                            return (
                              <button key={m.id}
                                onClick={() => {
                                  setDevolverTargetId(m.id);
                                  setDevolverMotivo(`Devolución: ${m.motivo}`);
                                }}
                                className="flex items-center gap-2 px-3 py-2.5 text-left bg-emerald-50/50 hover:bg-emerald-100/60 transition border-b border-emerald-100 last:border-0"
                              >
                                <span className="shrink-0 text-[9.5px] tabular-nums text-emerald-700 font-bold">{hm}</span>
                                <span className="flex-1 text-[11px] font-semibold text-[#374151] truncate">{m.motivo}</span>
                                <span className="shrink-0 text-[11px] font-bold tabular-nums text-emerald-700">S/ {m.amount.toFixed(2)}</span>
                                <span className="shrink-0 rounded-lg bg-rose-500 px-2 py-0.5 text-[8.5px] font-bold uppercase text-white">DEVOLVER →</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (() => {
                        const original = cashMoves.find(m => m.id === devolverTargetId);
                        const canConfirm = devolverMotivo.trim().length >= MIN_MOTIVO_LEN;
                        return (
                          <>
                            <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                <span className="text-[8.5px] font-bold uppercase tracking-[0.12em] text-emerald-700">Devolviendo préstamo</span>
                                <span className="text-[11px] font-semibold text-[#374151] truncate">{original?.motivo}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0 ml-2">
                                <span className="text-[12px] font-bold tabular-nums text-emerald-700">S/ {original?.amount.toFixed(2)}</span>
                                <button onClick={() => { setDevolverTargetId(null); setDevolverMotivo(""); }}
                                  className="text-[#c0cad4] hover:text-[#374151] transition"
                                >
                                  <X size={12} strokeWidth={2} />
                                </button>
                              </div>
                            </div>

                            <input type="text" value={devolverMotivo}
                              onChange={e => setDevolverMotivo(e.target.value)}
                              onKeyDown={e => { if (e.key === "Enter" && canConfirm) handleDevolver(); }}
                              placeholder="Motivo de la devolución"
                              maxLength={120}
                              className="w-full rounded-xl border border-[#e4e9f0] bg-white px-3 py-1.5 text-[12px] text-[#374151] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
                            />

                            <button onClick={handleDevolver} disabled={!canConfirm}
                              className={`flex w-full items-center justify-center gap-2 rounded-xl py-2 text-[12px] font-bold uppercase tracking-wide transition ${
                                canConfirm
                                  ? "bg-rose-500 text-white shadow-sm hover:bg-rose-600 active:scale-[0.98]"
                                  : "bg-rose-500/15 text-rose-500/50 cursor-not-allowed"
                              }`}
                            >
                              CONFIRMAR DEVOLUCIÓN
                            </button>

                            {canConfirm && (
                              <button
                                onClick={() => {
                                  const orig = cashMoves.find(m => m.id === devolverTargetId);
                                  if (!orig) return;
                                  updateCashMove(orig.id, "regularizado", "integracion_fondo");
                                  setLastFondoMove(orig);
                                  setDevolverTargetId(null); setDevolverMotivo("");
                                  showNotice(`Préstamo integrado al fondo · S/ ${orig.amount.toFixed(2)}`);
                                }}
                                className="w-full py-1 text-[10px] text-[#697387] hover:text-[#2154d8] transition text-center"
                              >
                                o integrar permanentemente al fondo →
                              </button>
                            )}
                          </>
                        );
                      })()}
                    </>
                  )}

                  {lastFondoMove && (
                    <div className={`flex flex-col gap-1.5 rounded-xl border px-3 py-2.5 ${
                      lastFondoMove.type === "egreso" ? "border-amber-200 bg-white" : "border-emerald-200 bg-white"
                    }`}>
                      <div className="flex items-center gap-2">
                        <CheckCircle size={11} className={`shrink-0 ${lastFondoMove.type === "egreso" ? "text-amber-500" : "text-emerald-500"}`} />
                        <div className="min-w-0 flex-1">
                          <p className={`text-[10px] font-bold uppercase tracking-wide ${lastFondoMove.type === "egreso" ? "text-amber-700" : "text-emerald-700"}`}>
                            {lastFondoMove.type === "egreso" && lastFondoMove.sourceType === "externo"
                              ? "DEVOLUCIÓN REGISTRADA"
                              : lastFondoMove.type === "egreso"
                                ? "RETIRO REGISTRADO"
                                : lastFondoMove.sourceType === "externo" && lastFondoMove.regularizationMode === "integracion_fondo"
                                  ? "PRÉSTAMO INTEGRADO AL FONDO · SUMA PERMANENTE"
                                  : lastFondoMove.sourceType === "externo"
                                    ? "PRÉSTAMO REGISTRADO · PENDIENTE DE DEVOLUCIÓN"
                                    : lastFondoMove.refId
                                      ? "REINTEGRO REGISTRADO"
                                      : "INGRESO REGISTRADO"
                            }
                          </p>
                          <p className="truncate text-[10px] text-[#9ca3af]">
                            {lastFondoMove.type === "ingreso" ? "↑" : "↓"} S/ {lastFondoMove.amount.toFixed(2)} · {lastFondoMove.motivo}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        <button onClick={() => void handlePrintVoucher(lastFondoMove)}
                          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#2154d8] py-1.5 text-[10px] font-bold uppercase tracking-wide text-white transition hover:bg-[#1a44be] active:scale-[0.98]"
                        >
                          <Printer size={10} strokeWidth={2} /> IMPRIMIR
                        </button>
                        <button onClick={() => setLastFondoMove(null)}
                          className="flex items-center justify-center rounded-lg border border-[#e4e9f0] px-2.5 py-1.5 text-[#9ca3af] transition hover:bg-[#f1f5f9] hover:text-[#374151]"
                        >
                          <X size={11} strokeWidth={2} />
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              </div>

            </div>
          </div>

          {/* ─── SUCESOS DEL TURNO ─── */}
          <div className="flex min-h-0 flex-[4] shrink-0 flex-col overflow-hidden rounded-[28px] border border-[#C59B6D]/50 bg-[#FDFCF9]">

            <div className="shrink-0 flex h-[42px] items-center gap-2 px-4 bg-[#FFF5E6] border-b border-[#C59B6D]/15">
              <ListChecks size={13} strokeWidth={2} className="shrink-0 text-[#C59B6D]" />
              <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">SUCESOS DEL TURNO</span>
              {currentSessionEvents.length > 0 && (
                <span className="ml-auto text-[10px] font-semibold text-[#9ca3af] tabular-nums">{currentSessionEvents.length}</span>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
              {currentSessionEvents.length === 0 ? (
                <p className="py-8 text-center text-[10.5px] text-[#c8d4e0]">Sin sucesos en este turno</p>
              ) : (() => {
                const events = [...currentSessionEvents].reverse() as TurnEvent[];
                return (
                  <div className="flex flex-col gap-px">
                    {events.map(ev => {
                      const ts = new Date(ev.ts);
                      const hm = `${String(ts.getHours()).padStart(2, "0")}:${String(ts.getMinutes()).padStart(2, "0")}`;
                      const dd = `${String(ts.getDate()).padStart(2, "0")}/${String(ts.getMonth() + 1).padStart(2, "0")}`;
                      
                      const cfg: Record<string, { sym: string; cls: string }> = {
                        apertura:           { sym: "⊕", cls: "text-[#2154d8]"   },
                        movimiento_ingreso: { sym: "+",  cls: "text-emerald-500" },
                        movimiento_egreso:  { sym: "−",  cls: "text-red-400"     },
                        fondo_ingreso:      { sym: "→",  cls: "text-amber-500"   },
                        fondo_egreso:       { sym: "←",  cls: "text-amber-600"   },
                        comprobante:        { sym: "≡",  cls: "text-[var(--dv-color-edit)]"   },
                        anulacion:          { sym: "⊘",  cls: "text-red-400"     },
                        cierre:             { sym: "⊗",  cls: "text-[#6b7280]"   },
                      };
                      const { sym, cls } = cfg[ev.type] ?? { sym: "·", cls: "text-[#9ca3af]" };
                      return (
                        <div key={ev.id} className="flex items-start gap-2 px-2 py-1.5 rounded-xl hover:bg-white">
                          <div className="shrink-0 w-[34px] flex flex-col items-end gap-px pt-0.5">
                            <span className="text-[8px] tabular-nums text-[#d1d9e1] leading-none">{dd}</span>
                            <span className="text-[9px] tabular-nums text-[#c0cad4] leading-none">{hm}</span>
                          </div>
                          <span className={`shrink-0 text-[11px] font-bold leading-none pt-0.5 ${cls}`}>{sym}</span>
                          <p className="flex-1 min-w-0 text-[11px] font-semibold text-[#374151] leading-snug">{ev.text.replace(/^[↑↓]\s*(?:Ingreso|Egreso)\s*·\s*/, "")}</p>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

          </div>

        </>
      )}

    </section>
  );
}
