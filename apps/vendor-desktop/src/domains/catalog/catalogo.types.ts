export type DisponibilidadCatalogo =
  | 'DISPONIBLE'
  | 'ULTIMAS_UNIDADES'
  | 'NO_DISPONIBLE'

export interface ContextoCatalogo {
  contextoOperacionalId: string
  identidadOperacionalId: string
  operadorId: string
  momento: string
  margenMinimoConfigurable: number
  operadorTieneCapacidadLibre: boolean
}

export interface ItemCatalogo {
  hovId: string
  nombre: string
  unidadDespacho: string
  factorConversion: number
  valorAplicado: number | null
  tipoValor: string | null
  requiereAutorizacion: boolean
  disponibilidad: DisponibilidadCatalogo
  unidadesDisponibles: number
  condicionVenta?: 'SIN_RECETA' | 'CON_RECETA' | 'CONTROLADO'
  requiereCadenaFrio?: boolean
  fechaVencimientoProximo?: string
  duracionMinutos?: number
  tipoRecurso?: string
  category?: string
  codigoBarras?: string
}

export interface CatalogoProyectado {
  contexto: ContextoCatalogo
  items: ItemCatalogo[]
  totalItems: number
  proyectadoEn: string
}

export interface UmbralDisponibilidad {
  ultimasUnidades: number
}
