import { BarChart2, FileText, Package, Settings, ShoppingBag, ShoppingCart, Truck, Users } from "lucide-react";
import { type ActiveModule } from "../App";

interface ModulesBarProps {
  active: ActiveModule;
  display: ActiveModule;
  onChange: (m: ActiveModule) => void;
  onHover: (m: ActiveModule | null) => void;
}

const BASE = "flex h-11 items-center gap-2 rounded-xl border-b-2 px-4 text-[15px] font-bold text-[#121416] transition-colors";
const OFF  = `${BASE} border-transparent hover:bg-white/60`;
const PH   = `${BASE} border-transparent opacity-40 cursor-default select-none`;

const ON: Record<ActiveModule, string> = {
  cash:         `${BASE} border-[#78C487]  bg-[rgba(120,196,135,0.18)]`,
  sales:        `${BASE} border-[#4F7396]  bg-[rgba(79,115,150,0.12)]`,
  comprobantes: `${BASE} border-[#73C7D4]  bg-[rgba(115,199,212,0.18)]`,
  config:       `${BASE} border-[#9B8BFF]  bg-[rgba(155,139,255,0.15)]`,
  inventory:    `${BASE} border-[#C4844A]  bg-[rgba(196,132,74,0.12)]`,
};

function cls(m: ActiveModule, display: ActiveModule): string {
  return display === m ? ON[m] : OFF;
}

function Sep() {
  return <div className="mx-0.5 h-5 w-px self-center bg-[#d1d5db]/80" />;
}

export function ModulesBar({ active, display, onChange, onHover }: ModulesBarProps) {
  return (
    <section
      className="flex h-[52px] items-end gap-1 bg-[#F0F2F5] px-3 pb-1"
      onMouseLeave={() => onHover(null)}
    >
      {/* ── Grupo 1 — Operación nuclear ─────────────────────── */}
      <button onClick={() => onChange("cash")} onMouseEnter={() => onHover("cash")} className={cls("cash", display)}>
        <ShoppingCart size={16} />
        <span>TURNO</span>
      </button>
      <button onClick={() => onChange("sales")} onMouseEnter={() => onHover("sales")} className={cls("sales", display)}>
        <Package size={16} />
        <span>VENTAS</span>
      </button>

      <Sep />

      {/* ── Grupo 2 — Stock y abastecimiento ────────────────── */}
      <button onClick={() => onChange("inventory")} onMouseEnter={() => onHover("inventory")} className={cls("inventory", display)}>
        <Package size={16} />
        <span>INVENTARIOS</span>
      </button>
      <button type="button" title="Próximamente" tabIndex={-1} className={PH}>
        <ShoppingBag size={16} />
        <span>COMPRAS</span>
      </button>
      <button type="button" title="Próximamente" tabIndex={-1} className={PH}>
        <Truck size={16} />
        <span>PROVEEDORES</span>
      </button>

      <Sep />

      {/* ── Grupo 3 — Relaciones ─────────────────────────────── */}
      <button type="button" title="Próximamente" tabIndex={-1} className={PH}>
        <Users size={16} />
        <span>CLIENTES</span>
      </button>
      <button type="button" title="Próximamente" tabIndex={-1} className={PH}>
        <BarChart2 size={16} />
        <span>REPORTES</span>
      </button>

      <Sep />

      {/* ── Grupo 4 — Capa normativa ─────────────────────────── */}
      <button onClick={() => onChange("comprobantes")} onMouseEnter={() => onHover("comprobantes")} className={cls("comprobantes", display)}>
        <FileText size={16} />
        <span>COMPROBANTES</span>
      </button>

      <Sep />

      {/* ── Grupo 5 — Sistema ────────────────────────────────── */}
      <button onClick={() => onChange("config")} onMouseEnter={() => onHover("config")} className={cls("config", display)}>
        <Settings size={16} />
        <span>CONFIG</span>
      </button>
    </section>
  );
}
