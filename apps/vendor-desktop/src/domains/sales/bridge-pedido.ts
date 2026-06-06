import { pedidoStore } from './pedido.store'
import { crearPedido, confirmarPedido, iniciarCobro } from './pedido.service'
import { pedidoOperations } from './pedido.operations'
import { getHOVById } from '../catalog/hov.store'

export interface AddProductBridgeInput {
  hovId: string
  description: string
  cantidad: number
  unitPrice: number
  presentacion: string
  factorConversion: number
  requiereValorManual: boolean
  contextoOperacionalId: string
  identidadOperacionalId: string
  operadorId: string
  margenMinimoConfigurable: number
  operadorTieneCapacidadLibre: boolean
}

export interface TicketLineBridge {
  lineId: string
  productId: string
  description: string
  barcode: string
  quantity: number
  unitPrice: number
  subtotal: number
  presentacion: string
  tipoPrecio: string
  hovId: string
  factorConversion: number
  esValorManual: boolean
}

export function traducirATicketLine(
  input: AddProductBridgeInput
): TicketLineBridge {
  return {
    lineId: crypto.randomUUID(),
    productId: input.hovId,
    description: input.description,
    barcode: input.hovId,
    quantity: input.cantidad,
    unitPrice: input.unitPrice,
    subtotal: input.unitPrice * input.cantidad,
    presentacion: input.presentacion,
    tipoPrecio: input.requiereValorManual ? 'LIBRE' : 'RESUELTO',
    hovId: input.hovId,
    factorConversion: input.factorConversion,
    esValorManual: input.requiereValorManual,
  }
}

export function sincronizarConcrecion(pedidoId: string): void {
  try {
    const pedido = pedidoStore.getPedidoById(pedidoId)
    if (!pedido) return

    pedido.lineas
      .filter(linea => linea.estado === 'ACTIVA')
      .forEach(linea => {
        try {
          const hov = getHOVById(linea.hovId)
          if (!hov) return
          const unidadesADescontar = linea.cantidad * linea.factorConversion
          const raw = localStorage.getItem('disateq:inventory:items')
          if (!raw) return
          const items = JSON.parse(raw) as Array<{
            id: string
            disponible?: number
          }>
          const item = items.find(entry => entry.id === hov.productoId)
          if (!item) return
          item.disponible = Math.max(
            0,
            (item.disponible ?? 0) - unidadesADescontar
          )
          localStorage.setItem(
            'disateq:inventory:items',
            JSON.stringify(items)
          )
        } catch {
          return
        }
      })

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
