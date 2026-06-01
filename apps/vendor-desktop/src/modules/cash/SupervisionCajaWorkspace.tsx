import { useState } from "react";
import { Shield, CheckCircle, ClipboardList, Clock, Monitor, LogOut, Printer } from "lucide-react";
import { usePOS } from "../../context/POSContext";
import {
  loadSessionHistory, recordSessionCorrection, getCurrentSessionId,
  type SessionEntry, type CloseSignal, type CorrectionRecord, type CorrectionAccion,
} from "./services/session-history.service";
import { loadTurnEvents, type TurnEvent } from "../../domains/cash/turn-events.store";

const MOTIVOS_EXTEMPORANEO = [
  "Operador olvidó cerrar al terminar turno",
  "Cierre no completado por corte eléctrico",
  "Sistema cerrado sin completar cierre",
  "Cierre delegado no ejecutado",
  "Recuperación posterior al turno",
  "Otro",
];

const MOTIVOS_CORREGIR_CIERRE = [
  "Billete falso detectado",
  "Moneda falsa detectada",
  "Monto mal ingresado en arqueo",
  "Error de conteo",
  "Diferencia por operación externa",
  "Otro",
];

const SYM_CFG: Record<string, { sym: string; cls: string }> = {
  apertura:           { sym: "⊕", cls: "text-[#2154d8]"   },
  movimiento_ingreso: { sym: "+",  cls: "text-emerald-500" },
  movimiento_egreso:  { sym: "−",  cls: "text-red-400"     },
  fondo_ingreso:      { sym: "→",  cls: "text-amber-500"   },
  fondo_egreso:       { sym: "←",  cls: "text-amber-600"   },
  comprobante:        { sym: "≡",  cls: "text-[#005BE3]"   },
  anulacion:          { sym: "⊘",  cls: "text-red-400"     },
  cierre:             { sym: "⊗",  cls: "text-[#6b7280]"   },
};

function fmtDatetime(iso: string): string {
  const d  = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mn = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm} ${hh}:${mn}`;
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function Timeline({ events, entry }: { events: TurnEvent[]; entry: SessionEntry }) {
  function fmtTs(iso: string) {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  return (
    <div className="flex flex-col rounded-xl border border-[#e8edf3] bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 bg-[#f8fafd] border-b border-[#f0f4f8]">
        <Clock size={10} strokeWidth={2} className="text-[#9ca3af] shrink-0" />
        <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">
          Línea de tiempo · C{entry.boxCode}
        </span>
        <span className="ml-auto text-[9px] tabular-nums text-[#c0cad4]">
          {events.length} evento{events.length !== 1 ? "s" : ""}
        </span>
      </div>
      <div className="flex flex-col px-3 py-2 gap-px">
        {events.map(ev => {
          const { sym, cls } = SYM_CFG[ev.type] ?? { sym: "·", cls: "text-[#9ca3af]" };
          return (
            <div key={ev.id} className="flex items-baseline gap-2 py-0.5">
              <span className="shrink-0 w-[28px] text-[9px] tabular-nums text-[#c0cad4] text-right">{fmtTs(ev.ts)}</span>
              <span className={`shrink-0 text-[10px] font-bold ${cls}`}>{sym}</span>
              <span className="flex-1 min-w-0 text-[10px] text-[#374151] leading-snug truncate">{ev.text}</span>
            </div>
          );
        })}
        {entry.correction && (
          <div className="flex items-baseline gap-2 py-0.5 mt-0.5 border-t border-[#f4f6f9] pt-1.5">
            <span className="shrink-0 w-[28px] text-[9px] tabular-nums text-[#c0cad4] text-right">
              {(() => {
                const d = new Date(entry.correction.correctedAt);
                return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
              })()}
            </span>
            <span className="shrink-0 text-[10px] font-bold text-[#2154d8]">⚑</span>
            <span className="flex-1 min-w-0 text-[10px] font-semibold text-[#2154d8] leading-snug">
              Corrección supervisada · {entry.correction.correctedBy}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function MotivoForm({ presets, motivoPreset, motivoLibre, setMotivoPreset, setMotivoLibre }: {
  presets: string[];
  motivoPreset: string;
  motivoLibre: string;
  setMotivoPreset: (v: string) => void;
  setMotivoLibre:  (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">
        Motivo <span className="text-amber-500">*</span>
      </span>
      <div className="flex flex-wrap gap-1.5">
        {presets.map(p => (
          <button key={p}
            onClick={() => { setMotivoPreset(p); if (p !== "Otro") setMotivoLibre(""); }}
            className={`rounded-xl border px-3 py-1.5 text-[10.5px] font-semibold transition ${
              motivoPreset === p
                ? "border-[#2154d8]/30 bg-[#EEF3FD] text-[#2154d8]"
                : "border-[#e4e9f0] bg-white text-[#6b7280] hover:border-[#2154d8]/20"
            }`}>{p}</button>
        ))}
      </div>
      {(motivoPreset === "Otro" || motivoPreset === "") && (
        <input type="text" value={motivoLibre} onChange={e => setMotivoLibre(e.target.value)}
          placeholder="Describe brevemente el motivo..."
          maxLength={200} autoFocus={motivoPreset === "Otro"}
          className="w-full rounded-xl border border-[#e4e9f0] px-3 py-2 text-[12px] text-[#374151] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10" />
      )}
    </div>
  );
}

function InfoSupervisor({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-[#f0f4f8] bg-[#f8fafd] px-3.5 py-2">
      <Shield size={11} strokeWidth={2} className="text-[#c0cad4] shrink-0" />
      <span className="text-[10px] text-[#9ca3af]">
        Se registrará como: <strong className="text-[#374151]">{name}</strong>
      </span>
    </div>
  );
}

function ApplyButton({ canApply, onClick, label }: { canApply: boolean; onClick: () => void; label: string }) {
  return (
    <button onClick={onClick} disabled={!canApply}
      className={`flex h-10 w-full items-center justify-center gap-1.5 rounded-2xl px-4 text-[13px] font-semibold uppercase tracking-wider transition ${
        canApply
          ? "bg-[#2154d8] text-white hover:bg-[#1a44be] active:scale-[0.98] shadow-[0_2px_8px_rgba(33,84,216,0.20)]"
          : "cursor-not-allowed bg-[#2154d8]/[0.15] text-[#2154d8]/50"
      }`}>
      {label}
    </button>
  );
}

// ── Componente principal ────────────────────────────────────────────────────

interface SupervisionCajaProps {
  onEjecutarCierre?:  () => void;
  onAutorizarCierre?: () => void;
}

export function SupervisionCajaWorkspace({ onEjecutarCierre, onAutorizarCierre }: SupervisionCajaProps = {}) {
  const { activeOperator, operators, cashSession } = usePOS();

  const [history,      setHistory]      = useState<SessionEntry[]>(() => loadSessionHistory());
  const [turnEvents]                   = useState<TurnEvent[]>(() => loadTurnEvents());
  const [selectedId,   setSelectedId]   = useState<string | null>(null);
  const [motivoPreset, setMotivoPreset] = useState("");
  const [motivoLibre,  setMotivoLibre]  = useState("");
  const [newSignal,    setNewSignal]    = useState<CloseSignal>("ok");
  const [applied,      setApplied]      = useState(false);
  const [fechaOp,      setFechaOp]      = useState("");

  // Filtros
  const [filterEstado,       setFilterEstado]       = useState<"todos" | "pendiente" | "revisar" | "corregido" | "ok">("todos");
  const [filterCaja,         setFilterCaja]         = useState("");
  const [filterOperadorCode, setFilterOperadorCode] = useState("");
  const [filterFechaDesde,   setFilterFechaDesde]   = useState("");
  const [filterFechaHasta,   setFilterFechaHasta]   = useState("");

  const supervisorName   = activeOperator?.name ?? "Supervisor";
  const activeOperators  = operators.filter(o => o.status !== "INACTIVO");
  const selectedFilterOp = activeOperators.find(o => o.operatorCode === filterOperadorCode) ?? null;
  const filterBlockPrefix = selectedFilterOp?.blockBase != null ? String(selectedFilterOp.blockBase)[0] : "";
  const uniqueCajas      = [...new Set(history.map(e => e.boxCode))].sort();
  const cajaOptions      = filterBlockPrefix ? uniqueCajas.filter(c => c[0] === filterBlockPrefix) : uniqueCajas;

  const filtered = history.slice(0, 60).filter(e => {
    if (filterEstado !== "todos") {
      const isPend = e.closeSignal === null;
      const isWrn  = e.closeSignal === "warn" && !e.correction;
      const isCor  = !!e.correction;
      const isOk   = e.closeSignal === "ok"   && !isCor;
      if (filterEstado === "pendiente" && !isPend) return false;
      if (filterEstado === "revisar"   && !isWrn)  return false;
      if (filterEstado === "corregido" && !isCor)  return false;
      if (filterEstado === "ok"        && !isOk)   return false;
    }
    if (filterBlockPrefix && e.boxCode[0] !== filterBlockPrefix) return false;
    if (filterCaja        && e.boxCode !== filterCaja)           return false;
    const dt = e.openedAt.slice(0, 10);
    if (filterFechaDesde && dt < filterFechaDesde) return false;
    if (filterFechaHasta && dt > filterFechaHasta) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const p = (e: SessionEntry) =>
      e.closeSignal === null                    ? 0 :
      e.closeSignal === "warn" && !e.correction ? 1 : 2;
    return p(a) - p(b);
  });

  const selectedEntry = sorted.find(e => e.id === selectedId) ?? null;

  const isPending       = selectedEntry?.closeSignal === null;
  const isWarn          = selectedEntry?.closeSignal === "warn" && !selectedEntry?.correction;
  const isCorrected     = !!selectedEntry?.correction;
  const isActiveSession = !!(
    selectedEntry && isPending && cashSession.isOpen &&
    selectedEntry.id === getCurrentSessionId()
  );

  const sessionTimeline = selectedEntry
    ? turnEvents
        .filter(e => e.sessionKey === `${selectedEntry.boxCode}-${selectedEntry.openedAt}`)
        .sort((a, b) => a.ts.localeCompare(b.ts))
    : [];

  const lastActTs = sessionTimeline.length > 0
    ? sessionTimeline[sessionTimeline.length - 1].ts
    : (selectedEntry?.closedAt ?? selectedEntry?.openedAt ?? "");

  const motivoFinal   = (motivoPreset === "Otro" || motivoPreset === "") ? motivoLibre.trim() : motivoPreset;
  const isExtemporaneo = isPending && !isActiveSession;
  const canApply      = motivoFinal.length >= 5 && (!isExtemporaneo || fechaOp.length > 0);
  const PRESETS       = isExtemporaneo ? MOTIVOS_EXTEMPORANEO : MOTIVOS_CORREGIR_CIERRE;

  function handleSelect(id: string) {
    if (id === selectedId) return;
    setSelectedId(id);
    setMotivoPreset(""); setMotivoLibre("");
    setNewSignal("ok"); setApplied(false); setFechaOp("");
  }

  function handleApply() {
    if (!selectedEntry || !canApply) return;
    const accion: CorrectionAccion = isExtemporaneo ? "cierre_extemporaneo" : "documentar_diferencia";
    const resolvedSignal: CloseSignal = isExtemporaneo ? newSignal : "warn";
    const correction: CorrectionRecord = {
      correctedBy: supervisorName,
      correctedAt: new Date().toISOString(),
      motivo: motivoFinal,
      accion,
      prevSignal: selectedEntry.closeSignal,
      newSignal:  resolvedSignal,
      ...(isExtemporaneo && fechaOp ? { fechaOperacional: new Date(fechaOp).toISOString() } : {}),
    };
    recordSessionCorrection(selectedEntry.id, correction, resolvedSignal);
    setHistory(loadSessionHistory());
    setApplied(true);
  }

  const pendingCount = sorted.filter(e => e.closeSignal === null).length;

  return (
    <section className="flex min-h-0 flex-1 gap-2">

      {/* ── REGISTROS ── */}
      <div className="flex w-[480px] shrink-0 flex-col overflow-hidden rounded-[28px] border border-[#2A7CA8]/50 bg-[#FDFCF9]">
        <div className="shrink-0 flex h-[42px] items-center gap-2 px-4 bg-[#F2F7FA] border-b border-[#2A7CA8]/15">
          <ClipboardList size={13} strokeWidth={2} className="shrink-0 text-[#1a5f7a]" />
          <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">REGISTROS</span>
          {pendingCount > 0 && (
            <span className="ml-auto rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold text-white tabular-nums">
              {pendingCount}
            </span>
          )}
        </div>

        {/* Filtros */}
        <div className="shrink-0 flex flex-col gap-1.5 border-b border-[#e8edf3] px-3 py-2">
          {/* Estado turno */}
          <div className="flex gap-px rounded-lg bg-[#f1f5f9] p-0.5">
            {(["todos", "pendiente", "revisar", "corregido", "ok"] as const).map(est => (
              <button key={est} onClick={() => setFilterEstado(est)}
                className={`flex-1 rounded-md py-2 text-[9.5px] font-bold uppercase tracking-wide transition ${
                  filterEstado === est
                    ? est === "pendiente" ? "bg-amber-500 text-white shadow-sm"
                    : est === "revisar"   ? "bg-orange-400 text-white shadow-sm"
                    : est === "corregido" ? "bg-emerald-600 text-white shadow-sm"
                    : est === "ok"        ? "bg-[#6b7280] text-white shadow-sm"
                    : "bg-white text-[#374151] shadow-sm"
                    : "text-[#9ca3af] hover:text-[#374151]"
                }`}>
                {est === "todos"     ? "Todos"
                : est === "pendiente" ? "Pendiente"
                : est === "revisar"   ? "Revisar"
                : est === "corregido" ? "Corregido"
                : "OK"}
              </button>
            ))}
          </div>

          {/* Operador + Caja */}
          <div className="flex items-center gap-1.5">
            <select value={filterOperadorCode}
              onChange={e => { setFilterOperadorCode(e.target.value); setFilterCaja(""); }}
              className="flex-1 min-w-0 rounded-lg border border-[#e4e9f0] bg-white px-2 py-1 text-[10px] text-[#374151] outline-none focus:border-[#2154d8]">
              <option value="">Todos los operadores</option>
              {activeOperators.map(o => (
                <option key={o.operatorCode} value={o.operatorCode}>
                  {o.operatorCode} · {o.roleCode} · {o.alias}{o.blockBase != null ? ` · ${o.blockBase}` : ""} · {o.name}
                </option>
              ))}
            </select>
            <select value={filterCaja} onChange={e => setFilterCaja(e.target.value)}
              className="shrink-0 rounded-lg border border-[#e4e9f0] bg-white px-2 py-1 text-[10px] text-[#374151] outline-none focus:border-[#2154d8]">
              <option value="">Todas</option>
              {cajaOptions.map(c => <option key={c} value={c}>C{c}</option>)}
            </select>
          </div>

          {/* Rango fechas */}
          <div className="flex items-center gap-1.5">
            <input type="date" value={filterFechaDesde} onChange={e => setFilterFechaDesde(e.target.value)}
              className="flex-1 rounded-lg border border-[#e4e9f0] bg-white px-2 py-1 text-[10px] text-[#374151] outline-none focus:border-[#2154d8]" />
            <span className="shrink-0 text-[9px] font-semibold text-[#9ca3af]">—</span>
            <input type="date" value={filterFechaHasta} onChange={e => setFilterFechaHasta(e.target.value)}
              className="flex-1 rounded-lg border border-[#e4e9f0] bg-white px-2 py-1 text-[10px] text-[#374151] outline-none focus:border-[#2154d8]" />
          </div>
        </div>

        {/* Lista */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
              <ClipboardList size={24} strokeWidth={1.2} className="text-[#d1d5db]" />
              <p className="text-[11px] font-semibold text-[#9ca3af]">Sin registros para los filtros seleccionados</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-[#f4f6f9]">
              {sorted.map(e => {
                const ePend = e.closeSignal === null;
                const eWarn = e.closeSignal === "warn" && !e.correction;
                const eCor  = !!e.correction;
                const eOk   = e.closeSignal === "ok"   && !eCor;
                const isSel = e.id === selectedId;
                return (
                  <button key={e.id} onClick={() => handleSelect(e.id)}
                    className={`flex flex-col gap-0.5 px-4 py-2.5 text-left transition hover:bg-[#f8fafc] ${
                      isSel ? "bg-[#EEF3FD] ring-inset ring-1 ring-[#2154d8]/20" : ""
                    }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold tabular-nums text-[#1a5f7a]">C{e.boxCode}</span>
                      <span className="truncate flex-1 text-[10px] font-semibold text-[#6b7280]">{e.boxLabel}</span>
                      {ePend && <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[8.5px] font-bold text-amber-700">PENDIENTE</span>}
                      {eWarn && <span className="shrink-0 rounded-full bg-amber-50  px-1.5 py-0.5 text-[8.5px] font-bold text-amber-600">⚠ REVISAR</span>}
                      {eCor  && <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8.5px] font-bold text-emerald-700">✓ CORREGIDO</span>}
                      {eOk   && <span className="shrink-0 rounded-full bg-[#f4f6f9] px-1.5 py-0.5 text-[8.5px] font-semibold text-[#9ca3af]">CORRECTO</span>}
                    </div>
                    <span className="text-[10px] font-medium text-[#9ca3af]">{e.operator}</span>
                    <div className="flex items-center gap-1.5">
                      <Clock size={9} strokeWidth={2} className="text-[#c0cad4] shrink-0" />
                      <span className="text-[10px] tabular-nums text-[#9ca3af]">
                        {fmtDatetime(e.openedAt)}
                        {e.closedAt ? ` → ${fmtTime(e.closedAt)}` : " · sin cierre"}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── DETALLE + ACCIONES SUPERVISOR ── */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[#2A7CA8]/30 bg-[#FDFCF9]">
        <div className="shrink-0 flex h-[42px] items-center gap-2 px-4 bg-[#F2F7FA] border-b border-[#2A7CA8]/15">
          <Shield size={13} strokeWidth={2} className="shrink-0 text-[#1a5f7a]" />
          <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">SUPERVISIÓN DE CAJA</span>
          {selectedEntry && (
            <span className="ml-auto text-[10px] font-semibold text-[#9ca3af]">
              C{selectedEntry.boxCode} · {selectedEntry.boxLabel}
            </span>
          )}
        </div>

        {/* Sin selección */}
        {!selectedEntry && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
            <Shield size={32} strokeWidth={1} className="text-[#d1d5db]" />
            <div>
              <p className="text-[12px] font-semibold text-[#6b7280]">Supervisión de Caja</p>
              <p className="text-[11px] text-[#9ca3af] mt-1 leading-relaxed">
                Selecciona un registro para revisar el detalle<br />y ejecutar acciones de supervisión.
              </p>
            </div>
          </div>
        )}

        {/* Con selección */}
        {selectedEntry && (
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 pt-4 pb-5">

            {/* ── DETALLE ── */}
            <div className="flex flex-col rounded-xl border border-[#e4e9f0] bg-white overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 bg-[#f8fafd] border-b border-[#f0f4f8]">
                <Monitor size={11} strokeWidth={2} className="text-[#9ca3af] shrink-0" />
                <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">Detalle</span>
              </div>
              <div className="flex flex-col divide-y divide-[#f4f6f9]">
                <div className="flex justify-between px-4 py-2">
                  <span className="text-[10px] text-[#9ca3af]">Caja</span>
                  <span className="text-[10.5px] font-bold text-[#1a5f7a]">C{selectedEntry.boxCode} · {selectedEntry.boxLabel}</span>
                </div>
                <div className="flex justify-between px-4 py-2">
                  <span className="text-[10px] text-[#9ca3af]">Operador</span>
                  <span className="text-[10.5px] font-semibold text-[#374151]">{selectedEntry.operator}</span>
                </div>
                <div className="flex justify-between px-4 py-2">
                  <span className="text-[10px] text-[#9ca3af]">Apertura</span>
                  <span className="text-[10.5px] tabular-nums text-[#374151]">{fmtDatetime(selectedEntry.openedAt)}</span>
                </div>
                <div className="flex justify-between px-4 py-2">
                  <span className="text-[10px] text-[#9ca3af]">Última actividad</span>
                  <span className="text-[10.5px] tabular-nums text-[#374151]">{fmtDatetime(lastActTs)}</span>
                </div>
                <div className="flex justify-between px-4 py-2">
                  <span className="text-[10px] text-[#9ca3af]">Cierre</span>
                  <span className={`text-[10.5px] tabular-nums ${selectedEntry.closedAt ? "text-[#374151]" : "font-semibold text-amber-500"}`}>
                    {selectedEntry.closedAt ? fmtDatetime(selectedEntry.closedAt) : "Sin cierre registrado"}
                  </span>
                </div>
              </div>
            </div>

            {/* Línea de tiempo */}
            {sessionTimeline.length > 0 && <Timeline events={sessionTimeline} entry={selectedEntry} />}

            {/* Trazabilidad — si existe corrección */}
            {isCorrected && selectedEntry.correction && (
              <div className="flex flex-col gap-2 rounded-xl border border-[#e4e9f0] bg-white px-4 py-3">
                <p className="text-[9.5px] font-bold uppercase tracking-widest text-[#c0cad4]">
                  Trazabilidad · Corrección registrada
                </p>
                <div className="flex flex-col gap-1.5">
                  {selectedEntry.correction.fechaOperacional && (
                    <div className="flex justify-between">
                      <span className="text-[10px] text-[#9ca3af]">Fecha operacional</span>
                      <span className="text-[10.5px] tabular-nums text-[#374151]">
                        {fmtDatetime(selectedEntry.correction.fechaOperacional)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-[10px] text-[#9ca3af] shrink-0">Supervisor</span>
                    <span className="text-[10.5px] font-semibold text-[#374151] text-right">
                      {selectedEntry.correction.correctedBy}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-[#9ca3af]">Registrado</span>
                    <span className="text-[10.5px] tabular-nums text-[#374151]">
                      {fmtDatetime(selectedEntry.correction.correctedAt)}
                    </span>
                  </div>
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-[10px] text-[#9ca3af] shrink-0">Motivo</span>
                    <span className="text-[10.5px] font-semibold text-[#374151] text-right">
                      {selectedEntry.correction.motivo}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ── ACCIONES SUPERVISOR ── */}
            <div className="flex flex-col gap-2.5 rounded-xl border border-[#2A7CA8]/30 bg-[#f8fafd] px-4 py-3">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#1a5f7a]">Acciones Supervisor</p>

              {/* A: Sesión activa, cierre pendiente */}
              {isActiveSession && (
                <div className="flex flex-col gap-2">
                  <p className="text-[10px] text-[#9ca3af] leading-snug">
                    Turno activo sin cierre. El supervisor puede ejecutar el cierre directamente o autorizarlo al operador de ventas.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => onEjecutarCierre?.()}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[#dc2626]/30 bg-red-50 py-2.5 text-[10.5px] font-bold uppercase tracking-wide text-[#dc2626] transition hover:bg-red-100 active:scale-[0.98]">
                      <LogOut size={11} strokeWidth={2.5} />
                      Ejecutar Cierre
                    </button>
                    <button onClick={() => onAutorizarCierre?.()}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[#2154d8]/30 bg-[#EEF3FD] py-2.5 text-[10.5px] font-bold uppercase tracking-wide text-[#2154d8] transition hover:bg-[#dce8fb] active:scale-[0.98]">
                      <CheckCircle size={11} strokeWidth={2.5} />
                      Autorizar Cierre
                    </button>
                  </div>
                </div>
              )}

              {/* B: Histórica, cierre pendiente */}
              {isPending && !isActiveSession && !applied && (
                <div className="flex flex-col gap-2">
                  <p className="text-[9.5px] font-bold uppercase tracking-wide text-amber-600">Cierre Extemporáneo</p>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">
                      Fecha/hora real del cierre <span className="text-amber-500">*</span>
                    </span>
                    <input type="datetime-local" value={fechaOp} onChange={e => setFechaOp(e.target.value)}
                      max={new Date().toISOString().slice(0, 16)}
                      className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-[12px] text-[#374151] outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/15" />
                    <p className="text-[9.5px] text-[#9ca3af] px-1">Momento real en que ocurrió el cierre.</p>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">¿El arqueo cuadró?</span>
                    <div className="flex gap-2">
                      <button onClick={() => setNewSignal("ok")}
                        className={`flex-1 rounded-xl border py-2 text-[10.5px] font-bold uppercase tracking-wide transition ${
                          newSignal === "ok"
                            ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                            : "border-[#e4e9f0] bg-white text-[#9ca3af] hover:border-emerald-200"
                        }`}>✓ Sin diferencias</button>
                      <button onClick={() => setNewSignal("warn")}
                        className={`flex-1 rounded-xl border py-2 text-[10.5px] font-bold uppercase tracking-wide transition ${
                          newSignal === "warn"
                            ? "border-amber-300 bg-amber-50 text-amber-700"
                            : "border-[#e4e9f0] bg-white text-[#9ca3af] hover:border-amber-200"
                        }`}>⚠ Con diferencias</button>
                    </div>
                  </div>
                  <MotivoForm presets={PRESETS} motivoPreset={motivoPreset} motivoLibre={motivoLibre}
                    setMotivoPreset={setMotivoPreset} setMotivoLibre={setMotivoLibre} />
                  <InfoSupervisor name={supervisorName} />
                  <ApplyButton canApply={canApply} onClick={handleApply} label="Registrar Cierre Extemporáneo" />
                </div>
              )}

              {/* C: warn, sin corrección */}
              {isWarn && !applied && (
                <div className="flex flex-col gap-2">
                  <p className="text-[9.5px] font-bold uppercase tracking-wide text-orange-600">Corregir Cierre</p>
                  <MotivoForm presets={PRESETS} motivoPreset={motivoPreset} motivoLibre={motivoLibre}
                    setMotivoPreset={setMotivoPreset} setMotivoLibre={setMotivoLibre} />
                  <InfoSupervisor name={supervisorName} />
                  <ApplyButton canApply={canApply} onClick={handleApply} label="Registrar Corrección" />
                </div>
              )}

              {/* Corrección aplicada */}
              {applied && (
                <div className="flex flex-col items-center gap-2 py-2 text-center">
                  <CheckCircle size={22} strokeWidth={1.5} className="text-emerald-500" />
                  <p className="text-[11px] font-semibold text-[#374151]">Corrección registrada</p>
                  <button onClick={() => { setApplied(false); setSelectedId(null); }}
                    className="text-[11px] font-semibold text-[#2154d8] hover:underline">
                    Seleccionar otro registro
                  </button>
                </div>
              )}

              {/* D: Sesión resuelta — reimprimir */}
              {!isActiveSession && !isPending && !isWarn && !applied && (
                <div className="flex flex-col gap-2">
                  {isCorrected ? (
                    <p className="text-[10px] text-[#9ca3af] leading-snug">
                      Corrección ya registrada. Ver trazabilidad arriba.
                    </p>
                  ) : (
                    <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2">
                      <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                      <span className="text-[10.5px] font-semibold text-emerald-700">Cierre correcto · sin corrección pendiente</span>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      disabled={!selectedEntry.arqueo}
                      title={selectedEntry.arqueo ? "Reimprimir arqueo de esta sesión" : "Sin datos de arqueo disponibles"}
                      className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[10.5px] font-bold uppercase tracking-wide transition ${
                        selectedEntry.arqueo
                          ? "border-[#e4e9f0] bg-white text-[#374151] hover:border-[#2154d8]/30 hover:text-[#2154d8]"
                          : "border-[#e4e9f0] bg-[#f4f6f9] text-[#c0cad4] cursor-not-allowed"
                      }`}>
                      <Printer size={11} strokeWidth={2} />
                      Reimprimir Arqueo
                    </button>
                    <button disabled title="Pendiente: apertura no persiste en historial de sesión"
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-[#e4e9f0] bg-[#f4f6f9] py-2.5 text-[10.5px] font-bold uppercase tracking-wide text-[#c0cad4] cursor-not-allowed">
                      Corregir Apertura
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>
    </section>
  );
}
