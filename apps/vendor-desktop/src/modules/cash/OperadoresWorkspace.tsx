import { useState } from "react";
import { Plus, Pencil, Trash2, Ban, ToggleRight, Users, ChevronRight, KeyRound } from "lucide-react";

// ── tipos ──────────────────────────────────────────────────────────────────

type Operator = {
  id: string;
  code: string;
  name: string;
  roleCode: string;
  blockBase: number | null;
  active: boolean;
  pinConfigured: boolean;
  hasOperationalHistory: boolean;
  createdAt: Date;
  createdBy: string;
};

type ThirdAction = "delete" | "deactivate" | "activate";

// ── referencias cruzadas (mock — luego vendrán del store) ──────────────────

const ROLES_REF = [
  { code: "VEN", name: "Vendedor"      },
  { code: "ADM", name: "Administrador" },
  { code: "GST", name: "Gestor"        },
  { code: "CNT", name: "Contador"      },
  { code: "SPT", name: "Soporte"       },
];

const BLOCKS_REF = [100, 200, 300, 400, 500];

// ── mock ───────────────────────────────────────────────────────────────────
// Alineado con CajasWorkspace: FERNANDO→100, CARLOS→200, LUCÍA→300

const MOCK_OPERATORS: Operator[] = [
  { id: "1", code: "FER", name: "FERNANDO", roleCode: "VEN", blockBase: 100,  active: true,  pinConfigured: true,  hasOperationalHistory: true,  createdAt: new Date("2024-01-10T08:00:00"), createdBy: "ADMIN"    },
  { id: "2", code: "CAR", name: "CARLOS",   roleCode: "VEN", blockBase: 200,  active: true,  pinConfigured: true,  hasOperationalHistory: true,  createdAt: new Date("2024-03-15T09:30:00"), createdBy: "FERNANDO" },
  { id: "3", code: "LUC", name: "LUCÍA",    roleCode: "VEN", blockBase: 300,  active: false, pinConfigured: false, hasOperationalHistory: true,  createdAt: new Date("2023-11-02T10:00:00"), createdBy: "ADMIN"    },
  { id: "4", code: "ADM", name: "ADMIN",    roleCode: "ADM", blockBase: null, active: true,  pinConfigured: true,  hasOperationalHistory: false, createdAt: new Date("2023-10-01T00:00:00"), createdBy: "SISTEMA"  },
];

// ── helpers ────────────────────────────────────────────────────────────────

function formatCreatedAt(d: Date): string {
  const dd  = String(d.getDate()).padStart(2, "0");
  const mm  = String(d.getMonth() + 1).padStart(2, "0");
  const hh  = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()} · ${hh}:${min}`;
}

// ── sub-componente: formulario PIN inline ──────────────────────────────────

function PinForm({ pin, confirm, error, onPin, onConfirm, onSave, onCancel }: {
  pin: string; confirm: string; error: string;
  onPin: (v: string) => void;
  onConfirm: (v: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  const ready = pin.length >= 4 && pin === confirm;
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[#005BE3]/20 bg-[#f4f8ff] px-3.5 py-3">
      <div className="flex items-center gap-1.5">
        <KeyRound size={11} strokeWidth={2} className="text-[#005BE3]" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#005BE3]">CONFIGURAR PIN</span>
      </div>
      <div className="flex gap-2">
        <input
          autoFocus
          type="password"
          value={pin}
          inputMode="numeric"
          onChange={e => onPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          onKeyDown={e => { if (e.key === "Enter" && ready) onSave(); if (e.key === "Escape") onCancel(); }}
          placeholder="PIN"
          maxLength={6}
          className="w-24 rounded-xl border border-[#e4e9f0] bg-white px-3 py-2 text-[15px] font-bold tracking-[0.35em] text-[#2F3E46] outline-none focus:border-[#005BE3] focus:ring-1 focus:ring-[#005BE3]/20 placeholder:tracking-normal placeholder:font-normal placeholder:text-[#d1d9e1]"
        />
        <input
          type="password"
          value={confirm}
          inputMode="numeric"
          onChange={e => onConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))}
          onKeyDown={e => { if (e.key === "Enter" && ready) onSave(); if (e.key === "Escape") onCancel(); }}
          placeholder="Confirmar"
          maxLength={6}
          className="flex-1 rounded-xl border border-[#e4e9f0] bg-white px-3 py-2 text-[12px] font-semibold text-[#374151] outline-none focus:border-[#005BE3] focus:ring-1 focus:ring-[#005BE3]/20 placeholder:text-[#d1d9e1]"
        />
      </div>
      {error && <p className="text-[10px] font-semibold text-red-500">{error}</p>}
      <div className="flex gap-1.5">
        <button onClick={onCancel}
          className="flex h-7 flex-1 items-center justify-center rounded-lg border border-[#e4e9f0] bg-white text-[10px] font-semibold uppercase text-[#6b7280] transition hover:border-[#b0bac8]">
          Cancelar
        </button>
        <button onClick={onSave} disabled={!ready}
          className={`flex h-7 flex-1 items-center justify-center rounded-lg text-[10px] font-bold uppercase tracking-wider text-white transition ${
            ready ? "bg-[#005BE3] hover:bg-[#0049c4] active:scale-[0.97]" : "cursor-not-allowed bg-[#005BE3]/40"
          }`}>
          Guardar PIN
        </button>
      </div>
    </div>
  );
}

// ── componente principal ───────────────────────────────────────────────────

export function OperadoresWorkspace() {
  const [operators,  setOperators]  = useState<Operator[]>(MOCK_OPERATORS);
  const [selectedId, setSelectedId] = useState<string | null>("1");
  const [isNew,      setIsNew]      = useState(false);
  const [isEditing,  setIsEditing]  = useState(false);

  // form state
  const [editCode,  setEditCode]  = useState("");
  const [editName,  setEditName]  = useState("");
  const [editRole,  setEditRole]  = useState("VEN");
  const [editBlock, setEditBlock] = useState<number | null>(100);

  // PIN inline
  const [pinOpen,    setPinOpen]    = useState(false);
  const [pinInput,   setPinInput]   = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinError,   setPinError]   = useState("");

  const selected    = operators.find(o => o.id === selectedId) ?? null;
  const canSave     = editCode.trim().length >= 2 && editName.trim().length >= 2;
  const canActOnSel = selected !== null && !isNew;

  const thirdAction: ThirdAction | null =
    !canActOnSel                         ? null
    : !selected!.hasOperationalHistory   ? "delete"
    : selected!.active                   ? "deactivate"
    :                                      "activate";

  // ── helpers PIN ──────────────────────────────────────────────────────────

  function resetPin() { setPinOpen(false); setPinInput(""); setPinConfirm(""); setPinError(""); }

  function savePinViewMode() {
    if (pinInput.length < 4) { setPinError("Mínimo 4 dígitos"); return; }
    if (pinInput !== pinConfirm) { setPinError("Los PINs no coinciden"); return; }
    setOperators(prev => prev.map(o => o.id === selectedId ? { ...o, pinConfigured: true } : o));
    resetPin();
  }

  // ── handlers ──────────────────────────────────────────────────────────────

  function handleSelect(op: Operator) {
    setSelectedId(op.id); setIsNew(false); setIsEditing(false); resetPin();
  }

  function handleNew() {
    setSelectedId(null); setIsNew(true); setIsEditing(false);
    setEditCode(""); setEditName(""); setEditRole("VEN"); setEditBlock(100);
    resetPin();
  }

  function handleStartEdit() {
    if (!selected) return;
    setEditCode(selected.code); setEditName(selected.name);
    setEditRole(selected.roleCode); setEditBlock(selected.blockBase);
    setIsEditing(true); resetPin();
  }

  function handleSave() {
    if (!canSave) return;
    const pinUpdate: Partial<Operator> =
      pinOpen && pinInput.length >= 4 && pinInput === pinConfirm ? { pinConfigured: true } : {};

    if (isNew) {
      const next: Operator = {
        id: String(Date.now()),
        code: editCode.trim().toUpperCase(),
        name: editName.trim().toUpperCase(),
        roleCode: editRole,
        blockBase: editBlock,
        active: true,
        pinConfigured: !!pinUpdate.pinConfigured,
        hasOperationalHistory: false,
        createdAt: new Date(),
        createdBy: "OPERADOR",
      };
      setOperators(prev => [...prev, next]);
      setSelectedId(next.id);
      setIsNew(false);
    } else if (selectedId) {
      setOperators(prev => prev.map(o =>
        o.id === selectedId
          ? { ...o, code: editCode.trim().toUpperCase(), name: editName.trim().toUpperCase(), roleCode: editRole, blockBase: editBlock, ...pinUpdate }
          : o
      ));
    }
    setIsEditing(false); resetPin();
  }

  function handleCancel() { setIsNew(false); setIsEditing(false); resetPin(); }

  function handleDelete() {
    if (!selected || selected.hasOperationalHistory) return;
    const rest = operators.filter(o => o.id !== selected.id);
    setOperators(rest); setIsNew(false); setIsEditing(false);
    setSelectedId(rest.length > 0 ? rest[0].id : null);
  }

  function handleDeactivate() {
    if (!selected || !selected.active) return;
    setOperators(prev => prev.map(o => o.id === selected.id ? { ...o, active: false } : o));
    setIsEditing(false);
  }

  function handleActivate() {
    if (!selected || selected.active) return;
    setOperators(prev => prev.map(o => o.id === selected.id ? { ...o, active: true } : o));
  }

  const showView = selected !== null && !isNew && !isEditing;
  const showForm = (selected !== null && isEditing) || isNew;

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <section className="flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-[#78C487]/40 bg-[#FDFCF9]">

      {/* SheetHeader */}
      <header className="shrink-0 flex items-center justify-between border-b border-[#78C487]/15 bg-[#F5FBF5] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Users size={13} strokeWidth={2} className="text-[#78C487]" />
          <span className="text-[14px] font-semibold uppercase tracking-tight text-[#121416] leading-none">OPERADORES</span>
          <span className="ml-1 rounded-md bg-[#e8f5ea] px-2 py-0.5 text-[10px] font-bold tabular-nums text-[#4a7a55]">
            {operators.length}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button onClick={handleNew} title="Tecla [CTRL + N]"
            className="flex items-center gap-1.5 rounded-lg bg-[#56C264] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white transition hover:bg-[#44a852] active:scale-[0.97]">
            <Plus size={12} strokeWidth={2.5} />NUEVO OPERADOR
          </button>

          <button onClick={handleStartEdit} disabled={!canActOnSel} title="Tecla [CTRL + E]"
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition ${
              canActOnSel
                ? "bg-[#005BE3] text-white hover:bg-[#0049c4] active:scale-[0.97]"
                : "cursor-not-allowed bg-[#005BE3]/[0.15] text-[#005BE3]/50"
            }`}>
            <Pencil size={12} strokeWidth={2.5} />EDITAR
          </button>

          {thirdAction === "delete" && (
            <button onClick={handleDelete} title="Tecla [CTRL + DEL]"
              className="flex items-center gap-1.5 rounded-lg bg-[#dc2626] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white transition hover:bg-[#b91c1c] active:scale-[0.97]">
              <Trash2 size={12} strokeWidth={2.5} />ELIMINAR
            </button>
          )}
          {thirdAction === "deactivate" && (
            <button onClick={handleDeactivate} title="Tecla [CTRL + D]"
              className="flex items-center gap-1.5 rounded-lg bg-[#d97706] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white transition hover:bg-[#b45309] active:scale-[0.97]">
              <Ban size={12} strokeWidth={2.5} />DESACTIVAR
            </button>
          )}
          {thirdAction === "activate" && (
            <button onClick={handleActivate} title="Tecla [CTRL + D]"
              className="flex items-center gap-1.5 rounded-lg bg-[#56C264] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white transition hover:bg-[#44a852] active:scale-[0.97]">
              <ToggleRight size={12} strokeWidth={2.5} />ACTIVAR
            </button>
          )}
          {thirdAction === null && (
            <button disabled
              className="flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-[#dc2626]/[0.15] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#dc2626]/50">
              <Trash2 size={12} strokeWidth={2.5} />ELIMINAR
            </button>
          )}
        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1">

        {/* Lista */}
        <div className="w-[42%] shrink-0 overflow-y-auto border-r border-[#78C487]/10">
          {operators.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-[12px] font-semibold text-[#c0cad4]">Sin operadores</p>
            </div>
          ) : operators.map(op => {
            const isSel = op.id === selectedId && !isNew;
            return (
              <div key={op.id} onClick={() => handleSelect(op)}
                className={`flex cursor-pointer items-center gap-3 border-l-2 px-4 py-2.5 transition ${
                  isSel ? "border-[#78C487] bg-[#EFF8F0]" : "border-transparent hover:bg-[#F5FBF5]"
                }`}>
                <span className={`shrink-0 rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wider ${
                  isSel ? "bg-[#78C487] text-white" : "bg-[#e8f5ea] text-[#4a7a55]"
                }`}>
                  {op.code}
                </span>
                <div className="min-w-0 flex-1">
                  <p className={`text-[12px] font-semibold ${isSel ? "text-[#2d6640]" : "text-[#2F3E46]"}`}>
                    {op.name}
                  </p>
                  <p className="text-[10px] font-semibold text-[#9ca3af]">
                    {op.roleCode}{op.blockBase !== null ? ` · BLQ ${op.blockBase}` : " · sin bloque"}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {!op.active && (
                    <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-600">INACTIVO</span>
                  )}
                  {!op.pinConfigured && (
                    <span className="rounded-md bg-red-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red-400">SIN PIN</span>
                  )}
                  <ChevronRight size={12} className={isSel ? "text-[#78C487]" : "text-[#d1d9e1]"} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Panel */}
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-5">

          {/* VIEW */}
          {showView && selected && (
            <div className="flex flex-col gap-4">

              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">OPERADOR</span>

              {/* Cabecera */}
              <div className="flex items-center gap-2.5">
                <span className="rounded-md bg-[#78C487] px-2.5 py-1 text-[11px] font-bold tracking-wider text-white">
                  {selected.code}
                </span>
                <span className="text-[14px] font-semibold text-[#2F3E46]">{selected.name}</span>
                {!selected.active && (
                  <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-600">INACTIVO</span>
                )}
              </div>

              {/* Rol + Bloque */}
              <div className="flex gap-2">
                <div className="flex flex-1 flex-col gap-0.5 rounded-xl border border-[#e4e9f0] bg-[#fafbfc] px-3 py-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#b0bac8]">ROL</span>
                  <p className="flex items-center gap-1.5 text-[12px] font-semibold text-[#374151]">
                    <span className="rounded bg-[#e8f5ea] px-1.5 py-0.5 text-[10px] font-bold text-[#4a7a55]">{selected.roleCode}</span>
                    {ROLES_REF.find(r => r.code === selected.roleCode)?.name ?? selected.roleCode}
                  </p>
                </div>
                <div className="flex flex-1 flex-col gap-0.5 rounded-xl border border-[#e4e9f0] bg-[#fafbfc] px-3 py-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#b0bac8]">BLOQUE ASIGNADO</span>
                  {selected.blockBase !== null ? (
                    <p className="text-[12px] font-semibold text-[#374151]">
                      <span className="mr-1 text-[13px] font-bold tabular-nums text-[#78C487]">{selected.blockBase}</span>
                      CAJA {selected.blockBase}–{selected.blockBase + 4}
                    </p>
                  ) : (
                    <p className="text-[11px] font-semibold text-[#c0cad4]">Sin bloque asignado</p>
                  )}
                </div>
              </div>

              {/* PIN */}
              <div className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 ${
                selected.pinConfigured ? "border-emerald-100 bg-[#f0fdf4]" : "border-red-100 bg-red-50/50"
              }`}>
                <div className="flex items-center gap-2">
                  <KeyRound size={11} strokeWidth={2} className={selected.pinConfigured ? "text-emerald-500" : "text-red-400"} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    selected.pinConfigured ? "text-emerald-600" : "text-red-500"
                  }`}>
                    {selected.pinConfigured ? "PIN CONFIGURADO" : "SIN PIN OPERACIONAL"}
                  </span>
                </div>
                {!selected.pinConfigured && !pinOpen && (
                  <button
                    onClick={() => { setPinOpen(true); setPinInput(""); setPinConfirm(""); setPinError(""); }}
                    className="text-[10px] font-semibold text-[#005BE3] transition hover:underline underline-offset-2">
                    Configurar →
                  </button>
                )}
              </div>

              {/* PIN form inline (view mode) */}
              {pinOpen && (
                <PinForm
                  pin={pinInput} confirm={pinConfirm} error={pinError}
                  onPin={setPinInput} onConfirm={setPinConfirm}
                  onSave={savePinViewMode}
                  onCancel={resetPin}
                />
              )}

              {/* Histórico */}
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
                    ? "Con histórico operacional · solo desactivar"
                    : "Sin histórico operacional · puede eliminarse"}
                </span>
              </div>

              {/* Traceability */}
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

              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">
                {isNew ? "NUEVO OPERADOR" : "EDITAR OPERADOR"}
              </span>

              {/* Código + Nombre */}
              <div className="flex gap-3">
                <div className="flex w-24 flex-col gap-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">Código</span>
                  <input type="text" value={editCode}
                    onChange={e => setEditCode(e.target.value.toUpperCase().slice(0, 5))}
                    onKeyDown={e => { if (e.key === "Enter" && canSave) handleSave(); if (e.key === "Escape") handleCancel(); }}
                    maxLength={5} placeholder="FER"
                    className="rounded-xl border border-[#e4e9f0] bg-white px-3 py-2 text-[13px] font-bold uppercase text-[#2F3E46] outline-none transition focus:border-[#78C487] focus:ring-1 focus:ring-[#78C487]/20 placeholder:text-[#d1d9e1]"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">Nombre</span>
                  <input autoFocus type="text" value={editName}
                    onChange={e => setEditName(e.target.value.toUpperCase())}
                    onKeyDown={e => { if (e.key === "Enter" && canSave) handleSave(); if (e.key === "Escape") handleCancel(); }}
                    placeholder="FERNANDO"
                    className="rounded-xl border border-[#e4e9f0] bg-white px-3 py-2 text-[13px] font-semibold uppercase text-[#2F3E46] outline-none transition focus:border-[#78C487] focus:ring-1 focus:ring-[#78C487]/20 placeholder:text-[#d1d9e1]"
                  />
                </div>
              </div>

              {/* Rol + Bloque */}
              <div className="flex gap-3">
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">Rol</span>
                  <select value={editRole} onChange={e => setEditRole(e.target.value)}
                    className="rounded-xl border border-[#e4e9f0] bg-white px-3 py-2 text-[12px] font-semibold text-[#2F3E46] outline-none transition focus:border-[#78C487] focus:ring-1 focus:ring-[#78C487]/20">
                    {ROLES_REF.map(r => (
                      <option key={r.code} value={r.code}>{r.code} — {r.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-1 flex-col gap-0.5">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">Bloque asignado</span>
                  <select value={editBlock ?? ""} onChange={e => setEditBlock(e.target.value === "" ? null : Number(e.target.value))}
                    className="rounded-xl border border-[#e4e9f0] bg-white px-3 py-2 text-[12px] font-semibold text-[#2F3E46] outline-none transition focus:border-[#78C487] focus:ring-1 focus:ring-[#78C487]/20">
                    <option value="">Sin bloque</option>
                    {BLOCKS_REF.map(b => (
                      <option key={b} value={b}>BLOQUE {b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* PIN inline opcional */}
              {!pinOpen ? (
                <button onClick={() => { setPinOpen(true); setPinInput(""); setPinConfirm(""); setPinError(""); }}
                  className="flex items-center gap-1.5 self-start rounded-lg border border-[#e4e9f0] bg-[#fafbfc] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-[#6b7280] transition hover:border-[#005BE3]/30 hover:bg-[#f4f8ff] hover:text-[#005BE3] active:scale-[0.97]">
                  <KeyRound size={11} strokeWidth={2} />
                  {isNew ? "CONFIGURAR PIN" : "CAMBIAR PIN"}
                </button>
              ) : (
                <PinForm
                  pin={pinInput} confirm={pinConfirm} error={pinError}
                  onPin={setPinInput} onConfirm={setPinConfirm}
                  onSave={() => setPinOpen(false)}
                  onCancel={() => { setPinOpen(false); setPinInput(""); setPinConfirm(""); setPinError(""); }}
                />
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button onClick={handleCancel} title="Tecla [ESC]"
                  className="flex h-10 flex-1 items-center justify-center rounded-md border border-[#e4e9f0] bg-white text-[13px] font-semibold uppercase tracking-wider text-[#6b7280] transition hover:border-[#b0bac8] hover:text-[#374151]">
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={!canSave} title="Tecla [ENTER]"
                  className={`flex h-10 flex-1 items-center justify-center rounded-md text-[13px] font-semibold uppercase tracking-wider text-white transition ${
                    canSave ? "bg-[#56C264] hover:bg-[#44a852] active:scale-[0.98]" : "cursor-not-allowed bg-[#56C264]/40"
                  }`}>
                  {isNew ? "Crear operador" : "Guardar"}
                </button>
              </div>

            </div>
          )}

          {/* EMPTY */}
          {!showView && !showForm && (
            <div className="flex flex-col items-center justify-center gap-1.5 py-12 text-center">
              <Users size={24} strokeWidth={1.5} className="text-[#d1d9e1]" />
              <p className="text-[12px] font-semibold text-[#c0cad4]">Seleccione un operador</p>
              <p className="text-[11px] font-semibold text-[#d1d9e1]">o registre uno nuevo</p>
            </div>
          )}

        </div>
      </div>
    </section>
  );
}
