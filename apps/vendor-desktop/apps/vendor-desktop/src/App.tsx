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

              <div className="flex flex-col leading-tight">
                <span className="text-[16px] font-bold tracking-tight text-[#0f172a]">
                  DisateQ VENDOR™
                </span>

                <span className="mt-0.5 text-[11px] font-medium text-[#667085]">
                  Ventas y Gestión Administrativa para Negocios
                </span>
              </div>
            </div>

            <div className="h-12 w-px bg-[#e5e7eb]" />

            {/* BUSINESS */}
            <div className="px-8">
              <div className="flex items-center gap-3">
                <span className="text-[15px] font-bold text-[#111827]">
                  ALMACÉN DE ABARROTES PEÑA
                </span>

                <span className="text-[14px] font-medium text-[#475467]">
                  Tienda Mercado Central
                </span>
              </div>

              <div className="mt-2 flex items-center gap-3">
                <span className="text-[14px] text-[#475467]">
                  20608399349
                </span>

                <span className="h-1 w-1 rounded-full bg-[#cbd5e1]" />

                <span className="text-[14px] text-[#475467]">
                  CONSORCIO PEÑA S.A.C.
                </span>
              </div>
            </div>
          </section>

          {/* RIGHT */}
          <section className="flex items-center gap-4">
            {/* BOX */}
            <div className="flex items-center gap-4 rounded-2xl border border-[#dbe3ef] bg-[#22c55e]/[0.04] px-5 py-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2154d8] text-white">
                <ShoppingCart size={20} />
              </div>

              <div className="flex flex-col leading-tight">
                <div className="flex items-center gap-2">
                  <span className="text-[14px] font-semibold text-[#111827]">
                    Caja Ventas 01
                  </span>

                  <span className="rounded-full bg-[#22c55e]/10 px-2 py-[2px] text-[10px] font-medium text-[#15803d]">
                    Turno activo
                  </span>
                </div>

                <span className="mt-1 text-[12px] text-[#667085]">
                  Apertura: 08:15 • Fernando T.
                </span>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex items-center gap-2">
              <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#dbe3ef] bg-white text-[#475467] transition hover:bg-[#f8fafc]">
                <Settings size={18} />
              </button>

              <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#dbe3ef] bg-white text-[#475467] transition hover:bg-[#f8fafc]">
                <Users size={18} />
              </button>

              <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#dbe3ef] bg-white text-[#dc2626] transition hover:bg-[#fef2f2]">
                <Power size={18} />
              </button>
            </div>
          </section>
        </header>

        {/* MODULE BAR */}
        <section className="flex h-[58px] items-center border-b border-[#e2e8f0] bg-[#f8fafc] px-6">
          <div className="flex items-center gap-2">
            <button className="rounded-xl bg-[#2154d8] px-5 py-2.5 text-[14px] font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8]">
              Ventas
            </button>

            <button className="rounded-xl px-5 py-2.5 text-[14px] font-medium text-[#475467] transition hover:bg-white">
              Productos
            </button>

            <button className="rounded-xl px-5 py-2.5 text-[14px] font-medium text-[#475467] transition hover:bg-white">
              Clientes
            </button>

            <button className="rounded-xl px-5 py-2.5 text-[14px] font-medium text-[#475467] transition hover:bg-white">
              Caja
            </button>

            <button className="rounded-xl px-5 py-2.5 text-[14px] font-medium text-[#475467] transition hover:bg-white">
              Reportes
            </button>

            <button className="rounded-xl px-5 py-2.5 text-[14px] font-medium text-[#475467] transition hover:bg-white">
              Configuración
            </button>
          </div>
        </section>

        {/* WORKSPACE */}
        <section className="grid flex-1 grid-cols-[1fr_420px] gap-5 overflow-hidden p-5">
          {/* LEFT */}
          <section className="flex min-w-0 flex-col overflow-hidden rounded-3xl border border-[#dbe3ef] bg-white">
            {/* SEARCH */}
            <div className="border-b border-[#eef2f6] p-5">
              <div className="flex items-center gap-4">
                <div className="flex h-12 flex-1 items-center gap-3 rounded-2xl border border-[#dbe3ef] bg-[#f8fafc] px-4">
                  <Search size={18} className="text-[#667085]" />

                  <input
                    placeholder="Buscar producto por nombre o código..."
                    className="w-full bg-transparent text-[15px] outline-none placeholder:text-[#98a2b3]"
                  />
                </div>

                <button className="flex h-12 items-center gap-2 rounded-2xl bg-[#2154d8] px-5 text-[14px] font-semibold text-white transition hover:bg-[#1d4ed8]">
                  <Package size={18} />
                  Productos
                </button>
              </div>
            </div>

            {/* PRODUCTS */}
            <div className="flex-1 overflow-auto p-5">
              <div className="grid grid-cols-3 gap-4">
                {products.map((product) => (
                  <button
                    key={product}
                    className="rounded-2xl border border-[#e2e8f0] bg-[#fbfcfe] p-5 text-left transition hover:border-[#bfd1ff] hover:bg-white"
                  >
                    <div className="mb-4 h-28 rounded-2xl bg-[#eef2f7]" />

                    <span className="line-clamp-2 text-[14px] font-medium text-[#111827]">
                      {product}
                    </span>

                    <div className="mt-4 flex items-center justify-between">
                      <span className="text-[18px] font-bold text-[#111827]">
                        S/ 12.90
                      </span>

                      <span className="rounded-full bg-[#22c55e]/10 px-2.5 py-1 text-[11px] font-medium text-[#15803d]">
                        Stock
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* RIGHT */}
          <section className="overflow-hidden rounded-3xl border border-[#dbe3ef] bg-white">
            <TicketGrid />
          </section>
        </section>
      </section>
    </main>
  );
}