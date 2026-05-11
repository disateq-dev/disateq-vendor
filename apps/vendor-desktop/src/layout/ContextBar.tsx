import { ChevronDown } from "lucide-react";

export function ContextBar() {
  return (
    <section className="flex h-[48px] items-center gap-2 border-t border-[rgba(22,163,74,0.06)] bg-[linear-gradient(180deg,rgba(22,163,74,0.055)_0%,rgba(22,163,74,0.03)_100%)] px-3">
      <button className="rounded-xl px-4 py-2 text-[13px] font-medium text-[#166534] transition hover:bg-white/70">
        Abrir turno
      </button>

      <button className="rounded-xl px-4 py-2 text-[13px] font-medium text-[#166534] transition hover:bg-white/70">
        Cerrar turno
      </button>

      <button className="rounded-xl px-4 py-2 text-[13px] font-medium text-[#166534] transition hover:bg-white/70">
        Editar turno
      </button>

      <button className="flex items-center gap-1 rounded-xl px-4 py-2 text-[13px] font-medium text-[#166534] transition hover:bg-white/70">
        <span>Reportes</span>

        <ChevronDown size={15} />
      </button>

      <button className="flex items-center gap-1 rounded-xl px-4 py-2 text-[13px] font-medium text-[#166534] transition hover:bg-white/70">
        <span>Más</span>

        <ChevronDown size={15} />
      </button>
    </section>
  );
}
