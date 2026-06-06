export type TipoValorOperacional =
  | 'NORMAL'
  | 'OFERTA'
  | 'PREFERENCIAL'
  | 'MAYORISTA'
  | 'LIBRE'

export type EstadoValorOperacional =
  | 'ACTIVO'
  | 'VENCIDO'
  | 'SUSPENDIDO'

export interface ValorOperacional {
  id: string
  hovId: string
  tipo: TipoValorOperacional
  valor: number
  moneda: string
  condiciones: CondicionesValor
  vigencia: VigenciaValor
  estado: EstadoValorOperacional
  creadoEn: string
  modificadoEn: string
}

export interface VigenciaValor {
  desde: string
  hasta: string | null
}

export interface CondicionesValor {
  cantidadMinima: number | null
  contextoOperacionalId: string | null
  identidadOperacionalId: string | null
}

export interface CrearValorOperacionalInput {
  hovId: string
  tipo: TipoValorOperacional
  valor: number
  moneda: string
  condiciones: CondicionesValor
  vigencia: VigenciaValor
}

export interface ValorOperacionalStore {
  valores: ValorOperacional[]
  ultimaSincronizacion: string | null
}

export interface ResultadoResolucion {
  valido: boolean
  valorAplicado: number | null
  tipo: TipoValorOperacional | null
  requiereAutorizacion: boolean
  error?: string
}
