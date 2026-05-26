import { BarChart2, FileText, Percent, Plus } from "lucide-react";
import { usePOS } from "../context/POSContext";
import { useInventoryStore, deriveDisponibilidad, deriveEstado, deriveReservado } from "../domains/inventory/store";
import { usePurchasesStore } from "../domains/purchases/store";
import { type ActiveModule, type CashSubView, type InventorySubView, type PurchasesSubView } from "../App";

interface SubContextBarProps {
  activeModule: ActiveModule;
  displayModule: ActiveModule;
  visible: boolean;
  cashSubView: CashSubView;
  onCashSubViewChange: (sv: CashSubView) => void;
  inventorySubView: InventorySubView;
  onInventorySubViewChange: (sv: InventorySubView) => void;
  purchasesSubView: PurchasesSubView;
  onPurchasesSubViewChange: (sv: PurchasesSubView) => void;
}

const WITH_SUBOPTIONS = new Set<ActiveModule>(["sales", "comprobantes", "cash", "inventory", "purchases"]);

const PURCHASES_TABS: { key: PurchasesSubView; label: string }[] = [
  { key: "nueva",    label: "REGISTRAR INGRESO" },
  { key: "historial", label: "HISTORIAL"        },
];

const CASH_TABS: { key: CashSubView; label: string }[] = [
  { key: "turno",      label: "GESTIÓN TURNO" },
  { key: "roles",      label: "ROLES"         },
  { key: "cajas",      label: "CAJAS"         },
  { key: "operadores", label: "OPERADORES"    },
];

const INVENTORY_TABS: { key: InventorySubView; label: string }[] = [
  { key: "items",          label: "PRODUCTOS"   },
  { key: "movimientos",    label: "MOVIMIENTOS" },
  { key: "disponibilidad", label: "STOCK"       },
  { key: "reservas",       label: "SEPARADOS"   },
  { key: "reconciliacion", label: "CORREGIR"    },
];

// Fondo atenuado oficial por módulo — paleta DISATEQ base a baja opacidad
const SHELL: Record<ActiveModule, string> = {
  cash:         "border-t border-[#2A7CA8]/20 bg-[rgba(42,124,168,0.10)]",
  sales:        "border-t border-[#45b356]/20 bg-[rgba(69,179,86,0.08)]",
  comprobantes: "border-t border-[#C05050]/20 bg-[rgba(192,80,80,0.08)]",
  config:       "border-t border-[#697387]/20 bg-[rgba(105,115,135,0.08)]",
  inventory:    "border-t border-[#C4844A]/20 bg-[rgba(196,132,74,0.10)]",
  purchases:    "border-t border-[#6670A8]/20 bg-[rgba(102,112,168,0.08)]",
};

export function SubContextBar({ activeModule, displayModule, visible, cashSubView, onCashSubViewChange, inventorySubView, onInventorySubViewChange, purchasesSubView, onPurchasesSubViewChange }: SubContextBarProps) {
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
            <button className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[12px] font-semibold transition ${
              sessionActive
                ? "bg-[#45b356] text-white shadow-[0_2px_8px_rgba(69,179,86,0.22)] hover:bg-[#3a9348]"
                : "bg-[rgba(69,179,86,0.12)] text-[#2d5c33]/50 cursor-default"
            }`}>
              <Plus size={13} strokeWidth={2.5} />
              <span>Nueva venta</span>
            </button>

            <div className="mx-1 h-5 w-px bg-[#45b356]/20" />

            <button title="Próximamente" disabled className="flex items-center gap-1.5 rounded-xl border border-[#e4e7ec] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#374151] opacity-40 cursor-not-allowed">
              <Percent size={13} strokeWidth={2} />
              <span>Descuento</span>
            </button>

            <button title="Próximamente" disabled className="flex items-center gap-1.5 rounded-xl border border-[#e4e7ec] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#374151] opacity-40 cursor-not-allowed">
              <FileText size={13} strokeWidth={2} />
              <span>Observación</span>
            </button>

            <button title="Próximamente" disabled className="flex items-center gap-1.5 rounded-xl border border-[#e4e7ec] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#374151] opacity-40 cursor-not-allowed">
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
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#7a2020]">
              Comprobantes emitidos
            </span>
            {sessionActive && cashSession.cashBox && (
              <>
                <span className="text-[#C05050]/50">·</span>
                <span className="text-[11px] text-[#7a2020]/60">
                  Sesión CAJA {cashSession.cashBox.code}
                </span>
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
                  className={`rounded-lg px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition ${
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

        {/* COMPRAS — sub-view tabs */}
        {displayModule === "purchases" && (
          <div className="flex items-center gap-1">
            {PURCHASES_TABS.map(({ key, label }) => {
              const isActive = activeModule === "purchases" && purchasesSubView === key;
              const showBadge = key === "historial" && comprasPendientes > 0;
              return (
                <button
                  key={key}
                  onClick={() => { if (activeModule === "purchases") onPurchasesSubViewChange(key); }}
                  className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition ${
                    isActive
                      ? "bg-[#6670A8] text-white shadow-sm"
                      : "text-[#404787]/70 hover:bg-[#6670A8]/10 hover:text-[#2a2e6a]"
                  }`}
                >
                  {label}
                  {showBadge && (
                    <span className={`rounded-full px-1.5 py-px text-[9px] font-bold leading-none tabular-nums ${
                      isActive ? "bg-white/25 text-white" : "bg-amber-500 text-white"
                    }`}>
                      {comprasPendientes}
                    </span>
                  )}
                </button>
              );
            })}
            {import.meta.env.DEV && (
              <>
                <div className="h-4 w-px bg-[#6670A8]/20 mx-1" />
                <button
                  onClick={() => { if (activeModule === "purchases") onPurchasesSubViewChange("reset"); }}
                  className={`rounded-lg px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition ${
                    activeModule === "purchases" && purchasesSubView === "reset"
                      ? "bg-amber-400 text-white shadow-sm"
                      : "text-amber-600/70 hover:bg-amber-50 hover:text-amber-700"
                  }`}
                >
                  DEV·RESET
                </button>
              </>
            )}
          </div>
        )}

        {/* INVENTARIO — sub-view tabs */}
        {displayModule === "inventory" && (
          <div className="flex items-center gap-1">
            {INVENTORY_TABS.map(({ key, label }) => {
              const isActive = activeModule === "inventory" && inventorySubView === key;
              const showBadge = key === "disponibilidad" && alertasInventario > 0;
              return (
                <button
                  key={key}
                  onClick={() => { if (activeModule === "inventory") onInventorySubViewChange(key); }}
                  className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition ${
                    isActive
                      ? "bg-[#C4844A] text-white shadow-sm"
                      : "text-[#7a4f2d]/70 hover:bg-[#C4844A]/10 hover:text-[#5c3318]"
                  }`}
                >
                  {label}
                  {showBadge && (
                    <span className={`rounded-full px-1.5 py-px text-[9px] font-bold leading-none tabular-nums ${
                      isActive ? "bg-white/25 text-white" : "bg-red-500 text-white"
                    }`}>
                      {alertasInventario}
                    </span>
                  )}
                </button>
              );
            })}
            {import.meta.env.DEV && (
              <>
                <div className="h-4 w-px bg-[#C4844A]/20 mx-1" />
                <button
                  onClick={() => { if (activeModule === "inventory") onInventorySubViewChange("reset"); }}
                  className={`rounded-lg px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition ${
                    activeModule === "inventory" && inventorySubView === "reset"
                      ? "bg-amber-400 text-white shadow-sm"
                      : "text-amber-600/70 hover:bg-amber-50 hover:text-amber-700"
                  }`}
                >
                  DEV·RESET
                </button>
              </>
            )}
          </div>
        )}

      </div>
    </section>
  );
}
