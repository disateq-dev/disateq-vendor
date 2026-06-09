import { loadBusinessConfig } from '../../config/business'
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

function encabezadoA4(titulo: string, periodo: { desde: string; hasta: string }): string {
  const bc = loadBusinessConfig()
  const fmt = (iso: string) => {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return '—'
    return d.toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }
  return `
    <div class="header">
      <div class="header-top">
        <div>
          <p class="biz-name">${bc.nombreComercial}</p>
          <p class="biz-sub">${bc.razonSocial} · RUC ${bc.ruc}</p>
          ${bc.direccion ? `<p class="biz-sub">${bc.direccion}</p>` : ''}
        </div>
        <div class="report-title-block">
          <p class="report-title">${titulo}</p>
          <p class="report-period">${fmt(periodo.desde)} — ${fmt(periodo.hasta)}</p>
        </div>
      </div>
      <hr class="divider" />
    </div>`
}

function estilosA4(): string {
  return `
    <style>
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: Arial, sans-serif; font-size: 11px; color: #1a1a2e; background: white; padding: 24px 32px; }
      .header { margin-bottom: 20px; }
      .header-top { display: flex; justify-content: space-between; align-items: flex-start; }
      .biz-name { font-size: 15px; font-weight: 700; color: #1a2d4e; }
      .biz-sub { font-size: 10px; color: #6b7280; margin-top: 2px; }
      .report-title-block { text-align: right; }
      .report-title { font-size: 14px; font-weight: 700; color: #2154d8; text-transform: uppercase; }
      .report-period { font-size: 10px; color: #6b7280; margin-top: 3px; }
      .divider { border: none; border-top: 1.5px solid #e0e8f5; margin: 12px 0; }
      .section { margin-bottom: 20px; }
      .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: #9ca3af; margin-bottom: 8px; }
      .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 20px; }
      .stat-card { background: #f0f4ff; border-radius: 8px; padding: 10px 12px; }
      .stat-label { font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: .08em; color: #6b7280; }
      .stat-value { font-size: 14px; font-weight: 700; color: #1a2d4e; margin-top: 3px; }
      .stat-value.blue { color: #2154d8; }
      .stat-value.green { color: #15803d; }
      .stat-value.red { color: #dc2626; }
      .stat-value.amber { color: #b45309; }
      table { width: 100%; border-collapse: collapse; font-size: 11px; }
      th { text-align: left; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; color: #9ca3af; padding: 6px 8px; border-bottom: 1px solid #e5e7eb; }
      td { padding: 7px 8px; border-bottom: 1px solid #f3f4f6; color: #374151; }
      tr:last-child td { border-bottom: none; }
      .text-right { text-align: right; }
      .badge { display: inline-block; padding: 2px 8px; border-radius: 99px; font-size: 9px; font-weight: 700; }
      .badge-red { background: #fee2e2; color: #dc2626; }
      .badge-amber { background: #fef3c7; color: #b45309; }
      .badge-green { background: #dcfce7; color: #15803d; }
      .badge-blue { background: #dbeafe; color: #1d4ed8; }
      .footer { margin-top: 24px; border-top: 0.5px solid #e5e7eb; padding-top: 8px; display: flex; justify-content: space-between; }
      .footer-text { font-size: 9px; color: #9ca3af; }
      @media print {
        body { padding: 12px 16px; }
        @page { margin: 12mm; size: A4 portrait; }
      }
    </style>`
}

function wrapA4(body: string, titulo: string, periodo: { desde: string; hasta: string }): string {
  const now = new Date().toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${titulo}</title>${estilosA4()}</head><body>
    ${encabezadoA4(titulo, periodo)}
    ${body}
    <div class="footer">
      <span class="footer-text">Generado: ${now}</span>
      <span class="footer-text">DISATEQ VENDOR</span>
    </div>
  </body></html>`
}

export function formatearVentasA4(reporte: ReporteVentas): string {
  try {
    const fmt = (n: number) => `S/ ${n.toFixed(2)}`
    const body = `
      <div class="stats-grid">
        <div class="stat-card"><p class="stat-label">Total Vendido</p><p class="stat-value blue">${fmt(reporte.totalVendido)}</p></div>
        <div class="stat-card"><p class="stat-label">Transacciones</p><p class="stat-value">${reporte.totalTransacciones}</p></div>
        <div class="stat-card"><p class="stat-label">Ticket Promedio</p><p class="stat-value">${reporte.totalTransacciones > 0 ? fmt(reporte.totalVendido / reporte.totalTransacciones) : 'S/ 0.00'}</p></div>
        <div class="stat-card"><p class="stat-label">Efectivo</p><p class="stat-value green">${fmt(reporte.desglosePago.efectivo.monto)}</p></div>
      </div>
      <div class="section">
        <p class="section-title">Métodos de pago</p>
        <table><thead><tr><th>Método</th><th>Cantidad</th><th class="text-right">Monto</th></tr></thead><tbody>
          <tr><td>Efectivo</td><td>${reporte.desglosePago.efectivo.cantidad}</td><td class="text-right">${fmt(reporte.desglosePago.efectivo.monto)}</td></tr>
          <tr><td>Yape</td><td>${reporte.desglosePago.yape.cantidad}</td><td class="text-right">${fmt(reporte.desglosePago.yape.monto)}</td></tr>
          <tr><td>Tarjeta</td><td>${reporte.desglosePago.tarjeta.cantidad}</td><td class="text-right">${fmt(reporte.desglosePago.tarjeta.monto)}</td></tr>
          <tr><td>Mixto</td><td>${reporte.desglosePago.mixto.cantidad}</td><td class="text-right">${fmt(reporte.desglosePago.mixto.monto)}</td></tr>
        </tbody></table>
      </div>
      <div class="section">
        <p class="section-title">Productos más vendidos</p>
        <table><thead><tr><th>#</th><th>Producto</th><th>Cantidad</th><th class="text-right">Total</th></tr></thead><tbody>
          ${reporte.productosMasVendidos.slice(0, 10).map((p, i) =>
            `<tr><td>${i + 1}</td><td>${p.nombre}</td><td>${p.cantidadVendida}</td><td class="text-right">${fmt(p.totalGenerado)}</td></tr>`
          ).join('')}
        </tbody></table>
      </div>
      <div class="section">
        <p class="section-title">Por operador</p>
        <table><thead><tr><th>Operador</th><th>Transacciones</th><th class="text-right">Total</th></tr></thead><tbody>
          ${reporte.ventasPorOperador.map(o =>
            `<tr><td>${o.nombre}</td><td>${o.transacciones}</td><td class="text-right">${fmt(o.totalVendido)}</td></tr>`
          ).join('')}
        </tbody></table>
      </div>`
    return wrapA4(body, 'REPORTE DE VENTAS', reporte.periodo)
  } catch { return '' }
}

export function formatearComprobantesA4(reporte: ReporteComprobantes): string {
  try {
    const fmt = (n: number) => `S/ ${n.toFixed(2)}`
    const body = `
      <div class="stats-grid">
        <div class="stat-card"><p class="stat-label">Total Emitido</p><p class="stat-value blue">${fmt(reporte.totalEmitido)}</p></div>
        <div class="stat-card"><p class="stat-label">Anulaciones</p><p class="stat-value ${reporte.anulaciones > 0 ? 'red' : ''}">${reporte.anulaciones}</p></div>
        <div class="stat-card"><p class="stat-label">Pendientes SUNAT</p><p class="stat-value ${reporte.pendientesSUNAT > 0 ? 'amber' : ''}">${reporte.pendientesSUNAT}</p></div>
        <div class="stat-card"><p class="stat-label">Tipos emitidos</p><p class="stat-value">${reporte.conteoPorTipo.length}</p></div>
      </div>
      <div class="section">
        <p class="section-title">Conteo por tipo</p>
        <table><thead><tr><th>Tipo</th><th>Cantidad</th><th class="text-right">Total</th></tr></thead><tbody>
          ${reporte.conteoPorTipo.map(c =>
            `<tr><td>${c.tipo}</td><td>${c.cantidad}</td><td class="text-right">${fmt(c.total)}</td></tr>`
          ).join('')}
        </tbody></table>
      </div>`
    return wrapA4(body, 'REPORTE DE COMPROBANTES', reporte.periodo)
  } catch { return '' }
}

export function formatearTurnosA4(reporte: ReporteTurnos): string {
  try {
    const fmt = (n: number) => `S/ ${n.toFixed(2)}`
    const fmtH = (iso: string) => {
      const d = new Date(iso)
      return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    }
    const cerrados = reporte.turnos.filter(t => t.estado === 'CERRADO').length
    const abiertos = reporte.turnos.filter(t => t.estado === 'ABIERTO').length
    const diferencia = reporte.turnos.reduce((acc, t) => acc + (t.diferencia ?? 0), 0)
    const body = `
      <div class="stats-grid">
        <div class="stat-card"><p class="stat-label">Turnos Cerrados</p><p class="stat-value">${cerrados}</p></div>
        <div class="stat-card"><p class="stat-label">Turnos Abiertos</p><p class="stat-value ${abiertos > 0 ? 'amber' : ''}">${abiertos}</p></div>
        <div class="stat-card"><p class="stat-label">Diferencia Total</p><p class="stat-value ${diferencia < 0 ? 'red' : 'green'}">${fmt(diferencia)}</p></div>
        <div class="stat-card"><p class="stat-label">Total Turnos</p><p class="stat-value">${reporte.turnos.length}</p></div>
      </div>
      <div class="section">
        <p class="section-title">Detalle de turnos</p>
        <table><thead><tr><th>Caja</th><th>Operador</th><th>Apertura</th><th>Cierre</th><th>Diferencia</th><th>Estado</th></tr></thead><tbody>
          ${reporte.turnos.map(t =>
            `<tr>
              <td>${t.cajaId}</td>
              <td>${t.operador}</td>
              <td>${fmtH(t.apertura.hora)}<br/><small>${fmt(t.apertura.montoInicial)}</small></td>
              <td>${t.cierre ? fmtH(t.cierre.hora) + '<br/><small>' + fmt(t.cierre.montoCierre) + '</small>' : '—'}</td>
              <td class="${(t.diferencia ?? 0) < 0 ? 'red' : ''}">${t.diferencia !== null ? fmt(t.diferencia) : '—'}</td>
              <td><span class="badge ${t.estado === 'CERRADO' ? 'badge-blue' : 'badge-amber'}">${t.estado}</span></td>
            </tr>`
          ).join('')}
        </tbody></table>
      </div>`
    return wrapA4(body, 'REPORTE DE TURNOS', reporte.periodo)
  } catch { return '' }
}

export function formatearAbastecimientoA4(reporte: ReporteAbastecimiento): string {
  try {
    const fmt = (n: number) => `S/ ${n.toFixed(2)}`
    const agotados = reporte.productosEnAlerta.filter(p => p.disponible === 0).length
    const body = `
      <div class="stats-grid">
        <div class="stat-card"><p class="stat-label">En Alerta</p><p class="stat-value amber">${reporte.productosEnAlerta.length}</p></div>
        <div class="stat-card"><p class="stat-label">Agotados</p><p class="stat-value red">${agotados}</p></div>
        <div class="stat-card"><p class="stat-label">Compras Período</p><p class="stat-value">${reporte.comprasDelPeriodo}</p></div>
        <div class="stat-card"><p class="stat-label">Gasto Total</p><p class="stat-value blue">${fmt(reporte.gastoTotal)}</p></div>
      </div>
      <div class="section">
        <p class="section-title">Alertas de stock</p>
        <table><thead><tr><th>Producto</th><th>Disponible</th><th>Umbral</th><th>Estado</th></tr></thead><tbody>
          ${reporte.productosEnAlerta.map(a =>
            `<tr>
              <td>${a.nombre}</td>
              <td>${a.disponible}</td>
              <td>${a.umbralAlerta}</td>
              <td><span class="badge ${a.disponible === 0 ? 'badge-red' : 'badge-amber'}">${a.disponible === 0 ? 'AGOTADO' : 'BAJO'}</span></td>
            </tr>`
          ).join('')}
        </tbody></table>
      </div>
      <div class="section">
        <p class="section-title">Resumen por proveedor</p>
        <table><thead><tr><th>Proveedor</th><th>Compras</th><th class="text-right">Monto Total</th></tr></thead><tbody>
          ${reporte.resumenProveedores.map(p =>
            `<tr><td>${p.proveedor || 'Sin proveedor'}</td><td>${p.cantidadCompras}</td><td class="text-right">${fmt(p.montoTotal)}</td></tr>`
          ).join('')}
        </tbody></table>
      </div>`
    return wrapA4(body, 'REPORTE DE ABASTECIMIENTO', reporte.periodo)
  } catch { return '' }
}
