import { useEffect, useState } from 'react'

import { crearCliente } from '../../domains/clients/cliente.service'
import { clienteStore } from '../../domains/clients/cliente.store'
import type {
  Cliente,
  TipoCliente,
  TipoDocumentoIdentidad,
} from '../../domains/clients/cliente.types'

interface ClienteBuscadorProps {
  onClienteSeleccionado: (cliente: Cliente) => void
  onClienteOcasional: (nombre: string, documento: string) => void
  docType: string
  onCancelar: () => void
}

type BuscadorEstado = 'BUSQUEDA' | 'CREACION' | 'OCASIONAL'

const TIPOS_CLIENTE_RAPIDO: TipoCliente[] = ['FRECUENTE', 'CONVENIO']
const TIPOS_DOCUMENTO_RAPIDO: TipoDocumentoIdentidad[] = ['DNI', 'RUC', 'CE', 'PASAPORTE']

export default function ClienteBuscador(props: ClienteBuscadorProps) {
  const { onClienteSeleccionado, onClienteOcasional, docType } = props

  const [estado, setEstado] = useState<BuscadorEstado>('BUSQUEDA')
  const [termino, setTermino] = useState('')
  const [resultados, setResultados] = useState<Cliente[]>([])

  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoTipo, setNuevoTipo] = useState<TipoCliente>('FRECUENTE')
  const [nuevoTipoDoc, setNuevoTipoDoc] = useState<TipoDocumentoIdentidad>('DNI')
  const [nuevoNumDoc, setNuevoNumDoc] = useState('')

  const [ocasionalNombre, setOcasionalNombre] = useState('')
  const [ocasionalDoc, setOcasionalDoc] = useState('')

  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (termino.trim().length === 0) {
      setResultados([])
      return
    }

    const todos = clienteStore.getClientesActivos()
    const t = termino.toLowerCase()
    const filtrados = todos.filter(c =>
      c.nombre.toLowerCase().includes(t) ||
      (c.identificacionFiscal.numeroDocumento ?? '').includes(t)
    ).slice(0, 5)

    setResultados(filtrados)
  }, [termino])

  function handleCrear() {
    setError(null)

    try {
      const cliente = crearCliente({
        nombre: nuevoNombre.trim(),
        tipo: nuevoTipo,
        identificacionFiscal: {
          tipoDocumento: nuevoTipoDoc,
          numeroDocumento: nuevoNumDoc.trim() || null,
          razonSocial: null,
          direccionFiscal: null,
          documentoFiscalSugerido: 'NINGUNO',
          validadoEn: null,
        },
        canales: {
          email: null,
          whatsapp: null,
          preferenciaEnvio: 'NINGUNO',
          consentimiento: false,
        },
        condiciones: {
          tipoValorPreferente: null,
          creditoHabilitado: false,
          limiteCredito: null,
          sujetoADetraccion: false,
          observaciones: null,
        },
      })

      onClienteSeleccionado(cliente)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }

  if (estado === 'CREACION') {
    return (
      <div className="flex-1 overflow-y-auto flex flex-col px-4 pt-3 pb-3 gap-3">
        <p className="shrink-0 text-[10px] font-bold uppercase tracking-[0.15em] text-[#9ca3af]">
          Nuevo cliente
        </p>

        <input
          autoFocus
          type="text"
          value={nuevoNombre}
          onChange={e => setNuevoNombre(e.target.value)}
          placeholder="Nombre completo o razón social"
          className="w-full rounded-xl border border-[#e4e9f0] px-3.5 py-2.5 text-[14px] text-[#111827] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
        />

        <div className="flex gap-px rounded-lg bg-[#f1f5f9] p-0.5 self-start">
          {TIPOS_CLIENTE_RAPIDO.map(tipo => (
            <button
              key={tipo}
              onClick={() => setNuevoTipo(tipo)}
              className={`rounded-[5px] px-3 py-1 text-[11px] font-bold uppercase transition ${
                nuevoTipo === tipo
                  ? 'bg-white text-[#2154d8] shadow-sm'
                  : 'text-[#9ca3af] hover:text-[#374151]'
              }`}
            >
              {tipo}
            </button>
          ))}
        </div>

        <div className="flex gap-px rounded-lg bg-[#f1f5f9] p-0.5 self-start">
          {TIPOS_DOCUMENTO_RAPIDO.map(doc => (
            <button
              key={doc}
              onClick={() => setNuevoTipoDoc(doc)}
              className={`rounded-[5px] px-3 py-1 text-[11px] font-bold uppercase transition ${
                nuevoTipoDoc === doc
                  ? 'bg-white text-[#2154d8] shadow-sm'
                  : 'text-[#9ca3af] hover:text-[#374151]'
              }`}
            >
              {doc}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={nuevoNumDoc}
          onChange={e => setNuevoNumDoc(e.target.value)}
          placeholder="Número de documento"
          className="w-full rounded-xl border border-[#e4e9f0] px-3.5 py-2.5 text-[14px] text-[#111827] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
        />

        {error && (
          <p className="text-[11px] text-red-500">{error}</p>
        )}

        <div className="flex gap-2 mt-auto">
          <button
            onClick={() => { setEstado('BUSQUEDA'); setError(null) }}
            className="flex-1 rounded-xl border border-[#e4e9f0] py-2 text-[12px] font-semibold text-[#6b7280] transition hover:border-[#9ca3af]"
          >
            Cancelar
          </button>
          <button
            onClick={handleCrear}
            disabled={!nuevoNombre.trim()}
            className="flex-1 rounded-xl bg-[#2154d8] py-2 text-[12px] font-bold text-white transition hover:bg-[#1a42b0] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Guardar y usar
          </button>
        </div>
      </div>
    )
  }

  if (estado === 'OCASIONAL') {
    return (
      <div className="flex-1 overflow-y-auto flex flex-col px-4 pt-3 pb-3 gap-3">
        <p className="shrink-0 text-[10px] font-bold uppercase tracking-[0.15em] text-[#9ca3af]">
          Cliente ocasional
        </p>

        <input
          autoFocus
          type="text"
          value={ocasionalNombre}
          onChange={e => setOcasionalNombre(e.target.value)}
          placeholder="Nombre · opcional"
          className="w-full rounded-xl border border-[#e4e9f0] px-3.5 py-2.5 text-[14px] text-[#111827] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
        />

        <input
          type="text"
          value={ocasionalDoc}
          onChange={e => setOcasionalDoc(e.target.value)}
          placeholder="Documento · opcional"
          className="w-full rounded-xl border border-[#e4e9f0] px-3.5 py-2.5 text-[14px] text-[#111827] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
        />

        <div className="flex gap-2 mt-auto">
          <button
            onClick={() => setEstado('BUSQUEDA')}
            className="flex-1 rounded-xl border border-[#e4e9f0] py-2 text-[12px] font-semibold text-[#6b7280] transition hover:border-[#9ca3af]"
          >
            Cancelar
          </button>
          <button
            onClick={() => onClienteOcasional(
              ocasionalNombre.trim(),
              ocasionalDoc.trim()
            )}
            className="flex-1 rounded-xl bg-[#2154d8] py-2 text-[12px] font-bold text-white transition hover:bg-[#1a42b0]"
          >
            Continuar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col px-4 pt-3 pb-3 gap-3">
      <p className="shrink-0 text-[10px] font-bold uppercase tracking-[0.15em] text-[#9ca3af]">
        {docType === 'factura' ? 'Datos de facturación' :
         docType === 'boleta'  ? 'Datos del cliente' :
         docType === 'cotizacion' ? 'Cliente de cotización' : 'Cliente'}
      </p>

      <input
        autoFocus
        type="text"
        value={termino}
        onChange={e => setTermino(e.target.value)}
        placeholder="Buscar por nombre o documento..."
        className="w-full rounded-xl border border-[#e4e9f0] px-3.5 py-2.5 text-[14px] text-[#111827] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
      />

      {resultados.length > 0 && (
        <div className="flex flex-col gap-1">
          {resultados.map(cliente => (
            <button
              key={cliente.id}
              onClick={() => onClienteSeleccionado(cliente)}
              className="flex items-center justify-between rounded-xl border border-[#e4e9f0] px-3.5 py-2.5 text-left transition hover:border-[#2154d8] hover:bg-[#f0f5ff]"
            >
              <span className="text-[13px] font-semibold text-[#111827]">
                {cliente.nombre}
              </span>
              <span className="text-[11px] text-[#9ca3af]">
                {cliente.tipo} · {cliente.identificacionFiscal.numeroDocumento ?? 'sin doc'}
              </span>
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-auto">
        <button
          onClick={() => setEstado('OCASIONAL')}
          className="flex-1 rounded-xl border border-[#e4e9f0] py-2 text-[12px] font-semibold text-[#6b7280] transition hover:border-[#9ca3af]"
        >
          Cliente ocasional
        </button>
        <button
          onClick={() => setEstado('CREACION')}
          className="flex-1 rounded-xl bg-[#f0f5ff] py-2 text-[12px] font-bold text-[#2154d8] transition hover:bg-[#dbeafe]"
        >
          Nuevo cliente
        </button>
      </div>
    </div>
  )
}
