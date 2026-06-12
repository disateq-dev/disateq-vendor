import { useState, useEffect } from "react";
import { Monitor, ShieldCheck, CheckCircle } from "lucide-react";
import {
  recordSessionCorrection, recordAperturaCorrection,
  type SessionEntry, type CorrectionRecord,
} from "./services/session-history.service";
import {
  markAuthorizationExecuted, type CajaAuthorization,
} from "./services/supervision-authorization.service";

const MOTIVOS_EXEC_EXTMP = [
  "Finalicé el turno sin cerrar el sistema",
  "Corte eléctrico antes del cierre",
  "Emergencia antes del cierre",
  "Delegué el turno sin cerrar",
  "Otro",
];

const MOTIVOS_EXEC_CORRECCION = [
  "Reconteo confirmó el monto correcto",
  "Separé el billete o moneda falso identificado",
  "Ingresé el monto correcto en el sistema",
  "Registré la diferencia autorizada",
  "Otro",
];

const AUTH_EXEC_LABELS: Record<string, string> = {
  cierre_activo:       "Cierre de sesión activa",
  cierre_extemporaneo: "Cierre extemporáneo",
  correccion_cierre:   "Corrección de cierre",
  correccion_apertura: "Corrección de apertura",
};

const AUTH_CARD_TITLES: Record<string, string> = {
  cierre_activo:       "CIERRE DE SESIÓN ACTIVA",
  cierre_extemporaneo: "CIERRE EXTEMPORÁNEO PENDIENTE",
  correccion_cierre:   "CORRECCIÓN DE CIERRE PENDIENTE",
  correccion_apertura: "CORRECCIÓN DE APERTURA PENDIENTE",
};

function fmtDt(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

interface AutorizacionEjecucionCardProps {
  activeAuth:     CajaAuthorization;
  targetSession:  SessionEntry | null;
  operatorName:   string;
  onExecuted:     () => void;
}

export function AutorizacionEjecucionCard({
  activeAuth, targetSession, operatorName, onExecuted,
}: AutorizacionEjecucionCardProps) {
  const [execFecha,        setExecFecha]        = useState("");
  const [execSignal,       setExecSignal]       = useState<"ok" | "warn">("ok");
  const [execMotivoPreset, setExecMotivoPreset] = useState("");
  const [execMotivoLibre,  setExecMotivoLibre]  = useState("");
  const [execNewApertura,  setExecNewApertura]  = useState("");
  const [execDone,         setExecDone]         = useState(false);

  useEffect(() => {
    setExecFecha(""); setExecSignal("ok");
    setExecMotivoPreset(""); setExecMotivoLibre("");
    setExecNewApertura(""); setExecDone(false);
  }, [activeAuth.id]);

  const execMotivoCombined = (execMotivoPreset === "Otro" || execMotivoPreset === "")
    ? execMotivoLibre.trim()
    : execMotivoPreset;

  const newAperturaNum = parseFloat(execNewApertura.replace(",", "."));
  const canExec = execMotivoCombined.length >= 3 &&
    (activeAuth.type !== "cierre_extemporaneo" || execFecha.length > 0) &&
    (activeAuth.type !== "correccion_apertura" || (execNewApertura.length > 0 && newAperturaNum >= 0)) &&
    !execDone;

  function handleExec() {
    if (!canExec) return;
    if (activeAuth.type === "cierre_extemporaneo" || activeAuth.type === "correccion_cierre") {
      const correction: CorrectionRecord = {
        correctedBy: operatorName,
        correctedAt: new Date().toISOString(),
        motivo:      execMotivoCombined,
        accion:      activeAuth.type === "cierre_extemporaneo" ? "cierre_extemporaneo" : "documentar_diferencia",
        prevSignal:  activeAuth.type === "cierre_extemporaneo" ? null : "warn",
        newSignal:   execSignal,
        ...(activeAuth.type === "cierre_extemporaneo" && execFecha
          ? { fechaOperacional: new Date(execFecha).toISOString() } : {}),
      };
      recordSessionCorrection(activeAuth.sessionId, correction, execSignal);
    } else if (activeAuth.type === "correccion_apertura") {
      const correction: CorrectionRecord = {
        correctedBy:  operatorName,
        correctedAt:  new Date().toISOString(),
        motivo:       execMotivoCombined,
        accion:       "correccion_apertura",
        prevSignal:   targetSession?.closeSignal ?? "ok",
        newSignal:    targetSession?.closeSignal ?? "ok",
        prevApertura: targetSession?.apertura,
        newApertura:  newAperturaNum,
      };
      recordAperturaCorrection(activeAuth.sessionId, correction);
    }
    markAuthorizationExecuted(activeAuth.id, operatorName);
    onExecuted();
    setExecDone(true);
  }

  return (
    <div className="flex flex-col overflow-hidden rounded-[28px] border border-[#2A7CA8]/50 bg-[#FDFCF9]">
      <div className="shrink-0 flex h-[42px] items-center gap-2 px-4 border-b bg-[#F2F7FA] border-[#2A7CA8]/15">
        <ShieldCheck size={13} strokeWidth={2} className="shrink-0 text-[#2154d8]" />
        <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">
          {AUTH_CARD_TITLES[activeAuth.type]}
        </span>
      </div>
      <div className="flex flex-col gap-3 px-4 pt-3 pb-3">

      {/* Info de la autorización */}
      <div className="flex flex-col gap-1 rounded-lg border border-[#2154d8]/15 bg-white px-3 py-2">
        <div className="flex justify-between">
          <span className="text-[10px] text-[#9ca3af]">Acción autorizada</span>
          <span className="text-[10.5px] font-semibold text-[#374151]">{AUTH_EXEC_LABELS[activeAuth.type]}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[10px] text-[#9ca3af]">Autorizado por</span>
          <span className="text-[10.5px] font-semibold text-[#374151]">{activeAuth.authorizedBy}</span>
        </div>
        <div className="flex justify-between items-start gap-3">
          <span className="text-[10px] text-[#9ca3af] shrink-0">Motivo</span>
          <span className="text-[10.5px] text-[#374151] text-right">{activeAuth.motivo}</span>
        </div>
        {targetSession && (
          <div className="flex justify-between">
            <span className="text-[10px] text-[#9ca3af]">Sesión</span>
            <span className="text-[10.5px] tabular-nums text-[#6b7280]">
              C{targetSession.boxCode} · {fmtDt(targetSession.openedAt)}
            </span>
          </div>
        )}
      </div>

      {/* Sesión activa: operador cierra desde Turno */}
      {activeAuth.type === "cierre_activo" && (
        <p className="text-[10px] text-[#6b7280] leading-snug">
          El cierre se ejecuta desde la pantalla de Gestión Turno.
        </p>
      )}

      {/* Formulario corrección de apertura */}
      {activeAuth.type === "correccion_apertura" && !execDone && (
        <div className="flex flex-col gap-2">
          {targetSession && targetSession.apertura > 0 && (
            <div className="flex justify-between items-center rounded-lg border border-[#e4e9f0] bg-white px-3 py-2">
              <span className="text-[10px] text-[#9ca3af]">Apertura registrada</span>
              <span className="text-[11px] font-bold tabular-nums text-[#374151]">
                S/ {targetSession.apertura.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">
              Monto correcto de apertura <span className="text-amber-500">*</span>
            </span>
            <input
              type="number" min="0" step="0.01"
              value={execNewApertura}
              onChange={e => setExecNewApertura(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-[#2154d8]/30 bg-white px-3 py-2 text-[13px] font-bold tabular-nums text-[#374151] outline-none focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
            />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">
              Motivo <span className="text-amber-500">*</span>
            </span>
            <div className="flex flex-wrap gap-1">
              {MOTIVOS_EXEC_CORRECCION.map(p => (
                <button key={p}
                  onClick={() => { setExecMotivoPreset(p); if (p !== "Otro") setExecMotivoLibre(""); }}
                  className={`rounded-xl border px-3 py-1.5 text-[10px] font-semibold transition ${
                    execMotivoPreset === p
                      ? "border-[#45b356]/40 bg-emerald-50 text-emerald-700"
                      : "border-[#e4e9f0] bg-white text-[#6b7280] hover:border-emerald-200"
                  }`}>{p}</button>
              ))}
            </div>
            {(execMotivoPreset === "Otro" || execMotivoPreset === "") && (
              <input type="text" value={execMotivoLibre} onChange={e => setExecMotivoLibre(e.target.value)}
                placeholder="Describe brevemente..."
                className="w-full rounded-xl border border-[#e4e9f0] px-3 py-2 text-[12px] text-[#374151] outline-none focus:border-[#45b356]" />
            )}
          </div>
          <div className="flex items-center gap-1.5 rounded-xl border border-[#f0f4f8] bg-white px-3.5 py-2">
            <Monitor size={11} strokeWidth={2} className="text-[#c0cad4] shrink-0" />
            <span className="text-[10px] text-[#9ca3af]">
              Ejecutado por: <strong className="text-[#374151]">{operatorName}</strong>
            </span>
          </div>
          <button onClick={handleExec} disabled={!canExec}
            className={`flex h-10 w-full items-center justify-center gap-1.5 rounded-2xl px-4 text-[13px] font-semibold uppercase tracking-wider transition ${
              canExec
                ? "bg-[#45b356] text-white hover:bg-[#35994a] active:scale-[0.98]"
                : "cursor-not-allowed bg-[#45b356]/[0.15] text-[#45b356]/50"
            }`}>
            Registrar Corrección de Apertura
          </button>
        </div>
      )}

      {/* Formulario de ejecución — extemporáneo y corrección de cierre */}
      {(activeAuth.type === "cierre_extemporaneo" || activeAuth.type === "correccion_cierre") && !execDone && (
        <div className="flex flex-col gap-2">

          {activeAuth.type === "cierre_extemporaneo" && (
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">
                Fecha/hora real del cierre <span className="text-amber-500">*</span>
              </span>
              <input type="datetime-local" value={execFecha} onChange={e => setExecFecha(e.target.value)}
                max={new Date().toISOString().slice(0, 16)}
                className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-[12px] text-[#374151] outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/15" />
            </div>
          )}

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">
              {activeAuth.type === "cierre_extemporaneo" ? "¿El arqueo cuadró?" : "Resultado de la corrección"}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setExecSignal("ok")}
                className={`flex-1 rounded-xl border py-2 text-[10.5px] font-bold uppercase tracking-wide transition ${
                  execSignal === "ok"
                    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
                    : "border-[#e4e9f0] bg-white text-[#9ca3af] hover:border-emerald-200"
                }`}>✓ Sin diferencias</button>
              <button onClick={() => setExecSignal("warn")}
                className={`flex-1 rounded-xl border py-2 text-[10.5px] font-bold uppercase tracking-wide transition ${
                  execSignal === "warn"
                    ? "border-amber-300 bg-amber-50 text-amber-700"
                    : "border-[#e4e9f0] bg-white text-[#9ca3af] hover:border-amber-200"
                }`}>⚠ Con diferencias</button>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">
              Motivo de la ejecución <span className="text-amber-500">*</span>
            </span>
            <div className="flex flex-wrap gap-1">
              {(activeAuth.type === "cierre_extemporaneo" ? MOTIVOS_EXEC_EXTMP : MOTIVOS_EXEC_CORRECCION).map(p => (
                <button key={p}
                  onClick={() => { setExecMotivoPreset(p); if (p !== "Otro") setExecMotivoLibre(""); }}
                  className={`rounded-xl border px-3 py-1.5 text-[10px] font-semibold transition ${
                    execMotivoPreset === p
                      ? "border-[#45b356]/40 bg-emerald-50 text-emerald-700"
                      : "border-[#e4e9f0] bg-white text-[#6b7280] hover:border-emerald-200"
                  }`}>{p}</button>
              ))}
            </div>
            {(execMotivoPreset === "Otro" || execMotivoPreset === "") && (
              <input type="text" value={execMotivoLibre} onChange={e => setExecMotivoLibre(e.target.value)}
                placeholder="Describe brevemente..."
                className="w-full rounded-xl border border-[#e4e9f0] px-3 py-2 text-[12px] text-[#374151] outline-none focus:border-[#45b356]" />
            )}
          </div>

          <div className="flex items-center gap-1.5 rounded-xl border border-[#f0f4f8] bg-white px-3.5 py-2">
            <Monitor size={11} strokeWidth={2} className="text-[#c0cad4] shrink-0" />
            <span className="text-[10px] text-[#9ca3af]">
              Ejecutado por: <strong className="text-[#374151]">{operatorName}</strong>
            </span>
          </div>

          <button onClick={handleExec} disabled={!canExec}
            className={`flex h-10 w-full items-center justify-center gap-1.5 rounded-2xl px-4 text-[13px] font-semibold uppercase tracking-wider transition ${
              canExec
                ? "bg-[#45b356] text-white hover:bg-[#35994a] active:scale-[0.98]"
                : "cursor-not-allowed bg-[#45b356]/[0.15] text-[#45b356]/50"
            }`}>
            Ejecutar Corrección
          </button>
        </div>
      )}

      {execDone && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-3 py-2.5">
          <CheckCircle size={13} className="text-emerald-500 shrink-0" />
          <span className="text-[10.5px] font-semibold text-emerald-700">
            Corrección registrada · Pendiente de validación supervisora
          </span>
        </div>
      )}
      </div>
    </div>
  );
}
