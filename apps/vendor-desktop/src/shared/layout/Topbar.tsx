export function Topbar() {
  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="flex h-[72px] items-center justify-between px-4">
        {/* LEFT */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-zinc-900" />

          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight text-zinc-900">
              ALMACEN DE ABARROTES PEÑA
              <span className="mx-2 text-zinc-300">|</span>
              Tienda Mercado Central
            </div>

            <div className="mt-1 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              20608399349
              <span className="mx-2 text-zinc-300">|</span>
              CONSORCIO PEÑA S.A.C.
            </div>
          </div>
        </div>

        {/* CENTER */}
        <div className="text-center leading-tight">
          <div className="text-sm font-semibold tracking-tight text-emerald-600">
            Caja 02
            <span className="mx-2 text-zinc-300">|</span>
            Caja ABIERTA
          </div>

          <div className="mt-1 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            Apertura 08:00 AM
            <span className="mx-2 text-zinc-300">|</span>
            Cierre --:--
          </div>
        </div>

        {/* RIGHT */}
        <div className="text-right leading-tight">
          <div className="text-sm font-semibold tracking-tight text-zinc-900">
            VENTA #00000012
          </div>

          <div className="mt-1 flex items-center justify-end gap-2 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
            <span>👤 Admin</span>

            <button className="text-zinc-400 hover:text-zinc-700">
              ⚙
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}