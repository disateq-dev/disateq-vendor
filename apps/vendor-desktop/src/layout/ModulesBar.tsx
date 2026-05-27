import { BarChart2, Boxes, FileText, Package, Settings, ShoppingCart, Users } from "lucide-react";
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
  cash:           `${BASE} border-[#2A7CA8]  bg-[rgba(42,124,168,0.12)]`,
  sales:          `${BASE} border-[#45b356]  bg-[rgba(69,179,86,0.10)]`,
  comprobantes:   `${BASE} border-[#C05050]  bg-[rgba(192,80,80,0.10)]`,
  config:         `${BASE} border-[#697387]  bg-[rgba(105,115,135,0.10)]`,
  abastecimiento: `${BASE} border-[#3D8A8A]  bg-[rgba(61,138,138,0.10)]`,
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

      {/* ── ABASTECIMIENTO ───────────────────────────────────── */}
      <button onClick={() => onChange("abastecimiento")} onMouseEnter={() => onHover("abastecimiento")} className={cls("abastecimiento", display)}>
        <Boxes size={16} />
        <span>ABASTECIMIENTO</span>
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
