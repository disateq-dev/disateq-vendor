import { Package, Settings, ShoppingCart, Users } from "lucide-react";
import { type ActiveModule } from "../App";

interface ModulesBarProps {
  active: ActiveModule;
  onChange: (m: ActiveModule) => void;
}

const ON_BLUE  = "flex h-11 items-center gap-2 rounded-2xl border-b-2 border-[rgba(33,84,216,0.3)] bg-[rgba(33,84,216,0.05)] px-4 text-[14px] font-semibold text-[#2154d8] shadow-[0_2px_8px_rgba(33,84,216,0.06)]";
const ON_GREEN = "flex h-11 items-center gap-2 rounded-2xl border-b-2 border-emerald-400/40 bg-emerald-50/70 px-4 text-[14px] font-semibold text-emerald-700 shadow-[0_2px_8px_rgba(5,150,105,0.08)]";
const OFF      = "flex h-11 items-center gap-2 rounded-2xl border-b-2 border-transparent px-4 text-[14px] font-semibold text-[#475467] transition hover:border-[rgba(33,84,216,0.15)] hover:text-[#111827]";

export function ModulesBar({ active, onChange }: ModulesBarProps) {
  return (
    <section className="flex h-[52px] items-end gap-1 border-t border-[#f1f4f7] px-3 pb-1">
      <button onClick={() => onChange("cash")} className={active === "cash" ? ON_GREEN : OFF}>
        <ShoppingCart size={17} />
        <span>TURNO</span>
      </button>

      <button onClick={() => onChange("sales")} className={active === "sales" ? ON_BLUE : OFF}>
        <Package size={17} />
        <span>VENTAS</span>
      </button>

      <button className={OFF}>
        <Users size={17} />
        <span>CLIENTES</span>
      </button>

      <button className={OFF}>
        <Package size={17} />
        <span>INVENTARIO</span>
      </button>

      <button className={OFF}>
        <Settings size={17} />
        <span>CONFIGURACIÓN</span>
      </button>
    </section>
  );
}
