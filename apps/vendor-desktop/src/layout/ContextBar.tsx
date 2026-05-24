import { BarChart2, FileText, Percent, Plus } from "lucide-react";
import { usePOS } from "../context/POSContext";
import { type ActiveModule } from "../App";

interface ContextBarProps {
  activeModule: ActiveModule;
}

export function ContextBar({ activeModule }: ContextBarProps) {
  const { cashSession, sessionStats } = usePOS();
  const sessionActive = cashSession.isOpen;
  const { efe, yap, tar, mix } = sessionStats.byMethod;

  // VENTAS — paleta #56C264
  if (activeModule === "sales") {
    return (
      <section className="flex h-[44px] items-center gap-2 border-t border-[#56C264]/25 bg-[linear-gradient(180deg,rgba(86,194,100,0.07)_0%,rgba(86,194,100,0.02)_100%)] px-3">
        <button className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[12px] font-semibold transition ${
          sessionActive
            ? "bg-[#56C264] text-white shadow-[0_2px_8px_rgba(86,194,100,0.28)] hover:bg-[#45b356]"
            : "bg-[#B7E7BE]/50 text-[#2d7a3a]/50 cursor-default"
        }`}>
          <Plus size={13} strokeWidth={2.5} />
          <span>Nueva venta</span>
        </button>

        <div className="mx-1 h-5 w-px bg-[#56C264]/20" />

        <button className="flex items-center gap-1.5 rounded-xl border border-[#e4e7ec] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#374151] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-[#56C264]/50 hover:bg-[#E8F5EA]/60 hover:text-[#1a5e28]">
          <Percent size={13} strokeWidth={2} />
          <span>Descuento</span>
        </button>

        <button className="flex items-center gap-1.5 rounded-xl border border-[#e4e7ec] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#374151] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-[#56C264]/50 hover:bg-[#E8F5EA]/60 hover:text-[#1a5e28]">
          <FileText size={13} strokeWidth={2} />
          <span>Observación</span>
        </button>

        <button className="flex items-center gap-1.5 rounded-xl border border-[#e4e7ec] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#374151] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-[#56C264]/50 hover:bg-[#E8F5EA]/60 hover:text-[#1a5e28]">
          <BarChart2 size={13} strokeWidth={2} />
          <span>Reportes</span>
        </button>

        {sessionActive && (
          <div className="ml-auto flex items-center gap-3">
            <span className="text-[9.5px] font-bold uppercase tracking-[0.06em] text-[#1a5e28]">
              CAJA {cashSession.cashBox?.code}
            </span>
            <span className="text-[#56C264]/40">·</span>
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
