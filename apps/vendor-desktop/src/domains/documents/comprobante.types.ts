export type TipoComprobante =
  | 'FACTURA'
  | 'BOLETA'
  | 'NOTA_CREDITO'
  | 'NOTA_DEBITO'
  | 'TIQUE_VENTA'
  | 'COTIZACION'

export type EstadoComprobante =
  | 'EMITIDO'
  | 'REFERENCIADO'
  | 'ANULADO'

export type EstadoSUNAT =
  | 'PENDIENTE'
  | 'ENVIADO'
  | 'ACEPTADO'
  | 'RECHAZADO'
  | 'NO_APLICA'

export type TipoAfectacionIGV =
  | 'GRAVADO'
  | 'EXONERADO'
  | 'INAFECTO'

export type MetodoPago =
  | 'EFECTIVO'
  | 'YAPE'
  | 'TARJETA'
  | 'MIXTO'

export type TipoDocumentoReceptor =
  | 'RUC'
  | 'DNI'
  | 'CE'
  | 'PASAPORTE'
  | 'DOC_TRIB_NO_DOM'
  | 'SIN_DOCUMENTO'

export type RegimenTributario =
  | 'GENERAL'
  | 'MYPE'
  | 'NRUS'
  | 'RER'

export type CanalEnvio =
  | 'EMAIL'
  | 'WHATSAPP'
  | 'IMPRESO'
  | 'NINGUNO'

export type FuenteReceptor =
  | 'CLIENTE_REGISTRADO'
  | 'INGRESO_MANUAL'
  | 'API_SUNAT'
  | 'SIN_RECEPTOR'

export interface ReceptorComprobante {
  // Identificación fiscal
  tipoDocumento: TipoDocumentoReceptor
  numeroDocumento: string | null
  nombre: string                   // 'Clientes Varios' cuando SIN_RECEPTOR
  direccion: string | null

  // Clasificación
  esGenerico: boolean              // true cuando SIN_RECEPTOR

  // Trazabilidad de origen
  fuente: FuenteReceptor
  clienteId: string | null         // enlace al Cliente registrado, si aplica
  validadoSunat: boolean

  // Canales para marketing (captura opcional en cobro)
  email: string | null
  whatsapp: string | null
  consentimientoContacto: boolean
}

export interface EmisorComprobante {
  ruc: string
  razonSocial: string
  direccion: string
}

export interface LineaComprobante {
  id: string
  descripcion: string
  cantidad: number
  valorUnitario: number
  subtotal: number
  codigoProductoSUNAT: string | null
  tipoAfectacionIGV: TipoAfectacionIGV
  tasaIGV: number
  montoISC: number | null
  notaLinea: string | null
}

export interface TributarioComprobante {
  regimen: RegimenTributario
  incluyeDetraccion: boolean
  porcentajeDetraccion: number | null
}

export interface Comprobante {
  id: string
  tipo: TipoComprobante
  serie: string
  correlativo: number
  codigoUnico: string
  esFormal: boolean
  requiereEnvioSUNAT: boolean
  leyendaNoFormal: string | null
  pedidoId: string | null
  comprobanteReferenciadoId: string | null
  comprobanteOrigenId: string | null
  emisor: EmisorComprobante
  receptor: ReceptorComprobante
  lineas: LineaComprobante[]
  subtotal: number
  igv: number
  isc: number
  total: number
  moneda: string
  metodoPago: MetodoPago
  tributario: TributarioComprobante
  estado: EstadoComprobante
  estadoSUNAT: EstadoSUNAT
  cdr: string | null
  fechaEnvioSUNAT: string | null
  motivoAnulacion: string | null
  sessionKey?: string | null
  emitidoEn: string
  operadorId: string
  enviadoPorCanal: CanalEnvio
}

export interface CrearComprobanteInput {
  tipo: TipoComprobante
  pedidoId: string | null
  emisor: EmisorComprobante
  receptor: ReceptorComprobante
  lineas: LineaComprobante[]
  moneda: string
  metodoPago: MetodoPago
  tributario: TributarioComprobante
  operadorId: string
}

export interface ComprobanteStore {
  comprobantes: Comprobante[]
  ultimaSincronizacion: string | null
}

export const RECEPTOR_VACIO: ReceptorComprobante = {
  tipoDocumento: 'SIN_DOCUMENTO',
  numeroDocumento: null,
  nombre: 'Clientes Varios',
  direccion: null,
  esGenerico: true,
  fuente: 'SIN_RECEPTOR',
  clienteId: null,
  validadoSunat: false,
  email: null,
  whatsapp: null,
  consentimientoContacto: false,
}
