import { Store, X } from 'lucide-react'
import type { ReactElement } from 'react'
import { BuscadorProveedor } from './components/BuscadorProveedor'
import { ConsultaSunatProveedor } from './components/ConsultaSunatProveedor'
import { DetalleProveedor } from './components/DetalleProveedor'
import { FormularioProveedor } from './components/FormularioProveedor'
import { useProveedores } from './hooks/useProveedores'

export function ProveedoresWorkspace(): ReactElement {
  const proveedores = useProveedores()

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-slate-50">
      <header className="flex h-16 items-center justify-between border-b border-[#EAF3DE] bg-white px-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF3DE] text-[#639922]">
            <Store className="h-5 w-5" />
          </span>
          <h1 className="text-[15px] font-bold text-slate-900">Proveedores</h1>
        </div>
        {proveedores.error && (
          <button
            type="button"
            onClick={proveedores.onLimpiarError}
            className="flex items-center gap-2 rounded-full bg-[#EAF3DE] px-3 py-1.5 text-[11px] font-bold text-[#639922]"
          >
            {proveedores.error}
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </header>
      {proveedores.modo === 'busqueda' && (
        <BuscadorProveedor
          termino={proveedores.termino}
          resultados={proveedores.resultados}
          cargando={proveedores.cargando}
          onTerminoChange={proveedores.onTerminoChange}
          onSeleccionar={proveedores.onSeleccionar}
          onIrSunat={proveedores.onIrSunat}
          onIrManual={proveedores.onIrManual}
        />
      )}
      {proveedores.modo === 'sunat' && (
        <ConsultaSunatProveedor
          ruc={proveedores.rucConsulta}
          datosRuc={proveedores.datosRuc}
          consultando={proveedores.consultandoSunat}
          error={proveedores.error}
          onRucChange={proveedores.onRucChange}
          onConsultar={proveedores.onConsultarRuc}
          onGuardar={proveedores.onGuardarDesdeSunat}
          onVolver={proveedores.onVolverBusqueda}
        />
      )}
      {proveedores.modo === 'manual' && (
        <section className="flex flex-1 flex-col gap-5 overflow-auto px-6 py-5">
          <FormularioProveedor
            titulo="Registrar proveedor"
            cargando={proveedores.cargando}
            onGuardar={proveedores.onGuardarManual}
            onCancelar={proveedores.onVolverBusqueda}
          />
        </section>
      )}
      {proveedores.modo === 'detalle' && proveedores.proveedorSeleccionado && (
        <DetalleProveedor
          proveedor={proveedores.proveedorSeleccionado}
          cargando={proveedores.cargando}
          onVolver={proveedores.onVolverBusqueda}
          onActualizar={proveedores.onActualizar}
        />
      )}
    </div>
  )
}
