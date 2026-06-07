import { BarChart2, Boxes, FileText, Package, Settings, ShoppingCart, Users } from "lucide-react";
import { type ActiveModule } from "../App";
import { useCapacidad } from "../hooks/useCapacidad";
import { useContextoOperacional } from "../hooks/useContextoOperacional";

interface ModulesBarProps {
  active: ActiveModule;
  display: ActiveModule;
  onChange: (m: ActiveModule) => void;
  onHover: (m: ActiveModule | null) => void;
}

const BASE = "flex h-11 items-center gap-2 rounded-xl border-b-2 px-4 text-[14.5px] font-bold text-[#121416] transition-colors";
const OFF  = `${BASE} border-transparent hover:bg-white/60`;
const PH   = `${BASE} border-transparent opacity-40 cursor-default select-none`;

const ON: Record<ActiveModule, string> = {
  cash:           `${BASE} border-[#2A7CA8]  bg-[rgba(42,124,168,0.12)]`,
  sales:          `${BASE} border-[#45b356]  bg-[rgba(69,179,86,0.10)]`,
  clientes: `${BASE} border-[#1e7e4f]  bg-[rgba(30,126,79,0.10)]`,
  reportes: `${BASE} border-[#2154d8]  bg-[rgba(33,84,216,0.10)]`,
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
  void active;
  const puedeVerReportes = useCapacidad("ver_reportes");
  const puedeVerClientes = useCapacidad("gestionar_clientes");
  const contexto = useContextoOperacional();
  const puedeVerComprobantes = contexto !== null;
  const puedeVerAbastecimiento = useCapacidad("gestionar_inventarios");
  const puedeVerAjustes = useCapacidad("gestionar_operadores");
  return (
    <section
      className="flex h-[52px] items-end gap-1 bg-[#F0F2F5] px-3 pb-1"
      onMouseLeave={() => onHover(null)}
    >
      {/* ── Grupo 1 — Operación nuclear ─────────────────────── */}
      <button onClick={() => onChange("cash")} onMouseEnter={() => onHover("cash")} className={cls("cash", display)}>
        <ShoppingCart size={17} />
        <span>TURNO</span>
      </button>
      <button onClick={() => onChange("sales")} onMouseEnter={() => onHover("sales")} className={cls("sales", display)}>
        <Package size={17} />
        <span>VENTAS</span>
      </button>

      <Sep />

      {/* ── ABASTECIMIENTO ───────────────────────────────────── */}
      <button
        onClick={puedeVerAbastecimiento ? () => onChange("abastecimiento") : undefined}
        onMouseEnter={puedeVerAbastecimiento ? () => onHover("abastecimiento") : undefined}
        className={puedeVerAbastecimiento ? cls("abastecimiento", display) : PH}
        title={puedeVerAbastecimiento ? undefined : "Sin acceso — contacte al administrador"}
      >
        <Boxes size={17} />
        <span>ABASTECIMIENTO</span>
      </button>

      <Sep />

      {/* ── Grupo 3 — Relaciones ─────────────────────────────── */}
      <button
        onClick={puedeVerClientes ? () => onChange("clientes") : undefined}
        onMouseEnter={puedeVerClientes ? () => onHover("clientes") : undefined}
        className={puedeVerClientes ? cls("clientes", display) : PH}
        title={puedeVerClientes ? undefined : "Sin acceso — contacte al administrador"}
      >
        <Users size={17} />
        <span>CLIENTES</span>
      </button>
      <button
        onClick={puedeVerReportes ? () => onChange("reportes") : undefined}
        onMouseEnter={puedeVerReportes ? () => onHover("reportes") : undefined}
        className={puedeVerReportes ? cls("reportes", display) : PH}
        title={puedeVerReportes ? undefined : "Sin acceso — contacte al administrador"}
      >
        <BarChart2 size={17} />
        <span>REPORTES</span>
      </button>

      <Sep />

      {/* ── Grupo 4 — Capa normativa ─────────────────────────── */}
      <button
        onClick={puedeVerComprobantes ? () => onChange("comprobantes") : undefined}
        onMouseEnter={puedeVerComprobantes ? () => onHover("comprobantes") : undefined}
        className={puedeVerComprobantes ? cls("comprobantes", display) : PH}
        title={puedeVerComprobantes ? undefined : "Sin acceso — contacte al administrador"}
      >
        <FileText size={17} />
        <span>COMPROBANTES</span>
      </button>

      <Sep />

      {/* ── Grupo 5 — Sistema ────────────────────────────────── */}
      <button
        onClick={puedeVerAjustes ? () => onChange("config") : undefined}
        onMouseEnter={puedeVerAjustes ? () => onHover("config") : undefined}
        className={puedeVerAjustes ? cls("config", display) : PH}
        title={puedeVerAjustes ? undefined : "Sin acceso — contacte al administrador"}
      >
        <Settings size={17} />
        <span>AJUSTES</span>
      </button>
    </section>
  );
}
