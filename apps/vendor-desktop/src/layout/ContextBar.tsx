import { BarChart2, FileText, Percent, Plus } from "lucide-react";

export function ContextBar() {
  return (
    <section className="flex h-[44px] items-center gap-2 border-t border-[rgba(33,84,216,0.07)] bg-[linear-gradient(180deg,rgba(33,84,216,0.04)_0%,rgba(33,84,216,0.015)_100%)] px-3">
      {/* PRIMARY */}
      <button className="flex items-center gap-1.5 rounded-xl bg-[#2154d8] px-3.5 py-1.5 text-[12px] font-semibold text-white shadow-[0_2px_8px_rgba(33,84,216,0.22)] transition hover:bg-[#1a43b0]">
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
    </section>
  );
}
