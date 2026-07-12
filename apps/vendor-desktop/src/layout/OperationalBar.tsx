import { useState, useEffect, useRef } from "react";
import { BarChart2, Boxes, Clock, FileText, Settings, ShoppingCart, Users } from "lucide-react";
import { type ActiveModule, type CashSubView, type AbastecimientoSubModule, type ConfigSubView } from "../App";
import { useCapacidad } from "../hooks/useCapacidad";
import { useContextoOperacional } from "../hooks/useContextoOperacional";
import { usePOS } from "../context/POSContext";
import { getActiveAuthorizationsForBlock } from "../modules/cash/services/supervision-authorization.service";
import { HealthDot } from "../components/HealthDot";

// ── Orden visual de módulos ───────────────────────────────────
const MODULES_ORDER: ActiveModule[] = [
  "cash", "sales", "abastecimiento", "clientes", "reportes", "comprobantes", "config",
];

// ── Atajos directos por módulo (Ctrl+Space luego letra) ──────
const MODULE_SHORTCUTS: Partial<Record<string, ActiveModule>> = {
  t: "cash",
  v: "sales",
  a: "abastecimiento",
  c: "clientes",
  r: "reportes",
  b: "comprobantes",
  j: "config",
};

// ── Colores canónicos por módulo ──────────────────────────────
// Sincronizar con tokens --dv-mod-* en index.css si se cambian estos valores
const MODULE_ACCENT: Record<ActiveModule, string> = {
  cash:           "#C59B6D",
  sales:          "#128C7E",
  abastecimiento: "#1E88C7",
  clientes:       "#1E7E4F",
  reportes:       "#5C5FA8",
  comprobantes:   "#7B4F6E",
  config:         "#4A5265",
};

// Sincronizar con tokens --dv-mod-* en index.css si se cambian estos valores
const MODULE_BG: Record<ActiveModule, string> = {
  cash:           "#FFF5E6",
  sales:          "#E2F3F0",
  abastecimiento: "#E3F1FA",
  clientes:       "#F0FAF4",
  reportes:       "#ECEDF5",
  comprobantes:   "#F0EAF0",
  config:         "#EAECF0",
};

// ── Labels de módulos ─────────────────────────────────────────
const MODULE_LABEL: Record<ActiveModule, string> = {
  cash:           "TURNO",
  sales:          "VENTAS",
  abastecimiento: "ABASTECIMIENTO",
  clientes:       "CLIENTES",
  reportes:       "REPORTES",
  comprobantes:   "COMPROBANTES",
  config:         "AJUSTES",
};

// ── Iconos por módulo ─────────────────────────────────────────
import type { LucideIcon } from "lucide-react";
const MODULE_ICON: Record<ActiveModule, LucideIcon> = {
  cash:           Clock,
  sales:          ShoppingCart,
  abastecimiento: Boxes,
  clientes:       Users,
  reportes:       BarChart2,
  comprobantes:   FileText,
  config:         Settings,
};

// ── Módulos con opciones secundarias ─────────────────────────
const CON_SECUNDARIAS = new Set<ActiveModule>(["cash", "abastecimiento", "config"]);

// ── Definición de opciones secundarias ───────────────────────
interface OpcionSecundaria {
  key: string;
  label: string;
  placeholder?: boolean;
  separadorAntes?: boolean;
}

const CASH_OPCIONES: OpcionSecundaria[] = [
  { key: "turno",            label: "Gestión"     },
  { key: "supervision-caja", label: "Supervisión" },
];

const ABAST_OPCIONES: OpcionSecundaria[] = [
  { key: "productos",    label: "Productos"    },
  { key: "ifa",          label: "IFA"          },
  { key: "proveedores",  label: "Proveedores"  },
  { key: "laboratorios", label: "Laboratorios", placeholder: true },
  { key: "ingresos",     label: "Ingresos",     separadorAntes: true },
  { key: "inventarios",  label: "Inventarios"  },
  { key: "traslados",    label: "Traslados",    placeholder: true },
  { key: "pedidos",      label: "Pedidos",      separadorAntes: true },
];

const CONFIG_OPCIONES: OpcionSecundaria[] = [
  { key: "negocio",      label: "Negocio"      },
  { key: "operacion",    label: "Operación"    },
  { key: "roles",        label: "Roles"        },
  { key: "operadores",   label: "Operadores"   },
  { key: "cajas",        label: "Cajas"        },
  { key: "capacidades",  label: "Capacidades"  },
  { key: "experiencia",  label: "Experiencia"  },
  { key: "rubro",        label: "Rubro"        },
  { key: "diagnostico",  label: "Diagnóstico", separadorAntes: true },
];

function getOpciones(modulo: ActiveModule, puedeSupervisar: boolean): OpcionSecundaria[] {
  if (modulo === "cash") return CASH_OPCIONES.filter(o => o.key !== "supervision-caja" || puedeSupervisar);
  if (modulo === "abastecimiento") return ABAST_OPCIONES;
  if (modulo === "config") return CONFIG_OPCIONES;
  return [];
}

function getOpcionActiva(modulo: ActiveModule, cashSubView: CashSubView, abastecimientoSubModule: AbastecimientoSubModule, configSubView: ConfigSubView): string {
  if (modulo === "cash") return cashSubView;
  if (modulo === "abastecimiento") return abastecimientoSubModule;
  if (modulo === "config") return configSubView;
  return "";
}

function setOpcionActiva(
  modulo: ActiveModule,
  key: string,
  onCashSubViewChange: (sv: CashSubView) => void,
  onAbastecimientoSubModuleChange: (sm: AbastecimientoSubModule) => void,
  onConfigSubViewChange: (sv: ConfigSubView) => void,
): void {
  if (modulo === "cash") onCashSubViewChange(key as CashSubView);
  else if (modulo === "abastecimiento") onAbastecimientoSubModuleChange(key as AbastecimientoSubModule);
  else if (modulo === "config") onConfigSubViewChange(key as ConfigSubView);
}

// ── Props ─────────────────────────────────────────────────────
interface BarraModulosProps {
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

// ── Separador ─────────────────────────────────────────────────
function Separador() {
  return <div className="mx-1.5 h-5 w-px shrink-0 self-center bg-[#d1d5db]/60" />;
}

// ── BARRA DE MÓDULOS OPERACIONALES ───────────────────────────
export function ContextBar({
  active, onChange, onHover,
  cashSubView, onCashSubViewChange,
  abastecimientoSubModule, onAbastecimientoSubModuleChange,
  configSubView, onConfigSubViewChange,
}: BarraModulosProps) {
  const { activeOperator, cashSession, suggestedCashBox, acknowledgedAuthIds } = usePOS();
  const operatorBlockPrefix = cashSession.cashBox?.code[0]
    ?? (activeOperator?.baseBloque != null ? String(activeOperator.baseBloque)[0] : suggestedCashBox?.code[0] ?? "1");
  const pendingAuth = getActiveAuthorizationsForBlock(operatorBlockPrefix)
    .filter(a => a.type !== "cierre_activo")
    .sort((a, b) => a.authorizedAt.localeCompare(b.authorizedAt))[0] ?? null;
  const esVEN = activeOperator?.codigoRol === "VEN";
  const isBlocking = esVEN && pendingAuth !== null && !acknowledgedAuthIds.has(pendingAuth.id);

  const puedeVerSales          = !isBlocking;
  const puedeVerReportes       = useCapacidad("ver_reportes")          && !isBlocking;
  const puedeVerClientes       = useCapacidad("gestionar_clientes")    && !isBlocking;
  const contexto               = useContextoOperacional();
  const puedeVerComprobantes   = contexto !== null                     && !isBlocking;
  const puedeVerAbastecimiento = useCapacidad("gestionar_inventarios") && !isBlocking;
  const puedeVerAjustes        = useCapacidad("gestionar_operadores")  && !isBlocking;
  const puedeSupervisarCaja    = useCapacidad("reaperturar_cierres")   && !isBlocking;

  // ── Estado ────────────────────────────────────────────────
  const [barraActiva, setBarraActiva] = useState(false);
  const [navIdx, setNavIdx]           = useState(0);
  const [expandido, setExpandido]     = useState<ActiveModule | null>(null);
  const [focusOpcion, setFocusOpcion] = useState(0);
  const [detalleActivo, setDetalleActivo] = useState(false);
  const [esperandoAtajo, setEsperandoAtajo] = useState(false);
  const [hoverModulo, setHoverModulo] = useState<ActiveModule | null>(null);
  const [moduloActivoVisual, setModuloActivoVisual] = useState<ActiveModule | null>(null);

  useEffect(() => {
    function onDetalle(e: Event) {
      setDetalleActivo((e as CustomEvent<{ active: boolean }>).detail.active);
    }
    document.addEventListener("pos:detalleActivo", onDetalle);
    return () => document.removeEventListener("pos:detalleActivo", onDetalle);
  }, []);

  // ── Refs para evitar stale closures ──────────────────────
  const stateRef = useRef({
    barraActiva, navIdx, expandido, focusOpcion, detalleActivo, esperandoAtajo, active,
  });
  useEffect(() => {
    stateRef.current = { barraActiva, navIdx, expandido, focusOpcion, detalleActivo, esperandoAtajo, active };
  });

  const accessRef = useRef({ puedeVerSales, puedeVerReportes, puedeVerClientes, puedeVerComprobantes, puedeVerAbastecimiento, puedeVerAjustes, puedeSupervisarCaja });
  useEffect(() => {
    accessRef.current = { puedeVerSales, puedeVerReportes, puedeVerClientes, puedeVerComprobantes, puedeVerAbastecimiento, puedeVerAjustes, puedeSupervisarCaja };
  });

  const cbRefs = useRef({ onChange, onCashSubViewChange, onAbastecimientoSubModuleChange, onConfigSubViewChange });
  useEffect(() => {
    cbRefs.current = { onChange, onCashSubViewChange, onAbastecimientoSubModuleChange, onConfigSubViewChange };
  });

  // ── Bloqueo operacional ───────────────────────────────────
  useEffect(() => {
    if (isBlocking && (active !== "cash" || cashSubView !== "turno")) {
      setExpandido(null);
      cbRefs.current.onChange("cash");
      cbRefs.current.onCashSubViewChange("turno");
    }
  }, [isBlocking, active, cashSubView]);

  // ── Notificar navMode al shell ────────────────────────────
  useEffect(() => {
    document.dispatchEvent(new CustomEvent("pos:navMode", { detail: { active: barraActiva } }));
    setModuloActivoVisual(null);
  }, [barraActiva]);

  // ── Listener evento disateq:navegar ──────────────────────
  useEffect(() => {
    function onNavegar(e: Event) {
      const { destino, subtab } = (e as CustomEvent<{ destino: ActiveModule; subtab?: string }>).detail;
      cbRefs.current.onChange(destino);
      if (subtab && destino === "abastecimiento")
        cbRefs.current.onAbastecimientoSubModuleChange(subtab as AbastecimientoSubModule);
      if (subtab && destino === "cash")
        cbRefs.current.onCashSubViewChange(subtab as CashSubView);
      if (subtab && destino === "config")
        cbRefs.current.onConfigSubViewChange(subtab as ConfigSubView);
    }
    window.addEventListener("disateq:navegar", onNavegar);
    return () => window.removeEventListener("disateq:navegar", onNavegar);
  }, []);

  function tieneAcceso(m: ActiveModule): boolean {
    const acc = accessRef.current;
    if (m === "abastecimiento") return acc.puedeVerAbastecimiento;
    if (m === "clientes")       return acc.puedeVerClientes;
    if (m === "reportes")       return acc.puedeVerReportes;
    if (m === "comprobantes")   return acc.puedeVerComprobantes;
    if (m === "config")         return acc.puedeVerAjustes;
    if (m === "sales")          return acc.puedeVerSales;
    return true;
  }

  // ── Handler global de teclado ────────────────────────────
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const s = stateRef.current;

      // ── Ctrl+Espacio — activar barra / modo atajo ────────
      if (e.ctrlKey && !e.shiftKey && !e.altKey && e.code === "Space") {
        e.preventDefault();
        if (!s.barraActiva) {
          setNavIdx(0);
          setExpandido(null);
          setFocusOpcion(0);
          setBarraActiva(true);
          setEsperandoAtajo(true);
        } else {
          setBarraActiva(false);
          setExpandido(null);
          setFocusOpcion(0);
          setEsperandoAtajo(false);
        }
        return;
      }

      // ── Modo atajo directo (Ctrl+Space + letra) ──────────
      if (s.barraActiva && s.esperandoAtajo && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        const key = e.key.toLowerCase();
        const destino = MODULE_SHORTCUTS[key];
        if (destino && tieneAcceso(destino)) {
          e.preventDefault();
          cbRefs.current.onChange(destino);
          setModuloActivoVisual(destino);
          if (CON_SECUNDARIAS.has(destino)) {
            const idx = MODULES_ORDER.indexOf(destino);
            setNavIdx(idx);
            setExpandido(destino);
            setFocusOpcion(0);
          } else {
            setBarraActiva(false);
            setExpandido(null);
          }
          setEsperandoAtajo(false);
          return;
        }
      }

      if (!s.barraActiva) return;

      // ── Escape ───────────────────────────────────────────
      if (e.code === "Escape" && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        if (s.expandido) {
          setExpandido(null);
          setFocusOpcion(0);
          setNavIdx(MODULES_ORDER.indexOf(s.active));
          setEsperandoAtajo(false);
        } else {
          setBarraActiva(false);
          setExpandido(null);
          setEsperandoAtajo(false);
        }
        return;
      }

      // ── Navegación entre módulos (sin expandido) ─────────
      if (!s.expandido && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        if (e.code === "ArrowRight") {
          e.preventDefault();
          let next = (s.navIdx + 1) % MODULES_ORDER.length;
          let guard = 0;
          while (!tieneAcceso(MODULES_ORDER[next]) && guard++ < MODULES_ORDER.length)
            next = (next + 1) % MODULES_ORDER.length;
          setNavIdx(next);
          setEsperandoAtajo(false);
          return;
        }
        if (e.code === "ArrowLeft") {
          e.preventDefault();
          let prev = (s.navIdx - 1 + MODULES_ORDER.length) % MODULES_ORDER.length;
          let guard = 0;
          while (!tieneAcceso(MODULES_ORDER[prev]) && guard++ < MODULES_ORDER.length)
            prev = (prev - 1 + MODULES_ORDER.length) % MODULES_ORDER.length;
          setNavIdx(prev);
          setEsperandoAtajo(false);
          return;
        }
        if (e.code === "Enter") {
          e.preventDefault();
          const target = MODULES_ORDER[s.navIdx];
          if (!tieneAcceso(target)) return;
          cbRefs.current.onChange(target);
          setModuloActivoVisual(target);
          if (CON_SECUNDARIAS.has(target)) {
            setExpandido(target);
            setFocusOpcion(0);
          } else {
            setBarraActiva(false);
            setExpandido(null);
          }
          setEsperandoAtajo(false);
          return;
        }
      }

      // ── Navegación entre opciones secundarias (con expandido) ──
      if (s.expandido && !s.detalleActivo && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        const opciones = getOpciones(s.expandido, accessRef.current.puedeSupervisarCaja).filter(o => !o.placeholder);
        if (e.code === "ArrowRight") {
          e.preventDefault();
          setFocusOpcion(i => (i + 1) % opciones.length);
          return;
        }
        if (e.code === "ArrowLeft") {
          e.preventDefault();
          setFocusOpcion(i => (i - 1 + opciones.length) % opciones.length);
          return;
        }
        if (e.code === "Enter") {
          e.preventDefault();
          const opcion = opciones[s.focusOpcion];
          if (!opcion) return;
          setOpcionActiva(s.expandido, opcion.key, cbRefs.current.onCashSubViewChange, cbRefs.current.onAbastecimientoSubModuleChange, cbRefs.current.onConfigSubViewChange);
          return;
        }
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // ── Vista expandida — opciones secundarias ───────────────
  if (expandido) {
    const accent = MODULE_ACCENT[expandido];
    const bg = MODULE_BG[expandido];
    const opciones = getOpciones(expandido, puedeSupervisarCaja);
    const opcionActiva = getOpcionActiva(expandido, cashSubView, abastecimientoSubModule, configSubView);
    const opcionesActivas = opciones.filter(o => !o.placeholder);

    return (
      <section
        className="flex h-[44px] shrink-0 items-center gap-2 px-3"
        style={{ backgroundColor: bg, borderBottom: `1px solid ${accent}22` }}
        onMouseLeave={() => onHover(null)}
      >
        {/* Anchor — módulo expandido */}
        <button
          onClick={() => { setExpandido(null); setFocusOpcion(0); setBarraActiva(false); }}
          className="flex shrink-0 h-9 items-center gap-1.5 px-3 text-[13.5px] font-bold transition select-none"
          style={{ borderBottom: `3px solid ${accent}` }}
        >
          {(() => { const Icon = MODULE_ICON[expandido]; return <span style={{ color: accent }}><Icon size={20} /></span>; })()}
          <span style={{ color: "#2C2A26" }}>{MODULE_LABEL[expandido]}</span>
        </button>

        <div className="h-5 w-px shrink-0 bg-[#d1d5db]/60" />

        {/* Opciones secundarias */}
        <div className="flex items-center gap-1 flex-1 overflow-hidden">
          {opciones.map((opcion) => {
            const opcionIdx = opcionesActivas.findIndex(o => o.key === opcion.key);
            const estaActiva = opcionActiva === opcion.key;
            const tieneFoco = barraActiva && opcionIdx === focusOpcion && !opcion.placeholder;

            if (opcion.separadorAntes) {
              return (
                <div key={`sep-${opcion.key}`} className="flex items-center gap-1">
                  <Separador />
                  {renderOpcion(opcion, estaActiva, tieneFoco, accent, expandido, opcionIdx)}
                </div>
              );
            }
            return renderOpcion(opcion, estaActiva, tieneFoco, accent, expandido, opcionIdx);
          })}
        </div>

        {expandido === "config" && (
          <HealthDot
            onNavigate={() => {
              setOpcionActiva("config", "diagnostico", onCashSubViewChange, onAbastecimientoSubModuleChange, onConfigSubViewChange);
            }}
          />
        )}
      </section>
    );

    function renderOpcion(opcion: OpcionSecundaria, estaActiva: boolean, tieneFoco: boolean, accent: string, modulo: ActiveModule, idx: number) {
      if (opcion.placeholder) {
        return (
          <span key={opcion.key} className="px-2.5 py-0.5 rounded-full text-[13px] font-semibold select-none cursor-default opacity-30" style={{ color: accent }}>
            {opcion.label}
          </span>
        );
      }
      return (
        <button
          key={opcion.key}
          onClick={() => {
            setOpcionActiva(modulo, opcion.key, onCashSubViewChange, onAbastecimientoSubModuleChange, onConfigSubViewChange);
          }}
          onMouseEnter={() => {
            if (idx >= 0) setFocusOpcion(idx);
          }}
          className="px-2.5 py-0.5 rounded-full text-[13px] font-semibold transition outline-none"
          style={
            tieneFoco || (!barraActiva && estaActiva)
              ? { backgroundColor: accent, color: "white" }
              : { color: "var(--dv-text-primary)", opacity: 0.8 }
          }
        >
          {opcion.label}
        </button>
      );
    }
  }

  // ── Vista global — todos los módulos ─────────────────────
  return (
    <section
      className="flex h-[44px] shrink-0 items-center px-3 gap-1 bg-white"
      onMouseLeave={() => { setHoverModulo(null); onHover(null); }}
    >
      {MODULES_ORDER.map((modulo, idx) => {
        const Icon = MODULE_ICON[modulo];
        const acceso = tieneAcceso(modulo);
        const tieneCursor = barraActiva && navIdx === idx;
        const accent = MODULE_ACCENT[modulo];

        const esUltimoAntesSep = modulo === "sales" || modulo === "abastecimiento" || modulo === "reportes";

        return (
          <div key={modulo} className="flex items-center">
            <button
              onClick={() => {
                if (!acceso) return;
                cbRefs.current.onChange(modulo);
                setModuloActivoVisual(modulo);
                if (CON_SECUNDARIAS.has(modulo)) {
                  setExpandido(modulo);
                  setNavIdx(idx);
                  setFocusOpcion(0);
                  setBarraActiva(true);
                } else {
                  setBarraActiva(false);
                  setExpandido(null);
                }
              }}
              onMouseEnter={() => {
                if (!acceso) return;
                setHoverModulo(modulo);
                onHover(modulo);
              }}
              title={!acceso ? "Sin acceso" : undefined}
              className={`flex h-9 items-center gap-1.5 px-3 font-bold transition select-none border-b-[3px] ${barraActiva ? "text-[13.5px]" : "text-[13.5px]"}`}
              style={(() => {
                if (!acceso) return { opacity: 0.3, borderColor: "transparent", cursor: "default" };
                if (!barraActiva) {
                  if (hoverModulo === modulo) return {
                    borderColor: accent,
                    backgroundColor: `${accent}14`,
                    borderRadius: "8px 8px 0 0",
                    cursor: "pointer",
                  };
                  return { borderColor: "transparent", color: "#2C2A26", cursor: "pointer" };
                }
                const esLengueta = tieneCursor || moduloActivoVisual === modulo || hoverModulo === modulo;
                if (esLengueta) return {
                  borderColor: accent,
                  backgroundColor: `${accent}14`,
                  borderRadius: "8px 8px 0 0",
                  cursor: "pointer",
                };
                return { opacity: 0.65, borderColor: "transparent", cursor: "pointer" };
              })()}
            >
              <span style={{ color: acceso ? accent : "#2C2A26" }}><Icon size={20} /></span>
              <span style={{ color: "#2C2A26" }}>{MODULE_LABEL[modulo]}</span>
            </button>
            {esUltimoAntesSep && <Separador />}
          </div>
        );
      })}
    </section>
  );
}
