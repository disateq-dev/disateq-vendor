import type { TipoRecursoOperacional } from '../farmacia/types'

export type EstadoHOV = 'ACTIVA' | 'SUSPENDIDA' | 'RETIRADA'

export interface HOV {
  id: string
  codigo: string
  nombre: string
  tipoRecurso: TipoRecursoOperacional
  productoId?: string
  servicioId?: string
  productoGeneralId?: string
  unidadDespacho: string
  factorConversion: number
  costoBase: number
  costoBaseActualizadoEn: string
  estado: EstadoHOV
  codigoBarras?: string
  contextoOperacionalId: string
  category?: string
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
  category?: string
  codigoBarras?: string
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
