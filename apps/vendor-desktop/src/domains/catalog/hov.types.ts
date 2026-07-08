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
  nodoFraccionamientoId?: string
  unidadDespacho: string
  factorConversion: number
  costoBase: number
  costoBaseActualizadoEn: string
  estado: EstadoHOV
  codigoBarras?: string
  contextoOperacionalId: string
  category?: string
  ubicacionFisica?: string
  creadoEn: string
  modificadoEn: string
}

export interface CrearHOVInput {
  nombre: string
  productoId?: string
  servicioId?: string
  productoGeneralId?: string
  nodoFraccionamientoId?: string
  tipoRecurso?: TipoRecursoOperacional
  unidadDespacho: string
  factorConversion: number
  costoBase: number
  contextoOperacionalId: string
  category?: string
  ubicacionFisica?: string
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
