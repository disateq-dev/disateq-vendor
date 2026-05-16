import { useState, useEffect, useRef } from "react";
import { Clock, LogIn, LogOut, Lock, CheckCircle, Printer, AlertTriangle, FileText, X } from "lucide-react";
import { usePOS, type CashBox, type MoveType, type MoveSource, type CashMove, type OpLog } from "../../context/POSContext";
import { printCashMoveVoucher } from "../../print/printTicket";
import { calcConciliation } from "./services/cash-conciliation.service";
import {
  prereqCode, operatorFromCode, isContingencyBox,
  canOpenSession, validateMixto, validateCanAddMove,
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

function fmtTs(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// ── constants ──────────────────────────────────────────────────

const SERIES = ["1", "2", "3", "5"] as const;

type ClosingStage = 0 | 1 | 2 | 3 | 4;

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
  if (isActive)        cls += " bg-emerald-50 ring-1 ring-emerald-200";
  else if (isSelected) cls += " bg-[#edf4ff] ring-1 ring-[#2154d8]/20";
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

function LogEntry({ log }: { log: OpLog }) {
  return (
    <div className="flex items-start gap-2.5 px-3 py-1.5 hover:bg-[#f8fafd] rounded-xl">
      <span className="shrink-0 mt-0.5 text-[9px] font-mono text-[#c0cad4] tabular-nums">{fmtTs(log.ts)}</span>
      <span className="text-[10.5px] text-[#374151] leading-snug">{log.text}</span>
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
    openCashSession, closeCashSession,
    sessionStats, cashMoves, addCashMove,
    opLogs, showNotice,
  } = usePOS();
  const { isOpen, cashBox: activeBox, operator, terminal, openedAt, apertura, motivo: sessionMotivo } = cashSession;

  // ── pre-open state ────────────────────────────────────────────
  const [selectedCode, setSelectedCode] = useState<string>(() => suggestedCashBox?.code ?? "100");
  const [aperturaInput, setAperturaInput] = useState("");
  const [ctgPin,        setCtgPin]        = useState("");
  const [ctgJustif,     setCtgJustif]     = useState("");
  const [ctgPinError,   setCtgPinError]   = useState(false);
  const aperturaRef = useRef<HTMLInputElement>(null);

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
    if (!isOpen) return 0; // no session → no closing in progress
    try {
      const n = parseInt(localStorage.getItem("disateq.pos.ui.closingStage") ?? "0", 10);
      return ([0,1,2,3,4].includes(n) ? n : 0) as ClosingStage;
    } catch { return 0; }
  });
  const [contado, setContado] = useState(() => {
    if (!isOpen) return "";
    try {
      const stage = parseInt(localStorage.getItem("disateq.pos.ui.closingStage") ?? "0", 10);
      return stage >= 1 ? (localStorage.getItem("disateq.pos.ui.contado") ?? "") : "";
    } catch { return ""; }
  });
  const [observations, setObservations] = useState("");
  const contadoRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (closingStage > 0) localStorage.setItem("disateq.pos.ui.closingStage", String(closingStage));
    else localStorage.removeItem("disateq.pos.ui.closingStage");
  }, [closingStage]);

  useEffect(() => {
    if (contado) localStorage.setItem("disateq.pos.ui.contado", contado);
    else localStorage.removeItem("disateq.pos.ui.contado");
  }, [contado]);

  useEffect(() => {
    if (!isOpen) {
      setClosingStage(0); setContado(""); setObservations("");
      localStorage.removeItem("disateq.pos.ui.closingStage");
      localStorage.removeItem("disateq.pos.ui.contado");
      setAperturaInput(""); setCtgPin(""); setCtgJustif(""); setCtgPinError(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen && suggestedCashBox) setSelectedCode(suggestedCashBox.code);
  }, [isOpen, suggestedCashBox]);

  // ── movements state ───────────────────────────────────────────
  const [logOpen, setLogOpen] = useState(false);
  const [moveType,       setMoveType]       = useState<MoveType>("ingreso");
  const [moveAmount,     setMoveAmount]     = useState("");
  const [moveMotivo,     setMoveMotivo]     = useState("");
  const [moveObservacion,setMoveObservacion]= useState("");
  const [sourceType,     setSourceType]     = useState<MoveSource>("apertura");
  const [mixApertura,    setMixApertura]    = useState("");
  const [mixVendido,     setMixVendido]     = useState("");
  const [lastMove,       setLastMove]       = useState<CashMove | null>(null);
  const moveAmountRef = useRef<HTMLInputElement>(null);
  const motivoRef     = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLastMove(null); setMoveAmount(""); setMoveMotivo(""); setMoveObservacion("");
    setSourceType("apertura"); setMixApertura(""); setMixVendido("");
    setLogOpen(false);
  }, [isOpen]);

  useEffect(() => {
    if (closingStage > 0) setLogOpen(false);
  }, [closingStage]);

  useEffect(() => {
    if (!logOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); setLogOpen(false); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [logOpen]);

  // ── derived ───────────────────────────────────────────────────
  const selectedBox   = isOpen ? activeBox : (cashBoxes.find(b => b.code === selectedCode) ?? null);
  const isContingency = isContingencyBox(selectedBox);
  const canOpen       = canOpenSession(isOpen, selectedBox, aperturaInput, isContingency, ctgPin, ctgJustif);

  // move form derived
  const totalAmt   = parseFloat(moveAmount) || 0;
  const mixAptNum  = parseFloat(mixApertura) || 0;
  const mixVndNum  = parseFloat(mixVendido)  || 0;
  const mixtoValid = sourceType !== "mixto" || validateMixto(totalAmt, mixAptNum, mixVndNum);
  const canAddMove = validateCanAddMove(totalAmt, moveMotivo, sourceType, mixAptNum, mixVndNum);

  // fondo breakdown — delegated to service
  const {
    ingApertura, egApertura, ingVendido, egVendido,
    ingresosTotal, egresosTotal,
    fondoApertEsp, fondoVendidoEsp, efectivoEsperado,
  } = calcConciliation(cashMoves, sessionStats.cash, apertura);
  const contadoNum = parseFloat(contado) || 0;
  const diferencia = contadoNum - efectivoEsperado;

  // ── handlers ──────────────────────────────────────────────────

  function handleOpen() {
    if (!selectedBox?.available) return;
    if (isContingency) {
      if (ctgPin !== CTG_PIN) { setCtgPinError(true); return; }
      if (!ctgJustif) return;
    }
    const amt = parseFloat(aperturaInput) || 0;
    openCashSession(selectedBox.code, amt, isContingency ? ctgJustif.trim() : undefined);
    onOpened?.();
  }

  function handleAddMove() {
    if (!canAddMove) return;
    const amt = totalAmt;
    let fa = 0, fv = 0;
    if (sourceType === "apertura") { fa = amt; fv = 0; }
    else if (sourceType === "vendido") { fa = 0; fv = amt; }
    else { fa = mixAptNum; fv = mixVndNum; }
    const obs = moveObservacion.trim() || undefined;
    const move = addCashMove(moveType, amt, moveMotivo.trim(), sourceType, fa, fv, obs);
    setLastMove(move);
    setMoveAmount(""); setMoveMotivo(""); setMoveObservacion("");
    setMixApertura(""); setMixVendido("");
    showNotice(`${moveType === "ingreso" ? "Ingreso" : "Egreso"} registrado · S/ ${amt.toFixed(2)}`);
    setTimeout(() => moveAmountRef.current?.focus(), 10);
  }

  function handlePrintVoucher(move: CashMove) {
    const ts = new Date(move.timestamp);
    const p  = (n: number) => String(n).padStart(2, "0");
    printCashMoveVoucher({
      businessName: "DISATEQ TIENDA",
      moveType:     move.type,
      amount:       move.amount,
      motivo:       move.motivo,
      observacion:  move.observacion,
      operator:     move.operator,
      cashBoxCode:  move.cashBoxCode,
      terminal:     move.terminal,
      dateTime:     `${p(ts.getDate())}/${p(ts.getMonth() + 1)}/${ts.getFullYear()} ${p(ts.getHours())}:${p(ts.getMinutes())}`,
    });
  }

  function handleConfirmClose() {
    closeCashSession();
    setClosingStage(0);
    setContado("");
    setObservations("");
    localStorage.removeItem("disateq.pos.ui.closingStage");
    localStorage.removeItem("disateq.pos.ui.contado");
  }

  // ── render ────────────────────────────────────────────────────

  return (
    <section className="flex min-h-0 flex-1 gap-3">

      {/* ── LEFT ── */}
      <div className="flex w-[300px] shrink-0 flex-col gap-3">

        {/* Status / pre-open card */}
        {isOpen ? (
          <div className={`flex flex-col gap-4 rounded-[24px] border bg-white px-5 py-5 shadow-[0_4px_18px_rgba(15,23,42,0.04)] ${
            closingStage > 0 ? "border-red-200" : "border-emerald-200"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] ${
                closingStage > 0 ? "bg-red-50 text-red-500" : "bg-emerald-50 text-emerald-600"
              }`}>
                {closingStage > 0 ? <LogOut size={20} strokeWidth={1.5} /> : <Clock size={20} strokeWidth={1.5} />}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${closingStage > 0 ? "bg-red-400" : "bg-emerald-500"}`} />
                  <span className={`text-[10.5px] font-bold uppercase tracking-widest ${closingStage > 0 ? "text-red-500" : "text-emerald-600"}`}>
                    {closingStage > 0 ? `CERRANDO TURNO · ${closingStage}/4` : "TURNO ABIERTO"}
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
              {apertura > 0 && <InfoRow label="Fondo" value={`S/ ${apertura.toFixed(2)}`} />}
              {sessionMotivo && <InfoRow label="Motivo turno" value={sessionMotivo} />}

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
          <div className="flex flex-col gap-4 rounded-[24px] border border-[#e4e9f0] bg-white px-5 py-5 shadow-[0_4px_18px_rgba(15,23,42,0.04)]">
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
              <span className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#b0bac8]">Fondo inicial S/</span>
              <input
                ref={aperturaRef}
                type="number"
                value={aperturaInput}
                onChange={e => setAperturaInput(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && canOpen) handleOpen(); }}
                placeholder="0.00"
                min="0"
                step="0.50"
                className="w-full rounded-xl border border-[#e4e9f0] px-3.5 py-2.5 text-[20px] font-bold text-[#2F3E46] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
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
                onClick={() => { setClosingStage(1); setContado(""); setTimeout(() => contadoRef.current?.focus(), 50); }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#fca5a5] bg-[#fef2f2] py-3 text-[13px] font-semibold text-red-600 transition hover:bg-red-50 active:scale-[0.98]"
              >
                <LogOut size={14} strokeWidth={2} />
                Cierre de turno
              </button>
            </>

          ) : closingStage === 1 ? (
            <>
              <button
                onClick={() => setClosingStage(2)}
                disabled={contado === ""}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[13px] font-bold uppercase tracking-widest transition ${
                  contado !== ""
                    ? "bg-[#2154d8] text-white shadow-[0_4px_14px_rgba(33,84,216,0.24)] hover:bg-[#1a44be] active:scale-[0.98]"
                    : "cursor-not-allowed bg-[#f4f7fb] text-[#c8d4e0]"
                }`}
              >
                Continuar →
              </button>
              <button
                onClick={() => { setClosingStage(0); setContado(""); }}
                className="flex w-full items-center justify-center rounded-2xl border border-[#e4e9f0] bg-white py-2.5 text-[12px] font-semibold text-[#374151] hover:bg-[#f8fafd]"
              >
                Cancelar
              </button>
            </>

          ) : closingStage === 2 ? (
            <>
              <button
                onClick={() => setClosingStage(3)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#2154d8] py-3.5 text-[13px] font-bold uppercase tracking-widest text-white shadow-[0_4px_14px_rgba(33,84,216,0.24)] transition hover:bg-[#1a44be] active:scale-[0.98]"
              >
                Conciliar →
              </button>
              <button
                onClick={() => { setClosingStage(1); setTimeout(() => contadoRef.current?.focus(), 50); }}
                className="flex w-full items-center justify-center rounded-2xl border border-[#e4e9f0] bg-white py-2.5 text-[12px] font-semibold text-[#374151] hover:bg-[#f8fafd]"
              >
                ← Corregir conteo
              </button>
            </>

          ) : closingStage === 3 ? (
            <>
              <button
                onClick={() => setClosingStage(4)}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-3.5 text-[13px] font-bold uppercase tracking-widest text-white shadow-[0_4px_14px_rgba(220,38,38,0.24)] transition hover:bg-red-700 active:scale-[0.98]"
              >
                <CheckCircle size={14} strokeWidth={2.5} />
                Confirmar cierre
              </button>
              <button
                onClick={() => { setClosingStage(1); setTimeout(() => contadoRef.current?.focus(), 50); }}
                className="flex w-full items-center justify-center rounded-2xl border border-[#e4e9f0] bg-white py-2.5 text-[12px] font-semibold text-[#374151] hover:bg-[#f8fafd]"
              >
                ← Rehacer conteo
              </button>
            </>

          ) : /* stage 4 */ (
            <>
              <button
                onClick={handleConfirmClose}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-3.5 text-[13px] font-bold uppercase tracking-widest text-white shadow-[0_4px_14px_rgba(220,38,38,0.24)] transition hover:bg-red-700 active:scale-[0.98]"
              >
                <CheckCircle size={14} strokeWidth={2.5} />
                Cerrar turno
              </button>
              <button
                onClick={() => setClosingStage(0)}
                className="flex w-full items-center justify-center rounded-2xl border border-[#e4e9f0] bg-white py-2.5 text-[12px] font-semibold text-[#374151] hover:bg-[#f8fafd]"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── RIGHT ── */}
      {!isOpen ? (

        /* BOX SELECTOR */
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-[#e4e9f0] bg-white shadow-[0_4px_18px_rgba(15,23,42,0.04)]">
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

        /* CLOSING FLOW */
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-red-200 bg-white shadow-[0_4px_18px_rgba(15,23,42,0.04)]">

          <div className="shrink-0 border-b border-[#fecaca] px-5 py-3 flex items-center justify-between">

            {/* Semáforos operacionales */}
            <div className="flex items-center gap-3 select-none">
              {/* CONTEO */}
              <span className="flex items-center gap-1.5">
                <span className={`h-2 w-2 shrink-0 rounded-full ${closingStage >= 2 ? "bg-emerald-500" : "bg-amber-400"}`} />
                <span className={`text-[9.5px] font-bold uppercase tracking-[0.13em] ${closingStage >= 2 ? "text-emerald-700" : "text-amber-600"}`}>
                  Conteo
                </span>
              </span>
              <span className="text-[#fecaca]">·</span>
              {/* CONCILIACIÓN */}
              <span className="flex items-center gap-1.5">
                <span className={`h-2 w-2 shrink-0 rounded-full ${
                  closingStage >= 3
                    ? Math.abs(diferencia) < 0.01 ? "bg-emerald-500" : "bg-amber-400"
                    : "bg-red-400"
                }`} />
                <span className={`text-[9.5px] font-bold uppercase tracking-[0.13em] ${
                  closingStage >= 3
                    ? Math.abs(diferencia) < 0.01 ? "text-emerald-700" : "text-amber-600"
                    : "text-red-400"
                }`}>
                  Conciliación
                </span>
              </span>
              <span className="text-[#fecaca]">·</span>
              {/* CIERRE */}
              <span className="flex items-center gap-1.5">
                <span className={`h-2 w-2 shrink-0 rounded-full ${
                  closingStage >= 4
                    ? diferencia >= 0 ? "bg-emerald-500" : "bg-amber-400"
                    : "bg-red-400"
                }`} />
                <span className={`text-[9.5px] font-bold uppercase tracking-[0.13em] ${
                  closingStage >= 4
                    ? diferencia >= 0 ? "text-emerald-700" : "text-amber-600"
                    : "text-red-400"
                }`}>
                  Cierre
                </span>
              </span>
            </div>

            {/* Paso activo */}
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-red-400">
              {closingStage === 1 ? "Conteo ciego" : closingStage === 2 ? "Validar conteo" : closingStage === 3 ? "Conciliación" : "Confirmar cierre"}
            </span>

          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-5">

            {closingStage === 1 && (
              <>
                <p className="text-[12px] text-[#6b7280] leading-relaxed">
                  Ingresa el efectivo que cuentas físicamente en caja. <strong className="text-[#374151]">No se muestra el esperado.</strong>
                </p>
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">Efectivo en caja S/</span>
                  <input
                    ref={contadoRef}
                    autoFocus
                    type="number"
                    value={contado}
                    onChange={e => setContado(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && contado !== "") setClosingStage(2); }}
                    placeholder="0.00"
                    min="0"
                    step="0.10"
                    className="w-full rounded-2xl border border-[#e4e9f0] px-5 py-4 text-[28px] font-bold text-[#2F3E46] outline-none placeholder:text-[#d1d9e1] focus:border-red-300 focus:ring-2 focus:ring-red-300/20 text-center"
                  />
                </div>
              </>
            )}

            {closingStage === 2 && (
              <>
                <p className="text-[12px] text-[#6b7280] leading-relaxed">
                  Confirma que el monto contado es correcto antes de ver la conciliación.
                </p>
                <div className="rounded-2xl border border-[#e4e9f0] px-5 py-4 flex flex-col gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">Tu conteo</span>
                  <span className="text-[32px] font-bold text-[#111827] tabular-nums">S/ {contadoNum.toFixed(2)}</span>
                </div>
                <p className="text-[11px] text-[#9ca3af]">Si el número es correcto, avanza para ver la diferencia con el esperado.</p>
              </>
            )}

            {closingStage === 3 && (
              <>
                <p className="text-[12px] text-[#6b7280] leading-relaxed">Conciliación por fondo operacional:</p>
                <div className="flex flex-col gap-2">
                  {/* Fondo apertura */}
                  <div className="rounded-xl bg-[#f8fafd] border border-[#e4e9f0] px-4 py-3 flex flex-col gap-1.5">
                    <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#9ca3af] mb-0.5">Fondo apertura</p>
                    <div className="flex justify-between"><span className="text-[10.5px] text-[#9ca3af]">Fondo inicial</span><span className="text-[11px] font-semibold tabular-nums text-[#374151]">S/ {apertura.toFixed(2)}</span></div>
                    {ingApertura > 0 && <div className="flex justify-between"><span className="text-[10.5px] text-[#9ca3af]">Ingresos →</span><span className="text-[11px] font-semibold tabular-nums text-emerald-600">+S/ {ingApertura.toFixed(2)}</span></div>}
                    {egApertura  > 0 && <div className="flex justify-between"><span className="text-[10.5px] text-[#9ca3af]">Egresos ←</span><span className="text-[11px] font-semibold tabular-nums text-red-500">−S/ {egApertura.toFixed(2)}</span></div>}
                    <div className="pt-1 border-t border-[#e4e9f0] flex justify-between"><span className="text-[10.5px] font-bold text-[#374151]">Subtotal</span><span className="text-[12px] font-bold tabular-nums text-[#374151]">S/ {fondoApertEsp.toFixed(2)}</span></div>
                  </div>
                  {/* Fondo vendido */}
                  <div className="rounded-xl bg-[#f8fafd] border border-[#e4e9f0] px-4 py-3 flex flex-col gap-1.5">
                    <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#9ca3af] mb-0.5">Fondo vendido</p>
                    <div className="flex justify-between"><span className="text-[10.5px] text-[#9ca3af]">Ventas efectivo</span><span className="text-[11px] font-semibold tabular-nums text-[#374151]">S/ {sessionStats.cash.toFixed(2)}</span></div>
                    {ingVendido > 0 && <div className="flex justify-between"><span className="text-[10.5px] text-[#9ca3af]">Ingresos →</span><span className="text-[11px] font-semibold tabular-nums text-emerald-600">+S/ {ingVendido.toFixed(2)}</span></div>}
                    {egVendido  > 0 && <div className="flex justify-between"><span className="text-[10.5px] text-[#9ca3af]">Egresos ←</span><span className="text-[11px] font-semibold tabular-nums text-red-500">−S/ {egVendido.toFixed(2)}</span></div>}
                    <div className="pt-1 border-t border-[#e4e9f0] flex justify-between"><span className="text-[10.5px] font-bold text-[#374151]">Subtotal</span><span className="text-[12px] font-bold tabular-nums text-[#374151]">S/ {fondoVendidoEsp.toFixed(2)}</span></div>
                  </div>
                  {/* Total + contado + diff */}
                  <div className="rounded-xl border border-[#e4e9f0] px-4 py-2.5 flex justify-between items-center">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#374151]">Total esperado</span>
                    <span className="text-[13px] font-bold tabular-nums text-[#374151]">S/ {efectivoEsperado.toFixed(2)}</span>
                  </div>
                  <div className={`rounded-xl border px-4 py-2.5 flex justify-between items-center ${
                    Math.abs(diferencia) < 0.01 ? "border-emerald-200 bg-emerald-50" : diferencia > 0 ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"
                  }`}>
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#374151]">Contado</span>
                    <span className="text-[13px] font-bold tabular-nums text-[#374151]">S/ {contadoNum.toFixed(2)}</span>
                  </div>
                  <div className={`rounded-xl border px-4 py-3 flex flex-col gap-0.5 ${
                    Math.abs(diferencia) < 0.01 ? "border-emerald-300 bg-[#f0fdf4]" : diferencia > 0 ? "border-emerald-300 bg-[#f0fdf4]" : "border-red-300 bg-[#fef2f2]"
                  }`}>
                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-[#9ca3af]">Diferencia</span>
                    <span className={`text-[20px] font-bold tabular-nums ${Math.abs(diferencia) < 0.01 || diferencia > 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {diferencia >= 0 ? "+" : ""}S/ {diferencia.toFixed(2)}
                      <span className="text-[11px] ml-2 font-semibold">{Math.abs(diferencia) < 0.01 ? "Cuadre exacto" : diferencia > 0 ? "Sobrante" : "Faltante"}</span>
                    </span>
                  </div>
                </div>
              </>
            )}

            {closingStage === 4 && (
              <>
                <p className="text-[12px] text-[#6b7280] leading-relaxed">
                  El turno se cerrará definitivamente. Esta acción no se puede deshacer.
                </p>
                <div className="rounded-2xl bg-[#f8fafd] border border-[#e4e9f0] px-5 py-3 flex flex-col gap-1.5">
                  <InfoRow label="Caja"      value={`CAJA ${activeBox?.code}`} />
                  <InfoRow label="Operador"  value={operator} />
                  <InfoRow label="Ventas"    value={`${sessionStats.count} op. · S/ ${sessionStats.total.toFixed(2)}`} />
                  <InfoRow label="Diferencia" value={`${diferencia >= 0 ? "+" : ""}S/ ${diferencia.toFixed(2)}`} accent={diferencia >= 0} />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">Observaciones (opcional)</span>
                  <textarea
                    value={observations}
                    onChange={e => setObservations(e.target.value)}
                    placeholder="Novedades del turno, incidencias, etc."
                    rows={3}
                    className="w-full resize-none rounded-xl border border-[#e4e9f0] px-3.5 py-2.5 text-[11.5px] text-[#374151] outline-none placeholder:text-[#c8d4e0] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
                  />
                </div>
              </>
            )}

          </div>
        </div>

      ) : (

        /* MOVEMENTS — main operational surface */
        <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-[#e4e9f0] bg-white shadow-[0_4px_18px_rgba(15,23,42,0.04)]">

          {/* Header */}
          <div className="shrink-0 border-b border-[#f1f5f9] px-5 py-2.5 flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.15em] text-[#9ca3af]">Movimientos</span>
            <div className="flex items-center gap-3">
              {cashMoves.length > 0 && (
                <div className="flex gap-3">
                  {ingresosTotal > 0 && <span className="text-[10px] font-bold text-emerald-600 tabular-nums">↑ S/ {ingresosTotal.toFixed(2)}</span>}
                  {egresosTotal  > 0 && <span className="text-[10px] font-bold text-red-500 tabular-nums">↓ S/ {egresosTotal.toFixed(2)}</span>}
                </div>
              )}
              <button
                onClick={() => setLogOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-[#e4e9f0] px-2.5 py-1 text-[10px] font-semibold text-[#374151] transition hover:border-[#c7d7f4] hover:bg-[#f0f5ff]"
              >
                <FileText size={10} strokeWidth={2.5} />
                Bitácora
                {opLogs.length > 0 && (
                  <span className="rounded-md bg-[#e4e9f0] px-1 text-[9px] font-bold text-[#6b7280]">{opLogs.length}</span>
                )}
              </button>
            </div>
          </div>

          <>
              {/* Move form */}
              <div className="shrink-0 border-b border-[#f1f5f9] px-4 py-3 flex flex-col gap-2.5">

                {/* Type toggle */}
                <div className="flex gap-px rounded-xl bg-[#f1f5f9] p-0.5">
                  {(["ingreso", "egreso"] as MoveType[]).map(t => (
                    <button key={t} onClick={() => { setMoveType(t); setMoveMotivo(""); setMoveObservacion(""); setSourceType("apertura"); setMixApertura(""); setMixVendido(""); setLastMove(null); }}
                      className={`flex-1 rounded-[9px] py-1.5 text-[11px] font-bold uppercase tracking-wide transition ${
                        moveType === t
                          ? t === "ingreso" ? "bg-emerald-600 text-white shadow-sm" : "bg-red-500 text-white shadow-sm"
                          : "text-[#9ca3af] hover:text-[#374151]"
                      }`}
                    >
                      {t === "ingreso" ? "↑ Ingreso" : "↓ Egreso"}
                    </button>
                  ))}
                </div>

                {/* Monto */}
                <div className="flex items-center gap-2">
                  <span className="shrink-0 text-[11px] font-semibold text-[#9ca3af]">S/</span>
                  <input
                    ref={moveAmountRef}
                    type="number"
                    value={moveAmount}
                    onChange={e => { setMoveAmount(e.target.value); setMixApertura(""); setMixVendido(""); }}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); motivoRef.current?.focus(); } }}
                    placeholder="0.00"
                    min="0.01"
                    step="0.01"
                    className="flex-1 min-w-0 rounded-xl border border-[#e4e9f0] px-3 py-2 text-[18px] font-bold text-[#2F3E46] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
                  />
                </div>

                {/* Origen operacional */}
                <div className="flex flex-col gap-1.5">
                  <span className="text-[9.5px] font-bold uppercase tracking-[0.13em] text-[#9ca3af]">Origen operacional</span>
                  <div className="flex gap-1.5">
                    {(["apertura", "vendido", "mixto"] as MoveSource[]).map(s => (
                      <button key={s} onClick={() => { setSourceType(s); setMixApertura(""); setMixVendido(""); }}
                        className={`flex-1 rounded-lg py-1.5 text-[10.5px] font-semibold transition ${
                          sourceType === s
                            ? "bg-[#2154d8] text-white"
                            : "border border-[#e4e9f0] text-[#374151] hover:border-[#c7d7f4] hover:bg-[#f0f5ff]"
                        }`}
                      >
                        {s === "apertura" ? "Fondo" : s === "vendido" ? "Venta" : "Ambos"}
                      </button>
                    ))}
                  </div>

                  {sourceType === "mixto" && (
                    <div className="flex gap-2 items-center">
                      <div className="flex-1 flex flex-col gap-0.5">
                        <span className="text-[9px] font-semibold uppercase tracking-wide text-[#9ca3af]">Fondo S/</span>
                        <input type="number" value={mixApertura} onChange={e => setMixApertura(e.target.value)} placeholder="0.00" min="0" step="0.01"
                          className="w-full rounded-lg border border-[#e4e9f0] px-2.5 py-1.5 text-[13px] font-bold text-[#2F3E46] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-1 focus:ring-[#2154d8]/10" />
                      </div>
                      <span className="mt-4 text-[11px] text-[#c0cad4]">+</span>
                      <div className="flex-1 flex flex-col gap-0.5">
                        <span className="text-[9px] font-semibold uppercase tracking-wide text-[#9ca3af]">Venta S/</span>
                        <input type="number" value={mixVendido} onChange={e => setMixVendido(e.target.value)} placeholder="0.00" min="0" step="0.01"
                          className="w-full rounded-lg border border-[#e4e9f0] px-2.5 py-1.5 text-[13px] font-bold text-[#2F3E46] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-1 focus:ring-[#2154d8]/10" />
                      </div>
                      {mixAptNum + mixVndNum > 0 && (
                        <div className="mt-4">
                          <span className={`text-[10px] font-bold tabular-nums ${mixtoValid ? "text-emerald-600" : "text-red-500"}`}>
                            {mixtoValid ? "✓" : `≠ S/ ${totalAmt.toFixed(2)}`}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Motivo turno — obligatorio */}
                <div className="flex flex-col gap-1">
                  <span className="text-[9.5px] font-bold uppercase tracking-[0.13em] text-[#9ca3af]">
                    Motivo <span className="text-red-400">*</span>
                  </span>
                  <input
                    ref={motivoRef}
                    type="text"
                    value={moveMotivo}
                    onChange={e => setMoveMotivo(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && canAddMove) handleAddMove(); }}
                    placeholder={moveType === "egreso"
                      ? "Ej: Pago mototaxi, pago proveedor, pago servicio..."
                      : "Ej: Sencillo monedas, devolución, reposición..."}
                    maxLength={120}
                    className="w-full rounded-xl border border-[#e4e9f0] px-3 py-1.5 text-[12px] text-[#374151] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
                  />
                </div>

                {/* Observación — opcional */}
                <input
                  type="text"
                  value={moveObservacion}
                  onChange={e => setMoveObservacion(e.target.value)}
                  placeholder="Observación operacional (opcional)"
                  maxLength={200}
                  className="w-full rounded-xl border border-[#e4e9f0] px-3 py-1.5 text-[11px] text-[#374151] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-1 focus:ring-[#2154d8]/10"
                />

                {/* Registrar */}
                <button
                  onClick={handleAddMove}
                  disabled={!canAddMove}
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-[12px] font-bold uppercase tracking-wide transition ${
                    canAddMove
                      ? moveType === "ingreso"
                        ? "bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 active:scale-[0.98]"
                        : "bg-red-500 text-white shadow-sm hover:bg-red-600 active:scale-[0.98]"
                      : "bg-[#f1f5f9] text-[#c8d4e0] cursor-not-allowed"
                  }`}
                >
                  Registrar {moveType === "ingreso" ? "ingreso" : "egreso"}
                </button>

                {/* Feedback último movimiento */}
                {lastMove && (
                  <div className="flex items-center gap-2 rounded-xl bg-[#f0fdf4] border border-emerald-200 px-3 py-2">
                    <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-[10.5px] font-bold text-emerald-700">Movimiento registrado</p>
                      <p className="text-[9.5px] text-[#9ca3af] truncate">
                        {lastMove.type === "ingreso" ? "↑" : "↓"} S/ {lastMove.amount.toFixed(2)} · {lastMove.motivo}
                      </p>
                    </div>
                    <button onClick={() => handlePrintVoucher(lastMove)}
                      className="flex items-center gap-1 rounded-lg border border-emerald-200 px-2 py-1 text-[10px] font-semibold text-emerald-700 transition hover:bg-emerald-100"
                    >
                      <Printer size={10} strokeWidth={2} /> Imprimir
                    </button>
                  </div>
                )}
              </div>

              {/* Moves list */}
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
                {cashMoves.length === 0 ? (
                  <p className="py-8 text-center text-[10.5px] text-[#c8d4e0]">Sin movimientos en este turno</p>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    {[...cashMoves].reverse().map(m => {
                      const ts = new Date(m.timestamp);
                      const hm = `${String(ts.getHours()).padStart(2, "0")}:${String(ts.getMinutes()).padStart(2, "0")}`;
                      const srcLabel = m.sourceType === "mixto"
                        ? `fondo S/${m.fromApertura.toFixed(0)} · vnd S/${m.fromVendido.toFixed(0)}`
                        : m.sourceType === "apertura" ? "fondo" : m.sourceType;
                      return (
                        <div key={m.id} className="rounded-xl px-3 py-2 hover:bg-[#f8fafd] group">
                          <div className="flex items-center gap-2.5">
                            <span className={`shrink-0 text-[11px] font-bold ${m.type === "ingreso" ? "text-emerald-500" : "text-red-400"}`}>
                              {m.type === "ingreso" ? "↑" : "↓"}
                            </span>
                            <span className="flex-1 text-[11px] font-semibold text-[#374151] truncate">{m.motivo}</span>
                            <span className="text-[10px] text-[#9ca3af] tabular-nums">{hm}</span>
                            <span className={`text-[11px] font-bold tabular-nums ${m.type === "ingreso" ? "text-emerald-600" : "text-red-500"}`}>
                              {m.type === "ingreso" ? "+" : "−"}S/ {m.amount.toFixed(2)}
                            </span>
                            <button onClick={() => handlePrintVoucher(m)} title="Imprimir voucher"
                              className="shrink-0 opacity-0 group-hover:opacity-100 transition text-[#c0cad4] hover:text-[#2154d8]"
                            >
                              <Printer size={11} strokeWidth={2} />
                            </button>
                          </div>
                          <p className="ml-[22px] text-[9.5px] text-[#c0cad4] tabular-nums">{srcLabel}{m.observacion ? ` · ${m.observacion}` : ""}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>

          {/* Bitácora — drawer overlay */}
          {logOpen && (
            <div className="absolute inset-0 z-10 flex flex-col rounded-[24px] bg-white">
              <div className="shrink-0 border-b border-[#f1f5f9] px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={12} strokeWidth={2.5} className="text-[#9ca3af]" />
                  <span className="text-[10.5px] font-bold uppercase tracking-[0.15em] text-[#9ca3af]">Bitácora operacional</span>
                  {opLogs.length > 0 && (
                    <span className="rounded-md bg-[#e4e9f0] px-1.5 py-px text-[9px] font-bold text-[#6b7280]">{opLogs.length}</span>
                  )}
                </div>
                <button
                  onClick={() => setLogOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[#9ca3af] transition hover:bg-[#f1f5f9] hover:text-[#374151]"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
                {opLogs.length === 0 ? (
                  <p className="py-8 text-center text-[10.5px] text-[#c8d4e0]">Sin eventos registrados</p>
                ) : (
                  <div className="flex flex-col gap-0.5">
                    {[...opLogs].reverse().map(log => <LogEntry key={log.id} log={log} />)}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

    </section>
  );
}
