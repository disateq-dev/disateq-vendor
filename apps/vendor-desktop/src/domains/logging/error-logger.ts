import { invoke } from '@tauri-apps/api/core'

// ─── Tipos públicos ──────────────────────────────────────────────────────────

export type NivelLog = 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL'

export interface EventoLog {
  id:         number
  nivel:      NivelLog
  modulo:     string
  mensaje:    string
  contexto?:  string
  sesionId?:  string
  timestamp:  string
}

export interface ResumenSalud {
  estado:              'OK' | 'ALERTA' | 'CRITICO'
  criticosTotal:       number
  erroresTotal:        number
  advertenciasTotal:   number
  ultimoCritical?:     string
  ultimoError?:        string
}

// ─── Función principal ───────────────────────────────────────────────────────

/**
 * Registra un evento de log via el comando Tauri registrar_evento_log.
 * Fire-and-forget: nunca lanza, absorbe todos los fallos internamente.
 *
 * @param nivel    Nivel de severidad del evento.
 * @param modulo   Nombre del módulo origen en kebab-case (e.g. 'startup-integrity').
 * @param mensaje  Descripción legible del evento.
 * @param contexto Datos adicionales opcionales — se serializan a JSON.
 * @param sesionId ID de sesión/turno activo, si aplica.
 */
export async function log(
  nivel:     NivelLog,
  modulo:    string,
  mensaje:   string,
  contexto?: Record<string, unknown>,
  sesionId?: string,
): Promise<void> {
  try {
    await invoke('registrar_evento_log', {
      nivel,
      modulo,
      mensaje,
      contexto:  contexto !== undefined ? JSON.stringify(contexto) : null,
      sesionId:  sesionId ?? null,
    })
  } catch {
    // Absorber silenciosamente — el logger nunca interfiere con operaciones de negocio
  }
}

// ─── Atajos semánticos ───────────────────────────────────────────────────────

/** Evento informativo — solo va a archivo, no persiste en SQLite. */
export const logInfo = (
  modulo:    string,
  mensaje:   string,
  contexto?: Record<string, unknown>,
  sesionId?: string,
): Promise<void> => log('INFO', modulo, mensaje, contexto, sesionId)

/** Degradación no crítica — persiste en SQLite. */
export const logWarn = (
  modulo:    string,
  mensaje:   string,
  contexto?: Record<string, unknown>,
  sesionId?: string,
): Promise<void> => log('WARN', modulo, mensaje, contexto, sesionId)

/** Fallo de operación recuperable — persiste en SQLite. */
export const logError = (
  modulo:    string,
  mensaje:   string,
  contexto?: Record<string, unknown>,
  sesionId?: string,
): Promise<void> => log('ERROR', modulo, mensaje, contexto, sesionId)

/** Fallo que compromete integridad del sistema — persiste en SQLite. */
export const logCritical = (
  modulo:    string,
  mensaje:   string,
  contexto?: Record<string, unknown>,
  sesionId?: string,
): Promise<void> => log('CRITICAL', modulo, mensaje, contexto, sesionId)

// ─── Consultas ───────────────────────────────────────────────────────────────

/**
 * Obtiene eventos del log desde SQLite con filtros opcionales.
 * Solo devuelve eventos WARN+, ya que INFO va únicamente a archivo.
 */
export async function obtenerEventosLog(filtros?: {
  nivel?:  NivelLog
  modulo?: string
  limite?: number
}): Promise<EventoLog[]> {
  try {
    const raw = await invoke<Array<{
      id:         number
      nivel:      string
      modulo:     string
      mensaje:    string
      contexto:   string | null
      sesion_id:  string | null
      timestamp:  string
    }>>('obtener_eventos_log', {
      nivel:  filtros?.nivel  ?? null,
      modulo: filtros?.modulo ?? null,
      limite: filtros?.limite ?? null,
    })

    return raw.map(r => ({
      id:        r.id,
      nivel:     r.nivel as NivelLog,
      modulo:    r.modulo,
      mensaje:   r.mensaje,
      contexto:  r.contexto  ?? undefined,
      sesionId:  r.sesion_id ?? undefined,
      timestamp: r.timestamp,
    }))
  } catch {
    return []
  }
}

/**
 * Obtiene el resumen de salud del sistema (últimos 7 días).
 * Devuelve estado 'OK' como fallback si el comando falla.
 */
export async function obtenerResumenSalud(): Promise<ResumenSalud> {
  try {
    const raw = await invoke<{
      estado:               string
      criticos_total:       number
      errores_total:        number
      advertencias_total:   number
      ultimo_critical:      string | null
      ultimo_error:         string | null
    }>('obtener_resumen_salud', {})

    return {
      estado:            raw.estado as 'OK' | 'ALERTA' | 'CRITICO',
      criticosTotal:     raw.criticos_total,
      erroresTotal:      raw.errores_total,
      advertenciasTotal: raw.advertencias_total,
      ultimoCritical:    raw.ultimo_critical  ?? undefined,
      ultimoError:       raw.ultimo_error     ?? undefined,
    }
  } catch {
    return {
      estado:            'OK',
      criticosTotal:     0,
      erroresTotal:      0,
      advertenciasTotal: 0,
    }
  }
}
