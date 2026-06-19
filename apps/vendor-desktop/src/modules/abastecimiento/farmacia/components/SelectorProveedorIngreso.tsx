import { Store } from 'lucide-react'
import { useEffect, useRef, type ChangeEvent, type ReactElement } from 'react'
import type { Proveedor } from '../../../../domains/farmacia/types'

interface SelectorProveedorIngresoProps {
  proveedorSeleccionado: Proveedor | null
  termino: string
  resultados: Proveedor[]
  buscando: boolean
  onTerminoChange: (t: string) => void
  onSeleccionar: (p: Proveedor) => void
}

export function SelectorProveedorIngreso({
  proveedorSeleccionado,
  termino,
  resultados,
  buscando,
  onTerminoChange,
  onSeleccionar,
}: SelectorProveedorIngresoProps): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (proveedorSeleccionado === null) inputRef.current?.focus()
  }, [proveedorSeleccionado])

  if (proveedorSeleccionado) {
    return (
      <button
        type="button"
        onClick={() => onTerminoChange('')}
        className="flex w-full items-center gap-3 rounded-2xl border border-[#EAF3DE] bg-white p-4 text-left"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EAF3DE] text-[#639922]">
          <Store className="h-5 w-5" />
        </span>
        <span>
          <span className="block text-[14px] font-bold text-slate-900">{proveedorSeleccionado.razonSocial}</span>
          <span className="block text-[12px] font-semibold text-slate-500">{proveedorSeleccionado.ruc ?? 'Sin RUC'}</span>
        </span>
      </button>
    )
  }

  return (
    <div className="relative rounded-2xl border border-[#EAF3DE] bg-white p-4">
      <label className="block">
        <span className="text-[11px] font-bold uppercase text-slate-500">Proveedor</span>
        <input
          ref={inputRef}
          value={termino}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onTerminoChange(event.target.value)}
          placeholder="Buscar proveedor..."
          className="mt-2 h-11 w-full rounded-xl border border-[#EAF3DE] px-3 text-[13px] font-semibold outline-none focus:border-[#639922]"
        />
      </label>
      {buscando && <p className="mt-2 text-[12px] font-bold text-[#639922]">Buscando...</p>}
      {termino.trim().length >= 2 && resultados.length > 0 && (
        <div className="absolute left-4 right-4 top-[92px] z-20 overflow-hidden rounded-xl border border-[#EAF3DE] bg-white shadow-lg">
          {resultados.map((proveedor) => (
            <button
              key={proveedor.id}
              type="button"
              onClick={() => onSeleccionar(proveedor)}
              className="block w-full border-b border-[#EAF3DE] px-4 py-3 text-left hover:bg-[#EAF3DE]"
            >
              <span className="block text-[13px] font-bold text-slate-800">{proveedor.razonSocial}</span>
              <span className="block text-[11px] font-semibold text-slate-500">{proveedor.ruc ?? 'Sin RUC'}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
