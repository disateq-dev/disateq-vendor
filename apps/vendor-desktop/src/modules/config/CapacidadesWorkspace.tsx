import { useState } from "react";
import { Sliders, Users, ChevronRight } from "lucide-react";
import { usePOS } from "../../context/POSContext";
import type { Operador } from "../../domains/operator/operator.store";

// ── catálogo de capacidades operacionales ────────────────────────────────

type ObservabilityLevel = "personal" | "contextual" | "supervisión" | "regularización";

export type CapabilityDef = {
  id: string;
  label: string;
  description: string;
  level: ObservabilityLevel;
};

export const CAPABILITIES: CapabilityDef[] = [
  {
    id:          "corregir_arqueos",
    label:       "Corregir arqueos",
    description: "Puede corregir arqueos de sesiones anteriores",
    level:       "regularización",
  },
  {
    id:          "reaperturar_cierres",
    label:       "Reaperturar cierres",
    description: "Puede reaperturar un cierre pendiente o con diferencias",
    level:       "regularización",
  },
  {
    id:          "regularizar_incidencias",
    label:       "Regularizar incidencias",
    description: "Puede regularizar incidencias operacionales registradas",
    level:       "regularización",
  },
  {
    id:          "observar_comprobantes_global",
    label:       "Comprobantes globales",
    description: "Puede observar comprobantes de todos los operadores",
    level:       "supervisión",
  },
  {
    id:          "anular_comprobantes",
    label:       "Anular comprobantes",
    description: "Puede anular comprobantes emitidos en el sistema",
    level:       "supervisión",
  },
  {
    id:          "observar_continuidad",
    label:       "Continuidad multioperador",
    description: "Puede observar la actividad de continuidad de todos los operadores",
    level:       "supervisión",
  },
];

const LEVEL_CFG: Record<ObservabilityLevel, { label: string; bg: string; text: string; dot: string }> = {
  personal:       { label: "personal",       bg: "bg-[#697387]/10", text: "text-[#697387]", dot: "bg-[#697387]"  },
  contextual:     { label: "contextual",     bg: "bg-[#2A7CA8]/10", text: "text-[#2A7CA8]", dot: "bg-[#2A7CA8]"  },
  supervisión:    { label: "supervisión",    bg: "bg-amber-100",    text: "text-amber-700",  dot: "bg-amber-500"  },
  regularización: { label: "regularización", bg: "bg-red-50",       text: "text-red-600",    dot: "bg-red-400"    },
};

// ── Panel izquierdo — selector de operador ───────────────────────────────

function PanelOperadores({ selectedId, onSelect }: {
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const { operators, roles } = usePOS();
  const visibles = operators.filter(o => o.estado !== "INACTIVO");

  return (
    <div className="flex w-[280px] shrink-0 flex-col overflow-hidden rounded-[28px] border border-[#697387]/40 bg-[#FDFCF9]">

      <div className="shrink-0 flex h-[42px] items-center gap-2 border-b border-[#697387]/15 bg-[#F3F4F6] px-4">
        <Users size={13} strokeWidth={2} className="shrink-0 text-[#697387]" />
        <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">OPERADORES</span>
        <span className="rounded-md bg-[#697387]/15 px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-[#697387]">{visibles.length}</span>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
        {visibles.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-14">
            <Users size={20} strokeWidth={1.5} className="text-[#d1d9e1]" />
            <p className="text-[10px] font-semibold text-[#c0cad4]">Sin operadores activos</p>
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-[#f0f4f8]">
            {visibles.map(op => {
              const isSel = op.id === selectedId;
              const role = roles.find(r => r.codigo === op.codigoRol);
              const roleCaps = new Set(role?.capacidades ?? []);
              const indivCaps = (op.capacidades ?? []).filter(c => !roleCaps.has(c));
              const totalEffective = new Set([...roleCaps, ...(op.capacidades ?? [])]).size;

              return (
                <div key={op.id} onClick={() => onSelect(op.id)}
                  className={`flex cursor-pointer items-center gap-2.5 border-l-2 px-3.5 py-2.5 transition ${
                    isSel ? "border-[#697387] bg-[#F3F4F6]" : "border-transparent hover:bg-[#F7F8FA]"
                  }`}>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold ${
                        isSel ? "bg-[#697387] text-white" : "bg-[#F3F4F6] text-[#697387]"
                      }`}>{op.codigo}</span>
                      <span className={`truncate text-[12px] font-semibold ${
                        isSel ? "text-[#121416]" : op.estado === "SUSPENDIDO" ? "text-[#9ca3af]" : "text-[#2F3E46]"
                      }`}>{op.nombreCompleto}</span>
                      {op.estado === "SUSPENDIDO" && (
                        <span className="shrink-0 rounded bg-amber-50 px-1 py-0.5 text-[8px] font-bold text-amber-500">SUSP</span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-1">
                      <span className="text-[9px] text-[#c0cad4]">{role?.nombre ?? op.codigoRol}</span>
                      {totalEffective > 0 && (
                        <>
                          <span className="text-[#d1d9e1]">·</span>
                          <span className="text-[9px] font-semibold text-[#697387]">{totalEffective} cap.</span>
                          {indivCaps.length > 0 && (
                            <span className="text-[9px] text-emerald-500">+{indivCaps.length} extra</span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={10} className={isSel ? "text-[#697387]" : "text-[#e4e9f0]"} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Panel derecho — capacidades del operador seleccionado ────────────────

function PanelCapacidades({ operator }: { operator: Operador | null }) {
  const { roles, updateOperatorCapabilities } = usePOS();

  if (!operator) {
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[#697387]/40 bg-[#FDFCF9]">
        <div className="shrink-0 flex h-[42px] items-center gap-2 border-b border-[#697387]/15 bg-[#F3F4F6] px-4">
          <Sliders size={13} strokeWidth={2} className="shrink-0 text-[#697387]" />
          <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">CAPACIDADES</span>
        </div>
        <div className="flex flex-col items-center justify-center gap-2 py-16">
          <Sliders size={20} strokeWidth={1.5} className="text-[#d1d9e1]" />
          <p className="text-[10px] font-semibold text-[#c0cad4]">Seleccione un operador</p>
        </div>
      </div>
    );
  }

  const role = roles.find(r => r.codigo === operator.codigoRol);
  const roleCaps = new Set(role?.capacidades ?? []);
  const indivCaps = new Set((operator.capacidades ?? []).filter(c => !roleCaps.has(c)));
  const totalEffective = new Set([...roleCaps, ...indivCaps]).size;

  function toggleIndividual(capId: string) {
    const next = new Set(indivCaps);
    if (next.has(capId)) { next.delete(capId); } else { next.add(capId); }
    updateOperatorCapabilities(operator.id, [...next]);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[#697387]/40 bg-[#FDFCF9]">

      <div className="shrink-0 flex h-[42px] items-center gap-2 border-b border-[#697387]/15 bg-[#F3F4F6] px-4">
        <Sliders size={13} strokeWidth={2} className="shrink-0 text-[#697387]" />
        <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416] leading-none">CAPACIDADES</span>
        <span className="text-[#697387]/30 mx-0.5">·</span>
        <span className="rounded bg-[#697387] px-1.5 py-0.5 text-[9px] font-bold text-white">{operator.codigo}</span>
        <span className="text-[12px] font-semibold text-[#697387]">{operator.nombreCompleto}</span>
        {totalEffective > 0 && (
          <span className="ml-auto rounded-md bg-[#697387]/15 px-1.5 py-0.5 text-[9px] font-bold tabular-nums text-[#697387]">
            {totalEffective} efectiva{totalEffective > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pt-4 pb-4 gap-2">

        {/* rol del operador */}
        <div className="flex items-center gap-2 rounded-xl border border-[#e4e9f0] bg-[#f8fafc] px-3 py-2 mb-1">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">Rol asignado</p>
            <p className="text-[11.5px] font-semibold text-[#374151]">{role?.nombre ?? operator.codigoRol}</p>
          </div>
          {roleCaps.size > 0 && (
            <span className="shrink-0 text-[9px] font-semibold text-[#697387]">{roleCaps.size} del rol</span>
          )}
        </div>

        {CAPABILITIES.map(cap => {
          const fromRole = roleCaps.has(cap.id);
          const isIndiv  = indivCaps.has(cap.id);
          const isOn     = fromRole || isIndiv;
          const lCfg     = LEVEL_CFG[cap.level];

          return (
            <div
              key={cap.id}
              onClick={() => { if (!fromRole) toggleIndividual(cap.id); }}
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 transition ${
                fromRole
                  ? "border-[#697387]/15 bg-[#697387]/4 cursor-default"
                  : isIndiv
                    ? "border-emerald-200/70 bg-emerald-50/40 cursor-pointer active:scale-[0.99] hover:border-emerald-200"
                    : "border-[#E9E4DC] bg-white cursor-pointer hover:border-[#697387]/20 hover:bg-[#697387]/3 active:scale-[0.99]"
              }`}
            >
              {/* toggle visual */}
              <div className={`shrink-0 flex h-5 w-9 items-center rounded-full transition-colors ${
                isOn ? (fromRole ? "bg-[#697387]" : "bg-emerald-500") : "bg-[#e4e9f0]"
              }`}>
                <div className={`h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
                  isOn ? "translate-x-[18px]" : "translate-x-[3px]"
                }`} />
              </div>

              {/* contenido */}
              <div className="flex-1 min-w-0">
                <p className={`text-[12px] font-semibold leading-none ${isOn ? "text-[#2F3E46]" : "text-[#9ca3af]"}`}>
                  {cap.label}
                </p>
                <p className="mt-0.5 text-[10px] text-[#9ca3af] leading-snug">{cap.description}</p>
              </div>

              <div className="shrink-0 flex items-center gap-1.5">
                {/* origen */}
                {fromRole && (
                  <span className="rounded-full bg-[#697387]/10 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-[#697387]">
                    del rol
                  </span>
                )}
                {isIndiv && (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide text-emerald-700">
                    adicional
                  </span>
                )}
                {/* nivel */}
                <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-wide ${lCfg.bg} ${lCfg.text}`}>
                  {lCfg.label}
                </span>
              </div>
            </div>
          );
        })}

        {/* leyenda */}
        <div className="mt-2 rounded-2xl border border-[#E9E4DC] bg-[#f8fafc] px-4 py-3">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#9ca3af] mb-1.5">Origen de capacidades</p>
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-4 rounded-full bg-[#697387]" />
              <span className="text-[9px] text-[#6b7280]">
                <span className="font-bold">Del rol</span> — otorgada por el rol asignado · no modificable aquí
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-4 rounded-full bg-emerald-500" />
              <span className="text-[9px] text-[#6b7280]">
                <span className="font-bold">Adicional</span> — capacidad extendida específica de este operador
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// CAPACIDADES WORKSPACE
// ══════════════════════════════════════════════════════════════════════════

export function CapacidadesWorkspace() {
  const { operators } = usePOS();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = operators.find(o => o.id === selectedId) ?? null;

  return (
    <section className="flex min-h-0 flex-1 gap-2">
      <PanelOperadores selectedId={selectedId} onSelect={setSelectedId} />
      <PanelCapacidades operator={selected} />
    </section>
  );
}
