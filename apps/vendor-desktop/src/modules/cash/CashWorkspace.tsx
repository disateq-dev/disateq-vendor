import { useState, useEffect, useRef } from "react";
import { Clock, LogIn, LogOut, Lock, CheckCircle, Printer, AlertTriangle, X, Wallet, ShoppingCart, RotateCcw, Pencil } from "lucide-react";
import { usePOS, type CashBox, type MoveType, type MoveSource, type CashMove } from "../../context/POSContext";
import {
  printCashMoveVoucher, printCashMoveVoucherThermal, type VoucherMoveData,
  printArqueo, printArqueoThermal, type ArqueoData,
} from "../../print/printTicket";
import { calcConciliation } from "./services/cash-conciliation.service";
import {
  prereqCode, operatorFromCode, isContingencyBox,
  canOpenSession, validateCanAddMove,
  CTG_PIN, MIN_MOTIVO_LEN,
} from "./services/cash-rules.service";

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

const SERIES = ["1", "2", "3", "5"] as const;

type ClosingStage = 0 | 1 | 2 | 3 | 4 | 5;

// ── sub-components ─────────────────────────────────────────────

function InfoRow({ label, value, accent, red }: { label: string; value: string; accent?: boolean; red?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[10.5px] font-semibold uppercase tracking-widest text-[#c0cad4]">{label}</span>
      <span className={`text-[11.5px] font-semibold ${red ? "text-[#ef4444]" : accent ? "text-emerald-600" : "text-[#374151]"}`}>{value}</span>
    </div>
  );
}

function BoxStatusBadge({ box, isActive }: { box: CashBox; isActive: boolean }) {
  if (isActive) return (
    <span className="rounded-lg bg-emerald-100 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-emerald-700">ACTIVA</span>
  );
  if (box.used) return (
    <span className="rounded-lg bg-[#f4f7fb] px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-[#c0cad4]">CERRADO</span>
  );
  if (!box.available) return (
    <span className="flex items-center gap-1 rounded-lg bg-[#fef9f0] px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-[#c08000]">
      <Lock size={8} strokeWidth={2.5} />REQ. CAJA {prereqCode(box)}
    </span>
  );
  return (
    <span className="rounded-lg bg-[#f0fdf4] px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-[#16a34a]">DISPONIBLE</span>
  );
}

function BoxRow({ box, isActive, isSelected, onSelect }: {
  box: CashBox; isActive: boolean; isSelected: boolean; onSelect?: () => void;
}) {
  const clickable = !isActive && box.available && !!onSelect;
  let cls = "flex items-center gap-3 rounded-2xl px-4 py-2.5 transition select-none";
  if (isActive)        cls += " bg-[#f8fafd] ring-2 ring-emerald-200";
  else if (isSelected) cls += " bg-[#f8fafd] ring-1 ring-[#2154d8]/30";
  else if (clickable)  cls += " cursor-pointer hover:bg-[#f4f7fb]";
  else                 cls += " opacity-50 cursor-default";
  const dotColor  = isActive ? "bg-emerald-500" : isSelected ? "bg-[#2154d8]" : box.available ? "bg-[#34d399]" : "bg-[#d1d5db]";
  const nameColor = isActive ? "text-emerald-700" : isSelected ? "text-[#2154d8]" : box.used || !box.available ? "text-[#c0cad4]" : "text-[#111827]";
  return (
    <div className={cls} onClick={clickable ? onSelect : undefined}>
      <div className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
      <span className={`flex-1 text-[13px] font-bold tabular-nums ${nameColor}`}>CAJA {box.code}</span>
      <BoxStatusBadge box={box} isActive={isActive} />
    </div>
  );
}

// ── main component ─────────────────────────────────────────────

interface CashWorkspaceProps {
  onOpened?: () => void;
}

export function CashWorkspace({ onOpened }: CashWorkspaceProps) {
  const {
    cashSession, cashBoxes, suggestedCashBox,
    openCashSession, closeCashSession, correctAperturaData,
    sessionStats, cashMoves, addCashMove,
    showNotice,
  } = usePOS();
  const {
    isOpen, cashBox: activeBox, operator, terminal, openedAt,
    apertura, motivo: sessionMotivo,
    observacion: sessionObservacion, refOp: sessionRefOp,
  } = cashSession;

  // ── pre-open state ────────────────────────────────────────────
  const [selectedCode,    setSelectedCode]    = useState<string>(() => suggestedCashBox?.code ?? "100");
  const [aperturaInput,   setAperturaInput]   = useState("");
  const [aperturaMotivo,  setAperturaMotivo]  = useState("");
  const [aperturaRefOp,   setAperturaRefOp]   = useState("");
  const [ctgPin,          setCtgPin]          = useState("");
  const [ctgJustif,       setCtgJustif]       = useState("");
  const [ctgPinError,     setCtgPinError]     = useState(false);
  const aperturaRef       = useRef<HTMLInputElement>(null);
  const aperturaMotivoRef = useRef<HTMLInputElement>(null);
  const aperturaRefOpRef  = useRef<HTMLInputElement>(null);

  // ── corrección datos apertura state ──────────────────────────
  const [editingApertura,    setEditingApertura]    = useState(false);
  const [editAperturaInput,  setEditAperturaInput]  = useState("");
  const [editMotivo,         setEditMotivo]         = useState("");
  const [editObservacion,    setEditObservacion]    = useState("");
  const [editRefOp,          setEditRefOp]          = useState("");

  // ── timer ─────────────────────────────────────────────────────
  const [duration, setDuration] = useState("");
  useEffect(() => {
    if (!openedAt) { setDuration(""); return; }
    const update = () => setDuration(formatDuration(openedAt));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [openedAt]);

  // ── closing state ─────────────────────────────────────────────
  const [closingStage, setClosingStage] = useState<ClosingStage>(() => {
    if (!isOpen) return 0;
    try {
      const n = parseInt(localStorage.getItem("disateq.pos.ui.closingStage") ?? "0", 10);
      return ([0,1,2,3,4,5].includes(n) ? n : 0) as ClosingStage;
    } catch { return 0; }
  });
  function loadContadoField(field: string): string {
    if (!isOpen) return "";
    try {
      const stage = parseInt(localStorage.getItem("disateq.pos.ui.closingStage") ?? "0", 10);
      if (stage >= 2) {
        const raw = localStorage.getItem("disateq.pos.ui.contado");
        if (raw) return (JSON.parse(raw) as Record<string, string>)[field] ?? "";
      }
    } catch {}
    return "";
  }
  const [contadoEfe,  setContadoEfe]  = useState(() => loadContadoField("efe"));
  const [contadoYape, setContadoYape] = useState(() => loadContadoField("yape"));
  const [contadoTar,  setContadoTar]  = useState(() => loadContadoField("tar"));
  const [validatedAt, setValidatedAt] = useState<string | null>(null);
  const [observations, setObservations] = useState("");
  const [zeroMotive,  setZeroMotive]  = useState("");
  const contadoEfeRef  = useRef<HTMLInputElement>(null);
  const contadoYapeRef = useRef<HTMLInputElement>(null);
  const contadoTarRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (closingStage > 0) localStorage.setItem("disateq.pos.ui.closingStage", String(closingStage));
    else localStorage.removeItem("disateq.pos.ui.closingStage");
  }, [closingStage]);

  useEffect(() => {
    if (closingStage >= 2 && contadoEfe !== "") {
      localStorage.setItem("disateq.pos.ui.contado", JSON.stringify({
        efe: contadoEfe, yape: contadoYape, tar: contadoTar,
      }));
    } else {
      localStorage.removeItem("disateq.pos.ui.contado");
    }
  }, [closingStage, contadoEfe, contadoYape, contadoTar]);

  useEffect(() => {
    if (closingStage === 2) setTimeout(() => contadoEfeRef.current?.focus(), 80);
  }, [closingStage]);

  useEffect(() => {
    if (!isOpen) {
      setClosingStage(0);
      setContadoEfe(""); setContadoYape(""); setContadoTar("");
      setValidatedAt(null); setObservations(""); setZeroMotive("");
      localStorage.removeItem("disateq.pos.ui.closingStage");
      localStorage.removeItem("disateq.pos.ui.contado");
      setAperturaInput(""); setAperturaMotivo(""); setAperturaRefOp("");
      setCtgPin(""); setCtgJustif(""); setCtgPinError(false);
      setEditingApertura(false);
      setEditAperturaInput(""); setEditMotivo(""); setEditObservacion(""); setEditRefOp("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen && suggestedCashBox) setSelectedCode(suggestedCashBox.code);
  }, [isOpen, suggestedCashBox]);

  // ── movements state ───────────────────────────────────────────
  const [moveType,       setMoveType]       = useState<MoveType>("ingreso");
  const [moveAmount,     setMoveAmount]     = useState("");
  const [moveMotivo,     setMoveMotivo]     = useState("");
  const [moveObservacion,setMoveObservacion]= useState("");
  const [sourceType,     setSourceType]     = useState<MoveSource>("apertura");
  const [lastMove,       setLastMove]       = useState<CashMove | null>(null);
  const moveAmountRef = useRef<HTMLInputElement>(null);
  const motivoRef     = useRef<HTMLInputElement>(null);

  // ── reposición state ──────────────────────────────────────────
  const [reposingMoveId,  setReposingMoveId]  = useState<string | null>(null);
  const [repoAmount,      setRepoAmount]      = useState("");
  const [repoMotivo,      setRepoMotivo]      = useState("");
  const [repoObservacion, setRepoObservacion] = useState("");
  const [lastRepoMove,    setLastRepoMove]    = useState<CashMove | null>(null);
  const repoAmountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLastMove(null); setMoveAmount(""); setMoveMotivo(""); setMoveObservacion("");
    setSourceType("apertura");
    setReposingMoveId(null); setRepoAmount(""); setRepoMotivo(""); setRepoObservacion(""); setLastRepoMove(null);
  }, [isOpen]);

  useEffect(() => {
    if (closingStage > 0) { setReposingMoveId(null); setEditingApertura(false); }
  }, [closingStage]);

  // ── derived ───────────────────────────────────────────────────
  const selectedBox        = isOpen ? activeBox : (cashBoxes.find(b => b.code === selectedCode) ?? null);
  const isContingency      = isContingencyBox(selectedBox);
  const canOpen            = canOpenSession(isOpen, selectedBox, aperturaInput, isContingency, ctgPin, ctgJustif);
  const canCorrectApertura = isOpen && cashMoves.length === 0 && sessionStats.count === 0 && closingStage === 0;

  useEffect(() => {
    if (!canCorrectApertura) setEditingApertura(false);
  }, [canCorrectApertura]);

  // move form derived
  const totalAmt   = parseFloat(moveAmount) || 0;
  const canAddMove = validateCanAddMove(totalAmt, moveMotivo, sourceType, 0, 0);

  // fondo breakdown — delegated to service
  const {
    ingresosTotal, egresosTotal,
  } = calcConciliation(cashMoves, sessionStats.cash, apertura);
  const totalEsperado  = sessionStats.total + ingresosTotal - egresosTotal;
  const contadoEfeNum  = numericValue(contadoEfe);
  const contadoYapeNum = numericValue(contadoYape);
  const contadoTarNum  = numericValue(contadoTar);
  const contadoTotal   = contadoEfeNum + contadoYapeNum + contadoTarNum;
  const diferencia     = contadoTotal - totalEsperado;
  const contadoValid   = contadoEfe !== "";
  const canClose       = contadoTotal > 0 || zeroMotive !== "";

  // ── handlers ──────────────────────────────────────────────────

  function handleOpen() {
    if (!selectedBox?.available) return;
    if (isContingency) {
      if (ctgPin !== CTG_PIN) { setCtgPinError(true); return; }
      if (!ctgJustif) return;
    }
    const amt = parseFloat(aperturaInput);
    if (isNaN(amt) || amt < 0) return;  // canOpen debe haberlo bloqueado, pero safety guard
    const motivo = isContingency ? ctgJustif.trim() : (aperturaMotivo.trim() || undefined);
    openCashSession(selectedBox.code, amt, motivo, aperturaRefOp.trim() || undefined);
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

  function handleAddMove() {
    if (!canAddMove) return;
    const amt = totalAmt;
    const fa  = sourceType === "apertura" ? amt : 0;
    const fv  = sourceType === "vendido"  ? amt : 0;
    const obs = moveObservacion.trim() || undefined;
    const move = addCashMove(moveType, amt, moveMotivo.trim(), sourceType, fa, fv, obs);
    setLastMove(move);
    setMoveAmount(""); setMoveMotivo(""); setMoveObservacion("");
    showNotice(`${moveType === "ingreso" ? "Ingreso" : "Egreso"} registrado · S/ ${amt.toFixed(2)}`);
    setTimeout(() => moveAmountRef.current?.focus(), 10);
  }

  function closeRepo() {
    setReposingMoveId(null); setRepoAmount(""); setRepoMotivo(""); setRepoObservacion(""); setLastRepoMove(null);
  }

  function openRepo(original: CashMove) {
    setReposingMoveId(original.id);
    setRepoAmount(original.amount.toFixed(2));
    setRepoMotivo(`Devolución: ${original.motivo}`);
    setRepoObservacion("");
    setTimeout(() => repoAmountRef.current?.focus(), 50);
  }

  function handleReposicion() {
    const original = cashMoves.find(m => m.id === reposingMoveId);
    if (!original) return;
    const amt = parseFloat(repoAmount) || 0;
    if (amt <= 0 || !repoMotivo.trim()) return;
    let fa = 0, fv = 0;
    if (original.sourceType === "apertura") { fa = amt; fv = 0; }
    else if (original.sourceType === "vendido") { fa = 0; fv = amt; }
    else {
      const ratio = original.amount > 0 ? original.fromApertura / original.amount : 1;
      fa = parseFloat((amt * ratio).toFixed(2));
      fv = parseFloat((amt - fa).toFixed(2));
    }
    const move = addCashMove("ingreso", amt, repoMotivo.trim(), original.sourceType, fa, fv,
      repoObservacion.trim() || undefined, original.id);
    handlePrintVoucher(move);
    setLastRepoMove(move);
    showNotice(`Reposición registrada · S/ ${amt.toFixed(2)}`);
  }

  async function handlePrintVoucher(move: CashMove) {
    const ts = new Date(move.timestamp);
    const p  = (n: number) => String(n).padStart(2, "0");
    const data: VoucherMoveData = {
      businessName: "DISATEQ TIENDA",
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

  function handleConfirmClose() {
    const now = new Date();
    const p   = (n: number) => String(n).padStart(2, "0");
    const arqueo: ArqueoData = {
      businessName:     "DISATEQ TIENDA",
      cashBoxCode:      activeBox?.code ?? "?",
      operator,
      terminal,
      dateTime:         `${p(now.getDate())}/${p(now.getMonth()+1)}/${now.getFullYear()} ${p(now.getHours())}:${p(now.getMinutes())}`,
      apertura,
      ingresosTotal,
      egresosTotal,
      totalVentas:      sessionStats.total,
      salesCount:       sessionStats.count,
      efectivoEsperado: totalEsperado,
      contadoEfe:       contadoEfeNum,
      contadoYape:      contadoYapeNum,
      contadoTar:       contadoTarNum,
      contadoTotal,
      diferencia,
      observations:     observations.trim() || undefined,
      zeroMotive:       (contadoTotal === 0 && zeroMotive) ? zeroMotive : undefined,
    };
    closeCashSession();
    setClosingStage(0);
    setContadoEfe(""); setContadoYape(""); setContadoTar("");
    setValidatedAt(null); setObservations(""); setZeroMotive("");
    localStorage.removeItem("disateq.pos.ui.closingStage");
    localStorage.removeItem("disateq.pos.ui.contado");
    setTimeout(() => {
      printArqueoThermal("TIQUE", arqueo).catch(() => printArqueo(arqueo));
    }, 120);
  }

  // ── keyboard shortcuts del flujo de cierre ─────────────────
  useEffect(() => {
    if (!isOpen || closingStage === 0) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "F9" && closingStage === 2 && contadoValid) {
        e.preventDefault();
        // Consolidar expresiones pendientes
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
  }, [isOpen, closingStage, contadoValid]);

  // ── render ────────────────────────────────────────────────────

  return (
    <section className="flex min-h-0 flex-1 gap-3">

      {/* ── LEFT ── */}
      <div className="flex w-[300px] shrink-0 flex-col gap-3">

        {/* Status / pre-open card */}
        {isOpen ? (
          <div className={`flex flex-col gap-4 rounded-[24px] border bg-[#f8fafd] px-5 py-5 shadow-[0_4px_18px_rgba(15,23,42,0.04)] ${
            closingStage > 0 ? "border-red-200" : "border-emerald-200"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#f4f7fb] ${
                closingStage > 0 ? "text-[#b91c1c]" : "text-emerald-600"
              }`}>
                {closingStage > 0 ? <LogOut size={20} strokeWidth={1.5} /> : <Clock size={20} strokeWidth={1.5} />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${closingStage > 0 ? "bg-red-400" : "bg-emerald-500"}`} />
                  <span className={`text-[10.5px] font-bold uppercase tracking-widest ${closingStage > 0 ? "text-red-500" : "text-emerald-600"}`}>
                    {closingStage > 0 ? `CERRANDO TURNO · ${closingStage}/5` : "TURNO ABIERTO"}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[12px] font-semibold text-[#374151]">
                  CAJA {activeBox?.code}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <InfoRow label="Operador"     value={operator} />
              {openedAt && <InfoRow label="Fecha"    value={formatDate(openedAt)} />}
              {openedAt && <InfoRow label="Activo"   value={`${formatTime(openedAt)} · ${duration}`} accent />}
              <InfoRow label="Terminal"     value={terminal} />
              <InfoRow label="Fondo apertura" value={`S/ ${apertura.toFixed(2)}`} />
              {sessionMotivo    && <InfoRow label="Motivo apertura"  value={sessionMotivo}    />}
              {sessionObservacion && <InfoRow label="Observación"    value={sessionObservacion} />}
              {sessionRefOp       && <InfoRow label="Ref. operacional" value={sessionRefOp}   />}

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
                    <div className="-mx-5 h-px bg-[#f0f4f8]" />
                    <InfoRow label="Operaciones" value={String(sessionStats.count)} />
                    {breakdown.length > 0 && (
                      <p className="text-right text-[9px] font-semibold tabular-nums text-[#9ca3af] -mt-1">
                        {breakdown.map((m, i) => (i > 0 ? ` · ${m.key} ${m.n}` : `${m.key} ${m.n}`)).join("")}
                      </p>
                    )}
                    {docEntries.map(([type, r]) => {
                      const range = r.count === 1
                        ? `${r.series}-${fmt(r.first)}`
                        : `${r.series}-${fmt(r.first)} → ${r.series}-${fmt(r.last)}`;
                      return <InfoRow key={type} label={docLabel[type] ?? type} value={range} />;
                    })}
                  </>
                );
              })()}

              {closingStage === 0 && (ingresosTotal > 0 || egresosTotal > 0) && (
                <>
                  <div className="-mx-5 h-px bg-[#f0f4f8]" />
                  {ingresosTotal > 0 && <InfoRow label="Ingresos ↑" value={`S/ ${ingresosTotal.toFixed(2)}`} accent />}
                  {egresosTotal > 0  && <InfoRow label="Egresos ↓"  value={`S/ ${egresosTotal.toFixed(2)}`}  red />}
                </>
              )}
            </div>
          </div>

        ) : (
          /* Pre-open: operator + apertura card */
          <div className="flex flex-col gap-4 rounded-[24px] border border-[#e4e9f0] bg-[#f8fafd] px-5 py-5 shadow-[0_4px_18px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[#f1f5f9] text-[#9ca3af]">
                <Clock size={20} strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <span className="text-[10.5px] font-bold uppercase tracking-widest text-[#9ca3af]">SIN TURNO OPERATIVO</span>
                <p className="mt-0.5 truncate text-[12px] font-semibold text-[#374151]">
                  {selectedBox ? `CAJA ${selectedBox.code} · ${operatorFromCode(selectedBox.code)}` : "Sin caja seleccionada"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#b0bac8]">Fondo apertura S/</span>
              <input
                ref={aperturaRef}
                type="number"
                value={aperturaInput}
                onChange={e => setAperturaInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") { e.preventDefault(); aperturaMotivoRef.current?.focus(); }
                }}
                placeholder="0.00"
                min="0"
                step="0.50"
                className={`w-full rounded-xl border px-3.5 py-2.5 text-[20px] font-bold text-[#2F3E46] outline-none placeholder:text-[#d1d9e1] transition focus:ring-2 focus:ring-[#2154d8]/10 ${
                  aperturaInput.trim() === "" ? "border-[#e4e9f0]" : "border-[#2154d8]/40 focus:border-[#2154d8]"
                }`}
              />
              {aperturaInput.trim() === "" && (
                <p className="text-[9px] font-semibold text-[#c0cad4]">Requerido · 0.00 es válido</p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#b0bac8]">Motivo apertura <span className="font-normal normal-case tracking-normal text-[#c0cad4]">(opcional)</span></span>
              <input
                ref={aperturaMotivoRef}
                type="text"
                value={aperturaMotivo}
                onChange={e => setAperturaMotivo(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") { e.preventDefault(); aperturaRefOpRef.current?.focus(); }
                }}
                placeholder="Contexto de apertura..."
                maxLength={120}
                className="w-full rounded-xl border border-[#e4e9f0] px-3 py-2 text-[12px] text-[#374151] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-1 focus:ring-[#2154d8]/10"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#b0bac8]">Ref. operacional <span className="font-normal normal-case tracking-normal text-[#c0cad4]">(opcional)</span></span>
              <input
                ref={aperturaRefOpRef}
                type="text"
                value={aperturaRefOp}
                onChange={e => setAperturaRefOp(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter" && canOpen) { e.preventDefault(); handleOpen(); }
                }}
                placeholder="Ej: T-2025-001, remito..."
                maxLength={80}
                className="w-full rounded-xl border border-[#e4e9f0] px-3 py-2 text-[12px] text-[#374151] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-1 focus:ring-[#2154d8]/10"
              />
            </div>

            {/* Operational authorization */}
            {isContingency && selectedBox && (
              <div className="flex flex-col gap-2 rounded-xl border border-orange-200 bg-[#fffbf0] px-3.5 py-3">
                <div className="flex items-center gap-1.5">
                  <AlertTriangle size={12} strokeWidth={2.5} className="text-orange-500 shrink-0" />
                  <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-orange-600">Autorización operacional</span>
                </div>
                <input
                  type="password"
                  value={ctgPin}
                  onChange={e => { setCtgPin(e.target.value); setCtgPinError(false); }}
                  placeholder="PIN de autorización"
                  maxLength={8}
                  className={`w-full rounded-xl border px-3 py-2 text-[13px] font-bold tracking-[0.3em] text-[#2F3E46] outline-none placeholder:font-normal placeholder:tracking-normal ${
                    ctgPinError ? "border-red-400 focus:ring-red-300/20" : "border-[#e4e9f0] focus:border-[#2154d8]"
                  } focus:ring-2`}
                />
                {ctgPinError && <p className="text-[10px] text-red-500 font-semibold">PIN incorrecto</p>}
                <input
                  type="text"
                  value={ctgJustif}
                  onChange={e => setCtgJustif(e.target.value)}
                  placeholder="Ej: Cobertura compañero, horas extra..."
                  maxLength={200}
                  className="w-full rounded-xl border border-[#e4e9f0] px-3 py-2 text-[12px] text-[#374151] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
                />
                {ctgJustif.trim().length > 0 && ctgJustif.trim().length < MIN_MOTIVO_LEN && (
                  <p className="text-[10px] font-semibold text-red-500">Mínimo {MIN_MOTIVO_LEN} caracteres</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Corrección datos apertura ── */}
        {isOpen && closingStage === 0 && (
          canCorrectApertura ? (
            editingApertura ? (
              <div className="flex flex-col gap-2 rounded-[20px] border border-[#dde4f0] bg-white px-4 py-3.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">Datos apertura</span>
                  <button onClick={cancelEditApertura} className="text-[#c0cad4] transition hover:text-[#374151]">
                    <X size={12} />
                  </button>
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#b0bac8]">Fondo inicial S/</span>
                  <input
                    autoFocus
                    type="number"
                    value={editAperturaInput}
                    onChange={e => setEditAperturaInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Escape") cancelEditApertura(); }}
                    placeholder="0.00"
                    min="0" step="0.50"
                    className="w-full rounded-xl border border-[#e4e9f0] px-3 py-2 text-[18px] font-bold text-[#2F3E46] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
                  />
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#b0bac8]">Motivo apertura</span>
                  <input
                    type="text"
                    value={editMotivo}
                    onChange={e => setEditMotivo(e.target.value)}
                    placeholder="Contexto de apertura..."
                    maxLength={120}
                    className="w-full rounded-xl border border-[#e4e9f0] px-3 py-1.5 text-[12px] text-[#374151] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-1 focus:ring-[#2154d8]/10"
                  />
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#b0bac8]">Observaciones</span>
                  <input
                    type="text"
                    value={editObservacion}
                    onChange={e => setEditObservacion(e.target.value)}
                    placeholder="Notas adicionales..."
                    maxLength={200}
                    className="w-full rounded-xl border border-[#e4e9f0] px-3 py-1.5 text-[12px] text-[#374151] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-1 focus:ring-[#2154d8]/10"
                  />
                </div>

                <div className="flex flex-col gap-0.5">
                  <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#b0bac8]">Ref. operacional</span>
                  <input
                    type="text"
                    value={editRefOp}
                    onChange={e => setEditRefOp(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleSaveCorrection(); if (e.key === "Escape") cancelEditApertura(); }}
                    placeholder="Ej: T-2025-001, remito..."
                    maxLength={80}
                    className="w-full rounded-xl border border-[#e4e9f0] px-3 py-1.5 text-[12px] text-[#374151] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-1 focus:ring-[#2154d8]/10"
                  />
                </div>

                <button
                  onClick={handleSaveCorrection}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#2154d8] py-2 text-[11.5px] font-bold uppercase tracking-wide text-white transition hover:bg-[#1a44be] active:scale-[0.98]"
                >
                  GUARDAR CORRECCIÓN
                </button>
              </div>
            ) : (
              <button
                onClick={openEditApertura}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#e4e9f0] bg-white py-2.5 text-[11px] font-semibold text-[#374151] transition hover:border-[#2154d8]/30 hover:bg-[#f8fafd] active:scale-[0.98]"
              >
                <Pencil size={11} strokeWidth={2} className="text-[#9ca3af]" />
                Corregir datos apertura
              </button>
            )
          ) : (
            <p className="text-center text-[9.5px] text-[#c0cad4]">
              Corrección de apertura · disponible antes del primer movimiento
            </p>
          )
        )}

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {!isOpen ? (
            <button
              onClick={handleOpen}
              disabled={!canOpen}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[13px] font-bold uppercase tracking-widest transition ${
                canOpen
                  ? "bg-emerald-600 text-white shadow-[0_4px_14px_rgba(5,150,105,0.28)] hover:bg-emerald-700 active:scale-[0.98]"
                  : "cursor-not-allowed bg-[#f4f7fb] text-[#c8d4e0]"
              }`}
            >
              <LogIn size={14} strokeWidth={2.5} />
              Apertura de turno
            </button>

          ) : closingStage === 0 ? (
            <>
              <button
                onClick={() => setClosingStage(1)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#f8c3c3] bg-[#fef2f2] py-3 text-[12px] font-bold uppercase tracking-widest text-[#b91c1c] transition hover:bg-[#fee2e2] active:scale-[0.98]"
              >
                <LogOut size={13} strokeWidth={2.5} />
                CIERRE DE TURNO
              </button>
            </>

          ) : closingStage === 1 ? (
            <>
              <button
                onClick={() => setClosingStage(2)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-3.5 text-[13px] font-bold uppercase tracking-widest text-white shadow-[0_4px_14px_rgba(5,150,105,0.24)] transition hover:bg-emerald-700 active:scale-[0.98]"
              >
                INICIAR CONTEO
              </button>
              <button
                onClick={() => setClosingStage(0)}
                className="flex w-full items-center justify-center rounded-2xl border border-[#e4e9f0] bg-white py-2.5 text-[12px] font-semibold text-[#374151] hover:bg-[#f8fafd]"
              >
                CANCELAR
              </button>
            </>

          ) : closingStage === 2 ? (
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
                    : "cursor-not-allowed bg-[#f4f7fb] text-[#c8d4e0]"
                }`}
              >
                VALIDAR CONTEO
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
                CONCILIAR
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

          ) : /* stage 5 */ (
            <>
              <button
                onClick={handleConfirmClose}
                disabled={!canClose}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[13px] font-bold uppercase tracking-widest transition ${
                  canClose
                    ? "bg-[#b91c1c] text-white shadow-[0_4px_12px_rgba(185,28,28,0.20)] hover:bg-[#991b1b] active:scale-[0.98]"
                    : "cursor-not-allowed bg-[#f4f7fb] text-[#c8d4e0]"
                }`}
              >
                <CheckCircle size={14} strokeWidth={2.5} />
                CERRAR TURNO
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
      </div>

      {/* ── RIGHT ── */}
      {!isOpen ? (

        /* BOX SELECTOR */
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-[#e4e9f0] bg-[#f8fafd] shadow-[0_4px_18px_rgba(15,23,42,0.04)]">
          <div className="shrink-0 border-b border-[#f1f5f9] px-5 py-3">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.15em] text-[#9ca3af]">Selección operacional de caja</span>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            {SERIES.map(prefix => {
              const seriesBoxes = cashBoxes.filter(b => b.code.startsWith(prefix));
              const opName = { "1": "Ricardo Aguinaga", "2": "Lucía Rebaza", "3": "Administrador", "5": "Supervisor" }[prefix] ?? "";
              return (
                <div key={prefix} className="mb-4 last:mb-0">
                  <p className="mb-0.5 px-1 text-[9.5px] font-bold uppercase tracking-[0.18em] text-[#c8d4e0]">BLOQUE {prefix}xx</p>
                  <p className="mb-1.5 px-1 text-[10px] font-semibold text-[#9ca3af]">{opName}</p>
                  <div className="flex flex-col gap-0.5">
                    {seriesBoxes.map(box => (
                      <BoxRow
                        key={box.code}
                        box={box}
                        isActive={false}
                        isSelected={selectedCode === box.code}
                        onSelect={() => box.available && setSelectedCode(box.code)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      ) : closingStage > 0 ? (

        /* CLOSING FLOW — layout: flujo (izq) + timeline (der) */
        <div className="flex min-h-0 flex-1 overflow-hidden rounded-[24px] border border-red-200 bg-[#f8fafd] shadow-[0_4px_18px_rgba(15,23,42,0.04)]">

          {/* ── Panel izquierdo: flujo operacional ── */}
          <div className="flex min-h-0 flex-1 flex-col border-r border-[#fef2f2]">

            {/* Header */}
            <div className="shrink-0 border-b border-[#fecaca] px-5 py-2.5 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-red-400">CERRANDO TURNO</span>
              <span className="text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[#b0bac8]">
                {closingStage === 1 ? "CONTEXTO"
                 : closingStage === 2 ? "CONTEO"
                 : closingStage === 3 ? "VALIDACIÓN"
                 : closingStage === 4 ? "CONCILIACIÓN"
                 : "CIERRE"}
              </span>
            </div>

            {/* Content por stage */}
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3.5">

              {/* ── STAGE 1: CONTEXTO ── */}
              {closingStage === 1 && (
                <>
                  <p className="text-[11px] text-[#6b7280] leading-relaxed">
                    Revisa los movimientos del turno antes de iniciar el conteo físico.
                  </p>

                  {/* Componentes auto-integrados — solo validación visual */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[8.5px] font-bold uppercase tracking-[0.14em] text-[#c0cad4]">Registrado operacionalmente</span>
                    <div className="flex flex-col divide-y divide-[#f1f5f9] rounded-xl border border-[#e4e9f0] bg-white overflow-hidden">
                      <div className="flex justify-between items-center px-3.5 py-2">
                        <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">FONDO APERTURA</span>
                        <span className="text-[11.5px] font-bold tabular-nums text-[#374151]">S/ {apertura.toFixed(2)}</span>
                      </div>
                      {ingresosTotal > 0 && (
                        <div className="flex justify-between items-center px-3.5 py-2">
                          <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">INGRESOS ↑</span>
                          <span className="text-[11.5px] font-semibold tabular-nums text-emerald-600">+S/ {ingresosTotal.toFixed(2)}</span>
                        </div>
                      )}
                      {egresosTotal > 0 && (
                        <div className="flex justify-between items-center px-3.5 py-2">
                          <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">EGRESOS ↓</span>
                          <span className="text-[11.5px] font-semibold tabular-nums text-red-500">−S/ {egresosTotal.toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actividad comercial */}
                  {sessionStats.count > 0 && (
                    <div className="flex justify-between items-center rounded-xl border border-[#e4e9f0] bg-white px-3.5 py-2">
                      <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">VENTAS</span>
                      <span className="text-[11.5px] font-semibold tabular-nums text-[#374151]">{sessionStats.count} op. · S/ {sessionStats.total.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Total operacional a conciliar — excluye fondo apertura */}
                  <div className="flex justify-between items-center rounded-xl border border-[#dbeafe] bg-[#eff6ff] px-3.5 py-2">
                    <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#3b82f6]">A CONCILIAR</span>
                    <span className="text-[12px] font-bold tabular-nums text-[#2154d8]">S/ {totalEsperado.toFixed(2)}</span>
                  </div>
                </>
              )}

              {/* ── STAGE 2: CONTEO ── */}
              {closingStage === 2 && (
                <>
                  {/* Referencia auto-integrada — no editable, solo contexto */}
                  <div className="flex items-center gap-2 rounded-xl border border-[#e4e9f0] bg-[#f8fafd] px-3 py-2">
                    <span className="shrink-0 text-[8.5px] font-bold uppercase tracking-[0.12em] text-[#c0cad4]">Auto</span>
                    <div className="h-3 w-px shrink-0 bg-[#e4e9f0]" />
                    <span className="text-[10px] font-medium tabular-nums text-[#b0bac8]">fondo {apertura.toFixed(2)} <span className="text-[8.5px]">(ref.)</span></span>
                    {(ingresosTotal > 0 || egresosTotal > 0) && <div className="h-3 w-px shrink-0 bg-[#e4e9f0]" />}
                    {ingresosTotal > 0 && (
                      <span className="text-[10px] font-semibold tabular-nums text-emerald-600">↑ {ingresosTotal.toFixed(2)}</span>
                    )}
                    {egresosTotal > 0 && (
                      <span className="text-[10px] font-semibold tabular-nums text-red-400">↓ {egresosTotal.toFixed(2)}</span>
                    )}
                  </div>

                  <p className="text-[11px] text-[#6b7280] leading-relaxed">
                    Cuenta físicamente el efectivo. <strong className="text-[#374151]">No se muestra el monto esperado.</strong>
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
                            <span className="w-[64px] shrink-0 text-[9.5px] font-bold uppercase tracking-[0.13em] text-[#9ca3af]">{label}</span>
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
                  {contadoTotal > 0 && (
                    <div className="flex justify-between items-center rounded-xl border border-[#e4e9f0] bg-white px-3.5 py-2">
                      <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">TOTAL CONTADO</span>
                      <span className="text-[13px] font-bold tabular-nums text-[#374151]">S/ {contadoTotal.toFixed(2)}</span>
                    </div>
                  )}
                  <p className="text-[10px] text-[#c0cad4]">
                    <span className="font-mono bg-[#f1f5f9] px-1 rounded">F9</span> validar ·{" "}
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
                      <p className="text-[10.5px] font-bold uppercase tracking-wide text-emerald-700">CONTEO VALIDADO</p>
                      {validatedAt && (
                        <p className="text-[9px] font-mono text-emerald-600 tabular-nums">
                          {new Date(validatedAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col divide-y divide-[#f1f5f9] rounded-xl border border-[#e4e9f0] bg-white overflow-hidden">
                    {[
                      { label: "EFECTIVO",  val: contadoEfeNum  },
                      { label: "YAPE",      val: contadoYapeNum },
                      { label: "TARJETAS",  val: contadoTarNum  },
                    ].map(({ label, val }) => (
                      <div key={label} className="flex justify-between items-center px-3.5 py-1.5">
                        <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">{label}</span>
                        <span className="text-[11px] font-semibold tabular-nums text-[#374151]">S/ {val.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center px-3.5 py-2 bg-[#f8fafd]">
                      <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#374151]">TOTAL</span>
                      <span className="text-[13px] font-bold tabular-nums text-[#374151]">S/ {contadoTotal.toFixed(2)}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-[#c0cad4]">
                    Tecla <span className="font-mono bg-[#f1f5f9] px-1 rounded">F10</span> para conciliar · <span className="font-mono bg-[#f1f5f9] px-1 rounded">F4</span> para recontar
                  </p>
                </>
              )}

              {/* ── STAGE 4: CONCILIACIÓN ── */}
              {closingStage === 4 && (
                <>
                  <p className="text-[11px] text-[#6b7280] leading-relaxed">
                    Confirma el arqueo para oficializar el cierre.
                  </p>
                  <div className="flex flex-col divide-y divide-[#f1f5f9] rounded-xl border border-amber-200 bg-white overflow-hidden">
                    {[
                      { label: "EFECTIVO",  val: contadoEfeNum  },
                      { label: "YAPE",      val: contadoYapeNum },
                      { label: "TARJETAS",  val: contadoTarNum  },
                    ].map(({ label, val }) => (
                      <div key={label} className="flex justify-between items-center px-3.5 py-1.5">
                        <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">{label}</span>
                        <span className="text-[11px] font-semibold tabular-nums text-[#374151]">S/ {val.toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between items-center px-3.5 py-2.5 bg-[#fffbf0]">
                      <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#92400e]">TOTAL ARQUEO</span>
                      <span className="text-[14px] font-bold tabular-nums text-[#92400e]">S/ {contadoTotal.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Conciliación operacional */}
                  {(() => {
                    const diffAbs  = Math.abs(diferencia);
                    const cuadrado = diffAbs < 0.01;
                    const sobrante = !cuadrado && diferencia > 0;
                    return (
                      <div className={`flex flex-col gap-1.5 rounded-xl border px-3.5 py-2.5 ${
                        cuadrado ? "border-emerald-200 bg-[#f0fdf4]" : sobrante ? "border-[#dbeafe] bg-[#eff6ff]" : "border-red-200 bg-[#fef2f2]"
                      }`}>
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">Esperado oper.</span>
                          <span className="text-[10.5px] font-semibold tabular-nums text-[#374151]">S/ {totalEsperado.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${
                            cuadrado ? "text-emerald-600" : sobrante ? "text-[#2154d8]" : "text-red-600"
                          }`}>
                            {cuadrado ? "✓ CUADRADO" : sobrante ? "SOBRANTE" : "FALTANTE"}
                          </span>
                          <span className={`text-[13px] font-bold tabular-nums ${
                            cuadrado ? "text-emerald-600" : sobrante ? "text-[#2154d8]" : "text-red-600"
                          }`}>
                            {cuadrado ? "±S/ 0.00" : `${diferencia >= 0 ? "+" : "−"}S/ ${diffAbs.toFixed(2)}`}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
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
                          <p className="text-[9.5px] text-amber-600 mt-0.5 leading-snug">Evento operacional excepcional. Motivo requerido.</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">
                          Motivo <span className="text-amber-500">*</span>
                        </span>
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
                      <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">CAJA</span>
                      <span className="text-[11px] font-bold text-[#374151]">CAJA {activeBox?.code}</span>
                    </div>
                    <div className="flex justify-between items-center px-3.5 py-1.5">
                      <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">OPERADOR</span>
                      <span className="text-[11px] font-semibold text-[#374151]">{operator}</span>
                    </div>
                    {sessionStats.count > 0 && (
                      <div className="flex justify-between items-center px-3.5 py-1.5">
                        <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">VENTAS</span>
                        <span className="text-[11px] font-semibold tabular-nums text-[#374151]">{sessionStats.count} op.</span>
                      </div>
                    )}
                    <div className={`flex justify-between items-center px-3.5 py-2 ${contadoTotal > 0 ? "bg-[#f8fafd]" : "bg-[#fffbf0]"}`}>
                      <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#374151]">CONTEO TOTAL</span>
                      <span className={`text-[13px] font-bold tabular-nums ${contadoTotal > 0 ? "text-emerald-600" : "text-amber-600"}`}>
                        S/ {contadoTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <span className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">Observaciones (opcional)</span>
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
          </div>

          {/* ── Panel derecho: timeline + snapshot ── */}
          <div className="flex w-[152px] shrink-0 flex-col px-4 py-4 gap-4">

            <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#c0cad4]">PROCESO</span>

            {/* Timeline */}
            <div className="flex flex-col">
              {([
                { s: 1, label: "CONTEXTO" },
                { s: 2, label: "CONTEO" },
                { s: 3, label: "VALIDACIÓN" },
                { s: 4, label: "CONCILIACIÓN" },
                { s: 5, label: "CIERRE" },
              ] as const).map((step, idx) => {
                const done   = closingStage > step.s;
                const active = closingStage === step.s;
                return (
                  <div key={step.s} className="flex items-start gap-2">
                    <div className="flex flex-col items-center" style={{ minWidth: 8 }}>
                      <div className={`mt-[3px] h-2 w-2 shrink-0 rounded-full transition-colors ${
                        done ? "bg-emerald-500" : active ? "bg-[#2154d8]" : "bg-[#e4e9f0]"
                      }`} />
                      {idx < 4 && <div className={`w-px mt-0.5 h-4 ${done ? "bg-emerald-300" : "bg-[#e4e9f0]"}`} />}
                    </div>
                    <span className={`pb-2 text-[9px] font-bold uppercase tracking-[0.10em] leading-tight ${
                      done ? "text-emerald-600" : active ? "text-[#2154d8]" : "text-[#c0cad4]"
                    }`}>
                      {done ? "✓ " : ""}{step.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Separator */}
            <div className="-mx-4 h-px bg-[#fef2f2]" />

            {/* Session snapshot */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[9px] font-bold uppercase tracking-[0.18em] text-[#c0cad4]">TURNO</span>
              <span className="text-[10.5px] font-bold text-[#374151]">CAJA {activeBox?.code}</span>
              <span className="text-[9.5px] text-[#9ca3af] leading-tight">{operator}</span>
              {sessionStats.count > 0 && (
                <span className="text-[9px] tabular-nums text-[#b0bac8]">{sessionStats.count} op.</span>
              )}
              {openedAt && (
                <span className="text-[9px] font-mono tabular-nums text-[#b0bac8]">{formatTime(openedAt)}</span>
              )}
            </div>

          </div>

        </div>

      ) : (

        /* MOVEMENTS — 45/55 operational split */
        <div className="flex min-h-0 flex-1 overflow-hidden rounded-[24px] border border-[#e4e9f0] bg-[#f8fafd] shadow-[0_4px_18px_rgba(15,23,42,0.04)]">

          {/* ─── LEFT: form operacional (45%) ─── */}
          <div className="flex w-[45%] shrink-0 flex-col border-r border-[#f1f5f9]">

            <div className="shrink-0 border-b border-[#f1f5f9] px-4 py-2 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9ca3af]">Movimientos</span>
              {cashMoves.length > 0 && (
                <div className="flex items-center gap-2.5">
                  {ingresosTotal > 0 && <span className="text-[10px] font-bold text-emerald-600 tabular-nums">↑ S/ {ingresosTotal.toFixed(2)}</span>}
                  {egresosTotal  > 0 && <span className="text-[10px] font-bold text-red-500 tabular-nums">↓ S/ {egresosTotal.toFixed(2)}</span>}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 px-4 py-3">

              {/* Tipo */}
              <div className="flex gap-px rounded-xl bg-[#f1f5f9] p-0.5">
                {(["ingreso", "egreso"] as MoveType[]).map(t => (
                  <button key={t}
                    onClick={() => { setMoveType(t); setMoveMotivo(""); setMoveObservacion(""); setSourceType("apertura"); setLastMove(null); }}
                    className={`flex-1 rounded-[9px] py-1 text-[11px] font-bold uppercase tracking-wide transition ${
                      moveType === t
                        ? t === "ingreso" ? "bg-emerald-600 text-white shadow-sm" : "bg-red-500 text-white shadow-sm"
                        : "text-[#9ca3af] hover:text-[#374151]"
                    }`}
                  >
                    {t === "ingreso" ? "↑ INGRESO" : "↓ EGRESO"}
                  </button>
                ))}
              </div>

              {/* Monto + Origen */}
              <div className="flex items-stretch gap-2">
                <div className="flex flex-col gap-0.5 w-[120px] shrink-0">
                  <span className="text-[9.5px] font-bold uppercase tracking-[0.13em] text-[#9ca3af]">MONTO</span>
                  <div className="flex items-center gap-1 flex-1">
                    <span className="shrink-0 text-[10px] font-bold text-[#9ca3af]">S/</span>
                    <input
                      ref={moveAmountRef}
                      type="number"
                      value={moveAmount}
                      onChange={e => setMoveAmount(e.target.value)}
                      onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); motivoRef.current?.focus(); } }}
                      placeholder="0.00"
                      min="0.01"
                      step="0.01"
                      className="w-full min-w-0 rounded-xl border border-[#e4e9f0] px-2 py-1.5 text-[18px] font-bold text-[#2F3E46] outline-none placeholder:text-[#d1d9e1] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/15"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="text-[9.5px] font-bold uppercase tracking-[0.13em] text-[#9ca3af]">ORIGEN</span>
                  <div className="flex gap-1 flex-1">
                    {([
                      { src: "apertura" as MoveSource, label: "FONDO APT.", Icon: Wallet },
                      { src: "vendido"  as MoveSource, label: "FONDO VENTA", Icon: ShoppingCart },
                    ]).map(({ src, label, Icon }) => (
                      <button key={src}
                        onClick={() => setSourceType(src)}
                        className={`flex-1 flex items-center justify-center gap-1 rounded-lg py-1.5 text-[9px] font-bold uppercase tracking-wide transition ${
                          sourceType === src
                            ? "bg-[#2154d8] text-white"
                            : "border border-[#e4e9f0] text-[#374151] hover:border-[#c7d7f4] hover:bg-[#f0f5ff]"
                        }`}
                      >
                        <Icon size={10} strokeWidth={2} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Motivo */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[9.5px] font-bold uppercase tracking-[0.13em] text-[#9ca3af]">
                  MOTIVO <span className="text-red-400">*</span>
                </span>
                <input
                  ref={motivoRef}
                  type="text"
                  value={moveMotivo}
                  onChange={e => setMoveMotivo(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && canAddMove) handleAddMove(); }}
                  placeholder={moveType === "egreso"
                    ? "Ej: Pago mototaxi, pago proveedor..."
                    : "Ej: Sencillo monedas, devolución..."}
                  maxLength={120}
                  className="w-full rounded-xl border border-[#e4e9f0] px-3 py-1.5 text-[12px] text-[#374151] outline-none placeholder:text-[#d1d9e1] focus:border-emerald-400 focus:ring-2 focus:ring-emerald-400/15"
                />
              </div>

              {/* Observación */}
              <input
                type="text"
                value={moveObservacion}
                onChange={e => setMoveObservacion(e.target.value)}
                placeholder="Observación operacional (opcional)"
                maxLength={200}
                className="w-full rounded-xl border border-[#e4e9f0] px-3 py-1.5 text-[11px] text-[#374151] outline-none placeholder:text-[#d1d9e1] focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/15"
              />

              {/* Registrar */}
              <button
                onClick={handleAddMove}
                disabled={!canAddMove}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-2 text-[12px] font-bold uppercase tracking-wide transition ${
                  canAddMove
                    ? moveType === "ingreso"
                      ? "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:scale-[0.98]"
                      : "bg-red-500 text-white shadow-sm hover:bg-red-600 active:scale-[0.98]"
                    : "bg-[#f1f5f9] text-[#c8d4e0] cursor-not-allowed"
                }`}
              >
                {moveType === "ingreso" ? "REGISTRAR INGRESO" : "REGISTRAR EGRESO"}
              </button>

              {/* Feedback */}
              {lastMove && (
                <div className="flex items-center gap-2 rounded-xl bg-[#f8fafd] border border-emerald-200 px-3 py-1.5">
                  <CheckCircle size={11} className="text-emerald-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Movimiento registrado</p>
                    <p className="text-[9.5px] text-[#9ca3af] truncate">
                      {lastMove.type === "ingreso" ? "↑" : "↓"} S/ {lastMove.amount.toFixed(2)} · {lastMove.motivo}
                    </p>
                  </div>
                  <button onClick={() => void handlePrintVoucher(lastMove)}
                    className="flex items-center gap-1 rounded-lg border border-emerald-200 px-2 py-1 text-[9.5px] font-bold uppercase tracking-wide text-emerald-700 transition hover:bg-[#f0fdf4]"
                  >
                    <Printer size={9} strokeWidth={2} /> Imprimir
                  </button>
                </div>
              )}

            </div>
          </div>

          {/* ─── RIGHT: timeline operacional (55%) ─── */}
          <div className="flex min-h-0 flex-1 flex-col">

            <div className="shrink-0 border-b border-[#f1f5f9] px-4 py-2 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[#9ca3af]">Histórico</span>
              {cashMoves.length > 0 && (
                <span className="text-[9px] font-semibold text-[#c0cad4] tabular-nums">{cashMoves.length} mov.</span>
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
              {cashMoves.length === 0 ? (
                <p className="py-8 text-center text-[10.5px] text-[#c8d4e0]">Sin movimientos en este turno</p>
              ) : (() => {
                const reposByEgresoId = cashMoves.reduce<Record<string, CashMove[]>>((acc, m) => {
                  if (m.refId) { (acc[m.refId] ??= []).push(m); }
                  return acc;
                }, {});
                const primaryMoves = [...cashMoves].reverse().filter(m => !m.refId);
                return (
                  <div className="flex flex-col gap-px">
                    {primaryMoves.map(m => {
                      const ts = new Date(m.timestamp);
                      const hm = `${String(ts.getHours()).padStart(2, "0")}:${String(ts.getMinutes()).padStart(2, "0")}`;
                      const srcLabel = m.sourceType === "mixto"
                        ? `fondo S/${m.fromApertura.toFixed(0)} · vnd S/${m.fromVendido.toFixed(0)}`
                        : m.sourceType === "apertura" ? "fondo" : "venta";
                      const linkedRepos: CashMove[] = m.type === "egreso" ? (reposByEgresoId[m.id] ?? []) : [];
                      const isRepoing = reposingMoveId === m.id;
                      const canRepo   = parseFloat(repoAmount) > 0 && repoMotivo.trim().length > 0;
                      return (
                        <div key={m.id} className="group/move">
                          {/* Fila principal */}
                          <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-white">
                            <span className="shrink-0 w-[28px] text-[9px] font-mono tabular-nums text-[#c0cad4]">{hm}</span>
                            <span className={`shrink-0 text-[11px] font-bold ${m.type === "ingreso" ? "text-emerald-500" : "text-red-400"}`}>
                              {m.type === "ingreso" ? "↑" : "↓"}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-semibold text-[#374151] truncate">{m.motivo}</p>
                              <p className="text-[9.5px] text-[#c0cad4] truncate">{srcLabel}{m.observacion ? ` · ${m.observacion}` : ""}</p>
                            </div>
                            <span className={`shrink-0 text-[11px] font-bold tabular-nums ${m.type === "ingreso" ? "text-emerald-600" : "text-red-500"}`}>
                              {m.type === "ingreso" ? "+" : "−"}S/ {m.amount.toFixed(2)}
                            </span>
                            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover/move:opacity-100 transition">
                              <button onClick={() => void handlePrintVoucher(m)} title="Imprimir voucher"
                                className="text-[#c0cad4] hover:text-[#2154d8]"
                              >
                                <Printer size={11} strokeWidth={2} />
                              </button>
                              {m.type === "egreso" && (
                                <button
                                  onClick={() => isRepoing ? closeRepo() : openRepo(m)}
                                  title="Registrar reposición"
                                  className={`transition ${isRepoing ? "text-emerald-500" : "text-[#c0cad4] hover:text-emerald-500"}`}
                                >
                                  <RotateCcw size={11} strokeWidth={2} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Reposiciones vinculadas — compactas, anidadas */}
                          {linkedRepos.map(repo => {
                            const rts = new Date(repo.timestamp);
                            const rhm = `${String(rts.getHours()).padStart(2, "0")}:${String(rts.getMinutes()).padStart(2, "0")}`;
                            return (
                              <div key={repo.id} className="group/repo ml-10 flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white">
                                <span className="shrink-0 text-[9px] font-bold text-emerald-500">↩</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-[10px] font-semibold text-emerald-700 truncate">{repo.motivo}</p>
                                </div>
                                <span className="shrink-0 text-[9px] font-mono tabular-nums text-[#c0cad4]">{rhm}</span>
                                <span className="shrink-0 text-[10px] font-bold text-emerald-600 tabular-nums">+S/ {repo.amount.toFixed(2)}</span>
                                <button
                                  onClick={() => void handlePrintVoucher(repo)}
                                  className="shrink-0 opacity-0 group-hover/repo:opacity-100 text-[#c0cad4] hover:text-emerald-500 transition"
                                >
                                  <Printer size={10} strokeWidth={2} />
                                </button>
                              </div>
                            );
                          })}

                          {/* Formulario inline reposición */}
                          {isRepoing && (
                            <div className="mx-2 mb-1 mt-0.5 flex flex-col gap-1.5 rounded-xl border border-emerald-200 bg-[#f8fafd] px-3 py-2.5">
                              {lastRepoMove ? (
                                <>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                      <CheckCircle size={11} className="text-emerald-500 shrink-0" />
                                      <span className="text-[9.5px] font-bold uppercase tracking-wide text-emerald-700">Reposición registrada</span>
                                    </div>
                                    <button onClick={closeRepo} className="text-[#9ca3af] hover:text-[#374151] transition"><X size={12} /></button>
                                  </div>
                                  <p className="text-[9.5px] text-emerald-600 tabular-nums">↑ S/ {lastRepoMove.amount.toFixed(2)} · {lastRepoMove.motivo}</p>
                                  <button
                                    onClick={() => void handlePrintVoucher(lastRepoMove)}
                                    className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-emerald-300 bg-white py-1.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700 transition hover:bg-emerald-100 active:scale-[0.98]"
                                  >
                                    <Printer size={10} strokeWidth={2} /> Reimprimir voucher
                                  </button>
                                </>
                              ) : (
                                <>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9.5px] font-bold uppercase tracking-wide text-emerald-700">Reposición</span>
                                    <button onClick={closeRepo} className="text-[#9ca3af] hover:text-[#374151] transition"><X size={12} /></button>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[9.5px] font-bold text-[#9ca3af]">S/</span>
                                    <input
                                      ref={repoAmountRef}
                                      type="number"
                                      value={repoAmount}
                                      onChange={e => setRepoAmount(e.target.value)}
                                      placeholder={m.amount.toFixed(2)}
                                      min="0.01" step="0.01"
                                      className="w-[100px] rounded-lg border border-emerald-200 bg-white px-2 py-1 text-[14px] font-bold text-[#2F3E46] outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20"
                                    />
                                  </div>
                                  <input
                                    type="text"
                                    value={repoMotivo}
                                    onChange={e => setRepoMotivo(e.target.value)}
                                    onKeyDown={e => { if (e.key === "Enter" && canRepo) handleReposicion(); if (e.key === "Escape") closeRepo(); }}
                                    placeholder="Ej: Devolución mototaxi, reposición..."
                                    maxLength={120}
                                    className="w-full rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-[11px] text-[#374151] outline-none placeholder:text-[#c8d4e0] focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20"
                                  />
                                  <input
                                    type="text"
                                    value={repoObservacion}
                                    onChange={e => setRepoObservacion(e.target.value)}
                                    placeholder="Observación (opcional)"
                                    maxLength={200}
                                    className="w-full rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-[11px] text-[#374151] outline-none placeholder:text-[#c8d4e0] focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400/20"
                                  />
                                  <button
                                    onClick={handleReposicion}
                                    disabled={!canRepo}
                                    className={`flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[10.5px] font-bold uppercase tracking-wide transition ${
                                      canRepo
                                        ? "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98]"
                                        : "bg-[#f1f5f9] text-[#c8d4e0] cursor-not-allowed"
                                    }`}
                                  >
                                    <RotateCcw size={10} strokeWidth={2} /> Registrar reposición
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>

          </div>

        </div>
      )}

    </section>
  );
}
