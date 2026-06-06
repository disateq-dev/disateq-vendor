export type EstadoPedido =
  | 'ABIERTO'
  | 'CONFIRMADO'
  | 'EN_COBRO'
  | 'CONCRETADO'
  | 'ABANDONADO'

export type EstadoLineaPedido =
  | 'ACTIVA'
  | 'SUSPENDIDA'
  | 'ENTREGADA'

export type TipoEventoPedido =
  | 'LINEA_AGREGADA'
  | 'LINEA_MODIFICADA'
  | 'LINEA_SUSPENDIDA'
  | 'CANTIDAD_MODIFICADA'
  | 'VALOR_APLICADO'
  | 'PEDIDO_CONFIRMADO'
  | 'COBRO_INICIADO'
  | 'PEDIDO_CONCRETADO'
  | 'PEDIDO_ABANDONADO'
  | 'PEDIDO_DIVIDIDO'
  | 'PEDIDO_FUSIONADO'

export type TipoValorOperacional =
  | 'NORMAL'
  | 'OFERTA'
  | 'PREFERENCIAL'
  | 'MAYORISTA'
  | 'LIBRE'

export interface LineaPedido {
  id: string
  pedidoId: string
  hovId: string
  nombreVisible: string
  cantidad: number
  valorAplicado: number
  tipoValor: TipoValorOperacional
  esValorManual: boolean
  factorConversion: number
  estado: EstadoLineaPedido
  creadoEn: string
  modificadoEn: string
}

export interface EventoPedido {
  id: string
  pedidoId: string
  tipo: TipoEventoPedido
  momento: string
  operadorId: string
  detalle: string | null
}

export interface Pedido {
  id: string
  codigo: string
  estado: EstadoPedido
  contextoOperacionalId: string
  identidadOperacionalId: string
  operadorId: string
  lineas: LineaPedido[]
  eventos: EventoPedido[]
  momentoApertura: string
  momentoConcrecion: string | null
  momentoAbandono: string | null
  motivoAbandono: string | null
}

export interface CrearPedidoInput {
  contextoOperacionalId: string
  identidadOperacionalId: string
  operadorId: string
}

export interface AgregarLineaInput {
  pedidoId: string
  hovId: string
  cantidad: number
  contextoOperacionalId: string
  identidadOperacionalId: string
  margenMinimoConfigurable: number
  operadorTieneCapacidadLibre: boolean
  operadorId: string
}

export interface ModificarCantidadInput {
  pedidoId: string
  lineaId: string
  nuevaCantidad: number
  operadorId: string
}

export interface PedidoStore {
  pedidos: Pedido[]
  ultimaSincronizacion: string | null
}
