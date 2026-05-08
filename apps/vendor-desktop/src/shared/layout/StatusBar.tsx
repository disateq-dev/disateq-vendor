export function StatusBar() {
  return (
    <footer className="flex h-7 items-center justify-between border-t border-zinc-200 bg-white px-3 text-[11px] text-zinc-500">
      <div className="flex items-center gap-3">
        <span>SQLite OK</span>
        <span>0 pendientes</span>
      </div>

      <div className="flex items-center gap-3">
        <span>F1 Buscar</span>
        <span>F4 Cobrar</span>
      </div>
    </footer>
  )
}