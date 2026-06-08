import { useState } from "react";
import { Plus, Pencil, Ban, ToggleRight, Users, Sliders, ChevronRight, AlertCircle } from "lucide-react";
import { usePOS } from "../../context/POSContext";
// ── catálogo de capacidades (mismo que CapacidadesWorkspace) ─────────────

type ObservabilityLevel = "personal" | "contextual" | "supervisión" | "regularización";

const CAPABILITIES: { id: string; label: string; level: ObservabilityLevel }[] = [
  { id: "corregir_arqueos",            label: "Corregir arqueos",              level: "regularización" },
  { id: "reaperturar_cierres",         label: "Reaperturar cierres",           level: "regularización" },
  { id: "regularizar_incidencias",     label: "Regularizar incidencias",       level: "regularización" },
  { id: "observar_comprobantes_global",label: "Comprobantes globales",         level: "supervisión"    },
  { id: "anular_comprobantes",         label: "Anular comprobantes",           level: "supervisión"    },
  { id: "observar_continuidad",        label: "Continuidad multioperador",     level: "supervisión"    },
];

const LEVEL_CFG: Record<ObservabilityLevel, { bg: string; text: string }> = {
  personal:       { bg: "bg-[#697387]/10", text: "text-[#697387]"   },
  contextual:     { bg: "bg-[#2A7CA8]/10", text: "text-[#2A7CA8]"   },
  supervisión:    { bg: "bg-amber-100",    text: "text-amber-700"    },
  regularización: { bg: "bg-red-50",       text: "text-red-600"      },
};

// ── Panel izquierdo — selector de roles ─────────────────────────────────

function PanelRoles({ selectedId, onSelect }: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { roles } = usePOS();
  const activos   = roles.filter(r => r.activo).length;
  const inactivos = roles.filter(r => !r.activo).length;

  return (
    <div className="flex w-[260px] shrink-0 flex-col overflow-hidden rounded-[28px] border border-[#697387]/40 bg-[#FDFCF9]">

      <div className="shrink-0 flex h-[42px] items-center gap-2 border-b border-[#697387]/15 bg-[#F3F4F6] px-4">
        <Users size={13} strokeWidth={2} className="shrink-0 text-[#697387]" />
        <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">ROLES</span>
        <span className="rounded-md bg-[#697387]/15 px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-[#697387]">{roles.length}</span>
        <div className="ml-auto flex items-center gap-1.5">
          {inactivos > 0 && <span className="text-[9px] font-semibold text-amber-500">{inactivos} inact.</span>}
          {activos > 0   && <span className="text-[9px] font-semibold text-[#9ca3af]">{activos} activos</span>}
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {roles.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16">
            <Users size={24} strokeWidth={1.5} className="text-[#d1d9e1]" />
            <p className="text-[10px] font-semibold text-[#c0cad4]">Sin roles</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-[#f0f4f8]">
            {roles.map(role => {
              const isSel = role.id === selectedId;
              return (
                <div key={role.id} onClick={() => onSelect(role.id)}
                  className={`flex cursor-pointer items-center gap-2.5 border-l-2 px-3.5 py-2.5 transition ${
                    isSel ? "border-[#697387] bg-[#F3F4F6]" : "border-transparent hover:bg-[#F7F8FA]"
                  }`}>
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${
                    isSel ? "bg-[#697387] text-white" : "bg-[#F3F4F6] text-[#697387]"
                  }`}>{role.codigo}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[12px] font-semibold ${
                      isSel ? "text-[#121416]" : role.activo ? "text-[#2F3E46]" : "text-[#9ca3af]"
                    }`}>{role.nombre}</p>
                    <p className="text-[9px] text-[#c0cad4]">{role.capacidades.length} capacidades</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {!role.activo && (
                      <span className="rounded bg-amber-50 px-1 py-0.5 text-[8px] font-bold uppercase text-amber-600">INACT.</span>
                    )}
                    <ChevronRight size={10} className={isSel ? "text-[#697387]" : "text-[#e4e9f0]"} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Panel derecho — detalle + capabilities ───────────────────────────────

type EditPanel = "view" | "edit" | "new";

function PanelDetalle({ selectedId, onSelect }: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const { roles, operators, createRole, updateRoleData, setRoleActive, updateRoleCapabilities } = usePOS();
  const [panel,     setPanel]     = useState<EditPanel>("view");
  const [editCode,  setEditCode]  = useState("");
  const [editName,  setEditName]  = useState("");
  const [editDesc,  setEditDesc]  = useState("");
  const [codeError, setCodeError] = useState<string | null>(null);

  const selected = roles.find(r => r.id === selectedId) ?? null;
  const operatorsWithRole = selected ? operators.filter(o => o.codigoRol === selected.codigo && o.estado !== "INACTIVO") : [];
  const canSave = editCode.trim().length >= 2 && editName.trim().length >= 2;

  function handleNew() {
    onSelect(null); setPanel("new");
    setEditCode(""); setEditName(""); setEditDesc(""); setCodeError(null);
  }

  function handleStartEdit() {
    if (!selected) return;
    setEditCode(selected.codigo); setEditName(selected.nombre); setEditDesc(selected.descripcion);
    setCodeError(null); setPanel("edit");
  }

  function handleSave() {
    if (!canSave) return;
    setCodeError(null);
    if (panel === "new") {
      try {
        const role = createRole({ code: editCode, name: editName, description: editDesc });
        onSelect(role.id); setPanel("view");
      } catch (e) {
        setCodeError(e instanceof Error ? e.message : "Error al crear rol");
      }
    } else if (panel === "edit" && selectedId) {
      const ok = updateRoleData(selectedId, { code: editCode, name: editName, description: editDesc });
      if (!ok) { setCodeError(`Código ${editCode.toUpperCase()} ya existe`); return; }
      setPanel("view");
    }
  }

  function toggleCapability(capId: string) {
    if (!selected) return;
    const current = new Set(selected.capacidades);
    if (current.has(capId)) { current.delete(capId); } else { current.add(capId); }
    updateRoleCapabilities(selected.id, [...current]);
  }

  const showView = panel === "view" && selected !== null;
  const showForm = panel === "new" || panel === "edit";

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[#697387]/40 bg-[#FDFCF9]">

      <div className="shrink-0 flex h-[42px] items-center gap-2 border-b border-[#697387]/15 bg-[#F3F4F6] px-4">
        <Sliders size={13} strokeWidth={2} className="shrink-0 text-[#697387]" />
        <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">ROL OPERACIONAL</span>
        {selected && (
          <>
            <span className="text-[#697387]/30 mx-0.5">·</span>
            <span className="rounded bg-[#697387] px-1.5 py-0.5 text-[9px] font-bold text-white">{selected.codigo}</span>
          </>
        )}
      </div>

      {/* ActionBar */}
      <div className="shrink-0 flex items-center gap-1.5 border-b border-[#697387]/10 px-4 py-2">
        <button onClick={handleNew}
          className="flex items-center gap-1 rounded-lg bg-[#45b356] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-[#35994a] active:scale-[0.97]">
          <Plus size={10} strokeWidth={2.5} />NUEVO
        </button>
        <button onClick={handleStartEdit} disabled={!selected}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
            selected ? "bg-[#005BE3] text-white hover:bg-[#0049c4] active:scale-[0.97]"
                     : "cursor-not-allowed bg-[#005BE3]/15 text-[#005BE3]/50"
          }`}>
          <Pencil size={10} strokeWidth={2.5} />EDITAR
        </button>
        {selected?.activo ? (
          <button onClick={() => { setPanel("view"); setRoleActive(selected.id, false); }}
            disabled={operatorsWithRole.length > 0}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
              operatorsWithRole.length === 0
                ? "bg-amber-500 text-white hover:bg-amber-600 active:scale-[0.97]"
                : "cursor-not-allowed bg-amber-500/15 text-amber-500/50"
            }`}>
            <Ban size={10} strokeWidth={2.5} />DESACTIVAR
          </button>
        ) : selected ? (
          <button onClick={() => setRoleActive(selected.id, true)}
            className="flex items-center gap-1 rounded-lg bg-[#45b356] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-[#35994a] active:scale-[0.97]">
            <ToggleRight size={10} strokeWidth={2.5} />ACTIVAR
          </button>
        ) : null}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-3 pb-4">

        {/* VIEW MODE */}
        {showView && selected && (
          <div className="flex flex-col gap-4">

            {/* identificación */}
            <div className="flex items-center gap-2.5">
              <span className="rounded-md bg-[#697387] px-2 py-0.5 text-[11px] font-bold tracking-wider text-white">{selected.codigo}</span>
              <span className="text-[13px] font-semibold text-[#2F3E46]">{selected.nombre}</span>
              {!selected.activo && (
                <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-600">INACTIVO</span>
              )}
            </div>

            {selected.descripcion && (
              <p className="text-[11.5px] text-[#6b7280]">{selected.descripcion}</p>
            )}

            {operatorsWithRole.length > 0 && selected.activo && (
              <div className="flex items-start gap-2 rounded-xl border border-amber-200/60 bg-amber-50/40 px-3 py-2">
                <AlertCircle size={10} strokeWidth={2} className="mt-0.5 shrink-0 text-amber-500" />
                <p className="text-[9.5px] font-semibold text-amber-700">
                  {operatorsWithRole.length} operador{operatorsWithRole.length > 1 ? "es" : ""} activo{operatorsWithRole.length > 1 ? "s" : ""} con este rol · no se puede desactivar
                </p>
              </div>
            )}

            {/* capacidades del rol */}
            <div className="flex flex-col gap-1.5">
              <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">Capacidades operacionales de este rol</p>
              {CAPABILITIES.map(cap => {
                const isOn = selected.capacidades.includes(cap.id);
                const lCfg = LEVEL_CFG[cap.level];
                return (
                  <button
                    key={cap.id}
                    onClick={() => toggleCapability(cap.id)}
                    className={`flex items-center gap-2.5 rounded-xl border px-3 py-2 text-left transition active:scale-[0.99] ${
                      isOn
                        ? "border-[#697387]/20 bg-[#697387]/5"
                        : "border-[#E9E4DC] bg-white hover:border-[#697387]/20 hover:bg-[#697387]/3"
                    }`}
                  >
                    <div className={`shrink-0 flex h-4.5 w-8 items-center rounded-full transition-colors ${
                      isOn ? "bg-[#697387]" : "bg-[#e4e9f0]"
                    }`}>
                      <div className={`h-3 w-3 rounded-full bg-white shadow-sm transition-transform ${
                        isOn ? "translate-x-[17px]" : "translate-x-[2px]"
                      }`} />
                    </div>
                    <span className={`flex-1 text-[11.5px] font-semibold ${isOn ? "text-[#2F3E46]" : "text-[#9ca3af]"}`}>
                      {cap.label}
                    </span>
                    <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide ${lCfg.bg} ${lCfg.text}`}>
                      {cap.level}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* operadores con este rol */}
            {operatorsWithRole.length > 0 && (
              <div className="flex flex-col gap-1.5 border-t border-[#f0f4f8] pt-3">
                <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">Operadores con este rol</p>
                <div className="flex flex-wrap gap-1">
                  {operatorsWithRole.map(op => (
                    <span key={op.id} className="rounded-md bg-[#F3F4F6] px-2 py-0.5 text-[9px] font-bold text-[#697387]">
                      {op.codigo} {op.nombreCompleto}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* FORM */}
        {showForm && (
          <div className="flex flex-col gap-3">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-[#9ca3af]">
              {panel === "new" ? "NUEVO ROL OPERACIONAL" : "EDITAR ROL"}
            </span>
            {codeError && (
              <p className="rounded-xl bg-red-50 px-3 py-2 text-[10px] font-semibold text-red-600">{codeError}</p>
            )}
            <div className="flex gap-2">
              <div className="flex w-20 flex-col gap-0.5">
                <span className="text-[9px] font-semibold uppercase tracking-widest text-[#9ca3af]">Código</span>
                <input autoFocus={panel === "new"} type="text" value={editCode} maxLength={5} placeholder="VEN"
                  onChange={e => { setEditCode(e.target.value.toUpperCase().slice(0, 5)); setCodeError(null); }}
                  onKeyDown={e => { if (e.key === "Enter" && canSave) handleSave(); if (e.key === "Escape") setPanel("view"); }}
                  className="rounded-xl border border-[#e4e9f0] bg-white px-2.5 py-1.5 text-[12px] font-bold uppercase text-[#2F3E46] outline-none focus:border-[#697387] focus:ring-1 focus:ring-[#697387]/10 placeholder:text-[#d1d9e1]"
                />
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-[9px] font-semibold uppercase tracking-widest text-[#9ca3af]">Nombre operacional</span>
                <input autoFocus={panel === "edit"} type="text" value={editName} placeholder="Cajero"
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && canSave) handleSave(); if (e.key === "Escape") setPanel("view"); }}
                  className="rounded-xl border border-[#e4e9f0] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#2F3E46] outline-none focus:border-[#697387] focus:ring-1 focus:ring-[#697387]/10 placeholder:text-[#d1d9e1]"
                />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-[#9ca3af]">Descripción</span>
              <input type="text" value={editDesc} placeholder="Contexto operacional del rol..."
                onChange={e => setEditDesc(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && canSave) handleSave(); if (e.key === "Escape") setPanel("view"); }}
                className="rounded-xl border border-[#e4e9f0] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#374151] outline-none focus:border-[#697387] focus:ring-1 focus:ring-[#697387]/10 placeholder:text-[#d1d9e1]"
              />
            </div>
            <p className="text-[9.5px] text-[#b0bac8]">
              Las capacidades se configuran después de crear el rol.
            </p>
            <div className="flex gap-2 pt-1">
              <button onClick={() => { setPanel("view"); setCodeError(null); }}
                className="flex h-8 flex-1 items-center justify-center rounded-lg border border-[#e4e9f0] bg-white text-[10px] font-semibold uppercase text-[#6b7280] transition hover:border-[#b0bac8]">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={!canSave}
                className={`flex h-8 flex-1 items-center justify-center rounded-lg text-[10px] font-bold uppercase text-white transition ${
                  canSave ? "bg-[#45b356] hover:bg-[#35994a]" : "cursor-not-allowed bg-[#45b356]/15 text-[#45b356]/50"
                }`}>
                {panel === "new" ? "Crear rol" : "Guardar"}
              </button>
            </div>
          </div>
        )}

        {!showView && !showForm && (
          <div className="flex flex-col items-center justify-center gap-1.5 py-14 text-center">
            <Sliders size={22} strokeWidth={1.5} className="text-[#d1d9e1]" />
            <p className="text-[10px] font-semibold text-[#c0cad4]">Seleccione un rol</p>
            <p className="text-[9.5px] text-[#d1d9e1]">o cree uno nuevo</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════
// ROLES OPERACIONALES WORKSPACE
// ════════════════════════════════════════════════════════════════════════

export function RolesOperacionalesWorkspace() {
  const [selectedId, setSelectedId] = useState<string | null>("role-ven");

  return (
    <section className="flex min-h-0 flex-1 gap-2">
      <PanelRoles  selectedId={selectedId} onSelect={setSelectedId} />
      <PanelDetalle selectedId={selectedId} onSelect={setSelectedId} />
    </section>
  );
}
