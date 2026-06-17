import { useEffect, useState } from 'react'
import type { ReactElement } from 'react'
import { FileText } from 'lucide-react'
import { crearCliente } from '../../domains/clients/cliente.service'
import { clienteStore } from '../../domains/clients/cliente.store'
import type { CanalesCliente, Cliente } from '../../domains/clients/cliente.types'

interface ClienteBuscadorProps {
  docType: 'nota' | 'boleta' | 'factura' | 'cotizacion'
  onReceptorConfirmado: (receptor: ReceptorComprobante) => void
  onCancelar: () => void
}

export interface ReceptorComprobante {
  tipoDocumento: 'SIN_DOCUMENTO' | 'DNI' | 'CE' | 'PASAPORTE' | 'RUC'
  numeroDocumento: string | null
  nombre: string
  direccion: string | null
  esGenerico: boolean
  clienteId: string | null
  email: string | null
  whatsapp: string | null
}

type Vista = 'INICIO' | 'FORMULARIO_DNI' | 'FORMULARIO_RUC' | 'FORMULARIO_LIBRE' | 'FORMULARIO_BOLETA'
type TipoDocNavegacion = 'DNI' | 'CE' | 'PASAPORTE' | 'RUC'
type TipoDocLibre = 'CE' | 'PASAPORTE'
type TipoDocBoleta = 'DNI' | 'CE' | 'PASAPORTE'
type FuenteDNI = 'LOCAL' | 'RENIEC' | 'MANUAL'
type FuenteRUC = 'LOCAL' | 'SUNAT' | 'MANUAL'
type FaseFormularioDNI = 'INGRESO' | 'RESULTADO'
type FaseFormularioBoleta = 'INGRESO' | 'RESULTADO'

interface DatosDNI {
  numDoc:    string
  apPaterno: string
  apMaterno: string
  nombres:   string
  email:     string
  whatsapp:  string
  fuente:    'LOCAL' | 'RENIEC' | 'MANUAL'
  clienteId: string | null
}

interface DatosRUC {
  numDoc:         string
  razonSocial:    string
  nombreComercial:string
  direccionFiscal:string
  estadoRuc:      string
  condicion:      string
  email:          string
  whatsapp:       string
  fuente:         'LOCAL' | 'SUNAT' | 'MANUAL'
  clienteId:      string | null
}

const inputBase = "w-full rounded-xl border border-[#e4e9f0] px-3.5 py-2 text-[13px] text-[#111827] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10 transition"
const inputDis  = "w-full rounded-xl border border-transparent bg-[#f4f7fb] px-3.5 py-2 text-[13px] text-[#374151] outline-none"

function resolverCanales(email: string, whatsapp: string): CanalesCliente {
  const e = email.trim() || null
  const w = whatsapp.trim() || null
  return {
    email: e,
    whatsapp: w,
    preferenciaEnvio: e && w ? 'AMBOS' : e ? 'EMAIL' : w ? 'WHATSAPP' : 'NINGUNO',
    consentimiento: !!(e || w),
  }
}

function parsearHtmlSunat(
  html: string,
  tipo: 'DNI' | 'RUC',
  doc: string
): Partial<DatosDNI> | Partial<DatosRUC> | null {
  try {
    const parser = new DOMParser()
    const dom    = parser.parseFromString(html, 'text/html')
    const texto  = dom.body?.innerText ?? ''
    if (!texto || texto.length < 30) return null
    const lineas = texto.split(/\r?\n/).map(l => l.trim()).filter(Boolean)

    if (tipo === 'RUC') {
      const iRazon = lineas.findIndex(l =>
        l.toLowerCase().includes('razón social') || l.toLowerCase().includes('razon social'))
      const iNomCom = lineas.findIndex(l =>
        l.toLowerCase().includes('nombre comercial'))
      const iDir = lineas.findIndex(l =>
        l.toLowerCase().includes('dirección') || l.toLowerCase().includes('direccion'))
      const iEstado = lineas.findIndex(l =>
        l.toLowerCase().includes('estado del contribuyente'))
      const iCond = lineas.findIndex(l =>
        l.toLowerCase().includes('condición del contribuyente') ||
        l.toLowerCase().includes('condicion del contribuyente'))
      const razonSocial     = iRazon  >= 0 ? (lineas[iRazon  + 1] ?? '').trim() : ''
      if (!razonSocial) return null
      return {
        numDoc:          doc,
        razonSocial,
        nombreComercial: iNomCom >= 0 ? (lineas[iNomCom + 1] ?? '').trim() : '',
        direccionFiscal: iDir    >= 0 ? (lineas[iDir    + 1] ?? '').trim() : '',
        estadoRuc:       iEstado >= 0 ? (lineas[iEstado + 1] ?? '').trim() : '',
        condicion:       iCond   >= 0 ? (lineas[iCond   + 1] ?? '').trim() : '',
        fuente: 'SUNAT',
        clienteId: null,
      }
    } else {
      const iAp = lineas.findIndex(l =>
        l.toLowerCase().includes('apellidos y nombres') ||
        l.toLowerCase().includes('apellido paterno'))
      const iNom = lineas.findIndex(l => l.toLowerCase().includes('nombres'))
      // RENIEC clásico: "APELLIDO PATERNO / APELLIDO MATERNO / NOMBRES" en líneas sucesivas
      const apPaterno = iAp  >= 0 ? (lineas[iAp  + 1] ?? '').trim() : ''
      const apMaterno = iAp  >= 0 ? (lineas[iAp  + 2] ?? '').trim() : ''
      const nombres   = iNom >= 0 ? (lineas[iNom + 1] ?? '').trim() : ''
      if (!apPaterno && !nombres) return null
      return {
        numDoc: doc,
        apPaterno,
        apMaterno,
        nombres,
        fuente: 'RENIEC',
        clienteId: null,
      }
    }
  } catch {
    return null
  }
}

function ChipFuente({ fuente }: { fuente: 'LOCAL' | 'RENIEC' | 'SUNAT' | 'MANUAL' }): ReactElement {
  const map = {
    LOCAL:  { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'CONSULTA LOCAL' },
    RENIEC: { cls: 'bg-blue-50 text-blue-700 border-blue-200', label: 'CONSULTA RENIEC' },
    SUNAT:  { cls: 'bg-indigo-50 text-indigo-700 border-indigo-200', label: 'CONSULTA SUNAT' },
    MANUAL: { cls: 'bg-amber-50 text-amber-700 border-amber-200', label: 'INGRESO MANUAL' },
  }
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${map[fuente].cls}`}>
      {map[fuente].label}
    </span>
  )
}

function HeaderComprobante(): ReactElement {
  return (
    <header className="shrink-0 flex h-[42px] items-center gap-2 border-b border-[#e4ecf7] bg-[#f4f7fb] px-4">
      <FileText size={13} strokeWidth={2} className="text-[#45b356]" />
      <span className="text-[13px] font-semibold uppercase tracking-tight text-[#121416]">
        DATOS COMPROBANTE
      </span>
    </header>
  )
}

function normalizarDocumento(value: string, maxLength: number): string {
  return value.replace(/\D/g, '').slice(0, maxLength)
}

function separarNombreCliente(nombre: string): {
  apellidos: string
  nombres: string
} {
  const partes = nombre.trim().split(/\s+/).filter(Boolean)
  return {
    apellidos: [partes[0] ?? '', partes[1] ?? ''].filter(Boolean).join(' '),
    nombres: partes.slice(2).join(' '),
  }
}

interface VistaInicioProps {
  docType: ClienteBuscadorProps['docType']
  onContinuar: (tipoDocumento: TipoDocNavegacion, numeroDocumento: string, clienteInicial?: Cliente | null) => void
  onAbrirBoleta: () => void
}

function VistaInicio({
  docType,
  onContinuar,
  onAbrirBoleta,
}: VistaInicioProps): ReactElement | null {
  useEffect(() => {
    if (docType === 'nota' || docType === 'cotizacion') {
      onContinuar('DNI', '')
      return
    }

    if (docType === 'boleta') {
      onAbrirBoleta()
    }
  }, [])

  return null
}

interface FormularioBoletaProps {
  onReceptorConfirmado: (receptor: ReceptorComprobante) => void
  onCancelar: () => void
}

function FormularioBoleta({
  onReceptorConfirmado,
  onCancelar,
}: FormularioBoletaProps): ReactElement {
  const [tipoActivo, setTipoActivo] = useState<TipoDocBoleta>('DNI')
  const [numDoc, setNumDoc] = useState('')
  const [fase, setFase] = useState<FaseFormularioBoleta>('INGRESO')
  const [fuente, setFuente] = useState<FuenteDNI>('MANUAL')
  const [apellidos, setApellidos] = useState('')
  const [nombres, setNombres] = useState('')
  const [nombreCompleto, setNombreCompleto] = useState('')
  const [direccion, setDireccion] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [clienteId, setClienteId] = useState<string | null>(null)
  const [editando, setEditando] = useState(true)
  const [buscando, setBuscando] = useState(false)
  const [buscoLocal, setBuscoLocal] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const maxLength = tipoActivo === 'DNI' ? 8 : tipoActivo === 'CE' ? 9 : 12
  const longitudDocumento = numDoc.trim().length
  const documentoValido = tipoActivo === 'DNI'
    ? longitudDocumento === 8
    : tipoActivo === 'CE'
      ? longitudDocumento === 9
      : longitudDocumento >= 6 && longitudDocumento <= 12
  const puedeEditarNombre = fuente !== 'RENIEC' && editando
  const nombreFinal = tipoActivo === 'DNI'
    ? `${apellidos.trim()} ${nombres.trim()}`.replace(/\s+/g, ' ').trim().toUpperCase()
    : nombreCompleto.trim().toUpperCase()
  const puedeConfirmar = nombreFinal.length > 0
  const textoAccion = buscando ? 'Consultando…' : tipoActivo === 'DNI' && buscoLocal ? 'RENIEC' : 'BUSCAR'
  const claseAccion = tipoActivo === 'DNI' && buscoLocal
    ? 'bg-[#2154d8] text-white hover:bg-[#1a42b0]'
    : 'bg-[#4CAF50] text-white hover:bg-[#3d9e41]'

  function limpiarResultado(): void {
    setFuente('MANUAL')
    setApellidos('')
    setNombres('')
    setNombreCompleto('')
    setDireccion('')
    setEmail('')
    setWhatsapp('')
    setClienteId(null)
    setEditando(true)
    setErrorMsg(null)
  }

  function seleccionarTipo(tipo: TipoDocBoleta): void {
    setTipoActivo(tipo)
    setNumDoc('')
    setFase('INGRESO')
    setBuscoLocal(false)
    limpiarResultado()
  }

  function cambiarNumero(value: string): void {
    const limpio = tipoActivo === 'PASAPORTE'
      ? value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, maxLength)
      : normalizarDocumento(value, maxLength)
    setNumDoc(limpio)
    setFase('INGRESO')
    setBuscoLocal(false)
    limpiarResultado()
  }

  function cargarCliente(cliente: Cliente): void {
    const nombre = separarNombreCliente(cliente.nombre)
    setApellidos(nombre.apellidos)
    setNombres(nombre.nombres)
    setNombreCompleto(cliente.nombre)
    setDireccion(cliente.identificacionFiscal.direccionFiscal ?? '')
    setEmail(cliente.canales.email ?? '')
    setWhatsapp(cliente.canales.whatsapp ?? '')
    setFuente('LOCAL')
    setClienteId(cliente.id)
    setEditando(false)
    setErrorMsg(null)
    setFase('RESULTADO')
  }

  function buscarLocal(): boolean {
    const cliente = clienteStore.getClienteByDocumento(numDoc.trim())
    if (!cliente) return false
    cargarCliente(cliente)
    return true
  }

  async function buscarOnlineDNI(): Promise<void> {
    if (!documentoValido) return

    setBuscando(true)
    setErrorMsg(null)
    try {
      const documento = numDoc.trim()
      const url = `https://ww1.sunat.gob.pe/ol-ti-itfisdenreg/itfisdenreg.htm?accion=obtenerDatosDni&numDocumento=${documento}`
      const res = await fetch(url)
      const html = await res.text()
      const parsed = parsearHtmlSunat(html, 'DNI', documento) as Partial<DatosDNI> | null
      if (!parsed || (!parsed.apPaterno && !parsed.nombres)) {
        setErrorMsg('Sin conexión. Completa los campos manualmente.')
        setFuente('MANUAL')
        setEditando(true)
        setFase('RESULTADO')
        return
      }

      setApellidos(`${parsed.apPaterno ?? ''} ${parsed.apMaterno ?? ''}`.replace(/\s+/g, ' ').trim())
      setNombres(parsed.nombres ?? '')
      setNombreCompleto('')
      setFuente('RENIEC')
      setClienteId(null)
      setEditando(false)
      setFase('RESULTADO')
    } catch {
      setErrorMsg('Sin conexión. Completa los campos manualmente.')
      setFuente('MANUAL')
      setEditando(true)
      setFase('RESULTADO')
    } finally {
      setBuscando(false)
    }
  }

  function buscarDocumento(): void {
    if (!documentoValido) return

    setErrorMsg(null)
    if (tipoActivo === 'DNI') {
      if (buscoLocal) {
        void buscarOnlineDNI()
        return
      }

      if (buscarLocal()) return

      limpiarResultado()
      setErrorMsg('Sin resultados en búsqueda local — Usar búsqueda RENIEC')
      setBuscoLocal(true)
      return
    }

    if (buscarLocal()) return

    limpiarResultado()
    setFuente('MANUAL')
    setEditando(true)
    setFase('RESULTADO')
  }

  function confirmarGenerico(): void {
    onReceptorConfirmado({
      tipoDocumento: 'SIN_DOCUMENTO',
      numeroDocumento: '99999999',
      nombre: 'CLIENTES VARIOS',
      direccion: null,
      esGenerico: true,
      clienteId: null,
      email: null,
      whatsapp: null,
    })
    onCancelar()
  }

  function confirmarBoleta(): void {
    const existente = clienteId ? clienteStore.getClienteById(clienteId) : null
    const canales = resolverCanales(email, whatsapp)
    const cliente = existente
      ? clienteStore.guardarCliente({
          ...existente,
          nombre: nombreFinal,
          identificacionFiscal: {
            ...existente.identificacionFiscal,
            tipoDocumento: tipoActivo,
            numeroDocumento: numDoc.trim(),
            direccionFiscal: direccion.trim() || null,
          },
          canales,
          modificadoEn: new Date().toISOString(),
        })
      : crearCliente({
          nombre: nombreFinal,
          tipo: 'FRECUENTE',
          identificacionFiscal: {
            tipoDocumento: tipoActivo,
            numeroDocumento: numDoc.trim(),
            razonSocial: null,
            direccionFiscal: direccion.trim() || null,
            documentoFiscalSugerido: 'BOLETA',
            validadoEn: fuente !== 'MANUAL' ? new Date().toISOString() : null,
          },
          canales,
          condiciones: { tipoValorPreferente: null, creditoHabilitado: false, limiteCredito: null, sujetoADetraccion: false, observaciones: null },
        })

    onReceptorConfirmado({
      tipoDocumento: tipoActivo,
      numeroDocumento: numDoc.trim(),
      nombre: nombreFinal,
      direccion: direccion.trim() || null,
      esGenerico: false,
      clienteId: cliente.id,
      email: email.trim() || null,
      whatsapp: whatsapp.trim() || null,
    })
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <HeaderComprobante />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        <div className="grid grid-cols-3 gap-1.5">
          {(['DNI', 'CE', 'PASAPORTE'] as TipoDocBoleta[]).map(tipo => (
            <button
              key={tipo}
              type="button"
              onClick={() => seleccionarTipo(tipo)}
              className={`rounded-xl border px-2 py-2 text-[10px] font-bold uppercase transition ${
                tipoActivo === tipo
                  ? 'border-[#2154d8] bg-[#f4f7ff] text-[#2154d8]'
                  : 'border-[#e4e9f0] text-[#374151] hover:bg-[#f8fafd]'
              }`}
            >
              {tipo === 'PASAPORTE' ? 'Pasaporte' : tipo}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-1">
          <div className="flex gap-2">
            <input
              autoFocus
              inputMode={tipoActivo === 'PASAPORTE' ? 'text' : 'numeric'}
              maxLength={maxLength}
              value={numDoc}
              onChange={event => cambiarNumero(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') buscarDocumento()
              }}
              placeholder={tipoActivo === 'DNI' ? 'N° DNI — 8 dígitos'
                : tipoActivo === 'CE' ? 'N° CE — 9 dígitos'
                : 'N° Pasaporte'}
              className={inputBase}
            />
            {fase === 'RESULTADO' ? <ChipFuente fuente={fuente} /> : null}
            <button
              type="button"
              onClick={buscarDocumento}
              disabled={!documentoValido || buscando}
              className={`shrink-0 rounded-xl px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35 ${claseAccion}`}
            >
              {textoAccion}
            </button>
          </div>
        </div>

        {fase === 'RESULTADO' ? (
          <>
            {errorMsg ? <p className="text-[11px] text-red-500">{errorMsg}</p> : null}

            {tipoActivo === 'DNI' ? (
              <>
                <div className="flex flex-col gap-1">
                  {puedeEditarNombre ? (
                    <input className={inputBase} value={apellidos} onChange={event => setApellidos(event.target.value)} placeholder="Apellidos" />
                  ) : (
                    <div className={`${inputDis} ${apellidos ? '' : 'text-[#d1d9e1]'}`}>{apellidos || 'Apellidos'}</div>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  {puedeEditarNombre ? (
                    <input className={inputBase} value={nombres} onChange={event => setNombres(event.target.value)} placeholder="Nombres" />
                  ) : (
                    <div className={`${inputDis} ${nombres ? '' : 'text-[#d1d9e1]'}`}>{nombres || 'Nombres'}</div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-1">
                {puedeEditarNombre ? (
                  <input className={inputBase} value={nombreCompleto} onChange={event => setNombreCompleto(event.target.value)} placeholder="Nombre completo" />
                ) : (
                  <div className={`${inputDis} ${nombreCompleto ? '' : 'text-[#d1d9e1]'}`}>{nombreCompleto || 'Nombre completo'}</div>
                )}
              </div>
            )}

            <div className="flex flex-col gap-1">
              <input className={inputBase} value={direccion} onChange={event => setDireccion(event.target.value)} placeholder="Dirección" />
            </div>

            <div className="grid grid-cols-[65%_1fr] gap-2">
              <div className="flex min-w-0 flex-col gap-1">
                <input
                  className={inputBase}
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder="Correo electrónico"
                />
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <input
                  className={inputBase}
                  type="tel"
                  value={whatsapp}
                  onChange={event => setWhatsapp(event.target.value)}
                  placeholder="WhatsApp"
                />
              </div>
            </div>
          </>
        ) : errorMsg ? (
          <p className="text-[11px] text-red-500">{errorMsg}</p>
        ) : null}
      </div>
      {fase === 'INGRESO' ? (
        <footer className="grid shrink-0 grid-cols-1 gap-2 border-t border-[#f0f4f8] px-4 py-3">
          <button type="button" onClick={confirmarGenerico} className="rounded-xl border border-[#e4e9f0] py-3 text-[11px] font-bold uppercase tracking-wide text-[#374151] transition hover:bg-[#f8fafd] active:scale-[0.97]">
            CANCELAR
          </button>
        </footer>
      ) : (
        <footer className="grid shrink-0 grid-cols-[25%_25%_1fr] gap-2 border-t border-[#f0f4f8] px-4 py-3">
          <button type="button" onClick={confirmarGenerico} className="rounded-xl border border-[#e4e9f0] py-3 text-[11px] font-bold uppercase tracking-wide text-[#374151] transition hover:bg-[#f8fafd] active:scale-[0.97]">
            CANCELAR
          </button>
          <button type="button" onClick={fuente === 'RENIEC' ? buscarOnlineDNI : () => setEditando(e => !e)} className="rounded-xl border border-[#e4e9f0] py-3 text-[11px] font-bold uppercase tracking-wide text-[#374151] transition hover:bg-[#f8fafd] active:scale-[0.97]">
            {fuente === 'RENIEC' ? 'ACTUALIZAR' : 'EDITAR'}
          </button>
          <button type="button" onClick={confirmarBoleta} disabled={!puedeConfirmar} className="rounded-xl bg-[#4CAF50] py-3 text-[11px] font-bold uppercase tracking-wide text-white transition hover:bg-[#3d9e41] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35">
            {fuente === 'LOCAL' ? 'USAR DATOS →' : 'REGISTRAR Y USAR →'}
          </button>
        </footer>
      )}
    </div>
  )
}

interface FormularioDNIProps {
  numDocInicial: string
  onReceptorConfirmado: (receptor: ReceptorComprobante) => void
  onCancelar: () => void
}

function FormularioDNI({
  numDocInicial,
  onReceptorConfirmado,
  onCancelar,
}: FormularioDNIProps): ReactElement {
  const [fase, setFase] = useState<FaseFormularioDNI>(numDocInicial.trim().length === 8 ? 'RESULTADO' : 'INGRESO')
  const [numDoc, setNumDoc] = useState(numDocInicial)
  const [apellidos, setApellidos] = useState('')
  const [nombres, setNombres] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [fuente, setFuente] = useState<FuenteDNI>('MANUAL')
  const [clienteId, setClienteId] = useState<string | null>(null)
  const [editando, setEditando] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [buscoLocal, setBuscoLocal] = useState(false)

  useEffect(() => {
    const documentoInicial = normalizarDocumento(numDocInicial, 8)
    setNumDoc(documentoInicial)
    setErrorMsg(null)
    setBuscoLocal(false)

    if (documentoInicial.length !== 8) {
      limpiarDatosDNI()
      setFase('INGRESO')
      return
    }

    const cliente = clienteStore.getClienteByDocumento(documentoInicial)

    if (cliente) {
      cargarClienteDNI(cliente)
      setFase('RESULTADO')
      return
    }

    limpiarDatosDNI()
    setFase('RESULTADO')
  }, [numDocInicial])

  function limpiarDatosDNI(): void {
    setApellidos('')
    setNombres('')
    setEmail('')
    setWhatsapp('')
    setFuente('MANUAL')
    setClienteId(null)
    setEditando(true)
  }

  function cargarClienteDNI(cliente: Cliente): void {
    const nombre = separarNombreCliente(cliente.nombre)
    setApellidos(nombre.apellidos)
    setNombres(nombre.nombres)
    setEmail(cliente.canales.email ?? '')
    setWhatsapp(cliente.canales.whatsapp ?? '')
    setFuente('LOCAL')
    setClienteId(cliente.id)
    setEditando(false)
  }

  function buscarLocal(): void {
    const documento = numDoc.trim()
    if (documento.length !== 8) return

    setErrorMsg(null)
    const cliente = clienteStore.getClienteByDocumento(documento)
    if (cliente) {
      cargarClienteDNI(cliente)
      setBuscoLocal(true)
      setFase('RESULTADO')
      return
    }

    limpiarDatosDNI()
    setErrorMsg('Sin resultados en búsqueda local — Usar búsqueda RENIEC')
    setBuscoLocal(true)
  }

  async function buscarOnline(): Promise<void> {
    const documento = numDoc.trim()
    if (documento.length !== 8) return

    setBuscando(true)
    setErrorMsg(null)
    try {
      const url = `https://ww1.sunat.gob.pe/ol-ti-itfisdenreg/itfisdenreg.htm?accion=obtenerDatosDni&numDocumento=${documento}`
      const res = await fetch(url)
      const html = await res.text()
      const parsed = parsearHtmlSunat(html, 'DNI', documento) as Partial<DatosDNI> | null
      if (!parsed || (!parsed.apPaterno && !parsed.nombres)) {
        setErrorMsg('Sin conexión. Completa los campos manualmente.')
        setFuente('MANUAL')
        setEditando(true)
        setFase('RESULTADO')
        return
      }
      setApellidos(`${parsed.apPaterno ?? ''} ${parsed.apMaterno ?? ''}`.replace(/\s+/g, ' ').trim())
      setNombres(parsed.nombres ?? '')
      setFuente('RENIEC')
      setClienteId(null)
      setEditando(false)
      setFase('RESULTADO')
    } catch {
      setErrorMsg('Sin conexión. Completa los campos manualmente.')
      setFuente('MANUAL')
      setEditando(true)
      setFase('RESULTADO')
    } finally {
      setBuscando(false)
    }
  }

  function cambiarNumeroDocumento(value: string): void {
    setNumDoc(normalizarDocumento(value, 8))
    setFase('INGRESO')
    setBuscoLocal(false)
    setErrorMsg(null)
  }

  function ejecutarAccionIngreso(): void {
    if (buscoLocal) {
      void buscarOnline()
      return
    }
    buscarLocal()
  }

  function confirmar(): void {
    const nombreCompleto = `${apellidos.trim()} ${nombres.trim()}`.replace(/\s+/g, ' ').trim().toUpperCase()
    let cliente: Cliente
    if (clienteId) {
      const existente = clienteStore.getClienteById(clienteId)!
      cliente = clienteStore.guardarCliente({
        ...existente,
        canales: resolverCanales(email, whatsapp),
        modificadoEn: new Date().toISOString(),
      })
    } else {
      cliente = crearCliente({
        nombre: nombreCompleto,
        tipo: 'FRECUENTE',
        identificacionFiscal: {
          tipoDocumento: 'DNI',
          numeroDocumento: numDoc.trim(),
          razonSocial: null,
          direccionFiscal: null,
          documentoFiscalSugerido: 'BOLETA',
          validadoEn: fuente !== 'MANUAL' ? new Date().toISOString() : null,
        },
        canales: resolverCanales(email, whatsapp),
        condiciones: { tipoValorPreferente: null, creditoHabilitado: false, limiteCredito: null, sujetoADetraccion: false, observaciones: null },
      })
    }
    onReceptorConfirmado({
      tipoDocumento: 'DNI',
      numeroDocumento: numDoc.trim(),
      nombre: nombreCompleto,
      direccion: null,
      esGenerico: false,
      clienteId: cliente.id,
      email: email.trim() || null,
      whatsapp: whatsapp.trim() || null,
    })
  }

  const nombreComprobante = `${apellidos} ${nombres}`.trim().toUpperCase() || '—'
  const puedeConfirmar = apellidos.trim().length > 0 || nombres.trim().length > 0
  const puedeEditarNombre = fuente !== 'RENIEC' && editando
  const puedeBuscarIngreso = numDoc.trim().length === 8 && !buscando
  const textoBotonIngreso = buscando ? 'Consultando…' : buscoLocal ? 'RENIEC' : 'BUSCAR'
  const claseBotonIngreso = buscoLocal
    ? 'bg-[#2154d8] text-white hover:bg-[#1a42b0]'
    : 'bg-[#4CAF50] text-white hover:bg-[#3d9e41]'
  const botonIngreso = (className = ''): ReactElement => (
    <button
      type="button"
      onClick={ejecutarAccionIngreso}
      disabled={!puedeBuscarIngreso}
      className={`rounded-xl px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35 ${claseBotonIngreso} ${className}`}
    >
      {textoBotonIngreso}
    </button>
  )

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <HeaderComprobante />
      {fase === 'INGRESO' ? (
        <>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-1">
              <div className="flex gap-2">
                <input
                  autoFocus
                  inputMode="numeric"
                  maxLength={8}
                  value={numDoc}
                  onChange={event => cambiarNumeroDocumento(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter') ejecutarAccionIngreso()
                  }}
                  placeholder="N° DNI — 8 dígitos"
                  className={inputBase}
                />
                {botonIngreso('shrink-0')}
              </div>
            </div>
            {errorMsg ? <p className="text-[11px] text-red-500">{errorMsg}</p> : null}
          </div>
          <footer className="grid shrink-0 grid-cols-1 gap-2 border-t border-[#f0f4f8] px-4 py-3">
            <button type="button" onClick={onCancelar} className="rounded-xl border border-[#e4e9f0] py-3 text-[11px] font-bold uppercase tracking-wide text-[#374151] transition hover:bg-[#f8fafd] active:scale-[0.97]">
              CANCELAR
            </button>
          </footer>
        </>
      ) : (
        <>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className={`${inputDis} ${numDoc ? '' : 'text-[#d1d9e1]'}`}>{numDoc || 'N° DNI — 8 dígitos'}</div>
                <ChipFuente fuente={fuente} />
              </div>
            </div>

            {errorMsg ? <p className="text-[11px] text-red-500">{errorMsg}</p> : null}

            <div className="flex flex-col gap-1">
              {puedeEditarNombre ? (
                <input className={inputBase} value={apellidos} onChange={event => setApellidos(event.target.value)} placeholder="Apellidos" />
              ) : (
                <div className={`${inputDis} ${apellidos ? '' : 'text-[#d1d9e1]'}`}>{apellidos || 'Apellidos'}</div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {puedeEditarNombre ? (
                <input className={inputBase} value={nombres} onChange={event => setNombres(event.target.value)} placeholder="Nombres" />
              ) : (
                <div className={`${inputDis} ${nombres ? '' : 'text-[#d1d9e1]'}`}>{nombres || 'Nombres'}</div>
              )}
            </div>

            <div className="rounded-xl bg-[#f4f7fb] px-3.5 py-2.5">
              <div className={`text-[13px] font-bold ${nombreComprobante === '—' ? 'text-[#d1d9e1]' : 'text-[#111827]'}`}>{nombreComprobante === '—' ? 'Nombre completo' : nombreComprobante}</div>
            </div>

            <div className="grid grid-cols-[65%_1fr] gap-2">
              <div className="flex min-w-0 flex-col gap-1">
                <input
                  className={inputBase}
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder="Correo electrónico"
                />
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <input
                  className={inputBase}
                  type="tel"
                  value={whatsapp}
                  onChange={event => setWhatsapp(event.target.value)}
                  placeholder="WhatsApp"
                />
              </div>
            </div>
          </div>
          <footer className="grid shrink-0 grid-cols-[25%_25%_1fr] gap-2 border-t border-[#f0f4f8] px-4 py-3">
            <button type="button" onClick={onCancelar} className="rounded-xl border border-[#e4e9f0] py-3 text-[11px] font-bold uppercase tracking-wide text-[#374151] transition hover:bg-[#f8fafd] active:scale-[0.97]">
              CANCELAR
            </button>
            <button type="button" onClick={fuente === 'RENIEC' ? buscarOnline : () => setEditando(e => !e)} className="rounded-xl border border-[#e4e9f0] py-3 text-[11px] font-bold uppercase tracking-wide text-[#374151] transition hover:bg-[#f8fafd] active:scale-[0.97]">
              {fuente === 'RENIEC' ? 'ACTUALIZAR' : editando ? 'LIMPIAR' : 'EDITAR'}
            </button>
            <button type="button" onClick={confirmar} disabled={!puedeConfirmar} className="rounded-xl bg-[#4CAF50] py-3 text-[11px] font-bold uppercase tracking-wide text-white transition hover:bg-[#3d9e41] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35">
              {fuente === 'LOCAL' ? 'USAR DATOS →' : 'REGISTRAR Y USAR →'}
            </button>
          </footer>
        </>
      )}
    </div>
  )
}

interface FormularioRUCProps {
  numDocInicial: string
  onReceptorConfirmado: (receptor: ReceptorComprobante) => void
  onCancelar: () => void
}

function FormularioRUC({
  numDocInicial,
  onReceptorConfirmado,
  onCancelar,
}: FormularioRUCProps): ReactElement {
  const [numDoc, setNumDoc] = useState(numDocInicial)
  const [razonSocial, setRazonSocial] = useState('')
  const [nombreComercial, setNombreComercial] = useState('')
  const [direccionFiscal, setDireccionFiscal] = useState('')
  const [estadoRuc, setEstadoRuc] = useState('')
  const [condicion, setCondicion] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [fuente, setFuente] = useState<FuenteRUC>('MANUAL')
  const [clienteId, setClienteId] = useState<string | null>(null)
  const [editando, setEditando] = useState(false)
  const [buscando, setBuscando] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [fase, setFase] = useState<'INGRESO' | 'RESULTADO'>('INGRESO')

  useEffect(() => {
    const documento = numDocInicial.trim()
    if (!documento) return

    setNumDoc(documento)
    const local = clienteStore.getClienteByDocumento(documento)
    if (!local) return

    setRazonSocial(local.nombre)
    setNombreComercial('')
    setDireccionFiscal(local.identificacionFiscal.direccionFiscal ?? '')
    setEmail(local.canales.email ?? '')
    setWhatsapp(local.canales.whatsapp ?? '')
    setFuente('LOCAL')
    setClienteId(local.id)
    setEditando(false)
    setFase('RESULTADO')
  }, [numDocInicial])

  async function buscarRUC(): Promise<void> {
    const local = clienteStore.getClienteByDocumento(numDoc.trim())
    if (local) {
      setRazonSocial(local.nombre)
      setNombreComercial('')
      setDireccionFiscal(local.identificacionFiscal.direccionFiscal ?? '')
      setEmail(local.canales.email ?? '')
      setWhatsapp(local.canales.whatsapp ?? '')
      setFuente('LOCAL')
      setClienteId(local.id)
      setEditando(false)
      setFase('RESULTADO')
      return
    }

    setBuscando(true)
    setErrorMsg(null)
    try {
      const url = `https://ww1.sunat.gob.pe/ol-ti-itfisdenreg/itfisdenreg.htm?accion=obtenerDatosRuc&nroRuc=${numDoc.trim()}`
      const res = await fetch(url)
      const html = await res.text()
      const parsed = parsearHtmlSunat(html, 'RUC', numDoc.trim()) as Partial<DatosRUC> | null
      if (!parsed?.razonSocial) {
        setErrorMsg('No se encontraron datos en SUNAT. Completa manualmente.')
        setEditando(true)
        setFase('RESULTADO')
        return
      }
      setRazonSocial(parsed.razonSocial ?? '')
      setNombreComercial(parsed.nombreComercial ?? '')
      setDireccionFiscal(parsed.direccionFiscal ?? '')
      setEstadoRuc(parsed.estadoRuc ?? '')
      setCondicion(parsed.condicion ?? '')
      setFuente('SUNAT')
      setEditando(false)
      setFase('RESULTADO')
    } catch {
      setErrorMsg('Sin conexión. Completa los campos manualmente.')
      setEditando(true)
      setFase('RESULTADO')
    } finally {
      setBuscando(false)
    }
  }

  function ingresoManual(): void {
    setFuente('MANUAL')
    setEditando(true)
    setFase('RESULTADO')
  }

  function confirmarRUC(): void {
    const nombreFinal = razonSocial.trim().toUpperCase()
    let cliente: Cliente
    if (clienteId) {
      const existente = clienteStore.getClienteById(clienteId)!
      cliente = clienteStore.guardarCliente({
        ...existente,
        nombre: nombreFinal,
        identificacionFiscal: {
          ...existente.identificacionFiscal,
          razonSocial: nombreFinal,
          direccionFiscal: direccionFiscal.trim() || null,
        },
        canales: resolverCanales(email, whatsapp),
        modificadoEn: new Date().toISOString(),
      })
    } else {
      cliente = crearCliente({
        nombre: nombreFinal,
        tipo: 'FRECUENTE',
        identificacionFiscal: {
          tipoDocumento: 'RUC',
          numeroDocumento: numDoc.trim(),
          razonSocial: nombreFinal,
          direccionFiscal: direccionFiscal.trim() || null,
          documentoFiscalSugerido: 'FACTURA',
          validadoEn: fuente !== 'MANUAL' ? new Date().toISOString() : null,
        },
        canales: resolverCanales(email, whatsapp),
        condiciones: { tipoValorPreferente: null, creditoHabilitado: false, limiteCredito: null, sujetoADetraccion: false, observaciones: null },
      })
    }
    onReceptorConfirmado({
      tipoDocumento: 'RUC',
      numeroDocumento: numDoc.trim(),
      nombre: nombreFinal,
      direccion: direccionFiscal.trim() || null,
      esGenerico: false,
      clienteId: cliente.id,
      email: email.trim() || null,
      whatsapp: whatsapp.trim() || null,
    })
  }

  const puedeConfirmar = razonSocial.trim().length > 0
  const puedeEditarDatos = (fuente === 'LOCAL' || fuente === 'MANUAL') && editando

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <HeaderComprobante />
      {fase === 'INGRESO' ? (
        <>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
            <div className="flex flex-col gap-1">
              <input
                autoFocus
                inputMode="numeric"
                maxLength={11}
                value={numDoc}
                onChange={event => setNumDoc(normalizarDocumento(event.target.value, 11))}
                placeholder="N° RUC — 11 dígitos"
                className="w-full rounded-xl border border-[#e4e9f0] px-3.5 py-3 text-[18px] font-bold tracking-wider text-[#111827] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
              />
            </div>
            {numDoc.trim().length === 11 ? (
              <div className="flex flex-col gap-2">
                <button type="button" onClick={buscarRUC} disabled={buscando} className="rounded-xl border border-[#d0d9ee] bg-[#f4f7ff] px-3.5 py-2.5 text-[12px] font-bold text-[#2154d8] transition hover:bg-[#e8eeff] disabled:cursor-not-allowed disabled:opacity-50">
                  {buscando ? 'Consultando SUNAT…' : 'Buscar en SUNAT →'}
                </button>
                <button type="button" onClick={ingresoManual} className="rounded-xl border border-[#e4e9f0] px-3.5 py-2.5 text-[12px] font-bold text-[#374151] transition hover:bg-[#f8fafd]">
                  Ingresar manual
                </button>
              </div>
            ) : null}
          </div>
          <footer className="grid shrink-0 grid-cols-2 gap-2 border-t border-[#f0f4f8] px-4 py-3">
            <button type="button" onClick={onCancelar} className="rounded-xl border border-[#e4e9f0] py-3 text-[11px] font-bold uppercase tracking-wide text-[#374151] transition hover:bg-[#f8fafd] active:scale-[0.97]">
              CANCELAR
            </button>
            <button type="button" onClick={buscarRUC} disabled={numDoc.trim().length !== 11 || buscando} className="rounded-xl bg-[#4CAF50] py-3 text-[11px] font-bold uppercase tracking-wide text-white transition hover:bg-[#3d9e41] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35">
              {buscando ? 'Consultando SUNAT…' : 'BUSCAR EN SUNAT →'}
            </button>
          </footer>
        </>
      ) : (
        <>
          <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
            {errorMsg ? <p className="text-[11px] text-red-500">{errorMsg}</p> : null}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <div className={`${inputDis} ${numDoc ? '' : 'text-[#d1d9e1]'}`}>{numDoc || 'N° RUC — 11 dígitos'}</div>
                <ChipFuente fuente={fuente} />
              </div>
            </div>
            {estadoRuc ? (
              <div className="flex flex-col gap-1">
                <div className={inputDis}>{estadoRuc}</div>
              </div>
            ) : null}
            {condicion ? (
              <div className="flex flex-col gap-1">
                <div className={inputDis}>{condicion}</div>
              </div>
            ) : null}
            <div className="flex flex-col gap-1">
              {puedeEditarDatos ? (
                <input className={inputBase} value={razonSocial} onChange={event => setRazonSocial(event.target.value)} placeholder="Razón social" />
              ) : (
                <div className={`${inputDis} ${razonSocial ? '' : 'text-[#d1d9e1]'}`}>{razonSocial || 'Razón social'}</div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {puedeEditarDatos ? (
                <input className={inputBase} value={nombreComercial} onChange={event => setNombreComercial(event.target.value)} placeholder="Nombre comercial" />
              ) : (
                <div className={`${inputDis} ${nombreComercial ? '' : 'text-[#d1d9e1]'}`}>{nombreComercial || 'Nombre comercial'}</div>
              )}
            </div>
            <div className="flex flex-col gap-1">
              {puedeEditarDatos ? (
                <input className={inputBase} value={direccionFiscal} onChange={event => setDireccionFiscal(event.target.value)} placeholder="Dirección fiscal" />
              ) : (
                <div className={`${inputDis} ${direccionFiscal ? '' : 'text-[#d1d9e1]'}`}>{direccionFiscal || 'Dirección fiscal'}</div>
              )}
            </div>
            <div className="grid grid-cols-[65%_1fr] gap-2">
              <div className="flex min-w-0 flex-col gap-1">
                <input
                  className={inputBase}
                  type="email"
                  value={email}
                  onChange={event => setEmail(event.target.value)}
                  placeholder="Correo electrónico"
                />
              </div>
              <div className="flex min-w-0 flex-col gap-1">
                <input
                  className={inputBase}
                  type="tel"
                  value={whatsapp}
                  onChange={event => setWhatsapp(event.target.value)}
                  placeholder="WhatsApp"
                />
              </div>
            </div>
          </div>
          <footer className="grid shrink-0 grid-cols-[25%_25%_1fr] gap-2 border-t border-[#f0f4f8] px-4 py-3">
            <button type="button" onClick={onCancelar} className="rounded-xl border border-[#e4e9f0] py-3 text-[11px] font-bold uppercase tracking-wide text-[#374151] transition hover:bg-[#f8fafd] active:scale-[0.97]">
              CANCELAR
            </button>
            <button type="button" onClick={fuente === 'SUNAT' ? buscarRUC : () => setEditando(e => !e)} className="rounded-xl border border-[#e4e9f0] py-3 text-[11px] font-bold uppercase tracking-wide text-[#374151] transition hover:bg-[#f8fafd] active:scale-[0.97]">
              {fuente === 'SUNAT' ? 'ACTUALIZAR' : editando ? 'LIMPIAR' : 'EDITAR'}
            </button>
            <button type="button" onClick={confirmarRUC} disabled={!puedeConfirmar} className="rounded-xl bg-[#4CAF50] py-3 text-[11px] font-bold uppercase tracking-wide text-white transition hover:bg-[#3d9e41] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35">
              {fuente === 'LOCAL' ? 'USAR DATOS →' : 'REGISTRAR Y USAR →'}
            </button>
          </footer>
        </>
      )}
    </div>
  )
}

interface FormularioLibreProps {
  tipoDocInicial: TipoDocLibre
  numDocInicial: string
  clienteInicial: Cliente | null
  onReceptorConfirmado: (receptor: ReceptorComprobante) => void
  onCancelar: () => void
}

function FormularioLibre({
  tipoDocInicial,
  numDocInicial,
  clienteInicial,
  onReceptorConfirmado,
  onCancelar,
}: FormularioLibreProps): ReactElement {
  const [nombre, setNombre] = useState(clienteInicial?.nombre ?? '')
  const [email, setEmail] = useState(clienteInicial?.canales.email ?? '')
  const [whatsapp, setWhatsapp] = useState(clienteInicial?.canales.whatsapp ?? '')
  const [editando, setEditando] = useState(true)
  const puedeConfirmar = nombre.trim().length > 0

  function confirmarLibre(): void {
    const nombreFinal = nombre.trim().toUpperCase()
    const cliente = clienteInicial
      ? clienteStore.guardarCliente({
          ...clienteInicial,
          nombre: nombreFinal,
          canales: resolverCanales(email, whatsapp),
          modificadoEn: new Date().toISOString(),
        })
      : crearCliente({
          nombre: nombreFinal,
          tipo: 'FRECUENTE',
          identificacionFiscal: {
            tipoDocumento: tipoDocInicial,
            numeroDocumento: numDocInicial,
            razonSocial: null,
            direccionFiscal: null,
            documentoFiscalSugerido: 'BOLETA',
            validadoEn: null,
          },
          canales: resolverCanales(email, whatsapp),
          condiciones: { tipoValorPreferente: null, creditoHabilitado: false, limiteCredito: null, sujetoADetraccion: false, observaciones: null },
        })
    onReceptorConfirmado({
      tipoDocumento: tipoDocInicial,
      numeroDocumento: numDocInicial,
      nombre: nombreFinal,
      direccion: null,
      esGenerico: false,
      clienteId: cliente.id,
      email: email.trim() || null,
      whatsapp: whatsapp.trim() || null,
    })
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <HeaderComprobante />
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-4">
        <div className="flex flex-col gap-1">
          <div className={inputDis}>{tipoDocInicial === 'CE' ? 'Carné de Extranjería' : 'Pasaporte'}</div>
        </div>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <div className={`${inputDis} ${numDocInicial ? '' : 'text-[#d1d9e1]'}`}>
              {numDocInicial || (tipoDocInicial === 'CE' ? 'N° CE — 9 dígitos' : 'N° Pasaporte')}
            </div>
            <ChipFuente fuente="MANUAL" />
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <input autoFocus className={inputBase} value={nombre} onChange={event => setNombre(event.target.value)} placeholder="Nombre completo" />
        </div>
        <div className="grid grid-cols-[65%_1fr] gap-2">
          <div className="flex min-w-0 flex-col gap-1">
            <input
              className={inputBase}
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              placeholder="Correo electrónico"
            />
          </div>
          <div className="flex min-w-0 flex-col gap-1">
            <input
              className={inputBase}
              type="tel"
              value={whatsapp}
              onChange={event => setWhatsapp(event.target.value)}
              placeholder="WhatsApp"
            />
          </div>
        </div>
      </div>
      <footer className="grid shrink-0 grid-cols-[25%_25%_1fr] gap-2 border-t border-[#f0f4f8] px-4 py-3">
        <button type="button" onClick={onCancelar} className="rounded-xl border border-[#e4e9f0] py-3 text-[11px] font-bold uppercase tracking-wide text-[#374151] transition hover:bg-[#f8fafd] active:scale-[0.97]">
          CANCELAR
        </button>
        <button type="button" onClick={() => setEditando(e => !e)} className="rounded-xl border border-[#e4e9f0] py-3 text-[11px] font-bold uppercase tracking-wide text-[#374151] transition hover:bg-[#f8fafd] active:scale-[0.97]">
          {editando ? 'LIMPIAR' : 'EDITAR'}
        </button>
        <button type="button" onClick={confirmarLibre} disabled={!puedeConfirmar} className="rounded-xl bg-[#4CAF50] py-3 text-[11px] font-bold uppercase tracking-wide text-white transition hover:bg-[#3d9e41] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35">
          REGISTRAR Y USAR →
        </button>
      </footer>
    </div>
  )
}

export default function ClienteBuscador({
  docType,
  onReceptorConfirmado,
  onCancelar,
}: ClienteBuscadorProps): ReactElement {
  const [vista, setVista] = useState<Vista>(docType === 'factura' ? 'FORMULARIO_RUC' : 'INICIO')
  const [numDocNavegacion, setNumDocNavegacion] = useState('')
  const [tipoDocNavegacion, setTipoDocNavegacion] = useState<TipoDocNavegacion>('DNI')
  const [clienteLibreInicial, setClienteLibreInicial] = useState<Cliente | null>(null)

  function navegarFormulario(tipoDocumento: TipoDocNavegacion, numeroDocumento: string, clienteInicial: Cliente | null = null): void {
    setTipoDocNavegacion(tipoDocumento)
    setNumDocNavegacion(numeroDocumento)
    setClienteLibreInicial(clienteInicial)

    if (tipoDocumento === 'RUC') {
      setVista('FORMULARIO_RUC')
      return
    }

    if (tipoDocumento === 'CE' || tipoDocumento === 'PASAPORTE') {
      setVista('FORMULARIO_LIBRE')
      return
    }

    setVista('FORMULARIO_DNI')
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {vista === 'INICIO' && (
        <VistaInicio
          docType={docType}
          onContinuar={navegarFormulario}
          onAbrirBoleta={() => setVista('FORMULARIO_BOLETA')}
        />
      )}
      {vista === 'FORMULARIO_BOLETA' && (
        <FormularioBoleta
          onReceptorConfirmado={onReceptorConfirmado}
          onCancelar={onCancelar}
        />
      )}
      {vista === 'FORMULARIO_DNI' && (
        <FormularioDNI
          numDocInicial={numDocNavegacion}
          onReceptorConfirmado={onReceptorConfirmado}
          onCancelar={onCancelar}
        />
      )}
      {vista === 'FORMULARIO_RUC' && (
        <FormularioRUC
          numDocInicial={numDocNavegacion}
          onReceptorConfirmado={onReceptorConfirmado}
          onCancelar={onCancelar}
        />
      )}
      {vista === 'FORMULARIO_LIBRE' && (
        <FormularioLibre
          tipoDocInicial={tipoDocNavegacion === 'PASAPORTE' ? 'PASAPORTE' : 'CE'}
          numDocInicial={numDocNavegacion}
          clienteInicial={clienteLibreInicial}
          onReceptorConfirmado={onReceptorConfirmado}
          onCancelar={onCancelar}
        />
      )}
    </div>
  )
}
