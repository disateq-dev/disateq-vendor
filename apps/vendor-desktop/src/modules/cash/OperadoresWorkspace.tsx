import { useState } from "react";
import {
  Plus, Pencil, CircleCheck, PauseCircle, Archive,
  KeyRound, AlertTriangle, ChevronRight, Unlink, Users,
  UserX, Activity, ClipboardList,
} from "lucide-react";
import { usePOS } from "../../context/POSContext";
import type { OperatorRecord, OperatorStatus } from "../../domains/operator/operator.store";

// ── tipos ──────────────────────────────────────────────────────────────────

type InnerTab = "activos" | "gestion" | "historico";
type GestionPanel = "view" | "create" | "edit" | "confirm-suspend" | "confirm-baja";

// ── constantes ─────────────────────────────────────────────────────────────

const ROLES_REF = [
  { code: "VEN", name: "Vendedor"      },
  { code: "ADM", name: "Administrador" },
  { code: "GST", name: "Gestor"        },
  { code: "CNT", name: "Contador"      },
  { code: "SPT", name: "Soporte"       },
];

const BLOCKS_REF = [100, 200, 300, 400, 500];

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

// ── helpers ────────────────────────────────────────────────────────────────

function fmtDate(iso: string): string {
  const d  = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mn = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()} ${hh}:${mn}`;
}

function fmtDateShort(iso: string): string {
  const d  = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

// ── sub-componente: PIN form inline ────────────────────────────────────────

function PinForm({ pin, confirm, error, onPin, onConfirm, onSave, onCancel }: {
  pin: string; confirm: string; error: string;
  onPin: (v: string) => void; onConfirm: (v: string) => void;
  onSave: () => void; onCancel: () => void;
}) {
  const ready = pin.length >= 4 && pin === confirm;
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[#005BE3]/20 bg-[#f4f8ff] px-3.5 py-3">
      <div className="flex items-center gap-1.5">
        <KeyRound size={11} strokeWidth={2} className="text-[#005BE3]" />
        <span className="text-[10px] font-bold uppercase tracking-wider text-[#005BE3]">CONFIGURAR PIN</span>
      </div>
      <div className="flex gap-2">
        <input autoFocus type="password" value={pin} inputMode="numeric"
          onChange={e => onPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          onKeyDown={e => { if (e.key === "Enter" && ready) onSave(); if (e.key === "Escape") onCancel(); }}
          placeholder="PIN" maxLength={6}
          className="w-24 rounded-xl border border-[#e4e9f0] bg-white px-3 py-2 text-[15px] font-bold tracking-[0.35em] text-[#2F3E46] outline-none focus:border-[#005BE3] focus:ring-1 focus:ring-[#005BE3]/20 placeholder:tracking-normal placeholder:font-normal placeholder:text-[#d1d9e1]"
        />
        <input type="password" value={confirm} inputMode="numeric"
          onChange={e => onConfirm(e.target.value.replace(/\D/g, "").slice(0, 6))}
          onKeyDown={e => { if (e.key === "Enter" && ready) onSave(); if (e.key === "Escape") onCancel(); }}
          placeholder="Confirmar" maxLength={6}
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

// ══════════════════════════════════════════════════════════════════════════
// TAB 1 — OPERADORES ACTIVOS
// ══════════════════════════════════════════════════════════════════════════

function TabActivos() {
  const { operators, cashSession, isOpen, cashBox } = usePOS();
  const activos = operators.filter(o => o.status === "ACTIVO");

  function getOpState(op: OperatorRecord): "EN_TURNO" | "DISPONIBLE" | "SIN_BLOQUE" {
    if (op.blockBase === null) return "SIN_BLOQUE";
    const enTurno = isOpen && cashBox !== null && (
      cashSession.operatorId === op.id ||
      cashBox.code[0] === String(op.blockBase)[0]
    );
    return enTurno ? "EN_TURNO" : "DISPONIBLE";
  }

  if (activos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <Users size={28} strokeWidth={1.5} className="text-[#d1d9e1]" />
        <p className="text-[12px] font-semibold text-[#c0cad4]">Sin operadores activos</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-[#f0f4f8]">
      {activos.map(op => {
        const state = getOpState(op);
        const stateConfig = {
          EN_TURNO:   { label: "EN TURNO",    dot: "bg-emerald-500", text: "text-emerald-700",  bg: "bg-emerald-50/60"  },
          DISPONIBLE: { label: "DISPONIBLE",  dot: "bg-[#78C487]",   text: "text-[#4a7a55]",   bg: "bg-[#f5fbf5]"     },
          SIN_BLOQUE: { label: "SIN BLOQUE",  dot: "bg-[#b0bac8]",   text: "text-[#9ca3af]",   bg: "bg-[#fafbfc]"     },
        }[state];

        return (
          <div key={op.id} className={`flex items-center gap-3 px-4 py-3 ${stateConfig.bg}`}>
            {/* Indicador */}
            <div className="flex flex-col items-center gap-1">
              <CircleCheck size={14} strokeWidth={2} className={state === "EN_TURNO" ? "text-emerald-500" : "text-[#d1d9e1]"} />
              <span className={`h-1.5 w-1.5 rounded-full ${stateConfig.dot}`} />
            </div>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-[#78C487] px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-white">
                  {op.code}
                </span>
                <span className="text-[13px] font-semibold text-[#2F3E46]">{op.name}</span>
              </div>
              <div className="mt-0.5 flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-wider ${stateConfig.text}`}>
                  {stateConfig.label}
                </span>
                {op.blockBase !== null && (
                  <span className="text-[10px] text-[#9ca3af]">· BLQ {op.blockBase}</span>
                )}
                {state === "EN_TURNO" && cashBox && (
                  <span className="text-[10px] font-semibold text-emerald-600">· CAJA {cashBox.code}</span>
                )}
              </div>
            </div>

            {/* Rol */}
            <span className="shrink-0 rounded-md bg-[#e8f5ea] px-1.5 py-0.5 text-[9px] font-bold text-[#4a7a55]">
              {op.roleCode}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// TAB 2 — GESTIÓN OPERADORES
// ══════════════════════════════════════════════════════════════════════════

function TabGestion() {
  const {
    operators, isOpen, cashBox, cashSession, resetOperatorPin,
    createOperator, updateOperatorData, setOperatorStatus, releaseOperatorBlock,
  } = usePOS();

  // Solo ACTIVOS + SUSPENDIDOS en gestión
  const gestionOps = operators.filter(o => o.status !== "INACTIVO");

  const [selectedId,  setSelectedId]  = useState<string | null>(gestionOps[0]?.id ?? null);
  const [panel,       setPanel]       = useState<GestionPanel>("view");
  const [blockError,  setBlockError]  = useState<string | null>(null);

  // form
  const [editCode,  setEditCode]  = useState("");
  const [editName,  setEditName]  = useState("");
  const [editRole,  setEditRole]  = useState("VEN");
  const [editBlock, setEditBlock] = useState<number | null>(null);

  // reason para suspend/baja
  const [reason,  setReason]  = useState("");
  const [reasonError, setReasonError] = useState("");

  // PIN inline
  const [pinOpen,    setPinOpen]    = useState(false);
  const [pinInput,   setPinInput]   = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [pinError,   setPinError]   = useState("");

  const selected = operators.find(o => o.id === selectedId) ?? null;

  // Turno activo para el operador seleccionado
  const hasActiveTurno = isOpen && cashBox !== null && selected !== null && selected.blockBase !== null && (
    cashSession.operatorId === selected.id ||
    cashBox.code[0] === String(selected.blockBase)[0]
  );

  function resetForm() {
    setPanel("view"); setBlockError(null);
    setReason(""); setReasonError("");
    setPinOpen(false); setPinInput(""); setPinConfirm(""); setPinError("");
  }

  function handleSelect(op: OperatorRecord) {
    setSelectedId(op.id); resetForm();
  }

  function handleNew() {
    setSelectedId(null); setPanel("create");
    setEditCode(""); setEditName(""); setEditRole("VEN"); setEditBlock(null);
    setBlockError(null);
  }

  function handleStartEdit() {
    if (!selected) return;
    setEditCode(selected.code); setEditName(selected.name);
    setEditRole(selected.roleCode); setEditBlock(selected.blockBase);
    setPanel("edit"); setBlockError(null);
  }

  const canSave = editCode.trim().length >= 2 && editName.trim().length >= 2;

  function handleSave() {
    setBlockError(null);
    if (panel === "create") {
      try {
        const op = createOperator({
          code: editCode.trim().toUpperCase(),
          name: editName.trim().toUpperCase(),
          roleCode: editRole,
          roleName: ROLES_REF.find(r => r.code === editRole)?.name ?? editRole,
          blockBase: editBlock,
        });
        setSelectedId(op.id);
        setPanel("view");
      } catch (e) {
        setBlockError(e instanceof Error ? e.message : "Error al crear operador");
      }
    } else if (panel === "edit" && selectedId) {
      const ok = updateOperatorData(selectedId, {
        code: editCode.trim().toUpperCase(),
        name: editName.trim().toUpperCase(),
        roleCode: editRole,
        roleName: ROLES_REF.find(r => r.code === editRole)?.name ?? editRole,
        blockBase: editBlock,
      });
      if (!ok) { setBlockError(`Bloque ${editBlock} ya está asignado a otro operador activo`); return; }
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
    // baja libera bloque automáticamente (lógica en POSContext.setOperatorStatus)
    setOperatorStatus(selected.id, "INACTIVO", reason.trim());
    const newList = operators.filter(o => o.status !== "INACTIVO" && o.id !== selected.id);
    setSelectedId(newList[0]?.id ?? null);
    resetForm();
  }

  function handleActivate() {
    if (!selected) return;
    const ok = setOperatorStatus(selected.id, "ACTIVO");
    if (!ok) setBlockError(`Bloque ${selected.blockBase} ya asignado a otro operador activo`);
  }

  function handleReleaseBlock() {
    if (!selected || selected.blockBase === null) return;
    releaseOperatorBlock(selected.id);
  }

  function savePinViewMode() {
    if (!selected) return;
    if (pinInput.length < 4) { setPinError("Mínimo 4 dígitos"); return; }
    if (pinInput !== pinConfirm) { setPinError("Los PINs no coinciden"); return; }
    resetOperatorPin(selected.id, pinInput);
    setPinOpen(false); setPinInput(""); setPinConfirm(""); setPinError("");
  }

  const showView = panel === "view" && selected !== null;
  const showForm = panel === "create" || panel === "edit";
  const showConfirmSuspend = panel === "confirm-suspend";
  const showConfirmBaja    = panel === "confirm-baja";

  return (
    <div className="flex min-h-0 flex-1">

      {/* Lista */}
      <div className="w-[42%] shrink-0 overflow-y-auto border-r border-[#78C487]/10">
        <div className="px-3 py-2 border-b border-[#f0f4f8]">
          <button onClick={handleNew}
            className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#45b356] py-1.5 text-[11px] font-semibold uppercase tracking-wider text-white transition hover:bg-[#35994a] active:scale-[0.97]">
            <Plus size={11} strokeWidth={2.5} />NUEVO OPERADOR
          </button>
        </div>

        {gestionOps.length === 0 ? (
          <p className="py-8 text-center text-[11px] font-semibold text-[#c0cad4]">Sin operadores</p>
        ) : gestionOps.map(op => {
          const isSel = op.id === selectedId && !showForm;
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
                <p className="text-[10px] text-[#9ca3af]">
                  {op.roleCode}{op.blockBase !== null ? ` · BLQ ${op.blockBase}` : " · sin bloque"}
                </p>
              </div>
              {op.status === "SUSPENDIDO" && (
                <PauseCircle size={12} strokeWidth={2} className="shrink-0 text-amber-500" />
              )}
              {op.pin === "" && op.status === "ACTIVO" && (
                <span className="rounded bg-red-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-red-400">PIN</span>
              )}
              <ChevronRight size={12} className={isSel ? "text-[#78C487]" : "text-[#d1d9e1]"} />
            </div>
          );
        })}
      </div>

      {/* Panel */}
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4">

        {/* Error bloque */}
        {blockError && (
          <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
            <AlertTriangle size={11} strokeWidth={2} className="shrink-0 text-red-500" />
            <p className="text-[10px] font-semibold text-red-600">{blockError}</p>
          </div>
        )}

        {/* VIEW */}
        {showView && selected && (
          <div className="flex flex-col gap-3">
            {/* Cabecera */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="rounded-md bg-[#78C487] px-2 py-0.5 text-[11px] font-bold text-white">{selected.code}</span>
                <span className="text-[13px] font-semibold text-[#2F3E46]">{selected.name}</span>
                {selected.status === "SUSPENDIDO" && (
                  <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-600">SUSPENDIDO</span>
                )}
              </div>
              <button onClick={handleStartEdit} disabled={hasActiveTurno}
                className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider transition ${
                  hasActiveTurno
                    ? "cursor-not-allowed bg-[#005BE3]/10 text-[#005BE3]/40"
                    : "bg-[#005BE3] text-white hover:bg-[#0049c4] active:scale-[0.97]"
                }`}>
                <Pencil size={10} strokeWidth={2.5} />EDITAR
              </button>
            </div>

            {/* Turno activo — bloqueo */}
            {hasActiveTurno && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2">
                <AlertTriangle size={11} strokeWidth={2} className="shrink-0 text-amber-600" />
                <p className="text-[10px] font-semibold text-amber-700">
                  Operador con turno activo · No es posible modificar hasta cerrar el turno
                </p>
              </div>
            )}

            {/* Rol + Bloque */}
            <div className="flex gap-2">
              <div className="flex flex-1 flex-col gap-0.5 rounded-xl border border-[#e4e9f0] bg-[#fafbfc] px-3 py-2">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#b0bac8]">ROL</span>
                <p className="text-[12px] font-semibold text-[#374151]">
                  <span className="mr-1.5 rounded bg-[#e8f5ea] px-1.5 py-0.5 text-[10px] font-bold text-[#4a7a55]">{selected.roleCode}</span>
                  {ROLES_REF.find(r => r.code === selected.roleCode)?.name ?? selected.roleCode}
                </p>
              </div>
              <div className="flex flex-1 flex-col gap-0.5 rounded-xl border border-[#e4e9f0] bg-[#fafbfc] px-3 py-2">
                <span className="text-[9px] font-bold uppercase tracking-widest text-[#b0bac8]">BLOQUE</span>
                {selected.blockBase !== null ? (
                  <div className="flex items-center justify-between">
                    <p className="text-[12px] font-semibold text-[#374151]">
                      <span className="mr-1 text-[13px] font-bold text-[#78C487] tabular-nums">{selected.blockBase}</span>
                      CAJA {selected.blockBase}–{selected.blockBase + 4}
                    </p>
                    {!hasActiveTurno && (
                      <button onClick={handleReleaseBlock}
                        className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase text-[#9ca3af] transition hover:text-red-500">
                        <Unlink size={9} />LIBERAR
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-[#c0cad4]">Sin bloque asignado</p>
                )}
              </div>
            </div>

            {/* PIN */}
            <div className={`flex items-center justify-between rounded-xl border px-3.5 py-2 ${
              selected.pin !== "" ? "border-emerald-100 bg-[#f0fdf4]" : "border-red-100 bg-red-50/50"
            }`}>
              <div className="flex items-center gap-2">
                <KeyRound size={11} strokeWidth={2} className={selected.pin !== "" ? "text-emerald-500" : "text-red-400"} />
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  selected.pin !== "" ? "text-emerald-600" : "text-red-500"
                }`}>
                  {selected.pin !== "" ? "PIN CONFIGURADO" : "SIN PIN"}
                </span>
              </div>
              {!pinOpen && (
                <button onClick={() => { setPinOpen(true); setPinInput(""); setPinConfirm(""); setPinError(""); }}
                  className="text-[10px] font-semibold text-[#005BE3] transition hover:underline underline-offset-2">
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

            {/* Acciones de estado */}
            {!hasActiveTurno && (
              <div className="flex flex-col gap-1.5 border-t border-[#f1f5f9] pt-3">
                {selected.status === "ACTIVO" && (
                  <>
                    <button onClick={() => { setPanel("confirm-suspend"); setReason(""); setReasonError(""); }}
                      className="flex items-center gap-1.5 rounded-xl border border-amber-200 bg-amber-50/40 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-amber-700 transition hover:bg-amber-50">
                      <PauseCircle size={10} strokeWidth={2} />SUSPENDER TEMPORALMENTE
                    </button>
                    <button onClick={() => { setPanel("confirm-baja"); setReason(""); setReasonError(""); }}
                      className="flex items-center gap-1.5 rounded-xl border border-[#e4e9f0] bg-[#fafbfc] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] transition hover:border-red-200 hover:text-red-500">
                      <UserX size={10} strokeWidth={2} />DAR DE BAJA
                    </button>
                  </>
                )}
                {selected.status === "SUSPENDIDO" && (
                  <button onClick={handleActivate}
                    className="flex items-center gap-1.5 rounded-xl border border-[#78C487]/30 bg-[#f0fdf4] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[#4a7a55] transition hover:bg-[#e8f5ea]">
                    <CircleCheck size={10} strokeWidth={2} />REACTIVAR OPERADOR
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* CONFIRM SUSPEND */}
        {showConfirmSuspend && selected && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/60 px-3.5 py-2.5">
              <PauseCircle size={13} strokeWidth={2} className="shrink-0 text-amber-600" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-amber-700">SUSPENSIÓN TEMPORAL · {selected.code}</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#9ca3af]">Motivo (obligatorio)</span>
              <select value={reason} onChange={e => { setReason(e.target.value); setReasonError(""); }}
                className="rounded-xl border border-[#e4e9f0] bg-white px-3 py-2 text-[12px] font-semibold text-[#2F3E46] outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/20">
                <option value="" disabled>Seleccione motivo...</option>
                {SUSPEND_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {reasonError && <p className="text-[10px] font-semibold text-red-500">{reasonError}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={resetForm}
                className="flex h-9 flex-1 items-center justify-center rounded-lg border border-[#e4e9f0] bg-white text-[11px] font-semibold uppercase text-[#6b7280] transition hover:border-[#b0bac8]">
                Cancelar
              </button>
              <button onClick={handleConfirmSuspend}
                className="flex h-9 flex-1 items-center justify-center rounded-lg bg-amber-500 text-[11px] font-bold uppercase tracking-wider text-white transition hover:bg-amber-600 active:scale-[0.97]">
                Confirmar suspensión
              </button>
            </div>
          </div>
        )}

        {/* CONFIRM BAJA */}
        {showConfirmBaja && selected && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/60 px-3.5 py-2.5">
              <UserX size={13} strokeWidth={2} className="shrink-0 text-red-500" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-red-600">BAJA OPERACIONAL · {selected.code}</span>
            </div>
            <p className="text-[11px] font-semibold text-[#374151]">
              <span className="font-bold">{selected.name}</span> pasará a estado inactivo histórico.
              {selected.blockBase !== null && (
                <span className="ml-1 text-amber-700">El bloque {selected.blockBase} quedará disponible.</span>
              )}
            </p>
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#9ca3af]">Motivo (obligatorio)</span>
              <select value={reason} onChange={e => { setReason(e.target.value); setReasonError(""); }}
                className="rounded-xl border border-[#e4e9f0] bg-white px-3 py-2 text-[12px] font-semibold text-[#2F3E46] outline-none focus:border-red-400 focus:ring-1 focus:ring-red-400/20">
                <option value="" disabled>Seleccione motivo...</option>
                {BAJA_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {reasonError && <p className="text-[10px] font-semibold text-red-500">{reasonError}</p>}
            </div>
            <div className="flex gap-2">
              <button onClick={resetForm}
                className="flex h-9 flex-1 items-center justify-center rounded-lg border border-[#e4e9f0] bg-white text-[11px] font-semibold uppercase text-[#6b7280] transition hover:border-[#b0bac8]">
                Cancelar
              </button>
              <button onClick={handleConfirmBaja}
                className="flex h-9 flex-1 items-center justify-center rounded-lg bg-[#dc2626] text-[11px] font-bold uppercase tracking-wider text-white transition hover:bg-[#b91c1c] active:scale-[0.97]">
                Confirmar baja
              </button>
            </div>
          </div>
        )}

        {/* FORM create/edit */}
        {showForm && (
          <div className="flex flex-col gap-3">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">
              {panel === "create" ? "NUEVO OPERADOR" : "EDITAR OPERADOR"}
            </span>
            <div className="flex gap-3">
              <div className="flex w-24 flex-col gap-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">Código</span>
                <input type="text" value={editCode} maxLength={5} placeholder="FER"
                  onChange={e => { setEditCode(e.target.value.toUpperCase().slice(0, 5)); setBlockError(null); }}
                  onKeyDown={e => { if (e.key === "Enter" && canSave) handleSave(); if (e.key === "Escape") resetForm(); }}
                  className="rounded-xl border border-[#e4e9f0] bg-white px-3 py-2 text-[13px] font-bold uppercase text-[#2F3E46] outline-none focus:border-[#78C487] focus:ring-1 focus:ring-[#78C487]/20 placeholder:text-[#d1d9e1]"
                />
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">Nombre</span>
                <input autoFocus type="text" value={editName} placeholder="FERNANDO"
                  onChange={e => setEditName(e.target.value.toUpperCase())}
                  onKeyDown={e => { if (e.key === "Enter" && canSave) handleSave(); if (e.key === "Escape") resetForm(); }}
                  className="rounded-xl border border-[#e4e9f0] bg-white px-3 py-2 text-[13px] font-semibold uppercase text-[#2F3E46] outline-none focus:border-[#78C487] focus:ring-1 focus:ring-[#78C487]/20 placeholder:text-[#d1d9e1]"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">Rol</span>
                <select value={editRole} onChange={e => setEditRole(e.target.value)}
                  className="rounded-xl border border-[#e4e9f0] bg-white px-3 py-2 text-[12px] font-semibold text-[#2F3E46] outline-none focus:border-[#78C487] focus:ring-1 focus:ring-[#78C487]/20">
                  {ROLES_REF.map(r => <option key={r.code} value={r.code}>{r.code} — {r.name}</option>)}
                </select>
              </div>
              <div className="flex flex-1 flex-col gap-0.5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-[#9ca3af]">Bloque</span>
                <select value={editBlock ?? ""} onChange={e => { setEditBlock(e.target.value === "" ? null : Number(e.target.value)); setBlockError(null); }}
                  className="rounded-xl border border-[#e4e9f0] bg-white px-3 py-2 text-[12px] font-semibold text-[#2F3E46] outline-none focus:border-[#78C487] focus:ring-1 focus:ring-[#78C487]/20">
                  <option value="">Sin bloque</option>
                  {BLOCKS_REF.map(b => {
                    const taken = operators.some(o => o.id !== selectedId && o.blockBase === b && o.status !== "INACTIVO");
                    return <option key={b} value={b} disabled={taken}>BLOQUE {b}{taken ? " · OCUPADO" : ""}</option>;
                  })}
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={resetForm}
                className="flex h-9 flex-1 items-center justify-center rounded-lg border border-[#e4e9f0] bg-white text-[12px] font-semibold uppercase text-[#6b7280] transition hover:border-[#b0bac8]">
                Cancelar
              </button>
              <button onClick={handleSave} disabled={!canSave}
                className={`flex h-9 flex-1 items-center justify-center rounded-lg text-[12px] font-semibold uppercase tracking-wider text-white transition ${
                  canSave ? "bg-[#45b356] hover:bg-[#35994a] active:scale-[0.98]" : "cursor-not-allowed bg-[#45b356]/40"
                }`}>
                {panel === "create" ? "Crear" : "Guardar"}
              </button>
            </div>
          </div>
        )}

        {/* EMPTY */}
        {!showView && !showForm && !showConfirmSuspend && !showConfirmBaja && !blockError && (
          <div className="flex flex-col items-center justify-center gap-1.5 py-10 text-center">
            <Users size={22} strokeWidth={1.5} className="text-[#d1d9e1]" />
            <p className="text-[11px] font-semibold text-[#c0cad4]">Seleccione un operador</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// TAB 3 — HISTÓRICO OPERADORES
// ══════════════════════════════════════════════════════════════════════════

function TabHistorico() {
  const { operators, setOperatorStatus } = usePOS();

  const suspendidos = operators.filter(o => o.status === "SUSPENDIDO");
  const bajas       = operators.filter(o => o.status === "INACTIVO");

  function handleReactivar(op: OperatorRecord) {
    setOperatorStatus(op.id, "ACTIVO");
  }

  if (suspendidos.length === 0 && bajas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <ClipboardList size={28} strokeWidth={1.5} className="text-[#d1d9e1]" />
        <p className="text-[12px] font-semibold text-[#c0cad4]">Sin historial operacional</p>
        <p className="text-[11px] text-[#d1d9e1]">Operadores suspendidos o dados de baja aparecerán aquí</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-0 overflow-y-auto">

      {/* SUSPENDIDOS */}
      {suspendidos.length > 0 && (
        <>
          <div className="sticky top-0 z-10 border-b border-amber-100 bg-amber-50/70 px-4 py-1.5">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-600">
              <PauseCircle size={10} strokeWidth={2} />SUSPENDIDOS · {suspendidos.length}
            </span>
          </div>
          {suspendidos.map(op => (
            <div key={op.id} className="flex items-center gap-3 border-b border-amber-50 px-4 py-3">
              <PauseCircle size={14} strokeWidth={2} className="shrink-0 text-amber-400" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-700">
                    {op.code}
                  </span>
                  <span className="text-[12px] font-semibold text-[#374151]">{op.name}</span>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  {op.statusAt && (
                    <span className="text-[10px] text-[#9ca3af]">Desde {fmtDateShort(op.statusAt)}</span>
                  )}
                  {op.statusReason && (
                    <span className="text-[10px] text-[#9ca3af]">· {op.statusReason}</span>
                  )}
                  {op.blockBase !== null && (
                    <span className="text-[10px] text-amber-600/70">· BLQ {op.blockBase} asignado</span>
                  )}
                </div>
              </div>
              <button onClick={() => handleReactivar(op)}
                className="shrink-0 rounded-lg border border-[#78C487]/40 bg-[#f0fdf4] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-[#4a7a55] transition hover:bg-[#e8f5ea]">
                Reactivar
              </button>
            </div>
          ))}
        </>
      )}

      {/* BAJAS OPERACIONALES */}
      {bajas.length > 0 && (
        <>
          <div className="sticky top-0 z-10 border-b border-[#f0f4f8] bg-[#f8f9fb]/90 px-4 py-1.5">
            <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#9ca3af]">
              <Archive size={10} strokeWidth={2} />BAJA OPERACIONAL · {bajas.length}
            </span>
          </div>
          {bajas.map(op => (
            <div key={op.id} className="flex items-center gap-3 border-b border-[#f0f4f8] px-4 py-3 opacity-60">
              <Archive size={14} strokeWidth={1.5} className="shrink-0 text-[#b0bac8]" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-[#f0f4f8] px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-[#9ca3af]">
                    {op.code}
                  </span>
                  <span className="text-[12px] font-semibold text-[#9ca3af]">{op.name}</span>
                </div>
                <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                  {op.statusAt && (
                    <span className="text-[10px] text-[#b0bac8]">BAJA: {fmtDateShort(op.statusAt)}</span>
                  )}
                  {op.statusReason && (
                    <span className="text-[10px] text-[#b0bac8]">· {op.statusReason}</span>
                  )}
                  <span className="text-[10px] text-[#b0bac8]">· {ROLES_REF.find(r => r.code === op.roleCode)?.name ?? op.roleCode}</span>
                </div>
              </div>
              {op.blockAssignment?.assignedAt && (
                <div className="shrink-0 text-right">
                  <p className="text-[9px] text-[#c0cad4]">ÚLT. BLQ</p>
                  <p className="text-[10px] font-bold tabular-nums text-[#b0bac8]">
                    {op.blockAssignment.releasedAt
                      ? fmtDateShort(op.blockAssignment.releasedAt)
                      : "—"}
                  </p>
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════

export function OperadoresWorkspace() {
  const { operators } = usePOS();
  const [tab, setTab] = useState<InnerTab>("activos");

  const activos    = operators.filter(o => o.status === "ACTIVO").length;
  const suspendidos = operators.filter(o => o.status === "SUSPENDIDO").length;
  const bajas      = operators.filter(o => o.status === "INACTIVO").length;

  const TABS: { key: InnerTab; label: string; Icon: typeof Activity; count?: number }[] = [
    { key: "activos",   label: "ACTIVOS",   Icon: Activity,      count: activos    },
    { key: "gestion",   label: "GESTIÓN",   Icon: Users,         count: undefined  },
    { key: "historico", label: "HISTÓRICO", Icon: ClipboardList, count: suspendidos + bajas > 0 ? suspendidos + bajas : undefined },
  ];

  return (
    <section className="flex h-full w-full flex-col overflow-hidden rounded-[28px] border border-[#78C487]/40 bg-[#FDFCF9]">

      {/* SheetHeader */}
      <header className="shrink-0 border-b border-[#78C487]/15 bg-[#F5FBF5]">
        <div className="flex items-center gap-1 px-3 pt-2 pb-0">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 rounded-t-lg border-b-2 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition ${
                tab === t.key
                  ? "border-[#78C487] bg-white text-[#2d6640]"
                  : "border-transparent text-[#9ca3af] hover:text-[#6b7280]"
              }`}>
              <t.Icon size={11} strokeWidth={2} />
              {t.label}
              {t.count !== undefined && (
                <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold tabular-nums ${
                  tab === t.key ? "bg-[#e8f5ea] text-[#4a7a55]" : "bg-[#f0f4f8] text-[#b0bac8]"
                }`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Body */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {tab === "activos"   && <div className="overflow-y-auto"><TabActivos /></div>}
        {tab === "gestion"   && <TabGestion />}
        {tab === "historico" && <div className="overflow-y-auto"><TabHistorico /></div>}
      </div>

    </section>
  );
}
