import { Search } from 'lucide-react'
import { useEffect, useRef, type ReactElement } from 'react'
import type { ProductoComercial } from '../../../../domains/farmacia/types'

interface BuscadorProductoProps {
  termino: string
  resultados: ProductoComercial[]
  cargando: boolean
  onTerminoChange: (t: string) => void
  onSeleccionar: (p: ProductoComercial) => void
}

function categoriaProducto(producto: ProductoComercial): string {
  return producto.categoriaFarmacia ?? 'SIN CATEGORIA'
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
}: BuscadorProductoProps): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <section className="flex min-h-0 flex-1 flex-col px-3 py-3">
      <p className="mb-2 text-[11px] font-medium text-slate-400">
        Busca por nombre, IFA, fabricante, código de barras o registro sanitario
      </p>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#0D9488]" />
        <input
          ref={inputRef}
          value={termino}
          onChange={(event) => onTerminoChange(event.target.value)}
          className="h-[38px] w-full rounded-xl border border-[#E6F7F6] bg-white pl-9 pr-3 text-[13px] font-semibold text-slate-800 outline-none transition focus:border-[#0D9488] focus:ring-2 focus:ring-[#E6F7F6]"
          placeholder="Ej: Paracetamol, Amoxicilina, EN08232..."
        />
      </div>

      {termino.trim().length < 2 && (
        <p className="mt-1.5 text-[11px] text-slate-400">Escribe al menos 2 caracteres para ver resultados</p>
      )}

      {cargando && termino.trim().length >= 2 && (
        <p className="mt-3 text-[11px] font-semibold text-[#0D9488]">Buscando...</p>
      )}

      {!cargando && termino.trim().length >= 2 && (
        <div className="mt-2 overflow-hidden rounded-xl border border-[#E6F7F6] bg-white">
          {resultados.map((producto) => (
            <button
              key={producto.id}
              type="button"
              onClick={() => onSeleccionar(producto)}
              className="block w-full border-b border-[#E6F7F6] px-3 py-2 text-left transition hover:bg-[#E6F7F6]"
            >
              <div className="text-[13px] font-semibold text-slate-800">{textoPrincipal(producto)}</div>
              <div className="mt-0.5 text-[11px] text-slate-500">
                {producto.nombreFabricante}
                {producto.registroSanitario ? ` · RS ${producto.registroSanitario}` : ''}
              </div>
              <div className="mt-1 flex flex-wrap gap-1">
                <span className="rounded-full bg-[#E6F7F6] px-2 py-0.5 text-[10px] font-bold uppercase text-[#0D9488]">
                  {producto.condicionVenta}
                </span>
                <span className="rounded-full bg-[#E6F7F6] px-2 py-0.5 text-[10px] font-bold uppercase text-[#0D9488]">
                  {categoriaProducto(producto)}
                </span>
                {producto.requiereLote && (
                  <span className="rounded-full bg-[#E6F7F6] px-2 py-0.5 text-[10px] font-bold uppercase text-[#0D9488]">
                    Lote
                  </span>
                )}
                {producto.requiereCadenaFrio && (
                  <span className="rounded-full bg-[#E6F7F6] px-2 py-0.5 text-[10px] font-bold uppercase text-[#0D9488]">
                    Cadena de frío
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}
