import { Plus, Search } from 'lucide-react'
import { useEffect, useRef, type ReactElement } from 'react'
import type { ProductoComercial } from '../../../../domains/farmacia/types'

interface BuscadorProductoProps {
  termino: string
  resultados: ProductoComercial[]
  cargando: boolean
  onTerminoChange: (t: string) => void
  onSeleccionar: (p: ProductoComercial) => void
  onNuevo: () => void
}

interface ProductoComercialConCategoria extends ProductoComercial {
  categoriaFarmacia?: string
}

function categoriaProducto(producto: ProductoComercial): string {
  const productoConCategoria = producto as ProductoComercialConCategoria
  return productoConCategoria.categoriaFarmacia ?? 'SIN CATEGORIA'
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
  onNuevo,
}: BuscadorProductoProps): ReactElement {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <section className="flex min-h-0 flex-1 items-start justify-center px-6 py-14">
      <div className="w-full max-w-3xl">
        <p className="mb-4 text-center text-[13px] font-semibold text-slate-600">
          Busca por nombre, IFA, fabricante, código de barras o registro sanitario
        </p>
        <div className="relative">
          <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#639922]" />
          <input
            ref={inputRef}
            value={termino}
            onChange={(event) => onTerminoChange(event.target.value)}
            className="h-16 w-full rounded-[28px] border border-[#EAF3DE] bg-white pl-14 pr-6 text-[18px] font-semibold text-slate-800 shadow-sm outline-none transition focus:border-[#639922] focus:ring-4 focus:ring-[#EAF3DE]"
            placeholder="Ej: Paracetamol, Amoxicilina, EN08232..."
          />
        </div>

        {termino.trim().length < 2 && (
          <p className="mt-3 text-center text-[12px] font-medium text-slate-500">
            Escribe al menos 2 caracteres para ver resultados
          </p>
        )}

        {cargando && termino.trim().length >= 2 && (
          <p className="mt-5 text-center text-[13px] font-semibold text-[#639922]">Buscando...</p>
        )}

        {!cargando && termino.trim().length >= 2 && (
          <div className="mt-5 overflow-hidden rounded-2xl border border-[#EAF3DE] bg-white shadow-sm">
            {resultados.map((producto) => (
              <button
                key={producto.id}
                type="button"
                onClick={() => onSeleccionar(producto)}
                className="block w-full border-b border-[#EAF3DE] px-5 py-4 text-left transition hover:bg-[#EAF3DE]"
              >
                <div className="text-[14px] font-bold text-slate-800">{textoPrincipal(producto)}</div>
                <div className="mt-1 text-[12px] font-medium text-slate-500">
                  {producto.nombreFabricante}
                  {producto.registroSanitario ? ` · RS ${producto.registroSanitario}` : ''}
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full bg-[#EAF3DE] px-2.5 py-1 text-[10px] font-bold uppercase text-[#639922]">
                    {producto.condicionVenta}
                  </span>
                  <span className="rounded-full bg-[#EAF3DE] px-2.5 py-1 text-[10px] font-bold uppercase text-[#639922]">
                    {categoriaProducto(producto)}
                  </span>
                  {producto.requiereLote && (
                    <span className="rounded-full bg-[#EAF3DE] px-2.5 py-1 text-[10px] font-bold uppercase text-[#639922]">
                      Lote
                    </span>
                  )}
                  {producto.requiereCadenaFrio && (
                    <span className="rounded-full bg-[#EAF3DE] px-2.5 py-1 text-[10px] font-bold uppercase text-[#639922]">
                      Cadena de frío
                    </span>
                  )}
                </div>
              </button>
            ))}
            <button
              type="button"
              onClick={onNuevo}
              className="flex w-full items-center gap-3 px-5 py-4 text-left text-[13px] font-bold text-[#639922] transition hover:bg-[#EAF3DE]"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#EAF3DE]">
                <Plus className="h-4 w-4" />
              </span>
              Crear nuevo producto: {termino.trim()}
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
