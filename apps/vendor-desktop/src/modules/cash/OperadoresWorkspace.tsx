import { useState, useEffect, useMemo } from "react";
import {
  Plus, Pencil, CircleCheck, PauseCircle, Archive,
  KeyRound, AlertTriangle, ChevronRight, Unlink,
  Users, UserX, Activity, ClipboardList, Hash, Phone, CreditCard,
} from "lucide-react";
import { usePOS } from "../../context/POSContext";
import type { OperatorRecord } from "../../domains/operator/operator.store";
import { generateAlias, resolveAlias } from "../../domains/operator/operator.store";
import { BLOCK_BASES } from "../../domains/operator/blocks.store";

const BAJA_REASONS = [
  "Renuncia voluntaria",
  "Fin de contrato",
  "Cambio de sede",
  "Baja operacional",
  "Reemplazo",
] as const;

const SUSPEND_REASONS = [
  "Suspensión administrativa",
  "Investigación interna",
  "Vacaciones",
  "Permiso temporal",
  "Ausencia justificada",
] as const;

type GestionPanel = "view" | "create" | "edit" | "confirm-suspend" | "confirm-baja";

// ── helpers ────────────────────────────────────────────────────────────────

function fmtDateShort(iso: string): string {
  const d  = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

// ── PIN form ───────────────────────────────────────────────────────────────

function PinForm({ pin, confirm, error, onPin, onConfirm, onSave, onCancel }: {
  pin: string; confirm: string; error: string;
  onPin: (v: string) => void; onConfirm: (v: string) => void;
  onSave: () => void; onCancel: () => void;
}) {
  const ready = pin.length >= 4 && pin === confirm;
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[#005BE3]/20 bg-[#f4f8ff] px-3 py-2.5">
      <div className="flex items-center gap-1.5">
        <KeyRound size={10} strokeWidth={2} className="text-[#005BE3]" />
        <span className="text-[9px] font-bold uppercase tracking-wider text-[#005BE3]">CONFIGURAR PIN</span>
      </div>
      <div className="flex gap-2">
        <input autoFocus type="password" value={pin} inputMode="numeric"
          onChange={e => onPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          onKeyDown={e => { if (e.key === "Enter" && ready) onSave(); if (e.key === "Escape") onCancel(); }}
          placeholder="PIN" maxLength={6}
          className="w-20 rounded-xl border border-[#e4e9f0] bg-white px-2.5 py-1.5 text-[13px] font-bold tracking-[0.3em] text-[#2F3E46] outline-none focus:border-[#005BE3] focus:ring-1 focus:ring-[#005BE3]/20 placeholder:tracking-normal placeholder:font-normal placeholder:text-[#d1d9e1]"
        />
        <input type="password" value={confirm} inputMode="numeric"
          onChange={e => onConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))}
          onKeyDown={e => { if (e.key === "Enter" && ready) onSave(); if (e.key === "Escape") onCancel(); }}
          placeholder="Confirmar" maxLength={6}
          className="flex-1 rounded-xl border border-[#e4e9f0] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#374151] outline-none focus:border-[#005BE3] focus:ring-1 focus:ring-[#005BE3]/20 placeholder:text-[#d1d9e1]"
        />
      </div>
      {error && <p className="text-[9px] font-semibold text-red-500">{error}</p>}
      <div className="flex gap-1.5">
        <button onClick={onCancel}
          className="flex h-6 flex-1 items-center justify-center rounded-lg border border-[#e4e9f0] bg-white text-[9px] font-semibold uppercase text-[#6b7280] transition hover:border-[#b0bac8]">
          Cancelar
        </button>
        <button onClick={onSave} disabled={!ready}
          className={`flex h-6 flex-1 items-center justify-center rounded-lg text-[9px] font-bold uppercase text-white transition ${
            ready ? "bg-[#005BE3] hover:bg-[#0049c4]" : "cursor-not-allowed bg-[#005BE3]/[0.15] text-[#005BE3]/50"
          }`}>
          Guardar
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// PANEL IZQUIERDO — OPERADORES ACTIVOS (selector maestro)
// ══════════════════════════════════════════════════════════════════════════

function PanelActivos({ selectedId, onSelect }: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const { operators, cashSession, isOpen, cashBox } = usePOS();
  // ACTIVO + SUSPENDIDO — INACTIVO/BAJA quedan en HISTÓRICO
  const visibles    = operators.filter(o => o.status !== "INACTIVO");
  const activos     = visibles.filter(o => o.status === "ACTIVO");
  const suspendidos = visibles.filter(o => o.status === "SUSPENDIDO");

  function getState(op: OperatorRecord): "EN_TURNO" | "DISPONIBLE" | "SIN_BLOQUE" {
    if (op.blockBase === null) return "SIN_BLOQUE";
    const enTurno = isOpen && cashBox !== null && (
      cashSession.operatorId === op.id || cashBox.code[0] === String(op.blockBase)[0]
    );
    return enTurno ? "EN_TURNO" : "DISPONIBLE";
  }

  const enTurnoCount    = activos.filter(o => getState(o) === "EN_TURNO").length;
  const disponibleCount = activos.filter(o => getState(o) === "DISPONIBLE").length;

  return (
    <div className="flex w-[300px] shrink-0 flex-col overflow-hidden rounded-[28px] border border-[#2A7CA8]/40 bg-[#FDFCF9]">

      {/* SheetHeader — línea única fija */}
      <div className="shrink-0 flex h-[42px] items-center gap-2 border-b border-[#2A7CA8]/15 bg-[#F2F7FA] px-4">
        <Activity size={13} strokeWidth={2} className="shrink-0 text-[#1a5f7a]" />
        <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">OPERADORES ACTIVOS</span>
        <span className="rounded-md bg-[#2A7CA8]/20 px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-[#1a5f7a]">{activos.length}</span>
        <div className="ml-auto flex items-center gap-2">
          {enTurnoCount > 0 && (
            <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-600">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />{enTurnoCount}
            </span>
          )}
          {suspendidos.length > 0 && (
            <span className="text-[9px] font-semibold text-amber-500">{suspendidos.length} susp.</span>
          )}
        </div>
      </div>

      {/* SheetBody — lista seleccionable */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {visibles.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16">
            <Users size={24} strokeWidth={1.5} className="text-[#d1d9e1]" />
            <p className="text-[11px] font-semibold text-[#c0cad4]">Sin operadores activos</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-[#f0f4f8]">
            {visibles.map(op => {
              const isSel       = op.id === selectedId;
              const isSuspended = op.status === "SUSPENDIDO";
              const state       = isSuspended ? null : getState(op);

              const stateCfg = state ? {
                EN_TURNO:   { dot: "bg-emerald-500", text: "text-emerald-600", label: "EN TURNO",   rowBg: "bg-emerald-50/30" },
                DISPONIBLE: { dot: "bg-[#2A7CA8]",   text: "text-[#1a5f7a]",   label: "DISPONIBLE", rowBg: ""                 },
                SIN_BLOQUE: { dot: "bg-[#c0cad4]",   text: "text-[#b0bac8]",   label: "SIN BLOQUE", rowBg: "bg-[#fafbfc]"     },
              }[state] : null;

              return (
                <div key={op.id} onClick={() => onSelect(op.id)}
                  className={`flex cursor-pointer items-center gap-2.5 border-l-2 px-3.5 py-2.5 transition ${
                    isSel
                      ? "border-[#2A7CA8] bg-[#EBF4FA]"
                      : `border-transparent hover:bg-[#F2F7FA] ${stateCfg?.rowBg ?? ""}`
                  }`}>

                  <div className="flex flex-col items-center gap-1 pt-0.5">
                    {isSuspended
                      ? <PauseCircle size={13} strokeWidth={2} className="text-amber-400" />
                      : <CircleCheck size={13} strokeWidth={2} className={state === "EN_TURNO" ? "text-emerald-500" : "text-[#e4e9f0]"} />
                    }
                    <span className={`h-1.5 w-1.5 rounded-full ${isSuspended ? "bg-amber-400" : (stateCfg?.dot ?? "bg-[#c0cad4]")}`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold ${
                        isSuspended ? "bg-amber-100 text-amber-700" : isSel ? "bg-[#2A7CA8] text-white" : "bg-[#EBF4FA] text-[#1a5f7a]"
                      }`}>
                        {op.alias}
                      </span>
                      <span className={`truncate text-[12px] font-semibold ${
                        isSel ? "text-[#2d6640]" : isSuspended ? "text-[#9ca3af]" : "text-[#2F3E46]"
                      }`}>
                        {op.nombres} {op.apellidos}
                      </span>
                    </div>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      {isSuspended
                        ? <span className="text-[9px] font-bold uppercase tracking-wider text-amber-500">SUSPENDIDO</span>
                        : <span className={`text-[9px] font-bold uppercase tracking-wider ${stateCfg?.text ?? ""}`}>{stateCfg?.label}</span>
                      }
                      {op.blockBase !== null && (
                        <span className="text-[9px] text-[#b0bac8]">· {op.blockBase}</span>
                      )}
                    </div>
                  </div>

                  {op.pin === "" && op.status === "ACTIVO" && (
                    <span className="shrink-0 rounded bg-red-50 px-1 py-0.5 text-[8px] font-bold text-red-400">PIN</span>
                  )}
                  <ChevronRight size={10} className={isSel ? "text-[#2A7CA8]" : "text-[#e4e9f0]"} />
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// PANEL CENTRAL — GESTIÓN OPERADORES (detalle puro)
// ══════════════════════════════════════════════════════════════════════════

function PanelGestion({ selectedId, onSelect }: {
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const {
    operators, isOpen, cashBox, cashSession, resetOperatorPin,
    createOperator, updateOperatorData, setOperatorStatus, releaseOperatorBlock,
    roles,
  } = usePOS();

  const [panel,       setPanel]       = useState<GestionPanel>("view");
  const [blockError,  setBlockError]  = useState<string | null>(null);

  const [editApellidos, setEditApellidos] = useState("");
  const [editNombres,   setEditNombres]   = useState("");
  const [editAlias,     setEditAlias]     = useState("");
  const [aliasEdited,   setAliasEdited]   = useState(false);
  const [editDni,       setEditDni]       = useState("");
  const [editTelefono,  setEditTelefono]  = useState("");
  const [editRole,      setEditRole]      = useState("VEN");
  const [editBlock,     setEditBlock]     = useState<number | null>(null);

  // Auto-generar alias mientras el usuario escribe nombres/apellidos (solo si no lo editó manualmente)
  const existingAliases = useMemo(
    () => operators.filter(o => o.id !== selectedId && o.status !== "INACTIVO").map(o => o.alias),
    [operators, selectedId],
  );
  useEffect(() => {
    if (!aliasEdited && panel === "create") {
      const base = generateAlias(editNombres, editApellidos);
      if (base) setEditAlias(resolveAlias(base, editApellidos, existingAliases));
    }
  }, [editNombres, editApellidos, aliasEdited, panel, existingAliases]);

  const [reason,      setReason]      = useState("");
  const [reasonError, setReasonError] = useState("");

  const [pinOpen,    setPinOpen]    = useState(false);
  const [pinInput,   setPinInput]   = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinError,   setPinError]   = useState("");

  const selected = operators.find(o => o.id === selectedId) ?? null;

  // Cuando cambia la selección desde PanelActivos, volver a view
  useEffect(() => {
    if (selectedId !== null) resetForm();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const hasActiveTurno = isOpen && cashBox !== null && selected !== null && selected.blockBase !== null && (
    cashSession.operatorId === selected.id ||
    cashBox.code[0] === String(selected.blockBase)[0]
  );

  function resetForm() {
    setPanel("view"); setBlockError(null);
    setReason(""); setReasonError("");
    setPinOpen(false); setPinInput(""); setPinConfirm(""); setPinError("");
  }

  function handleNew() {
    onSelect(null); setPanel("create");
    setEditApellidos(""); setEditNombres(""); setEditAlias(""); setAliasEdited(false);
    setEditDni(""); setEditTelefono("");
    setEditRole("VEN"); setEditBlock(null);
    setBlockError(null);
  }

  function handleStartEdit() {
    if (!selected) return;
    setEditApellidos(selected.apellidos);
    setEditNombres(selected.nombres);
    setEditAlias(selected.alias);
    setAliasEdited(true);
    setEditDni(selected.dni ?? "");
    setEditTelefono(selected.telefono ?? "");
    setEditRole(selected.roleCode);
    setEditBlock(selected.blockBase);
    setPanel("edit"); setBlockError(null);
  }

  const canSave = editApellidos.trim().length >= 2 && editNombres.trim().length >= 2 && editAlias.trim().length >= 2;

  function handleSave() {
    setBlockError(null);
    const apellidos = editApellidos.trim().toUpperCase();
    const nombres   = editNombres.trim().toUpperCase();
    const alias     = editAlias.trim().toUpperCase();
    const roleName  = roles.find(r => r.code === editRole)?.name ?? editRole;
    if (panel === "create") {
      try {
        const op = createOperator({
          apellidos, nombres, alias,
          dni: editDni.trim() || undefined,
          telefono: editTelefono.trim() || undefined,
          roleCode: editRole, roleName,
          blockBase: editBlock,
        });
        onSelect(op.id); setPanel("view");
      } catch (e) {
        setBlockError(e instanceof Error ? e.message : "Error al crear operador");
      }
    } else if (panel === "edit" && selectedId) {
      const ok = updateOperatorData(selectedId, {
        apellidos, nombres, alias,
        dni: editDni.trim() || undefined,
        telefono: editTelefono.trim() || undefined,
        roleCode: editRole, roleName,
        blockBase: editBlock,
      });
      if (!ok) { setBlockError(`Bloque ${editBlock} ya asignado a otro operador activo`); return; }
      setPanel("view");
    }
  }

  function handleConfirmSuspend() {
    if (!reason.trim()) { setReasonError("Motivo obligatorio"); return; }
    if (!selected || hasActiveTurno) return;
    setOperatorStatus(selected.id, "SUSPENDIDO", reason.trim());
    resetForm();
  }

  function handleConfirmBaja() {
    if (!reason.trim()) { setReasonError("Motivo obligatorio"); return; }
    if (!selected || hasActiveTurno) return;
    setOperatorStatus(selected.id, "INACTIVO", reason.trim());
    const next = operators.filter(o => o.status !== "INACTIVO" && o.id !== selected.id);
    onSelect(next[0]?.id ?? null);
    resetForm();
  }

  function handleActivate() {
    if (!selected) return;
    const ok = setOperatorStatus(selected.id, "ACTIVO");
    if (!ok) setBlockError(`Bloque ${selected.blockBase} ya asignado a otro operador activo`);
  }

  function savePinViewMode() {
    if (!selected) return;
    if (pinInput.length < 4) { setPinError("Mínimo 4 dígitos"); return; }
    if (pinInput !== pinConfirm) { setPinError("Los PINs no coinciden"); return; }
    resetOperatorPin(selected.id, pinInput);
    setPinOpen(false); setPinInput(""); setPinConfirm(""); setPinError("");
  }

  const showView           = panel === "view" && selected !== null;
  const showForm           = panel === "create" || panel === "edit";
  const showConfirmSuspend = panel === "confirm-suspend";
  const showConfirmBaja    = panel === "confirm-baja";

  return (
    <div className="flex w-[480px] shrink-0 flex-col overflow-hidden rounded-[28px] border border-[#2A7CA8]/40 bg-[#FDFCF9]">

      {/* SheetHeader — línea única fija */}
      <div className="shrink-0 flex h-[42px] items-center gap-2 border-b border-[#2A7CA8]/15 bg-[#F2F7FA] px-4">
        <Users size={13} strokeWidth={2} className="shrink-0 text-[#1a5f7a]" />
        <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">DATOS DEL OPERADOR</span>
      </div>

      {/* ActionBar */}
      <div className="shrink-0 flex items-center gap-1.5 border-b border-[#2A7CA8]/10 px-4 py-2">
        <button onClick={handleNew}
          className="flex items-center gap-1 rounded-lg bg-[#45b356] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white transition hover:bg-[#35994a] active:scale-[0.97]">
          <Plus size={10} strokeWidth={2.5} />NUEVO
        </button>
        <button
          onClick={handleStartEdit}
          disabled={!selected || hasActiveTurno}
          className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
            selected && !hasActiveTurno
              ? "bg-[#005BE3] text-white hover:bg-[#0049c4] active:scale-[0.97]"
              : "cursor-not-allowed bg-[#005BE3]/[0.15] text-[#005BE3]/40"
          }`}>
          <Pencil size={10} strokeWidth={2.5} />EDITAR
        </button>
        {selected?.status === "SUSPENDIDO" ? (
          <button
            onClick={handleActivate}
            disabled={hasActiveTurno}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
              !hasActiveTurno
                ? "bg-[#45b356] text-white hover:bg-[#35994a] active:scale-[0.97]"
                : "cursor-not-allowed bg-[#45b356]/[0.15] text-[#45b356]/40"
            }`}>
            <CircleCheck size={10} strokeWidth={2.5} />REACTIVAR
          </button>
        ) : (
          <button
            onClick={() => { setPanel("confirm-suspend"); setReason(""); setReasonError(""); }}
            disabled={!selected || hasActiveTurno || selected?.status !== "ACTIVO"}
            className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
              selected && !hasActiveTurno && selected.status === "ACTIVO"
                ? "bg-amber-500 text-white hover:bg-amber-600 active:scale-[0.97]"
                : "cursor-not-allowed bg-amber-500/[0.15] text-amber-500/40"
            }`}>
            <PauseCircle size={10} strokeWidth={2.5} />SUSPENDER
          </button>
        )}
      </div>

      {/* SheetBody — detalle del operador seleccionado */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-3 pb-3">

        {blockError && (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
            <AlertTriangle size={10} strokeWidth={2} className="shrink-0 text-red-500" />
            <p className="text-[10px] font-semibold text-red-600">{blockError}</p>
          </div>
        )}

        {/* VIEW */}
        {showView && selected && (
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="rounded bg-[#e4e9f0] px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-[#6b7280]">{selected.operatorCode}</span>
              <span className="rounded bg-[#2A7CA8] px-1.5 py-0.5 text-[10px] font-bold text-white">{selected.alias}</span>
              <span className="text-[12px] font-semibold text-[#2F3E46]">{selected.nombres} {selected.apellidos}</span>
              {selected.status === "SUSPENDIDO" && (
                <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold text-amber-600">SUSP.</span>
              )}
            </div>
            {(selected.dni || selected.telefono) && (
              <div className="flex flex-wrap gap-2">
                {selected.dni && (
                  <div className="flex items-center gap-1 text-[10px] text-[#9ca3af]">
                    <CreditCard size={9} strokeWidth={2} />
                    <span>{selected.dni}</span>
                  </div>
                )}
                {selected.telefono && (
                  <div className="flex items-center gap-1 text-[10px] text-[#9ca3af]">
                    <Phone size={9} strokeWidth={2} />
                    <span>{selected.telefono}</span>
                  </div>
                )}
              </div>
            )}

            {hasActiveTurno && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-1.5">
                <AlertTriangle size={10} strokeWidth={2} className="shrink-0 text-amber-600" />
                <p className="text-[9px] font-semibold text-amber-700">Turno activo · no modificable</p>
              </div>
            )}

            <div className="flex gap-2">
              <div className="flex flex-1 flex-col gap-0.5 rounded-xl border border-[#e4e9f0] bg-[#fafbfc] px-2.5 py-1.5">
                <span className="text-[8px] font-bold uppercase tracking-widest text-[#b0bac8]">ROL</span>
                <p className="text-[11px] font-semibold text-[#374151]">
                  <span className="mr-1 rounded bg-[#EBF4FA] px-1 py-0.5 text-[9px] font-bold text-[#1a5f7a]">{selected.roleCode}</span>
                  {roles.find(r => r.code === selected.roleCode)?.name ?? selected.roleCode}
                </p>
              </div>
              <div className="flex flex-1 flex-col gap-0.5 rounded-xl border border-[#e4e9f0] bg-[#fafbfc] px-2.5 py-1.5">
                <span className="text-[8px] font-bold uppercase tracking-widest text-[#b0bac8]">BLOQUE</span>
                {selected.blockBase !== null ? (
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold text-[#374151]">
                      <span className="mr-1 font-bold text-[#2A7CA8]">{selected.blockBase}</span>
                      –{selected.blockBase + 4}
                    </p>
                    {!hasActiveTurno && (
                      <button onClick={() => releaseOperatorBlock(selected.id)}
                        className="flex items-center gap-0.5 text-[8px] font-bold uppercase text-[#b0bac8] transition hover:text-red-400">
                        <Unlink size={8} />LIBERAR
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] text-[#c0cad4]">Sin bloque</p>
                )}
              </div>
            </div>

            <div className={`flex items-center justify-between rounded-xl border px-3 py-1.5 ${
              selected.pin !== "" ? "border-emerald-100 bg-[#f0fdf4]" : "border-red-100 bg-red-50/50"
            }`}>
              <div className="flex items-center gap-1.5">
                <KeyRound size={10} strokeWidth={2} className={selected.pin !== "" ? "text-emerald-500" : "text-red-400"} />
                <span className={`text-[9px] font-bold uppercase tracking-wider ${
                  selected.pin !== "" ? "text-emerald-600" : "text-red-500"
                }`}>
                  {selected.pin !== "" ? "PIN OK" : "SIN PIN"}
                </span>
              </div>
              {!pinOpen && (
                <button onClick={() => { setPinOpen(true); setPinInput(""); setPinConfirm(""); setPinError(""); }}
                  className="text-[9px] font-semibold text-[#005BE3] transition hover:underline">
                  {selected.pin !== "" ? "Cambiar" : "Configurar →"}
                </button>
              )}
            </div>
            {pinOpen && (
              <PinForm pin={pinInput} confirm={pinConfirm} error={pinError}
                onPin={setPinInput} onConfirm={setPinConfirm}
                onSave={savePinViewMode}
                onCancel={() => { setPinOpen(false); setPinInput(""); setPinConfirm(""); setPinError(""); }}
              />
            )}

            {!hasActiveTurno && selected.status === "ACTIVO" && (
              <div className="border-t border-[#f1f5f9] pt-2.5">
                <button onClick={() => { setPanel("confirm-baja"); setReason(""); setReasonError(""); }}
                  className="flex w-full items-center gap-1.5 rounded-xl border border-[#e4e9f0] bg-[#fafbfc] px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider text-[#9ca3af] transition hover:border-red-200 hover:text-red-500">
                  <UserX size={9} strokeWidth={2} />DAR DE BAJA
                </button>
              </div>
            )}
          </div>
        )}

        {/* CONFIRM SUSPEND */}
        {showConfirmSuspend && selected && (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2">
              <PauseCircle size={11} strokeWidth={2} className="shrink-0 text-amber-600" />
              <span className="text-[10px] font-bold uppercase text-amber-700">SUSPENSIÓN · {selected.code}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#9ca3af]">Motivo (obligatorio)</span>
              <select value={reason} onChange={e => { setReason(e.target.value); setReasonError(""); }}
                className="rounded-xl border border-[#e4e9f0] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#2F3E46] outline-none focus:border-amber-400">
                <option value="" disabled>Seleccione...</option>
                {SUSPEND_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {reasonError && <p className="text-[9px] font-semibold text-red-500">{reasonError}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={resetForm}
                className="flex h-8 flex-1 items-center justify-center rounded-lg border border-[#e4e9f0] bg-white text-[10px] font-semibold uppercase text-[#6b7280] transition hover:border-[#b0bac8]">
                Cancelar
              </button>
              <button onClick={handleConfirmSuspend}
                className="flex h-8 flex-1 items-center justify-center rounded-lg bg-amber-500 text-[10px] font-bold uppercase text-white transition hover:bg-amber-600">
                Confirmar
              </button>
            </div>
          </div>
        )}

        {/* CONFIRM BAJA */}
        {showConfirmBaja && selected && (
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/60 px-3 py-2">
              <UserX size={11} strokeWidth={2} className="shrink-0 text-red-500" />
              <span className="text-[10px] font-bold uppercase text-red-600">BAJA · {selected.code}</span>
            </div>
            {selected.blockBase !== null && (
              <p className="text-[10px] text-amber-700">
                El bloque {selected.blockBase} quedará disponible.
              </p>
            )}
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#9ca3af]">Motivo (obligatorio)</span>
              <select value={reason} onChange={e => { setReason(e.target.value); setReasonError(""); }}
                className="rounded-xl border border-[#e4e9f0] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#2F3E46] outline-none focus:border-red-400">
                <option value="" disabled>Seleccione...</option>
                {BAJA_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {reasonError && <p className="text-[9px] font-semibold text-red-500">{reasonError}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={resetForm}
                className="flex h-8 flex-1 items-center justify-center rounded-lg border border-[#e4e9f0] bg-white text-[10px] font-semibold uppercase text-[#6b7280] transition">
                Cancelar
              </button>
              <button onClick={handleConfirmBaja}
                className="flex h-8 flex-1 items-center justify-center rounded-lg bg-[#dc2626] text-[10px] font-bold uppercase text-white transition hover:bg-[#b91c1c]">
                Confirmar baja
              </button>
            </div>
          </div>
        )}

        {/* FORM create/edit */}
        {showForm && (
          <div className="flex flex-col gap-2.5">
            <span className="text-[9px] font-semibold uppercase tracking-widest text-[#9ca3af]">
              {panel === "create" ? "NUEVO OPERADOR" : "EDITAR OPERADOR"}
            </span>
            {/* Apellidos + Nombres */}
            <div className="flex gap-2">
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-[9px] font-semibold uppercase tracking-widest text-[#b0bac8]">Apellidos</span>
                <input autoFocus type="text" value={editApellidos} placeholder="TORRES GUZMÁN"
                  onChange={e => { setEditApellidos(e.target.value.toUpperCase()); setBlockError(null); }}
                  onKeyDown={e => { if (e.key === "Enter" && canSave) handleSave(); if (e.key === "Escape") resetForm(); }}
                  className="rounded-xl border border-[#e4e9f0] bg-white px-2.5 py-1.5 text-[12px] font-semibold uppercase text-[#2F3E46] outline-none focus:border-[#2154d8] focus:ring-1 focus:ring-[#2154d8]/10 placeholder:text-[#d1d9e1]"
                />
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-[9px] font-semibold uppercase tracking-widest text-[#b0bac8]">Nombres</span>
                <input type="text" value={editNombres} placeholder="GABRIEL"
                  onChange={e => { setEditNombres(e.target.value.toUpperCase()); setBlockError(null); }}
                  onKeyDown={e => { if (e.key === "Enter" && canSave) handleSave(); if (e.key === "Escape") resetForm(); }}
                  className="rounded-xl border border-[#e4e9f0] bg-white px-2.5 py-1.5 text-[12px] font-semibold uppercase text-[#2F3E46] outline-none focus:border-[#2154d8] focus:ring-1 focus:ring-[#2154d8]/10 placeholder:text-[#d1d9e1]"
                />
              </div>
            </div>
            {/* Alias + DNI */}
            <div className="flex gap-2">
              <div className="flex w-[120px] shrink-0 flex-col gap-0.5">
                <span className="text-[9px] font-semibold uppercase tracking-widest text-[#b0bac8]">Alias</span>
                <input type="text" value={editAlias} placeholder="GTORRES" maxLength={20}
                  onChange={e => { setEditAlias(e.target.value.toUpperCase().replace(/\s/g, "")); setAliasEdited(true); setBlockError(null); }}
                  onKeyDown={e => { if (e.key === "Enter" && canSave) handleSave(); if (e.key === "Escape") resetForm(); }}
                  className="rounded-xl border border-[#e4e9f0] bg-white px-2.5 py-1.5 text-[12px] font-bold uppercase tracking-wider text-[#2F3E46] outline-none focus:border-[#2154d8] focus:ring-1 focus:ring-[#2154d8]/10 placeholder:text-[#d1d9e1]"
                />
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-[9px] font-semibold uppercase tracking-widest text-[#b0bac8]">DNI <span className="normal-case font-normal">(opc.)</span></span>
                <input type="text" value={editDni} placeholder="12345678" maxLength={12}
                  onChange={e => setEditDni(e.target.value.replace(/\D/g, "").slice(0, 12))}
                  onKeyDown={e => { if (e.key === "Enter" && canSave) handleSave(); if (e.key === "Escape") resetForm(); }}
                  className="rounded-xl border border-[#e4e9f0] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#2F3E46] outline-none focus:border-[#2154d8] focus:ring-1 focus:ring-[#2154d8]/10 placeholder:text-[#d1d9e1]"
                />
              </div>
            </div>
            {/* Teléfono */}
            <div className="flex flex-col gap-0.5">
              <span className="text-[9px] font-semibold uppercase tracking-widest text-[#b0bac8]">Teléfono <span className="normal-case font-normal">(opc.)</span></span>
              <input type="text" value={editTelefono} placeholder="+51 987 654 321" maxLength={20}
                onChange={e => setEditTelefono(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && canSave) handleSave(); if (e.key === "Escape") resetForm(); }}
                className="rounded-xl border border-[#e4e9f0] bg-white px-2.5 py-1.5 text-[12px] font-semibold text-[#2F3E46] outline-none focus:border-[#2154d8] focus:ring-1 focus:ring-[#2154d8]/10 placeholder:text-[#d1d9e1]"
              />
            </div>
            {/* Rol + Bloque */}
            <div className="flex gap-2">
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-[9px] font-semibold uppercase tracking-widest text-[#b0bac8]">Rol</span>
                <select value={editRole} onChange={e => setEditRole(e.target.value)}
                  className="rounded-xl border border-[#e4e9f0] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#2F3E46] outline-none focus:border-[#2154d8]">
                  {roles.filter(r => r.active).map(r => <option key={r.code} value={r.code}>{r.code} — {r.name}</option>)}
                </select>
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-[9px] font-semibold uppercase tracking-widest text-[#b0bac8]">Bloque</span>
                <select value={editBlock ?? ""} onChange={e => { setEditBlock(e.target.value === "" ? null : Number(e.target.value)); setBlockError(null); }}
                  className="rounded-xl border border-[#e4e9f0] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#2F3E46] outline-none focus:border-[#2154d8]">
                  <option value="">Sin bloque</option>
                  {BLOCK_BASES.map(b => {
                    const taken = operators.some(o => o.id !== selectedId && o.blockBase === b && o.status !== "INACTIVO");
                    return <option key={b} value={b} disabled={taken}>{b}{taken ? " · OCUPADO" : ""}</option>;
                  })}
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-0.5">
              <button onClick={resetForm}
                className="flex h-8 flex-1 items-center justify-center rounded-lg border border-[#e4e9f0] bg-white text-[11px] font-semibold uppercase text-[#6b7280] transition hover:border-[#b0bac8]">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={!canSave}
                className={`flex h-8 flex-1 items-center justify-center rounded-lg text-[11px] font-semibold uppercase text-white transition ${
                  canSave ? "bg-[#45b356] hover:bg-[#35994a]" : "cursor-not-allowed bg-[#45b356]/[0.15] text-[#45b356]/50"
                }`}>
                {panel === "create" ? "Crear" : "Guardar"}
              </button>
            </div>
          </div>
        )}

        {!showView && !showForm && !showConfirmSuspend && !showConfirmBaja && !blockError && (
          <div className="flex flex-col items-center justify-center gap-1.5 py-10 text-center">
            <Users size={20} strokeWidth={1.5} className="text-[#d1d9e1]" />
            <p className="text-[10px] font-semibold text-[#c0cad4]">Seleccione un operador</p>
          </div>
        )}

      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// PANEL DERECHO — HISTÓRICO OPERADORES
// ══════════════════════════════════════════════════════════════════════════

function PanelHistorico() {
  const { operators, setOperatorStatus } = usePOS();

  const suspendidos = operators.filter(o => o.status === "SUSPENDIDO");
  const bajas       = operators.filter(o => o.status === "INACTIVO");

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[#2A7CA8]/40 bg-[#FDFCF9]">

      {/* SheetHeader — línea única fija */}
      <div className="shrink-0 flex h-[42px] items-center gap-2 border-b border-[#2A7CA8]/15 bg-[#F2F7FA] px-4">
        <ClipboardList size={13} strokeWidth={2} className="shrink-0 text-[#1a5f7a]" />
        <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">HISTORIAL</span>
        <div className="ml-auto flex items-center gap-2">
          {suspendidos.length > 0 && (
            <span className="text-[9px] font-semibold text-amber-500">{suspendidos.length} susp.</span>
          )}
          {bajas.length > 0 && (
            <span className="rounded-md bg-[#e4e7ec] px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-[#6b7280]">{bajas.length} baja{bajas.length > 1 ? "s" : ""}</span>
          )}
        </div>
      </div>

      {/* SheetBody */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {suspendidos.length === 0 && bajas.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16">
            <ClipboardList size={24} strokeWidth={1.5} className="text-[#d1d9e1]" />
            <p className="text-[10px] font-semibold text-[#c0cad4]">Sin historial</p>
          </div>
        ) : (
          <>
            {/* SUSPENDIDOS */}
            {suspendidos.length > 0 && (
              <>
                <div className="sticky top-0 z-10 border-b border-amber-100 bg-amber-50/80 px-3.5 py-1.5 backdrop-blur-sm">
                  <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-amber-600">
                    <PauseCircle size={9} strokeWidth={2} />SUSPENDIDOS
                  </span>
                </div>
                {suspendidos.map(op => (
                  <div key={op.id} className="flex flex-col gap-1 border-b border-amber-50 bg-amber-50/15 px-3.5 py-2.5">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-bold text-amber-700">
                        {op.alias}
                      </span>
                      <span className="truncate text-[11px] font-semibold text-[#374151]">{op.nombres} {op.apellidos}</span>
                    </div>
                    {op.statusAt && (
                      <p className="text-[9px] text-[#9ca3af]">Desde {fmtDateShort(op.statusAt)}</p>
                    )}
                    {op.statusReason && (
                      <p className="truncate text-[9px] text-[#9ca3af]">{op.statusReason}</p>
                    )}
                    <button onClick={() => setOperatorStatus(op.id, "ACTIVO")}
                      className="mt-0.5 flex items-center justify-center gap-1 rounded-lg border border-[#2A7CA8]/30 bg-[#f0fdf4] py-1 text-[9px] font-bold uppercase text-[#1a5f7a] transition hover:bg-[#EBF4FA]">
                      <CircleCheck size={9} strokeWidth={2} />Reactivar
                    </button>
                  </div>
                ))}
              </>
            )}

            {/* BAJAS */}
            {bajas.length > 0 && (
              <>
                <div className="sticky top-0 z-10 border-b border-[#e4e9f0] bg-[#EDEEF2]/90 px-3.5 py-1.5 backdrop-blur-sm">
                  <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-[#9ca3af]">
                    <Archive size={9} strokeWidth={2} />BAJA OPERACIONAL
                  </span>
                </div>
                {bajas.map(op => (
                  <div key={op.id} className="flex flex-col gap-1 border-b border-[#eef0f4] px-3.5 py-2.5 opacity-55">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-[#eef0f4] px-1.5 py-0.5 text-[9px] font-bold text-[#9ca3af]">
                        {op.alias}
                      </span>
                      <span className="truncate text-[11px] font-semibold text-[#9ca3af]">{op.nombres} {op.apellidos}</span>
                    </div>
                    {op.statusAt && (
                      <p className="text-[9px] text-[#b0bac8]">Baja: {fmtDateShort(op.statusAt)}</p>
                    )}
                    {op.statusReason && (
                      <p className="truncate text-[9px] text-[#b0bac8]">{op.statusReason}</p>
                    )}
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>

    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// OPERADORES WORKSPACE — 3 paneles simultáneos, selectedId compartido
// ══════════════════════════════════════════════════════════════════════════

export function OperadoresWorkspace() {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <section className="flex min-h-0 flex-1 gap-2">
      <PanelActivos   selectedId={selectedId} onSelect={setSelectedId} />
      <PanelGestion   selectedId={selectedId} onSelect={setSelectedId} />
      <PanelHistorico />
    </section>
  );
}
