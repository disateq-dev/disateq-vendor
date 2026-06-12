import { useState, useEffect, useRef } from "react";
import { BarChart2, Boxes, ChevronRight, FileText, Package, Settings, ShoppingCart, Users } from "lucide-react";
import { type ActiveModule, type CashSubView, type AbastecimientoSubModule, type ConfigSubView } from "../App";
import { useCapacidad } from "../hooks/useCapacidad";
import { useContextoOperacional } from "../hooks/useContextoOperacional";

// ── Módulos que tienen subtabs activos ────────────────────────
const CON_SUBTABS = new Set<ActiveModule>(["cash", "abastecimiento", "config"]);

// ── Orden visual de módulos en la ContextBar ──────────────────
const MODULES_ORDER: ActiveModule[] = [
  "cash", "sales", "abastecimiento", "clientes", "reportes", "comprobantes", "config",
];

// ── Props ─────────────────────────────────────────────────────
interface ContextBarProps {
  active: ActiveModule;
  onChange: (m: ActiveModule) => void;
  onHover: (m: ActiveModule | null) => void;
  cashSubView: CashSubView;
  onCashSubViewChange: (sv: CashSubView) => void;
  abastecimientoSubModule: AbastecimientoSubModule;
  onAbastecimientoSubModuleChange: (sm: AbastecimientoSubModule) => void;
  configSubView: ConfigSubView;
  onConfigSubViewChange: (sv: ConfigSubView) => void;
}

// ── Identidad visual — módulos ────────────────────────────────
// Base: sin cuadros, sin bordes laterales, sin rings
// Activo: solo línea inferior 3px + fondo sutil del color del módulo
const BASE_MOD = "flex h-11 items-center gap-1.5 px-3 text-[14.5px] font-bold text-[#121416] transition-all select-none border-b-[3px]";
const MOD_OFF  = `${BASE_MOD} border-transparent text-[#121416]/70 hover:text-[#121416] hover:border-[#d1d5db]`;
const MOD_PH   = `${BASE_MOD} border-transparent opacity-30 cursor-default`;

const MOD_ON: Record<ActiveModule, string> = {
  cash:           `${BASE_MOD} border-[#2A7CA8]  bg-[rgba(42,124,168,0.08)]`,
  sales:          `${BASE_MOD} border-[#45b356]  bg-[rgba(69,179,86,0.07)]`,
  clientes:       `${BASE_MOD} border-[#1e7e4f]  bg-[rgba(30,126,79,0.07)]`,
  reportes:       `${BASE_MOD} border-[#2154d8]  bg-[rgba(33,84,216,0.07)]`,
  comprobantes:   `${BASE_MOD} border-[#C05050]  bg-[rgba(192,80,80,0.07)]`,
  config:         `${BASE_MOD} border-[#697387]  bg-[rgba(105,115,135,0.07)]`,
  abastecimiento: `${BASE_MOD} border-[#3D8A8A]  bg-[rgba(61,138,138,0.07)]`,
};

// ── Identidad visual — pills de subtabs ───────────────────────
const PILL_ON: Record<ActiveModule, string> = {
  cash:           "bg-[#2A7CA8] text-white",
  sales:          "bg-[#45b356] text-white",
  clientes:       "bg-[#1e7e4f] text-white",
  reportes:       "bg-[#2154d8] text-white",
  comprobantes:   "bg-[#C05050] text-white",
  config:         "bg-[#697387] text-white",
  abastecimiento: "bg-[#3D8A8A] text-white",
};

// ── Cursor de navegación — línea inferior punteada por módulo ─
// Mismo patrón que MOD_ON pero con opacidad reducida en la línea
const NAV_FOCUS: Record<ActiveModule, string> = {
  cash:           `${BASE_MOD} border-[#2A7CA8]/50 bg-[rgba(42,124,168,0.05)]`,
  sales:          `${BASE_MOD} border-[#45b356]/50  bg-[rgba(69,179,86,0.04)]`,
  clientes:       `${BASE_MOD} border-[#1e7e4f]/50  bg-[rgba(30,126,79,0.04)]`,
  reportes:       `${BASE_MOD} border-[#2154d8]/50  bg-[rgba(33,84,216,0.04)]`,
  comprobantes:   `${BASE_MOD} border-[#C05050]/50  bg-[rgba(192,80,80,0.04)]`,
  config:         `${BASE_MOD} border-[#697387]/50  bg-[rgba(105,115,135,0.04)]`,
  abastecimiento: `${BASE_MOD} border-[#3D8A8A]/50  bg-[rgba(61,138,138,0.04)]`,
};

const PILL_OFF: Record<ActiveModule, string> = {
  cash:           "text-[#1a5f7a]/60 hover:text-[#1a5f7a]",
  sales:          "text-[#2d5c33]/60 hover:text-[#2d5c33]",
  clientes:       "text-[#1e7e4f]/60 hover:text-[#1e7e4f]",
  reportes:       "text-[#2154d8]/60 hover:text-[#2154d8]",
  comprobantes:   "text-[#7a2020]/60 hover:text-[#7a2020]",
  config:         "text-[#697387]/60 hover:text-[#697387]",
  abastecimiento: "text-[#276565]/60 hover:text-[#276565]",
};

// ── Separador entre módulos ───────────────────────────────────
function ModSep() {
  return <div className="mx-1 h-5 w-px self-center bg-[#d1d5db]/60" />;
}

// ── Definición de subtabs por módulo ─────────────────────────
const CASH_TABS: { key: CashSubView; label: string }[] = [
  { key: "turno",            label: "Gestión"      },
  { key: "cajas",            label: "Cajas"        },
  { key: "supervision-caja", label: "Supervisión"  },
];

const CONFIG_TABS: { key: ConfigSubView; label: string }[] = [
  { key: "negocio",     label: "Negocio"     },
  { key: "operacion",   label: "Operación"   },
  { key: "roles",       label: "Roles"       },
  { key: "operadores",  label: "Operadores"  },
  { key: "capacidades", label: "Capacidades" },
  { key: "experiencia", label: "Experiencia" },
  { key: "rubro",       label: "Rubro"       },
];

const ABAST_TABS: { key: AbastecimientoSubModule; label: string; placeholder?: boolean }[] = [
  { key: "compras",     label: "Compras"     },
  { key: "inventarios", label: "Inventarios" },
  { key: "proveedores", label: "Proveedores", placeholder: true },
  { key: "traslados",   label: "Traslados",   placeholder: true },
];

// ── CONTEXT BAR ───────────────────────────────────────────────
export function ContextBar({
  active, onChange, onHover,
  cashSubView, onCashSubViewChange,
  abastecimientoSubModule, onAbastecimientoSubModuleChange,
  configSubView, onConfigSubViewChange,
}: ContextBarProps) {
  const puedeVerReportes       = useCapacidad("ver_reportes");
  const puedeVerClientes       = useCapacidad("gestionar_clientes");
  const contexto               = useContextoOperacional();
  const puedeVerComprobantes   = contexto !== null;
  const puedeVerAbastecimiento = useCapacidad("gestionar_inventarios");
  const puedeVerAjustes        = useCapacidad("gestionar_operadores");
  const puedeSupervisarCaja    = useCapacidad("reaperturar_cierres");

  // Estado de expansión — independiente de activeModule
  const [expanded, setExpanded] = useState<ActiveModule | null>(null);
  const [focusedPillIdx, setFocusedPillIdx] = useState<number>(0);
  const [navMode, setNavMode] = useState(false);
  const [navIdx, setNavIdx]   = useState(0);

  // Refs — lectura fresca en el handler sin stale closures
  const stateRef = useRef({ navMode, navIdx, expanded, focusedPillIdx, active });
  useEffect(() => {
    stateRef.current = { navMode, navIdx, expanded, focusedPillIdx, active };
  });
  const accessRef = useRef({ puedeVerAbastecimiento, puedeVerClientes, puedeVerReportes, puedeVerComprobantes, puedeVerAjustes, puedeSupervisarCaja });
  useEffect(() => {
    accessRef.current = { puedeVerAbastecimiento, puedeVerClientes, puedeVerReportes, puedeVerComprobantes, puedeVerAjustes, puedeSupervisarCaja };
  });

  // Sincronizar: si el módulo activo no tiene subtabs, colapsar
  useEffect(() => {
    if (!CON_SUBTABS.has(active)) setExpanded(null);
  }, [active]);

  // Notificar al shell si navMode está activo — para que Escape no interfiera
  useEffect(() => {
    document.dispatchEvent(new CustomEvent("pos:navMode", { detail: { active: navMode } }));
  }, [navMode]);

  // ── Refs de callbacks para evitar stale closures ──────────
  const onChangeRef                        = useRef(onChange);
  const onCashSubViewChangeRef             = useRef(onCashSubViewChange);
  const onConfigSubViewChangeRef           = useRef(onConfigSubViewChange);
  const onAbastecimientoSubModuleChangeRef = useRef(onAbastecimientoSubModuleChange);
  useEffect(() => {
    onChangeRef.current                        = onChange;
    onCashSubViewChangeRef.current             = onCashSubViewChange;
    onConfigSubViewChangeRef.current           = onConfigSubViewChange;
    onAbastecimientoSubModuleChangeRef.current = onAbastecimientoSubModuleChange;
  });

  // ── Shortcuts globales — handler registrado una sola vez ──
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const s   = stateRef.current;
      const acc = accessRef.current;

      function tieneAcceso(m: ActiveModule): boolean {
        if (m === "abastecimiento") return acc.puedeVerAbastecimiento;
        if (m === "clientes")       return acc.puedeVerClientes;
        if (m === "reportes")       return acc.puedeVerReportes;
        if (m === "comprobantes")   return acc.puedeVerComprobantes;
        if (m === "config")         return acc.puedeVerAjustes;
        return true;
      }

      // ── Shift+Enter — toggle modo navegación ContextBar ────
      if (e.shiftKey && !e.ctrlKey && !e.altKey && e.code === "Enter") {
        e.preventDefault();
        if (s.navMode) {
          setNavMode(false);
          setNavIdx(0);
          if (s.expanded) { setExpanded(null); setFocusedPillIdx(0); }
        } else {
          const currentIdx = MODULES_ORDER.indexOf(s.active);
          setNavIdx(currentIdx >= 0 ? currentIdx : 0);
          setNavMode(true);
        }
        return;
      }

      // ── Escape ─────────────────────────────────────────────
      // Desde SubContextBar expandida → vuelve a navMode en módulo expandido
      // Desde navMode → desactiva modo navegación completamente
      if (e.code === "Escape") {
        if (s.expanded && !s.navMode) {
          // Estaba en pills → volver a navMode con foco en el módulo expandido
          e.preventDefault();
          const idx = MODULES_ORDER.indexOf(s.expanded);
          setNavIdx(idx >= 0 ? idx : 0);
          setExpanded(null);
          setFocusedPillIdx(0);
          setNavMode(true);
          return;
        }
        if (s.navMode) {
          // Estaba en navMode → desactivar completamente
          e.preventDefault();
          setNavMode(false);
          setNavIdx(0);
          return;
        }
      }

      // ── Navegación en modo ContextBar ──────────────────────
      if (s.navMode && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        if (e.code === "ArrowRight") {
          e.preventDefault();
          let next = (s.navIdx + 1) % MODULES_ORDER.length;
          let guard = 0;
          while (!tieneAcceso(MODULES_ORDER[next]) && guard++ < MODULES_ORDER.length)
            next = (next + 1) % MODULES_ORDER.length;
          setNavIdx(next);
          return;
        }
        if (e.code === "ArrowLeft") {
          e.preventDefault();
          let prev = (s.navIdx - 1 + MODULES_ORDER.length) % MODULES_ORDER.length;
          let guard = 0;
          while (!tieneAcceso(MODULES_ORDER[prev]) && guard++ < MODULES_ORDER.length)
            prev = (prev - 1 + MODULES_ORDER.length) % MODULES_ORDER.length;
          setNavIdx(prev);
          return;
        }
        if (e.code === "Enter") {
          e.preventDefault();
          const target = MODULES_ORDER[s.navIdx];
          if (!tieneAcceso(target)) return;
          setNavMode(false);
          setNavIdx(0);
          if (CON_SUBTABS.has(target)) {
            setExpanded(target);
            setFocusedPillIdx(0);
          } else {
            setExpanded(null);
          }
          onChangeRef.current(target);
          return;
        }
      }

      // ── ←→ Enter — navegar pills cuando hay expanded ───────
      if (!s.navMode && !e.ctrlKey && !e.altKey && !e.shiftKey && s.expanded) {
        const tabs = s.expanded === "cash"
          ? CASH_TABS.filter(t => t.key !== "supervision-caja" || acc.puedeSupervisarCaja)
          : s.expanded === "config"
            ? CONFIG_TABS
            : ABAST_TABS.filter(t => !t.placeholder);

        if (e.code === "ArrowRight") {
          e.preventDefault();
          setFocusedPillIdx(i => (i + 1) % tabs.length);
          return;
        }
        if (e.code === "ArrowLeft") {
          e.preventDefault();
          setFocusedPillIdx(i => (i - 1 + tabs.length) % tabs.length);
          return;
        }
        if (e.code === "Enter") {
          e.preventDefault();
          const tab = tabs[s.focusedPillIdx];
          if (!tab) return;
          if (s.expanded === "cash")
            onCashSubViewChangeRef.current(tab.key as CashSubView);
          else if (s.expanded === "config")
            onConfigSubViewChangeRef.current(tab.key as ConfigSubView);
          else if (s.expanded === "abastecimiento")
            onAbastecimientoSubModuleChangeRef.current(tab.key as AbastecimientoSubModule);
          return;
        }
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []); // array vacío — handler registrado una sola vez, lee siempre por refs

  // ── Handler de click en módulo ────────────────────────────
  function handleModuleClick(m: ActiveModule, tieneAcceso = true) {
    if (!tieneAcceso) return;
    if (CON_SUBTABS.has(m)) {
      if (expanded === m) {
        setExpanded(null);
        setFocusedPillIdx(0);
      } else {
        setExpanded(m);
        setFocusedPillIdx(0);
        onChange(m);
      }
    } else {
      setExpanded(null);
      setFocusedPillIdx(0);
      onChange(m);
    }
  }

  // ── Pills de subtabs según módulo expandido ───────────────
  function renderPills() {
    if (!expanded) return null;

    let tabs: { key: string; label: string; placeholder?: boolean }[] = [];
    let isActiveTab: (key: string) => boolean = () => false;
    let onTabClick: (key: string) => void = () => {};

    if (expanded === "cash") {
      tabs = CASH_TABS.filter(t => t.key !== "supervision-caja" || puedeSupervisarCaja);
      isActiveTab = k => active === "cash" && cashSubView === k;
      onTabClick  = k => { if (active === "cash") onCashSubViewChange(k as CashSubView); };
    } else if (expanded === "config") {
      tabs = CONFIG_TABS;
      isActiveTab = k => active === "config" && configSubView === k;
      onTabClick  = k => { if (active === "config") onConfigSubViewChange(k as ConfigSubView); };
    } else if (expanded === "abastecimiento") {
      tabs = ABAST_TABS;
      isActiveTab = k => active === "abastecimiento" && abastecimientoSubModule === k;
      onTabClick  = k => { if (active === "abastecimiento") onAbastecimientoSubModuleChange(k as AbastecimientoSubModule); };
    }

    const activeOnly = tabs.filter(t => !t.placeholder);
    return tabs.map(({ key, label, placeholder }, _idx) => {
      const subtabIdx = activeOnly.findIndex(t => t.key === key);
      if (placeholder) {
        return (
          <span key={key}
            className={`px-2.5 py-0.5 rounded-full text-[12px] font-semibold select-none cursor-default opacity-30 ${PILL_OFF[expanded]}`}>
            {label}
          </span>
        );
      }
      const isFocused = subtabIdx === focusedPillIdx;
      return (
        <button key={key}
          onClick={() => { setFocusedPillIdx(subtabIdx); onTabClick(key); }}
          className={`px-2.5 py-0.5 rounded-full text-[12px] font-semibold transition outline-none ${
            isActiveTab(key)
              ? PILL_ON[expanded]
              : isFocused
                ? `ring-2 ring-offset-1 ring-current ${PILL_OFF[expanded]}`
                : PILL_OFF[expanded]
          }`}>
          {label}
        </button>
      );
    });
  }

  // ── Iconos por módulo ─────────────────────────────────────
  const ICONS: Record<ActiveModule, React.ReactNode> = {
    cash:           <ShoppingCart size={15} />,
    sales:          <Package      size={15} />,
    clientes:       <Users        size={15} />,
    reportes:       <BarChart2    size={15} />,
    comprobantes:   <FileText     size={15} />,
    config:         <Settings     size={15} />,
    abastecimiento: <Boxes        size={15} />,
  };

  const pills = renderPills();

  // ── Vista expandida ───────────────────────────────────────
  if (expanded) {
    return (
      <section
        className="flex h-[52px] items-center bg-[#F0F2F5] px-3 gap-2"
        onMouseLeave={() => onHover(null)}
      >
        {/* Anchor — módulo expandido, click colapsa */}
        <button
          onClick={() => handleModuleClick(expanded)}
          className={MOD_ON[expanded]}
        >
          {ICONS[expanded]}
          <span>
            {expanded === "cash"           && "TURNO"}
            {expanded === "abastecimiento" && "ABASTECIMIENTO"}
            {expanded === "config"         && "AJUSTES"}
          </span>
          <ChevronRight size={13} strokeWidth={2.5} className="ml-0.5 opacity-50" />
        </button>

        {/* Divisor anchor / pills */}
        <div className="h-5 w-px bg-[#d1d5db]/60 shrink-0" />

        {/* Pills de subtabs */}
        <div className="flex items-center gap-1 flex-wrap">
          {pills}
        </div>
      </section>
    );
  }

  // ── Vista global ──────────────────────────────────────────
  return (
    <section
      className="flex h-[52px] items-center bg-[#F0F2F5] px-3 gap-1"
      onMouseLeave={() => onHover(null)}
    >
      <button onClick={() => handleModuleClick("cash")}
        onMouseEnter={() => onHover("cash")}
        className={navMode && MODULES_ORDER[navIdx] === "cash" ? NAV_FOCUS["cash"] : active === "cash" ? MOD_ON["cash"] : MOD_OFF}>
        <ShoppingCart size={15} /><span>TURNO</span>
      </button>
      <button onClick={() => handleModuleClick("sales")}
        onMouseEnter={() => onHover("sales")}
        className={navMode && MODULES_ORDER[navIdx] === "sales" ? NAV_FOCUS["sales"] : active === "sales" ? MOD_ON["sales"] : MOD_OFF}>
        <Package size={15} /><span>VENTAS</span>
      </button>

      <ModSep />

      <button
        onClick={() => handleModuleClick("abastecimiento", puedeVerAbastecimiento)}
        onMouseEnter={puedeVerAbastecimiento ? () => onHover("abastecimiento") : undefined}
        title={puedeVerAbastecimiento ? undefined : "Sin acceso"}
        className={navMode && MODULES_ORDER[navIdx] === "abastecimiento" ? NAV_FOCUS["abastecimiento"] : puedeVerAbastecimiento ? (active === "abastecimiento" ? MOD_ON["abastecimiento"] : MOD_OFF) : MOD_PH}
      >
        <Boxes size={15} /><span>ABASTECIMIENTO</span>
      </button>

      <ModSep />

      <button
        onClick={() => handleModuleClick("clientes", puedeVerClientes)}
        onMouseEnter={puedeVerClientes ? () => onHover("clientes") : undefined}
        title={puedeVerClientes ? undefined : "Sin acceso"}
        className={navMode && MODULES_ORDER[navIdx] === "clientes" ? NAV_FOCUS["clientes"] : puedeVerClientes ? (active === "clientes" ? MOD_ON["clientes"] : MOD_OFF) : MOD_PH}
      >
        <Users size={15} /><span>CLIENTES</span>
      </button>
      <button
        onClick={() => handleModuleClick("reportes", puedeVerReportes)}
        onMouseEnter={puedeVerReportes ? () => onHover("reportes") : undefined}
        title={puedeVerReportes ? undefined : "Sin acceso"}
        className={navMode && MODULES_ORDER[navIdx] === "reportes" ? NAV_FOCUS["reportes"] : puedeVerReportes ? (active === "reportes" ? MOD_ON["reportes"] : MOD_OFF) : MOD_PH}
      >
        <BarChart2 size={15} /><span>REPORTES</span>
      </button>

      <ModSep />

      <button
        onClick={() => handleModuleClick("comprobantes", puedeVerComprobantes)}
        onMouseEnter={puedeVerComprobantes ? () => onHover("comprobantes") : undefined}
        title={puedeVerComprobantes ? undefined : "Sin acceso"}
        className={navMode && MODULES_ORDER[navIdx] === "comprobantes" ? NAV_FOCUS["comprobantes"] : puedeVerComprobantes ? (active === "comprobantes" ? MOD_ON["comprobantes"] : MOD_OFF) : MOD_PH}
      >
        <FileText size={15} /><span>COMPROBANTES</span>
      </button>

      <ModSep />

      <button
        onClick={() => handleModuleClick("config", puedeVerAjustes)}
        onMouseEnter={puedeVerAjustes ? () => onHover("config") : undefined}
        title={puedeVerAjustes ? undefined : "Sin acceso"}
        className={navMode && MODULES_ORDER[navIdx] === "config" ? NAV_FOCUS["config"] : puedeVerAjustes ? (active === "config" ? MOD_ON["config"] : MOD_OFF) : MOD_PH}
      >
        <Settings size={15} /><span>AJUSTES</span>
      </button>
    </section>
  );
}
