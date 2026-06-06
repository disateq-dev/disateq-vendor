export type EstadoHOV = 'ACTIVA' | 'SUSPENDIDA' | 'RETIRADA'

export interface HOV {
  id: string
  codigo: string
  nombre: string
  productoId: string
  unidadDespacho: string
  factorConversion: number
  costoBase: number
  costoBaseActualizadoEn: string
  estado: EstadoHOV
  contextoOperacionalId: string
  creadoEn: string
  modificadoEn: string
}

export interface CrearHOVInput {
  nombre: string
  productoId: string
  unidadDespacho: string
  factorConversion: number
  costoBase: number
  contextoOperacionalId: string
}

export interface HOVStore {
  hovs: HOV[]
  ultimaSincronizacion: string | null
}

export interface ValidationResult {
  valido: boolean
  error?: string
  advertencia?: string
}
