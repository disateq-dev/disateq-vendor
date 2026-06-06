import type { AgregarLineaInput, CrearPedidoInput, EventoPedido, LineaPedido, ModificarCantidadInput, Pedido } from './pedido.types'
import { pedidoStore } from './pedido.store'
import { getHOVById } from '../catalog/hov.store'
import { resolverValor } from '../catalog/valor-operacional.resolver'

export function generarCodigo(): string {
  let next = 1

  while (pedidoStore.getPedidoByCodigo(`P-${String(next).padStart(4, '0')}`)) {
    next += 1
  }

  return `P-${String(next).padStart(4, '0')}`
}

export function generarLineaId(): string {
  return crypto.randomUUID()
}

function crearEvento(pedidoId: string, tipo: EventoPedido['tipo'], operadorId: string, detalle: string | null): EventoPedido {
  return {
    id: crypto.randomUUID(),
    pedidoId,
    tipo,
    momento: new Date().toISOString(),
    operadorId,
    detalle,
  }
}

export function crearPedido(input: CrearPedidoInput): Pedido {
  const pedido: Pedido = {
    id: crypto.randomUUID(),
    codigo: generarCodigo(),
    estado: 'ABIERTO',
    contextoOperacionalId: input.contextoOperacionalId,
    identidadOperacionalId: input.identidadOperacionalId,
    operadorId: input.operadorId,
    lineas: [],
    eventos: [],
    momentoApertura: new Date().toISOString(),
    momentoConcrecion: null,
    momentoAbandono: null,
    motivoAbandono: null,
  }

  return pedidoStore.guardarPedido(pedido)
}

export function agregarLinea(input: AgregarLineaInput): Pedido {
  const pedido = pedidoStore.getPedidoById(input.pedidoId)
  if (!pedido) {
    throw new Error('Pedido no encontrado')
  }

  if (pedido.estado !== 'ABIERTO') {
    throw new Error('Solo se pueden agregar líneas a un pedido abierto')
  }

  const hov = getHOVById(input.hovId)
  if (!hov) {
    throw new Error('HOV no encontrada')
  }

  if (hov.estado !== 'ACTIVA') {
    throw new Error('La HOV no está disponible')
  }

  if (!Number.isInteger(input.cantidad) || input.cantidad <= 0) {
    throw new Error('La cantidad debe ser mayor a cero')
  }

  const resultado = resolverValor({
    hovId: input.hovId,
    cantidad: input.cantidad,
    contextoOperacionalId: input.contextoOperacionalId,
    identidadOperacionalId: input.identidadOperacionalId,
    momento: new Date().toISOString(),
    margenMinimoConfigurable: input.margenMinimoConfigurable,
    operadorTieneCapacidadLibre: input.operadorTieneCapacidadLibre,
  })

  if (resultado.valido === false && resultado.tipo !== 'LIBRE') {
    throw new Error(resultado.error)
  }

  const now = new Date().toISOString()
  const linea: LineaPedido = {
    id: generarLineaId(),
    pedidoId: input.pedidoId,
    hovId: input.hovId,
    nombreVisible: hov.nombre,
    cantidad: input.cantidad,
    valorAplicado: resultado.valorAplicado ?? 0,
    tipoValor: resultado.tipo ?? 'LIBRE',
    esValorManual: resultado.tipo === 'LIBRE',
    factorConversion: hov.factorConversion,
    estado: 'ACTIVA',
    creadoEn: now,
    modificadoEn: now,
  }

  const evento = crearEvento(input.pedidoId, 'LINEA_AGREGADA', input.operadorId, hov.nombre)
  const actualizado: Pedido = {
    ...pedido,
    lineas: [...pedido.lineas, linea],
    eventos: [...pedido.eventos, evento],
  }

  return pedidoStore.guardarPedido(actualizado)
}

export function modificarCantidad(input: ModificarCantidadInput): Pedido {
  const pedido = pedidoStore.getPedidoById(input.pedidoId)
  if (!pedido) {
    throw new Error('Pedido no encontrado')
  }

  if (pedido.estado !== 'ABIERTO') {
    throw new Error('Solo se puede modificar cantidad en un pedido abierto')
  }

  const linea = pedido.lineas.find(item => item.id === input.lineaId)
  if (!linea) {
    throw new Error('Línea no encontrada')
  }

  if (linea.estado !== 'ACTIVA') {
    throw new Error('La línea no está activa')
  }

  if (!Number.isInteger(input.nuevaCantidad) || input.nuevaCantidad <= 0) {
    throw new Error('La cantidad debe ser mayor a cero')
  }

  const now = new Date().toISOString()
  const lineas = pedido.lineas.map(item =>
    item.id === input.lineaId
      ? { ...item, cantidad: input.nuevaCantidad, modificadoEn: now }
      : item
  )
  const evento = crearEvento(input.pedidoId, 'CANTIDAD_MODIFICADA', input.operadorId, `${linea.nombreVisible} → ${input.nuevaCantidad}`)
  const actualizado: Pedido = {
    ...pedido,
    lineas,
    eventos: [...pedido.eventos, evento],
  }

  return pedidoStore.guardarPedido(actualizado)
}

export function confirmarPedido(pedidoId: string, operadorId: string): Pedido {
  const pedido = pedidoStore.getPedidoById(pedidoId)
  if (!pedido) {
    throw new Error('Pedido no encontrado')
  }

  if (pedido.estado !== 'ABIERTO') {
    throw new Error('Solo se puede confirmar un pedido abierto')
  }

  if (!pedido.lineas.some(linea => linea.estado === 'ACTIVA')) {
    throw new Error('El pedido no tiene líneas activas')
  }

  const evento = crearEvento(pedidoId, 'PEDIDO_CONFIRMADO', operadorId, null)
  const actualizado: Pedido = {
    ...pedido,
    estado: 'CONFIRMADO',
    eventos: [...pedido.eventos, evento],
  }

  return pedidoStore.guardarPedido(actualizado)
}

export function iniciarCobro(pedidoId: string, operadorId: string): Pedido {
  const pedido = pedidoStore.getPedidoById(pedidoId)
  if (!pedido) {
    throw new Error('Pedido no encontrado')
  }

  if (pedido.estado !== 'CONFIRMADO') {
    throw new Error('Solo se puede iniciar cobro en un pedido confirmado')
  }

  const evento = crearEvento(pedidoId, 'COBRO_INICIADO', operadorId, null)
  const actualizado: Pedido = {
    ...pedido,
    estado: 'EN_COBRO',
    eventos: [...pedido.eventos, evento],
  }

  return pedidoStore.guardarPedido(actualizado)
}

export function abandonarPedido(pedidoId: string, operadorId: string, motivo: string): Pedido {
  const pedido = pedidoStore.getPedidoById(pedidoId)
  if (!pedido) {
    throw new Error('Pedido no encontrado')
  }

  if (pedido.estado === 'CONCRETADO') {
    throw new Error('Un pedido concretado no puede abandonarse')
  }

  if (pedido.estado === 'ABANDONADO') {
    throw new Error('El pedido ya está abandonado')
  }

  if (!motivo.trim()) {
    throw new Error('El motivo de abandono es obligatorio')
  }

  const now = new Date().toISOString()
  const evento = crearEvento(pedidoId, 'PEDIDO_ABANDONADO', operadorId, motivo)
  const actualizado: Pedido = {
    ...pedido,
    estado: 'ABANDONADO',
    momentoAbandono: now,
    motivoAbandono: motivo,
    eventos: [...pedido.eventos, evento],
  }

  return pedidoStore.guardarPedido(actualizado)
}
