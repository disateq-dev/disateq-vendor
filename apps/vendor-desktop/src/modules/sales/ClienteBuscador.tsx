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

type BuscadorEstado = 'BUSQUEDA' | 'CREACION' | 'OCASIONAL' | 'COMPLETAR_CANALES' | 'CONFIRMAR_ONLINE'

const TIPOS_CLIENTE_RAPIDO: TipoCliente[] = ['FRECUENTE', 'CONVENIO']
const TIPOS_DOCUMENTO_RAPIDO: TipoDocumentoIdentidad[] = ['DNI', 'RUC', 'CE', 'PASAPORTE']

export default function ClienteBuscador(props: ClienteBuscadorProps) {
  const { onClienteSeleccionado, onClienteOcasional, docType, modo = 'receptor', onClienteConCanal } = props

  const [estado, setEstado] = useState<BuscadorEstado>('BUSQUEDA')
  const [numDoc, setNumDoc]                   = useState('')
  const [resultados, setResultados]           = useState<Cliente[]>([])
  const [noEncontradoLocal, setNoEncontradoLocal] = useState(false)
  const [buscandoOnline, setBuscandoOnline]   = useState(false)
  const [errorOnline, setErrorOnline]         = useState<string | null>(null)
  const [resultadoOnline, setResultadoOnline] = useState<{
    nombre: string
    direccion: string | null
    tipoDoc: 'DNI' | 'RUC'
    numDoc: string
  } | null>(null)

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

  function resolverTipoDoc(num: string): 'RUC' | 'DNI' {
    return num.trim().length === 11 ? 'RUC' : 'DNI'
  }

  function buscarLocal() {
    const doc = numDoc.trim()
    if (!doc) return
    setNoEncontradoLocal(false)
    setResultados([])
    setErrorOnline(null)
    setResultadoOnline(null)
    const todos = clienteStore.getClientesActivos()
    const encontrados = todos.filter(c =>
      (c.identificacionFiscal.numeroDocumento ?? '') === doc
    ).slice(0, 5)
    if (encontrados.length > 0) {
      setResultados(encontrados)
    } else {
      setNoEncontradoLocal(true)
    }
  }

  async function buscarOnline() {
    const doc = numDoc.trim()
    const tipo = resolverTipoDoc(doc)
    setBuscandoOnline(true)
    setErrorOnline(null)
    setResultadoOnline(null)
    try {
      const url = tipo === 'RUC'
        ? `https://ww1.sunat.gob.pe/ol-ti-itfisdenreg/itfisdenreg.htm?accion=obtenerDatosRuc&nroRuc=${doc}`
        : `https://ww1.sunat.gob.pe/ol-ti-itfisdenreg/itfisdenreg.htm?accion=obtenerDatosDni&numDocumento=${doc}`
      const res  = await fetch(url)
      const html = await res.text()
      const parsed = parsearHtmlSunat(html, tipo, doc)
      if (parsed) {
        setResultadoOnline(parsed)
        setEstado('CONFIRMAR_ONLINE')
      } else {
        setErrorOnline('No se encontraron datos. Usa ingreso manual.')
      }
    } catch {
      setErrorOnline('Sin conexión o servicio no disponible. Usa ingreso manual.')
    } finally {
      setBuscandoOnline(false)
    }
  }

  function parsearHtmlSunat(
    html: string,
    tipo: 'DNI' | 'RUC',
    doc: string
  ): { nombre: string; direccion: string | null; tipoDoc: 'DNI' | 'RUC'; numDoc: string } | null {
    try {
      const parser  = new DOMParser()
      const domDoc  = parser.parseFromString(html, 'text/html')
      const texto   = domDoc.body?.innerText ?? ''
      if (!texto || texto.length < 30) return null

      if (tipo === 'RUC') {
        // SUNAT devuelve campos separados por saltos de línea
        const lineas  = texto.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
        const iRazon  = lineas.findIndex(l => l.toLowerCase().includes('razón social') || l.toLowerCase().includes('razon social'))
        const iDir    = lineas.findIndex(l => l.toLowerCase().includes('dirección') || l.toLowerCase().includes('direccion'))
        const nombre  = iRazon >= 0 ? (lineas[iRazon + 1] ?? '').trim() : ''
        const dir     = iDir   >= 0 ? (lineas[iDir   + 1] ?? '').trim() : null
        if (!nombre) return null
        return { nombre, direccion: dir || null, tipoDoc: 'RUC', numDoc: doc }
      } else {
        // RENIEC: apellidos + nombres
        const lineas   = texto.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
        const iNombre  = lineas.findIndex(l => l.toLowerCase().includes('apellidos') || l.toLowerCase().includes('nombres'))
        const nombre   = iNombre >= 0 ? (lineas[iNombre + 1] ?? '').trim() : ''
        if (!nombre) return null
        return { nombre, direccion: null, tipoDoc: 'DNI', numDoc: doc }
      }
    } catch {
      return null
    }
  }

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

  if (estado === 'CONFIRMAR_ONLINE' && resultadoOnline) {
    function handleUsarDatosOnline() {
      if (!resultadoOnline) return
      const tipoDocumento: 'RUC' | 'DNI' = resultadoOnline.tipoDoc
      const clienteNuevo = crearCliente({
        nombre: resultadoOnline.nombre,
        tipo: 'FRECUENTE',
        identificacionFiscal: {
          tipoDocumento,
          numeroDocumento: resultadoOnline.numDoc,
          razonSocial: tipoDocumento === 'RUC' ? resultadoOnline.nombre : null,
          direccionFiscal: resultadoOnline.direccion,
          documentoFiscalSugerido: tipoDocumento === 'RUC' ? 'FACTURA' : 'BOLETA',
          validadoEn: new Date().toISOString(),
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
      if (modo === 'envio') {
        setClienteParaCompletar(clienteNuevo)
        setCompletarEmail('')
        setCompletarWhatsapp('')
        setEstado('COMPLETAR_CANALES')
      } else {
        onClienteSeleccionado(clienteNuevo)
      }
    }

    return (
      <div className="flex-1 overflow-y-auto flex flex-col px-4 pt-3 pb-3 gap-3">
        <p className="shrink-0 text-[10px] font-bold uppercase tracking-[0.15em] text-[#9ca3af]">
          {resultadoOnline.tipoDoc === 'RUC' ? 'Datos SUNAT' : 'Datos RENIEC'}
        </p>

        <div className="rounded-xl border border-[#e4e9f0] bg-[#f8fafd] px-3.5 py-3 flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] w-16 shrink-0">
              {resultadoOnline.tipoDoc}
            </span>
            <span className="text-[13px] font-bold text-[#111827] tabular-nums">
              {resultadoOnline.numDoc}
            </span>
          </div>
          <div className="flex items-start gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] w-16 shrink-0 pt-0.5">
              {resultadoOnline.tipoDoc === 'RUC' ? 'Razón' : 'Nombre'}
            </span>
            <span className="text-[13px] font-semibold text-[#111827] leading-snug">
              {resultadoOnline.nombre}
            </span>
          </div>
          {resultadoOnline.direccion && (
            <div className="flex items-start gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] w-16 shrink-0 pt-0.5">
                Dir.
              </span>
              <span className="text-[11px] text-[#6b7280] leading-snug">
                {resultadoOnline.direccion}
              </span>
            </div>
          )}
        </div>

        <p className="text-[10px] text-[#b8c4cf] leading-snug">
          Los datos se guardarán en el registro de clientes.
        </p>

        <div className="flex gap-2 mt-auto">
          <button
            onClick={() => { setEstado('BUSQUEDA'); setResultadoOnline(null) }}
            className="flex w-[50%] items-center justify-center rounded-2xl border border-[#e4e9f0] py-3.5 text-[12px] font-bold uppercase tracking-wide text-[#374151] transition hover:bg-[#f8fafd] active:scale-[0.97]"
          >
            Volver
          </button>
          <button
            onClick={handleUsarDatosOnline}
            className="flex w-[50%] items-center justify-center gap-1.5 rounded-2xl bg-[#4A90D9] py-3.5 text-[12px] font-bold uppercase tracking-wide text-white shadow-[0_4px_14px_rgba(74,144,217,0.28)] transition hover:bg-[#3a7fc8] active:scale-[0.97]"
          >
            Usar estos datos →
          </button>
        </div>
      </div>
    )
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

  const tipoDocDetectado = resolverTipoDoc(numDoc)
  const labelOnline = tipoDocDetectado === 'RUC' ? 'SUNAT' : 'RENIEC'
  const puedeOnline = noEncontradoLocal && numDoc.trim().length >= 8

  return (
    <div className="flex-1 overflow-y-auto flex flex-col px-4 pt-3 pb-3 gap-3">
      <p className="shrink-0 text-[10px] font-bold uppercase tracking-[0.15em] text-[#9ca3af]">
        {modo === 'envio'
          ? '¿A quién enviamos el comprobante?'
          : docType === 'factura'    ? 'Datos de facturación'
          : docType === 'boleta'     ? 'Datos del cliente'
          : docType === 'cotizacion' ? 'Cliente de cotización'
          : 'Cliente'}
      </p>

      {/* CAMPO DOCUMENTO + BOTÓN BUSCAR */}
      <div className="flex gap-2 items-stretch">
        <input
          autoFocus
          type="text"
          value={numDoc}
          onChange={e => {
            setNumDoc(e.target.value)
            setNoEncontradoLocal(false)
            setResultados([])
            setErrorOnline(null)
          }}
          onKeyDown={e => { if (e.key === 'Enter') buscarLocal() }}
          placeholder={docType === 'factura' ? 'N° RUC (11 dígitos)' : 'N° DNI o RUC'}
          className="flex-1 min-w-0 rounded-xl border border-[#e4e9f0] px-3.5 py-2.5 text-[14px] text-[#111827] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
        />
        <button
          onClick={buscarLocal}
          disabled={!numDoc.trim()}
          className="shrink-0 rounded-xl bg-[#2154d8] px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-[#1a42b0] disabled:opacity-35 disabled:cursor-not-allowed active:scale-[0.97]"
        >
          Buscar
        </button>
      </div>

      {/* RESULTADOS LOCALES */}
      {resultados.length > 0 && (
        <div className="flex flex-col gap-1">
          {resultados.map(cliente => (
            <button
              key={cliente.id}
              onClick={() => {
                if (modo === 'envio') {
                  const tieneCanal = !!(cliente.canales.email || cliente.canales.whatsapp)
                  if (tieneCanal) {
                    onClienteConCanal?.(cliente, cliente.canales.email, cliente.canales.whatsapp)
                  } else {
                    setClienteParaCompletar(cliente)
                    setCompletarEmail('')
                    setCompletarWhatsapp('')
                    setEstado('COMPLETAR_CANALES')
                  }
                } else {
                  onClienteSeleccionado(cliente)
                }
              }}
              className="flex items-center justify-between rounded-xl border border-[#e4e9f0] px-3.5 py-2.5 text-left transition hover:border-[#2154d8] hover:bg-[#f0f5ff]"
            >
              <span className="text-[13px] font-semibold text-[#111827]">
                {cliente.nombre}
              </span>
              <span className="text-[11px] text-[#9ca3af]">
                {cliente.identificacionFiscal.tipoDocumento} · {cliente.identificacionFiscal.numeroDocumento ?? 'sin doc'}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* NO ENCONTRADO LOCAL → OFRECER ONLINE */}
      {noEncontradoLocal && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-2.5">
            <span className="text-[11px] text-amber-700 font-medium flex-1">
              No se encontró <span className="font-bold tabular-nums">{numDoc.trim()}</span> en registros locales.
            </span>
          </div>
          {puedeOnline && (
            <button
              onClick={buscarOnline}
              disabled={buscandoOnline}
              className="flex items-center justify-center gap-2 rounded-xl border border-[#e4e9f0] bg-[#f8fafd] px-3.5 py-2.5 text-[12px] font-bold text-[#374151] transition hover:border-[#2154d8] hover:bg-[#f0f5ff] hover:text-[#2154d8] disabled:opacity-50 active:scale-[0.97]"
            >
              {buscandoOnline
                ? <span className="animate-pulse">Consultando {labelOnline}…</span>
                : <span>Buscar en {labelOnline} →</span>
              }
            </button>
          )}
          {errorOnline && (
            <p className="text-[11px] text-red-500 leading-snug px-1">{errorOnline}</p>
          )}
        </div>
      )}

      {/* FOOTER */}
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
