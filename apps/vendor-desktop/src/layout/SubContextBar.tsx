import { BarChart2, FileText, Percent, Plus } from "lucide-react";
import { usePOS } from "../context/POSContext";
import { useInventoryStore, deriveDisponibilidad, deriveEstado, deriveReservado } from "../domains/inventory/store";
import { usePurchasesStore } from "../domains/purchases/store";
import { type ActiveModule, type CashSubView, type AbastecimientoSubModule, type ConfigSubView } from "../App";

interface SubContextBarProps {
  activeModule: ActiveModule;
  displayModule: ActiveModule;
  visible: boolean;
  cashSubView: CashSubView;
  onCashSubViewChange: (sv: CashSubView) => void;
  abastecimientoSubModule: AbastecimientoSubModule;
  onAbastecimientoSubModuleChange: (sm: AbastecimientoSubModule) => void;
  configSubView: ConfigSubView;
  onConfigSubViewChange: (sv: ConfigSubView) => void;
}

const WITH_SUBOPTIONS = new Set<ActiveModule>(["sales", "comprobantes", "cash", "abastecimiento", "config"]);

const CASH_TABS: { key: CashSubView; label: string }[] = [
  { key: "turno",           label: "Gestión Turno"        },
  { key: "cajas",           label: "Gestión Cajas"         },
  { key: "corregir-arqueo", label: "Regularización Cajas"  },
];

const CONFIG_TABS: { key: ConfigSubView; label: string }[] = [
  { key: "negocio",     label: "Negocio"                  },
  { key: "operacion",   label: "Operación"                },
  { key: "roles",       label: "Roles operacionales"      },
  { key: "operadores",  label: "Operadores"               },
  { key: "capacidades", label: "Capacidades operacionales"},
  { key: "experiencia", label: "Experiencia"              },
  { key: "rubro",       label: "Rubro"                    },
];

const ABASTECIMIENTO_MODULES: { key: AbastecimientoSubModule; label: string; isPlaceholder?: boolean }[] = [
  { key: "compras",     label: "Compras"     },
  { key: "inventarios", label: "Inventarios" },
  { key: "proveedores", label: "Proveedores", isPlaceholder: true },
  { key: "traslados",   label: "Traslados",   isPlaceholder: true },
];

const SHELL: Record<ActiveModule, string> = {
  cash:           "border-t border-[#2A7CA8]/20 bg-[rgba(42,124,168,0.10)]",
  sales:          "border-t border-[#45b356]/20 bg-[rgba(69,179,86,0.08)]",
  comprobantes:   "border-t border-[#C05050]/20 bg-[rgba(192,80,80,0.08)]",
  config:         "border-t border-[#697387]/20 bg-[rgba(105,115,135,0.08)]",
  abastecimiento: "border-t border-[#3D8A8A]/20 bg-[rgba(61,138,138,0.08)]",
};

export function SubContextBar({ activeModule, displayModule, visible, cashSubView, onCashSubViewChange, abastecimientoSubModule, onAbastecimientoSubModuleChange, configSubView, onConfigSubViewChange }: SubContextBarProps) {
  const { cashSession, sessionStats } = usePOS();
  const { items: todosItems, movimientos, contexto, reservas } = useInventoryStore();
  const { compras } = usePurchasesStore();

  const comprasPendientes = compras.filter(c => c.estado === "registrada").length;
  const alertasInventario = todosItems.filter(i => !i.eliminado).filter(i => {
    const existencia = deriveDisponibilidad(movimientos, i.itemId);
    const reservado  = deriveReservado(reservas, i.itemId);
    const paraOperar = existencia - reservado;
    const umbral     = contexto.find(c => c.itemId === i.itemId)?.umbralMinimo ?? 0;
    const estado     = deriveEstado(paraOperar, umbral);
    return estado === "bajo_stock" || estado === "agotado";
  }).length;

  const sessionActive = cashSession.isOpen;
  const { efe, yap, tar, mix } = sessionStats.byMethod;
  const show = visible && WITH_SUBOPTIONS.has(displayModule);

  return (
    <section
      className={`
        overflow-hidden transition-all duration-200 ease-out
        ${show ? "max-h-[42px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"}
        ${SHELL[displayModule]}
      `}
    >
      <div className="flex h-[42px] items-center gap-2 px-3">

        {/* VENTAS */}
        {displayModule === "sales" && (
          <>
            <button className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[13.5px] font-semibold transition ${
              sessionActive
                ? "bg-[#45b356] text-white shadow-[0_2px_8px_rgba(69,179,86,0.22)] hover:bg-[#3a9348]"
                : "bg-[rgba(69,179,86,0.12)] text-[#2d5c33]/50 cursor-default"
            }`}>
              <Plus size={13} strokeWidth={2.5} />
              <span>Nueva venta</span>
            </button>

            <div className="mx-1 h-5 w-px bg-[#45b356]/20" />

            <button title="Próximamente" disabled className="flex items-center gap-1.5 rounded-xl border border-[#e4e7ec] bg-white px-3 py-1.5 text-[13.5px] font-semibold text-[#374151] opacity-40 cursor-not-allowed">
              <Percent size={13} strokeWidth={2} />
              <span>Descuento</span>
            </button>
            <button title="Próximamente" disabled className="flex items-center gap-1.5 rounded-xl border border-[#e4e7ec] bg-white px-3 py-1.5 text-[13.5px] font-semibold text-[#374151] opacity-40 cursor-not-allowed">
              <FileText size={13} strokeWidth={2} />
              <span>Observación</span>
            </button>
            <button title="Próximamente" disabled className="flex items-center gap-1.5 rounded-xl border border-[#e4e7ec] bg-white px-3 py-1.5 text-[13.5px] font-semibold text-[#374151] opacity-40 cursor-not-allowed">
              <BarChart2 size={13} strokeWidth={2} />
              <span>Reportes</span>
            </button>

            {sessionActive && (
              <div className="ml-auto flex items-center gap-3">
                <span className="text-[9.5px] font-bold uppercase tracking-[0.06em] text-[#2d5c33]">
                  CAJA {cashSession.cashBox?.code}
                </span>
                <span className="text-[#45b356]/40">·</span>
                <span className="select-none text-[9.5px] font-semibold tabular-nums text-[#9ca3af]">
                  EFE {efe} · YAP {yap} · TAR {tar} · MIX {mix}
                </span>
              </div>
            )}
          </>
        )}

        {/* COMPROBANTES */}
        {displayModule === "comprobantes" && (
          <>
            <span className="text-[13.5px] font-semibold text-[#7a2020]">
              Comprobantes Emitidos
            </span>
            {sessionActive && cashSession.cashBox && (
              <>
                <span className="text-[#C05050]/50">·</span>
                <span className="text-[11px] text-[#7a2020]/60">Sesión CAJA {cashSession.cashBox.code}</span>
              </>
            )}
          </>
        )}

        {/* CASH — sub-view tabs */}
        {displayModule === "cash" && (
          <div className="flex items-center gap-1">
            {CASH_TABS.map(({ key, label }) => {
              const isActive = activeModule === "cash" && cashSubView === key;
              return (
                <button
                  key={key}
                  onClick={() => { if (activeModule === "cash") onCashSubViewChange(key); }}
                  className={`rounded-lg px-3 py-1 text-[13.5px] font-semibold transition ${
                    isActive
                      ? "bg-[#2A7CA8] text-white shadow-sm"
                      : "text-[#1a5f7a]/70 hover:bg-[#2A7CA8]/10 hover:text-[#143d54]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* AJUSTES — sub-vistas operacionales */}
        {displayModule === "config" && (
          <div className="flex items-center gap-1">
            {CONFIG_TABS.map(({ key, label }) => {
              const isActive = activeModule === "config" && configSubView === key;
              return (
                <button
                  key={key}
                  onClick={() => { if (activeModule === "config") onConfigSubViewChange(key); }}
                  className={`rounded-lg px-3 py-1 text-[13.5px] font-semibold transition ${
                    isActive
                      ? "bg-[#697387] text-white shadow-sm"
                      : "text-[#697387]/70 hover:bg-[#697387]/10 hover:text-[#3d4554]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* ABASTECIMIENTO — solo tabs de dominio */}
        {displayModule === "abastecimiento" && (
          <div className="flex items-center gap-1">
            {ABASTECIMIENTO_MODULES.map(({ key, label, isPlaceholder }) => {
              const isActive = activeModule === "abastecimiento" && abastecimientoSubModule === key;
              const badge = key === "compras" ? comprasPendientes : key === "inventarios" ? alertasInventario : 0;

              if (isPlaceholder) {
                return (
                  <button key={key} type="button" title="Próximamente" tabIndex={-1}
                    className="rounded-lg px-3 py-1 text-[13.5px] font-bold opacity-35 cursor-default select-none text-[#276565]">
                    {label}
                  </button>
                );
              }

              return (
                <button
                  key={key}
                  onClick={() => { if (activeModule === "abastecimiento") onAbastecimientoSubModuleChange(key); }}
                  className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1 text-[13.5px] font-bold transition ${
                    isActive
                      ? "bg-[#3D8A8A] text-white shadow-sm"
                      : "text-[#276565]/70 hover:bg-[#3D8A8A]/10 hover:text-[#1a4545]"
                  }`}
                >
                  {label}
                  {badge > 0 && (
                    <span className={`rounded-full px-1.5 py-px text-[9px] font-bold leading-none tabular-nums ${
                      isActive ? "bg-white/25 text-white" : "bg-amber-500 text-white"
                    }`}>{badge}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}
