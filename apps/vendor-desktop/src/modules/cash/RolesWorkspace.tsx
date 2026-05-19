import { useState } from "react";
import { Plus, Pencil, Trash2, Shield, ChevronRight } from "lucide-react";

type Role = {
  id: string;
  code: string;
  name: string;
  description: string;
  permsCount: number;
  active: boolean;
};

const MOCK_ROLES: Role[] = [
  { id: "1", code: "VEN", name: "Vendedor",       description: "Ventas y cobros en caja",     permsCount: 4,  active: true  },
  { id: "2", code: "ADM", name: "Administrador",  description: "Acceso completo al sistema",  permsCount: 32, active: true  },
  { id: "3", code: "GST", name: "Gestor",         description: "Inventario y reportes",       permsCount: 12, active: true  },
  { id: "4", code: "CNT", name: "Contador",       description: "Arqueos y comprobantes",      permsCount: 8,  active: true  },
  { id: "5", code: "SPT", name: "Soporte",        description: "Configuración y sistema",     permsCount: 6,  active: false },
];

export function RolesWorkspace() {
  const [roles,      setRoles]      = useState<Role[]>(MOCK_ROLES);
  const [selectedId, setSelectedId] = useState<string | null>("1");
  const [isNew,      setIsNew]      = useState(false);
  const [isEditing,  setIsEditing]  = useState(false);
  const [editCode,   setEditCode]   = useState("");
  const [editName,   setEditName]   = useState("");
  const [editDesc,   setEditDesc]   = useState("");

  const selected     = roles.find(r => r.id === selectedId) ?? null;
  const canSave      = editCode.trim().length >= 2 && editName.trim().length >= 2;
  const canActOnSel  = selected !== null && !isNew;

  function handleSelect(role: Role) {
    setSelectedId(role.id);
    setIsNew(false);
    setIsEditing(false);
  }

  function handleNew() {
    setSelectedId(null);
    setIsNew(true);
    setIsEditing(false);
    setEditCode("");
    setEditName("");
    setEditDesc("");
  }

  function handleStartEdit() {
    if (!selected) return;
    setEditCode(selected.code);
    setEditName(selected.name);
    setEditDesc(selected.description);
    setIsEditing(true);
  }

  function handleSave() {
    if (!canSave) return;
    if (isNew) {
      const next: Role = {
        id: String(Date.now()),
        code: editCode.trim().toUpperCase(),
        name: editName.trim(),
        description: editDesc.trim(),
        permsCount: 0,
        active: true,
      };
      setRoles(prev => [...prev, next]);
      setSelectedId(next.id);
      setIsNew(false);
      setIsEditing(false);
    } else if (selectedId) {
      setRoles(prev => prev.map(r =>
        r.id === selectedId
          ? { ...r, code: editCode.trim().toUpperCase(), name: editName.trim(), description: editDesc.trim() }
          : r
      ));
      setIsEditing(false);
    }
  }

  function handleCancel() {
    setIsNew(false);
    setIsEditing(false);
  }

  function handleDelete() {
    if (!selected) return;
    const id = selected.id;
    const remaining = roles.filter(r => r.id !== id);
    setRoles(remaining);
    setIsEditing(false);
    setIsNew(false);
    if (remaining.length > 0) {
      setSelectedId(remaining[0].id);
    } else {
      setSelectedId(null);
    }
  }

  // Panel render mode
  const showViewMode  = selected !== null && !isNew && !isEditing;
  const showEditForm  = (selected !== null && isEditing) || isNew;

  return (
    <section className="flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-[#78C487]/40 bg-[#FDFCF9]">

      {/* SheetHeader */}
      <header className="shrink-0 flex items-center justify-between border-b border-[#78C487]/15 bg-[#F5FBF5] px-4 py-2.5">

        {/* LEFT — título + conteo */}
        <div className="flex items-center gap-2">
          <Shield size={13} strokeWidth={2} className="text-[#78C487]" />
          <span className="text-[14px] font-semibold uppercase tracking-tight text-[#121416] leading-none">
            ROLES
          </span>
          <span className="ml-1 rounded-md bg-[#e8f5ea] px-2 py-0.5 text-[10px] font-bold tabular-nums text-[#4a7a55]">
            {roles.length}
          </span>
        </div>

        {/* RIGHT — toolbar operacional */}
        <div className="flex items-center gap-1.5">

          {/* NUEVO ROL */}
          <button
            onClick={handleNew}
            title="Tecla [CTRL + N]"
            className="flex items-center gap-1.5 rounded-lg bg-[#78C487] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white transition hover:bg-[#5aad74] active:scale-[0.97]"
          >
            <Plus size={12} strokeWidth={2.5} />
            NUEVO ROL
          </button>

          {/* EDITAR ROL */}
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
            EDITAR ROL
          </button>

          {/* ELIMINAR ROL */}
          <button
            onClick={handleDelete}
            disabled={!canActOnSel}
            title="Tecla [CTRL + DEL]"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition ${
              canActOnSel
                ? "bg-[#b84242] text-white hover:bg-[#a03636] active:scale-[0.97]"
                : "cursor-not-allowed bg-[#b84242]/[0.15] text-[#b84242]/50"
            }`}
          >
            <Trash2 size={12} strokeWidth={2.5} />
            ELIMINAR ROL
          </button>

        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1">

        {/* List */}
        <div className="w-[44%] shrink-0 overflow-y-auto border-r border-[#78C487]/10">
          {roles.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-1 py-10 text-center">
              <p className="text-[12px] font-semibold text-[#c0cad4]">Sin roles</p>
            </div>
          ) : (
            roles.map(role => {
              const isSel = role.id === selectedId && !isNew;
              return (
                <div
                  key={role.id}
                  onClick={() => handleSelect(role)}
                  className={`flex cursor-pointer items-center gap-3 border-l-2 px-4 py-2.5 transition ${
                    isSel
                      ? "border-[#78C487] bg-[#EFF8F0]"
                      : "border-transparent hover:bg-[#F5FBF5]"
                  }`}
                >
                  <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider ${
                    isSel ? "bg-[#78C487] text-white" : "bg-[#e8f5ea] text-[#4a7a55]"
                  }`}>
                    {role.code}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[12px] font-semibold ${isSel ? "text-[#2d6640]" : "text-[#2F3E46]"}`}>
                      {role.name}
                    </p>
                    <p className="truncate text-[10px] font-semibold text-[#9ca3af]">
                      {role.description}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-[10px] font-semibold tabular-nums text-[#b0bac8]">
                      {role.permsCount} perms
                    </span>
                    {!role.active && (
                      <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red-400">
                        INACTIVO
                      </span>
                    )}
                    <ChevronRight size={12} className={isSel ? "text-[#78C487]" : "text-[#d1d9e1]"} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Detail panel */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">

          {/* ── VIEW MODE — rol seleccionado, sin edición activa ── */}
          {showViewMode && selected && (
            <div className="flex flex-col gap-4">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">
                ROL SELECCIONADO
              </span>

              <div className="flex items-center gap-3">
                <span className="rounded-md bg-[#78C487] px-2.5 py-1 text-[11px] font-bold tracking-wider text-white">
                  {selected.code}
                </span>
                <span className="text-[14px] font-semibold text-[#2F3E46]">{selected.name}</span>
                {!selected.active && (
                  <span className="rounded-md bg-red-50 px-2 py-0.5 text-[9px] font-bold uppercase text-red-400">
                    INACTIVO
                  </span>
                )}
              </div>

              {selected.description && (
                <p className="text-[12px] font-semibold text-[#6b7280]">{selected.description}</p>
              )}

              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">Permisos</span>
                <div className="rounded-xl border border-dashed border-[#e4e9f0] bg-[#fafbfc] px-4 py-4 text-center">
                  <p className="text-[11px] font-semibold text-[#c0cad4]">Gestión de permisos próximamente</p>
                </div>
              </div>
            </div>
          )}

          {/* ── EDIT / NEW FORM ── */}
          {showEditForm && (
            <div className="flex flex-col gap-4">

              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">
                {isNew ? "NUEVO ROL" : "EDITAR ROL"}
              </span>

              {/* Code + Name */}
              <div className="flex gap-3">
                <div className="flex w-24 flex-col gap-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">Código</span>
                  <input
                    type="text"
                    value={editCode}
                    onChange={e => setEditCode(e.target.value.toUpperCase().slice(0, 5))}
                    onKeyDown={e => {
                      if (e.key === "Enter" && canSave) handleSave();
                      if (e.key === "Escape") handleCancel();
                    }}
                    maxLength={5}
                    placeholder="VEN"
                    className="rounded-xl border border-[#e4e9f0] bg-white px-3 py-2 text-[13px] font-bold uppercase text-[#2F3E46] outline-none transition focus:border-[#78C487] focus:ring-1 focus:ring-[#78C487]/20 placeholder:text-[#d1d9e1]"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">Nombre</span>
                  <input
                    autoFocus
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === "Enter" && canSave) handleSave();
                      if (e.key === "Escape") handleCancel();
                    }}
                    placeholder="Vendedor"
                    className="rounded-xl border border-[#e4e9f0] bg-white px-3 py-2 text-[13px] font-semibold text-[#2F3E46] outline-none transition focus:border-[#78C487] focus:ring-1 focus:ring-[#78C487]/20 placeholder:text-[#d1d9e1]"
                  />
                </div>
              </div>

              {/* Description */}
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">Descripción</span>
                <input
                  type="text"
                  value={editDesc}
                  onChange={e => setEditDesc(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter" && canSave) handleSave();
                    if (e.key === "Escape") handleCancel();
                  }}
                  placeholder="Descripción del rol..."
                  className="rounded-xl border border-[#e4e9f0] bg-white px-3 py-2 text-[12px] font-semibold text-[#374151] outline-none transition focus:border-[#78C487] focus:ring-1 focus:ring-[#78C487]/20 placeholder:text-[#d1d9e1]"
                />
              </div>

              {/* Perms placeholder */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">Permisos</span>
                <div className="rounded-xl border border-dashed border-[#e4e9f0] bg-[#fafbfc] px-4 py-4 text-center">
                  <p className="text-[11px] font-semibold text-[#c0cad4]">Gestión de permisos próximamente</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleCancel}
                  title="Tecla [ESC]"
                  className="flex h-10 flex-1 items-center justify-center rounded-md border border-[#e4e9f0] bg-white text-[13px] font-semibold uppercase tracking-wider text-[#6b7280] transition hover:border-[#b0bac8] hover:text-[#374151]"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={!canSave}
                  title="Tecla [ENTER]"
                  className={`flex h-10 flex-1 items-center justify-center rounded-md text-[13px] font-semibold uppercase tracking-wider text-white transition ${
                    canSave
                      ? "bg-emerald-700 hover:bg-emerald-800 active:scale-[0.98]"
                      : "cursor-not-allowed bg-emerald-700/40"
                  }`}
                >
                  {isNew ? "Crear rol" : "Guardar"}
                </button>
              </div>

            </div>
          )}

          {/* ── EMPTY STATE ── */}
          {!showViewMode && !showEditForm && (
            <div className="flex flex-col items-center justify-center gap-1.5 py-12 text-center">
              <Shield size={24} strokeWidth={1.5} className="text-[#d1d9e1]" />
              <p className="text-[12px] font-semibold text-[#c0cad4]">Seleccione un rol</p>
              <p className="text-[11px] font-semibold text-[#d1d9e1]">o cree uno nuevo</p>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
