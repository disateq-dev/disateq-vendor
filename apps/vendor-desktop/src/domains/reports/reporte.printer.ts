import type {
  ReporteAbastecimiento,
  ReporteComprobantes,
  ReporteTurnos,
  ReporteVentas,
} from './reporte.types'

function formatearFecha(iso: string): string {
  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime())) {
    return ''
  }

  const dd = String(fecha.getDate()).padStart(2, '0')
  const mm = String(fecha.getMonth() + 1).padStart(2, '0')
  const yyyy = fecha.getFullYear()
  const hh = String(fecha.getHours()).padStart(2, '0')
  const min = String(fecha.getMinutes()).padStart(2, '0')

  return `${dd}/${mm}/${yyyy} ${hh}:${min}`
}

function formatearMonto(n: number): string {
  return `S/ ${n.toFixed(2)}`
}

function linea(char = '─'): string {
  return char.repeat(32)
}

export function formatearVentasTermico(reporte: ReporteVentas): string {
  try {
    const output = [
      'REPORTE DE VENTAS',
      linea(),
      `${formatearFecha(reporte.periodo.desde)} - ${formatearFecha(reporte.periodo.hasta)}`,
      linea(),
      `Total vendido:  ${formatearMonto(reporte.totalVendido)}`,
      `Transacciones:  ${reporte.totalTransacciones}`,
      linea(),
      'MÉTODOS DE PAGO',
      `Efectivo:  ${formatearMonto(reporte.desglosePago.efectivo.monto)} (${reporte.desglosePago.efectivo.cantidad})`,
      `Yape:      ${formatearMonto(reporte.desglosePago.yape.monto)} (${reporte.desglosePago.yape.cantidad})`,
      `Tarjeta:   ${formatearMonto(reporte.desglosePago.tarjeta.monto)} (${reporte.desglosePago.tarjeta.cantidad})`,
      `Mixto:     ${formatearMonto(reporte.desglosePago.mixto.monto)} (${reporte.desglosePago.mixto.cantidad})`,
      linea(),
      'TOP PRODUCTOS',
      ...reporte.productosMasVendidos.slice(0, 5).map((item, index) =>
        `${index + 1}. ${item.nombre} x${item.cantidadVendida} ${formatearMonto(item.totalGenerado)}`
      ),
      linea(),
      'POR OPERADOR',
      ...reporte.ventasPorOperador.map(item =>
        `${item.nombre}: ${formatearMonto(item.totalVendido)} (${item.transacciones})`
      ),
    ]

    return output.join('\n')
  } catch {
    return ''
  }
}

export function formatearComprobantesTermico(
  reporte: ReporteComprobantes
): string {
  try {
    const output = [
      'REPORTE DE COMPROBANTES',
      linea(),
      `${formatearFecha(reporte.periodo.desde)} - ${formatearFecha(reporte.periodo.hasta)}`,
      linea(),
      ...reporte.conteoPorTipo.map(item =>
        `${item.tipo}:  ${item.cantidad}  ${formatearMonto(item.total)}`
      ),
      linea(),
      `Pendientes SUNAT:  ${reporte.pendientesSUNAT}`,
      `Anulaciones:       ${reporte.anulaciones}`,
      `Total emitido:     ${formatearMonto(reporte.totalEmitido)}`,
    ]

    return output.join('\n')
  } catch {
    return ''
  }
}

export function formatearTurnosTermico(reporte: ReporteTurnos): string {
  try {
    const output = [
      'REPORTE DE TURNOS',
      linea(),
      `${formatearFecha(reporte.periodo.desde)} - ${formatearFecha(reporte.periodo.hasta)}`,
      linea(),
    ]

    reporte.turnos.forEach(turno => {
      output.push(`${turno.cajaId} - ${turno.operador}`)
      output.push(`Apertura: ${formatearFecha(turno.apertura.hora)}`)
      output.push(`          ${formatearMonto(turno.apertura.montoInicial)}`)

      if (turno.cierre !== null) {
        output.push(`Cierre:   ${formatearFecha(turno.cierre.hora)}`)
        output.push(`          ${formatearMonto(turno.cierre.montoCierre)}`)
      }

      output.push(`Diferencia: ${formatearMonto(turno.diferencia ?? 0)}`)
      output.push(`Estado: ${turno.estado}`)
      output.push(linea())
    })

    return output.join('\n')
  } catch {
    return ''
  }
}

export function formatearAbastecimientoTermico(
  reporte: ReporteAbastecimiento
): string {
  try {
    const output = [
      'REPORTE ABASTECIMIENTO',
      linea(),
      `${formatearFecha(reporte.periodo.desde)} - ${formatearFecha(reporte.periodo.hasta)}`,
      linea(),
      'ALERTAS DE STOCK',
      ...reporte.productosEnAlerta.map(item =>
        `${item.nombre}: ${item.disponible} uds (min: ${item.umbralAlerta})`
      ),
      linea(),
      `Compras período:  ${reporte.comprasDelPeriodo}`,
      `Gasto total:      ${formatearMonto(reporte.gastoTotal)}`,
      linea(),
      'PROVEEDORES',
      ...reporte.resumenProveedores.map(item =>
        `${item.proveedor}: ${item.cantidadCompras} compras ${formatearMonto(item.montoTotal)}`
      ),
    ]

    return output.join('\n')
  } catch {
    return ''
  }
}

export function formatearVentasA4(reporte: ReporteVentas): string {
  try {
    void reporte
    // TODO: implementar cuando impresión A4 esté disponible
    return ''
  } catch {
    return ''
  }
}

export function formatearComprobantesA4(
  reporte: ReporteComprobantes
): string {
  try {
    void reporte
    // TODO: implementar cuando impresión A4 esté disponible
    return ''
  } catch {
    return ''
  }
}

export function formatearTurnosA4(reporte: ReporteTurnos): string {
  try {
    void reporte
    // TODO: implementar cuando impresión A4 esté disponible
    return ''
  } catch {
    return ''
  }
}

export function formatearAbastecimientoA4(
  reporte: ReporteAbastecimiento
): string {
  try {
    void reporte
    // TODO: implementar cuando impresión A4 esté disponible
    return ''
  } catch {
    return ''
  }
}
