import { Pill, Plus, X } from 'lucide-react'
import type { ReactElement } from 'react'
import { BuscadorProducto } from './components/BuscadorProducto'
import { DetalleProducto } from './components/DetalleProducto'
import { NuevoProductoStepper } from './components/NuevoProductoStepper'
import { useCatalogoFarmacia } from './hooks/useCatalogoFarmacia'

export function CatalogoFarmaciaWorkspace(): ReactElement {
  const catalogo = useCatalogoFarmacia()

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-50">
      <header className="flex h-16 items-center justify-between border-b border-[#EAF3DE] bg-white px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3DE] text-[#639922]">
            <Pill className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-[15px] font-bold text-slate-900">Catálogo farmacia</h1>
          </div>
        </div>
        {catalogo.error && (
          <button
            type="button"
            onClick={catalogo.onLimpiarError}
            className="flex items-center gap-2 rounded-full bg-[#EAF3DE] px-3 py-1.5 text-[11px] font-bold text-[#639922]"
          >
            {catalogo.error}
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-h-0 flex-[35] flex-col overflow-auto border-r border-[#EAF3DE]">
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

        <div className="flex min-h-0 flex-[65] flex-col overflow-auto">
          {!catalogo.creandoAbierto && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EAF3DE] text-[#639922]">
                <Plus className="h-7 w-7" />
              </span>
              <p className="text-[13px] font-semibold text-slate-500">
                Selecciona un producto para ver su detalle, o registra uno nuevo
              </p>
              <button type="button" onClick={catalogo.onNuevo} className="rounded-xl bg-[#639922] px-5 py-2 text-[12px] font-bold text-white">
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
    </div>
  )
}
