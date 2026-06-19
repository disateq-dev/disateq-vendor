import { useState, type ChangeEvent, type ReactElement } from 'react'
import type { DatosRuc } from '../../../../domains/farmacia/types'

interface ExtrasProveedor {
  nombreContacto?: string
  telefono?: string
  condicionesPago?: string
}

interface ConsultaSunatProveedorProps {
  ruc: string
  datosRuc: DatosRuc | null
  consultando: boolean
  error: string | null
  onRucChange: (r: string) => void
  onConsultar: () => Promise<void>
  onGuardar: (extras: ExtrasProveedor) => Promise<void>
  onVolver: () => void
}

function esRucValido(ruc: string): boolean {
  return ruc.length === 11 && /^\d+$/.test(ruc)
}

function claseRuc(ruc: string): string {
  if (esRucValido(ruc)) return 'border-[#639922]'
  if (ruc.length === 11) return 'border-red-500'
  return 'border-[#EAF3DE]'
}

export function ConsultaSunatProveedor({
  ruc,
  datosRuc,
  consultando,
  error,
  onRucChange,
  onConsultar,
  onGuardar,
  onVolver,
}: ConsultaSunatProveedorProps): ReactElement {
  const [nombreContacto, setNombreContacto] = useState<string>('')
  const [telefono, setTelefono] = useState<string>('')
  const [condicionesPago, setCondicionesPago] = useState<string>('')

  const guardar = async (): Promise<void> => {
    await onGuardar({
      nombreContacto: nombreContacto || undefined,
      telefono: telefono || undefined,
      condicionesPago: condicionesPago || undefined,
    })
  }

  return (
    <section className="flex flex-1 flex-col gap-5 overflow-auto px-6 py-5">
      <button type="button" onClick={onVolver} className="w-fit text-[12px] font-bold text-[#639922]">
        ← Volver
      </button>
      <div className="rounded-2xl border border-[#EAF3DE] bg-white p-5">
        <label className="block">
          <span className="text-[11px] font-bold uppercase text-slate-500">RUC</span>
          <div className="mt-2 flex gap-3">
            <input
              value={ruc}
              maxLength={11}
              onChange={(event: ChangeEvent<HTMLInputElement>) => onRucChange(event.target.value)}
              className={`h-12 flex-1 rounded-xl border px-3 text-[15px] font-semibold outline-none ${claseRuc(ruc)}`}
            />
            <button
              type="button"
              disabled={!esRucValido(ruc) || consultando}
              onClick={() => void onConsultar()}
              className="rounded-xl bg-[#639922] px-5 text-[12px] font-bold text-white disabled:opacity-50"
            >
              {consultando ? 'Consultando...' : 'Consultar'}
            </button>
          </div>
        </label>
        {error && <p className="mt-3 text-[12px] font-bold text-red-600">{error}</p>}
      </div>

      {datosRuc && (
        <div className="rounded-2xl border border-[#EAF3DE] bg-white p-5">
          <h2 className="text-[18px] font-bold text-slate-900">{datosRuc.razonSocial}</h2>
          <p className="mt-2 text-[13px] font-semibold text-slate-500">{datosRuc.direccion || 'Sin dirección'}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[datosRuc.estado, datosRuc.condicion].filter(Boolean).map((valor) => (
              <span key={valor} className="rounded-full bg-[#EAF3DE] px-3 py-1 text-[10px] font-bold uppercase text-[#639922]">
                {valor}
              </span>
            ))}
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            <input className="h-11 rounded-xl border border-[#EAF3DE] px-3" placeholder="Contacto" value={nombreContacto} onChange={(event: ChangeEvent<HTMLInputElement>) => setNombreContacto(event.target.value)} />
            <input className="h-11 rounded-xl border border-[#EAF3DE] px-3" placeholder="Teléfono" value={telefono} onChange={(event: ChangeEvent<HTMLInputElement>) => setTelefono(event.target.value)} />
            <input className="h-11 rounded-xl border border-[#EAF3DE] px-3" placeholder="Condiciones de pago" value={condicionesPago} onChange={(event: ChangeEvent<HTMLInputElement>) => setCondicionesPago(event.target.value)} />
          </div>
          <button
            type="button"
            onClick={() => void guardar()}
            className="mt-5 rounded-xl bg-[#639922] px-5 py-2 text-[12px] font-bold text-white"
          >
            Guardar proveedor
          </button>
        </div>
      )}
    </section>
  )
}
