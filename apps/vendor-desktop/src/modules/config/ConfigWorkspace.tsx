import { usePOS } from "../../context/POSContext";
import { RUBROS, type Rubro, type VisualMode, type PrintFlow } from "../../data/catalogs";

const RUBRO_ORDER: Rubro[] = ["abarrotes", "food-fast", "panaderia", "farmacia"];

const RUBRO_ICONS: Record<Rubro, string> = {
  abarrotes:   "🛒",
  "food-fast": "🍔",
  panaderia:   "🥖",
  farmacia:    "💊",
};

const VISUAL_MODES: { id: VisualMode; label: string; desc: string }[] = [
  { id: "lista",  label: "Lista",   desc: "Scanner · teclado · densidad máxima"    },
  { id: "visual", label: "Visual",  desc: "Tiles · touch/mouse · selección rápida" },
  { id: "mixto",  label: "Mixto",   desc: "Lista + tiles simultáneos · híbrido"    },
];

const PRINT_FLOWS: { id: PrintFlow; label: string; desc: string; ready: boolean }[] = [
  { id: "solo-comprobante",     label: "Solo comprobante",        desc: "Imprime solo el ticket de venta",            ready: true  },
  { id: "comprobante-despacho", label: "Comprobante + Despacho",  desc: "Ticket venta + ticket interno de despacho",  ready: true  },
  { id: "comprobante-comanda",  label: "Comprobante + Comanda",   desc: "Ticket venta + orden de preparación",        ready: false },
  { id: "comprobante-precuenta",label: "Comprobante + Precuenta", desc: "Ticket venta + pre-cuenta al cliente",       ready: false },
  { id: "comprobante-turno",    label: "Comprobante + Turno",     desc: "Ticket venta + número de turno/cola",        ready: false },
  { id: "comprobante-embarque", label: "Comprobante + Embarque",  desc: "Ticket venta + etiqueta de despacho físico", ready: false },
];

export function ConfigWorkspace() {
  const { rubro, setRubro, visualMode, setVisualMode, printFlow, setPrintFlow } = usePOS();
  const rubroConfig = RUBROS[rubro];

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[#9B8BFF]/50 bg-[#FDFCF9]">

      <header className="shrink-0 flex items-center border-b border-[#9B8BFF]/15 bg-[#F4F3FE] px-4 py-2.5">
        <span className="text-[14px] font-semibold uppercase tracking-tight text-[#121416] leading-none">AJUSTES</span>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-7">

        {/* ── RUBRO OPERACIONAL ── */}
        <div>
          <SectionLabel>Rubro operacional</SectionLabel>
          <p className="mt-1 mb-3 text-[11px] text-[#b0bac8]">
            Define el catálogo activo y los defaults operacionales.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {RUBRO_ORDER.map(r => {
              const cfg      = RUBROS[r];
              const isActive = rubro === r;
              return (
                <button
                  key={r}
                  onClick={() => setRubro(r)}
                  className={`flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition active:scale-[0.98] ${
                    isActive
                      ? "border-[#2154d8]/30 bg-[#EDF4FF] shadow-[0_2px_6px_rgba(33,84,216,0.10)]"
                      : "border-[#E9E4DC] bg-white hover:border-[#c7d7f4] hover:bg-[#f7f9ff]"
                  }`}
                >
                  <span className="mt-0.5 shrink-0 text-[20px] leading-none">{RUBRO_ICONS[r]}</span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-[12px] font-bold ${isActive ? "text-[#2154d8]" : "text-[#2F3E46]"}`}>
                      {cfg.label}
                    </p>
                    <p className="mt-0.5 text-[10px] text-[#9ca3af] leading-snug">{cfg.description}</p>
                    <p className="mt-1.5 text-[9px] font-semibold uppercase tracking-wide text-[#c4a87c]">
                      default: {cfg.defaultVisualMode} · {cfg.defaultPrintFlow.replace("comprobante-", "c+")}
                    </p>
                  </div>
                  {isActive && <div className="ml-auto shrink-0 mt-1 h-2 w-2 rounded-full bg-[#2154d8]" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── MODO VISUAL ── */}
        <div>
          <SectionLabel>Modo visual operacional</SectionLabel>
          <p className="mt-1 mb-3 text-[11px] text-[#b0bac8]">
            Independiente del rubro. Puede cambiarse también desde el panel de ventas.
          </p>
          <div className="flex flex-col gap-1.5">
            {VISUAL_MODES.map(m => {
              const isActive = visualMode === m.id;
              const isDefault = rubroConfig.defaultVisualMode === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => setVisualMode(m.id)}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 text-left transition active:scale-[0.98] ${
                    isActive
                      ? "border-[#2154d8]/30 bg-[#EDF4FF]"
                      : "border-[#E9E4DC] bg-white hover:border-[#c7d7f4] hover:bg-[#f7f9ff]"
                  }`}
                >
                  <div className={`h-2 w-2 shrink-0 rounded-full ${isActive ? "bg-[#2154d8]" : "bg-[#e4e9f0]"}`} />
                  <div className="flex-1 min-w-0">
                    <span className={`text-[12px] font-semibold ${isActive ? "text-[#2154d8]" : "text-[#374151]"}`}>
                      {m.label}
                    </span>
                    <span className="ml-2 text-[10.5px] text-[#9ca3af]">{m.desc}</span>
                  </div>
                  {isDefault && (
                    <span className="shrink-0 text-[9px] font-bold uppercase tracking-wide text-[#c4a87c]">
                      default {rubroConfig.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── FLUJO IMPRESIÓN ── */}
        <div>
          <SectionLabel>Flujo de impresión</SectionLabel>
          <p className="mt-1 mb-3 text-[11px] text-[#b0bac8]">
            Presets operacionales. Independiente del rubro. La impresión RAW validada es source of truth.
          </p>
          <div className="flex flex-col gap-1.5">
            {PRINT_FLOWS.map(f => {
              const isActive  = printFlow === f.id;
              const isDefault = rubroConfig.defaultPrintFlow === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => f.ready && setPrintFlow(f.id)}
                  className={`flex items-center gap-3 rounded-2xl border px-4 py-2.5 text-left transition ${
                    !f.ready
                      ? "border-[#f1f4f7] bg-[#f8fafc] cursor-not-allowed opacity-50"
                      : isActive
                        ? "border-[#2154d8]/30 bg-[#EDF4FF] active:scale-[0.98]"
                        : "border-[#E9E4DC] bg-white hover:border-[#c7d7f4] hover:bg-[#f7f9ff] active:scale-[0.98]"
                  }`}
                >
                  <div className={`h-2 w-2 shrink-0 rounded-full ${isActive && f.ready ? "bg-[#2154d8]" : "bg-[#e4e9f0]"}`} />
                  <div className="flex-1 min-w-0">
                    <span className={`text-[12px] font-semibold ${isActive && f.ready ? "text-[#2154d8]" : "text-[#374151]"}`}>
                      {f.label}
                    </span>
                    <span className="ml-2 text-[10.5px] text-[#9ca3af]">{f.desc}</span>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    {isDefault && (
                      <span className="text-[9px] font-bold uppercase tracking-wide text-[#c4a87c]">
                        default {rubroConfig.label}
                      </span>
                    )}
                    {!f.ready && (
                      <span className="text-[9px] font-bold uppercase tracking-wide text-[#9ca3af]">pronto</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── STATUS STRIP ── */}
        <div className="rounded-2xl border border-[#E9E4DC] bg-[#f8fafc] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">Contexto activo</p>
          <p className="mt-1 text-[11px] text-[#6b7280] font-mono">
            {rubroConfig.label} · {rubroConfig.catalog.length}p · {visualMode} · {printFlow}
          </p>
        </div>

        {/* ── DEV ONLY — nunca en producción ── */}
        {import.meta.env.DEV && (
          <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 flex flex-col gap-2">
            <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-amber-600">DEV · Herramientas de testing</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  localStorage.removeItem("disateq.pos.usedCodes");
                  localStorage.removeItem("disateq.pos.usedDate");
                  window.location.reload();
                }}
                className="rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-wide text-amber-700 hover:bg-amber-100 transition"
              >
                RESET CAJAS DÍA
              </button>
              <button
                onClick={() => {
                  const keys = [
                    "disateq.pos.cashSession",
                    "disateq.pos.usedCodes",
                    "disateq.pos.usedDate",
                    "disateq.pos.sessionStats",
                    "disateq.pos.cashMoves",
                    "disateq.pos.opLogs",
                    "disateq.pos.correlatives",
                    "disateq.pos.comprobantes",
                    "disateq.pos.ui.closingStage",
                    "disateq.pos.ui.contado",
                  ];
                  keys.forEach(k => localStorage.removeItem(k));
                  window.location.reload();
                }}
                className="rounded-xl border border-red-300 bg-white px-3 py-1.5 text-[10.5px] font-bold uppercase tracking-wide text-red-600 hover:bg-red-50 transition"
              >
                RESET OPERACIONAL COMPLETO
              </button>
            </div>
            <p className="text-[9px] text-amber-500 leading-snug">
              Solo visible en modo DEV · RESET COMPLETO limpia sesión, caja, stats y stages.
            </p>
          </div>
        )}

      </div>
    </section>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9ca3af]">{children}</p>
  );
}
