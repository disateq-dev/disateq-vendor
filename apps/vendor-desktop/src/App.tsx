import {
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
    <main className="h-screen overflow-hidden bg-[#f3f6fb] text-[#111827]">
      <section className="flex h-full flex-col">
        {/* TOPBAR */}
        <header className="flex h-[84px] items-center justify-between border-b border-[#dfe5ee] bg-white px-6">
          {/* LEFT */}
          <section className="flex items-center">
            {/* BRAND */}
            <div className="flex items-center gap-4 pr-8">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2154d8] text-white shadow-sm">
                <Store size={22} />
              </div>

              <div className="flex flex-col">
                <span className="text-[15px] font-bold tracking-tight text-[#0f172a]">
                  DISATEQ
                </span>

                <span className="-mt-0.5 text-[13px] font-medium text-[#475467]">
                  Vendor
                </span>
              </div>
            </div>

            <div className="h-12 w-px bg-[#e5e7eb]" />

            {/* BUSINESS */}
            <div className="px-8">
              <div className="flex items-center gap-3">
                <span className="text-[15px] font-bold text-[#111827]">
                  ALMACEN DE ABARROTES PEÑA
                </span>

                <span className="text-[15px] text-[#98a2b3]">
                  |
                </span>

                <span className="text-[14px] font-medium text-[#344054]">
                  Tienda Mercado Central
                </span>
              </div>

              <div className="mt-2 flex items-center gap-3">
                <span className="text-[14px] text-[#475467]">
                  20608399349
                </span>

                <span className="text-[#cbd5e1]">
                  |
                </span>

                <span className="text-[14px] text-[#475467]">
                  CONSORCIO PEÑA S.A.C.
                </span>
              </div>
            </div>
          </section>

          {/* RIGHT */}
          <section className="flex items-center gap-5 pl-8">
            {/* TURNO */}
            <div className="rounded-2xl bg-[#eef8f1] px-6 py-3">
              <div className="flex items-center gap-4">
                <span className="text-[15px] font-bold text-[#111827]">
                  Caja 02
                </span>

                <span className="text-[#98a2b3]">
                  |
                </span>

                <span className="text-[15px] font-bold text-[#16a34a]">
                  TURNO ABIERTO
                </span>
              </div>

              <div className="mt-2 flex items-center gap-8 text-[13px] text-[#344054]">
                <span>
                  Apertura: 08:15
                </span>

                <span>
                  Operador: Fernando
                </span>
              </div>
            </div>

            {/* EXIT */}
            <button className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#dc2626] text-white shadow-sm transition hover:bg-[#b91c1c]">
              <Power size={22} />
            </button>
          </section>
        </header>

        {/* MODULE BAR */}
        <section className="flex h-14 items-center gap-12 border-b border-[#dfe5ee] bg-white px-6">
          <button className="flex items-center gap-3 border-b-2 border-[#2154d8] pb-4 pt-5 text-[15px] font-semibold text-[#2154d8]">
            <ShoppingCart size={18} />
            <span>CAJA</span>
          </button>

          <button className="flex items-center gap-3 text-[15px] font-semibold text-[#111827]">
            <Package size={18} />
            <span>VENTAS</span>
          </button>

          <button className="flex items-center gap-3 text-[15px] font-semibold text-[#111827]">
            <Users size={18} />
            <span>CLIENTES</span>
          </button>

          <button className="flex items-center gap-3 text-[15px] font-semibold text-[#111827]">
            <Package size={18} />
            <span>INVENTARIO</span>
          </button>

          <button className="flex items-center gap-3 text-[15px] font-semibold text-[#111827]">
            <Settings size={18} />
            <span>CONFIGURACIÓN</span>
          </button>
        </section>

        {/* CONTENT */}
        <section className="flex min-h-0 flex-1 gap-4 p-4">
          {/* LEFT */}
          <section className="flex min-w-0 flex-1 flex-col gap-4">
            {/* FILTER BAR */}
            <div className="flex items-center gap-3">
              <button className="rounded-xl bg-[#2154d8] px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm">
                General
              </button>

              <button className="rounded-xl border border-[#dbe2ea] bg-white px-5 py-2.5 text-[14px] font-medium text-[#344054]">
                Productos
              </button>

              <button className="rounded-xl border border-[#dbe2ea] bg-white px-5 py-2.5 text-[14px] font-medium text-[#344054]">
                Servicios
              </button>
            </div>

            {/* SEARCH */}
            <section className="rounded-3xl border border-[#dfe5ee] bg-[#f7f9fc] p-3 shadow-sm">
              <div className="flex h-14 items-center rounded-2xl border border-[#d9e2ec] bg-white px-5">
                <Search size={22} className="text-[#2154d8]" />

                <input
                  type="text"
                  placeholder="Buscar producto por nombre, código o barra..."
                  className="ml-4 w-full bg-transparent text-[16px] outline-none placeholder:text-[#98a2b3]"
                />
              </div>

              <p className="mt-3 pl-2 text-[13px] text-[#667085]">
                Mínimo 2 caracteres para buscar
              </p>
            </section>

            {/* RESULTS */}
            <section className="flex-1 rounded-3xl border border-[#dfe5ee] bg-[#f7f9fc] p-4 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[18px] font-bold text-[#111827]">
                  Resultados (24)
                </h2>
              </div>

              <div className="flex flex-col gap-3">
                {products.map((product) => (
                  <div
                    key={product}
                    className="flex items-center justify-between rounded-2xl border border-[#e2e8f0] bg-white px-5 py-4 transition hover:border-[#cfd8e3]"
                  >
                    <div>
                      <h3 className="text-[15px] font-semibold text-[#111827]">
                        {product}
                      </h3>

                      <p className="mt-1 text-[14px] text-[#667085]">
                        7751234567890
                      </p>
                    </div>

                    <div className="flex items-center gap-6">
                      <span className="text-[16px] font-semibold text-[#111827]">
                        S/ 8.50
                      </span>

                      <div className="rounded-xl bg-[#eaf8ee] px-4 py-2 text-[14px] font-semibold text-[#16a34a]">
                        Stock: 25
                      </div>

                      <button className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2154d8] text-white shadow-sm transition hover:bg-[#1d4ed8]">
                        +
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </section>

          {/* RIGHT */}
          <aside className="flex w-[420px] flex-col rounded-3xl border border-[#dfe5ee] bg-[#f7f9fc] shadow-sm">
            <div className="border-b border-[#e2e8f0] px-6 py-5">
              <h2 className="text-[18px] font-bold text-[#111827]">
                VENTA VIVA
              </h2>
            </div>

            <div className="flex-1 overflow-auto p-5">
              <TicketGrid />
            </div>
          </aside>
        </section>
      </section>
    </main>
  );
}