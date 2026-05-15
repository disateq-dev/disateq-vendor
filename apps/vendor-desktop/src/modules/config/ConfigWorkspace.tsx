import { usePOS } from "../../context/POSContext";
import { RUBROS, type Rubro } from "../../data/catalogs";

const RUBRO_ORDER: Rubro[] = ["abarrotes", "food-fast", "panaderia", "farmacia"];

const RUBRO_ICONS: Record<Rubro, string> = {
  abarrotes:   "🛒",
  "food-fast": "🍔",
  panaderia:   "🥖",
  farmacia:    "💊",
};

export function ConfigWorkspace() {
  const { rubro, setRubro } = usePOS();

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[#E9E4DC] bg-[#FDFBF7] shadow-[0_4px_18px_rgba(15,23,42,0.04)]">

      <header className="shrink-0 border-b border-[#E9E4DC] px-6 py-4">
        <h2 className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#374151]">
          Configuración
        </h2>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-5">

        <div className="mb-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#9ca3af]">
            Rubro Operacional
          </p>
          <p className="mt-1 text-[11px] text-[#b0bac8]">
            Define el catálogo activo y los defaults operacionales del turno.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          {RUBRO_ORDER.map(r => {
            const cfg      = RUBROS[r];
            const isActive = rubro === r;
            return (
              <button
                key={r}
                onClick={() => setRubro(r)}
                className={`flex items-start gap-3 rounded-2xl border px-4 py-3.5 text-left transition active:scale-[0.98] ${
                  isActive
                    ? "border-[#2154d8]/30 bg-[#EDF4FF] shadow-[0_2px_8px_rgba(33,84,216,0.10)]"
                    : "border-[#E9E4DC] bg-white hover:border-[#c7d7f4] hover:bg-[#f7f9ff]"
                }`}
              >
                <span className="mt-0.5 shrink-0 text-[22px] leading-none">
                  {RUBRO_ICONS[r]}
                </span>
                <div className="min-w-0">
                  <p className={`text-[13px] font-bold ${isActive ? "text-[#2154d8]" : "text-[#2F3E46]"}`}>
                    {cfg.label}
                  </p>
                  <p className="mt-0.5 text-[10.5px] text-[#9ca3af] leading-snug">
                    {cfg.description}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide ${
                      cfg.defaultViewMode === "visual"
                        ? "bg-violet-50 text-violet-500"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      {cfg.defaultViewMode === "visual" ? "Visual" : "Lista"}
                    </span>
                    {cfg.hasDispatch && (
                      <span className="rounded-md bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-600">
                        Despacho
                      </span>
                    )}
                  </div>
                </div>
                {isActive && (
                  <div className="ml-auto shrink-0 mt-1">
                    <div className="h-2 w-2 rounded-full bg-[#2154d8]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6 rounded-2xl border border-[#E9E4DC] bg-[#f8fafc] px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">
            Activo · {RUBROS[rubro].label}
          </p>
          <p className="mt-1 text-[11px] text-[#6b7280]">
            {RUBROS[rubro].catalog.length} productos · modo {RUBROS[rubro].defaultViewMode === "visual" ? "visual" : "lista"} · {RUBROS[rubro].hasDispatch ? "con ticket despacho" : "sin despacho"}
          </p>
        </div>

      </div>
    </section>
  );
}
