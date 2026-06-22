import type { ReactElement } from 'react'
import type { ModificarProveedorInput, CrearProveedorInput, Proveedor } from '../../../../domains/farmacia/types'
import { FormularioProveedor } from './FormularioProveedor'

interface DetalleProveedorProps {
  proveedor: Proveedor
  cargando: boolean
  onVolver: () => void
  onActualizar: (datos: ModificarProveedorInput) => Promise<void>
}

export function DetalleProveedor({
  proveedor,
  cargando,
  onVolver,
  onActualizar,
}: DetalleProveedorProps): ReactElement {
  const guardar = async (datos: CrearProveedorInput): Promise<void> => {
    await onActualizar({ id: proveedor.id, ...datos })
  }

  return (
    <section className="flex flex-1 flex-col gap-5 overflow-auto px-6 py-5">
      <button type="button" onClick={onVolver} className="w-fit text-[12px] font-bold text-[#639922]">
        ← Volver
      </button>
      <header className="rounded-2xl border border-[#EAF3DE] bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-[20px] font-bold text-slate-900">{proveedor.razonSocial}</h2>
            <p className="mt-1 text-[13px] font-semibold text-slate-500">{proveedor.ruc ?? 'Sin RUC'}</p>
          </div>
          <span className="rounded-full bg-[#EAF3DE] px-3 py-1 text-[10px] font-bold uppercase text-[#639922]">
            {proveedor.estado}
          </span>
        </div>
      </header>
      <FormularioProveedor
        titulo="Editar proveedor"
        datosIniciales={proveedor}
        cargando={cargando}
        onGuardar={guardar}
        onCancelar={onVolver}
      />
    </section>
  )
}
