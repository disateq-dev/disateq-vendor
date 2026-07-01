import { useState, useEffect } from "react";
import { ShieldCheck, CheckCircle } from "lucide-react";
import {
  recordSessionCorrection, recordAperturaCorrection,
  type SessionEntry, type CorrectionRecord,
} from "./services/session-history.service";
import {
  markAuthorizationExecuted, markAuthorizationPostponed, type CajaAuthorization,
} from "./services/supervision-authorization.service";
import { MIN_MOTIVO_LEN } from "./services/cash-rules.service";
import { loadBusinessConfig } from "../../config/business";
import {
  printCorreccion, printCorreccionThermal, type CorreccionPrintData,
} from "../../print/printTicket";

const MOTIVO_EJEMPLOS_EXTMP =
  "Ej: Finalicé el turno sin cerrar el sistema · Corte eléctrico antes del cierre · Emergencia antes del cierre · Delegué el turno sin cerrar...";

const MOTIVO_EJEMPLOS_CORRECCION = "Ej: Ajuste de montos, error de digitación, etc.";

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
  onPostponed:    () => void;
}

export function AutorizacionEjecucionCard({
  activeAuth, targetSession, operatorName, onExecuted, onPostponed,
}: AutorizacionEjecucionCardProps) {
  const [execFecha,        setExecFecha]        = useState("");
  const [execSignal,       setExecSignal]       = useState<"ok" | "warn">("ok");
  const [execMotivo,       setExecMotivo]       = useState("");
  const [execNewApertura,  setExecNewApertura]  = useState("");
  const [execDone,         setExecDone]         = useState(false);
  const [showPostpone,     setShowPostpone]     = useState(false);
  const [postponeMotivo,   setPostponeMotivo]   = useState("");
  const [newEfe,  setNewEfe]  = useState("");
  const [newYape, setNewYape] = useState("");
  const [newTar,  setNewTar]  = useState("");

  useEffect(() => {
    setExecFecha(""); setExecSignal("ok");
    setExecMotivo("");
    setExecNewApertura(""); setExecDone(false);
    setShowPostpone(false); setPostponeMotivo("");
    const a = targetSession?.arqueo;
    setNewEfe(a ? a.contadoEfe.toFixed(2) : "0.00");
    setNewYape(a ? a.contadoYape.toFixed(2) : "0.00");
    setNewTar(a ? a.contadoTar.toFixed(2) : "0.00");
  }, [activeAuth.id, targetSession]);

  const execMotivoCombined = execMotivo.trim();

  const newAperturaNum = parseFloat(execNewApertura.replace(",", "."));
  const canExec = execMotivoCombined.length >= 3 &&
    (activeAuth.type !== "cierre_extemporaneo" || execFecha.length > 0) &&
    (activeAuth.type !== "correccion_apertura" || (execNewApertura.length > 0 && newAperturaNum >= 0)) &&
    !execDone;

  // ── corrección de cierre: ORIGINAL / CORREGIDO ──
  const prevEfeNum  = targetSession?.arqueo?.contadoEfe  ?? 0;
  const prevYapeNum = targetSession?.arqueo?.contadoYape ?? 0;
  const prevTarNum  = targetSession?.arqueo?.contadoTar  ?? 0;
  const prevTotalNum = Math.round((prevEfeNum + prevYapeNum + prevTarNum) * 100) / 100;
  const newEfeNum  = parseFloat(newEfe.replace(",", "."))  || 0;
  const newYapeNum = parseFloat(newYape.replace(",", ".")) || 0;
  const newTarNum  = parseFloat(newTar.replace(",", "."))  || 0;
  const newTotalNum = Math.round((newEfeNum + newYapeNum + newTarNum) * 100) / 100;
  const esperadoTotal = targetSession?.arqueo?.sistemaEsperado?.total ?? 0;
  const newDiferenciaCalc = Math.round((newTotalNum - esperadoTotal) * 100) / 100;
  const newSignalCalc: "ok" | "warn" = newDiferenciaCalc === 0 ? "ok" : "warn";

  function handlePostpone() {
    if (postponeMotivo.trim().length < MIN_MOTIVO_LEN) return;
    markAuthorizationPostponed(activeAuth.id, postponeMotivo.trim(), operatorName);
    onPostponed();
  }

  function handleExec() {
    if (!canExec) return;
    if (activeAuth.type === "cierre_extemporaneo") {
      const correction: CorrectionRecord = {
        correctedBy: operatorName,
        correctedAt: new Date().toISOString(),
        motivo:      execMotivoCombined,
        accion:      "cierre_extemporaneo",
        prevSignal:  null,
        newSignal:   execSignal,
        ...(execFecha ? { fechaOperacional: new Date(execFecha).toISOString() } : {}),
      };
      recordSessionCorrection(activeAuth.sessionId, correction, execSignal);
    } else if (activeAuth.type === "correccion_cierre") {
      const correction: CorrectionRecord = {
        correctedBy: operatorName,
        correctedAt: new Date().toISOString(),
        motivo:      execMotivoCombined,
        accion:      "documentar_diferencia",
        prevSignal:  targetSession?.closeSignal ?? "warn",
        newSignal:   newSignalCalc,
        prevContado: { efe: prevEfeNum, yape: prevYapeNum, tar: prevTarNum, total: prevTotalNum },
        newContado:  { efe: newEfeNum,  yape: newYapeNum,  tar: newTarNum,  total: newTotalNum },
        newDiferencia: newDiferenciaCalc,
      };
      recordSessionCorrection(activeAuth.sessionId, correction, newSignalCalc);
      const printData: CorreccionPrintData = {
        businessName:    loadBusinessConfig().nombreComercial,
        cashBoxCode:     targetSession?.boxCode ?? "?",
        sessionDateTime: targetSession ? fmtDt(targetSession.openedAt) : "",
        dateTime:        fmtDt(new Date().toISOString()),
        authorizedBy:    activeAuth.authorizedBy,
        executedBy:      operatorName,
        motivo:          execMotivoCombined,
        prevEfe:   prevEfeNum,  prevYape: prevYapeNum,  prevTar: prevTarNum,  prevTotal: prevTotalNum,
        newEfe:    newEfeNum,   newYape:  newYapeNum,   newTar:  newTarNum,   newTotal:  newTotalNum,
      };
      setTimeout(() => {
        printCorreccionThermal("TIQUE", printData).catch(() => printCorreccion(printData));
      }, 120);
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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[#C59B6D]/50 bg-[#FDFCF9]">
      <div className="shrink-0 flex h-[42px] items-center gap-2 px-4 border-b bg-[#FFF5E6] border-[#C59B6D]/15">
        <ShieldCheck size={13} strokeWidth={2} className="shrink-0 text-[#2154d8]" />
        <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">
          {AUTH_CARD_TITLES[activeAuth.type]}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto flex flex-col gap-3 px-4 pt-3 pb-3">

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
            <input
              type="text"
              value={execMotivo}
              onChange={e => setExecMotivo(e.target.value)}
              placeholder={MOTIVO_EJEMPLOS_CORRECCION}
              className="w-full rounded-xl border border-[#e4e9f0] bg-white px-3 py-2 text-[12px] text-[#374151] outline-none placeholder:text-[#c0cad4] focus:border-[#45b356] focus:ring-2 focus:ring-[#45b356]/10"
            />
          </div>
        </div>
      )}

      {/* Formulario de ejecución — cierre extemporáneo */}
      {activeAuth.type === "cierre_extemporaneo" && !execDone && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">
              Fecha/hora real del cierre <span className="text-amber-500">*</span>
            </span>
            <input type="datetime-local" value={execFecha} onChange={e => setExecFecha(e.target.value)}
              max={new Date().toISOString().slice(0, 16)}
              className="w-full rounded-xl border border-amber-300 bg-white px-3 py-2 text-[12px] text-[#374151] outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-400/15" />
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">
              ¿El arqueo cuadró?
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
            <input
              type="text"
              value={execMotivo}
              onChange={e => setExecMotivo(e.target.value)}
              placeholder={MOTIVO_EJEMPLOS_EXTMP}
              className="w-full rounded-xl border border-[#e4e9f0] bg-white px-3 py-2 text-[12px] text-[#374151] outline-none placeholder:text-[#c0cad4] focus:border-[#45b356] focus:ring-2 focus:ring-[#45b356]/10"
            />
          </div>
        </div>
      )}

      {/* Formulario de ejecución — corrección de cierre: tabla ORIGINAL/CORREGIDO */}
      {activeAuth.type === "correccion_cierre" && !execDone && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-1 rounded-xl border border-[#e4e9f0] bg-white overflow-hidden">
            <div className="grid grid-cols-[1fr_72px_72px] gap-x-2 px-3 py-1.5 border-b border-[#f0f4f8] bg-[#f8fafd]">
              <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">Modalidad</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#9ca3af] text-right">Original</span>
              <span className="text-[9px] font-bold uppercase tracking-[0.12em] text-[#2154d8] text-right">Corregido</span>
            </div>
            {([
              { label: "Efectivo", prev: prevEfeNum,  value: newEfe,  set: setNewEfe  },
              { label: "Yape",     prev: prevYapeNum, value: newYape, set: setNewYape },
              { label: "Tarjetas", prev: prevTarNum,  value: newTar,  set: setNewTar  },
            ] as const).map(({ label, prev, value, set }) => (
              <div key={label} className="grid grid-cols-[1fr_72px_72px] items-center gap-x-2 px-3 py-1.5 border-b border-[#f0f4f8] last:border-0">
                <span className="text-[10.5px] font-semibold text-[#374151]">{label}</span>
                <span className="text-[10.5px] tabular-nums text-[#9ca3af] text-right">{prev.toFixed(2)}</span>
                <input
                  type="number" min="0" step="0.01"
                  value={value}
                  onChange={e => set(e.target.value)}
                  className="w-full rounded-lg border border-[#2154d8]/30 bg-white px-1.5 py-1 text-right text-[11px] font-bold tabular-nums text-[#374151] outline-none focus:border-[#2154d8] focus:ring-1 focus:ring-[#2154d8]/10"
                />
              </div>
            ))}
            <div className="grid grid-cols-[1fr_72px_72px] items-center gap-x-2 px-3 py-2 bg-[#f8fafd]">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#374151]">Total</span>
              <span className="text-[11px] font-bold tabular-nums text-[#9ca3af] text-right">{prevTotalNum.toFixed(2)}</span>
              <span className="text-[11px] font-bold tabular-nums text-[#2154d8] text-right">{newTotalNum.toFixed(2)}</span>
            </div>
          </div>

          <div className={`flex items-center justify-between rounded-xl border px-3 py-2 ${
            newDiferenciaCalc === 0 ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"
          }`}>
            <span className={`text-[10px] font-bold uppercase tracking-[0.1em] ${
              newDiferenciaCalc === 0 ? "text-emerald-700" : "text-amber-700"
            }`}>
              {newDiferenciaCalc === 0 ? "✓ Cuadrado" : "⚠ Con diferencia"}
            </span>
            {newDiferenciaCalc !== 0 && (
              <span className="text-[12px] font-bold tabular-nums text-amber-700">
                {newDiferenciaCalc > 0 ? "+" : "−"}S/ {Math.abs(newDiferenciaCalc).toFixed(2)}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#9ca3af]">
              Motivo de la corrección <span className="text-amber-500">*</span>
            </span>
            <input
              type="text"
              value={execMotivo}
              onChange={e => setExecMotivo(e.target.value)}
              placeholder={MOTIVO_EJEMPLOS_CORRECCION}
              className="w-full rounded-xl border border-[#e4e9f0] bg-white px-3 py-2 text-[12px] text-[#374151] outline-none placeholder:text-[#c0cad4] focus:border-[#45b356] focus:ring-2 focus:ring-[#45b356]/10"
            />
          </div>
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

      {!execDone && activeAuth.type !== "cierre_activo" && (
        <div className="shrink-0 flex flex-col gap-2 px-4 pb-4">
          {!showPostpone && (
            <button onClick={handleExec} disabled={!canExec}
              className={`flex h-10 w-full items-center justify-center gap-1.5 rounded-2xl px-4 text-[13px] font-semibold uppercase tracking-wider transition ${
                canExec
                  ? "bg-[#45b356] text-white hover:bg-[#35994a] active:scale-[0.98]"
                  : "cursor-not-allowed bg-[#45b356]/[0.15] text-[#45b356]/50"
              }`}>
              {activeAuth.type === "correccion_apertura" ? "Registrar Corrección de Apertura" : "Ejecutar Corrección"}
            </button>
          )}

          {showPostpone ? (
            <div className="flex flex-col gap-2 rounded-xl border border-amber-200 bg-amber-50/50 px-3.5 py-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-amber-700">
                Motivo de la postergación <span className="text-amber-500">*</span>
              </span>
              <textarea
                value={postponeMotivo}
                onChange={e => setPostponeMotivo(e.target.value)}
                placeholder="Explica por qué no puedes regularizar ahora..."
                rows={2}
                className="w-full resize-none rounded-xl border border-amber-200 bg-white px-3 py-2 text-[11.5px] text-[#374151] outline-none placeholder:text-[#c8d4e0] focus:border-amber-400 focus:ring-2 focus:ring-amber-200/40"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { setShowPostpone(false); setPostponeMotivo(""); }}
                  className="flex-1 rounded-xl border border-[#e4e9f0] bg-white py-2 text-[10.5px] font-semibold uppercase tracking-wide text-[#6b7280] hover:bg-[#f8fafd] transition"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePostpone}
                  disabled={postponeMotivo.trim().length < MIN_MOTIVO_LEN}
                  className={`flex-1 rounded-xl py-2 text-[10.5px] font-bold uppercase tracking-wide transition ${
                    postponeMotivo.trim().length >= MIN_MOTIVO_LEN
                      ? "bg-amber-500 text-white hover:bg-amber-600 active:scale-[0.98]"
                      : "cursor-not-allowed bg-amber-500/15 text-amber-500/50"
                  }`}
                >
                  Confirmar postergación
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowPostpone(true)}
              className="self-start text-[10.5px] font-semibold text-amber-600 underline-offset-2 hover:underline"
            >
              No puedo regularizar ahora
            </button>
          )}
        </div>
      )}
    </div>
  );
}
