import { useState } from "react";
import { Plus, Pencil, Trash2, Ban, ToggleRight, Users, ChevronRight, KeyRound, AlertTriangle, CheckCircle, Unlink } from "lucide-react";
import { usePOS } from "../../context/POSContext";
import type { OperatorRecord, OperatorStatus } from "../../domains/operator/operator.store";

// ── referencias cruzadas ───────────────────────────────────────────────────

const ROLES_REF = [
  { code: "VEN", name: "Vendedor"      },
  { code: "ADM", name: "Administrador" },
  { code: "GST", name: "Gestor"        },
  { code: "CNT", name: "Contador"      },
  { code: "SPT", name: "Soporte"       },
];

const BLOCKS_REF = [100, 200, 300, 400, 500];

type ThirdAction = "delete" | "deactivate" | "suspend" | "activate";

// ── helpers ────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  const dd  = String(d.getDate()).padStart(2, "0");
  const mm  = String(d.getMonth() + 1).padStart(2, "0");
  const hh  = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()} · ${hh}:${min}`;
}

function statusBadge(status: OperatorStatus) {
  if (status === "ACTIVO")     return null;
  if (status === "SUSPENDIDO") return <span className="rounded-md bg-amber-50 px-2 py-0.5 text-[9px] font-bold uppercase text-amber-600">SUSPENDIDO</span>;
  return <span className="rounded-md bg-[#f3f4f6] px-2 py-0.5 text-[9px] font-bold uppercase text-[#9ca3af]">INACTIVO</span>;
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
  const {
    isOpen, cashBox,
    operators, resetOperatorPin,
    createOperator, updateOperatorData, setOperatorStatus, releaseOperatorBlock,
  } = usePOS();

  const [selectedId,        setSelectedId]        = useState<string | null>(operators[0]?.id ?? null);
  const [isNew,             setIsNew]             = useState(false);
  const [isEditing,         setIsEditing]         = useState(false);
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [confirmSuspend,    setConfirmSuspend]    = useState(false);
  const [blockError,        setBlockError]        = useState<string | null>(null);

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

  const selected = operators.find(o => o.id === selectedId) ?? null;

  // Bloque del operador seleccionado tiene turno activo ahora
  const hasActiveTurno = isOpen
    && selected !== null
    && selected.blockBase !== null
    && cashBox !== null
    && String(selected.blockBase)[0] === cashBox.code[0];

  const canActOnSel = selected !== null && !isNew && !confirmDeactivate && !confirmSuspend;

  const thirdAction: ThirdAction | null =
    selected === null || isNew          ? null
    : selected.pin === ""               ? "delete"   // sin histórico operacional real
    : selected.status === "INACTIVO"   ? "activate"
    : selected.status === "SUSPENDIDO" ? "activate"
    :                                    "deactivate";

  // ── helpers PIN ──────────────────────────────────────────────────────────

  function resetPin() { setPinOpen(false); setPinInput(""); setPinConfirm(""); setPinError(""); }

  function savePinViewMode() {
    if (!selected) return;
    if (pinInput.length < 4) { setPinError("Mínimo 4 dígitos"); return; }
    if (pinInput !== pinConfirm) { setPinError("Los PINs no coinciden"); return; }
    resetOperatorPin(selected.id, pinInput);
    resetPin();
  }

  // ── handlers ──────────────────────────────────────────────────────────────

  function handleSelect(op: OperatorRecord) {
    setSelectedId(op.id); setIsNew(false); setIsEditing(false);
    setConfirmDeactivate(false); setConfirmSuspend(false);
    setBlockError(null); resetPin();
  }

  function handleNew() {
    setSelectedId(null); setIsNew(true); setIsEditing(false);
    setEditCode(""); setEditName(""); setEditRole("VEN"); setEditBlock(100);
    setConfirmDeactivate(false); setConfirmSuspend(false); setBlockError(null); resetPin();
  }

  function handleStartEdit() {
    if (!selected) return;
    setEditCode(selected.code); setEditName(selected.name);
    setEditRole(selected.roleCode); setEditBlock(selected.blockBase);
    setIsEditing(true); setConfirmDeactivate(false); setConfirmSuspend(false);
    setBlockError(null); resetPin();
  }

  function handleSave() {
    if (!canSave) return;
    setBlockError(null);
    if (isNew) {
      try {
        const op = createOperator({
          code: editCode.trim().toUpperCase(),
          name: editName.trim().toUpperCase(),
          roleCode: editRole,
          roleName: ROLES_REF.find(r => r.code === editRole)?.name ?? editRole,
          blockBase: editBlock,
        });
        setSelectedId(op.id);
        setIsNew(false);
      } catch (e) {
        setBlockError(e instanceof Error ? e.message : "Error al crear operador");
      }
    } else if (selectedId) {
      const ok = updateOperatorData(selectedId, {
        code: editCode.trim().toUpperCase(),
        name: editName.trim().toUpperCase(),
        roleCode: editRole,
        roleName: ROLES_REF.find(r => r.code === editRole)?.name ?? editRole,
        blockBase: editBlock,
      });
      if (!ok) {
        setBlockError(`Bloque ${editBlock} ya está asignado a otro operador activo`);
        return;
      }
      setIsEditing(false);
    }
    resetPin();
  }

  function handleCancel() {
    setIsNew(false); setIsEditing(false);
    setConfirmDeactivate(false); setConfirmSuspend(false);
    setBlockError(null); resetPin();
  }

  function handleDelete() {
    if (!selected || selected.pin !== "") return; // solo sin PIN = sin histórico real
    const rest = operators.filter(o => o.id !== selected.id);
    // Note: soft delete — we'd need a "deleteOperator" context action for full persistence
    // For now, mark as INACTIVO if has any data
    setOperatorStatus(selected.id, "INACTIVO");
    setSelectedId(rest.length > 0 ? rest[0].id : null);
    setIsNew(false); setIsEditing(false);
  }

  function handleConfirmDeactivate() {
    if (!selected || selected.status !== "ACTIVO" || hasActiveTurno) return;
    setOperatorStatus(selected.id, "INACTIVO");
    setConfirmDeactivate(false); setIsEditing(false);
  }

  function handleConfirmSuspend() {
    if (!selected || selected.status !== "ACTIVO" || hasActiveTurno) return;
    setOperatorStatus(selected.id, "SUSPENDIDO");
    setConfirmSuspend(false); setIsEditing(false);
  }

  function handleActivate() {
    if (!selected || selected.status === "ACTIVO") return;
    const ok = setOperatorStatus(selected.id, "ACTIVO");
    if (!ok) setBlockError(`Bloque ${selected.blockBase} ya está asignado a otro operador activo`);
  }

  function handleReleaseBlock() {
    if (!selected || selected.blockBase === null) return;
    releaseOperatorBlock(selected.id);
  }

  const canSave = editCode.trim().length >= 2 && editName.trim().length >= 2;
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
            className="flex items-center gap-1.5 rounded-lg bg-[#45b356] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white transition hover:bg-[#35994a] active:scale-[0.97]">
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
          {thirdAction === "deactivate" && !confirmSuspend && !confirmDeactivate && (
            <button onClick={() => setConfirmDeactivate(true)} title="Tecla [CTRL + D]"
              className="flex items-center gap-1.5 rounded-lg bg-[#d97706] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white transition hover:bg-[#b45309] active:scale-[0.97]">
              <Ban size={12} strokeWidth={2.5} />DESACTIVAR
            </button>
          )}
          {thirdAction === "activate" && (
            <button onClick={handleActivate} title="Tecla [CTRL + D]"
              className="flex items-center gap-1.5 rounded-lg bg-[#45b356] px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-white transition hover:bg-[#35994a] active:scale-[0.97]">
              <ToggleRight size={12} strokeWidth={2.5} />ACTIVAR
            </button>
          )}
          {(thirdAction === null) && (
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
                  {op.status === "SUSPENDIDO" && (
                    <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-600">SUSPENDIDO</span>
                  )}
                  {op.status === "INACTIVO" && (
                    <span className="rounded-md bg-[#f3f4f6] px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#9ca3af]">INACTIVO</span>
                  )}
                  {op.pin === "" && op.status === "ACTIVO" && (
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

          {/* Error bloque duplicado */}
          {blockError && (
            <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
              <AlertTriangle size={11} strokeWidth={2} className="shrink-0 text-red-500" />
              <p className="text-[10px] font-semibold text-red-600">{blockError}</p>
            </div>
          )}

          {/* CONFIRMACIÓN DESACTIVAR */}
          {showView && selected && confirmDeactivate && (
            <div className="flex flex-col gap-3">
              <div className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 ${
                hasActiveTurno ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50/60"
              }`}>
                {hasActiveTurno
                  ? <AlertTriangle size={13} strokeWidth={2} className="shrink-0 text-red-500" />
                  : <Ban           size={13} strokeWidth={2} className="shrink-0 text-amber-600" />
                }
                <span className={`text-[11px] font-bold uppercase tracking-widest ${
                  hasActiveTurno ? "text-red-600" : "text-amber-700"
                }`}>
                  {hasActiveTurno ? "BAJA BLOQUEADA" : "BAJA OPERACIONAL"}
                </span>
                <span className="ml-1 rounded bg-white/70 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-[#2F3E46]">
                  {selected.code}
                </span>
              </div>

              {hasActiveTurno ? (
                <div className="flex flex-col gap-2.5 rounded-xl border border-red-100 bg-white px-4 py-3">
                  <p className="text-[12px] font-semibold text-[#374151]">
                    <span className="font-bold text-red-600">{selected.name}</span> tiene un turno activo en el bloque{" "}
                    <span className="font-bold tabular-nums text-[#2F3E46]">{selected.blockBase}</span>.
                  </p>
                  <p className="text-[11px] font-semibold text-[#9ca3af]">
                    Cierra el turno activo antes de registrar la baja operacional.
                  </p>
                  <button onClick={() => setConfirmDeactivate(false)}
                    className="flex h-8 w-full items-center justify-center rounded-lg border border-[#e4e9f0] bg-white text-[11px] font-semibold uppercase tracking-wider text-[#6b7280] transition hover:border-[#b0bac8] hover:text-[#374151]">
                    Entendido
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 rounded-xl border border-[#e4e9f0] bg-white px-4 py-3">
                  <p className="text-[12px] font-semibold text-[#374151]">
                    <span className="font-bold text-[#2F3E46]">{selected.name}</span> quedará inactivo operacionalmente.
                    Su histórico se conserva íntegro.
                  </p>
                  {selected.blockBase !== null && (
                    <div className="flex items-center gap-2 rounded-lg border border-emerald-100 bg-[#f0fdf4] px-3 py-2">
                      <CheckCircle size={11} strokeWidth={2} className="shrink-0 text-emerald-500" />
                      <p className="text-[11px] font-semibold text-emerald-700">
                        Bloque <span className="font-bold tabular-nums">{selected.blockBase}</span> quedará disponible para reasignación
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2 pt-0.5">
                    <button onClick={() => setConfirmDeactivate(false)}
                      className="flex h-8 flex-1 items-center justify-center rounded-lg border border-[#e4e9f0] bg-white text-[11px] font-semibold uppercase tracking-wider text-[#6b7280] transition hover:border-[#b0bac8] hover:text-[#374151]">
                      Cancelar
                    </button>
                    <button onClick={handleConfirmDeactivate}
                      className="flex h-8 flex-1 items-center justify-center rounded-lg bg-[#d97706] text-[11px] font-bold uppercase tracking-wider text-white transition hover:bg-[#b45309] active:scale-[0.97]">
                      Confirmar baja
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CONFIRMACIÓN SUSPENDER */}
          {showView && selected && confirmSuspend && (
            <div className="flex flex-col gap-3">
              <div className={`flex items-center gap-2 rounded-xl border px-3.5 py-2.5 ${
                hasActiveTurno ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50/60"
              }`}>
                <AlertTriangle size={13} strokeWidth={2} className={`shrink-0 ${hasActiveTurno ? "text-red-500" : "text-amber-600"}`} />
                <span className={`text-[11px] font-bold uppercase tracking-widest ${hasActiveTurno ? "text-red-600" : "text-amber-700"}`}>
                  {hasActiveTurno ? "SUSPENSIÓN BLOQUEADA" : "SUSPENSIÓN TEMPORAL"}
                </span>
              </div>
              {hasActiveTurno ? (
                <div className="flex flex-col gap-2 rounded-xl border border-red-100 bg-white px-4 py-3">
                  <p className="text-[11px] font-semibold text-[#374151]">
                    Cierra el turno activo antes de suspender al operador.
                  </p>
                  <button onClick={() => setConfirmSuspend(false)}
                    className="flex h-8 w-full items-center justify-center rounded-lg border border-[#e4e9f0] bg-white text-[11px] font-semibold uppercase tracking-wider text-[#6b7280] transition hover:border-[#b0bac8]">
                    Entendido
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3 rounded-xl border border-[#e4e9f0] bg-white px-4 py-3">
                  <p className="text-[12px] font-semibold text-[#374151]">
                    <span className="font-bold">{selected.name}</span> quedará suspendido temporalmente.
                    Puede reactivarse en cualquier momento.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setConfirmSuspend(false)}
                      className="flex h-8 flex-1 items-center justify-center rounded-lg border border-[#e4e9f0] bg-white text-[11px] font-semibold uppercase tracking-wider text-[#6b7280] transition hover:border-[#b0bac8]">
                      Cancelar
                    </button>
                    <button onClick={handleConfirmSuspend}
                      className="flex h-8 flex-1 items-center justify-center rounded-lg bg-amber-500 text-[11px] font-bold uppercase tracking-wider text-white transition hover:bg-amber-600 active:scale-[0.97]">
                      Confirmar suspensión
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW NORMAL */}
          {showView && selected && !confirmDeactivate && !confirmSuspend && (
            <div className="flex flex-col gap-4">

              <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">OPERADOR</span>

              {/* Cabecera */}
              <div className="flex items-center gap-2.5">
                <span className="rounded-md bg-[#78C487] px-2.5 py-1 text-[11px] font-bold tracking-wider text-white">
                  {selected.code}
                </span>
                <span className="text-[14px] font-semibold text-[#2F3E46]">{selected.name}</span>
                {statusBadge(selected.status)}
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

                {/* Bloque */}
                <div className={`flex flex-1 flex-col gap-0.5 rounded-xl border px-3 py-2 ${
                  selected.status !== "ACTIVO" && selected.blockBase !== null
                    ? "border-emerald-100 bg-[#f0fdf4]"
                    : selected.blockBase !== null
                    ? "border-[#e4e9f0] bg-[#fafbfc]"
                    : "border-dashed border-[#e4e9f0] bg-[#fafbfc]"
                }`}>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#b0bac8]">
                    BLOQUE ASIGNADO
                  </span>
                  {selected.blockBase !== null ? (
                    <div className="flex items-center justify-between">
                      <p className="text-[12px] font-semibold text-[#374151]">
                        <span className={`mr-1 text-[13px] font-bold tabular-nums ${
                          selected.status !== "ACTIVO" ? "text-emerald-600" : "text-[#78C487]"
                        }`}>
                          {selected.blockBase}
                        </span>
                        CAJA {selected.blockBase}–{selected.blockBase + 4}
                      </p>
                      {selected.status !== "INACTIVO" && (
                        <button onClick={handleReleaseBlock} title="Liberar bloque"
                          className="flex items-center gap-1 rounded-lg border border-[#e4e9f0] bg-white px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-[#9ca3af] transition hover:border-red-200 hover:text-red-500">
                          <Unlink size={9} strokeWidth={2} />LIBERAR
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-[11px] font-semibold text-[#c0cad4]">Sin bloque asignado</p>
                  )}
                </div>
              </div>

              {/* Estado bloque (si inactivo con bloque) */}
              {selected.status !== "ACTIVO" && selected.blockBase !== null && (
                <div className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-[#f0fdf4] px-3 py-2">
                  <CheckCircle size={11} strokeWidth={2} className="shrink-0 text-emerald-500" />
                  <p className="text-[11px] font-semibold text-emerald-700">
                    Bloque <span className="font-bold tabular-nums">{selected.blockBase}</span> disponible para reasignación
                  </p>
                </div>
              )}

              {/* Acción SUSPENDER (solo activos, separada del botón de baja) */}
              {selected.status === "ACTIVO" && (
                <button onClick={() => setConfirmSuspend(true)}
                  className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/40 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-amber-700 transition hover:bg-amber-50">
                  <AlertTriangle size={10} strokeWidth={2} />SUSPENDER TEMPORALMENTE
                </button>
              )}

              {/* PIN */}
              <div className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 ${
                selected.pin !== "" ? "border-emerald-100 bg-[#f0fdf4]" : "border-red-100 bg-red-50/50"
              }`}>
                <div className="flex items-center gap-2">
                  <KeyRound size={11} strokeWidth={2} className={selected.pin !== "" ? "text-emerald-500" : "text-red-400"} />
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    selected.pin !== "" ? "text-emerald-600" : "text-red-500"
                  }`}>
                    {selected.pin !== "" ? "PIN CONFIGURADO" : "SIN PIN OPERACIONAL"}
                  </span>
                </div>
                {selected.pin === "" && !pinOpen && (
                  <button
                    onClick={() => { setPinOpen(true); setPinInput(""); setPinConfirm(""); setPinError(""); }}
                    className="text-[10px] font-semibold text-[#005BE3] transition hover:underline underline-offset-2">
                    Configurar →
                  </button>
                )}
                {selected.pin !== "" && !pinOpen && (
                  <button
                    onClick={() => { setPinOpen(true); setPinInput(""); setPinConfirm(""); setPinError(""); }}
                    className="text-[10px] font-semibold text-[#9ca3af] transition hover:text-[#005BE3] hover:underline underline-offset-2">
                    Cambiar
                  </button>
                )}
              </div>

              {pinOpen && (
                <PinForm
                  pin={pinInput} confirm={pinConfirm} error={pinError}
                  onPin={setPinInput} onConfirm={setPinConfirm}
                  onSave={savePinViewMode}
                  onCancel={resetPin}
                />
              )}

              {/* Asignación */}
              {selected.blockAssignment && (
                <div className="flex flex-col gap-1 rounded-xl border border-[#e4e9f0] bg-[#fafbfc] px-3 py-2">
                  <span className="text-[9px] font-bold uppercase tracking-widest text-[#b0bac8]">HISTORIAL DE BLOQUE</span>
                  <div className="flex items-baseline justify-between">
                    <span className="text-[10px] font-semibold text-[#9ca3af]">Asignado</span>
                    <span className="text-[10px] font-semibold tabular-nums text-[#6b7280]">
                      {formatDate(selected.blockAssignment.assignedAt)}
                    </span>
                  </div>
                  {selected.blockAssignment.releasedAt && (
                    <div className="flex items-baseline justify-between">
                      <span className="text-[10px] font-semibold text-[#9ca3af]">Liberado</span>
                      <span className="text-[10px] font-semibold tabular-nums text-amber-500">
                        {formatDate(selected.blockAssignment.releasedAt)}
                      </span>
                    </div>
                  )}
                </div>
              )}

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
                    onChange={e => { setEditCode(e.target.value.toUpperCase().slice(0, 5)); setBlockError(null); }}
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
                  <select value={editBlock ?? ""} onChange={e => { setEditBlock(e.target.value === "" ? null : Number(e.target.value)); setBlockError(null); }}
                    className="rounded-xl border border-[#e4e9f0] bg-white px-3 py-2 text-[12px] font-semibold text-[#2F3E46] outline-none transition focus:border-[#78C487] focus:ring-1 focus:ring-[#78C487]/20">
                    <option value="">Sin bloque</option>
                    {BLOCKS_REF.map(b => {
                      const taken = operators.some(o =>
                        o.id !== selectedId &&
                        o.blockBase === b &&
                        o.status !== "INACTIVO"
                      );
                      return (
                        <option key={b} value={b} disabled={taken}>
                          BLOQUE {b}{taken ? " · OCUPADO" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-1">
                <button onClick={handleCancel} title="Tecla [ESC]"
                  className="flex h-10 flex-1 items-center justify-center rounded-md border border-[#e4e9f0] bg-white text-[13px] font-semibold uppercase tracking-wider text-[#6b7280] transition hover:border-[#b0bac8] hover:text-[#374151]">
                  Cancelar
                </button>
                <button onClick={handleSave} disabled={!canSave} title="Tecla [ENTER]"
                  className={`flex h-10 flex-1 items-center justify-center rounded-md text-[13px] font-semibold uppercase tracking-wider text-white transition ${
                    canSave ? "bg-[#45b356] hover:bg-[#35994a] active:scale-[0.98]" : "cursor-not-allowed bg-[#45b356]/40"
                  }`}>
                  {isNew ? "Crear operador" : "Guardar"}
                </button>
              </div>

            </div>
          )}

          {/* EMPTY */}
          {!showView && !showForm && !blockError && (
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
