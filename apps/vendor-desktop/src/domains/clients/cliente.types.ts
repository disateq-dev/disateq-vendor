export type TipoCliente =
  | 'OCASIONAL'
  | 'FRECUENTE'
  | 'CONVENIO'

export type EstadoCliente =
  | 'ACTIVO'
  | 'SUSPENDIDO'
  | 'INACTIVO'

export type TipoDocumentoIdentidad =
  | 'RUC'
  | 'DNI'
  | 'CE'
  | 'PASAPORTE'
  | 'DOC_TRIB_NO_DOM'
  | 'SIN_DOCUMENTO'

export type PreferenciaEnvio =
  | 'EMAIL'
  | 'WHATSAPP'
  | 'AMBOS'
  | 'NINGUNO'

export type TipoValorPreferente =
  | 'PREFERENCIAL'
  | 'MAYORISTA'
  | null

export interface IdentificacionFiscal {
  tipoDocumento: TipoDocumentoIdentidad
  numeroDocumento: string | null
  razonSocial: string | null
  direccionFiscal: string | null
  documentoFiscalSugerido: 'BOLETA' | 'FACTURA' | 'NINGUNO'
  validadoEn: string | null
}

export interface CanalesCliente {
  email: string | null
  whatsapp: string | null
  preferenciaEnvio: PreferenciaEnvio
  consentimiento: boolean
}

export interface CondicionesCliente {
  tipoValorPreferente: TipoValorPreferente
  creditoHabilitado: boolean
  limiteCredito: number | null
  sujetoADetraccion: boolean
  observaciones: string | null
}

export interface FidelizacionCliente {
  programaId: string
  puntosAcumulados: number
  nivelActual: string | null
  fechaIngreso: string
  estado: 'ACTIVO' | 'SUSPENDIDO'
}

export interface Cliente {
  id: string
  codigo: string
  nombre: string
  tipo: TipoCliente
  estado: EstadoCliente
  identificacionFiscal: IdentificacionFiscal
  canales: CanalesCliente
  condiciones: CondicionesCliente
  fidelizacion: FidelizacionCliente | null
  creadoEn: string
  modificadoEn: string
}

export interface CrearClienteInput {
  nombre: string
  tipo: TipoCliente
  identificacionFiscal: IdentificacionFiscal
  canales: CanalesCliente
  condiciones: CondicionesCliente
}

export interface ClienteStore {
  clientes: Cliente[]
  ultimaSincronizacion: string | null
}

export interface ValidationResult {
  valido: boolean
  error?: string
}
