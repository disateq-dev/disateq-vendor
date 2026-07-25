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

/**
 * Contexto operacional del catálogo (HOV, ValorOperacional) — NO del Pedido.
 * El catálogo es compartido por todo el negocio, no depende de la caja/turno activo.
 * Si en el futuro el negocio maneja catálogos distintos por sucursal, este es el único
 * punto a modificar — no requiere rediseño, solo cambiar de dónde se deriva este valor.
 */
export const CONTEXTO_CATALOGO_NEGOCIO = 'default'
