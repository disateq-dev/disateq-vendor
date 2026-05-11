import { Package, Settings, ShoppingCart, Users } from "lucide-react";

export function ModulesBar() {
  return (
    <section className="flex h-[52px] items-end gap-1 border-t border-[#f1f4f7] px-3 pb-1">
      <button className="flex h-11 items-center gap-2 rounded-2xl border-b-2 border-[rgba(22,163,74,0.25)] bg-[rgba(22,163,74,0.045)] px-4 text-[14px] font-semibold text-[#15803d] shadow-[0_2px_8px_rgba(22,163,74,0.05)]">
        <ShoppingCart size={17} />
        <span>TURNO</span>
      </button>

      <button className="flex h-11 items-center gap-2 rounded-2xl border-b-2 border-transparent px-4 text-[14px] font-semibold text-[#475467] transition hover:border-[rgba(33,84,216,0.18)] hover:text-[#111827]">
        <Package size={17} />
        <span>VENTAS</span>
      </button>

      <button className="flex h-11 items-center gap-2 rounded-2xl border-b-2 border-transparent px-4 text-[14px] font-semibold text-[#475467] transition hover:border-[rgba(124,58,237,0.18)] hover:text-[#111827]">
        <Users size={17} />
        <span>CLIENTES</span>
      </button>

      <button className="flex h-11 items-center gap-2 rounded-2xl border-b-2 border-transparent px-4 text-[14px] font-semibold text-[#475467] transition hover:border-[rgba(217,119,6,0.18)] hover:text-[#111827]">
        <Package size={17} />
        <span>INVENTARIO</span>
      </button>

      <button className="flex h-11 items-center gap-2 rounded-2xl border-b-2 border-transparent px-4 text-[14px] font-semibold text-[#475467] transition hover:border-[rgba(71,84,103,0.18)] hover:text-[#111827]">
        <Settings size={17} />
        <span>CONFIGURACIÓN</span>
      </button>
    </section>
  );
}
