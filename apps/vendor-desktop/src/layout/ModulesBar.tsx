import { FileText, Package, Settings, ShoppingCart, Users } from "lucide-react";
import { type ActiveModule } from "../App";

interface ModulesBarProps {
  active: ActiveModule;
  onChange: (m: ActiveModule) => void;
  onHover: (m: ActiveModule | null) => void;
}

const BASE = "flex h-11 items-center gap-2 rounded-xl border-b-2 px-4 text-[15px] font-bold text-[#121416] transition-colors";
const OFF  = `${BASE} border-transparent hover:bg-white/60`;

// Paleta contextual oficial DISATEQ — sobre fondo claro #F0F2F5
const ON: Record<ActiveModule, string> = {
  cash:         `${BASE} border-[#78C487]  bg-[rgba(120,196,135,0.18)]`,
  sales:        `${BASE} border-[#F2A900]  bg-[rgba(242,169,0,0.14)]`,
  comprobantes: `${BASE} border-[#73C7D4]  bg-[rgba(115,199,212,0.18)]`,
  config:       `${BASE} border-[#9B8BFF]  bg-[rgba(155,139,255,0.15)]`,
};

export function ModulesBar({ active, onChange, onHover }: ModulesBarProps) {
  return (
    <section
      className="flex h-[52px] items-end gap-1 bg-[#F0F2F5] px-3 pb-1"
      onMouseLeave={() => onHover(null)}
    >
      <button onClick={() => onChange("cash")} onMouseEnter={() => onHover("cash")} className={active === "cash" ? ON.cash : OFF}>
        <ShoppingCart size={16} />
        <span>TURNO</span>
      </button>

      <button onClick={() => onChange("sales")} onMouseEnter={() => onHover("sales")} className={active === "sales" ? ON.sales : OFF}>
        <Package size={16} />
        <span>VENTAS</span>
      </button>

      <button onClick={() => onChange("comprobantes")} onMouseEnter={() => onHover("comprobantes")} className={active === "comprobantes" ? ON.comprobantes : OFF}>
        <FileText size={16} />
        <span>COMPROBANTES</span>
      </button>

      <button className={OFF}>
        <Users size={16} />
        <span>CLIENTES</span>
      </button>

      <button className={OFF}>
        <Package size={16} />
        <span>INVENTARIO</span>
      </button>

      <button onClick={() => onChange("config")} onMouseEnter={() => onHover("config")} className={active === "config" ? ON.config : OFF}>
        <Settings size={16} />
        <span>AJUSTES</span>
      </button>
    </section>
  );
}
