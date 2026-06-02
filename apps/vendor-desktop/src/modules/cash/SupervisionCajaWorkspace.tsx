import { useState } from "react";
import { Shield, CheckCircle, ClipboardList, Clock, Monitor, Printer, ShieldCheck } from "lucide-react";
import { usePOS } from "../../context/POSContext";
import {
  loadSessionHistory, getCurrentSessionId,
  type SessionEntry,
} from "./services/session-history.service";
import {
  loadAuthorizations, recordAuthorization, markAuthorizationValidated,
  type CajaAuthorization, type AuthorizationType,
} from "./services/supervision-authorization.service";

const MOTIVOS_AUTH: Record<string, string[]> = {
  cierre_activo: [
    "Fin de turno regular",
    "Relevo de turno",
    "Cierre por baja operación",
    "Cierre por emergencia",
    "Otro",
  ],
  cierre_extemporaneo: [
    "Operador olvidó cerrar al terminar turno",
    "Cierre no completado por corte eléctrico",
    "Sistema cerrado sin completar cierre",
    "Cierre delegado no ejecutado",
    "Recuperación posterior al turno",
    "Otro",
  ],
  correccion_cierre: [
    "Diferencia verificada · billete o moneda falso",
    "Error de conteo confirmado",
    "Diferencia por operación externa autorizada",
    "Monto de arqueo corregido en revisión",
    "Otro",
  ],
  correccion_apertura: [
    "Fondo de apertura mal registrado",
    "Error de denominación en apertura",
    "Diferencia en fondo inicial detectada",
    "Otro",
  ],
};

const AUTH_LABELS: Record<string, string> = {
  cierre_activo:       "Cierre de sesión activa",
  cierre_extemporaneo: "Cierre extemporáneo",
  correccion_cierre:   "Corrección de cierre",
  correccion_apertura: "Corrección de apertura",
};

// Motivos para intervenciones de origen humano — observaciones posteriores al cierre correcto
const MOTIVOS_AUTH_POSTERIOR: Record<string, string[]> = {
  correccion_cierre: [
    "Billete o moneda falso detectado con posterioridad",
    "Discrepancia encontrada en conciliación posterior",
    "Diferencia detectada en revisión de registros",
    "Observación operacional descubierta tras cierre",
    "Otro",
  ],
  correccion_apertura: [
    "Fondo de apertura registrado incorrectamente",
    "Error de denominación detectado en revisión",
    "Diferencia en fondo inicial descubierta con posterioridad",
    "Otro",
  ],
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
        Motivo de autorización <span className="text-amber-500">*</span>
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
        Autorización emitida por: <strong className="text-[#374151]">{name}</strong>
      </span>
    </div>
  );
}

function AuthorizeButton({ canAuthorize, onClick, label }: {
  canAuthorize: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button onClick={onClick} disabled={!canAuthorize}
      className={`flex h-10 w-full items-center justify-center gap-1.5 rounded-2xl px-4 text-[13px] font-semibold uppercase tracking-wider transition ${
        canAuthorize
          ? "bg-[#2154d8] text-white hover:bg-[#1a44be] active:scale-[0.98] shadow-[0_2px_8px_rgba(33,84,216,0.20)]"
          : "cursor-not-allowed bg-[#2154d8]/[0.15] text-[#2154d8]/50"
      }`}>
      <ShieldCheck size={14} strokeWidth={2.5} />
      {label}
    </button>
  );
}

// ── Componente principal ────────────────────────────────────────────────────

interface SupervisionCajaProps {
  onAutorizarCierre?: () => void;
}

export function SupervisionCajaWorkspace({ onAutorizarCierre }: SupervisionCajaProps = {}) {
  const { activeOperator, operators, cashSession } = usePOS();

  const [history,        setHistory]        = useState<SessionEntry[]>(() => loadSessionHistory());
  const [authorizations, setAuthorizations] = useState<CajaAuthorization[]>(() => loadAuthorizations());
  const [selectedId,     setSelectedId]     = useState<string | null>(null);
  const [motivoPreset,   setMotivoPreset]   = useState("");
  const [motivoLibre,    setMotivoLibre]    = useState("");
  const [obsExpanded,    setObsExpanded]    = useState(false);
  const [obsAuthType,    setObsAuthType]    = useState<"correccion_cierre" | "correccion_apertura">("correccion_cierre");

  const [filterEstado,       setFilterEstado]       = useState<"todos" | "abierto" | "sin_cierre" | "cerrado">("todos");
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

  const currentSid = getCurrentSessionId();

  const filtered = history.slice(0, 60).filter(e => {
    if (filterEstado !== "todos") {
      const isAbierto   = cashSession.isOpen && e.id === currentSid;
      const isSinCierre = e.closeSignal === null && !isAbierto;
      const isCerrado   = e.closeSignal !== null;
      if (filterEstado === "abierto"    && !isAbierto)   return false;
      if (filterEstado === "sin_cierre" && !isSinCierre) return false;
      if (filterEstado === "cerrado"    && !isCerrado)   return false;
    }
    if (filterBlockPrefix && e.boxCode[0] !== filterBlockPrefix) return false;
    if (filterCaja        && e.boxCode !== filterCaja)           return false;
    const dt = e.openedAt.slice(0, 10);
    if (filterFechaDesde && dt < filterFechaDesde) return false;
    if (filterFechaHasta && dt > filterFechaHasta) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const p = (e: SessionEntry) => {
      if (cashSession.isOpen && e.id === currentSid) return 0;
      if (e.closeSignal === null) return 1;
      if (e.closeSignal === "warn") return 2;
      return 3;
    };
    return p(a) - p(b);
  });

  const selectedEntry        = sorted.find(e => e.id === selectedId) ?? null;
  const sessionAuthorization = selectedEntry
    ? (authorizations.find(a => a.sessionId === selectedEntry.id) ?? null)
    : null;

  const isPending       = selectedEntry?.closeSignal === null;
  const isWarn          = selectedEntry?.closeSignal === "warn";
  const isOk            = selectedEntry?.closeSignal === "ok";
  const isActiveSession = !!(selectedEntry && isPending && cashSession.isOpen && selectedEntry.id === currentSid);
  const isExtemporaneo  = isPending && !isActiveSession;

  const lastActTs = selectedEntry?.closedAt ?? selectedEntry?.openedAt ?? "";

  const authType: AuthorizationType | null =
    isActiveSession        ? "cierre_activo"       :
    isExtemporaneo         ? "cierre_extemporaneo" :
    isWarn                 ? "correccion_cierre"   :
    (isOk && obsExpanded)  ? obsAuthType           :
    null;

  const presets = authType
    ? (isOk && obsExpanded
        ? (MOTIVOS_AUTH_POSTERIOR[authType] ?? [])
        : (MOTIVOS_AUTH[authType] ?? []))
    : [];
  const motivoFinal  = (motivoPreset === "Otro" || motivoPreset === "") ? motivoLibre.trim() : motivoPreset;
  const canAuthorize = motivoFinal.length >= 5 && !sessionAuthorization;

  const pendingCount = sorted.filter(e => {
    const isAct = cashSession.isOpen && e.id === currentSid;
    const isSC  = e.closeSignal === null && !isAct;
    const isWrn = e.closeSignal === "warn";
    const auth  = authorizations.find(a => a.sessionId === e.id);
    return (isAct || isSC || isWrn) && auth?.status !== "validada";
  }).length;

  function handleSelect(id: string) {
    if (id === selectedId) return;
    setSelectedId(id);
    setMotivoPreset(""); setMotivoLibre("");
    setObsExpanded(false); setObsAuthType("correccion_cierre");
  }

  function handleAuthorize() {
    if (!selectedEntry || !canAuthorize || !authType) return;
    recordAuthorization({
      cajaCode:     selectedEntry.boxCode,
      sessionId:    selectedEntry.id,
      type:         authType,
      motivo:       motivoFinal,
      authorizedBy: supervisorName,
      authorizedAt: new Date().toISOString(),
    });
    setAuthorizations(loadAuthorizations());
    if (authType === "cierre_activo") onAutorizarCierre?.();
  }

  function handleValidate() {
    if (!sessionAuthorization) return;
    markAuthorizationValidated(sessionAuthorization.id, supervisorName);
    setAuthorizations(loadAuthorizations());
  }

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
            {(["todos", "abierto", "sin_cierre", "cerrado"] as const).map(est => (
              <button key={est} onClick={() => setFilterEstado(est)}
                className={`flex-1 rounded-md py-2 text-[9.5px] font-bold uppercase tracking-wide transition ${
                  filterEstado === est
                    ? est === "abierto"    ? "bg-emerald-600 text-white shadow-sm"
                    : est === "sin_cierre" ? "bg-amber-500 text-white shadow-sm"
                    : est === "cerrado"    ? "bg-[#6b7280] text-white shadow-sm"
                    : "bg-white text-[#374151] shadow-sm"
                    : "text-[#9ca3af] hover:text-[#374151]"
                }`}>
                {est === "todos"      ? "Todos"
                : est === "abierto"   ? "Abierto"
                : est === "sin_cierre" ? "Sin Cierre"
                : "Cerrado"}
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
                const isAct  = cashSession.isOpen && e.id === currentSid;
                const isSC   = e.closeSignal === null && !isAct;
                const isWrn  = e.closeSignal === "warn";
                const isCorr = e.closeSignal === "ok";
                const isSel  = e.id === selectedId;
                const auth   = authorizations.find(a => a.sessionId === e.id);
                return (
                  <button key={e.id} onClick={() => handleSelect(e.id)}
                    className={`flex flex-col gap-0.5 px-4 py-2.5 text-left transition hover:bg-[#f8fafc] ${
                      isSel ? "bg-[#EEF3FD] ring-inset ring-1 ring-[#2154d8]/20" : ""
                    }`}>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold tabular-nums text-[#1a5f7a]">C{e.boxCode}</span>
                      <span className="truncate flex-1 text-[10px] font-semibold text-[#6b7280]">{e.boxLabel}</span>
                      {isAct  && <span className="shrink-0 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[8.5px] font-bold text-emerald-700">ACTIVO</span>}
                      {isSC   && <span className="shrink-0 rounded-full bg-amber-100  px-1.5 py-0.5 text-[8.5px] font-bold text-amber-700">SIN CIERRE</span>}
                      {isWrn  && !auth && <span className="shrink-0 rounded-full bg-orange-50 px-1.5 py-0.5 text-[8.5px] font-bold text-orange-600">⚠ REVISAR</span>}
                      {auth?.status === "emitida"   && <span className="shrink-0 rounded-full bg-[#EEF3FD] px-1.5 py-0.5 text-[8.5px] font-bold text-[#2154d8]">AUTORIZADO</span>}
                      {auth?.status === "ejecutada" && <span className="shrink-0 rounded-full bg-purple-50 px-1.5 py-0.5 text-[8.5px] font-bold text-purple-700">EJECUTADO</span>}
                      {auth?.status === "validada"  && <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[8.5px] font-bold text-emerald-700">✓ VALIDADO</span>}
                      {isCorr && !auth && <span className="shrink-0 rounded-full bg-[#f4f6f9] px-1.5 py-0.5 text-[8.5px] font-semibold text-[#9ca3af]">CORRECTO</span>}
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

        {!selectedEntry && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
            <Shield size={32} strokeWidth={1} className="text-[#d1d5db]" />
            <div>
              <p className="text-[12px] font-semibold text-[#6b7280]">Supervisión de Caja</p>
              <p className="text-[11px] text-[#9ca3af] mt-1 leading-relaxed">
                Selecciona un registro para revisar el detalle<br />y emitir autorizaciones.
              </p>
            </div>
          </div>
        )}

        {selectedEntry && (
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 pt-4 pb-5">

            {/* DETALLE */}
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

            {/* TRAZABILIDAD */}
            {(sessionAuthorization || selectedEntry.correction) && (
              <div className="flex flex-col gap-2 rounded-xl border border-[#e4e9f0] bg-white px-4 py-3">
                <p className="text-[9.5px] font-bold uppercase tracking-widest text-[#c0cad4]">Trazabilidad</p>

                {sessionAuthorization && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#2154d8]">
                      Autorización · {AUTH_LABELS[sessionAuthorization.type] ?? sessionAuthorization.type}
                    </p>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-[#9ca3af]">Supervisor</span>
                      <span className="text-[10.5px] font-semibold text-[#374151]">{sessionAuthorization.authorizedBy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-[#9ca3af]">Emitida</span>
                      <span className="text-[10.5px] tabular-nums text-[#374151]">{fmtDatetime(sessionAuthorization.authorizedAt)}</span>
                    </div>
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-[10px] text-[#9ca3af] shrink-0">Motivo</span>
                      <span className="text-[10.5px] font-semibold text-[#374151] text-right">{sessionAuthorization.motivo}</span>
                    </div>
                  </div>
                )}

                {(sessionAuthorization?.status === "ejecutada" || sessionAuthorization?.status === "validada") && sessionAuthorization.executedBy && (
                  <div className="flex flex-col gap-1.5 pt-1.5 border-t border-[#f4f6f9]">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-purple-600">Ejecución</p>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-[#9ca3af]">Operador</span>
                      <span className="text-[10.5px] font-semibold text-[#374151]">{sessionAuthorization.executedBy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-[#9ca3af]">Ejecutado</span>
                      <span className="text-[10.5px] tabular-nums text-[#374151]">{fmtDatetime(sessionAuthorization.executedAt!)}</span>
                    </div>
                  </div>
                )}

                {sessionAuthorization?.status === "validada" && (
                  <div className="flex flex-col gap-1.5 pt-1.5 border-t border-[#f4f6f9]">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-emerald-600">Validación</p>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-[#9ca3af]">Supervisor</span>
                      <span className="text-[10.5px] font-semibold text-[#374151]">{sessionAuthorization.validatedBy}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-[#9ca3af]">Validado</span>
                      <span className="text-[10.5px] tabular-nums text-[#374151]">{fmtDatetime(sessionAuthorization.validatedAt!)}</span>
                    </div>
                  </div>
                )}

                {/* Corrección legada — modelo anterior */}
                {selectedEntry.correction && !sessionAuthorization && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-[9px] font-bold uppercase tracking-wider text-[#9ca3af]">Corrección registrada</p>
                    <div className="flex justify-between">
                      <span className="text-[10px] text-[#9ca3af]">Por</span>
                      <span className="text-[10.5px] font-semibold text-[#374151]">{selectedEntry.correction.correctedBy}</span>
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
                )}
              </div>
            )}

            {/* ACCIONES SUPERVISOR */}
            <div className="flex flex-col gap-2.5 rounded-xl border border-[#2A7CA8]/30 bg-[#f8fafd] px-4 py-3">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.14em] text-[#1a5f7a]">Acciones Supervisor</p>

              {/* Autorización emitida */}
              {sessionAuthorization?.status === "emitida" && (
                <div className="flex items-start gap-2 rounded-xl bg-[#EEF3FD] border border-[#2154d8]/20 px-3 py-2.5">
                  <ShieldCheck size={13} className="text-[#2154d8] shrink-0 mt-0.5" />
                  <div className="flex flex-col gap-0.5">
                    <p className="text-[10.5px] font-bold text-[#2154d8]">Autorización emitida</p>
                    <p className="text-[10px] text-[#6b7280] leading-snug">
                      Pendiente de ejecución por el operador en Gestión Cajas.
                    </p>
                  </div>
                </div>
              )}

              {/* Ejecutada — pendiente validación */}
              {sessionAuthorization?.status === "ejecutada" && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-start gap-2 rounded-xl bg-purple-50 border border-purple-200 px-3 py-2.5">
                    <ShieldCheck size={13} className="text-purple-600 shrink-0 mt-0.5" />
                    <p className="text-[10.5px] font-bold text-purple-700">Ejecución registrada · Pendiente de validación</p>
                  </div>
                  <button onClick={handleValidate}
                    className="flex h-10 w-full items-center justify-center gap-1.5 rounded-2xl bg-emerald-600 text-white text-[13px] font-semibold uppercase tracking-wider transition hover:bg-emerald-700 active:scale-[0.98]">
                    <CheckCircle size={14} strokeWidth={2.5} />
                    Validar Ejecución
                  </button>
                </div>
              )}

              {/* Validada */}
              {sessionAuthorization?.status === "validada" && (
                <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2.5">
                  <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                  <span className="text-[10.5px] font-semibold text-emerald-700">Intervención supervisora completada · Validada</span>
                </div>
              )}

              {/* Bloque A: sesión activa */}
              {isActiveSession && !sessionAuthorization && (
                <div className="flex flex-col gap-2">
                  <p className="text-[9.5px] font-bold uppercase tracking-wide text-[#1a5f7a]">Autorizar Cierre</p>
                  <p className="text-[10px] text-[#9ca3af] leading-snug">
                    El turno está activo. La autorización habilita al operador para ejecutar el cierre.
                  </p>
                  <MotivoForm presets={presets} motivoPreset={motivoPreset} motivoLibre={motivoLibre}
                    setMotivoPreset={setMotivoPreset} setMotivoLibre={setMotivoLibre} />
                  <InfoSupervisor name={supervisorName} />
                  <AuthorizeButton canAuthorize={canAuthorize} onClick={handleAuthorize} label="Autorizar Cierre" />
                </div>
              )}

              {/* Bloque B: histórica sin cierre */}
              {isExtemporaneo && !sessionAuthorization && (
                <div className="flex flex-col gap-2">
                  <p className="text-[9.5px] font-bold uppercase tracking-wide text-amber-600">Autorizar Cierre Extemporáneo</p>
                  <p className="text-[10px] text-[#9ca3af] leading-snug">
                    El operador ejecutará el cierre con la fecha y resultado real del arqueo desde Gestión Cajas.
                  </p>
                  <MotivoForm presets={presets} motivoPreset={motivoPreset} motivoLibre={motivoLibre}
                    setMotivoPreset={setMotivoPreset} setMotivoLibre={setMotivoLibre} />
                  <InfoSupervisor name={supervisorName} />
                  <AuthorizeButton canAuthorize={canAuthorize} onClick={handleAuthorize} label="Autorizar Cierre Extemporáneo" />
                </div>
              )}

              {/* Bloque C: cierre con observación */}
              {isWarn && !sessionAuthorization && (
                <div className="flex flex-col gap-2">
                  <p className="text-[9.5px] font-bold uppercase tracking-wide text-orange-600">Autorizar Corrección de Cierre</p>
                  <p className="text-[10px] text-[#9ca3af] leading-snug">
                    El operador ejecutará la corrección desde Gestión Cajas.
                  </p>
                  <MotivoForm presets={presets} motivoPreset={motivoPreset} motivoLibre={motivoLibre}
                    setMotivoPreset={setMotivoPreset} setMotivoLibre={setMotivoLibre} />
                  <InfoSupervisor name={supervisorName} />
                  <AuthorizeButton canAuthorize={canAuthorize} onClick={handleAuthorize} label="Autorizar Corrección de Cierre" />
                </div>
              )}

              {/* Bloque D: sesión correcta */}
              {isOk && !sessionAuthorization && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2">
                    <CheckCircle size={13} className="text-emerald-500 shrink-0" />
                    <span className="text-[10.5px] font-semibold text-emerald-700">Cierre correcto · sin diferencias registradas</span>
                  </div>

                  <button
                    disabled={!selectedEntry.arqueo}
                    title={selectedEntry.arqueo ? "Reimprimir arqueo de esta sesión" : "Sin datos de arqueo disponibles"}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[10.5px] font-bold uppercase tracking-wide transition ${
                      selectedEntry.arqueo
                        ? "border-[#e4e9f0] bg-white text-[#374151] hover:border-[#2154d8]/30 hover:text-[#2154d8]"
                        : "border-[#e4e9f0] bg-[#f4f6f9] text-[#c0cad4] cursor-not-allowed"
                    }`}>
                    <Printer size={11} strokeWidth={2} />
                    Reimprimir Arqueo
                  </button>

                  {/* Intervención supervisora de origen humano */}
                  <div className="flex flex-col gap-2 rounded-xl border border-[#e8edf3] bg-[#fafbfc] px-3 py-2.5">
                    <button
                      onClick={() => { setObsExpanded(v => !v); setMotivoPreset(""); setMotivoLibre(""); }}
                      className="flex items-center justify-between text-left w-full">
                      <span className="text-[10px] font-semibold text-[#6b7280]">Registrar observación supervisora</span>
                      <span className="text-[10px] text-[#9ca3af]">{obsExpanded ? "▲" : "▼"}</span>
                    </button>

                    {obsExpanded && (
                      <div className="flex flex-col gap-2 pt-1 border-t border-[#f0f4f8]">
                        <p className="text-[9.5px] text-[#9ca3af] leading-snug">
                          Intervención iniciada por observación operacional — no necesariamente por una diferencia automática.
                        </p>

                        <div className="flex gap-1.5">
                          {(["correccion_cierre", "correccion_apertura"] as const).map(t => (
                            <button key={t} onClick={() => { setObsAuthType(t); setMotivoPreset(""); setMotivoLibre(""); }}
                              className={`flex-1 rounded-xl border py-2 text-[10px] font-bold uppercase tracking-wide transition ${
                                obsAuthType === t
                                  ? "border-[#2154d8]/30 bg-[#EEF3FD] text-[#2154d8]"
                                  : "border-[#e4e9f0] bg-white text-[#9ca3af] hover:border-[#2154d8]/20"
                              }`}>
                              {t === "correccion_cierre" ? "Corrección Cierre" : "Corrección Apertura"}
                            </button>
                          ))}
                        </div>

                        <MotivoForm presets={presets} motivoPreset={motivoPreset} motivoLibre={motivoLibre}
                          setMotivoPreset={setMotivoPreset} setMotivoLibre={setMotivoLibre} />
                        <InfoSupervisor name={supervisorName} />
                        <AuthorizeButton canAuthorize={canAuthorize} onClick={handleAuthorize}
                          label={obsAuthType === "correccion_cierre" ? "Autorizar Corrección de Cierre" : "Autorizar Corrección de Apertura"} />
                      </div>
                    )}
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
