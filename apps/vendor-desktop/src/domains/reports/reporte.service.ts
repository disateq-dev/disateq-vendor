import { comprobanteStore } from '../documents/comprobante.store'
import { pedidoStore } from '../sales/pedido.store'
import type {
  DesglosePago,
  ItemAlertaStock,
  ItemCompraProveedor,
  ItemConteoComprobante,
  ItemTurno,
  ItemVentaHora,
  ItemVentaOperador,
  ItemVentaProducto,
  PeriodoReporte,
  ReporteAbastecimiento,
  ReporteComprobantes,
  ReporteTurnos,
  ReporteVentas,
} from './reporte.types'

const COMPROBANTE_TYPES = [
  'FACTURA',
  'BOLETA',
  'NOTA_CREDITO',
  'NOTA_DEBITO',
  'TIQUE_VENTA',
  'COTIZACION',
] as const

interface RawCompraLinea {
  cantidad?: number | string
  costoUnitario?: number | string
}

interface RawCompra {
  fecha?: string | number
  createdAt?: string | number
  timestamp?: string | number
  total?: number | string
  monto?: number | string
  proveedor?: string
  supplierName?: string
  lineas?: RawCompraLinea[]
}

interface RawInventoryLegacyItem {
  id?: string
  itemId?: string
  nombre?: string
  name?: string
  disponible?: number | string
  stockMinimo?: number | string
  umbralAlerta?: number | string
  eliminado?: boolean
}

interface RawInventoryItem {
  itemId?: string
  nombre?: string
  eliminado?: boolean
}

interface RawInventoryMovement {
  itemId?: string
  tipo?: string
  cantidad?: number | string
}

interface RawInventoryContext {
  itemId?: string
  umbralMinimo?: number | string
}

interface RawTurnoArqueo {
  total?: number | string
  contadoTotal?: number | string
}

interface RawTurno {
  boxCode?: string
  cajaId?: string
  operatorName?: string
  operador?: string
  operator?: string
  openedAt?: string
  startTime?: string
  openingAmount?: number | string
  montoApertura?: number | string
  closedAt?: string | null
  endTime?: string | null
  closingAmount?: number | string
  montoCierre?: number | string
  arqueo?: RawTurnoArqueo | null
}

interface InventarioNormalizado {
  productoId: string
  nombre: string
  disponible: number
  umbralAlerta: number
}

function dentroDePeriodo(fecha: string, periodo: PeriodoReporte): boolean {
  const value = new Date(fecha).getTime()
  const desde = new Date(periodo.desde).getTime()
  const hasta = new Date(periodo.hasta).getTime()

  if (
    Number.isNaN(value) ||
    Number.isNaN(desde) ||
    Number.isNaN(hasta)
  ) {
    return false
  }

  return value >= desde && value <= hasta
}

function createEmptyDesglosePago(): DesglosePago {
  return {
    efectivo: { monto: 0, cantidad: 0 },
    yape: { monto: 0, cantidad: 0 },
    tarjeta: { monto: 0, cantidad: 0 },
    mixto: { monto: 0, cantidad: 0 },
  }
}

function createEmptyReporteVentas(periodo: PeriodoReporte): ReporteVentas {
  return {
    periodo,
    totalVendido: 0,
    totalTransacciones: 0,
    desglosePago: createEmptyDesglosePago(),
    productosMasVendidos: [],
    ventasPorOperador: [],
    ventasPorHora: [],
  }
}

function createEmptyReporteComprobantes(periodo: PeriodoReporte): ReporteComprobantes {
  return {
    periodo,
    conteoPorTipo: [],
    pendientesSUNAT: 0,
    anulaciones: 0,
    totalEmitido: 0,
  }
}

function createEmptyReporteAbastecimiento(periodo: PeriodoReporte): ReporteAbastecimiento {
  return {
    periodo,
    productosEnAlerta: [],
    comprasDelPeriodo: 0,
    gastoTotal: 0,
    resumenProveedores: [],
  }
}

function createEmptyReporteTurnos(periodo: PeriodoReporte): ReporteTurnos {
  return {
    periodo,
    turnos: [],
  }
}

function toNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }

  return null
}

function toDateString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return new Date(value).toISOString()
  }

  return null
}

function readArrayFromStorage<T>(keys: readonly string[]): T[] {
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw) as unknown
      if (Array.isArray(parsed)) return parsed as T[]
    } catch {
      continue
    }
  }

  return []
}

function readStoreArrayFromStorage<T>(
  keys: readonly string[],
  property: string
): T[] {
  for (const key of keys) {
    try {
      const raw = localStorage.getItem(key)
      if (!raw) continue
      const parsed = JSON.parse(raw) as unknown

      if (Array.isArray(parsed)) {
        return parsed as T[]
      }

      if (typeof parsed === 'object' && parsed !== null) {
        const value = (parsed as Record<string, unknown>)[property]
        if (Array.isArray(value)) return value as T[]
      }
    } catch {
      continue
    }
  }

  return []
}

function readComprobantesFromStore() {
  return COMPROBANTE_TYPES.flatMap(tipo =>
    comprobanteStore.getComprobantesPorTipo(tipo)
  )
}

function readComprobantesFromStorage() {
  return readStoreArrayFromStorage<ReturnType<typeof readComprobantesFromStore>[number]>(
    ['disateq:documents:comprobantes'],
    'comprobantes'
  )
}

function normalizeLegacyInventoryItems(
  items: RawInventoryLegacyItem[]
): InventarioNormalizado[] {
  return items
    .filter(item => item.eliminado !== true)
    .map(item => {
      const productoId = item.id ?? item.itemId ?? ''
      const umbralAlerta = toNumber(item.stockMinimo)
        ?? toNumber(item.umbralAlerta)
        ?? 5

      return {
        productoId,
        nombre: item.nombre ?? item.name ?? productoId,
        disponible: toNumber(item.disponible) ?? 0,
        umbralAlerta,
      }
    })
    .filter(item => item.productoId.length > 0)
}

function normalizeInventoryItems(): InventarioNormalizado[] {
  const legacy = normalizeLegacyInventoryItems(
    readArrayFromStorage<RawInventoryLegacyItem>(['disateq:inventory:items'])
  )

  if (legacy.length > 0) {
    return legacy
  }

  const items = readArrayFromStorage<RawInventoryItem>(['inv_v0_items'])
    .filter(item => item.eliminado !== true && typeof item.itemId === 'string')

  if (items.length === 0) {
    return []
  }

  const movimientos = readArrayFromStorage<RawInventoryMovement>(['inv_v0_movimientos'])
  const contexto = readArrayFromStorage<RawInventoryContext>(['inv_v0_contexto'])

  return items.map(item => {
    const productoId = item.itemId as string
    const disponible = movimientos
      .filter(movimiento => movimiento.itemId === productoId)
      .reduce((acc, movimiento) => {
        const cantidad = toNumber(movimiento.cantidad) ?? 0

        if (movimiento.tipo === 'entrada') return acc + cantidad
        if (movimiento.tipo === 'salida') return acc - cantidad
        return acc + cantidad
      }, 0)

    const itemContexto = contexto.find(entry => entry.itemId === productoId)

    return {
      productoId,
      nombre: item.nombre ?? productoId,
      disponible,
      umbralAlerta: toNumber(itemContexto?.umbralMinimo) ?? 5,
    }
  })
}

function extractCompraFecha(compra: RawCompra): string | null {
  return (
    toDateString(compra.fecha) ??
    toDateString(compra.createdAt) ??
    toDateString(compra.timestamp)
  )
}

function extractCompraMonto(compra: RawCompra): number {
  const total = toNumber(compra.total)
  if (total !== null) return total

  const monto = toNumber(compra.monto)
  if (monto !== null) return monto

  if (!Array.isArray(compra.lineas)) {
    return 0
  }

  return compra.lineas.reduce((acc, linea) => {
    const cantidad = toNumber(linea.cantidad) ?? 0
    const costoUnitario = toNumber(linea.costoUnitario) ?? 0
    return acc + (cantidad * costoUnitario)
  }, 0)
}

function extractTurnoApertura(turno: RawTurno): string | null {
  return turno.openedAt ?? turno.startTime ?? null
}

function extractTurnoCierre(turno: RawTurno): string | null {
  return turno.closedAt ?? turno.endTime ?? null
}

function createVentasPorHora(): ItemVentaHora[] {
  return Array.from({ length: 24 }, (_, hora) => ({
    hora,
    totalVendido: 0,
    transacciones: 0,
  }))
}

export function generarReporteVentas(periodo: PeriodoReporte): ReporteVentas {
  const pedidos = pedidoStore
    .getPedidosConcretados('')
    .filter(pedido =>
      pedido.momentoConcrecion !== null &&
      dentroDePeriodo(pedido.momentoConcrecion, periodo)
    )

  if (pedidos.length === 0) {
    return createEmptyReporteVentas(periodo)
  }

  const comprobantes = readComprobantesFromStore()
    .filter(comprobante => dentroDePeriodo(comprobante.emitidoEn, periodo))

  const desglosePago = createEmptyDesglosePago()
  const productosMap = new Map<string, ItemVentaProducto>()
  const operadoresMap = new Map<string, ItemVentaOperador>()
  const ventasPorHora = createVentasPorHora()

  const totalVendido = pedidos.reduce((acc, pedido) => {
    const totalPedido = pedido.lineas
      .filter(linea => linea.estado === 'ACTIVA')
      .reduce((pedidoAcc, linea) => {
        const montoLinea = linea.cantidad * linea.valorAplicado
        const existente = productosMap.get(linea.hovId)

        productosMap.set(linea.hovId, {
          hovId: linea.hovId,
          nombre: existente?.nombre ?? linea.nombreVisible,
          cantidadVendida: (existente?.cantidadVendida ?? 0) + linea.cantidad,
          totalGenerado: (existente?.totalGenerado ?? 0) + montoLinea,
        })

        return pedidoAcc + montoLinea
      }, 0)

    const operador = operadoresMap.get(pedido.operadorId)
    operadoresMap.set(pedido.operadorId, {
      operadorId: pedido.operadorId,
      nombre: pedido.operadorId,
      totalVendido: (operador?.totalVendido ?? 0) + totalPedido,
      transacciones: (operador?.transacciones ?? 0) + 1,
    })

    if (pedido.momentoConcrecion !== null) {
      const hora = new Date(pedido.momentoConcrecion).getHours()
      if (hora >= 0 && hora < 24) {
        ventasPorHora[hora] = {
          hora,
          totalVendido: ventasPorHora[hora].totalVendido + totalPedido,
          transacciones: ventasPorHora[hora].transacciones + 1,
        }
      }
    }

    return acc + totalPedido
  }, 0)

  comprobantes.forEach(comprobante => {
    if (comprobante.metodoPago === 'EFECTIVO') {
      desglosePago.efectivo.monto += comprobante.total
      desglosePago.efectivo.cantidad += 1
      return
    }

    if (comprobante.metodoPago === 'YAPE') {
      desglosePago.yape.monto += comprobante.total
      desglosePago.yape.cantidad += 1
      return
    }

    if (comprobante.metodoPago === 'TARJETA') {
      desglosePago.tarjeta.monto += comprobante.total
      desglosePago.tarjeta.cantidad += 1
      return
    }

    desglosePago.mixto.monto += comprobante.total
    desglosePago.mixto.cantidad += 1
  })

  return {
    periodo,
    totalVendido,
    totalTransacciones: pedidos.length,
    desglosePago,
    productosMasVendidos: [...productosMap.values()]
      .sort((a, b) => b.cantidadVendida - a.cantidadVendida),
    ventasPorOperador: [...operadoresMap.values()],
    ventasPorHora,
  }
}

export function generarReporteComprobantes(
  periodo: PeriodoReporte
): ReporteComprobantes {
  const comprobantes = readComprobantesFromStorage()
    .filter(comprobante => dentroDePeriodo(comprobante.emitidoEn, periodo))

  if (comprobantes.length === 0) {
    return createEmptyReporteComprobantes(periodo)
  }

  const conteoMap = new Map<string, ItemConteoComprobante>()
  let pendientesSUNAT = 0
  let anulaciones = 0
  let totalEmitido = 0

  comprobantes.forEach(comprobante => {
    const existente = conteoMap.get(comprobante.tipo)
    conteoMap.set(comprobante.tipo, {
      tipo: comprobante.tipo,
      cantidad: (existente?.cantidad ?? 0) + 1,
      total: (existente?.total ?? 0) + comprobante.total,
    })

    if (comprobante.estadoSUNAT === 'PENDIENTE') {
      pendientesSUNAT += 1
    }

    if (comprobante.estado === 'ANULADO') {
      anulaciones += 1
    } else {
      totalEmitido += comprobante.total
    }
  })

  return {
    periodo,
    conteoPorTipo: [...conteoMap.values()],
    pendientesSUNAT,
    anulaciones,
    totalEmitido,
  }
}

export function generarReporteAbastecimiento(
  periodo: PeriodoReporte
): ReporteAbastecimiento {
  const items = normalizeInventoryItems()

  if (items.length === 0) {
    return createEmptyReporteAbastecimiento(periodo)
  }

  const productosEnAlerta: ItemAlertaStock[] = items
    .filter(item => item.disponible <= item.umbralAlerta)
    .map(item => ({
      productoId: item.productoId,
      nombre: item.nombre,
      disponible: item.disponible,
      umbralAlerta: item.umbralAlerta,
    }))

  const compras = readArrayFromStorage<RawCompra>([
    'disateq:purchases:purchases',
    'purch_v0_compras',
  ]).filter(compra => {
    const fecha = extractCompraFecha(compra)
    return fecha !== null && dentroDePeriodo(fecha, periodo)
  })

  const resumenProveedoresMap = new Map<string, ItemCompraProveedor>()
  let gastoTotal = 0

  compras.forEach(compra => {
    const monto = extractCompraMonto(compra)
    const proveedor = compra.proveedor ?? compra.supplierName ?? ''
    const existente = resumenProveedoresMap.get(proveedor)

    resumenProveedoresMap.set(proveedor, {
      proveedor,
      cantidadCompras: (existente?.cantidadCompras ?? 0) + 1,
      montoTotal: (existente?.montoTotal ?? 0) + monto,
    })

    gastoTotal += monto
  })

  return {
    periodo,
    productosEnAlerta,
    comprasDelPeriodo: compras.length,
    gastoTotal,
    resumenProveedores: [...resumenProveedoresMap.values()],
  }
}

export function generarReporteTurnos(periodo: PeriodoReporte): ReporteTurnos {
  const sesiones = readArrayFromStorage<RawTurno>([
    'disateq:cash:session-history',
    'disateq.pos.sessionHistory',
  ]).filter(sesion => {
    const apertura = extractTurnoApertura(sesion)
    return apertura !== null && dentroDePeriodo(apertura, periodo)
  })

  if (sesiones.length === 0) {
    return createEmptyReporteTurnos(periodo)
  }

  const turnos: ItemTurno[] = sesiones.map(sesion => {
    const montoInicial = toNumber(sesion.openingAmount)
      ?? toNumber(sesion.montoApertura)
      ?? toNumber((sesion as { apertura?: unknown }).apertura)
      ?? 0

    const cierreHora = extractTurnoCierre(sesion)
    const montoFinal = toNumber(sesion.closingAmount)
      ?? toNumber(sesion.montoCierre)
      ?? toNumber(sesion.arqueo?.total)
      ?? toNumber(sesion.arqueo?.contadoTotal)
      ?? 0

    const montoCierre = toNumber(sesion.arqueo?.total)
      ?? toNumber(sesion.arqueo?.contadoTotal)
      ?? toNumber(sesion.montoCierre)
      ?? toNumber(sesion.closingAmount)
      ?? 0

    const cierre = cierreHora === null
      ? null
      : {
          hora: cierreHora,
          montoFinal,
          montoCierre,
        }

    return {
      cajaId: sesion.boxCode ?? sesion.cajaId ?? '',
      operador: sesion.operatorName ?? sesion.operador ?? sesion.operator ?? '',
      apertura: {
        hora: sesion.openedAt ?? sesion.startTime ?? '',
        montoInicial,
      },
      cierre,
      diferencia: cierre === null ? null : cierre.montoCierre - montoInicial,
      estado: cierre !== null ? 'CERRADO' : 'ABIERTO',
    }
  })

  return {
    periodo,
    turnos,
  }
}
