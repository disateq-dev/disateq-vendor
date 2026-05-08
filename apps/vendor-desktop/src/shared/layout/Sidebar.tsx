export function Sidebar() {
  return (
    <aside className="flex w-[220px] flex-col border-r border-zinc-200 bg-white">
      <div className="border-b border-zinc-200 px-4 py-3">
        <h1 className="text-sm font-semibold tracking-tight text-zinc-900">
          DisateQ VENDOR™
        </h1>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2">
        <button className="rounded-md bg-zinc-900 px-3 py-2 text-left text-sm font-medium text-white">
          Ventas
        </button>

        <button className="rounded-md px-3 py-2 text-left text-sm text-zinc-600 hover:bg-zinc-100">
          Productos
        </button>

        <button className="rounded-md px-3 py-2 text-left text-sm text-zinc-600 hover:bg-zinc-100">
          Clientes
        </button>

        <button className="rounded-md px-3 py-2 text-left text-sm text-zinc-600 hover:bg-zinc-100">
          Caja
        </button>
      </nav>
    </aside>
  )
}