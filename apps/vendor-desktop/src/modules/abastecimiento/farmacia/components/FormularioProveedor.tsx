import { useState, type ChangeEvent, type FormEvent, type ReactElement } from 'react'
import type { CrearProveedorInput } from '../../../../domains/farmacia/types'

interface FormularioProveedorProps {
  titulo: string
  datosIniciales?: Partial<CrearProveedorInput>
  cargando: boolean
  onGuardar: (datos: CrearProveedorInput) => Promise<void>
  onCancelar: () => void
}

export function FormularioProveedor({
  titulo,
  datosIniciales,
  cargando,
  onGuardar,
  onCancelar,
}: FormularioProveedorProps): ReactElement {
  const [razonSocial, setRazonSocial] = useState<string>(datosIniciales?.razonSocial ?? '')
  const [ruc, setRuc] = useState<string>(datosIniciales?.ruc ?? '')
  const [nombreContacto, setNombreContacto] = useState<string>(datosIniciales?.nombreContacto ?? '')
  const [telefono, setTelefono] = useState<string>(datosIniciales?.telefono ?? '')
  const [condicionesPago, setCondicionesPago] = useState<string>(datosIniciales?.condicionesPago ?? '')
  const [error, setError] = useState<string | null>(null)

  const guardar = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault()
    if (!razonSocial.trim()) {
      setError('La razón social es obligatoria.')
      return
    }
    setError(null)
    try {
      await onGuardar({
        razonSocial: razonSocial.trim(),
        ruc: ruc.trim() || undefined,
        nombreContacto: nombreContacto.trim() || undefined,
        telefono: telefono.trim() || undefined,
        condicionesPago: condicionesPago.trim() || undefined,
      })
    } catch (guardarError) {
      setError(guardarError instanceof Error ? guardarError.message : String(guardarError))
    }
  }

  return (
    <form onSubmit={(event: FormEvent<HTMLFormElement>) => void guardar(event)} className="rounded-2xl border border-[#E0F2FE] bg-white p-5">
      <h2 className="text-[18px] font-bold text-slate-900">{titulo}</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-[11px] font-bold uppercase text-slate-500">Razón social</span>
          <input className="h-11 w-full rounded-xl border border-[#E0F2FE] px-3" value={razonSocial} onChange={(event: ChangeEvent<HTMLInputElement>) => setRazonSocial(event.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-[11px] font-bold uppercase text-slate-500">RUC</span>
          <input className="h-11 w-full rounded-xl border border-[#E0F2FE] px-3" value={ruc} onChange={(event: ChangeEvent<HTMLInputElement>) => setRuc(event.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-[11px] font-bold uppercase text-slate-500">Contacto</span>
          <input className="h-11 w-full rounded-xl border border-[#E0F2FE] px-3" value={nombreContacto} onChange={(event: ChangeEvent<HTMLInputElement>) => setNombreContacto(event.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-[11px] font-bold uppercase text-slate-500">Teléfono</span>
          <input className="h-11 w-full rounded-xl border border-[#E0F2FE] px-3" value={telefono} onChange={(event: ChangeEvent<HTMLInputElement>) => setTelefono(event.target.value)} />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-[11px] font-bold uppercase text-slate-500">Condiciones de pago</span>
          <input className="h-11 w-full rounded-xl border border-[#E0F2FE] px-3" value={condicionesPago} onChange={(event: ChangeEvent<HTMLInputElement>) => setCondicionesPago(event.target.value)} />
        </label>
      </div>
      {error && <p className="mt-3 text-[12px] font-bold text-red-600">{error}</p>}
      <footer className="mt-5 flex justify-end gap-3">
        <button type="button" onClick={onCancelar} className="rounded-xl border border-[#f97316]/40 px-4 py-2 text-[12px] font-bold text-[#f97316] hover:bg-[#fff7ed]">
          Cancelar
        </button>
        <button type="submit" disabled={cargando} className="rounded-xl bg-[#45b356] px-5 py-2 text-[12px] font-bold text-white hover:bg-[#3a9e4a] disabled:opacity-50">
          Guardar
        </button>
      </footer>
    </form>
  )
}
