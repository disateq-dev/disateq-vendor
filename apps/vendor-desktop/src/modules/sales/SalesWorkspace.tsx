import { Search } from "lucide-react";

const products = [
  "Aceite Vegetal Primor 1L",
  "Arroz Extra Familiar 5KG",
  "Leche Gloria Entera 1L",
  "Azúcar Rubia Cartavio 1KG",
  "Huevos Rosados A (30und)",
];

export function SalesWorkspace() {
  return (
    <section className="flex min-w-0 flex-1 flex-col gap-3">
      {/* FILTERS */}
      <div className="flex items-center gap-2">
        <button className="rounded-2xl bg-[#2154d8] px-5 py-2.5 text-[14px] font-semibold text-white shadow-[0_3px_10px_rgba(33,84,216,0.16)]">
          General
        </button>

        <button className="rounded-2xl border border-[#e4e7ec] bg-white px-5 py-2.5 text-[14px] font-medium text-[#475467] transition hover:border-[#d0d5dd]">
          Productos
        </button>

        <button className="rounded-2xl border border-[#e4e7ec] bg-white px-5 py-2.5 text-[14px] font-medium text-[#475467] transition hover:border-[#d0d5dd]">
          Servicios
        </button>
      </div>

      {/* SEARCH */}
      <section className="rounded-[28px] border border-[#e4e9f0] bg-[#f8fafc]/95 p-3 shadow-[0_4px_16px_rgba(15,23,42,0.025)]">
        <div className="flex h-14 items-center rounded-2xl border border-[#e2e8f0] bg-white px-5">
          <Search size={20} className="text-[#2154d8]" />

          <input
            type="text"
            placeholder="Buscar producto por nombre, código o barra..."
            className="ml-4 w-full bg-transparent text-[15px] outline-none placeholder:text-[#98a2b3]"
          />
        </div>

        <p className="mt-3 pl-2 text-[12px] text-[#98a2b3]">
          Mínimo 2 caracteres para buscar
        </p>
      </section>

      {/* RESULTS */}
      <section className="flex-1 rounded-[28px] border border-[#e4e9f0] bg-[#f8fafc]/95 p-4 shadow-[0_4px_18px_rgba(15,23,42,0.025)]">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-[17px] font-bold text-[#111827]">
            Resultados (24)
          </h2>
        </div>

        <div className="flex flex-col gap-2.5">
          {products.map((product) => (
            <div
              key={product}
              className="flex items-center justify-between rounded-2xl border border-[#e8edf3] bg-white px-5 py-4 transition hover:border-[#d9e1ea] hover:shadow-[0_3px_12px_rgba(15,23,42,0.025)]"
            >
              <div>
                <h3 className="text-[15px] font-semibold text-[#111827]">
                  {product}
                </h3>

                <p className="mt-1 text-[13px] text-[#98a2b3]">
                  7751234567890
                </p>
              </div>

              <div className="flex items-center gap-5">
                <span className="text-[15px] font-semibold text-[#111827]">
                  S/ 8.50
                </span>

                <button className="rounded-xl bg-[#edf4ff] px-4 py-2 text-[13px] font-semibold text-[#2154d8] transition hover:bg-[#e3eeff]">
                  Agregar
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
