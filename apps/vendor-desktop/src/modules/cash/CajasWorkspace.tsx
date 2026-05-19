import { useState } from "react";
import { Plus, Pencil, Ban, ToggleRight, Layers, ChevronRight } from "lucide-react";

type BoxStatus = "disponible" | "en_uso" | "bloqueada";

type CajaOp = {
  id: string;
  code: string;
  alias: string;
  type: "principal" | "contingencia";
  status: BoxStatus;
  createdAt: Date;
  createdBy: string;
};

type ThirdAction = "deactivate" | "activate" | "locked" | null;

const STATUS_CFG: Record<BoxStatus, { badgeBg: string; badgeText: string; dotBg: string; label: string }> = {
  disponible: { badgeBg: "bg-[#e8fce8]", badgeText: "text-[#44a852]", dotBg: "bg-[#56C264]", label: "DISPONIBLE" },
  en_uso:     { badgeBg: "bg-[#eff6ff]", badgeText: "text-[#005BE3]", dotBg: "bg-[#005BE3]", label: "EN USO"     },
  bloqueada:  { badgeBg: "bg-red-50",    badgeText: "text-[#dc2626]", dotBg: "bg-[#dc2626]", label: "BLOQUEADA"  },
};

const MOCK_CAJAS: CajaOp[] = [
  { id: "100", code: "100", alias: "", type: "principal",    status: "en_uso",     createdAt: new Date("2024-01-10T08:00:00"), createdBy: "FERNANDO" },
  { id: "101", code: "101", alias: "", type: "contingencia", status: "disponible", createdAt: new Date("2024-03-15T10:30:00"), createdBy: "CARLOS"   },
];

function formatCreatedAt(d: Date): string {
  const dd  = String(d.getDate()).padStart(2, "0");
  const mm  = String(d.getMonth() + 1).padStart(2, "0");
  const hh  = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()} · ${hh}:${min}`;
}

const CONTINGENCY_SLOTS = [101, 102, 103, 104];

export function CajasWorkspace() {
  const [cajas,      setCajas]      = useState<CajaOp[]>(MOCK_CAJAS);
  const [selectedId, setSelectedId] = useState<string | null>("100");
  const [isEditing,  setIsEditing]  = useState(false);
  const [editAlias,  setEditAlias]  = useState("");

  const selected      = cajas.find(c => c.id === selectedId) ?? null;
  const contingencies = cajas.filter(c => c.type === "contingencia");
  const existingCodes = cajas.map(c => parseInt(c.code));
  const nextCode      = CONTINGENCY_SLOTS.find(n => !existingCodes.includes(n));
  const canAddCtg     = nextCode !== undefined;
  const canActOnSel   = selected !== null;

  const thirdAction: ThirdAction =
    !canActOnSel                             ? null
    : selected!.type === "principal"         ? "locked"
    : selected!.status === "bloqueada"       ? "activate"
    :                                          "deactivate";

  // Pre-compute status config for selected (safe only where selected is guaranteed non-null)
  const selStatusCfg = selected ? STATUS_CFG[selected.status] : null;

  function handleSelect(caja: CajaOp) {
    setSelectedId(caja.id);
    setIsEditing(false);
  }

  function handleStartEdit() {
    if (!selected) return;
    setEditAlias(selected.alias);
    setIsEditing(true);
  }

  function handleSaveEdit() {
    if (!selectedId) return;
    setCajas(prev => prev.map(c =>
      c.id === selectedId ? { ...c, alias: editAlias.trim() } : c
    ));
    setIsEditing(false);
  }

  function handleCancelEdit() {
    setIsEditing(false);
  }

  function handleAddContingency() {
    if (!nextCode) return;
    const next: CajaOp = {
      id:        String(nextCode),
      code:      String(nextCode),
      alias:     "",
      type:      "contingencia",
      status:    "disponible",
      createdAt: new Date(),
      createdBy: "OPERADOR",
    };
    setCajas(prev => [...prev, next]);
    setSelectedId(next.id);
    setIsEditing(false);
  }

  function handleDeactivate() {
    if (!selected || selected.type === "principal") return;
    setCajas(prev => prev.map(c =>
      c.id === selected.id ? { ...c, status: "bloqueada" } : c
    ));
    setIsEditing(false);
  }

  function handleActivate() {
    if (!selected || selected.status !== "bloqueada") return;
    setCajas(prev => prev.map(c =>
      c.id === selected.id ? { ...c, status: "disponible" } : c
    ));
  }

  const showViewMode = selected !== null && !isEditing;
  const showEditForm = selected !== null && isEditing;

  return (
    <section className="flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-[#78C487]/40 bg-[#FDFCF9]">

      {/* SheetHeader */}
      <header className="shrink-0 flex items-center justify-between border-b border-[#78C487]/15 bg-[#F5FBF5] px-4 py-2.5">

        <div className="flex items-center gap-2">
          <Layers size={13} strokeWidth={2} className="text-[#78C487]" />
          <span className="text-[14px] font-semibold uppercase tracking-tight text-[#121416] leading-none">
            CAJAS OPERACIONALES
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-widest text-[#c0cad4]">
            · continuidad y contingencia
          </span>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1.5">

          {/* NUEVA CAJA */}
          <button
            onClick={handleAddContingency}
            disabled={!canAddCtg}
            title={canAddCtg ? `Agregar contingencia ${nextCode}` : "Máximo de contingencias alcanzado"}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition ${
              canAddCtg
                ? "bg-[#56C264] text-white hover:bg-[#44a852] active:scale-[0.97]"
                : "cursor-not-allowed bg-[#56C264]/[0.15] text-[#56C264]/50"
            }`}
          >
            <Plus size={12} strokeWidth={2.5} />
            NUEVA CAJA
          </button>

          {/* EDITAR CAJA */}
          <button
            onClick={handleStartEdit}
            disabled={!canActOnSel}
            title="Tecla [CTRL + E]"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition ${
              canActOnSel
                ? "bg-[#005BE3] text-white hover:bg-[#0049c4] active:scale-[0.97]"
                : "cursor-not-allowed bg-[#005BE3]/[0.15] text-[#005BE3]/50"
            }`}
          >
            <Pencil size={12} strokeWidth={2.5} />
            EDITAR CAJA
          </button>

          {/* DESACTIVAR / ACTIVAR — tercer slot dinámico */}
          {(thirdAction === null || thirdAction === "locked") && (
            <button
              disabled
              title={thirdAction === "locked" ? "Caja principal no puede desactivarse" : ""}
              className="flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-[#dc2626]/[0.15] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#dc2626]/50"
            >
              <Ban size={12} strokeWidth={2.5} />
              DESACTIVAR CAJA
            </button>
          )}
          {thirdAction === "deactivate" && (
            <button
              onClick={handleDeactivate}
              title="Tecla [CTRL + D]"
              className="flex items-center gap-1.5 rounded-lg bg-[#dc2626] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white transition hover:bg-[#b91c1c] active:scale-[0.97]"
            >
              <Ban size={12} strokeWidth={2.5} />
              DESACTIVAR CAJA
            </button>
          )}
          {thirdAction === "activate" && (
            <button
              onClick={handleActivate}
              title="Tecla [CTRL + D]"
              className="flex items-center gap-1.5 rounded-lg bg-[#56C264] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white transition hover:bg-[#44a852] active:scale-[0.97]"
            >
              <ToggleRight size={12} strokeWidth={2.5} />
              ACTIVAR CAJA
            </button>
          )}

        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1">

        {/* List */}
        <div className="w-[44%] shrink-0 overflow-y-auto border-r border-[#78C487]/10">
          {cajas.map(caja => {
            const isSel = caja.id === selectedId;
            const sc    = STATUS_CFG[caja.status];
            return (
              <div
                key={caja.id}
                onClick={() => handleSelect(caja)}
                className={`flex cursor-pointer items-center gap-3 border-l-2 px-4 py-2.5 transition ${
                  isSel
                    ? "border-[#78C487] bg-[#EFF8F0]"
                    : "border-transparent hover:bg-[#F5FBF5]"
                }`}
              >
                <span className={`shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold tabular-nums tracking-wide ${
                  isSel
                    ? "bg-[#78C487] text-white"
                    : caja.type === "principal"
                    ? "bg-[#e8f5ea] text-[#4a7a55]"
                    : "bg-amber-50 text-amber-700"
                }`}>
                  {caja.code}
                </span>

                <div className="min-w-0 flex-1">
                  <p className={`text-[12px] font-semibold uppercase tracking-tight ${isSel ? "text-[#2d6640]" : "text-[#2F3E46]"}`}>
                    {caja.type === "principal" ? "PRINCIPAL" : "CONTINGENCIA"}
                    {caja.alias && (
                      <span className="ml-1.5 font-semibold normal-case tracking-normal text-[#9ca3af]">
                        {caja.alias}
                      </span>
                    )}
                  </p>
                  <p className="text-[10px] font-semibold text-[#9ca3af]">CAJA {caja.code}</p>
                </div>

                <span className={`shrink-0 rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${sc.badgeBg} ${sc.badgeText}`}>
                  {sc.label}
                </span>

                <ChevronRight size={12} className={isSel ? "text-[#78C487]" : "text-[#d1d9e1]"} />
              </div>
            );
          })}
        </div>

        {/* Detail panel */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">

          {/* VIEW MODE */}
          {showViewMode && selected && selStatusCfg && (
            <div className="flex flex-col gap-4">

              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">
                {selected.type === "principal" ? "CAJA PRINCIPAL" : "CAJA CONTINGENCIA"}
              </span>

              {/* Code + status indicator */}
              <div className="flex items-center gap-3">
                <span className={`rounded-md px-3 py-1 text-[13px] font-bold tabular-nums ${
                  selected.type === "principal"
                    ? "bg-[#78C487] text-white"
                    : "bg-amber-100 text-amber-800"
                }`}>
                  {selected.code}
                </span>
                <div className={`flex items-center gap-1.5 rounded-xl px-3 py-1 ${selStatusCfg.badgeBg}`}>
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${selStatusCfg.dotBg}`} />
                  <span className={`text-[11px] font-semibold uppercase tracking-wider ${selStatusCfg.badgeText}`}>
                    {selStatusCfg.label}
                  </span>
                </div>
              </div>

              {selected.alias && (
                <p className="text-[12px] font-semibold text-[#6b7280]">{selected.alias}</p>
              )}

              {/* PRINCIPAL — sección contingencias */}
              {selected.type === "principal" && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">
                      Contingencias activas
                    </span>
                    <span className={`text-[10px] font-bold tabular-nums ${
                      contingencies.length === 4 ? "text-amber-600" : "text-[#9ca3af]"
                    }`}>
                      {contingencies.length}/4
                    </span>
                  </div>

                  {contingencies.length === 0 && (
                    <p className="text-[11px] font-semibold text-[#c0cad4]">Sin contingencias activas</p>
                  )}

                  {contingencies.map(ctg => {
                    const cs = STATUS_CFG[ctg.status];
                    return (
                      <div
                        key={ctg.id}
                        onClick={() => handleSelect(ctg)}
                        className="flex cursor-pointer items-center gap-2 rounded-xl border border-amber-100 bg-amber-50/40 px-3 py-1.5 transition hover:bg-amber-50/80"
                      >
                        <span className="text-[11px] font-bold tabular-nums text-amber-700">{ctg.code}</span>
                        <span className="text-[#d1d9e1]">·</span>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${cs.badgeText}`}>
                          {cs.label}
                        </span>
                        <ChevronRight size={10} className="ml-auto text-[#d1d9e1]" />
                      </div>
                    );
                  })}

                  {canAddCtg ? (
                    <button
                      onClick={handleAddContingency}
                      className="flex items-center justify-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-amber-700 transition hover:bg-amber-100 active:scale-[0.98]"
                    >
                      <Plus size={11} strokeWidth={2.5} />
                      AGREGAR CONTINGENCIA · {nextCode}
                    </button>
                  ) : (
                    <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-[#b0bac8]">
                      Máximo de contingencias · 4/4
                    </p>
                  )}
                </div>
              )}

              {/* CONTINGENCIA — referencia a principal */}
              {selected.type === "contingencia" && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">
                    Caja principal
                  </span>
                  <span className="rounded-md bg-[#e8f5ea] px-2 py-0.5 text-[10px] font-bold text-[#4a7a55]">
                    100
                  </span>
                </div>
              )}

              {/* Metadata operacional — silenciosa, al pie */}
              <div className="mt-auto border-t border-[#f1f5f9] pt-3">
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[#c8d4e0]">Creado</span>
                    <span className="text-[11px] font-semibold tabular-nums text-[#a8b4c4]">
                      {formatCreatedAt(selected.createdAt)}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-widest text-[#c8d4e0]">Por</span>
                    <span className="text-[11px] font-semibold tracking-wider text-[#a8b4c4]">
                      {selected.createdBy}
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* EDIT FORM */}
          {showEditForm && selected && (
            <div className="flex flex-col gap-4">

              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">
                EDITAR CAJA {selected.code}
              </span>

              {/* Code + type (readonly) */}
              <div className="flex items-center gap-2.5 rounded-xl border border-[#e4e9f0] bg-[#fafbfc] px-3 py-2">
                <span className={`rounded-md px-2 py-0.5 text-[11px] font-bold tabular-nums ${
                  selected.type === "principal" ? "bg-[#78C487] text-white" : "bg-amber-100 text-amber-800"
                }`}>
                  {selected.code}
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-widest text-[#9ca3af]">
                  {selected.type === "principal" ? "PRINCIPAL" : "CONTINGENCIA"}
                </span>
              </div>

              {/* Alias */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">
                  Alias / etiqueta
                </span>
                <input
                  autoFocus
                  type="text"
                  value={editAlias}
                  onChange={e => setEditAlias(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter")  handleSaveEdit();
                    if (e.key === "Escape") handleCancelEdit();
                  }}
                  placeholder="Etiqueta operacional opcional..."
                  className="rounded-xl border border-[#e4e9f0] bg-white px-3 py-2 text-[12px] font-semibold text-[#374151] outline-none transition focus:border-[#78C487] focus:ring-1 focus:ring-[#78C487]/20 placeholder:text-[#d1d9e1]"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleCancelEdit}
                  title="Tecla [ESC]"
                  className="flex h-10 flex-1 items-center justify-center rounded-md border border-[#e4e9f0] bg-white text-[13px] font-semibold uppercase tracking-wider text-[#6b7280] transition hover:border-[#b0bac8] hover:text-[#374151]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEdit}
                  title="Tecla [ENTER]"
                  className="flex h-10 flex-1 items-center justify-center rounded-md bg-[#56C264] text-[13px] font-semibold uppercase tracking-wider text-white transition hover:bg-[#44a852] active:scale-[0.98]"
                >
                  Guardar
                </button>
              </div>

            </div>
          )}

          {/* EMPTY STATE (fallback) */}
          {!showViewMode && !showEditForm && (
            <div className="flex flex-col items-center justify-center gap-1.5 py-12 text-center">
              <Layers size={24} strokeWidth={1.5} className="text-[#d1d9e1]" />
              <p className="text-[12px] font-semibold text-[#c0cad4]">Seleccione una caja</p>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
