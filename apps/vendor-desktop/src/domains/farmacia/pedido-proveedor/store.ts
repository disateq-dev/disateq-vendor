import { create } from 'zustand'
import type {
  PedidoProveedor,
  LineaPedidoProveedor,
  PendientePorPresentacion,
  CrearPedidoProveedorInput,
  EstadoPedidoProveedor,
  RecepcionLineaInput,
} from './types'
import {
  crearPedidoProveedor,
  obtenerPedidosProveedor,
  obtenerLineasPedido,
  confirmarPedidoProveedor,
  marcarEnTransito,
  cancelarPedidoProveedor,
  recibirLineasPedido,
  obtenerPedidosActivosPorPresentacion,
} from './service'

interface PedidoProveedorState {
  pedidos: PedidoProveedor[]
  lineasPorPedido: Record<string, LineaPedidoProveedor[]>
  pendientesPorPresentacion: PendientePorPresentacion[]
  cargando: boolean
  error: string | null
  cargarPedidos(estado?: EstadoPedidoProveedor): Promise<void>
  cargarLineas(pedidoId: string): Promise<void>
  cargarPendientesPorPresentacion(): Promise<void>
  crearPedido(input: CrearPedidoProveedorInput): Promise<string>
  confirmar(id: string): Promise<void>
  marcarTransito(id: string): Promise<void>
  cancelar(id: string): Promise<void>
  recibirLineas(pedidoId: string, recepciones: RecepcionLineaInput[]): Promise<void>
  limpiarError(): void
}

function resolverMensajeError(error: unknown): string {
  if (error instanceof Error) return error.message
  return String(error)
}

export const usePedidoProveedorStore = create<PedidoProveedorState>()((set) => ({
  pedidos: [],
  lineasPorPedido: {},
  pendientesPorPresentacion: [],
  cargando: false,
  error: null,

  async cargarPedidos(estado?: EstadoPedidoProveedor): Promise<void> {
    set({ cargando: true, error: null })
    try {
      const pedidos = await obtenerPedidosProveedor(estado)
      set({ pedidos, cargando: false })
    } catch (error) {
      set({ error: resolverMensajeError(error), cargando: false })
    }
  },

  async cargarLineas(pedidoId: string): Promise<void> {
    set({ cargando: true, error: null })
    try {
      const lineas = await obtenerLineasPedido(pedidoId)
      set(state => ({
        lineasPorPedido: { ...state.lineasPorPedido, [pedidoId]: lineas },
        cargando: false,
      }))
    } catch (error) {
      set({ error: resolverMensajeError(error), cargando: false })
    }
  },

  async cargarPendientesPorPresentacion(): Promise<void> {
    try {
      const pendientesPorPresentacion = await obtenerPedidosActivosPorPresentacion()
      set({ pendientesPorPresentacion })
    } catch {
      // falla silenciosa — solo afecta al badge, no interrumpe flujo
    }
  },

  async crearPedido(input: CrearPedidoProveedorInput): Promise<string> {
    set({ cargando: true, error: null })
    try {
      const id = await crearPedidoProveedor(input)
      const pedidos = await obtenerPedidosProveedor()
      set({ pedidos, cargando: false })
      return id
    } catch (error) {
      set({ error: resolverMensajeError(error), cargando: false })
      throw error
    }
  },

  async confirmar(id: string): Promise<void> {
    set({ cargando: true, error: null })
    try {
      await confirmarPedidoProveedor(id)
      const pedidos = await obtenerPedidosProveedor()
      const pendientesPorPresentacion = await obtenerPedidosActivosPorPresentacion()
      set({ pedidos, pendientesPorPresentacion, cargando: false })
    } catch (error) {
      set({ error: resolverMensajeError(error), cargando: false })
      throw error
    }
  },

  async marcarTransito(id: string): Promise<void> {
    set({ cargando: true, error: null })
    try {
      await marcarEnTransito(id)
      const pedidos = await obtenerPedidosProveedor()
      set({ pedidos, cargando: false })
    } catch (error) {
      set({ error: resolverMensajeError(error), cargando: false })
      throw error
    }
  },

  async cancelar(id: string): Promise<void> {
    set({ cargando: true, error: null })
    try {
      await cancelarPedidoProveedor(id)
      const pedidos = await obtenerPedidosProveedor()
      const pendientesPorPresentacion = await obtenerPedidosActivosPorPresentacion()
      set({ pedidos, pendientesPorPresentacion, cargando: false })
    } catch (error) {
      set({ error: resolverMensajeError(error), cargando: false })
      throw error
    }
  },

  async recibirLineas(pedidoId: string, recepciones: RecepcionLineaInput[]): Promise<void> {
    set({ cargando: true, error: null })
    try {
      await recibirLineasPedido(pedidoId, recepciones)
      // Refrescar pedidos, líneas del pedido recibido y pendientes
      const pedidos = await obtenerPedidosProveedor()
      const lineas = await obtenerLineasPedido(pedidoId)
      const pendientesPorPresentacion = await obtenerPedidosActivosPorPresentacion()
      set(state => ({
        pedidos,
        lineasPorPedido: { ...state.lineasPorPedido, [pedidoId]: lineas },
        pendientesPorPresentacion,
        cargando: false,
      }))
    } catch (error) {
      set({ error: resolverMensajeError(error), cargando: false })
      throw error
    }
  },

  limpiarError(): void {
    set({ error: null })
  },
}))
