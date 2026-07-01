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
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[#3B6B34]/50 bg-[#FDFCF9]">
      <div className="shrink-0 flex h-[42px] items-center justify-between gap-2 px-4 border-b bg-[#E8F0E6]/60 border-[#3B6B34]/15">
        <div className="flex items-center gap-2">
          <Store size={13} strokeWidth={2} className="shrink-0 text-[#3B6B34]" />
          <span className="text-[13px] font-semibold uppercase tracking-tight leading-none text-[#121416]">
            {proveedores.modo === 'busqueda' && 'PROVEEDORES'}
            {proveedores.modo === 'sunat' && 'CONSULTA SUNAT'}
            {proveedores.modo === 'manual' && 'NUEVO PROVEEDOR'}
            {proveedores.modo === 'detalle' && 'DETALLE PROVEEDOR'}
          </span>
        </div>
        {proveedores.error && (
          <button
            type="button"
            onClick={proveedores.onLimpiarError}
            className="flex min-w-0 items-center gap-2 rounded-full bg-[#E8F0E6] px-3 py-1 text-[11px] font-bold text-[#3B6B34]"
          >
            <span className="truncate">{proveedores.error}</span>
            <X className="h-3.5 w-3.5 shrink-0" />
          </button>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-auto">
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
    </div>
  )
}
