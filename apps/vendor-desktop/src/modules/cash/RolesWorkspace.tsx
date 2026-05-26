import { useState } from "react";
import { Plus, Pencil, Trash2, Ban, ToggleRight, Shield, SlidersHorizontal, ChevronRight } from "lucide-react";

type Role = {
  id: string;
  code: string;
  name: string;
  description: string;
  permsCount: number;
  active: boolean;
  hasOperationalHistory: boolean;
  createdAt: Date;
  createdBy: string;
};

function formatCreatedAt(d: Date): string {
  const dd  = String(d.getDate()).padStart(2, "0");
  const mm  = String(d.getMonth() + 1).padStart(2, "0");
  const hh  = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()} · ${hh}:${min}`;
}

const MOCK_ROLES: Role[] = [
  { id: "1", code: "VEN", name: "Vendedor",       description: "Ventas y cobros en caja",     permsCount: 4,  active: true,  hasOperationalHistory: true,  createdAt: new Date("2024-01-15T09:00:00"), createdBy: "FERNANDO" },
  { id: "2", code: "ADM", name: "Administrador",  description: "Acceso completo al sistema",  permsCount: 32, active: true,  hasOperationalHistory: true,  createdAt: new Date("2024-01-10T08:30:00"), createdBy: "FERNANDO" },
  { id: "3", code: "GST", name: "Gestor",         description: "Inventario y reportes",       permsCount: 12, active: true,  hasOperationalHistory: false, createdAt: new Date("2025-03-08T14:20:00"), createdBy: "CARLOS"   },
  { id: "4", code: "CNT", name: "Contador",       description: "Arqueos y comprobantes",      permsCount: 8,  active: true,  hasOperationalHistory: false, createdAt: new Date("2025-11-22T10:05:00"), createdBy: "FERNANDO" },
  { id: "5", code: "SPT", name: "Soporte",        description: "Configuración y sistema",     permsCount: 6,  active: false, hasOperationalHistory: false, createdAt: new Date("2026-04-03T16:45:00"), createdBy: "ADMIN"    },
];

type ThirdAction = "delete" | "deactivate" | "activate";

// ── Panel izquierdo: selector de roles ────────────────────────────────────────

function PanelRoles({ roles, selectedId, onSelect }: {
  roles: Role[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const activos   = roles.filter(r => r.active).length;
  const inactivos = roles.filter(r => !r.active).length;

  return (
    <div className="flex w-[260px] shrink-0 flex-col overflow-hidden rounded-[28px] border border-[#2A7CA8]/40 bg-[#FDFCF9]">

      {/* SheetHeader — línea única fija */}
      <div className="shrink-0 flex h-[42px] items-center gap-2 border-b border-[#2A7CA8]/15 bg-[#F2F7FA] px-4">
        <Shield size={13} strokeWidth={2} className="shrink-0 text-[#1a5f7a]" />
        <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">ROLES</span>
        <span className="rounded-md bg-[#2A7CA8]/20 px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-[#1a5f7a]">{roles.length}</span>
        <div className="ml-auto flex items-center gap-1.5">
          {inactivos > 0 && (
            <span className="text-[9px] font-semibold text-amber-500">{inactivos} inact.</span>
          )}
          {activos > 0 && (
            <span className="text-[9px] font-semibold text-[#9ca3af]">{activos} activos</span>
          )}
        </div>
      </div>

      {/* SheetBody — lista seleccionable */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {roles.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16">
            <Shield size={24} strokeWidth={1.5} className="text-[#d1d9e1]" />
            <p className="text-[11px] font-semibold text-[#c0cad4]">Sin roles</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-[#f0f4f8]">
            {roles.map(role => {
              const isSel = role.id === selectedId;
              return (
                <div key={role.id} onClick={() => onSelect(role.id)}
                  className={`flex cursor-pointer items-center gap-2.5 border-l-2 px-3.5 py-2.5 transition ${
                    isSel ? "border-[#2A7CA8] bg-[#EBF4FA]" : "border-transparent hover:bg-[#F2F7FA]"
                  }`}>
                  <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold tracking-wider ${
                    isSel ? "bg-[#2A7CA8] text-white" : "bg-[#EBF4FA] text-[#1a5f7a]"
                  }`}>
                    {role.code}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[12px] font-semibold ${isSel ? "text-[#2d6640]" : role.active ? "text-[#2F3E46]" : "text-[#9ca3af]"}`}>
                      {role.name}
                    </p>
                    <p className="truncate text-[9px] text-[#b0bac8]">{role.description}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {!role.active && (
                      <span className="rounded bg-amber-50 px-1 py-0.5 text-[8px] font-bold uppercase text-amber-600">INACT.</span>
                    )}
                    <ChevronRight size={10} className={isSel ? "text-[#2A7CA8]" : "text-[#e4e9f0]"} />
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

// ── Panel central: gestión de rol seleccionado ────────────────────────────────

function PanelGestionRoles({ roles, setRoles, selectedId, onSelect }: {
  roles: Role[];
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const [isNew,      setIsNew]      = useState(false);
  const [isEditing,  setIsEditing]  = useState(false);
  const [editCode,   setEditCode]   = useState("");
  const [editName,   setEditName]   = useState("");
  const [editDesc,   setEditDesc]   = useState("");

  const selected    = roles.find(r => r.id === selectedId) ?? null;
  const canSave     = editCode.trim().length >= 2 && editName.trim().length >= 2;
  const canActOnSel = selected !== null && !isNew;

  const thirdAction: ThirdAction | null = !canActOnSel ? null
    : !selected!.hasOperationalHistory ? "delete"
    : selected!.active                 ? "deactivate"
    :                                    "activate";

  function handleNew() {
    onSelect(null); setIsNew(true); setIsEditing(false);
    setEditCode(""); setEditName(""); setEditDesc("");
  }

  function handleStartEdit() {
    if (!selected) return;
    setEditCode(selected.code); setEditName(selected.name);
    setEditDesc(selected.description); setIsEditing(true);
  }

  function handleSave() {
    if (!canSave) return;
    if (isNew) {
      const next: Role = {
        id: String(Date.now()), code: editCode.trim().toUpperCase(),
        name: editName.trim(), description: editDesc.trim(),
        permsCount: 0, active: true, hasOperationalHistory: false,
        createdAt: new Date(), createdBy: "OPERADOR",
      };
      setRoles(prev => [...prev, next]);
      onSelect(next.id); setIsNew(false); setIsEditing(false);
    } else if (selectedId) {
      setRoles(prev => prev.map(r =>
        r.id === selectedId
          ? { ...r, code: editCode.trim().toUpperCase(), name: editName.trim(), description: editDesc.trim() }
          : r
      ));
      setIsEditing(false);
    }
  }

  function handleCancel() { setIsNew(false); setIsEditing(false); }

  function handleDelete() {
    if (!selected || selected.hasOperationalHistory) return;
    const remaining = roles.filter(r => r.id !== selected.id);
    setRoles(remaining);
    setIsEditing(false); setIsNew(false);
    onSelect(remaining.length > 0 ? remaining[0].id : null);
  }

  function handleDeactivate() {
    if (!selected || !selected.active) return;
    setRoles(prev => prev.map(r => r.id === selected.id ? { ...r, active: false } : r));
    setIsEditing(false);
  }

  function handleActivate() {
    if (!selected || selected.active) return;
    setRoles(prev => prev.map(r => r.id === selected.id ? { ...r, active: true } : r));
  }

  const showViewMode = selected !== null && !isNew && !isEditing;
  const showEditForm = (selected !== null && isEditing) || isNew;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[#2A7CA8]/40 bg-[#FDFCF9]">

      {/* SheetHeader — línea única fija */}
      <div className="shrink-0 flex h-[42px] items-center gap-2 border-b border-[#2A7CA8]/15 bg-[#F2F7FA] px-4">
        <SlidersHorizontal size={13} strokeWidth={2} className="shrink-0 text-[#1a5f7a]" />
        <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">GESTIÓN DE ROLES</span>
      </div>

      {/* ActionBar */}
      <div className="shrink-0 flex items-center gap-1.5 border-b border-[#2A7CA8]/10 px-4 py-2">
        <button onClick={handleNew}
          className="flex items-center gap-1 rounded-lg bg-[#45b356] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-[#35994a] active:scale-[0.97]">
          <Plus size={10} strokeWidth={2.5} />NUEVO
        </button>
        <button onClick={handleStartEdit} disabled={!canActOnSel}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
            canActOnSel ? "bg-[#005BE3] text-white hover:bg-[#0049c4] active:scale-[0.97]"
                        : "cursor-not-allowed bg-[#005BE3]/15 text-[#005BE3]/50"
          }`}>
          <Pencil size={10} strokeWidth={2.5} />EDITAR
        </button>
        {thirdAction === "delete" && (
          <button onClick={handleDelete}
            className="flex items-center gap-1 rounded-lg bg-[#dc2626] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-[#b91c1c] active:scale-[0.97]">
            <Trash2 size={10} strokeWidth={2.5} />ELIMINAR
          </button>
        )}
        {thirdAction === "deactivate" && (
          <button onClick={handleDeactivate}
            className="flex items-center gap-1 rounded-lg bg-[#d97706] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-[#b45309] active:scale-[0.97]">
            <Ban size={10} strokeWidth={2.5} />DESACTIVAR
          </button>
        )}
        {thirdAction === "activate" && (
          <button onClick={handleActivate}
            className="flex items-center gap-1 rounded-lg bg-[#45b356] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-[#35994a] active:scale-[0.97]">
            <ToggleRight size={10} strokeWidth={2.5} />ACTIVAR
          </button>
        )}
        {thirdAction === null && (
          <button disabled
            className="flex cursor-not-allowed items-center gap-1 rounded-lg bg-[#dc2626]/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#dc2626]/50">
            <Trash2 size={10} strokeWidth={2.5} />ELIMINAR
          </button>
        )}
      </div>

      {/* SheetBody */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-3 pb-3">

        {/* VIEW MODE */}
        {showViewMode && selected && (
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">ROL SELECCIONADO</span>

            <div className="flex items-center gap-2.5">
              <span className="rounded-md bg-[#2A7CA8] px-2.5 py-1 text-[11px] font-bold tracking-wider text-white">
                {selected.code}
              </span>
              <span className="text-[14px] font-semibold text-[#2F3E46]">{selected.name}</span>
              {!selected.active && (
                <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-600">INACTIVO</span>
              )}
            </div>

            {selected.description && (
              <p className="text-[12px] font-semibold text-[#6b7280]">{selected.description}</p>
            )}

            <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${
              selected.hasOperationalHistory ? "border-[#c7d2e8] bg-[#f0f3fa]" : "border-[#e4e9f0] bg-[#fafbfc]"
            }`}>
              <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                selected.hasOperationalHistory ? "bg-[#5b6fa8]" : "bg-[#d1d9e1]"
              }`} />
              <span className={`text-[10px] font-semibold uppercase tracking-widest ${
                selected.hasOperationalHistory ? "text-[#5b6fa8]" : "text-[#b0bac8]"
              }`}>
                {selected.hasOperationalHistory
                  ? "Tiene historial de uso · solo desactivar"
                  : "Sin historial · puede eliminarse"}
              </span>
            </div>

            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">Permisos</span>
              <div className="rounded-xl border border-dashed border-[#e4e9f0] bg-[#fafbfc] px-4 py-4 text-center">
                <p className="text-[11px] font-semibold text-[#c0cad4]">Gestión de permisos próximamente</p>
              </div>
            </div>

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

        {/* EDIT / NEW FORM */}
        {showEditForm && (
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">
              {isNew ? "NUEVO ROL" : "EDITAR ROL"}
            </span>
            <div className="flex gap-3">
              <div className="flex w-24 flex-col gap-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">Código</span>
                <input type="text" value={editCode}
                  onChange={e => setEditCode(e.target.value.toUpperCase().slice(0, 5))}
                  onKeyDown={e => { if (e.key === "Enter" && canSave) handleSave(); if (e.key === "Escape") handleCancel(); }}
                  maxLength={5} placeholder="VEN"
                  className="rounded-xl border border-[#e4e9f0] bg-white px-3 py-2 text-[13px] font-bold uppercase text-[#2F3E46] outline-none transition focus:border-[#2154d8] focus:ring-1 focus:ring-[#2154d8]/10 placeholder:text-[#d1d9e1]"
                />
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">Nombre</span>
                <input autoFocus type="text" value={editName}
                  onChange={e => setEditName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && canSave) handleSave(); if (e.key === "Escape") handleCancel(); }}
                  placeholder="Vendedor"
                  className="rounded-xl border border-[#e4e9f0] bg-white px-3 py-2 text-[13px] font-semibold text-[#2F3E46] outline-none transition focus:border-[#2154d8] focus:ring-1 focus:ring-[#2154d8]/10 placeholder:text-[#d1d9e1]"
                />
              </div>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">Descripción</span>
              <input type="text" value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && canSave) handleSave(); if (e.key === "Escape") handleCancel(); }}
                placeholder="Descripción del rol..."
                className="rounded-xl border border-[#e4e9f0] bg-white px-3 py-2 text-[12px] font-semibold text-[#374151] outline-none transition focus:border-[#2154d8] focus:ring-1 focus:ring-[#2154d8]/10 placeholder:text-[#d1d9e1]"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">Permisos</span>
              <div className="rounded-xl border border-dashed border-[#e4e9f0] bg-[#fafbfc] px-4 py-4 text-center">
                <p className="text-[11px] font-semibold text-[#c0cad4]">Gestión de permisos próximamente</p>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={handleCancel}
                className="flex h-10 flex-1 items-center justify-center rounded-md border border-[#e4e9f0] bg-white text-[13px] font-semibold uppercase tracking-wider text-[#6b7280] transition hover:border-[#b0bac8]">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={!canSave}
                className={`flex h-10 flex-1 items-center justify-center rounded-md text-[13px] font-semibold uppercase tracking-wider text-white transition ${
                  canSave ? "bg-[#45b356] hover:bg-[#35994a] active:scale-[0.98]" : "cursor-not-allowed bg-[#45b356]/[0.15] text-[#45b356]/50"
                }`}>
                {isNew ? "Crear rol" : "Guardar"}
              </button>
            </div>
          </div>
        )}

        {!showViewMode && !showEditForm && (
          <div className="flex flex-col items-center justify-center gap-1.5 py-12 text-center">
            <Shield size={24} strokeWidth={1.5} className="text-[#d1d9e1]" />
            <p className="text-[12px] font-semibold text-[#c0cad4]">Seleccione un rol</p>
            <p className="text-[11px] font-semibold text-[#d1d9e1]">o cree uno nuevo</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Root ──────────────────────────────────────────────────────────────────────

export function RolesWorkspace() {
  const [roles,      setRoles]      = useState<Role[]>(MOCK_ROLES);
  const [selectedId, setSelectedId] = useState<string | null>("1");

  return (
    <section className="flex min-h-0 flex-1 gap-2">
      <PanelRoles
        roles={roles}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <PanelGestionRoles
        roles={roles}
        setRoles={setRoles}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
    </section>
  );
}
