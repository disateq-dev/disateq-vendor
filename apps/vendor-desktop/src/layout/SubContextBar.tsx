import { BarChart2, FileText, Percent, Plus } from "lucide-react";
import { usePOS } from "../context/POSContext";
import { type ActiveModule, type CashSubView } from "../App";

interface SubContextBarProps {
  activeModule: ActiveModule;
  displayModule: ActiveModule;
  visible: boolean;
  cashSubView: CashSubView;
  onCashSubViewChange: (sv: CashSubView) => void;
}

const WITH_SUBOPTIONS = new Set<ActiveModule>(["sales", "comprobantes", "cash"]);

const CASH_TABS: { key: CashSubView; label: string }[] = [
  { key: "turno",      label: "GESTIÓN TURNO" },
  { key: "roles",      label: "ROLES"         },
  { key: "cajas",      label: "CAJAS"         },
  { key: "operadores", label: "OPERADORES"    },
];

// Fondo atenuado oficial por módulo — paleta DISATEQ base a baja opacidad
const SHELL: Record<ActiveModule, string> = {
  cash:         "border-t border-[#78C487]/20 bg-[rgba(183,231,190,0.22)]",
  sales:        "border-t border-[#F2A900]/20 bg-[rgba(255,211,92,0.16)]",
  comprobantes: "border-t border-[#73C7D4]/20 bg-[rgba(200,238,244,0.30)]",
  config:       "border-t border-[#9B8BFF]/20 bg-[rgba(221,217,255,0.22)]",
};

export function SubContextBar({ activeModule, displayModule, visible, cashSubView, onCashSubViewChange }: SubContextBarProps) {
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
                ? "bg-[#F2A900] text-white shadow-[0_2px_8px_rgba(242,169,0,0.25)] hover:bg-[#d49400]"
                : "bg-[#FFE8A3]/40 text-[#b87d00]/50 cursor-default"
            }`}>
              <Plus size={13} strokeWidth={2.5} />
              <span>Nueva venta</span>
            </button>

            <div className="mx-1 h-5 w-px bg-[#FFD35C]/30" />

            <button className="flex items-center gap-1.5 rounded-xl border border-[#e4e7ec] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#374151] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-[#FFD35C] hover:bg-[#FFF7CF]/50 hover:text-[#6b4500]">
              <Percent size={13} strokeWidth={2} />
              <span>Descuento</span>
            </button>

            <button className="flex items-center gap-1.5 rounded-xl border border-[#e4e7ec] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#374151] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-[#FFD35C] hover:bg-[#FFF7CF]/50 hover:text-[#6b4500]">
              <FileText size={13} strokeWidth={2} />
              <span>Observación</span>
            </button>

            <button className="flex items-center gap-1.5 rounded-xl border border-[#e4e7ec] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#374151] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-[#FFD35C] hover:bg-[#FFF7CF]/50 hover:text-[#6b4500]">
              <BarChart2 size={13} strokeWidth={2} />
              <span>Reportes</span>
            </button>

            {sessionActive && (
              <div className="ml-auto flex items-center gap-3">
                <span className="text-[9.5px] font-bold uppercase tracking-[0.06em] text-[#6b4500]">
                  CAJA {cashSession.cashBox?.code}
                </span>
                <span className="text-[#F2A900]/40">·</span>
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
                      ? "bg-[#78C487] text-white shadow-sm"
                      : "text-[#4a7a55]/70 hover:bg-[#78C487]/10 hover:text-[#2d6640]"
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        )}

      </div>
    </section>
  );
}
