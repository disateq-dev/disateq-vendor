import { Search, X } from 'lucide-react'
import { useRef, useEffect, useState, useCallback } from 'react'
import type { ReactElement } from 'react'
import type { ProductoComercial } from '../../../../domains/farmacia/types'
import { usePOS } from '../../../../context/POSContext'

interface BuscadorProductoProps {
  termino: string
  resultados: ProductoComercial[]
  cargando: boolean
  onTerminoChange: (t: string) => void
  onSeleccionar: (p: ProductoComercial) => void
  onLimpiar: () => void
  onPreview: (p: ProductoComercial | null) => void
}

function textoPrincipal(producto: ProductoComercial): string {
  return [producto.nombreComercial, producto.concentracion, producto.formaFarmaceutica].filter(Boolean).join(' · ')
}

export function BuscadorProducto({
  termino,
  resultados,
  cargando,
  onTerminoChange,
  onSeleccionar,
  onLimpiar,
  onPreview,
}: BuscadorProductoProps): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null)
  const { activeOperator } = usePOS()
  const esAdmin = activeOperator?.codigoRol === 'ADMIN'
  const [indiceSeleccionado, setIndiceSeleccionado] = useState<number>(-1)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => { setIndiceSeleccionado(-1) }, [termino])

  const onKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>): void => {
    if (resultados.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setIndiceSeleccionado(i => {
        const siguiente = i + 1 >= resultados.length ? 0 : i + 1
        onPreview(resultados[siguiente] ?? null)
        return siguiente
      })
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setIndiceSeleccionado(i => {
        const anterior = i <= 0 ? resultados.length - 1 : i - 1
        onPreview(resultados[anterior] ?? null)
        return anterior
      })
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const producto = indiceSeleccionado >= 0 ? resultados[indiceSeleccionado] : resultados[0]
      if (producto) {
        onPreview(null)
        onSeleccionar(producto)
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onPreview(null)
      onLimpiar()
    }
  }, [resultados, indiceSeleccionado, onSeleccionar, onLimpiar, onPreview])

  return (
    <section className="flex min-h-0 flex-1 flex-col px-3 py-3">
      <div className="mb-2 flex items-baseline gap-2">
        <span className="text-[12px] font-bold uppercase tracking-wide text-slate-700">
          Buscar producto
        </span>
        <span className="text-[10px] text-slate-400">
          Escribe al menos 2 caracteres para ver resultados
        </span>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#0284C7]" />
        <input
          ref={inputRef}
          value={termino}
          onChange={(e) => onTerminoChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Código, nombre, principio activo, fabricante o cód. barras..."
          className="h-[38px] w-full rounded-xl border border-[#E0F2FE] bg-white pl-9 pr-8 text-[13px] font-semibold text-slate-800 outline-none transition focus:border-[#0284C7] focus:ring-2 focus:ring-[#E0F2FE] placeholder:text-[#b8c4cf]"
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

      {cargando && termino.trim().length >= 2 && (
        <p className="mt-3 text-[11px] font-semibold text-[#0284C7]">Buscando...</p>
      )}

      {!cargando && termino.trim().length >= 2 && resultados.length > 0 && (
        <>
          <p className="mt-0.5 mb-1 text-[11px] text-slate-400">
            ↑ ↓ para navegar · Enter para ver detalle
          </p>
          <div className="mt-2 overflow-hidden rounded-xl border border-[#E0F2FE] bg-white">
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
                  className={`block w-full border-b border-[#E0F2FE] px-3 py-2 text-left transition ${estaSeleccionado ? 'bg-[#E0F2FE]' : 'hover:bg-[#E0F2FE]'}`}
                >
                  <div className="text-[13px] font-semibold text-slate-800">{textoPrincipal(producto)}</div>
                  <div className="mt-0.5 text-[11px] text-slate-500">
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
