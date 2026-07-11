export type EstadoPedidoProveedor =
  | 'BORRADOR'
  | 'CONFIRMADO'
  | 'EN_TRANSITO'
  | 'RECIBIDO_PARCIAL'
  | 'RECIBIDO'
  | 'CANCELADO'

export interface PedidoProveedor {
  id: string
  proveedorId: string
  proveedorNombre: string
  operadorId: string
  estado: EstadoPedidoProveedor
  referencia?: string
  observacion?: string
  fechaEsperada?: string
  creadoEn: string
  modificadoEn: string
}

export interface LineaPedidoProveedor {
  id: string
  pedidoId: string
  presentacionId: string
  productoNombre: string
  presentacionDescripcion: string
  cantidadPedida: number
  cantidadRecibida: number
  costoUnitarioAcordado?: number
  requiereLote: boolean
  creadoEn: string
}

export interface PendientePorPresentacion {
  presentacionId: string
  unidadesPendientes: number
}

export interface CrearPedidoProveedorInput {
  proveedorId: string
  operadorId: string
  referencia?: string
  observacion?: string
  fechaEsperada?: string
  lineas: CrearLineaPedidoInput[]
}

export interface CrearLineaPedidoInput {
  presentacionId: string
  productoNombre: string
  presentacionDescripcion: string
  cantidadPedida: number
  costoUnitarioAcordado?: number
  requiereLote: boolean
}

export interface RecepcionLineaInput {
  lineaId: string
  cantidadRecibidaAhora: number
}
