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
  onIrSunat: () => void
  onIrManual: () => void
}

export function SelectorProveedorIngreso({
  proveedorSeleccionado,
  termino,
  resultados,
  buscando,
  onTerminoChange,
  onSeleccionar,
  onIrSunat,
  onIrManual,
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
        className="flex w-full items-center gap-3 rounded-2xl border border-[#E3F1FA] bg-white p-4 text-left"
      >
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E3F1FA] text-[#1E88C7]">
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
    <div className="relative rounded-2xl border border-[#E3F1FA] bg-white p-4">
      <label className="block">
        <span className="text-[11px] font-bold uppercase text-slate-500">Proveedor</span>
        <input
          ref={inputRef}
          value={termino}
          onChange={(event: ChangeEvent<HTMLInputElement>) => onTerminoChange(event.target.value)}
          placeholder="Buscar proveedor..."
          className="mt-2 h-11 w-full rounded-xl border border-[var(--dv-input-border)] px-3 text-[13px] font-semibold outline-none focus:border-[var(--dv-input-border-focus)]"
        />
      </label>
      {buscando && <p className="mt-2 text-[12px] font-bold text-[#1E88C7]">Buscando...</p>}
      {termino.trim().length >= 2 && !buscando && resultados.length === 0 && (
        <div className="mt-3 rounded-xl border border-[#E3F1FA] p-3">
          <p className="text-[12px] font-bold text-slate-700">No encontrado</p>
          <div className="mt-2 flex gap-2">
            <button type="button" onClick={onIrSunat} className="rounded-xl border border-[#45b356]/40 px-3 py-2 text-[12px] font-bold text-[#45b356] hover:bg-[#F2F7F3]">
              Consultar SUNAT por RUC
            </button>
            <button type="button" onClick={onIrManual} className="rounded-xl border border-[#45b356]/40 px-3 py-2 text-[12px] font-bold text-[#45b356] hover:bg-[#F2F7F3]">
              Registrar manualmente
            </button>
          </div>
        </div>
      )}
      {termino.trim().length >= 2 && resultados.length > 0 && (
        <div className="absolute left-4 right-4 top-[92px] z-20 overflow-hidden rounded-xl border border-[#E3F1FA] bg-white shadow-lg">
          {resultados.map((proveedor) => (
            <button
              key={proveedor.id}
              type="button"
              onClick={() => onSeleccionar(proveedor)}
              className="block w-full border-b border-[#E3F1FA] px-4 py-3 text-left hover:bg-[#E3F1FA]"
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
