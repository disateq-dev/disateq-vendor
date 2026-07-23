import { invoke } from '@tauri-apps/api/core'
import type { ItemOperacional, MovimientoOperacional } from './types'

export interface ResumenInventarioSQLite {
  productoId: string
  nombreComercial: string
  presentacionId: string
  descripcion: string
  unidadConteo: string
  totalDisponible: number
  lotesVigentes: number
  proximoVencimiento: string | null
  stockMinimo: number
  requiereLote: boolean
}

let movimientosHidratados: MovimientoOperacional[] = []

export async function cargarInventarioDesdeSQLite(): Promise<{
  items: ItemOperacional[]
  movimientos: MovimientoOperacional[]
}> {
  try {
    const raw = await invoke<Array<Record<string, unknown>>>(
      'obtener_inventario_farmacia'
    )
    const runtimeId = obtenerRuntimeId()
    const ahora = Date.now()

    const items: ItemOperacional[] = raw.map(r => ({
      itemId:     r['producto_id'] as string,
      nombre:     r['nombre_comercial'] as string,
      unidadBase: r['unidad_conteo'] as string,
      estado:     'ACTIVO' as const,
    }))

    const movimientos: MovimientoOperacional[] = raw
      .filter(r => (r['total_disponible'] as number) > 0)
      .map(r => ({
        movementId: crypto.randomUUID(),
        itemId:     r['producto_id'] as string,
        tipo:       'entrada' as const,
        cantidad:   r['total_disponible'] as number,
        timestamp:  ahora,
        runtimeId,
        causa:      'hidratacion-sqlite',
      }))

    movimientosHidratados = movimientos
    return { items, movimientos }
  } catch {
    movimientosHidratados = []
    return { items: [], movimientos: [] }
  }
}

export function loadMovimientos(): MovimientoOperacional[] {
  return movimientosHidratados
}

// runtimeId: identidad del runtime en memoria — no persiste entre sesiones
let _runtimeId: string | null = null
export function obtenerRuntimeId(): string {
  if (!_runtimeId) _runtimeId = crypto.randomUUID()
  return _runtimeId
}
