import { invoke } from '@tauri-apps/api/core'
import type {
  PedidoProveedor,
  LineaPedidoProveedor,
  PendientePorPresentacion,
  CrearPedidoProveedorInput,
  EstadoPedidoProveedor,
  RecepcionLineaInput,
} from './types'

// Interfaces privadas de respuesta Rust (snake_case)
interface PedidoProveedorRespuesta {
  id: string
  proveedor_id: string
  proveedor_nombre: string
  operador_id: string
  estado: string
  referencia?: string
  observacion?: string
  fecha_esperada?: string
  creado_en: string
  modificado_en: string
}

interface LineaPedidoRespuesta {
  id: string
  pedido_id: string
  presentacion_id: string
  producto_nombre: string
  presentacion_descripcion: string
  cantidad_pedida: number
  cantidad_recibida: number
  costo_unitario_acordado?: number
  requiere_lote: boolean
  creado_en: string
}

interface PendientePorPresentacionRespuesta {
  presentacion_id: string
  unidades_pendientes: number
}

function traducirPedido(r: PedidoProveedorRespuesta): PedidoProveedor {
  return {
    id: r.id,
    proveedorId: r.proveedor_id,
    proveedorNombre: r.proveedor_nombre,
    operadorId: r.operador_id,
    estado: r.estado as EstadoPedidoProveedor,
    referencia: r.referencia,
    observacion: r.observacion,
    fechaEsperada: r.fecha_esperada,
    creadoEn: r.creado_en,
    modificadoEn: r.modificado_en,
  }
}

function traducirLinea(r: LineaPedidoRespuesta): LineaPedidoProveedor {
  return {
    id: r.id,
    pedidoId: r.pedido_id,
    presentacionId: r.presentacion_id,
    productoNombre: r.producto_nombre,
    presentacionDescripcion: r.presentacion_descripcion,
    cantidadPedida: r.cantidad_pedida,
    cantidadRecibida: r.cantidad_recibida,
    costoUnitarioAcordado: r.costo_unitario_acordado,
    requiereLote: r.requiere_lote,
    creadoEn: r.creado_en,
  }
}

export async function crearPedidoProveedor(input: CrearPedidoProveedorInput): Promise<string> {
  return invoke<string>('crear_pedido_proveedor', {
    proveedorId: input.proveedorId,
    operadorId: input.operadorId,
    referencia: input.referencia ?? null,
    observacion: input.observacion ?? null,
    fechaEsperada: input.fechaEsperada ?? null,
    lineas: input.lineas.map(l => ({
      presentacion_id: l.presentacionId,
      producto_nombre: l.productoNombre,
      presentacion_descripcion: l.presentacionDescripcion,
      cantidad_pedida: l.cantidadPedida,
      costo_unitario_acordado: l.costoUnitarioAcordado ?? null,
      requiere_lote: l.requiereLote,
    })),
  })
}

export async function obtenerPedidosProveedor(estado?: EstadoPedidoProveedor): Promise<PedidoProveedor[]> {
  const respuesta = await invoke<PedidoProveedorRespuesta[]>('obtener_pedidos_proveedor', {
    estado: estado ?? null,
  })
  return respuesta.map(traducirPedido)
}

export async function obtenerLineasPedido(pedidoId: string): Promise<LineaPedidoProveedor[]> {
  const respuesta = await invoke<LineaPedidoRespuesta[]>('obtener_lineas_pedido', { pedidoId })
  return respuesta.map(traducirLinea)
}

export async function confirmarPedidoProveedor(id: string): Promise<void> {
  await invoke('confirmar_pedido_proveedor', { id })
}

export async function marcarEnTransito(id: string): Promise<void> {
  await invoke('marcar_en_transito', { id })
}

export async function cancelarPedidoProveedor(id: string): Promise<void> {
  await invoke('cancelar_pedido_proveedor', { id })
}

export async function recibirLineasPedido(
  pedidoId: string,
  recepciones: RecepcionLineaInput[]
): Promise<void> {
  await invoke('recibir_lineas_pedido', {
    pedidoId,
    recepciones: recepciones.map(r => ({
      linea_id: r.lineaId,
      cantidad_recibida_ahora: r.cantidadRecibidaAhora,
    })),
  })
}

export async function obtenerPedidosActivosPorPresentacion(): Promise<PendientePorPresentacion[]> {
  const respuesta = await invoke<PendientePorPresentacionRespuesta[]>(
    'obtener_pedidos_activos_por_presentacion'
  )
  return respuesta.map(r => ({
    presentacionId: r.presentacion_id,
    unidadesPendientes: r.unidades_pendientes,
  }))
}
