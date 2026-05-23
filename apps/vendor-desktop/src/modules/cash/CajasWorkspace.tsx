import { useState } from "react";
import { Plus, Pencil, Ban, ToggleRight, Layers, LayoutGrid, ChevronRight, CircleCheck, Monitor, ShieldAlert, User } from "lucide-react";
import { usePOS } from "../../context/POSContext";

// ── tipos estructurales ────────────────────────────────────────────────────

type SlotType = "principal" | "secundaria-1" | "secundaria-2" | "contingencia";

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

// ── mock data ──────────────────────────────────────────────────────────────

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
  {
    id: "b200", blockBase: 200, active: true,
    createdAt: new Date("2024-03-15T09:30:00"), createdBy: "FERNANDO",
    slots: [
      { code: "200", slotType: "principal",    hasHistory: true  },
      { code: "201", slotType: "secundaria-1", hasHistory: false },
      { code: "202", slotType: "secundaria-2", hasHistory: false },
      { code: "250", slotType: "contingencia", hasHistory: false },
    ],
  },
  {
    id: "b300", blockBase: 300, active: false,
    createdAt: new Date("2023-11-02T10:00:00"), createdBy: "ADMIN",
    slots: [
      { code: "300", slotType: "principal",    hasHistory: true  },
      { code: "301", slotType: "secundaria-1", hasHistory: false },
      { code: "302", slotType: "secundaria-2", hasHistory: false },
      { code: "350", slotType: "contingencia", hasHistory: false },
    ],
  },
];

// ── helpers ────────────────────────────────────────────────────────────────

function formatCreatedAt(d: Date): string {
  const dd  = String(d.getDate()).padStart(2, "0");
  const mm  = String(d.getMonth() + 1).padStart(2, "0");
  const hh  = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()} · ${hh}:${min}`;
}

function nextBlockBase(blocks: OperationalBlock[]): number {
  const existing = new Set(blocks.map(b => b.blockBase));
  let n = 100;
  while (existing.has(n)) n += 100;
  return n;
}

function slotSummary(slots: CajaSlot[]): string {
  const labels: Record<SlotType, string> = {
    "principal": "P", "secundaria-1": "S1", "secundaria-2": "S2", "contingencia": "CTG",
  };
  return slots.map(s => labels[s.slotType]).join(" · ");
}

function slotLabel(t: SlotType): string {
  if (t === "principal")    return "PRINCIPAL";
  if (t === "secundaria-1") return "SECUNDARIA 01";
  if (t === "secundaria-2") return "SECUNDARIA 02";
  return "CONTINGENCIA";
}

function slotObservacion(slot: CajaSlot, blockBase: number): string {
  if (slot.slotType === "principal")    return "Sin restricciones — flujo principal de ventas";
  if (slot.slotType === "secundaria-1") return `Requiere caja ${blockBase} cerrada`;
  if (slot.slotType === "secundaria-2") return `Requiere caja ${blockBase + 1} cerrada`;
  if (slot.slotType === "contingencia") return `Requiere caja ${blockBase} sin apertura · PIN + motivo obligatorio`;
  return "";
}

// ── interfaces de props ────────────────────────────────────────────────────

interface POSRef {
  operators: ReturnType<typeof usePOS>["operators"];
  isOpen: boolean;
  cashBox: ReturnType<typeof usePOS>["cashBox"];
}

type BlockStatus = "DISPONIBLE" | "ASIGNADO" | "EN_USO" | "INACTIVO";

function getBlockOperator(operators: POSRef["operators"], blockBase: number) {
  return operators.find(o => o.blockBase === blockBase && o.status !== "INACTIVO");
}

function getBlockStatus(pos: POSRef, block: OperationalBlock): BlockStatus {
  if (!block.active) return "INACTIVO";
  const inUso = pos.isOpen && pos.cashBox !== null && pos.cashBox.code[0] === String(block.blockBase)[0];
  if (inUso) return "EN_USO";
  const hasOp = getBlockOperator(pos.operators, block.blockBase);
  return hasOp ? "ASIGNADO" : "DISPONIBLE";
}

// ── PanelCajas — selector ──────────────────────────────────────────────────

interface PanelCajasProps {
  blocks: OperationalBlock[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  pos: POSRef;
}

function PanelCajas({ blocks, selectedId, onSelect, pos }: PanelCajasProps) {
  const activeCount   = blocks.filter(b => b.active).length;
  const inactiveCount = blocks.filter(b => !b.active).length;

  const statusColor: Record<BlockStatus, string> = {
    DISPONIBLE: "text-[#78C487]",
    ASIGNADO:   "text-[#2154d8]/80",
    EN_USO:     "text-emerald-600",
    INACTIVO:   "text-[#dc2626]/70",
  };

  return (
    <div className="flex w-[260px] shrink-0 flex-col overflow-hidden rounded-[28px] border border-[#78C487]/40 bg-[#FDFCF9]">

      {/* SheetHeader */}
      <div className="shrink-0 flex h-[42px] items-center gap-2 border-b border-[#78C487]/15 bg-[#F3F8F4] px-4">
        <Layers size={13} strokeWidth={2} className="shrink-0 text-[#4a7a55]" />
        <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">CAJAS OPERATIVAS</span>
        <div className="ml-auto flex items-center gap-1">
          {activeCount > 0 && (
            <span className="rounded bg-[#e8f5ea] px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-[#4a7a55]">{activeCount}</span>
          )}
          {inactiveCount > 0 && (
            <span className="rounded bg-red-50 px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-[#dc2626]/70">{inactiveCount}</span>
          )}
        </div>
      </div>

      {/* Lista */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {blocks.map(block => {
          const isSel   = block.id === selectedId;
          const bStatus = getBlockStatus(pos, block);
          const blockOp = getBlockOperator(pos.operators, block.blockBase);
          return (
            <div
              key={block.id}
              onClick={() => onSelect(block.id)}
              className={`flex cursor-pointer items-start gap-3 border-l-2 px-4 py-3 transition ${
                isSel ? "border-[#78C487] bg-[#EFF8F0]" : "border-transparent hover:bg-[#F5FBF5]"
              }`}>
              <span className={`mt-px shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                isSel ? "bg-[#78C487] text-white" : "bg-[#e8f5ea] text-[#4a7a55]"
              }`}>
                {block.blockBase}
              </span>
              <div className="min-w-0 flex-1">
                <p className={`text-[12px] font-semibold ${isSel ? "text-[#2d6640]" : blockOp ? "text-[#2F3E46]" : "text-[#b0bac8]"}`}>
                  {blockOp ? blockOp.name : "Sin operador"}
                </p>
                <p className={`mt-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusColor[bStatus]}`}>
                  {bStatus.replace("_", " ")}&ensp;·&ensp;
                  <span className="normal-case tracking-normal text-[#9ca3af]">{slotSummary(block.slots)}</span>
                </p>
              </div>
              <ChevronRight size={12} className={`mt-1 shrink-0 ${isSel ? "text-[#78C487]" : "text-[#d1d9e1]"}`} />
            </div>
          );
        })}
        {blocks.length === 0 && (
          <div className="flex items-center justify-center py-10">
            <p className="text-[12px] font-semibold text-[#c0cad4]">Sin bloques operacionales</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── PanelGestionCajas — detalle + form ────────────────────────────────────

interface PanelGestionCajasProps {
  blocks: OperationalBlock[];
  setBlocks: React.Dispatch<React.SetStateAction<OperationalBlock[]>>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  pos: POSRef;
}

function PanelGestionCajas({ blocks, setBlocks, selectedId, onSelect, pos }: PanelGestionCajasProps) {
  const [mode, setMode] = useState<PanelMode>("view");

  const selected    = blocks.find(b => b.id === selectedId) ?? null;
  const canActOnSel = selected !== null;

  const thirdAction: ThirdAction =
    !canActOnSel        ? null
    : !selected!.active ? "activate"
    :                     "deactivate";

  function mutateBlock(fn: (b: OperationalBlock) => OperationalBlock) {
    if (!selectedId) return;
    setBlocks(prev => prev.map(b => b.id === selectedId ? fn(b) : b));
  }

  function handleSave() {
    if (mode === "create") {
      const base = nextBlockBase(blocks);
      const next: OperationalBlock = {
        id: `b${base}`, blockBase: base, active: true,
        slots: [
          { code: String(base),      slotType: "principal",    hasHistory: false },
          { code: String(base + 1),  slotType: "secundaria-1", hasHistory: false },
          { code: String(base + 2),  slotType: "secundaria-2", hasHistory: false },
          { code: String(base + 50), slotType: "contingencia", hasHistory: false },
        ],
        createdAt: new Date(), createdBy: "OPERADOR",
      };
      setBlocks(prev => [...prev, next]);
      onSelect(next.id);
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

  const showView = mode === "view" && selected !== null;
  const showForm = mode === "create" || mode === "edit";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[#78C487]/40 bg-[#FDFCF9]">

      {/* SheetHeader */}
      <div className="shrink-0 flex h-[42px] items-center gap-2 border-b border-[#78C487]/15 bg-[#F3F8F4] px-4">
        <LayoutGrid size={13} strokeWidth={2} className="shrink-0 text-[#4a7a55]" />
        <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">GESTIÓN DE CAJAS</span>
      </div>

      {/* ActionBar */}
      <div className="shrink-0 flex items-center gap-1.5 border-b border-[#78C487]/10 px-4 py-2">
        <button
          onClick={() => { onSelect(null); setMode("create"); }}
          className="flex items-center gap-1.5 rounded-lg bg-[#45b356] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-[#35994a] active:scale-[0.97]">
          <Plus size={10} strokeWidth={2.5} />CREAR BLOQUE
        </button>
        <button
          onClick={() => { if (selected) setMode("edit"); }}
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
      </div>

      {/* Body */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pt-3 pb-3">

        {/* VIEW */}
        {showView && selected && (
          <div className="flex flex-col gap-4">

            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">BLOQUE OPERACIONAL</span>

            {(() => {
              const bStatus = getBlockStatus(pos, selected);
              const blockOp = getBlockOperator(pos.operators, selected.blockBase);
              const statusLabel: Record<string, string> = {
                DISPONIBLE: "DISPONIBLE", ASIGNADO: "ASIGNADO", EN_USO: "EN USO", INACTIVO: "INACTIVO",
              };
              const statusCls: Record<string, string> = {
                DISPONIBLE: "bg-[#e8f5ea] text-[#4a7a55]",
                ASIGNADO:   "bg-[#dbeafe] text-[#2154d8]",
                EN_USO:     "bg-emerald-100 text-emerald-700",
                INACTIVO:   "bg-red-50 text-[#dc2626]",
              };
              return (
                <div className="flex items-center gap-2.5">
                  <span className="rounded-md bg-[#78C487] px-2.5 py-1 text-[13px] font-bold tabular-nums text-white">
                    {selected.blockBase}
                  </span>
                  <span className={`rounded-md px-2 py-0.5 text-[9px] font-bold uppercase ${statusCls[bStatus]}`}>
                    {statusLabel[bStatus]}
                  </span>
                  {blockOp && (
                    <div className="flex items-center gap-1.5 rounded-lg border border-[#e4e9f0] bg-[#fafbfc] px-2.5 py-1">
                      <User size={10} strokeWidth={2} className="shrink-0 text-[#78C487]" />
                      <span className="text-[11px] font-semibold text-[#374151]">{blockOp.name}</span>
                      <span className="text-[10px] text-[#9ca3af]">· {blockOp.code}</span>
                    </div>
                  )}
                  {!blockOp && selected.active && (
                    <span className="text-[11px] font-semibold text-[#b0bac8]">Sin operador asignado</span>
                  )}
                </div>
              );
            })()}

            {/* Composición de cajas */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">Composición del bloque</span>

              {selected.slots.map(slot => {
                const isContg = slot.slotType === "contingencia";
                const isSec   = slot.slotType === "secundaria-1" || slot.slotType === "secundaria-2";
                return (
                  <div key={slot.code}
                    className={`flex flex-col gap-1 rounded-xl border px-3 py-2.5 ${
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
                        isContg ? "text-amber-600" : isSec ? "text-[#2154d8]/70" : "text-[#4a7a55]"
                      }`}>
                        {slotLabel(slot.slotType)}
                      </span>
                      {slot.hasHistory && (
                        <span className="ml-auto rounded bg-[#e8f5ea] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest text-[#4a7a55]">
                          CON USO
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

            {/* Trazabilidad */}
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

          </div>
        )}

        {/* FORM */}
        {showForm && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5 rounded-xl border border-[#e4e9f0] bg-[#fafbfc] px-3 py-2">
              <span className="rounded-md bg-[#78C487] px-2 py-0.5 text-[11px] font-bold tabular-nums text-white">
                {mode === "create" ? nextBlockBase(blocks) : selected?.blockBase}
              </span>
              <span className="text-[11px] font-semibold uppercase tracking-widest text-[#9ca3af]">
                {mode === "create" ? "NUEVO BLOQUE OPERACIONAL" : "CONFIRMAR EDICIÓN"}
              </span>
            </div>

            {mode === "create" && (
              <div className="rounded-xl border border-[#dbeafe] bg-[#f0f6ff] px-3 py-2.5">
                <p className="text-[11px] font-semibold text-[#2154d8]/80">
                  Se crearán 4 cajas: principal, secundaria-1, secundaria-2 y contingencia.
                </p>
                <p className="mt-1 text-[10px] text-[#9ca3af]">
                  La asignación de operador se realiza en la sección OPERADORES.
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button onClick={() => setMode("view")} title="Tecla [ESC]"
                className="flex h-10 flex-1 items-center justify-center rounded-md border border-[#e4e9f0] bg-white text-[13px] font-semibold uppercase tracking-wider text-[#6b7280] transition hover:border-[#b0bac8] hover:text-[#374151]">
                Cancelar
              </button>
              <button onClick={handleSave} title="Tecla [ENTER]"
                className="flex h-10 flex-1 items-center justify-center rounded-md bg-[#45b356] text-[13px] font-semibold uppercase tracking-wider text-white transition hover:bg-[#35994a] active:scale-[0.98]">
                {mode === "create" ? "Crear bloque" : "Confirmar"}
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

// ── CajasWorkspace — root ──────────────────────────────────────────────────

export function CajasWorkspace() {
  const { operators, isOpen, cashBox } = usePOS();
  const pos: POSRef = { operators, isOpen, cashBox };

  const [blocks,     setBlocks]     = useState<OperationalBlock[]>(MOCK_BLOCKS);
  const [selectedId, setSelectedId] = useState<string | null>("b100");

  return (
    <section className="flex min-h-0 flex-1 gap-2">
      <PanelCajas
        blocks={blocks}
        selectedId={selectedId}
        onSelect={setSelectedId}
        pos={pos}
      />
      <PanelGestionCajas
        blocks={blocks}
        setBlocks={setBlocks}
        selectedId={selectedId}
        onSelect={setSelectedId}
        pos={pos}
      />
    </section>
  );
}
