import { BarChart2, FileText, Percent, Plus } from "lucide-react";
import { usePOS } from "../context/POSContext";
import { type ActiveModule, type CashSubView, type InventorySubView } from "../App";

interface SubContextBarProps {
  activeModule: ActiveModule;
  displayModule: ActiveModule;
  visible: boolean;
  cashSubView: CashSubView;
  onCashSubViewChange: (sv: CashSubView) => void;
  inventorySubView: InventorySubView;
  onInventorySubViewChange: (sv: InventorySubView) => void;
}

const WITH_SUBOPTIONS = new Set<ActiveModule>(["sales", "comprobantes", "cash", "inventory"]);

const CASH_TABS: { key: CashSubView; label: string }[] = [
  { key: "turno",      label: "GESTIÓN TURNO" },
  { key: "roles",      label: "ROLES"         },
  { key: "cajas",      label: "CAJAS"         },
  { key: "operadores", label: "OPERADORES"    },
];

const INVENTORY_TABS: { key: InventorySubView; label: string }[] = [
  { key: "disponibilidad", label: "DISPONIBILIDAD" },
  { key: "movimientos",    label: "MOVIMIENTOS"    },
  { key: "items",          label: "ÍTEMS"          },
];

// Fondo atenuado oficial por módulo — paleta DISATEQ base a baja opacidad
const SHELL: Record<ActiveModule, string> = {
  cash:         "border-t border-[#85C49C]/20 bg-[rgba(183,231,190,0.22)]",
  sales:        "border-t border-[#4F7396]/20 bg-[rgba(79,115,150,0.10)]",
  comprobantes: "border-t border-[#73C7D4]/20 bg-[rgba(200,238,244,0.30)]",
  config:       "border-t border-[#9B8BFF]/20 bg-[rgba(221,217,255,0.22)]",
  inventory:    "border-t border-[#C4844A]/20 bg-[rgba(196,132,74,0.10)]",
};

export function SubContextBar({ activeModule, displayModule, visible, cashSubView, onCashSubViewChange, inventorySubView, onInventorySubViewChange }: SubContextBarProps) {
  const { cashSession, sessionStats } = usePOS();
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
                ? "bg-[#4F7396] text-white shadow-[0_2px_8px_rgba(79,115,150,0.28)] hover:bg-[#3d5c7a]"
                : "bg-[rgba(79,115,150,0.15)] text-[#2d4f6b]/50 cursor-default"
            }`}>
              <Plus size={13} strokeWidth={2.5} />
              <span>Nueva venta</span>
            </button>

            <div className="mx-1 h-5 w-px bg-[#4F7396]/20" />

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
                <span className="text-[9.5px] font-bold uppercase tracking-[0.06em] text-[#2d4f6b]">
                  CAJA {cashSession.cashBox?.code}
                </span>
                <span className="text-[#4F7396]/40">·</span>
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
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#155866]">
              Comprobantes emitidos
            </span>
            {sessionActive && cashSession.cashBox && (
              <>
                <span className="text-[#73C7D4]/50">·</span>
                <span className="text-[11px] text-[#155866]/60">
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
                      ? "bg-[#85C49C] text-white shadow-sm"
                      : "text-[#4a7a55]/70 hover:bg-[#85C49C]/10 hover:text-[#2d6640]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

        {/* INVENTARIO — sub-view tabs */}
        {displayModule === "inventory" && (
          <div className="flex items-center gap-1">
            {INVENTORY_TABS.map(({ key, label }) => {
              const isActive = activeModule === "inventory" && inventorySubView === key;
              return (
                <button
                  key={key}
                  onClick={() => { if (activeModule === "inventory") onInventorySubViewChange(key); }}
                  className={`rounded-lg px-3 py-1 text-[11px] font-semibold uppercase tracking-wider transition ${
                    isActive
                      ? "bg-[#C4844A] text-white shadow-sm"
                      : "text-[#7a4f2d]/70 hover:bg-[#C4844A]/10 hover:text-[#5c3318]"
                  }`}
                >
                  {label}
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
