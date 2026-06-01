import { useState } from "react";
import { AlertTriangle, CheckCircle, ClipboardList, RotateCcw, Clock, Monitor } from "lucide-react";
import { usePOS } from "../../context/POSContext";
import {
  loadSessionHistory, recordSessionCorrection,
  type SessionEntry, type CloseSignal, type CorrectionRecord,
} from "./services/session-history.service";

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

export function CorregirArqueoWorkspace() {
  const { suggestedCashBox, activeOperator, operators, cashSession } = usePOS();

  const currentOpBlockBase  = activeOperator?.blockBase ?? null;
  const activeBox           = cashSession.cashBox;
  const operatorBlockPrefix = activeBox?.code[0] ??
    (currentOpBlockBase !== null ? String(currentOpBlockBase)[0] : suggestedCashBox?.code[0] ?? "1");
  const operatorName        = activeOperator?.name ??
    operators.find(o => o.blockBase !== null && String(o.blockBase)[0] === operatorBlockPrefix && o.status === "ACTIVO")?.name ??
    "Operador";

  const [history,        setHistory]        = useState<SessionEntry[]>(() => loadSessionHistory());
  const [selectedId,     setSelectedId]     = useState<string | null>(null);
  const [motivoPreset,   setMotivoPreset]   = useState("");
  const [motivoLibre,    setMotivoLibre]    = useState("");
  const [newSignal,      setNewSignal]      = useState<CloseSignal>("ok");
  const [applied,        setApplied]        = useState(false);

  // Filtros
  const [filterEstado,   setFilterEstado]   = useState<"todos" | "pendiente" | "revisar" | "regularizado" | "ok">("todos");
  const [filterCaja,     setFilterCaja]     = useState("");
  const [filterOperador, setFilterOperador] = useState("");
  const [filterFecha,    setFilterFecha]    = useState("");

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
      if (filterFecha    && e.openedAt.slice(0, 10) !== filterFecha) return false;
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

  const accion: CorrectionRecord["accion"] | null = selectedEntry
    ? selectedEntry.closeSignal === null ? "regularizar_cierre" : "documentar_diferencia"
    : null;

  const motivoFinal = (motivoPreset === "Otro" || motivoPreset === "") ? motivoLibre.trim() : motivoPreset;
  const canApply    = isActionable && motivoFinal.length >= 5;

  function handleSelect(id: string) {
    if (id === selectedId) return;
    setSelectedId(id);
    setMotivoPreset("");
    setMotivoLibre("");
    setNewSignal("ok");
    setApplied(false);
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
    };
    recordSessionCorrection(selectedEntry.id, correction, resolvedSignal);
    setHistory(loadSessionHistory());
    setApplied(true);
  }

  const PRESETS = accion === "regularizar_cierre" ? MOTIVOS_REGULARIZAR : MOTIVOS_DOCUMENTAR;

  return (
    <section className="flex min-h-0 flex-1 gap-2">

      {/* LEFT: lista sesiones */}
      <div className="flex w-[320px] shrink-0 flex-col overflow-hidden rounded-[28px] border border-[#2A7CA8]/50 bg-[#FDFCF9]">
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
                className={`flex-1 rounded-md py-1 text-[8px] font-bold uppercase tracking-wide transition ${
                  filterEstado === est
                    ? est === "pendiente" ? "bg-amber-500 text-white shadow-sm"
                    : est === "revisar"   ? "bg-orange-400 text-white shadow-sm"
                    : est === "regularizado" ? "bg-emerald-600 text-white shadow-sm"
                    : est === "ok"        ? "bg-[#6b7280] text-white shadow-sm"
                    : "bg-white text-[#374151] shadow-sm"
                    : "text-[#9ca3af] hover:text-[#374151]"
                }`}>
                {est === "todos" ? "Todos" : est === "pendiente" ? "Pend." : est === "revisar" ? "Revisar" : est === "regularizado" ? "Reg." : "OK"}
              </button>
            ))}
          </div>
          {/* Caja + Fecha */}
          <div className="flex gap-1.5">
            <select value={filterCaja} onChange={e => setFilterCaja(e.target.value)}
              className="flex-1 rounded-lg border border-[#e4e9f0] bg-white px-2 py-1 text-[10px] text-[#374151] outline-none focus:border-[#2154d8]">
              <option value="">Todas las cajas</option>
              {uniqueCajas.map(c => <option key={c} value={c}>Caja {c}</option>)}
            </select>
            <input type="date" value={filterFecha} onChange={e => setFilterFecha(e.target.value)}
              className="w-[110px] rounded-lg border border-[#e4e9f0] bg-white px-2 py-1 text-[10px] text-[#374151] outline-none focus:border-[#2154d8]" />
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
          <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">REGULARIZACIÓN DE CAJAS</span>
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
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pt-5 pb-5">
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
                <p className="text-[9.5px] font-bold uppercase tracking-widest text-[#c0cad4]">Corrección registrada</p>
                <div className="flex flex-col gap-1.5">
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-[10px] text-[#9ca3af] shrink-0">Por</span>
                    <span className="text-[10.5px] font-semibold text-[#374151] text-right">{selectedEntry.correction.correctedBy}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] text-[#9ca3af]">Hora</span>
                    <span className="text-[10.5px] tabular-nums text-[#374151]">{fmtDatetime(selectedEntry.correction.correctedAt)}</span>
                  </div>
                  <div className="flex justify-between items-start gap-4">
                    <span className="text-[10px] text-[#9ca3af] shrink-0">Motivo</span>
                    <span className="text-[10.5px] font-semibold text-[#374151] text-right">{selectedEntry.correction.motivo}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Corrección aplicada con éxito ── */}
        {selectedEntry && applied && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
            <CheckCircle size={32} strokeWidth={1.5} className="text-emerald-500" />
            <p className="text-[13px] font-semibold text-[#374151]">Corrección aplicada</p>
            {selectedEntry.correction && (
              <div className="rounded-xl border border-emerald-100 bg-[#f0fdf4] px-5 py-3 text-left w-full max-w-xs">
                <div className="flex flex-col gap-1.5">
                  <p className="text-[10px] text-emerald-600">Por: <strong>{selectedEntry.correction.correctedBy}</strong></p>
                  <p className="text-[10px] text-emerald-600">Motivo: {selectedEntry.correction.motivo}</p>
                  <p className="text-[10px] tabular-nums text-emerald-600">Hora: {fmtDatetime(selectedEntry.correction.correctedAt)}</p>
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
          <div className="flex flex-1 flex-col gap-4 overflow-y-auto px-6 pt-5 pb-5">

            {/* Info sesión */}
            <div className="flex flex-col divide-y divide-[#f4f6f9] rounded-xl border border-[#e4e9f0] bg-white overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-2 bg-[#f8fafd]">
                <Monitor size={11} strokeWidth={2} className="text-[#9ca3af] shrink-0" />
                <span className="text-[9.5px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">Sesión seleccionada</span>
              </div>
              <div className="flex justify-between px-4 py-2">
                <span className="text-[10px] text-[#9ca3af]">Caja</span>
                <span className="text-[10.5px] font-bold text-[#1a5f7a]">C{selectedEntry.boxCode}</span>
              </div>
              <div className="flex justify-between px-4 py-2">
                <span className="text-[10px] text-[#9ca3af]">Función</span>
                <span className="text-[10.5px] font-semibold text-[#374151]">{selectedEntry.boxLabel}</span>
              </div>
              <div className="flex justify-between px-4 py-2">
                <span className="text-[10px] text-[#9ca3af]">Apertura</span>
                <span className="text-[10.5px] tabular-nums text-[#374151]">{fmtDatetime(selectedEntry.openedAt)}</span>
              </div>
              <div className="flex justify-between px-4 py-2">
                <span className="text-[10px] text-[#9ca3af]">Cierre</span>
                <span className={`text-[10.5px] tabular-nums ${selectedEntry.closedAt ? "text-[#374151]" : "font-semibold text-amber-500"}`}>
                  {selectedEntry.closedAt ? fmtTime(selectedEntry.closedAt) : "Sin cierre registrado"}
                </span>
              </div>
              <div className="flex justify-between items-center px-4 py-2 bg-[#fffbf0]">
                <span className="text-[10px] text-[#9ca3af]">Estado</span>
                {selectedEntry.closeSignal === null ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700">~ Cierre pendiente</span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-600">⚠ Con diferencia</span>
                )}
              </div>
            </div>

            {/* Tipo acción */}
            <div className="flex items-center gap-2">
              {accion === "regularizar_cierre" ? (
                <>
                  <RotateCcw size={12} strokeWidth={2} className="text-amber-500 shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-wide text-amber-700">Regularizar cierre pendiente</span>
                </>
              ) : (
                <>
                  <AlertTriangle size={12} strokeWidth={2} className="text-amber-500 shrink-0" />
                  <span className="text-[11px] font-bold uppercase tracking-wide text-amber-700">Documentar diferencia</span>
                </>
              )}
            </div>

            {/* ¿Arqueo cuadró? — solo en regularizar_cierre */}
            {accion === "regularizar_cierre" && (
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">¿El arqueo cuadró?</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setNewSignal("ok")}
                    className={`flex-1 rounded-xl border py-2 text-[11px] font-bold uppercase tracking-wide transition ${
                      newSignal === "ok"
                        ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                        : "border-[#e4e9f0] bg-white text-[#9ca3af] hover:border-emerald-200 hover:text-emerald-600"
                    }`}
                  >
                    ✓ Sin diferencias
                  </button>
                  <button
                    onClick={() => setNewSignal("warn")}
                    className={`flex-1 rounded-xl border py-2 text-[11px] font-bold uppercase tracking-wide transition ${
                      newSignal === "warn"
                        ? "border-amber-300 bg-amber-50 text-amber-700"
                        : "border-[#e4e9f0] bg-white text-[#9ca3af] hover:border-amber-200 hover:text-amber-600"
                    }`}
                  >
                    ⚠ Había diferencias
                  </button>
                </div>
              </div>
            )}

            {/* Presets de motivo */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">
                Motivo <span className="text-amber-500">*</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map(p => (
                  <button
                    key={p}
                    onClick={() => { setMotivoPreset(p); if (p !== "Otro") setMotivoLibre(""); }}
                    className={`rounded-xl border px-3 py-1.5 text-[10.5px] font-semibold transition ${
                      motivoPreset === p
                        ? "border-[#2154d8]/30 bg-[#EEF3FD] text-[#2154d8]"
                        : "border-[#e4e9f0] bg-white text-[#6b7280] hover:border-[#2154d8]/20 hover:text-[#374151]"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              {(motivoPreset === "Otro" || motivoPreset === "") && (
                <input
                  type="text"
                  value={motivoLibre}
                  onChange={e => setMotivoLibre(e.target.value)}
                  placeholder="Describe brevemente el motivo..."
                  maxLength={200}
                  autoFocus={motivoPreset === "Otro"}
                  className="w-full rounded-xl border border-[#e4e9f0] px-3 py-2 text-[12px] text-[#374151] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
                />
              )}
            </div>

            {/* Quién corrige */}
            <div className="flex items-center gap-1.5 rounded-xl border border-[#f0f4f8] bg-[#f8fafd] px-3.5 py-2">
              <Monitor size={11} strokeWidth={2} className="text-[#c0cad4] shrink-0" />
              <span className="text-[10px] text-[#9ca3af]">
                Se registrará como: <strong className="text-[#374151]">{operatorName}</strong>
              </span>
            </div>

            {/* Botón */}
            <button
              onClick={handleApply}
              disabled={!canApply}
              className={`flex h-10 w-full items-center justify-center gap-1.5 rounded-2xl px-4 text-[13px] font-semibold uppercase tracking-wider transition ${
                canApply
                  ? "bg-[#2154d8] text-white hover:bg-[#1a44be] active:scale-[0.98] shadow-[0_2px_8px_rgba(33,84,216,0.20)]"
                  : "cursor-not-allowed bg-[#2154d8]/[0.15] text-[#2154d8]/50"
              }`}
            >
              <RotateCcw size={13} strokeWidth={2} />
              {accion === "regularizar_cierre" ? "Regularizar cierre" : "Documentar diferencia"}
            </button>

          </div>
        )}

      </div>
    </section>
  );
}
