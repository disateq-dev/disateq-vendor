import { ChevronDown } from "lucide-react";

export function ContextBar() {
  return (
    <section className="flex h-[48px] items-center gap-2 border-t border-[rgba(33,84,216,0.07)] bg-[linear-gradient(180deg,rgba(33,84,216,0.045)_0%,rgba(33,84,216,0.02)_100%)] px-3">
      <button className="rounded-xl px-4 py-2 text-[13px] font-medium text-[#2154d8] transition hover:bg-white/70">
        Nueva venta
      </button>

      <button className="rounded-xl px-4 py-2 text-[13px] font-medium text-[#2154d8] transition hover:bg-white/70">
        Descuento
      </button>

      <button className="rounded-xl px-4 py-2 text-[13px] font-medium text-[#2154d8] transition hover:bg-white/70">
        Nota
      </button>

      <button className="flex items-center gap-1 rounded-xl px-4 py-2 text-[13px] font-medium text-[#2154d8] transition hover:bg-white/70">
        <span>Reportes</span>
        <ChevronDown size={15} />
      </button>

      <button className="flex items-center gap-1 rounded-xl px-4 py-2 text-[13px] font-medium text-[#2154d8] transition hover:bg-white/70">
        <span>Más</span>
        <ChevronDown size={15} />
      </button>
    </section>
  );
}
