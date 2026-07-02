import { Search, X } from 'lucide-react'
import { useEffect, useCallback } from 'react'
import type { ReactElement } from 'react'
import type { ProductoComercial } from '../../../../domains/farmacia/types'
import { usePOS } from '../../../../context/POSContext'

interface BuscadorProductoProps {
  termino: string
  indiceSeleccionado: number
  productoConfirmado: boolean
  resultados: ProductoComercial[]
  cargando: boolean
  onTerminoChange: (t: string) => void
  onSeleccionar: (p: ProductoComercial) => void
  onLimpiar: () => void
  onPreview: (p: ProductoComercial | null) => void
  inputRef: React.RefObject<HTMLInputElement | null>
  onNavegaTeclado: (key: string) => void
}

function textoPrincipal(producto: ProductoComercial): string {
  return [producto.nombreComercial, producto.concentracion, producto.formaFarmaceutica].filter(Boolean).join(' · ')
}

export function BuscadorProducto({
  termino,
  indiceSeleccionado,
  productoConfirmado,
  resultados,
  cargando,
  onTerminoChange,
  onSeleccionar,
  onLimpiar,
  onPreview,
  inputRef,
  onNavegaTeclado,
}: BuscadorProductoProps): ReactElement {
  const { activeOperator } = usePOS()
  const esAdmin = activeOperator?.codigoRol === 'ADMIN'

  useEffect(() => {
    if (termino === '') inputRef.current?.focus()
  }, [termino])

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (e.key === 'Escape') {
      e.preventDefault()
      if (!productoConfirmado) {
        onPreview(null)
        onLimpiar()
      }
    } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter') {
      e.preventDefault()
      if (productoConfirmado && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter')) return
      onNavegaTeclado(e.key)
    }
  }, [onLimpiar, onNavegaTeclado, onPreview, productoConfirmado])

  return (
    <section className="flex min-h-0 flex-1 flex-col px-3 py-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#1E88C7]" />
        <input
          ref={inputRef}
          value={termino}
          onChange={(e) => onTerminoChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Buscar producto..."
          className="h-[38px] w-full rounded-xl border border-[var(--dv-input-border)] bg-white pl-9 pr-8 text-[13px] font-semibold text-slate-800 outline-none transition focus:border-[var(--dv-input-border-focus)] focus:ring-2 focus:ring-[var(--dv-input-ring-focus)] placeholder:text-[#b8c4cf]"
        />
        {termino.length > 0 && (
          <button
            type="button"
            onClick={() => {
              onLimpiar()
              inputRef.current?.focus()
            }}
            className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {termino.trim().length === 0 && (
        <div className="flex flex-col items-center justify-center py-14">
          <Search size={28} className="text-[#1E88C7]/30" />
          <p className="mt-3 text-center text-[12px] text-slate-400">
            Código, nombre, principio activo, laboratorio o fabricante, código de barras
          </p>
          <p className="mt-1 text-center text-[10px] text-slate-300">
            Escribe al menos 2 caracteres para ver resultados
          </p>
        </div>
      )}

      {cargando && termino.trim().length >= 2 && (
        <p className="mt-3 text-[11px] font-semibold text-[#1E88C7]">Buscando...</p>
      )}

      {!cargando && termino.trim().length >= 2 && resultados.length > 0 && (
        <>
          <p className="mt-2 mb-1 text-[11px] text-slate-400">
            ↑ ↓ para navegar · Enter para ver detalle
          </p>
          <div className="mt-2 overflow-hidden rounded-xl border border-[#E3F1FA] bg-white">
            {resultados.map((producto, idx) => {
              const estaSeleccionado = idx === indiceSeleccionado
              const codigoReferencia = producto.codigoDIGEMID ?? `${producto.id.slice(0, 8)}...`
              const textoSecundario = esAdmin
                ? `${codigoReferencia} · ${producto.nombreFabricante}`
                : producto.nombreFabricante

              const textoLote = producto.requiereLote ? 'Lote' : 'Sin lote'

              return (
                <button
                  key={producto.id}
                  type="button"
                  ref={estaSeleccionado ? (el => el?.scrollIntoView({ block: 'nearest' })) : null}
                  onClick={() => { onPreview(null); onSeleccionar(producto); inputRef.current?.focus() }}
                  className={`block w-full border-b border-[#E3F1FA] px-3 py-2 text-left transition ${estaSeleccionado ? 'bg-[#E3F1FA]' : 'hover:bg-[#E3F1FA]'} ${productoConfirmado && idx !== indiceSeleccionado ? 'opacity-40' : ''}`}
                >
                  <div className="text-[12px] font-semibold text-slate-800">{textoPrincipal(producto)}</div>
                  <div className="mt-0.5 text-[10px] text-slate-500">
                    {textoSecundario} · {textoLote}
                  </div>
                </button>
              )
            })}
          </div>
        </>
      )}
    </section>
  )
}
