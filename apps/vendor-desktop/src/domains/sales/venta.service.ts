import { invoke } from '@tauri-apps/api/core'
import { getHOVById } from '../catalog/hov.store'
import { useFarmaciaStore } from '../farmacia/farmacia.store'
import { logError, logInfo } from '../logging/error-logger'
import type { Pedido } from './pedido.types'

export interface RegistrarVentaInput {
  pedido: Pedido
  metodoPago: string
  tipoComprobante: string
  sesionId: string | null
  cajaCodigo: string | null
}

export async function registrarVentaEnSQLite(input: RegistrarVentaInput): Promise<{ ok: boolean; ventaId: string | null }> {
  if (input.tipoComprobante === 'COTIZACION') return { ok: true, ventaId: null }

  const lineasActivas = input.pedido.lineas.filter(linea => linea.estado === 'ACTIVA')
  const total = lineasActivas.reduce((acumulado, linea) => acumulado + linea.cantidad * linea.valorAplicado, 0)
  const lineas = lineasActivas.map(linea => {
    const hov = getHOVById(linea.hovId)
    return {
      hov_id: linea.hovId,
      nodo_fraccionamiento_id: hov?.nodoFraccionamientoId ?? null,
      nombre_visible: linea.nombreVisible,
      cantidad: linea.cantidad,
      factor_conversion: linea.factorConversion,
      valor_aplicado: linea.valorAplicado,
      tipo_valor: linea.tipoValor,
      es_valor_manual: linea.esValorManual,
      es_servicio: hov?.tipoRecurso === 'SERVICIO',
    }
  })

  try {
    await invoke<string>('registrar_venta', {
      ventaId: input.pedido.id,
      codigo: input.pedido.codigo,
      operadorId: input.pedido.operadorId,
      sesionId: input.sesionId,
      cajaCodigo: input.cajaCodigo,
      total,
      metodoPago: input.metodoPago,
      tipoComprobante: input.tipoComprobante,
      concretadaEn: input.pedido.momentoConcrecion ?? new Date().toISOString(),
      lineas,
    })
    void useFarmaciaStore.getState().cargarResumenInventario()
    void logInfo('venta-service', `Venta ${input.pedido.codigo} registrada en SQLite`)
    return { ok: true, ventaId: input.pedido.id }
  } catch (error) {
    void logError('venta-service', `Error registrando venta ${input.pedido.codigo}`, { error: String(error) })
    return { ok: false, ventaId: null }
  }
}
