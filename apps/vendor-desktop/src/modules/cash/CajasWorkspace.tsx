import { useState, useEffect } from "react";
import { Plus, Pencil, Ban, ToggleRight, Layers, LayoutGrid, ChevronRight, CircleCheck, Monitor, ShieldAlert, User, ShieldCheck, CheckCircle } from "lucide-react";
import { usePOS, type CashSession } from "../../context/POSContext";
import {
  loadSessionHistory, recordSessionCorrection, recordAperturaCorrection,
  type SessionEntry, type CorrectionRecord,
} from "./services/session-history.service";
import { loadTurnEvents } from "../../domains/cash/turn-events.store";
import {
  loadAuthorizations, markAuthorizationExecuted,
  type CajaAuthorization,
} from "./services/supervision-authorization.service";

// ── tipos ─────────────────────────────────────────────────────────────────

type SlotType = "principal" | "secundaria-1" | "secundaria-2" | "secundaria-3" | "secundaria-4" | "contingencia";

type CajaSlot = {
  code: string;
  slotType: SlotType;
  hasHistory: boolean;
};

type OperationalBlock = {
  id: string;
  blockBase: number;
  active: boolean;
  slots: CajaSlot[];
  createdAt: Date;
  createdBy: string;
};

type PanelMode   = "view" | "create" | "edit";
type ThirdAction = "deactivate" | "activate" | null;

// ── mock data ─────────────────────────────────────────────────────────────

const MOCK_BLOCKS: OperationalBlock[] = [
  {
    id: "b100", blockBase: 100, active: true,
    createdAt: new Date("2024-01-10T08:00:00"), createdBy: "ADMIN",
    slots: [
      { code: "100", slotType: "principal",    hasHistory: true  },
      { code: "101", slotType: "secundaria-1", hasHistory: true  },
      { code: "102", slotType: "secundaria-2", hasHistory: false },
      { code: "150", slotType: "contingencia", hasHistory: false },
    ],
  },
];

// ── motivos ejecución operador ─────────────────────────────────────────────

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

// ── helpers ───────────────────────────────────────────────────────────────

function formatCreatedAt(d: Date): string {
  const dd  = String(d.getDate()).padStart(2, "0");
  const mm  = String(d.getMonth() + 1).padStart(2, "0");
  const hh  = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()} · ${hh}:${min}`;
}

function fmtDt(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")} ${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

function nextBlockBase(blocks: OperationalBlock[]): number {
  const existing = new Set(blocks.map(b => b.blockBase));
  let n = 100;
  while (existing.has(n)) n += 100;
  return n;
}

function slotSummary(slots: CajaSlot[]): string {
  const labels: Record<SlotType, string> = {
    "principal": "P", "secundaria-1": "S1", "secundaria-2": "S2",
    "secundaria-3": "S3", "secundaria-4": "S4", "contingencia": "CTG",
  };
  return slots.map(s => labels[s.slotType]).join(" · ");
}

function slotLabel(t: SlotType): string {
  if (t === "principal")    return "PRINCIPAL";
  if (t === "secundaria-1") return "SECUNDARIA 01";
  if (t === "secundaria-2") return "SECUNDARIA 02";
  if (t === "secundaria-3") return "SECUNDARIA 03";
  if (t === "secundaria-4") return "SECUNDARIA 04";
  return "CONTINGENCIA";
}

function slotObservacion(slot: CajaSlot, blockBase: number): string {
  if (slot.slotType === "principal")    return "Sin restricciones — flujo principal de ventas";
  if (slot.slotType === "secundaria-1") return `Requiere caja ${blockBase} cerrada · motivo obligatorio`;
  if (slot.slotType === "secundaria-2") return `Requiere caja ${blockBase + 1} cerrada · motivo obligatorio`;
  if (slot.slotType === "secundaria-3") return `Requiere caja ${blockBase + 2} cerrada · motivo obligatorio`;
  if (slot.slotType === "secundaria-4") return `Requiere caja ${blockBase + 3} cerrada · motivo obligatorio`;
  return `Requiere caja ${blockBase} sin apertura · PIN + motivo obligatorio`;
}

type SecCount = 0 | 1 | 2 | 3 | 4;

const SEC_SLOTS: [SlotType, number][] = [
  ["secundaria-1", 1], ["secundaria-2", 2], ["secundaria-3", 3], ["secundaria-4", 4],
];

function buildSlots(base: number, secCount: SecCount, prev?: CajaSlot[]): CajaSlot[] {
  const histOf = (st: SlotType) => prev?.find(s => s.slotType === st)?.hasHistory ?? false;
  const slots: CajaSlot[] = [
    { code: String(base), slotType: "principal", hasHistory: histOf("principal") },
  ];
  for (const [st, offset] of SEC_SLOTS) {
    if (secCount >= offset)
      slots.push({ code: String(base + offset), slotType: st, hasHistory: histOf(st) });
  }
  slots.push({ code: String(base + 50), slotType: "contingencia", hasHistory: histOf("contingencia") });
  return slots;
}

// ── interfaces ────────────────────────────────────────────────────────────

interface POSRef {
  operators: ReturnType<typeof usePOS>["operators"];
  isOpen: boolean;
  cashBox: CashSession["cashBox"];
}

type BlockStatus = "DISPONIBLE" | "ASIGNADO" | "EN_USO" | "INACTIVO";

function getBlockOperator(operators: POSRef["operators"], blockBase: number) {
  return operators.find(o => o.baseBloque === blockBase && o.estado !== "INACTIVO");
}

function getBlockStatus(pos: POSRef, block: OperationalBlock): BlockStatus {
  if (!block.active) return "INACTIVO";
  const inUso = pos.isOpen && pos.cashBox !== null && pos.cashBox.code[0] === String(block.blockBase)[0];
  if (inUso) return "EN_USO";
  return getBlockOperator(pos.operators, block.blockBase) ? "ASIGNADO" : "DISPONIBLE";
}

// ── PanelCajas — 35% ─────────────────────────────────────────────────────

type LastActivity = { at: string; operator: string };

interface PanelCajasProps {
  blocks: OperationalBlock[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  pos: POSRef;
  lastActivity: Map<string, LastActivity>;
  authBlockPrefixes: Set<string>;
}

function PanelCajas({ blocks, selectedId, onSelect, pos, lastActivity, authBlockPrefixes }: PanelCajasProps) {
  const activeCount   = blocks.filter(b => b.active).length;
  const inactiveCount = blocks.filter(b => !b.active).length;

  const statusColor: Record<BlockStatus, string> = {
    DISPONIBLE: "text-[#2A7CA8]",
    ASIGNADO:   "text-[#2154d8]/80",
    EN_USO:     "text-emerald-600",
    INACTIVO:   "text-[#dc2626]/70",
  };

  return (
    <div className="flex w-[35%] shrink-0 flex-col overflow-hidden rounded-[28px] border border-[#2A7CA8]/40 bg-[#FDFCF9]">

      <div className="shrink-0 flex h-[42px] items-center gap-2 border-b border-[#2A7CA8]/15 bg-[#F2F7FA] px-4">
        <Layers size={13} strokeWidth={2} className="shrink-0 text-[#1a5f7a]" />
        <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">ESTADO CAJAS</span>
        <div className="ml-auto flex items-center gap-1">
          {activeCount > 0 && (
            <span className="rounded bg-[#EBF4FA] px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-[#1a5f7a]">{activeCount}</span>
          )}
          {inactiveCount > 0 && (
            <span className="rounded bg-red-50 px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-[#dc2626]/70">{inactiveCount}</span>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {blocks.map(block => {
          const isSel    = block.id === selectedId;
          const bStatus  = getBlockStatus(pos, block);
          const blockOp  = getBlockOperator(pos.operators, block.blockBase);
          const prefix   = String(block.blockBase)[0];
          const lastAct  = lastActivity.get(prefix);
          const hasAuth  = authBlockPrefixes.has(prefix);
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
              key={block.id}
              onClick={() => onSelect(block.id)}
              className={`flex cursor-pointer items-start gap-3 border-l-2 px-4 py-3 transition ${
                isSel ? "border-[#2A7CA8] bg-[#EBF4FA]" : "border-transparent hover:bg-[#F2F7FA]"
              }`}>
              <span className={`mt-px shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                isSel ? "bg-[#2A7CA8] text-white" : "bg-[#EBF4FA] text-[#1a5f7a]"
              }`}>
                {block.blockBase}
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
                  <span className="normal-case tracking-normal text-[#9ca3af]">{slotSummary(block.slots)}</span>
                </p>
                {lastAtFmt && (
                  <p className="mt-1 text-[9px] tabular-nums text-[#b0bac8] leading-none">
                    {lastAtFmt}&ensp;·&ensp;<span className="font-semibold">{lastAct!.operator}</span>
                  </p>
                )}
              </div>
              <ChevronRight size={12} className={`mt-1 shrink-0 ${isSel ? "text-[#2A7CA8]" : "text-[#d1d9e1]"}`} />
            </div>
          );
        })}
        {blocks.length === 0 && (
          <div className="flex items-center justify-center py-10">
            <p className="text-[12px] font-semibold text-[#c0cad4]">Sin cajas creadas</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── PanelGestionCajas — flex-1 ────────────────────────────────────────────

interface PanelGestionCajasProps {
  blocks: OperationalBlock[];
  setBlocks: React.Dispatch<React.SetStateAction<OperationalBlock[]>>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  pos: POSRef;
  authorizations: CajaAuthorization[];
  onAuthExecuted: () => void;
  operatorName: string;
  sessionHistory: SessionEntry[];
}

function PanelGestionCajas({
  blocks, setBlocks, selectedId, onSelect, pos,
  authorizations, onAuthExecuted, operatorName, sessionHistory,
}: PanelGestionCajasProps) {
  const [mode,               setMode]               = useState<PanelMode>("view");
  const [editSecondaryCount, setEditSecondaryCount] = useState<SecCount>(2);
  const [confirmDelete,      setConfirmDelete]      = useState(false);

  // Estado ejecución de autorización
  const [execFecha,        setExecFecha]        = useState("");
  const [execSignal,       setExecSignal]       = useState<"ok" | "warn">("ok");
  const [execMotivoPreset, setExecMotivoPreset] = useState("");
  const [execMotivoLibre,  setExecMotivoLibre]  = useState("");
  const [execNewApertura,  setExecNewApertura]  = useState("");
  const [execDone,         setExecDone]         = useState(false);

  const selected    = blocks.find(b => b.id === selectedId) ?? null;
  const canActOnSel = selected !== null;
  const canDelete   = selected !== null && !selected.slots.some(s => s.hasHistory);

  useEffect(() => {
    setMode(prev => prev === "create" ? prev : "view");
    setConfirmDelete(false);
    setExecFecha(""); setExecSignal("ok");
    setExecMotivoPreset(""); setExecMotivoLibre("");
    setExecNewApertura(""); setExecDone(false);
  }, [selectedId]);

  // Todas las autorizaciones activas para el bloque seleccionado (en orden de emisión)
  const blockAuths = selected
    ? authorizations
        .filter(a => selected.slots.some(s => s.code === a.cajaCode) && a.status === "emitida")
        .sort((a, b) => a.authorizedAt.localeCompare(b.authorizedAt))
    : [];
  const activeAuth = blockAuths[0] ?? null; // el operador ejecuta de a una

  const targetSession: SessionEntry | null = activeAuth
    ? (sessionHistory.find(e => e.id === activeAuth.sessionId) ?? null)
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
    onAuthExecuted();
    setExecDone(true);
  }

  const thirdAction: ThirdAction =
    !canActOnSel        ? null
    : !selected!.active ? "activate"
    :                     "deactivate";

  function mutateBlock(fn: (b: OperationalBlock) => OperationalBlock) {
    if (!selectedId) return;
    setBlocks(prev => prev.map(b => b.id === selectedId ? fn(b) : b));
  }

  function handleStartEdit() {
    if (!selected) return;
    setConfirmDelete(false);
    const secCount = selected.slots.filter(
      s => s.slotType === "secundaria-1" || s.slotType === "secundaria-2" ||
           s.slotType === "secundaria-3" || s.slotType === "secundaria-4"
    ).length as SecCount;
    setEditSecondaryCount(secCount);
    setMode("edit");
  }

  function handleSave() {
    if (mode === "create") {
      const base = nextBlockBase(blocks);
      const next: OperationalBlock = {
        id: `b${base}`, blockBase: base, active: true,
        slots: buildSlots(base, 2),
        createdAt: new Date(), createdBy: "OPERADOR",
      };
      setBlocks(prev => [...prev, next]);
      onSelect(next.id);
    } else if (mode === "edit" && selected) {
      mutateBlock(b => ({ ...b, slots: buildSlots(b.blockBase, editSecondaryCount, b.slots) }));
    }
    setMode("view");
  }

  function handleDeactivate() {
    if (!selected || !selected.active) return;
    mutateBlock(b => ({ ...b, active: false }));
    setMode("view");
  }

  function handleActivate() {
    if (!selected || selected.active) return;
    mutateBlock(b => ({ ...b, active: true }));
  }

  function handleDelete() {
    if (!canDelete) return;
    setBlocks(prev => prev.filter(b => b.id !== selectedId));
    onSelect(null);
    setConfirmDelete(false);
    setMode("view");
  }

  const showView = mode === "view" && selected !== null;
  const showForm = mode === "create" || mode === "edit";

  const previewSlots = showForm
    ? buildSlots(
        mode === "create" ? nextBlockBase(blocks) : (selected?.blockBase ?? 100),
        mode === "create" ? 2 : editSecondaryCount,
        selected?.slots,
      )
    : [];

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[#2A7CA8]/40 bg-[#FDFCF9]">

      {/* SheetHeader */}
      <div className="shrink-0 flex h-[42px] items-center gap-2 border-b border-[#2A7CA8]/15 bg-[#F2F7FA] px-4">
        <LayoutGrid size={13} strokeWidth={2} className="shrink-0 text-[#1a5f7a]" />
        <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">CONFIGURACIÓN DE CAJAS</span>
      </div>

      {/* ActionBar */}
      <div className="shrink-0 flex items-center gap-1.5 border-b border-[#2A7CA8]/10 px-4 py-2">
        <button
          onClick={() => { onSelect(null); setMode("create"); }}
          className="flex items-center gap-1.5 rounded-lg bg-[#45b356] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-[#35994a] active:scale-[0.97]">
          <Plus size={10} strokeWidth={2.5} />CREAR BLOQUE
        </button>
        <button
          onClick={handleStartEdit}
          disabled={!canActOnSel}
          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
            canActOnSel
              ? "bg-[#005BE3] text-white hover:bg-[#0049c4] active:scale-[0.97]"
              : "cursor-not-allowed bg-[#005BE3]/[0.15] text-[#005BE3]/50"
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
          <button onClick={handleDeactivate}
            className="flex items-center gap-1.5 rounded-lg bg-[#dc2626] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-[#b91c1c] active:scale-[0.97]">
            <Ban size={10} strokeWidth={2.5} />DESACTIVAR
          </button>
        )}
        {thirdAction === "activate" && (
          <button onClick={handleActivate}
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

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-3">

        {/* VIEW */}
        {showView && selected && (
          <div className="flex flex-col gap-4">

            {(() => {
              const bStatus = getBlockStatus(pos, selected);
              const blockOp = getBlockOperator(pos.operators, selected.blockBase);
              const statusCls: Record<BlockStatus, string> = {
                DISPONIBLE: "bg-[#EBF4FA] text-[#1a5f7a]",
                ASIGNADO:   "bg-[#dbeafe] text-[#2154d8]",
                EN_USO:     "bg-emerald-100 text-emerald-700",
                INACTIVO:   "bg-red-50 text-[#dc2626]",
              };
              return (
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="rounded-md bg-[#2A7CA8] px-2.5 py-1 text-[13px] font-bold tabular-nums text-white">
                    {selected.blockBase}
                  </span>
                  <span className={`rounded-md px-2 py-0.5 text-[9px] font-bold uppercase ${statusCls[bStatus]}`}>
                    {bStatus.replace("_", " ")}
                  </span>
                  {blockOp ? (
                    <div className="flex items-center gap-1.5 rounded-lg border border-[#e4e9f0] bg-[#fafbfc] px-2.5 py-1">
                      <User size={10} strokeWidth={2} className="shrink-0 text-[#2A7CA8]" />
                      <span className="text-[11px] font-semibold text-[#374151]">{blockOp.alias}</span>
                      <span className="text-[10px] text-[#9ca3af]">· {blockOp.codigoOperador}</span>
                    </div>
                  ) : selected.active && (
                    <span className="text-[11px] font-semibold text-[#b0bac8]">Sin operador asignado</span>
                  )}
                </div>
              );
            })()}

            {/* Composición */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">Composición del bloque</span>
              {selected.slots.map(slot => {
                const isContg = slot.slotType === "contingencia";
                const isSec   = slot.slotType === "secundaria-1" || slot.slotType === "secundaria-2";
                const slotAuth = activeAuth?.cajaCode === slot.code ? activeAuth : null;
                return (
                  <div key={slot.code}
                    className={`flex flex-col gap-1 rounded-xl border px-3 py-2.5 ${
                      slotAuth    ? "border-[#2154d8]/30 bg-[#EEF3FD]/50" :
                      isContg ? "border-amber-100 bg-amber-50/30" :
                      isSec   ? "border-[#dbeafe] bg-[#f0f6ff]" :
                                "border-[#e4e9f0] bg-[#f8fafc]"
                    }`}>
                    <div className="flex items-center gap-2">
                      {isContg ? <ShieldAlert size={11} strokeWidth={2} className="shrink-0 text-amber-500" /> :
                       isSec   ? <Monitor size={11} strokeWidth={2} className="shrink-0 text-[#2154d8]/60" /> :
                                 <CircleCheck size={11} strokeWidth={2} className="shrink-0 text-emerald-500" />}
                      <span className="text-[12px] font-bold tabular-nums text-[#374151]">{slot.code}</span>
                      <span className={`text-[10px] font-bold uppercase tracking-wider ${
                        isContg ? "text-amber-600" : isSec ? "text-[#2154d8]/70" : "text-[#1a5f7a]"
                      }`}>
                        {slotLabel(slot.slotType)}
                      </span>
                      {slot.hasHistory && !slotAuth && (
                        <span className="ml-auto rounded bg-[#EBF4FA] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#1a5f7a]">
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
                      {slotObservacion(slot, selected.blockBase)}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Autorización activa — superficie de ejecución del operador */}
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
            )}

            {/* Trazabilidad bloque */}
            <div className="mt-auto border-t border-[#f1f5f9] pt-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#c8d4e0]">Creado</span>
                  <span className="text-[11px] font-semibold tabular-nums text-[#a8b4c4]">{formatCreatedAt(selected.createdAt)}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#c8d4e0]">Por</span>
                  <span className="text-[11px] font-semibold tracking-wider text-[#a8b4c4]">{selected.createdBy}</span>
                </div>
              </div>
            </div>

            {/* Confirmar eliminación */}
            {confirmDelete && (
              <div className="flex flex-col gap-2 rounded-xl border border-[#dc2626]/30 bg-[#fef2f2] px-3.5 py-2.5">
                <p className="text-[10px] font-semibold text-[#dc2626]">
                  ¿Eliminar bloque {selected.blockBase}? Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setConfirmDelete(false)}
                    className="flex-1 rounded-lg border border-[#e4e9f0] bg-white py-1.5 text-[10px] font-bold uppercase text-[#6b7280] hover:border-[#b0bac8] transition">
                    Cancelar
                  </button>
                  <button onClick={handleDelete}
                    className="flex-1 rounded-lg bg-[#dc2626] py-1.5 text-[10px] font-bold uppercase text-white hover:bg-[#b91c1c] transition">
                    Confirmar eliminación
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* FORM */}
        {showForm && (
          <div className="flex flex-col gap-4">

            <div className="flex items-center gap-2.5 rounded-xl border border-[#e4e9f0] bg-[#fafbfc] px-3 py-2">
              <span className="rounded-md bg-[#2A7CA8] px-2 py-0.5 text-[11px] font-bold tabular-nums text-white">
                {mode === "create" ? nextBlockBase(blocks) : selected?.blockBase}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#9ca3af]">
                {mode === "create" ? "NUEVO BLOQUE OPERACIONAL" : "EDITAR BLOQUE"}
              </span>
            </div>

            {mode === "edit" && (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">CAJAS SECUNDARIAS</span>
                <div className="flex gap-1.5">
                  {([0, 1, 2, 3, 4] as const).map(n => (
                    <button
                      key={n}
                      onClick={() => setEditSecondaryCount(n)}
                      className={`flex-1 rounded-xl border py-2 text-[11px] font-bold transition active:scale-[0.97] ${
                        editSecondaryCount === n
                          ? "border-[#2154d8] bg-[#eff6ff] text-[#2154d8]"
                          : "border-[#e4e9f0] bg-white text-[#6b7280] hover:border-[#c0cad4]"
                      }`}>
                      {n}
                    </button>
                  ))}
                </div>
                <p className="text-[9px] text-[#9ca3af]">
                  {editSecondaryCount === 0 ? "Sin cajas secundarias" : `${editSecondaryCount} caja${editSecondaryCount > 1 ? "s" : ""} secundaria${editSecondaryCount > 1 ? "s" : ""} · máx. 4`}
                </p>
              </div>
            )}

            {mode === "create" && (
              <div className="rounded-xl border border-[#dbeafe] bg-[#f0f6ff] px-3 py-2.5">
                <p className="text-[11px] font-semibold text-[#2154d8]/80">
                  Se crearán 4 cajas: principal, 2 secundarias y contingencia.
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
              {previewSlots.map(slot => {
                const isContg = slot.slotType === "contingencia";
                const isSec   = slot.slotType === "secundaria-1" || slot.slotType === "secundaria-2";
                return (
                  <div key={slot.code}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
                      isContg ? "border-amber-100 bg-amber-50/30" :
                      isSec   ? "border-[#dbeafe] bg-[#f0f6ff]" :
                                "border-[#e4e9f0] bg-[#f8fafc]"
                    }`}>
                    {isContg ? <ShieldAlert size={10} strokeWidth={2} className="shrink-0 text-amber-500" /> :
                     isSec   ? <Monitor size={10} strokeWidth={2} className="shrink-0 text-[#2154d8]/60" /> :
                               <CircleCheck size={10} strokeWidth={2} className="shrink-0 text-emerald-500" />}
                    <span className="text-[11px] font-bold tabular-nums text-[#374151]">{slot.code}</span>
                    <span className={`text-[10px] font-semibold uppercase tracking-wide ${
                      isContg ? "text-amber-600" : isSec ? "text-[#2154d8]/70" : "text-[#1a5f7a]"
                    }`}>
                      {slotLabel(slot.slotType)}
                    </span>
                    {slot.hasHistory && (
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
              <button onClick={handleSave}
                className="flex h-10 flex-1 items-center justify-center rounded-md bg-[#45b356] text-[13px] font-semibold uppercase tracking-wider text-white transition hover:bg-[#35994a] active:scale-[0.98]">
                {mode === "create" ? "Crear bloque" : "Guardar cambios"}
              </button>
            </div>
          </div>
        )}

        {/* EMPTY */}
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

// ── CajasWorkspace ────────────────────────────────────────────────────────

export function CajasWorkspace() {
  const { operators, cashSession, activeOperator } = usePOS();
  const pos: POSRef = { operators, isOpen: cashSession.isOpen, cashBox: cashSession.cashBox };
  const operatorName = activeOperator?.nombreCompleto ?? "Operador";

  const [blocks,         setBlocks]         = useState<OperationalBlock[]>(MOCK_BLOCKS);
  const [selectedId,     setSelectedId]     = useState<string | null>("b100");
  const [authorizations, setAuthorizations] = useState<CajaAuthorization[]>(() => loadAuthorizations());
  const [sessionHistory, setSessionHistory] = useState<SessionEntry[]>(() => loadSessionHistory());

  const lastActivity = (() => {
    const map = new Map<string, LastActivity>();
    const history   = sessionHistory;
    const turnEvs   = loadTurnEvents();
    const opByKey   = new Map(history.map(e => [`${e.boxCode}-${e.openedAt}`, e.operator]));

    for (const e of history) {
      const prefix = e.boxCode[0];
      const at     = e.closedAt ?? e.openedAt;
      const cur    = map.get(prefix);
      if (!cur || at > cur.at) map.set(prefix, { at, operator: e.operator });
    }
    for (const e of turnEvs) {
      const boxCode = e.sessionKey.split("-")[0];
      if (!boxCode) continue;
      const prefix = boxCode[0];
      const cur    = map.get(prefix);
      if (!cur || e.ts > cur.at) {
        map.set(prefix, { at: e.ts, operator: opByKey.get(e.sessionKey) ?? "" });
      }
    }
    return map;
  })();

  const authBlockPrefixes = new Set(
    authorizations
      .filter(a => a.status === "emitida")
      .map(a => a.cajaCode[0]),
  );

  function handleAuthExecuted() {
    setAuthorizations(loadAuthorizations());
    setSessionHistory(loadSessionHistory());
  }

  return (
    <section className="flex min-h-0 flex-1 gap-2">
      <PanelCajas
        blocks={blocks}
        selectedId={selectedId}
        onSelect={setSelectedId}
        pos={pos}
        lastActivity={lastActivity}
        authBlockPrefixes={authBlockPrefixes}
      />
      <PanelGestionCajas
        blocks={blocks}
        setBlocks={setBlocks}
        selectedId={selectedId}
        onSelect={setSelectedId}
        pos={pos}
        authorizations={authorizations}
        onAuthExecuted={handleAuthExecuted}
        operatorName={operatorName}
        sessionHistory={sessionHistory}
      />
    </section>
  );
}
