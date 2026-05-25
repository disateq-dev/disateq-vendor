import { BarChart2, FileText, Percent, Plus } from "lucide-react";
import { usePOS } from "../context/POSContext";
import { type ActiveModule } from "../App";

interface ContextBarProps {
  activeModule: ActiveModule;
}

export function ContextBar({ activeModule }: ContextBarProps) {
  const { cashSession, sessionStats, newSale } = usePOS();
  const sessionActive = cashSession.isOpen;
  const { efe, yap, tar, mix } = sessionStats.byMethod;

  // VENTAS — paleta #4F7396
  if (activeModule === "sales") {
    return (
      <section className="flex h-[44px] items-center gap-2 border-t border-[#4F7396]/25 bg-[linear-gradient(180deg,rgba(79,115,150,0.07)_0%,rgba(79,115,150,0.02)_100%)] px-3">
        <button
          onClick={sessionActive ? newSale : undefined}
          className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[12px] font-semibold transition ${
            sessionActive
              ? "bg-[#4F7396] text-white shadow-[0_2px_8px_rgba(79,115,150,0.28)] hover:bg-[#3d5c7a]"
              : "bg-[rgba(79,115,150,0.15)] text-[#2d4f6b]/50 cursor-default"
          }`}
        >
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
      </section>
    );
  }

  // COMPROBANTES — paleta #C8EEF4 / #73C7D4
  if (activeModule === "comprobantes") {
    return (
      <section className="flex h-[44px] items-center gap-2 border-t border-[#73C7D4]/35 bg-[linear-gradient(180deg,rgba(200,238,244,0.45)_0%,rgba(200,238,244,0.15)_100%)] px-3">
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
      </section>
    );
  }

  return null;
}
