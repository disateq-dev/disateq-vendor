import { Pill, Plus, X } from 'lucide-react'
import type { ReactElement } from 'react'
import { BuscadorProducto } from './components/BuscadorProducto'
import { DetalleProducto } from './components/DetalleProducto'
import { NuevoProductoStepper } from './components/NuevoProductoStepper'
import { useCatalogoFarmacia } from './hooks/useCatalogoFarmacia'

export function CatalogoFarmaciaWorkspace(): ReactElement {
  const catalogo = useCatalogoFarmacia()

  return (
    <section className="flex min-h-0 flex-1 gap-2">

      {/* Panel izquierdo — Búsqueda / Detalle */}
      <div className="flex flex-[35] shrink-0 flex-col overflow-hidden rounded-[28px] border border-[#639922]/50 bg-[#FDFCF9]">
        <div className="shrink-0 flex h-[42px] items-center justify-between gap-2 px-4 border-b bg-[#EAF3DE]/60 border-[#639922]/15">
          <div className="flex items-center gap-2">
            <Pill size={13} strokeWidth={2} className="shrink-0 text-[#639922]" />
            <span className="text-[13px] font-semibold uppercase tracking-tight leading-none text-[#121416]">CATÁLOGO</span>
          </div>
          {catalogo.error && (
            <button
              type="button"
              onClick={catalogo.onLimpiarError}
              className="flex min-w-0 items-center gap-2 rounded-full bg-[#EAF3DE] px-3 py-1 text-[11px] font-bold text-[#639922]"
            >
              <span className="truncate">{catalogo.error}</span>
              <X className="h-3.5 w-3.5 shrink-0" />
            </button>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-auto">
          {catalogo.panelIzquierdo === 'busqueda' && (
            <BuscadorProducto
              termino={catalogo.termino}
              resultados={catalogo.resultados}
              cargando={catalogo.cargando}
              onTerminoChange={catalogo.onTerminoChange}
              onSeleccionar={catalogo.onSeleccionar}
              onNuevo={catalogo.onNuevo}
            />
          )}

          {catalogo.panelIzquierdo === 'detalle' && catalogo.productoSeleccionado && (
            <DetalleProducto
              producto={catalogo.productoSeleccionado}
              presentaciones={catalogo.presentaciones}
              nodos={catalogo.nodos}
              tabActiva={catalogo.tabDetalle}
              cargando={catalogo.cargando}
              onTabChange={catalogo.onTabChange}
              onVolver={catalogo.onVolverBusqueda}
            />
          )}
        </div>
      </div>

      {/* Panel derecho — Creación / Empty state */}
      <div className="flex min-h-0 flex-[65] flex-col overflow-hidden rounded-[28px] border border-[#639922]/30 bg-[#FDFCF9]">
        <div className="shrink-0 flex h-[42px] items-center gap-2 px-4 border-b bg-[#EAF3DE]/60 border-[#639922]/15">
          {catalogo.creandoAbierto
            ? <X    size={13} strokeWidth={2} className="shrink-0 text-[#639922]" />
            : <Plus size={13} strokeWidth={2} className="shrink-0 text-[#639922]" />
          }
          <span className="text-[13px] font-semibold uppercase tracking-tight leading-none text-[#121416]">
            {catalogo.creandoAbierto ? 'NUEVO PRODUCTO' : 'DETALLE'}
          </span>
        </div>

        <div className="min-h-0 flex-1 flex flex-col overflow-auto">
          {!catalogo.creandoAbierto && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3DE] text-[#639922]">
                <Plus className="h-7 w-7" />
              </span>
              <p className="text-[13px] font-semibold text-slate-500">
                Selecciona un producto para ver su detalle, o registra uno nuevo
              </p>
              <button
                type="button"
                onClick={catalogo.onNuevo}
                className="rounded-xl bg-[#639922] px-5 py-2 text-[12px] font-bold text-white"
              >
                + Nuevo producto
              </button>
            </div>
          )}

          {catalogo.creandoAbierto && (
            <NuevoProductoStepper
              paso={catalogo.pasoNuevo}
              terminoBusqueda={catalogo.termino}
              cargando={catalogo.cargando}
              error={catalogo.error}
              onPasoSiguiente={catalogo.onPasoSiguiente}
              onPasoAnterior={catalogo.onPasoAnterior}
              onCancelar={catalogo.onCerrarCreacion}
              onGuardar={catalogo.onGuardarProducto}
            />
          )}
        </div>
      </div>

    </section>
  )
}
