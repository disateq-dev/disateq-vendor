import { invoke } from '@tauri-apps/api/core'
import type { Pedido, PedidoStore } from './pedido.types'

const _store: PedidoStore = { pedidos: [], ultimaSincronizacion: null }

function _esEstadoActivo(estado: string): boolean {
  return estado === 'ABIERTO' || estado === 'CONFIRMADO' || estado === 'EN_COBRO'
}

function _persistirEnSQLite(pedido: Pedido): void {
  void invoke('guardar_pedido_venta', {
    id: pedido.id,
    codigo: pedido.codigo,
    estado: pedido.estado,
    contextoOperacionalId: pedido.contextoOperacionalId,
    identidadOperacionalId: pedido.identidadOperacionalId,
    operadorId: pedido.operadorId,
    lineasJson: JSON.stringify(pedido.lineas),
    eventosJson: JSON.stringify(pedido.eventos),
    momentoApertura: pedido.momentoApertura,
    momentoConcrecion: pedido.momentoConcrecion ?? null,
    momentoAbandono: pedido.momentoAbandono ?? null,
    motivoAbandono: pedido.motivoAbandono ?? null,
  }).catch(() => {
    // mirror async — fallo silencioso no bloquea la operacion en memoria
  })
}

export async function cargarPedidosActivosDesdeSQLite(): Promise<void> {
  try {
    const rows = await invoke<Array<{
      id: string
      codigo: string
      estado: string
      contextoOperacionalId: string
      identidadOperacionalId: string
      operadorId: string
      lineasJson: string
      eventosJson: string
      momentoApertura: string
      momentoConcrecion: string | null
      momentoAbandono: string | null
      motivoAbandono: string | null
    }>>('obtener_pedidos_activos_venta')

    const pedidosRecuperados: Pedido[] = rows.map(row => ({
      id: row.id,
      codigo: row.codigo,
      estado: row.estado as Pedido['estado'],
      contextoOperacionalId: row.contextoOperacionalId,
      identidadOperacionalId: row.identidadOperacionalId,
      operadorId: row.operadorId,
      lineas: (() => { try { return JSON.parse(row.lineasJson) } catch { return [] } })(),
      eventos: (() => { try { return JSON.parse(row.eventosJson) } catch { return [] } })(),
      momentoApertura: row.momentoApertura,
      momentoConcrecion: row.momentoConcrecion ?? null,
      momentoAbandono: row.momentoAbandono ?? null,
      motivoAbandono: row.motivoAbandono ?? null,
    }))

    _store.pedidos = pedidosRecuperados
    _store.ultimaSincronizacion = new Date().toISOString()
  } catch {
    // SQLite no disponible en arranque — _store queda vacío, operación continúa
  }
}

export const pedidoStore = {

  getPedidoById(id: string): Pedido | null {
    return _store.pedidos.find(p => p.id === id) ?? null
  },

  getPedidoByCodigo(codigo: string): Pedido | null {
    return _store.pedidos.find(p => p.codigo === codigo) ?? null
  },

  getPedidosAbiertos(contextoOperacionalId: string): Pedido[] {
    return _store.pedidos
      .filter(p =>
        p.estado === 'ABIERTO' &&
        (contextoOperacionalId === '' ||
         p.contextoOperacionalId === contextoOperacionalId)
      )
      .sort((a, b) => b.momentoApertura.localeCompare(a.momentoApertura))
  },

  getPedidosActivos(contextoOperacionalId: string): Pedido[] {
    return _store.pedidos
      .filter(p =>
        _esEstadoActivo(p.estado) &&
        (contextoOperacionalId === '' ||
         p.contextoOperacionalId === contextoOperacionalId)
      )
      .sort((a, b) => b.momentoApertura.localeCompare(a.momentoApertura))
  },

  getPedidosConcretados(contextoOperacionalId: string): Pedido[] {
    return _store.pedidos
      .filter(p =>
        p.estado === 'CONCRETADO' &&
        (contextoOperacionalId === '' ||
         p.contextoOperacionalId === contextoOperacionalId)
      )
      .sort((a, b) =>
        (b.momentoConcrecion ?? '').localeCompare(a.momentoConcrecion ?? '')
      )
  },

  guardarPedido(pedido: Pedido): Pedido {
    const idx = _store.pedidos.findIndex(p => p.id === pedido.id)
    if (idx >= 0) {
      _store.pedidos[idx] = pedido
    } else {
      _store.pedidos.push(pedido)
    }
    _persistirEnSQLite(pedido)
    return pedido
  },

}
