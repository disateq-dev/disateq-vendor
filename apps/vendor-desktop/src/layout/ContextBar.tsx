import { BarChart2, FileText, Percent, Plus } from "lucide-react";
import { usePOS } from "../context/POSContext";

export function ContextBar() {
  const { cashSession, sessionStats } = usePOS();
  const sessionActive = cashSession.isOpen;
  const { efe, yap, tar, mix } = sessionStats.byMethod;

  return (
    <section className="flex h-[44px] items-center gap-2 border-t border-[rgba(33,84,216,0.07)] bg-[linear-gradient(180deg,rgba(33,84,216,0.04)_0%,rgba(33,84,216,0.015)_100%)] px-3">
      {/* PRIMARY */}
      <button className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[12px] font-semibold transition ${
        sessionActive
          ? "bg-[#2154d8] text-white shadow-[0_2px_8px_rgba(33,84,216,0.22)] hover:bg-[#1a43b0]"
          : "bg-[#e8eef8] text-[#8fa3c8] cursor-default"
      }`}>
        <Plus size={13} strokeWidth={2.5} />
        <span>Nueva venta</span>
      </button>

      <div className="mx-1 h-5 w-px bg-[#e0e7f0]" />

      {/* SECONDARY PILLS */}
      <button className="flex items-center gap-1.5 rounded-xl border border-[#e4e7ec] bg-white px-3 py-1.5 text-[12px] font-medium text-[#374151] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-[#c7d7f4] hover:bg-[#f0f5ff] hover:text-[#2154d8]">
        <Percent size={13} strokeWidth={2} />
        <span>Descuento</span>
      </button>

      <button className="flex items-center gap-1.5 rounded-xl border border-[#e4e7ec] bg-white px-3 py-1.5 text-[12px] font-medium text-[#374151] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-[#c7d7f4] hover:bg-[#f0f5ff] hover:text-[#2154d8]">
        <FileText size={13} strokeWidth={2} />
        <span>Observación</span>
      </button>

      <button className="flex items-center gap-1.5 rounded-xl border border-[#e4e7ec] bg-white px-3 py-1.5 text-[12px] font-medium text-[#374151] shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition hover:border-[#c7d7f4] hover:bg-[#f0f5ff] hover:text-[#2154d8]">
        <BarChart2 size={13} strokeWidth={2} />
        <span>Reportes</span>
      </button>

      {/* TELEMETRÍA OPERACIONAL */}
      {sessionActive && (
        <div className="ml-auto flex items-center gap-3">
          <span className="text-[9.5px] font-bold uppercase tracking-[0.06em] text-[#374151]">
            CAJA {cashSession.cashBox?.code}
          </span>
          <span className="text-[#c0cad4]">·</span>
          <span className="select-none text-[9.5px] font-semibold tabular-nums text-[#9ca3af]">
            EFE {efe} · YAP {yap} · TAR {tar} · MIX {mix}
          </span>
        </div>
      )}
    </section>
  );
}
