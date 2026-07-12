import { pedidoStore } from './pedido.store'
import { crearPedido, confirmarPedido, iniciarCobro } from './pedido.service'
import { pedidoOperations } from './pedido.operations'
import { registrarVentaEnSQLite } from './venta.service'
import type { LineaPreVenta } from '../preventa/dto/LineaPreVenta'

export interface AddProductBridgeInput {
  hovId: string
  descripcion: string
  cantidad: number
  valorUnitario: number
  presentacion: string
  factorConversion: number
  requiereValorManual: boolean
  contextoOperacionalId: string
  identidadOperacionalId: string
  operadorId: string
  margenMinimoConfigurable: number
  operadorTieneCapacidadLibre: boolean
}

export function traducirALineaPreVenta(
  input: AddProductBridgeInput
): LineaPreVenta {
  return {
    lineaId: crypto.randomUUID(),
    hovId: input.hovId,
    descripcion: input.descripcion,
    codigoBarras: input.hovId,
    cantidad: input.cantidad,
    valorUnitario: input.valorUnitario,
    subtotal: input.valorUnitario * input.cantidad,
    presentacion: input.presentacion,
    tipoPrecio: input.requiereValorManual ? 'LIBRE' : 'RESUELTO',
    flags: {
      esPrecioManual: input.requiereValorManual,
      esRecuperada: false,
    },
  }
}

export function sincronizarConcrecion(pedidoId: string, metodoPago: string, tipoComprobante: string, sesionId: string | null, cajaCodigo: string | null): void {
  try {
    const pedido = pedidoStore.getPedidoById(pedidoId)
    if (!pedido) return

    try {
      if (pedido.estado === 'ABIERTO') {
        confirmarPedido(pedidoId, pedido.operadorId)
        iniciarCobro(pedidoId, pedido.operadorId)
        pedidoOperations.concretarPedido(pedidoId, pedido.operadorId)
      } else if (pedido.estado === 'CONFIRMADO') {
        iniciarCobro(pedidoId, pedido.operadorId)
        pedidoOperations.concretarPedido(pedidoId, pedido.operadorId)
      } else if (pedido.estado === 'EN_COBRO') {
        pedidoOperations.concretarPedido(pedidoId, pedido.operadorId)
      }
    } catch {
      // estado no permite concreción · continúa sin error
    }

    void registrarVentaEnSQLite({ pedido: pedidoStore.getPedidoById(pedidoId)!, metodoPago, tipoComprobante, sesionId, cajaCodigo })

  } catch {
    return
  }
}

export function obtenerPedidoActivoOCrear(
  contextoOperacionalId: string,
  identidadOperacionalId: string,
  operadorId: string
): string {
  try {
    const pedidos = pedidoStore.getPedidosAbiertos(contextoOperacionalId)
    if (pedidos.length > 0) return pedidos[0].id
    const pedido = crearPedido({
      contextoOperacionalId,
      identidadOperacionalId,
      operadorId,
    })
    return pedido.id
  } catch {
    return ''
  }
}
