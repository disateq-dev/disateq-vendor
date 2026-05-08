import { SalesPanel } from '../../modules/sales/components/SalesPanel'

import { StatusBar } from './StatusBar'
import { Topbar } from './Topbar'

export function AppShell() {
  return (
    <div className="flex h-screen flex-col bg-zinc-100">
      <Topbar />

      {/* MAIN TABS */}
      <div className="border-b border-zinc-200 bg-white px-4">
        <div className="flex h-11 items-end gap-4">
          <button className="border-b-2 border-emerald-700 bg-emerald-50/40 px-1.5 pb-2 text-[12px] font-semibold uppercase tracking-wide text-emerald-700">
            Ventas
          </button>

          <button className="border-b-2 border-transparent px-1.5 pb-2 text-[12px] font-medium uppercase tracking-wide text-zinc-500 transition-colors hover:text-zinc-900">
            Caja
          </button>

          <button className="border-b-2 border-transparent px-1.5 pb-2 text-[12px] font-medium uppercase tracking-wide text-zinc-500 transition-colors hover:text-zinc-900">
            Clientes
          </button>

          <button className="border-b-2 border-transparent px-1.5 pb-2 text-[12px] font-medium uppercase tracking-wide text-zinc-500 transition-colors hover:text-zinc-900">
            Productos
          </button>

          <button className="border-b-2 border-transparent px-1.5 pb-2 text-[12px] font-medium uppercase tracking-wide text-zinc-500 transition-colors hover:text-zinc-900">
            Historial
          </button>
        </div>
      </div>

      {/* SUBBAR */}
      <div className="border-b border-emerald-100 bg-emerald-50/40 px-4">
        <div className="flex h-9 items-center gap-4 text-sm">
          <button className="font-medium text-emerald-700">
            Nueva venta
          </button>

          <button className="text-zinc-600 hover:text-zinc-900">
            Cotizaciones
          </button>

          <button className="text-zinc-600 hover:text-zinc-900">
            Devoluciones
          </button>
        </div>
      </div>

      <main className="flex-1 overflow-hidden">
        <SalesPanel />
      </main>

      <StatusBar />
    </div>
  )
}