import { invoke } from '@tauri-apps/api/core'
import { logError } from '../logging/error-logger'
import type { Comprobante } from './comprobante.types'

interface LineaComprobanteRust {
  descripcion: string
  cantidad: number
  valor_unitario: number
  subtotal: number
  tipo_afectacion_igv: string
  tasa_igv: number
  monto_isc: number | null
  nota_linea: string | null
  codigo_producto_sunat: string | null
}

export interface ComprobanteResumen {
  id: string
  venta_id: string | null
  tipo: string
  serie: string
  correlativo: number
  codigo_unico: string
  es_formal: boolean
  estado: string
  estado_sunat: string
  receptor_nombre: string
  receptor_es_generico: boolean
  subtotal: number
  igv: number
  total: number
  metodo_pago: string
  operador_id: string
  emitido_en: string
}

export async function registrarComprobanteEnSQLite(
  comprobante: Comprobante,
  sesionId: string | null,
  cajaCodigo: string | null,
  ventaId: string | null,
): Promise<{ ok: boolean }> {
  const lineas: LineaComprobanteRust[] = comprobante.lineas.map(linea => ({
    descripcion: linea.descripcion,
    cantidad: linea.cantidad,
    valor_unitario: linea.valorUnitario,
    subtotal: linea.subtotal,
    tipo_afectacion_igv: linea.tipoAfectacionIGV,
    tasa_igv: linea.tasaIGV,
    monto_isc: linea.montoISC,
    nota_linea: linea.notaLinea,
    codigo_producto_sunat: linea.codigoProductoSUNAT,
  }))

  try {
    await invoke('registrar_comprobante', {
      comprobante_id: comprobante.id,
      venta_id: ventaId,
      tipo: comprobante.tipo,
      serie: comprobante.serie,
      correlativo: comprobante.correlativo,
      codigo_unico: comprobante.codigoUnico,
      es_formal: comprobante.esFormal,
      requiere_envio_sunat: comprobante.requiereEnvioSUNAT,
      leyenda_no_formal: comprobante.leyendaNoFormal ?? null,
      estado_sunat: comprobante.estadoSUNAT,
      emisor_ruc: comprobante.emisor.ruc,
      emisor_razon_social: comprobante.emisor.razonSocial,
      emisor_direccion: comprobante.emisor.direccion,
      receptor_tipo_doc: comprobante.receptor.tipoDocumento,
      receptor_num_doc: comprobante.receptor.numeroDocumento ?? null,
      receptor_nombre: comprobante.receptor.nombre,
      receptor_es_generico: comprobante.receptor.esGenerico,
      receptor_cliente_id: comprobante.receptor.clienteId ?? null,
      subtotal: comprobante.subtotal,
      igv: comprobante.igv,
      isc: comprobante.isc,
      total: comprobante.total,
      moneda: comprobante.moneda,
      metodo_pago: comprobante.metodoPago,
      regimen: comprobante.tributario.regimen,
      incluye_detraccion: comprobante.tributario.incluyeDetraccion,
      operador_id: comprobante.operadorId,
      sesion_id: sesionId,
      caja_codigo: cajaCodigo,
      enviado_por_canal: comprobante.enviadoPorCanal,
      emitido_en: comprobante.emitidoEn,
      lineas,
    })
    return { ok: true }
  } catch {
    await logError('comprobante-sqlite', 'No se pudo registrar el comprobante en SQLite')
    return { ok: false }
  }
}

export async function obtenerSiguienteCorrelativoSQLite(
  serie: string,
): Promise<number> {
  try {
    return await invoke<number>('obtener_siguiente_correlativo', { serie })
  } catch {
    await logError('comprobante-sqlite', 'No se pudo obtener el siguiente correlativo')
    return 1
  }
}

export async function obtenerComprobantesSesionSQLite(
  sesionId: string,
): Promise<ComprobanteResumen[]> {
  try {
    return await invoke<ComprobanteResumen[]>('obtener_comprobantes_sesion', {
      sesion_id: sesionId,
    })
  } catch {
    await logError('comprobante-sqlite', 'No se pudieron obtener los comprobantes de la sesión')
    return []
  }
}

export async function obtenerHistorialComprobantesSQLite(filtros?: {
  tipo?: string
  estado?: string
  limite?: number
}): Promise<ComprobanteResumen[]> {
  try {
    return await invoke<ComprobanteResumen[]>('obtener_comprobantes_historial', {
      tipo: filtros?.tipo ?? null,
      estado: filtros?.estado ?? null,
      limite: filtros?.limite ?? null,
    })
  } catch {
    await logError('comprobante-sqlite', 'No se pudo obtener el historial de comprobantes')
    return []
  }
}

export async function obtenerComprobanteDetalleSQLite(
  comprobanteId: string,
): Promise<{ comprobante: Record<string, unknown>; lineas: Record<string, unknown>[] } | null> {
  try {
    return await invoke<{ comprobante: Record<string, unknown>; lineas: Record<string, unknown>[] }>(
      'obtener_comprobante_detalle',
      { comprobante_id: comprobanteId },
    )
  } catch {
    await logError('comprobante-sqlite', 'No se pudo obtener el detalle del comprobante')
    return null
  }
}

export async function anularComprobanteEnSQLite(
  comprobanteId: string,
  motivo: string,
): Promise<{ ok: boolean }> {
  try {
    await invoke('anular_comprobante_sqlite', {
      comprobante_id: comprobanteId,
      motivo,
    })
    return { ok: true }
  } catch {
    await logError('comprobante-sqlite', 'No se pudo anular el comprobante')
    return { ok: false }
  }
}

export async function actualizarEstadoSUNAT(
  comprobanteId: string,
  estadoSunat: string,
  cdr: string | null,
): Promise<{ ok: boolean }> {
  try {
    await invoke('actualizar_estado_sunat', {
      comprobante_id: comprobanteId,
      estado_sunat: estadoSunat,
      cdr,
    })
    return { ok: true }
  } catch {
    await logError('comprobante-sqlite', 'No se pudo actualizar el estado SUNAT')
    return { ok: false }
  }
}
