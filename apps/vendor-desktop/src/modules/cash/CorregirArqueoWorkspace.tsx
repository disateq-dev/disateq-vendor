import { useState } from "react";
import { AlertTriangle, CheckCircle, ClipboardList, RotateCcw, Clock, Monitor } from "lucide-react";
import { usePOS } from "../../context/POSContext";
import {
  loadSessionHistory, recordSessionCorrection,
  type SessionEntry, type CloseSignal, type CorrectionRecord, type CorrectionAccion,
} from "./services/session-history.service";
import { loadTurnEvents, type TurnEvent } from "../../domains/cash/turn-events.store";

const MOTIVOS_REGULARIZAR = [
  "Corte eléctrico durante cierre",
  "Sistema reiniciado inesperadamente",
  "Cierre interrumpido · overnight",
  "Impresora desconectada al cerrar",
  "Cierre delegado a otro operador",
  "Recuperación posterior al turno",
  "Otro",
];

const MOTIVOS_DOCUMENTAR = [
  "Billete falso detectado",
  "Moneda falsa detectada",
  "Monto mal ingresado en arqueo",
  "Error de conteo",
  "Diferencia por operación externa",
  "Otro",
];

const MOTIVOS_EXTEMPORANEO = [
  "Operador olvidó cerrar al terminar turno",
  "Cierre no completado por corte eléctrico",
  "Sistema cerrado sin completar cierre",
  "Cierre delegado no ejecutado",
  "Recuperación posterior al turno",
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
  const d = new Date(iso);
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

function TimelineSection({ events, entry }: { events: TurnEvent[]; entry: SessionEntry }) {
  function fmtTs(iso: string) {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
  }
  return (
    <div className="flex flex-col rounded-xl border border-[#e8edf3] bg-white overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2 bg-[#f8fafd] border-b border-[#f0f4f8]">
        <Clock size={10} strokeWidth={2} className="text-[#9ca3af] shrink-0" />
        <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">Línea de tiempo · C{entry.boxCode}</span>
        <span className="ml-auto text-[9px] tabular-nums text-[#c0cad4]">{events.length} evento{events.length !== 1 ? "s" : ""}</span>
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
              {(() => { const d = new Date(entry.correction.correctedAt); return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`; })()}
            </span>
            <span className="shrink-0 text-[10px] font-bold text-[#2154d8]">⚠</span>
            <span className="flex-1 min-w-0 text-[10px] font-semibold text-[#2154d8] leading-snug">
              Regularización · {entry.correction.accion.replace(/_/g, " ")} · {entry.correction.correctedBy}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export function CorregirArqueoWorkspace() {
  const { suggestedCashBox, activeOperator, operators, cashSession } = usePOS();

  const currentOpBlockBase  = activeOperator?.blockBase ?? null;
  const activeBox           = cashSession.cashBox;
  const operatorBlockPrefix = activeBox?.code[0] ??
    (currentOpBlockBase !== null ? String(currentOpBlockBase)[0] : suggestedCashBox?.code[0] ?? "1");
  const operatorName        = activeOperator?.name ??
    operators.find(o => o.blockBase !== null && String(o.blockBase)[0] === operatorBlockPrefix && o.status === "ACTIVO")?.name ??
    "Operador";

  const [history,          setHistory]          = useState<SessionEntry[]>(() => loadSessionHistory());
  const [turnEvents]                           = useState<TurnEvent[]>(() => loadTurnEvents());
  const [selectedId,       setSelectedId]       = useState<string | null>(null);
  const [motivoPreset,     setMotivoPreset]     = useState("");
  const [motivoLibre,      setMotivoLibre]      = useState("");
  const [newSignal,        setNewSignal]        = useState<CloseSignal>("ok");
  const [applied,          setApplied]          = useState(false);
  const [selectedAccion,   setSelectedAccion]   = useState<CorrectionAccion>("regularizar_cierre");
  const [fechaOperacional, setFechaOperacional] = useState("");

  // Filtros
  const [filterEstado,   setFilterEstado]   = useState<"todos" | "pendiente" | "revisar" | "regularizado" | "ok">("todos");
  const [filterCaja,     setFilterCaja]     = useState("");
  const [filterOperador, setFilterOperador] = useState("");
  const [filterFechaDesde, setFilterFechaDesde] = useState("");
  const [filterFechaHasta, setFilterFechaHasta] = useState("");

  const uniqueCajas = [...new Set(history.map(e => e.boxCode))].sort();

  const filtered = history
    .slice(0, 60)
    .filter(e => {
      if (filterEstado !== "todos") {
        const isPending   = e.closeSignal === null;
        const isWarn      = e.closeSignal === "warn" && !e.correction;
        const isCorrected = !!e.correction;
        const isOk        = e.closeSignal === "ok" && !isCorrected;
        if (filterEstado === "pendiente"    && !isPending)   return false;
        if (filterEstado === "revisar"      && !isWarn)      return false;
        if (filterEstado === "regularizado" && !isCorrected) return false;
        if (filterEstado === "ok"           && !isOk)        return false;
      }
      if (filterCaja     && e.boxCode !== filterCaja) return false;
      if (filterOperador && !e.operator.toLowerCase().includes(filterOperador.toLowerCase())) return false;
      const entryDate = e.openedAt.slice(0, 10);
      if (filterFechaDesde && entryDate < filterFechaDesde) return false;
      if (filterFechaHasta && entryDate > filterFechaHasta) return false;
      return true;
    });

  const sorted = [...filtered].sort((a, b) => {
    const priority = (e: SessionEntry) =>
      e.closeSignal === null                          ? 0 :
      (e.closeSignal === "warn" && !e.correction)    ? 1 : 2;
    return priority(a) - priority(b);
  });

  const selectedEntry = sorted.find(e => e.id === selectedId) ?? null;

  const isActionable =
    selectedEntry !== null &&
    (selectedEntry.closeSignal === null ||
     (selectedEntry.closeSignal === "warn" && !selectedEntry.correction));

  const accion: CorrectionAccion | null = selectedEntry
    ? selectedEntry.closeSignal === null ? selectedAccion : "documentar_diferencia"
    : null;

  const sessionTimeline = selectedEntry
    ? turnEvents
        .filter(e => e.sessionKey === `${selectedEntry.boxCode}-${selectedEntry.openedAt}`)
        .sort((a, b) => a.ts.localeCompare(b.ts))
    : [];

  const motivoFinal = (motivoPreset === "Otro" || motivoPreset === "") ? motivoLibre.trim() : motivoPreset;
  const canApply    = isActionable && motivoFinal.length >= 5
    && (accion !== "cierre_extemporaneo" || fechaOperacional.length > 0);

  function handleSelect(id: string) {
    if (id === selectedId) return;
    setSelectedId(id);
    setMotivoPreset("");
    setMotivoLibre("");
    setNewSignal("ok");
    setApplied(false);
    setSelectedAccion("regularizar_cierre");
    setFechaOperacional("");
  }

  function handleApply() {
    if (!selectedEntry || !canApply || !accion) return;
    const resolvedSignal: CloseSignal = accion === "documentar_diferencia" ? "warn" : newSignal;
    const correction: CorrectionRecord = {
      correctedBy: operatorName,
      correctedAt: new Date().toISOString(),
      motivo:      motivoFinal,
      accion,
      prevSignal:  selectedEntry.closeSignal,
      newSignal:   resolvedSignal,
      ...(accion === "cierre_extemporaneo" && fechaOperacional
        ? { fechaOperacional: new Date(fechaOperacional).toISOString() }
        : {}),
    };
    recordSessionCorrection(selectedEntry.id, correction, resolvedSignal);
    setHistory(loadSessionHistory());
    setApplied(true);
  }

  const PRESETS = accion === "cierre_extemporaneo" ? MOTIVOS_EXTEMPORANEO
    : accion === "regularizar_cierre" ? MOTIVOS_REGULARIZAR
    : MOTIVOS_DOCUMENTAR;

  return (
    <section className="flex min-h-0 flex-1 gap-2">

      {/* LEFT: lista sesiones */}
      <div className="flex w-[600px] shrink-0 flex-col overflow-hidden rounded-[28px] border border-[#2A7CA8]/50 bg-[#FDFCF9]">
        <div className="shrink-0 flex h-[42px] items-center gap-2 px-4 bg-[#F2F7FA] border-b border-[#2A7CA8]/15">
          <RotateCcw size={13} strokeWidth={2} className="shrink-0 text-[#1a5f7a]" />
          <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">REGISTROS</span>
          {sorted.filter(e => e.closeSignal === null).length > 0 && (
            <span className="ml-auto rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold text-white tabular-nums">
              {sorted.filter(e => e.closeSignal === null).length}
            </span>
          )}
        </div>

        {/* Filtros */}
        <div className="shrink-0 flex flex-col gap-1.5 border-b border-[#e8edf3] px-3 py-2">
          {/* Estado */}
          <div className="flex gap-px rounded-lg bg-[#f1f5f9] p-0.5">
            {(["todos", "pendiente", "revisar", "regularizado", "ok"] as const).map(est => (
              <button key={est}
                onClick={() => setFilterEstado(est)}
                className={`flex-1 rounded-md py-2 text-[9.5px] font-bold uppercase tracking-wide transition ${
                  filterEstado === est
                    ? est === "pendiente" ? "bg-amber-500 text-white shadow-sm"
                    : est === "revisar"   ? "bg-orange-400 text-white shadow-sm"
                    : est === "regularizado" ? "bg-emerald-600 text-white shadow-sm"
                    : est === "ok"        ? "bg-[#6b7280] text-white shadow-sm"
                    : "bg-white text-[#374151] shadow-sm"
                    : "text-[#9ca3af] hover:text-[#374151]"
                }`}>
                {est === "todos" ? "Todos" : est === "pendiente" ? "Pendiente" : est === "revisar" ? "Revisar" : est === "regularizado" ? "Regularizado" : "OK"}
              </button>
            ))}
          </div>
          {/* Caja + Rango de fechas — una sola línea */}
          <div className="flex items-center gap-1.5">
            <select value={filterCaja} onChange={e => setFilterCaja(e.target.value)}
              className="shrink-0 rounded-lg border border-[#e4e9f0] bg-white px-2 py-1 text-[10px] text-[#374151] outline-none focus:border-[#2154d8]">
              <option value="">Todas las cajas</option>
              {uniqueCajas.map(c => <option key={c} value={c}>Caja {c}</option>)}
            </select>
            <input type="date" value={filterFechaDesde} onChange={e => setFilterFechaDesde(e.target.value)}
              className="flex-1 rounded-lg border border-[#e4e9f0] bg-white px-2 py-1 text-[10px] text-[#374151] outline-none focus:border-[#2154d8]" />
            <span className="shrink-0 text-[9px] font-semibold text-[#9ca3af]">—</span>
            <input type="date" value={filterFechaHasta} onChange={e => setFilterFechaHasta(e.target.value)}
              className="flex-1 rounded-lg border border-[#e4e9f0] bg-white px-2 py-1 text-[10px] text-[#374151] outline-none focus:border-[#2154d8]" />
          </div>
          {/* Operador */}
          <input type="text" value={filterOperador} onChange={e => setFilterOperador(e.target.value)}
            placeholder="Buscar operador..."
            className="w-full rounded-lg border border-[#e4e9f0] bg-white px-2 py-1 text-[10px] text-[#374151] outline-none focus:border-[#2154d8] placeholder:text-[#c8d4e0]" />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 p-6 text-center">
              <ClipboardList size={24} strokeWidth={1.2} className="text-[#d1d5db]" />
              <p className="text-[11px] font-semibold text-[#9ca3af]">Sin registros para los filtros seleccionados</p>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-[#f4f6f9]">
              {sorted.map(e => {
                const isPending   = e.closeSignal === null;
                const isWarn      = e.closeSignal === "warn" && !e.correction;
                const isCorrected = !!e.correction;
                const isOk        = e.closeSignal === "ok" && !isCorrected;
                const isSelected  = e.id === selectedId;
                return (
                  <button
                    key={e.id}
                    onClick={() => handleSelect(e.id)}
                    className={`flex flex-col gap-1 px-4 py-2.5 text-left transition hover:bg-[#f8fafc] ${
                      isSelected ? "bg-[#EEF3FD] ring-inset ring-1 ring-[#2154d8]/20" : ""
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold tabular-nums text-[#1a5f7a]">C{e.boxCode}</span>
                      <span className="truncate flex-1 text-[10px] font-semibold text-[#6b7280]">{e.boxLabel}</span>
                      {isPending && (
                        <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[8.5px] font-bold text-amber-700">PENDIENTE</span>
                      )}
                      {isWarn && (
                        <span className="shrink-0 rounded-full bg-amber-50 px-1.5 py-0.5 text-[8.5px] font-bold text-amber-600">⚠ REVISAR</span>
                      )}
                      {isCorrected && (
                        <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8.5px] font-bold text-emerald-700">✓ REGULARIZADO</span>
                      )}
                      {isOk && (
                        <span className="shrink-0 rounded-full bg-[#f4f6f9] px-1.5 py-0.5 text-[8.5px] font-semibold text-[#9ca3af]">CORRECTO</span>
                      )}
                    </div>
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

      {/* RIGHT: panel de corrección */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[#2A7CA8]/30 bg-[#FDFCF9]">

        <div className="shrink-0 flex h-[42px] items-center gap-2 px-4 bg-[#F2F7FA] border-b border-[#2A7CA8]/15">
          <ClipboardList size={13} strokeWidth={2} className="shrink-0 text-[#1a5f7a]" />
          <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">REGULARIZACIÓN</span>
          {selectedEntry && (
            <span className="ml-auto text-[10px] font-semibold text-[#9ca3af]">C{selectedEntry.boxCode} · {selectedEntry.boxLabel}</span>
          )}
        </div>

        {/* ── Sin selección ── */}
        {!selectedEntry && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
            <RotateCcw size={32} strokeWidth={1} className="text-[#d1d5db]" />
            <div>
              <p className="text-[12px] font-semibold text-[#6b7280]">Regularización operacional excepcional</p>
              <p className="text-[11px] text-[#9ca3af] mt-1 leading-relaxed">
                Selecciona una sesión para regularizar cierres pendientes<br />o documentar diferencias en arqueos.
              </p>
            </div>
            <div className="mt-1 flex flex-col gap-1.5 rounded-xl border border-[#f0f4f8] bg-[#f8fafd] px-4 py-3 text-left w-full max-w-xs">
              <p className="text-[9.5px] font-bold uppercase tracking-widest text-[#c0cad4]">Casos frecuentes</p>
              {[
                "Corte eléctrico durante cierre",
                "Sistema reiniciado inesperadamente",
                "Billete falso detectado",
                "Continuidad overnight",
              ].map(c => (
                <p key={c} className="text-[10.5px] text-[#9ca3af]">· {c}</p>
              ))}
            </div>
          </div>
        )}

        {/* ── Sesión sin acción pendiente ── */}
        {selectedEntry && !isActionable && !applied && (
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 pt-5 pb-5">
            <div className="flex items-center gap-2.5 rounded-xl border border-emerald-200 bg-[#f0fdf4] px-4 py-3">
              <CheckCircle size={15} className="text-emerald-500 shrink-0" />
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wide text-emerald-700">Sin corrección pendiente</p>
                <p className="text-[10px] text-emerald-600 mt-0.5">
                  {selectedEntry.closeSignal === "ok" ? "Arqueo correcto" : "Diferencia documentada"}
                </p>
              </div>
            </div>
            {selectedEntry.correction && (
              <div className="flex flex-col gap-2 rounded-xl border border-[#e4e9f0] bg-white px-4 py-3">
                <p className="text-[9.5px] font-bold uppercase tracking-widest text-[#c0cad4]">Regularización registrada</p>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-[10px] text-[#9ca3af] shrink-0">Acción</span>
                    <span className="text-[10px] font-semibold text-[#374151] text-right capitalize">{selectedEntry.correction.accion.replace(/_/g, " ")}</span>
                  </div>
                  {selectedEntry.correction.fechaOperacional && (
                    <div className="flex justify-between">
                      <span className="text-[10px] text-[#9ca3af]">Cierre operacional</span>
                      <span className="text-[10.5px] tabular-nums text-[#374151]">{fmtDatetime(selectedEntry.correction.fechaOperacional)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-[10px] text-[#9ca3af] shrink-0">Por</span>
                    <span className="text-[10.5px] font-semibold text-[#374151] text-right">{selectedEntry.correction.correctedBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-[#9ca3af]">Registrado</span>
                    <span className="text-[10.5px] tabular-nums text-[#374151]">{fmtDatetime(selectedEntry.correction.correctedAt)}</span>
                  </div>
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-[10px] text-[#9ca3af] shrink-0">Motivo</span>
                    <span className="text-[10.5px] font-semibold text-[#374151] text-right">{selectedEntry.correction.motivo}</span>
                  </div>
                </div>
              </div>
            )}
            {/* Línea de tiempo */}
            {sessionTimeline.length > 0 && <TimelineSection events={sessionTimeline} entry={selectedEntry} />}
          </div>
        )}

        {/* ── Corrección aplicada con éxito ── */}
        {selectedEntry && applied && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
            <CheckCircle size={32} strokeWidth={1.5} className="text-emerald-500" />
            <p className="text-[13px] font-semibold text-[#374151]">Regularización aplicada</p>
            {selectedEntry.correction && (
              <div className="rounded-xl border border-emerald-100 bg-[#f0fdf4] px-5 py-3 text-left w-full max-w-xs">
                <div className="flex flex-col gap-1.5">
                  <p className="text-[10px] text-emerald-600">Acción: <strong>{selectedEntry.correction.accion.replace(/_/g, " ")}</strong></p>
                  <p className="text-[10px] text-emerald-600">Por: <strong>{selectedEntry.correction.correctedBy}</strong></p>
                  <p className="text-[10px] text-emerald-600">Motivo: {selectedEntry.correction.motivo}</p>
                  <p className="text-[10px] tabular-nums text-emerald-600">Registrado: {fmtDatetime(selectedEntry.correction.correctedAt)}</p>
                </div>
              </div>
            )}
            <button
              onClick={() => { setApplied(false); setSelectedId(null); }}
              className="mt-1 text-[11px] font-semibold text-[#2154d8] hover:underline"
            >
              Seleccionar otra sesión
            </button>
          </div>
        )}

        {/* ── Formulario de corrección ── */}
        {selectedEntry && isActionable && !applied && (
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 pt-4 pb-5">

            {/* Info sesión */}
            <div className="flex flex-col divide-y divide-[#f4f6f9] rounded-xl border border-[#e4e9f0] bg-white overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 bg-[#f8fafd]">
                <Monitor size={11} strokeWidth={2} className="text-[#9ca3af] shrink-0" />
                <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">Sesión seleccionada</span>
              </div>
              <div className="flex justify-between px-4 py-2">
                <span className="text-[10px] text-[#9ca3af]">Caja</span>
                <span className="text-[10.5px] font-bold text-[#1a5f7a]">C{selectedEntry.boxCode} · {selectedEntry.boxLabel}</span>
              </div>
              <div className="flex justify-between px-4 py-2">
                <span className="text-[10px] text-[#9ca3af]">Apertura</span>
                <span className="text-[10.5px] tabular-nums text-[#374151]">{fmtDatetime(selectedEntry.openedAt)}</span>
              </div>
              <div className="flex justify-between px-4 py-2">
                <span className="text-[10px] text-[#9ca3af]">Cierre</span>
                <span className={`text-[10.5px] tabular-nums ${selectedEntry.closedAt ? "text-[#374151]" : "font-semibold text-amber-500"}`}>
                  {selectedEntry.closedAt ? fmtDatetime(selectedEntry.closedAt) : "Sin cierre registrado"}
                </span>
              </div>
            </div>

            {/* Línea de tiempo — si tiene eventos */}
            {sessionTimeline.length > 0 && <TimelineSection events={sessionTimeline} entry={selectedEntry} />}

            {/* Selector de acción — solo cuando cierre pendiente */}
            {selectedEntry.closeSignal === null && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">Acción</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setSelectedAccion("regularizar_cierre"); setFechaOperacional(""); setMotivoPreset(""); setMotivoLibre(""); }}
                    className={`flex-1 rounded-xl border py-2 text-[10.5px] font-bold uppercase tracking-wide transition ${
                      selectedAccion === "regularizar_cierre"
                        ? "border-[#2154d8]/30 bg-[#EEF3FD] text-[#2154d8]"
                        : "border-[#e4e9f0] bg-white text-[#9ca3af] hover:border-[#2154d8]/20"
                    }`}
                  >
                    Regularizar cierre
                  </button>
                  <button
                    onClick={() => { setSelectedAccion("cierre_extemporaneo"); setMotivoPreset(""); setMotivoLibre(""); }}
                    className={`flex-1 rounded-xl border py-2 text-[10.5px] font-bold uppercase tracking-wide transition ${
                      selectedAccion === "cierre_extemporaneo"
                        ? "border-amber-300 bg-amber-50 text-amber-700"
                        : "border-[#e4e9f0] bg-white text-[#9ca3af] hover:border-amber-200"
                    }`}
                  >
                    Cierre extemporáneo
                  </button>
                </div>
              </div>
            )}

            {/* Fecha operacional — solo cierre_extemporaneo */}
            {accion === "cierre_extemporaneo" && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">
                  Fecha/Hora operacional del cierre <span className="text-amber-500">*</span>
                </span>
                <input
                  type="datetime-local"
                  value={fechaOperacional}
                  onChange={e => setFechaOperacional(e.target.value)}
                  max={new Date().toISOString().slice(0, 16)}
                  className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-[12px] text-[#374151] outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/15"
                />
                <p className="text-[9.5px] text-[#9ca3af] px-1">Momento real en que ocurrió el cierre, antes de la regularización.</p>
              </div>
            )}

            {/* ¿Arqueo cuadró? — regularizar_cierre y cierre_extemporaneo */}
            {(accion === "regularizar_cierre" || accion === "cierre_extemporaneo") && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">¿El arqueo cuadró?</span>
                <div className="flex gap-2">
                  <button onClick={() => setNewSignal("ok")}
                    className={`flex-1 rounded-xl border py-2 text-[10.5px] font-bold uppercase tracking-wide transition ${
                      newSignal === "ok"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-[#e4e9f0] bg-white text-[#9ca3af] hover:border-emerald-200 hover:text-emerald-600"
                    }`}>✓ Sin diferencias</button>
                  <button onClick={() => setNewSignal("warn")}
                    className={`flex-1 rounded-xl border py-2 text-[10.5px] font-bold uppercase tracking-wide transition ${
                      newSignal === "warn"
                        ? "border-amber-300 bg-amber-50 text-amber-700"
                        : "border-[#e4e9f0] bg-white text-[#9ca3af] hover:border-amber-200 hover:text-amber-600"
                    }`}>⚠ Había diferencias</button>
                </div>
              </div>
            )}

            {/* Motivo obligatorio */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">
                Motivo <span className="text-amber-500">*</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map(p => (
                  <button key={p}
                    onClick={() => { setMotivoPreset(p); if (p !== "Otro") setMotivoLibre(""); }}
                    className={`rounded-xl border px-3 py-1.5 text-[10.5px] font-semibold transition ${
                      motivoPreset === p
                        ? "border-[#2154d8]/30 bg-[#EEF3FD] text-[#2154d8]"
                        : "border-[#e4e9f0] bg-white text-[#6b7280] hover:border-[#2154d8]/20 hover:text-[#374151]"
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

            {/* Quién regulariza */}
            <div className="flex items-center gap-1.5 rounded-xl border border-[#f0f4f8] bg-[#f8fafd] px-3.5 py-2">
              <Monitor size={11} strokeWidth={2} className="text-[#c0cad4] shrink-0" />
              <span className="text-[10px] text-[#9ca3af]">
                Se registrará como: <strong className="text-[#374151]">{operatorName}</strong>
              </span>
            </div>

            {/* Botón */}
            <button onClick={handleApply} disabled={!canApply}
              className={`flex h-10 w-full items-center justify-center gap-1.5 rounded-2xl px-4 text-[13px] font-semibold uppercase tracking-wider transition ${
                canApply
                  ? "bg-[#2154d8] text-white hover:bg-[#1a44be] active:scale-[0.98] shadow-[0_2px_8px_rgba(33,84,216,0.20)]"
                  : "cursor-not-allowed bg-[#2154d8]/[0.15] text-[#2154d8]/50"
              }`}>
              <RotateCcw size={13} strokeWidth={2} />
              {accion === "cierre_extemporaneo" ? "Registrar cierre extemporáneo"
                : accion === "regularizar_cierre" ? "Regularizar cierre"
                : "Documentar diferencia"}
            </button>

          </div>
        )}

      </div>
    </section>
  );
}
