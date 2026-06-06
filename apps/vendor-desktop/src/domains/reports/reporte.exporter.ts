import * as XLSX from 'xlsx'

import type {
  ReporteAbastecimiento,
  ReporteComprobantes,
  ReporteTurnos,
  ReporteVentas,
} from './reporte.types'

function fechaHoy(): string {
  const now = new Date()
  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  const dd = String(now.getDate()).padStart(2, '0')
  return `${yyyy}${mm}${dd}`
}

export function exportarVentasExcel(reporte: ReporteVentas): void {
  try {
    const resumen = XLSX.utils.aoa_to_sheet([
      ['Período', reporte.periodo.desde, reporte.periodo.hasta],
      ['Total Vendido', reporte.totalVendido],
      ['Transacciones', reporte.totalTransacciones],
      [],
      ['MÉTODOS DE PAGO', 'Monto', 'Cantidad'],
      ['Efectivo', reporte.desglosePago.efectivo.monto, reporte.desglosePago.efectivo.cantidad],
      ['Yape', reporte.desglosePago.yape.monto, reporte.desglosePago.yape.cantidad],
      ['Tarjeta', reporte.desglosePago.tarjeta.monto, reporte.desglosePago.tarjeta.cantidad],
      ['Mixto', reporte.desglosePago.mixto.monto, reporte.desglosePago.mixto.cantidad],
    ])

    const productos = XLSX.utils.aoa_to_sheet([
      ['Producto', 'Cantidad Vendida', 'Total Generado'],
      ...reporte.productosMasVendidos.map(p => [p.nombre, p.cantidadVendida, p.totalGenerado]),
    ])

    const operadores = XLSX.utils.aoa_to_sheet([
      ['Operador', 'Total Vendido', 'Transacciones'],
      ...reporte.ventasPorOperador.map(o => [o.nombre, o.totalVendido, o.transacciones]),
    ])

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, resumen, 'RESUMEN')
    XLSX.utils.book_append_sheet(wb, productos, 'PRODUCTOS')
    XLSX.utils.book_append_sheet(wb, operadores, 'POR OPERADOR')
    XLSX.writeFile(wb, `reporte-ventas-${fechaHoy()}.xlsx`)
  } catch {
    return
  }
}

export function exportarComprobantesExcel(
  reporte: ReporteComprobantes
): void {
  try {
    const comprobantes = XLSX.utils.aoa_to_sheet([
      ['Tipo', 'Cantidad', 'Total'],
      ...reporte.conteoPorTipo.map(c => [c.tipo, c.cantidad, c.total]),
      [],
      ['Pendientes SUNAT', reporte.pendientesSUNAT],
      ['Anulaciones', reporte.anulaciones],
      ['Total Emitido', reporte.totalEmitido],
    ])

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, comprobantes, 'COMPROBANTES')
    XLSX.writeFile(wb, `reporte-comprobantes-${fechaHoy()}.xlsx`)
  } catch {
    return
  }
}

export function exportarTurnosExcel(reporte: ReporteTurnos): void {
  try {
    const turnos = XLSX.utils.aoa_to_sheet([
      ['Caja', 'Operador', 'Hora Apertura', 'Monto Inicial', 'Hora Cierre', 'Monto Cierre', 'Diferencia', 'Estado'],
      ...reporte.turnos.map(t => [
        t.cajaId,
        t.operador,
        t.apertura.hora,
        t.apertura.montoInicial,
        t.cierre?.hora ?? '',
        t.cierre?.montoCierre ?? '',
        t.diferencia ?? '',
        t.estado,
      ]),
    ])

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, turnos, 'TURNOS')
    XLSX.writeFile(wb, `reporte-turnos-${fechaHoy()}.xlsx`)
  } catch {
    return
  }
}

export function exportarAbastecimientoExcel(
  reporte: ReporteAbastecimiento
): void {
  try {
    const alertas = XLSX.utils.aoa_to_sheet([
      ['Producto', 'Disponible', 'Umbral Alerta'],
      ...reporte.productosEnAlerta.map(a => [a.nombre, a.disponible, a.umbralAlerta]),
    ])

    const proveedores = XLSX.utils.aoa_to_sheet([
      ['Proveedor', 'Compras', 'Monto Total'],
      ...reporte.resumenProveedores.map(p => [p.proveedor, p.cantidadCompras, p.montoTotal]),
    ])

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, alertas, 'ALERTAS')
    XLSX.utils.book_append_sheet(wb, proveedores, 'PROVEEDORES')
    XLSX.writeFile(wb, `reporte-abastecimiento-${fechaHoy()}.xlsx`)
  } catch {
    return
  }
}
