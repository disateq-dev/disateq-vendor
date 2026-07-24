import { invoke } from '@tauri-apps/api/core'
import { logError } from '../logging/error-logger'
import type { Comprobante } from './comprobante.types'
import type { RegistroCorrelativo } from './correlativo.types'

interface LineaComprobanteRust {
  descripcion: string
  cantidad: number
  valorUnitario: number
  subtotal: number
  tipoAfectacionIgv: string
  tasaIgv: number
  montoIsc: number | null
  notaLinea: string | null
  codigoProductoSunat: string | null
}

export interface ComprobanteResumen {
  id: string
  ventaId: string | null
  tipo: string
  serie: string
  correlativo: number
  codigoUnico: string
  esFormal: boolean
  estado: string
  estadoSunat: string
  receptorNombre: string
  receptorEsGenerico: boolean
  subtotal: number
  igv: number
  total: number
  metodoPago: string
  operadorId: string
  emitidoEn: string
  fueReimpreso: boolean
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
    valorUnitario: linea.valorUnitario,
    subtotal: linea.subtotal,
    tipoAfectacionIgv: linea.tipoAfectacionIGV,
    tasaIgv: linea.tasaIGV,
    montoIsc: linea.montoISC,
    notaLinea: linea.notaLinea,
    codigoProductoSunat: linea.codigoProductoSUNAT,
  }))

  try {
    await invoke('registrar_comprobante', {
      comprobanteId: comprobante.id,
      ventaId: ventaId,
      tipo: comprobante.tipo,
      serie: comprobante.serie,
      correlativo: comprobante.correlativo,
      codigoUnico: comprobante.codigoUnico,
      esFormal: comprobante.esFormal,
      requiereEnvioSunat: comprobante.requiereEnvioSUNAT,
      leyendaNoFormal: comprobante.leyendaNoFormal ?? null,
      estadoSunat: comprobante.estadoSUNAT,
      emisorRuc: comprobante.emisor.ruc,
      emisorRazonSocial: comprobante.emisor.razonSocial,
      emisorDireccion: comprobante.emisor.direccion,
      receptorTipoDoc: comprobante.receptor.tipoDocumento,
      receptorNumDoc: comprobante.receptor.numeroDocumento ?? null,
      receptorNombre: comprobante.receptor.nombre,
      receptorEsGenerico: comprobante.receptor.esGenerico,
      receptorClienteId: comprobante.receptor.clienteId ?? null,
      subtotal: comprobante.subtotal,
      igv: comprobante.igv,
      isc: comprobante.isc,
      total: comprobante.total,
      moneda: comprobante.moneda,
      metodoPago: comprobante.metodoPago,
      regimen: comprobante.tributario.regimen,
      incluyeDetraccion: comprobante.tributario.incluyeDetraccion,
      operadorId: comprobante.operadorId,
      sesionId: sesionId,
      cajaCodigo: cajaCodigo,
      enviadoPorCanal: comprobante.enviadoPorCanal,
      emitidoEn: comprobante.emitidoEn,
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
      sesionId: sesionId,
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
      { comprobanteId: comprobanteId },
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
      comprobanteId: comprobanteId,
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
      comprobanteId: comprobanteId,
      estadoSunat: estadoSunat,
      cdr,
    })
    return { ok: true }
  } catch {
    await logError('comprobante-sqlite', 'No se pudo actualizar el estado SUNAT')
    return { ok: false }
  }
}

export async function obtenerTodosCorrelativosSQLite(): Promise<RegistroCorrelativo[]> {
  try {
    const registros = await invoke<Array<{
      serie: string
      tipo: string
      siguiente: number
      ultimo_emitido: number
      creado_en: string
      actualizado_en: string
    }>>('obtener_todos_correlativos')
    return registros.map(registro => ({
      serie: registro.serie,
      tipo: registro.tipo as RegistroCorrelativo['tipo'],
      siguiente: registro.siguiente,
      ultimoEmitido: registro.ultimo_emitido,
      creadoEn: registro.creado_en,
      actualizadoEn: registro.actualizado_en,
    }))
  } catch {
    await logError('comprobante-sqlite', 'No se pudieron obtener los correlativos')
    return []
  }
}

export async function marcarComprobanteReferenciadoEnSQLite(
  comprobanteId: string,
): Promise<{ ok: boolean }> {
  try {
    await invoke('marcar_comprobante_referenciado', { comprobanteId })
    return { ok: true }
  } catch {
    await logError('comprobante-sqlite', 'No se pudo marcar el comprobante como referenciado')
    return { ok: false }
  }
}

export async function registrarEventoComprobanteSQLite(
  comprobanteId: string,
  tipoEvento: 'REIMPRESION',
  operadorId: string,
  sesionId: string,
): Promise<{ ok: boolean }> {
  try {
    await invoke('registrar_evento_comprobante', {
      comprobanteId,
      tipoEvento,
      operadorId,
      sesionId,
    })
    return { ok: true }
  } catch {
    await logError('comprobante-sqlite', 'No se pudo registrar el evento de comprobante')
    return { ok: false }
  }
}
