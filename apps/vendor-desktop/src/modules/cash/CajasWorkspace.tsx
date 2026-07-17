import { useEffect, useMemo, useState } from "react";
import {
  Ban,
  ChevronRight,
  CheckCircle,
  CircleCheck,
  Layers,
  LayoutGrid,
  Monitor,
  Pencil,
  Plus,
  ShieldAlert,
  ShieldCheck,
  ToggleRight,
  User,
} from "lucide-react";
import { usePOS, type CashSession } from "../../context/POSContext";
import { definirCajasDeBloque, type BloqueOperacional, type TipoCaja } from "../../domains/operator/blocks.store";
import { loadTurnEvents } from "../../domains/cash/turn-events.store";
import useBloques, { type DefinicionSlot } from "./hooks/useBloques";
import {
  loadSessionHistory,
  recordSessionCorrection,
  recordAperturaCorrection,
  type SessionEntry,
  type CorrectionRecord,
} from "./services/session-history.service";
import {
  loadAuthorizations,
  markAuthorizationExecuted,
  type CajaAuthorization,
} from "./services/supervision-authorization.service";

interface POSRef {
  operators: ReturnType<typeof usePOS>["operators"];
  isOpen: boolean;
  cashBox: CashSession["cashBox"];
}

type BlockStatus = "DISPONIBLE" | "ASIGNADO" | "EN_USO" | "INACTIVO";
type LastActivity = { at: string; operator: string };
type PanelMode = "view" | "create" | "edit";
type ThirdAction = "deactivate" | "activate" | null;

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
  cierre_activo: "Cierre de sesión activa",
  cierre_extemporaneo: "Cierre extemporáneo",
  correccion_cierre: "Corrección de cierre",
  correccion_apertura: "Corrección de apertura",
};

function formatCreatedAt(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()} · ${hh}:${min}`;
}

function fmtDt(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function slotLabel(tipoCaja: TipoCaja): string {
  if (tipoCaja === "PRINCIPAL") return "PRINCIPAL";
  if (tipoCaja === "AUXILIAR") return "AUXILIAR";
  return "EXCEPCIONAL";
}

function slotObservacion(slot: DefinicionSlot, base: number): string {
  if (slot.tipoCaja === "PRINCIPAL") return "Sin restricciones — flujo principal de ventas";
  if (slot.tipoCaja === "AUXILIAR") return `Requiere caja ${Number(slot.codigo) - 1} cerrada · motivo obligatorio`;
  return `Requiere caja ${String(base)} sin apertura · PIN + motivo obligatorio`;
}

function slotSummary(slots: DefinicionSlot[]): string {
  return slots.map(slot => {
    if (slot.tipoCaja === "PRINCIPAL") return "P";
    if (slot.tipoCaja === "AUXILIAR") return "A";
    return "CTG";
  }).join(" · ");
}

function getBlockOperator(operators: POSRef["operators"], blockBase: number) {
  return operators.find(o => o.baseBloque === blockBase && o.estado !== "INACTIVO");
}

function getBlockStatus(pos: POSRef, bloque: BloqueOperacional): BlockStatus {
  if (!bloque.activo) return "INACTIVO";
  const inUso = pos.isOpen && pos.cashBox !== null && pos.cashBox.code[0] === String(bloque.base)[0];
  if (inUso) return "EN_USO";
  return getBlockOperator(pos.operators, bloque.base) ? "ASIGNADO" : "DISPONIBLE";
}

function nextBase(bloques: BloqueOperacional[]): number {
  const existing = new Set(bloques.map(bloque => bloque.base));
  let n = 100;
  while (existing.has(n)) n += 100;
  return n;
}

function codigosConHistorial(sessionHistory: SessionEntry[]): Set<string> {
  return new Set(sessionHistory.map(entry => entry.boxCode));
}

function previewSlots(base: number, auxiliares: number, codigos: Set<string>): DefinicionSlot[] {
  let auxiliaresIncluidos = 0;
  return definirCajasDeBloque([base])
    .filter(slot => {
      if (slot.tipoCaja !== "AUXILIAR") return true;
      auxiliaresIncluidos += 1;
      return auxiliaresIncluidos <= auxiliares;
    })
    .map(slot => ({
      codigo: slot.codigo,
      tipoCaja: slot.tipoCaja,
      hasHistorial: codigos.has(slot.codigo),
    }));
}

interface PanelCajasProps {
  bloques: BloqueOperacional[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  pos: POSRef;
  lastActivity: Map<string, LastActivity>;
  authBlockPrefixes: Set<string>;
  codigosConHistorial: Set<string>;
  derivarSlots: (bloque: BloqueOperacional, codigosConHistorial: Set<string>) => DefinicionSlot[];
}

function PanelCajas({
  bloques,
  selectedId,
  onSelect,
  pos,
  lastActivity,
  authBlockPrefixes,
  codigosConHistorial: codigos,
  derivarSlots,
}: PanelCajasProps) {
  const activeCount = bloques.filter(bloque => bloque.activo).length;
  const inactiveCount = bloques.filter(bloque => !bloque.activo).length;

  const statusColor: Record<BlockStatus, string> = {
    DISPONIBLE: "text-[#4A5265]",
    ASIGNADO: "text-[#2154d8]/80",
    EN_USO: "text-emerald-600",
    INACTIVO: "text-[#dc2626]/70",
  };

  return (
    <div className="flex w-[35%] shrink-0 flex-col overflow-hidden rounded-[28px] border border-[#4A5265]/40 bg-[#FDFCF9]">
      <div className="shrink-0 flex h-[42px] items-center gap-2 border-b border-[#4A5265]/15 bg-[#F2F7FA] px-4">
        <Layers size={13} strokeWidth={2} className="shrink-0 text-[#4A5265]" />
        <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">ESTADO CAJAS</span>
        <div className="ml-auto flex items-center gap-1">
          {activeCount > 0 && (
            <span className="rounded bg-[#EBF4FA] px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-[#4A5265]">{activeCount}</span>
          )}
          {inactiveCount > 0 && (
            <span className="rounded bg-[#FEF2F2] px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-[#dc2626]/70">{inactiveCount}</span>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {bloques.map(bloque => {
          const isSel = bloque.id === selectedId;
          const bStatus = getBlockStatus(pos, bloque);
          const blockOp = getBlockOperator(pos.operators, bloque.base);
          const prefix = String(bloque.base)[0];
          const lastAct = lastActivity.get(prefix);
          const hasAuth = authBlockPrefixes.has(prefix);
          const slots = derivarSlots(bloque, codigos);
          const lastAtFmt = lastAct ? (() => {
            const d = new Date(lastAct.at);
            const dd = String(d.getDate()).padStart(2, "0");
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const hh = String(d.getHours()).padStart(2, "0");
            const mn = String(d.getMinutes()).padStart(2, "0");
            return `${dd}/${mm}/${d.getFullYear()} ${hh}:${mn}`;
          })() : null;

          return (
            <div
              key={bloque.id}
              onClick={() => onSelect(bloque.id)}
              className={`flex cursor-pointer items-start gap-3 border-l-2 px-4 py-3 transition ${
                isSel ? "border-[#4A5265] bg-[#EBF4FA]" : "border-transparent hover:bg-[#F2F7FA]"
              }`}>
              <span className={`mt-px shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                isSel ? "bg-[#4A5265] text-white" : "bg-[#EBF4FA] text-[#4A5265]"
              }`}>
                {bloque.base}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className={`text-[12px] font-semibold ${isSel ? "text-[#2d6640]" : blockOp ? "text-[#2F3E46]" : "text-[#b0bac8]"}`}>
                    {blockOp ? blockOp.alias : "Sin operador"}
                  </p>
                  {hasAuth && (
                    <span className="rounded-full bg-[#EEF3FD] px-1.5 py-0.5 text-[8px] font-bold text-[#2154d8]">
                      AUTORIZACIÓN
                    </span>
                  )}
                </div>
                <p className={`mt-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusColor[bStatus]}`}>
                  {bStatus.replace("_", " ")}&ensp;·&ensp;
                  <span className="normal-case tracking-normal text-[#9ca3af]">{slotSummary(slots)}</span>
                </p>
                {lastAtFmt && (
                  <p className="mt-1 text-[9px] tabular-nums text-[#b0bac8] leading-none">
                    {lastAtFmt}&ensp;·&ensp;<span className="font-semibold">{lastAct!.operator}</span>
                  </p>
                )}
              </div>
              <ChevronRight size={12} className={`mt-1 shrink-0 ${isSel ? "text-[#4A5265]" : "text-[#d1d9e1]"}`} />
            </div>
          );
        })}
        {bloques.length === 0 && (
          <div className="flex items-center justify-center py-10">
            <p className="text-[12px] font-semibold text-[#c0cad4]">Sin cajas creadas</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface PanelGestionCajasProps {
  bloques: BloqueOperacional[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  pos: POSRef;
  authorizations: CajaAuthorization[];
  onAuthExecuted: () => void;
  operatorName: string;
  sessionHistory: SessionEntry[];
  codigosConHistorial: Set<string>;
  derivarSlots: (bloque: BloqueOperacional, codigosConHistorial: Set<string>) => DefinicionSlot[];
  crearBloque: (base: number, auxiliares: number, creadoPor: string) => Promise<string>;
  editarAuxiliares: (id: string, auxiliares: number) => Promise<void>;
  activarBloque: (id: string) => Promise<void>;
  desactivarBloque: (id: string) => Promise<void>;
}

function PanelGestionCajas({
  bloques,
  selectedId,
  onSelect,
  pos,
  authorizations,
  onAuthExecuted,
  operatorName,
  sessionHistory,
  codigosConHistorial: codigos,
  derivarSlots,
  crearBloque,
  editarAuxiliares,
  activarBloque,
  desactivarBloque,
}: PanelGestionCajasProps) {
  const [mode, setMode] = useState<PanelMode>("view");
  const [editAuxiliares, setEditAuxiliares] = useState(2);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [execFecha, setExecFecha] = useState("");
  const [execSignal, setExecSignal] = useState<"ok" | "warn">("ok");
  const [execMotivoPreset, setExecMotivoPreset] = useState("");
  const [execMotivoLibre, setExecMotivoLibre] = useState("");
  const [execNewApertura, setExecNewApertura] = useState("");
  const [execDone, setExecDone] = useState(false);

  const selected = bloques.find(bloque => bloque.id === selectedId) ?? null;
  const selectedSlots = selected ? derivarSlots(selected, codigos) : [];
  const canActOnSel = selected !== null;
  const canDelete = selected !== null && !selectedSlots.some(slot => slot.hasHistorial);

  useEffect(() => {
    setMode(prev => prev === "create" ? prev : "view");
    setConfirmDelete(false);
    setExecFecha("");
    setExecSignal("ok");
    setExecMotivoPreset("");
    setExecMotivoLibre("");
    setExecNewApertura("");
    setExecDone(false);
  }, [selectedId]);

  const blockAuths = selected
    ? authorizations
        .filter(authorization => selectedSlots.some(slot => slot.codigo === authorization.cajaCode) && authorization.status === "emitida")
        .sort((a, b) => a.authorizedAt.localeCompare(b.authorizedAt))
    : [];
  const activeAuth = blockAuths[0] ?? null;

  const targetSession: SessionEntry | null = activeAuth
    ? (sessionHistory.find(entry => entry.id === activeAuth.sessionId) ?? null)
    : null;

  const execMotivoCombined = (execMotivoPreset === "Otro" || execMotivoPreset === "")
    ? execMotivoLibre.trim()
    : execMotivoPreset;

  const newAperturaNum = parseFloat(execNewApertura.replace(",", "."));
  const canExec = execMotivoCombined.length >= 3 &&
    (activeAuth?.type !== "cierre_extemporaneo" || execFecha.length > 0) &&
    (activeAuth?.type !== "correccion_apertura" || (execNewApertura.length > 0 && newAperturaNum >= 0)) &&
    !execDone;

  function handleExec() {
    if (!activeAuth || !canExec) return;
    if (activeAuth.type === "cierre_extemporaneo" || activeAuth.type === "correccion_cierre") {
      const correction: CorrectionRecord = {
        correctedBy: operatorName,
        correctedAt: new Date().toISOString(),
        motivo: execMotivoCombined,
        accion: activeAuth.type === "cierre_extemporaneo" ? "cierre_extemporaneo" : "documentar_diferencia",
        prevSignal: activeAuth.type === "cierre_extemporaneo" ? null : "warn",
        newSignal: execSignal,
        ...(activeAuth.type === "cierre_extemporaneo" && execFecha
          ? { fechaOperacional: new Date(execFecha).toISOString() } : {}),
      };
      void recordSessionCorrection(activeAuth.sessionId, correction, execSignal);
    } else if (activeAuth.type === "correccion_apertura") {
      const correction: CorrectionRecord = {
        correctedBy: operatorName,
        correctedAt: new Date().toISOString(),
        motivo: execMotivoCombined,
        accion: "correccion_apertura",
        prevSignal: targetSession?.closeSignal ?? "ok",
        newSignal: targetSession?.closeSignal ?? "ok",
        prevApertura: targetSession?.apertura,
        newApertura: newAperturaNum,
      };
      void recordAperturaCorrection(activeAuth.sessionId, correction);
    }
    markAuthorizationExecuted(activeAuth.id, operatorName);
    onAuthExecuted();
    setExecDone(true);
  }

  const thirdAction: ThirdAction =
    !canActOnSel ? null
    : !selected!.activo ? "activate"
    : "deactivate";

  function handleStartEdit() {
    if (!selected) return;
    setConfirmDelete(false);
    setEditAuxiliares(selected.auxiliares);
    setMode("edit");
  }

  async function handleSave(): Promise<void> {
    if (mode === "create") {
      const idCreado = await crearBloque(nextBase(bloques), editAuxiliares, operatorName);
      onSelect(idCreado);
    } else if (mode === "edit" && selected) {
      await editarAuxiliares(selected.id, editAuxiliares);
    }
    setMode("view");
  }

  async function handleDeactivate(): Promise<void> {
    if (!selected || !selected.activo) return;
    await desactivarBloque(selected.id);
    setMode("view");
  }

  async function handleActivate(): Promise<void> {
    if (!selected || selected.activo) return;
    await activarBloque(selected.id);
  }

  async function handleDelete(): Promise<void> {
    if (!selected || !canDelete) return;
    await desactivarBloque(selected.id);
    onSelect(null);
    setConfirmDelete(false);
    setMode("view");
  }

  const showView = mode === "view" && selected !== null;
  const showForm = mode === "create" || mode === "edit";
  const formBase = mode === "create" ? nextBase(bloques) : (selected?.base ?? 100);
  const formSlots = showForm ? previewSlots(formBase, editAuxiliares, codigos) : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[#4A5265]/40 bg-[#FDFCF9]">
      <div className="shrink-0 flex h-[42px] items-center gap-2 border-b border-[#4A5265]/15 bg-[#F2F7FA] px-4">
        <LayoutGrid size={13} strokeWidth={2} className="shrink-0 text-[#4A5265]" />
        <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">CONFIGURACIÓN DE CAJAS</span>
      </div>

      <div className="shrink-0 flex items-center gap-1.5 border-b border-[#4A5265]/10 px-4 py-2">
        <button
          onClick={() => { onSelect(null); setEditAuxiliares(2); setMode("create"); }}
          className="flex items-center gap-1.5 rounded-lg bg-[#45b356] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-[#35994a] active:scale-[0.97]">
          <Plus size={10} strokeWidth={2.5} />CREAR BLOQUE
        </button>
        <button
          onClick={handleStartEdit}
          disabled={!canActOnSel}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
            canActOnSel
              ? "bg-[var(--dv-color-edit)] text-white hover:bg-[#0049c4] active:scale-[0.97]"
              : "cursor-not-allowed bg-[var(--dv-color-edit)]/[0.15] text-[var(--dv-color-edit)]/50"
          }`}>
          <Pencil size={10} strokeWidth={2.5} />EDITAR BLOQUE
        </button>
        {thirdAction === null && (
          <button disabled
            className="flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-[#dc2626]/[0.15] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#dc2626]/50">
            <Ban size={10} strokeWidth={2.5} />DESACTIVAR
          </button>
        )}
        {thirdAction === "deactivate" && (
          <button onClick={() => void handleDeactivate()}
            className="flex items-center gap-1.5 rounded-lg bg-[#dc2626] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-[#b91c1c] active:scale-[0.97]">
            <Ban size={10} strokeWidth={2.5} />DESACTIVAR
          </button>
        )}
        {thirdAction === "activate" && (
          <button onClick={() => void handleActivate()}
            className="flex items-center gap-1.5 rounded-lg bg-[#45b356] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-[#35994a] active:scale-[0.97]">
            <ToggleRight size={10} strokeWidth={2.5} />ACTIVAR
          </button>
        )}
        <button
          onClick={() => { if (canDelete) setConfirmDelete(true); }}
          disabled={!canDelete}
          className={`ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
            canDelete
              ? "bg-[#dc2626]/10 text-[#dc2626] hover:bg-[#dc2626]/20 active:scale-[0.97]"
              : "cursor-not-allowed text-[#d1d9e1]"
          }`}>
          <Ban size={10} strokeWidth={2.5} />ELIMINAR
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-3">
        {showView && selected && (
          <div className="flex flex-col gap-4">
            {(() => {
              const bStatus = getBlockStatus(pos, selected);
              const blockOp = getBlockOperator(pos.operators, selected.base);
              const statusCls: Record<BlockStatus, string> = {
                DISPONIBLE: "bg-[#EBF4FA] text-[#4A5265]",
                ASIGNADO: "bg-[#dbeafe] text-[#2154d8]",
                EN_USO: "bg-emerald-100 text-emerald-700",
                INACTIVO: "bg-[#FEF2F2] text-[#dc2626]",
              };
              return (
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="rounded-md bg-[#4A5265] px-2.5 py-1 text-[13px] font-bold tabular-nums text-white">
                    {selected.base}
                  </span>
                  <span className={`rounded-md px-2 py-0.5 text-[9px] font-bold uppercase ${statusCls[bStatus]}`}>
                    {bStatus.replace("_", " ")}
                  </span>
                  {blockOp ? (
                    <div className="flex items-center gap-1.5 rounded-lg border border-[#e4e9f0] bg-[#fafbfc] px-2.5 py-1">
                      <User size={10} strokeWidth={2} className="shrink-0 text-[#4A5265]" />
                      <span className="text-[11px] font-semibold text-[#374151]">{blockOp.alias}</span>
                      <span className="text-[10px] text-[#9ca3af]">· {blockOp.codigoOperador}</span>
                    </div>
                  ) : selected.activo && (
                    <span className="text-[11px] font-semibold text-[#b0bac8]">Sin operador asignado</span>
                  )}
                </div>
              );
            })()}

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">Composición del bloque</span>
              {selectedSlots.map(slot => {
                const isContg = slot.tipoCaja === "EXCEPCIONAL";
                const isAux = slot.tipoCaja === "AUXILIAR";
                const slotAuth = activeAuth?.cajaCode === slot.codigo ? activeAuth : null;
                return (
                  <div key={slot.codigo}
                    className={`flex flex-col gap-1 rounded-xl border px-3 py-2.5 ${
                      slotAuth ? "border-[#2154d8]/30 bg-[#EEF3FD]/50" :
                      isContg ? "border-amber-100 bg-amber-50/30" :
                      isAux ? "border-[#dbeafe] bg-[#f0f6ff]" :
                      "border-[#e4e9f0] bg-[#f8fafc]"
                    }`}>
                    <div className="flex items-center gap-2">
                      {isContg ? <ShieldAlert size={11} strokeWidth={2} className="shrink-0 text-amber-500" /> :
                       isAux ? <Monitor size={11} strokeWidth={2} className="shrink-0 text-[#2154d8]/60" /> :
                       <CircleCheck size={11} strokeWidth={2} className="shrink-0 text-emerald-500" />}
                      <span className="text-[12px] font-bold tabular-nums text-[#374151]">{slot.codigo}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        isContg ? "text-amber-600" : isAux ? "text-[#2154d8]/70" : "text-[#4A5265]"
                      }`}>
                        {slotLabel(slot.tipoCaja)}
                      </span>
                      {slot.hasHistorial && !slotAuth && (
                        <span className="ml-auto rounded bg-[#EBF4FA] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#4A5265]">
                          CON USO
                        </span>
                      )}
                      {slotAuth && (
                        <span className="ml-auto rounded bg-[#EEF3FD] px-1.5 py-0.5 text-[9px] font-bold text-[#2154d8]">
                          AUTORIZACIÓN
                        </span>
                      )}
                    </div>
                    <p className={`pl-4 text-[10px] ${isContg ? "text-amber-500/80" : "text-[#b0bac8]"}`}>
                      {slotObservacion(slot, selected.base)}
                    </p>
                  </div>
                );
              })}
            </div>

            {activeAuth && (
              <div className="flex flex-col gap-3 rounded-xl border border-[#2154d8]/30 bg-[#f4f7fe] px-4 py-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={12} strokeWidth={2} className="text-[#2154d8] shrink-0" />
                  <p className="text-[9.5px] font-bold uppercase tracking-wider text-[#2154d8]">
                    Autorización supervisora activa
                  </p>
                  {blockAuths.length > 1 && (
                    <span className="ml-auto text-[9px] font-bold text-[#2154d8]/60">
                      1 de {blockAuths.length}
                    </span>
                  )}
                </div>

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

                {activeAuth.type === "cierre_activo" && (
                  <p className="text-[10px] text-[#6b7280] leading-snug">
                    El cierre se ejecuta desde la pantalla de Gestión Turno.
                  </p>
                )}

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
                        type="number"
                        min="0"
                        step="0.01"
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
            )}

            <div className="mt-auto border-t border-[#f1f5f9] pt-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#c8d4e0]">Creado</span>
                  <span className="text-[11px] font-semibold tabular-nums text-[#a8b4c4]">{formatCreatedAt(new Date(selected.creadoEn))}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#c8d4e0]">Por</span>
                  <span className="text-[11px] font-semibold tracking-wider text-[#a8b4c4]">{selected.creadoPor}</span>
                </div>
              </div>
            </div>

            {confirmDelete && (
              <div className="flex flex-col gap-2 rounded-xl border border-[#dc2626]/30 bg-[#fef2f2] px-3.5 py-2.5">
                <p className="text-[10px] font-semibold text-[#dc2626]">
                  ¿Desactivar bloque {selected.base}? El bloque quedará inactivo y no podrá usarse para nuevas sesiones.
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmDelete(false)}
                    className="flex-1 rounded-lg border border-[#e4e9f0] bg-white py-1.5 text-[10px] font-bold uppercase text-[#6b7280] hover:border-[#b0bac8] transition">
                    Cancelar
                  </button>
                  <button onClick={() => void handleDelete()}
                    className="flex-1 rounded-lg bg-[#dc2626] py-1.5 text-[10px] font-bold uppercase text-white hover:bg-[#b91c1c] transition">
                    Confirmar desactivación
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {showForm && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5 rounded-xl border border-[#e4e9f0] bg-[#fafbfc] px-3 py-2">
              <span className="rounded-md bg-[#4A5265] px-2 py-0.5 text-[11px] font-bold tabular-nums text-white">
                {formBase}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#9ca3af]">
                {mode === "create" ? "NUEVO BLOQUE OPERACIONAL" : "EDITAR BLOQUE"}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">CAJAS AUXILIARES</span>
              <div className="flex gap-1.5">
                {[0, 1, 2, 3, 4].map(n => (
                  <button
                    key={n}
                    onClick={() => setEditAuxiliares(n)}
                    className={`flex-1 rounded-xl border py-2 text-[11px] font-bold transition active:scale-[0.97] ${
                      editAuxiliares === n
                        ? "border-[#2154d8] bg-[#eff6ff] text-[#2154d8]"
                        : "border-[#e4e9f0] bg-white text-[#6b7280] hover:border-[#c0cad4]"
                    }`}>
                    {n}
                  </button>
                ))}
              </div>
              <p className="text-[9px] text-[#9ca3af]">
                {editAuxiliares === 0 ? "Sin cajas auxiliares" : `${editAuxiliares} caja${editAuxiliares > 1 ? "s" : ""} auxiliar${editAuxiliares > 1 ? "es" : ""} · máx. 4`}
              </p>
            </div>

            {mode === "create" && (
              <div className="rounded-xl border border-[#dbeafe] bg-[#f0f6ff] px-3 py-2.5">
                <p className="text-[11px] font-semibold text-[#2154d8]/80">
                  Se crearán {editAuxiliares + 2} cajas: 1 principal, {editAuxiliares} auxiliar{editAuxiliares === 1 ? "" : "es"} y 1 excepcional.
                </p>
                <p className="mt-1 text-[10px] text-[#9ca3af]">
                  La asignación de operador se realiza en la sección OPERADORES.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">
                {mode === "create" ? "Composición" : "Composición resultante"}
              </span>
              {formSlots.map(slot => {
                const isContg = slot.tipoCaja === "EXCEPCIONAL";
                const isAux = slot.tipoCaja === "AUXILIAR";
                return (
                  <div key={slot.codigo}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
                      isContg ? "border-amber-100 bg-amber-50/30" :
                      isAux ? "border-[#dbeafe] bg-[#f0f6ff]" :
                      "border-[#e4e9f0] bg-[#f8fafc]"
                    }`}>
                    {isContg ? <ShieldAlert size={10} strokeWidth={2} className="shrink-0 text-amber-500" /> :
                     isAux ? <Monitor size={10} strokeWidth={2} className="shrink-0 text-[#2154d8]/60" /> :
                     <CircleCheck size={10} strokeWidth={2} className="shrink-0 text-emerald-500" />}
                    <span className="text-[11px] font-bold tabular-nums text-[#374151]">{slot.codigo}</span>
                    <span className={`text-[10px] font-semibold uppercase tracking-wide ${
                      isContg ? "text-amber-600" : isAux ? "text-[#2154d8]/70" : "text-[#4A5265]"
                    }`}>
                      {slotLabel(slot.tipoCaja)}
                    </span>
                    {slot.hasHistorial && (
                      <span className="ml-auto text-[9px] font-bold text-[#9ca3af]">con uso</span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => setMode("view")}
                className="flex h-10 flex-1 items-center justify-center rounded-md border border-[#e4e9f0] bg-white text-[13px] font-semibold uppercase tracking-wider text-[#6b7280] transition hover:border-[#b0bac8]">
                Cancelar
              </button>
              <button onClick={() => void handleSave()}
                className="flex h-10 flex-1 items-center justify-center rounded-md bg-[#45b356] text-[13px] font-semibold uppercase tracking-wider text-white transition hover:bg-[#35994a] active:scale-[0.98]">
                {mode === "create" ? "Crear bloque" : "Guardar cambios"}
              </button>
            </div>
          </div>
        )}

        {!showView && !showForm && (
          <div className="flex flex-col items-center justify-center gap-1.5 py-12 text-center">
            <Layers size={24} strokeWidth={1.5} className="text-[#d1d9e1]" />
            <p className="text-[12px] font-semibold text-[#c0cad4]">Seleccione un bloque</p>
            <p className="text-[11px] font-semibold text-[#d1d9e1]">o cree uno nuevo</p>
          </div>
        )}
      </div>
    </div>
  );
}

export function CajasWorkspace() {
  const { bloques, cargando, errorCarga, crearBloque, editarAuxiliares, activarBloque, desactivarBloque, derivarSlots } = useBloques();
  const { operators, cashSession, activeOperator } = usePOS();
  const pos: POSRef = { operators, isOpen: cashSession.isOpen, cashBox: cashSession.cashBox };
  const operatorName = activeOperator?.nombreCompleto ?? "Operador";
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [authorizations, setAuthorizations] = useState<CajaAuthorization[]>(() => loadAuthorizations());
  const [sessionHistory, setSessionHistory] = useState<SessionEntry[]>([]);

  useEffect(() => {
    loadSessionHistory().then(setSessionHistory);
  }, []);

  useEffect(() => {
    if (!cargando && selectedId === null && bloques.length > 0) {
      setSelectedId(bloques[0].id);
    }
  }, [bloques, cargando, selectedId]);

  const lastActivity = useMemo(() => {
    const map = new Map<string, LastActivity>();
    const turnEvs = loadTurnEvents();
    const opByKey = new Map(sessionHistory.map(entry => [`${entry.boxCode}-${entry.openedAt}`, entry.operator]));

    for (const entry of sessionHistory) {
      const prefix = entry.boxCode[0];
      const at = entry.closedAt ?? entry.openedAt;
      const cur = map.get(prefix);
      if (!cur || at > cur.at) map.set(prefix, { at, operator: entry.operator });
    }
    for (const event of turnEvs) {
      const boxCode = event.sessionKey.split("-")[0];
      if (!boxCode) continue;
      const prefix = boxCode[0];
      const cur = map.get(prefix);
      if (!cur || event.ts > cur.at) {
        map.set(prefix, { at: event.ts, operator: opByKey.get(event.sessionKey) ?? "" });
      }
    }
    return map;
  }, [sessionHistory]);

  const authBlockPrefixes = useMemo(() => new Set(
    authorizations
      .filter(authorization => authorization.status === "emitida")
      .map(authorization => authorization.cajaCode[0]),
  ), [authorizations]);

  const codigos = useMemo(() => codigosConHistorial(sessionHistory), [sessionHistory]);

  function handleAuthExecuted() {
    setAuthorizations(loadAuthorizations());
    loadSessionHistory().then(setSessionHistory);
  }

  if (errorCarga !== null) {
    return (
      <section className="flex min-h-0 flex-1 items-center justify-center">
        <p className="text-[13px] font-semibold text-[#dc2626]">{errorCarga}</p>
      </section>
    );
  }

  if (cargando) {
    return (
      <section className="flex min-h-0 flex-1 items-center justify-center">
        <p className="text-[13px] font-semibold text-[#9ca3af]">Cargando bloques...</p>
      </section>
    );
  }

  return (
    <section className="flex min-h-0 flex-1 gap-2">
      <PanelCajas
        bloques={bloques}
        selectedId={selectedId}
        onSelect={setSelectedId}
        pos={pos}
        lastActivity={lastActivity}
        authBlockPrefixes={authBlockPrefixes}
        codigosConHistorial={codigos}
        derivarSlots={derivarSlots}
      />
      <PanelGestionCajas
        bloques={bloques}
        selectedId={selectedId}
        onSelect={setSelectedId}
        pos={pos}
        authorizations={authorizations}
        onAuthExecuted={handleAuthExecuted}
        operatorName={operatorName}
        sessionHistory={sessionHistory}
        codigosConHistorial={codigos}
        derivarSlots={derivarSlots}
        crearBloque={crearBloque}
        editarAuxiliares={editarAuxiliares}
        activarBloque={activarBloque}
        desactivarBloque={desactivarBloque}
      />
    </section>
  );
}
