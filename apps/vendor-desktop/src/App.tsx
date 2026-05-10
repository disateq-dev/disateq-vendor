import {
  ChevronDown,
  Package,
  Power,
  Search,
  Settings,
  ShoppingCart,
  Store,
  Users,
} from "lucide-react";

import { TicketGrid } from "./domains/ticket/components/TicketGrid";

const products = [
  "Aceite Vegetal Primor 1L",
  "Arroz Extra Familiar 5KG",
  "Leche Gloria Entera 1L",
  "Azúcar Rubia Cartavio 1KG",
  "Huevos Rosados A (30und)",
];

export default function App() {
  return (
    <main className="h-screen overflow-hidden bg-[#f4f7fb] text-[#111827]">
      <section className="flex h-full flex-col">
        {/* HEADER */}
        <header className="border-b border-[#dde4ec] bg-white/95 backdrop-blur-sm">
          {/* TOPBAR */}
          <section className="flex h-[74px] items-center justify-between px-5">
            {/* LEFT */}
            <section className="flex min-w-0 items-center">
              {/* BRAND */}
              <div className="flex items-center gap-4 pr-7">
                <div className="flex h-11 w-11 items-center justify-center rounded-[18px] bg-[#2154d8] text-white shadow-[0_4px_14px_rgba(33,84,216,0.16)]">
                  <Store size={20} />
                </div>

                <div className="flex flex-col">
                  <span className="text-[15px] font-bold tracking-tight text-[#0f172a]">
                    DisateQ VENDOR™
                  </span>

                  <span className="-mt-1 text-[12px] font-medium text-[#667085]">
                    Ventas y Gestión Administrativa para Negocios
                  </span>
                </div>
              </div>

              <div className="h-10 w-px bg-[#e7eaee]" />

              {/* BUSINESS */}
              <div className="min-w-0 px-7">
                <div className="flex items-center gap-3">
                  <span className="truncate text-[15px] font-bold text-[#111827]">
                    ALMACEN DE ABARROTES PEÑA
                  </span>

                  <span className="text-[#b8c2cc]">
                    •
                  </span>

                  <span className="text-[14px] font-medium text-[#667085]">
                    Tienda Mercado Central
                  </span>
                </div>

                <div className="-mt-0.5 flex items-center gap-3">
                  <span className="text-[13px] text-[#98a2b3]">
                    R.U.C. 20608399349
                  </span>

                  <span className="text-[#d0d5dd]">
                    •
                  </span>

                  <span className="truncate text-[13px] text-[#98a2b3]">
                    CONSORCIO PEÑA S.A.C.
                  </span>
                </div>
              </div>
            </section>

            {/* RIGHT */}
            <section className="flex items-center gap-3 pl-5">
              {/* OPERATIONAL INFO */}
              <div className="rounded-2xl border border-[rgba(22,163,74,0.08)] bg-[linear-gradient(180deg,rgba(22,163,74,0.028)_0%,rgba(22,163,74,0.018)_100%)] px-4 py-2 shadow-[0_2px_10px_rgba(15,23,42,0.012)] backdrop-blur-sm">
                <div className="flex items-center gap-2 text-[13px]">
                  <span className="font-semibold text-[#111827]">
                    CAJA 02
                  </span>

                  <span className="text-[#c8d0d8]">
                    •
                  </span>

                  <span className="text-[#667085]">
                    Fernando T.
                  </span>
                </div>

                <div className="mt-0.5 flex items-center gap-2 text-[12px]">
                  <span className="font-medium text-[#16a34a]">
                    Turno ACTIVO
                  </span>

                  <span className="text-[#c8d0d8]">
                    •
                  </span>

                  <span className="text-[#667085]">
                    Apertura 08:15
                  </span>
                </div>
              </div>

              {/* POWER */}
              <button className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-[#ece1e1] bg-white text-[#dc2626] shadow-[0_2px_10px_rgba(15,23,42,0.03)] transition hover:border-[#ef4444] hover:bg-[#fff5f5]">
                <Power size={18} />
              </button>
            </section>
          </section>

          {/* MODULES */}
          <section className="flex h-[52px] items-end gap-1 border-t border-[#f1f4f7] px-3 pb-1">
            <button className="flex h-11 items-center gap-2 rounded-2xl border-b-2 border-[rgba(22,163,74,0.25)] bg-[rgba(22,163,74,0.045)] px-4 text-[14px] font-semibold text-[#15803d] shadow-[0_2px_8px_rgba(22,163,74,0.05)]">
              <ShoppingCart size={17} />
              <span>TURNO</span>
            </button>

            <button className="flex h-11 items-center gap-2 rounded-2xl border-b-2 border-transparent px-4 text-[14px] font-semibold text-[#475467] transition hover:border-[rgba(33,84,216,0.18)] hover:text-[#111827]">
              <Package size={17} />
              <span>VENTAS</span>
            </button>

            <button className="flex h-11 items-center gap-2 rounded-2xl border-b-2 border-transparent px-4 text-[14px] font-semibold text-[#475467] transition hover:border-[rgba(124,58,237,0.18)] hover:text-[#111827]">
              <Users size={17} />
              <span>CLIENTES</span>
            </button>

            <button className="flex h-11 items-center gap-2 rounded-2xl border-b-2 border-transparent px-4 text-[14px] font-semibold text-[#475467] transition hover:border-[rgba(217,119,6,0.18)] hover:text-[#111827]">
              <Package size={17} />
              <span>INVENTARIO</span>
            </button>

            <button className="flex h-11 items-center gap-2 rounded-2xl border-b-2 border-transparent px-4 text-[14px] font-semibold text-[#475467] transition hover:border-[rgba(71,84,103,0.18)] hover:text-[#111827]">
              <Settings size={17} />
              <span>CONFIGURACIÓN</span>
            </button>
          </section>

          {/* CONTEXT BAR */}
          <section className="flex h-[48px] items-center gap-2 border-t border-[rgba(22,163,74,0.06)] bg-[linear-gradient(180deg,rgba(22,163,74,0.055)_0%,rgba(22,163,74,0.03)_100%)] px-3">
            <button className="rounded-xl px-4 py-2 text-[13px] font-medium text-[#166534] transition hover:bg-white/70">
              Abrir turno
            </button>

            <button className="rounded-xl px-4 py-2 text-[13px] font-medium text-[#166534] transition hover:bg-white/70">
              Cerrar turno
            </button>

            <button className="rounded-xl px-4 py-2 text-[13px] font-medium text-[#166534] transition hover:bg-white/70">
              Editar turno
            </button>

            <button className="flex items-center gap-1 rounded-xl px-4 py-2 text-[13px] font-medium text-[#166534] transition hover:bg-white/70">
              <span>Reportes</span>

              <ChevronDown size={15} />
            </button>

            <button className="flex items-center gap-1 rounded-xl px-4 py-2 text-[13px] font-medium text-[#166534] transition hover:bg-white/70">
              <span>Más</span>

              <ChevronDown size={15} />
            </button>
          </section>
        </header>

        {/* CONTENT */}
        <section className="flex min-h-0 flex-1 gap-3 p-3">
          {/* LEFT */}
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

          {/* RIGHT */}
          <section className="w-[420px]">
            <TicketGrid />
          </section>
        </section>
      </section>
    </main>
  );
}