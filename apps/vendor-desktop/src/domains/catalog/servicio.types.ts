import type { TipoRecursoOperacional } from '../farmacia/types'

export type EstadoServicio = 'ACTIVO' | 'INACTIVO'

export type TipoServicioFarmacia =
  | 'INYECTABLE'
  | 'NEBULIZACION'
  | 'CONTROL_GLUCOSA'
  | 'CONTROL_PRESION'
  | 'TEST_EMBARAZO'
  | 'CURACION'
  | 'OTRO'

export type TipoServicio = TipoServicioFarmacia | string

export interface ServicioCatalogo {
  id: string
  rubro: string
  tipoServicio: string
  nombre: string
  descripcion?: string
  duracionMinutos?: number
  estado: EstadoServicio
  creadoEn: string
}

export interface CrearServicioCatalogoInput {
  rubro: string
  tipoServicio: string
  nombre: string
  descripcion?: string
  duracionMinutos?: number
}

// Re-exporta TipoRecursoOperacional para que consumidores de este módulo
// no necesiten importar desde farmacia/types directamente
export type { TipoRecursoOperacional }
