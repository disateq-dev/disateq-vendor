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
  onClienteOcasional: (nombre: string, documento: string, tipoDoc: 'RUC' | 'DNI' | 'CE' | 'PASAPORTE' | 'SIN_DOCUMENTO') => void
  docType: string
  onCancelar: () => void
  modo?: 'receptor' | 'envio'
  onClienteConCanal?: (cliente: Cliente, email: string | null, whatsapp: string | null) => void
}

type BuscadorEstado = 'BUSQUEDA' | 'CREACION' | 'OCASIONAL' | 'COMPLETAR_CANALES'

const TIPOS_CLIENTE_RAPIDO: TipoCliente[] = ['FRECUENTE', 'CONVENIO']
const TIPOS_DOCUMENTO_RAPIDO: TipoDocumentoIdentidad[] = ['DNI', 'RUC', 'CE', 'PASAPORTE']

export default function ClienteBuscador(props: ClienteBuscadorProps) {
  const { onClienteSeleccionado, onClienteOcasional, docType, modo = 'receptor', onClienteConCanal } = props

  const [estado, setEstado] = useState<BuscadorEstado>('BUSQUEDA')
  const [termino, setTermino] = useState('')
  const [resultados, setResultados] = useState<Cliente[]>([])

  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoTipo, setNuevoTipo] = useState<TipoCliente>('FRECUENTE')
  const [nuevoTipoDoc, setNuevoTipoDoc] = useState<TipoDocumentoIdentidad>('DNI')
  const [nuevoNumDoc, setNuevoNumDoc] = useState('')

  const [ocasionalNombre, setOcasionalNombre] = useState('')
  const [ocasionalDoc, setOcasionalDoc] = useState('')
  const [ocasionalTipoDoc, setOcasionalTipoDoc] = useState<'RUC' | 'DNI' | 'CE' | 'PASAPORTE' | 'SIN_DOCUMENTO'>('DNI')

  const [error, setError] = useState<string | null>(null)
  const [clienteParaCompletar, setClienteParaCompletar] = useState<Cliente | null>(null)
  const [completarEmail, setCompletarEmail] = useState('')
  const [completarWhatsapp, setCompletarWhatsapp] = useState('')

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

  if (estado === 'COMPLETAR_CANALES' && clienteParaCompletar) {
    const puedeConfirmar = !!(completarEmail.trim() || completarWhatsapp.trim());

    function handleConfirmarCanal() {
      if (!puedeConfirmar || !clienteParaCompletar) return;
      // Persistir canales en el cliente si tiene clienteId
      const emailFinal    = completarEmail.trim()    || null;
      const whatsappFinal = completarWhatsapp.trim() || null;
      const tieneConsentimiento = !!(emailFinal || whatsappFinal);
      const preferenciaEnvio =
        emailFinal && whatsappFinal ? 'AMBOS'
        : emailFinal    ? 'EMAIL'
        : whatsappFinal ? 'WHATSAPP'
        : 'NINGUNO';
      const clienteActualizado: Cliente = {
        ...clienteParaCompletar,
        canales: {
          ...clienteParaCompletar.canales,
          email:            emailFinal,
          whatsapp:         whatsappFinal,
          preferenciaEnvio,
          consentimiento:   tieneConsentimiento,
        },
        modificadoEn: new Date().toISOString(),
      };
      clienteStore.guardarCliente(clienteActualizado);
      onClienteConCanal?.(clienteActualizado, emailFinal, whatsappFinal);
    }

    return (
      <div className="flex-1 overflow-y-auto flex flex-col px-4 pt-3 pb-3 gap-3">
        <p className="shrink-0 text-[10px] font-bold uppercase tracking-[0.15em] text-[#9ca3af]">
          Datos de contacto para envío
        </p>

        <div className="rounded-xl border border-[#e4e9f0] px-3.5 py-2.5 flex items-center gap-2.5">
          <span className="text-[13px] font-semibold text-[#111827] flex-1 truncate">
            {clienteParaCompletar.nombre}
          </span>
          <span className="text-[11px] text-[#9ca3af] shrink-0">
            {clienteParaCompletar.identificacionFiscal.numeroDocumento ?? 'sin doc'}
          </span>
        </div>

        <p className="text-[11px] text-[#9ca3af] leading-snug">
          Este cliente no tiene email ni WhatsApp registrado. Agrega al menos uno para enviar el comprobante. Los datos quedarán guardados.
        </p>

        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5 rounded-xl border border-[#e4e9f0] px-3.5 py-2.5 focus-within:border-[#2154d8] focus-within:ring-2 focus-within:ring-[#2154d8]/10 transition">
            <span className="shrink-0 text-[13px]"></span>
            <input
              type="email"
              value={completarEmail}
              onChange={e => setCompletarEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              autoFocus
              className="flex-1 min-w-0 text-[13px] text-[#111827] outline-none placeholder:text-[#d1d9e1] bg-transparent"
            />
          </div>
          <div className="flex items-center gap-2.5 rounded-xl border border-[#e4e9f0] px-3.5 py-2.5 focus-within:border-[#4CAF50] focus-within:ring-2 focus-within:ring-[#4CAF50]/10 transition">
            <span className="shrink-0 text-[13px]"></span>
            <input
              type="tel"
              value={completarWhatsapp}
              onChange={e => setCompletarWhatsapp(e.target.value)}
              placeholder="999 999 999"
              className="flex-1 min-w-0 text-[13px] text-[#111827] outline-none placeholder:text-[#d1d9e1] bg-transparent"
            />
          </div>
        </div>

        <p className="text-[10px] text-[#b8c4cf] leading-snug">
          Al confirmar autorizas el envío de comprobantes a estos canales.
        </p>

        <div className="flex gap-2 mt-auto">
          <button
            onClick={() => { setEstado('BUSQUEDA'); setClienteParaCompletar(null); }}
            className="flex w-[50%] items-center justify-center rounded-2xl border border-[#e4e9f0] py-3.5 text-[12px] font-bold uppercase tracking-wide text-[#374151] transition hover:bg-[#f8fafd] active:scale-[0.97]"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmarCanal}
            disabled={!puedeConfirmar}
            className="flex w-[50%] items-center justify-center gap-1.5 rounded-2xl bg-[#4CAF50] py-3.5 text-[12px] font-bold uppercase tracking-wide text-white shadow-[0_4px_14px_rgba(76,175,80,0.30)] transition hover:bg-[#3d9e41] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none"
          >
            Confirmar y Enviar →
          </button>
        </div>
      </div>
    )
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

        <div className="flex gap-px rounded-lg bg-[#f1f5f9] p-0.5 self-start">
          {(['DNI', 'RUC', 'CE', 'PASAPORTE'] as const).map(tipo => (
            <button
              key={tipo}
              onClick={() => setOcasionalTipoDoc(tipo)}
              className={`rounded-[5px] px-3 py-1 text-[11px] font-bold uppercase transition ${
                ocasionalTipoDoc === tipo
                  ? 'bg-white text-[#2154d8] shadow-sm'
                  : 'text-[#9ca3af] hover:text-[#374151]'
              }`}
            >
              {tipo}
            </button>
          ))}
        </div>

        <input
          type="text"
          value={ocasionalDoc}
          onChange={e => setOcasionalDoc(e.target.value)}
          placeholder="Número de documento · opcional"
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
              ocasionalDoc.trim(),
              ocasionalDoc.trim() ? ocasionalTipoDoc : 'SIN_DOCUMENTO'
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
        {modo === 'envio'
          ? '¿A quién enviamos el comprobante?'
          : docType === 'factura' ? 'Datos de facturación'
          : docType === 'boleta'  ? 'Datos del cliente'
          : docType === 'cotizacion' ? 'Cliente de cotización'
          : 'Cliente'}
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
              onClick={() => {
                if (modo === 'envio') {
                  const tieneCanal = !!(cliente.canales.email || cliente.canales.whatsapp);
                  if (tieneCanal) {
                    onClienteConCanal?.(cliente, cliente.canales.email, cliente.canales.whatsapp);
                  } else {
                    setClienteParaCompletar(cliente);
                    setCompletarEmail('');
                    setCompletarWhatsapp('');
                    setEstado('COMPLETAR_CANALES');
                  }
                } else {
                  onClienteSeleccionado(cliente);
                }
              }}
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
