import { invoke } from '@tauri-apps/api/core'
import { logError } from '../logging/error-logger'

export interface SesionCajaRow {
  id: string
  caja_codigo: string
  caja_tipo: string
  operador_nombre: string
  operador_id: string | null
  terminal: string
  apertura: number
  motivo: string | null
  observacion: string | null
  ref_op: string | null
  estado: string
  close_signal: string | null
  abierta_en: string
  cerrada_en: string | null
}

export interface MovimientoCajaRow {
  id: string
  sesion_id: string
  tipo: string
  monto: number
  motivo: string
  observacion: string | null
  ref_id: string | null
  operador_nombre: string
  caja_codigo: string
  terminal: string
  source_type: string
  from_apertura: number
  from_vendido: number
  regularization_status: string | null
  regularization_mode: string | null
  timestamp: string
}

export async function abrirSesionCajaEnSQLite(
  sesionId: string,
  cajaCodigo: string,
  cajaTipo: string,
  operadorNombre: string,
  operadorId: string | null,
  terminal: string,
  apertura: number,
  motivo: string | null,
  observacion: string | null,
  refOp: string | null,
  abiertaEn: string,
): Promise<{ ok: boolean }> {
  try {
    await invoke('abrir_sesion_caja', {
      sesion_id: sesionId,
      caja_codigo: cajaCodigo,
      caja_tipo: cajaTipo,
      operador_nombre: operadorNombre,
      operador_id: operadorId,
      terminal,
      apertura,
      motivo,
      observacion,
      ref_op: refOp,
      abierta_en: abiertaEn,
    })
    return { ok: true }
  } catch {
    await logError('sesion-caja-sqlite', 'No se pudo registrar la apertura de sesión en SQLite')
    return { ok: false }
  }
}

export async function cerrarSesionCajaEnSQLite(
  sesionId: string,
  cerradaEn: string,
  closeSignal: string,
): Promise<{ ok: boolean }> {
  try {
    await invoke('cerrar_sesion_caja', {
      sesion_id: sesionId,
      cerrada_en: cerradaEn,
      close_signal: closeSignal,
    })
    return { ok: true }
  } catch {
    await logError('sesion-caja-sqlite', 'No se pudo registrar el cierre de sesión en SQLite')
    return { ok: false }
  }
}

export async function registrarMovimientoCajaEnSQLite(
  sesionId: string,
  tipo: string,
  monto: number,
  motivo: string,
  observacion: string | null,
  refId: string | null,
  operadorNombre: string,
  cajaCodigo: string,
  terminal: string,
  sourceType: string,
  fromApertura: number,
  fromVendido: number,
  regularizationStatus: string | null,
  regularizationMode: string | null,
  timestamp: string,
): Promise<{ ok: boolean; id: string | null }> {
  try {
    const id = await invoke<string>('registrar_movimiento_caja', {
      sesion_id: sesionId,
      tipo,
      monto,
      motivo,
      observacion,
      ref_id: refId,
      operador_nombre: operadorNombre,
      caja_codigo: cajaCodigo,
      terminal,
      source_type: sourceType,
      from_apertura: fromApertura,
      from_vendido: fromVendido,
      regularization_status: regularizationStatus,
      regularization_mode: regularizationMode,
      timestamp,
    })
    return { ok: true, id }
  } catch {
    await logError('sesion-caja-sqlite', 'No se pudo registrar el movimiento de caja en SQLite')
    return { ok: false, id: null }
  }
}

export async function actualizarMovimientoCajaEnSQLite(
  movimientoId: string,
  regularizationStatus: string,
  regularizationMode: string | null,
): Promise<{ ok: boolean }> {
  try {
    await invoke('actualizar_movimiento_caja', {
      movimiento_id: movimientoId,
      regularization_status: regularizationStatus,
      regularization_mode: regularizationMode,
    })
    return { ok: true }
  } catch {
    await logError('sesion-caja-sqlite', 'No se pudo actualizar el movimiento de caja en SQLite')
    return { ok: false }
  }
}

export async function registrarEventoTurnoEnSQLite(
  sesionId: string,
  tipo: string,
  texto: string,
  ts: string,
): Promise<void> {
  try {
    await invoke('registrar_evento_turno', {
      sesion_id: sesionId,
      tipo,
      texto,
      ts,
    })
  } catch {
    await logError('sesion-caja-sqlite', 'No se pudo registrar el evento de turno en SQLite')
  }
}

export async function obtenerSesionActivaSQLite(): Promise<SesionCajaRow | null> {
  try {
    return await invoke<SesionCajaRow | null>('obtener_sesion_activa', {})
  } catch {
    await logError('sesion-caja-sqlite', 'No se pudo obtener la sesión activa desde SQLite')
    return null
  }
}

export async function obtenerHistorialSesionesSQLite(
  limite?: number,
): Promise<SesionCajaRow[]> {
  try {
    return await invoke<SesionCajaRow[]>('obtener_historial_sesiones', {
      limite: limite ?? null,
    })
  } catch {
    await logError('sesion-caja-sqlite', 'No se pudo obtener el historial de sesiones desde SQLite')
    return []
  }
}

export async function obtenerMovimientosSesionSQLite(
  sesionId: string,
): Promise<MovimientoCajaRow[]> {
  try {
    return await invoke<MovimientoCajaRow[]>('obtener_movimientos_sesion', {
      sesion_id: sesionId,
    })
  } catch {
    await logError('sesion-caja-sqlite', 'No se pudo obtener los movimientos de sesión desde SQLite')
    return []
  }
}
