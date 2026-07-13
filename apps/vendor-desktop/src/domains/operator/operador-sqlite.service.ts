import { invoke } from '@tauri-apps/api/core'
import { logError } from '../logging/error-logger'

export interface OperadorRow {
  id: string
  codigo_operador: string
  alias: string
  apellidos: string
  nombres: string
  nombre_completo: string
  dni: string | null
  telefono: string | null
  codigo_rol: string
  nombre_rol: string
  base_bloque: number | null
  asignacion_bloque_en: string | null
  liberacion_bloque_en: string | null
  estado: string
  motivo_estado: string | null
  fecha_estado: string | null
  pin: string
  pin_salt: string | null
  capacidades: string
  registrado_en: string
  registrado_por: string
  modificado_en: string
}

export interface RolRow {
  id: string
  codigo: string
  nombre: string
  descripcion: string
  capacidades: string
  requiere_bloque: number
  activo: number
  creado_en: string
  creado_por: string
}

export async function cargarOperadoresSQLite(): Promise<OperadorRow[]> {
  try {
    return await invoke<OperadorRow[]>('obtener_operadores', {})
  } catch {
    await logError('operator-sqlite', 'No se pudo obtener los operadores desde SQLite')
    return []
  }
}

export async function cargarRolesSQLite(): Promise<RolRow[]> {
  try {
    return await invoke<RolRow[]>('obtener_roles', {})
  } catch {
    await logError('operator-sqlite', 'No se pudo obtener los roles desde SQLite')
    return []
  }
}

export async function crearOperadorSQLite(params: {
  id: string
  codigo_operador: string
  alias: string
  apellidos: string
  nombres: string
  nombre_completo: string
  dni: string | null
  telefono: string | null
  codigo_rol: string
  nombre_rol: string
  base_bloque: number | null
  asignacion_bloque_en: string | null
  estado: string
  pin: string
  pin_salt: string | null
  capacidades: string
  registrado_en: string
  registrado_por: string
}): Promise<{ ok: boolean }> {
  try {
    await invoke('crear_operador', { ...params })
    return { ok: true }
  } catch {
    await logError('operator-sqlite', 'No se pudo crear el operador en SQLite')
    return { ok: false }
  }
}

export async function actualizarOperadorSQLite(params: {
  id: string
  alias: string
  apellidos: string
  nombres: string
  nombre_completo: string
  dni: string | null
  telefono: string | null
  codigo_rol: string
  nombre_rol: string
  base_bloque: number | null
  asignacion_bloque_en: string | null
  liberacion_bloque_en: string | null
}): Promise<{ ok: boolean }> {
  try {
    await invoke('actualizar_operador', { ...params })
    return { ok: true }
  } catch {
    await logError('operator-sqlite', 'No se pudo actualizar el operador en SQLite')
    return { ok: false }
  }
}

export async function actualizarEstadoOperadorSQLite(
  id: string,
  estado: string,
  motivo_estado: string | null,
  fecha_estado: string | null,
): Promise<{ ok: boolean }> {
  try {
    await invoke('actualizar_estado_operador', { id, estado, motivo_estado, fecha_estado })
    return { ok: true }
  } catch {
    await logError('operator-sqlite', 'No se pudo actualizar el estado del operador en SQLite')
    return { ok: false }
  }
}

export async function actualizarPinOperadorSQLite(
  id: string,
  pin: string,
  pin_salt: string | null,
): Promise<{ ok: boolean }> {
  try {
    await invoke('actualizar_pin_operador', { id, pin, pin_salt })
    return { ok: true }
  } catch {
    await logError('operator-sqlite', 'No se pudo actualizar el PIN del operador en SQLite')
    return { ok: false }
  }
}

export async function actualizarCapacidadesOperadorSQLite(
  id: string,
  capacidades: string,
): Promise<{ ok: boolean }> {
  try {
    await invoke('actualizar_capacidades_operador', { id, capacidades })
    return { ok: true }
  } catch {
    await logError('operator-sqlite', 'No se pudo actualizar las capacidades del operador en SQLite')
    return { ok: false }
  }
}

export async function crearRolSQLite(params: {
  id: string
  codigo: string
  nombre: string
  descripcion: string
  capacidades: string
  requiere_bloque: number
  creado_en: string
  creado_por: string
}): Promise<{ ok: boolean }> {
  try {
    await invoke('crear_rol', { ...params })
    return { ok: true }
  } catch {
    await logError('operator-sqlite', 'No se pudo crear el rol en SQLite')
    return { ok: false }
  }
}

export async function actualizarRolSQLite(params: {
  id: string
  codigo: string
  nombre: string
  descripcion: string
}): Promise<{ ok: boolean }> {
  try {
    await invoke('actualizar_rol', { ...params })
    return { ok: true }
  } catch {
    await logError('operator-sqlite', 'No se pudo actualizar el rol en SQLite')
    return { ok: false }
  }
}

export async function actualizarCapacidadesRolSQLite(
  id: string,
  capacidades: string,
  activo?: number,
): Promise<{ ok: boolean }> {
  try {
    await invoke('actualizar_capacidades_rol', { id, capacidades, activo: activo ?? null })
    return { ok: true }
  } catch {
    await logError('operator-sqlite', 'No se pudo actualizar las capacidades del rol en SQLite')
    return { ok: false }
  }
}
