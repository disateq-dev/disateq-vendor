import type { ContextoCatalogo, DisponibilidadCatalogo, UmbralDisponibilidad } from './catalogo.types'
import { construirCatalogo } from './catalogo.service'

export interface ProductoBuscable {
  id: string
  description: string
  barcode: string
  unitPrice: number
  presentacion: string
  stockStatus: string
  hovId: string
  factorConversion: number
  requiereValorManual: boolean
}

function mapearDisponibilidad(
  disponibilidad: DisponibilidadCatalogo
): string {
  if (disponibilidad === 'DISPONIBLE') return 'normal'
  if (disponibilidad === 'ULTIMAS_UNIDADES') return 'low'
  return 'out'
}

export function obtenerProductosBuscables(
  contextoOperacionalId: string,
  identidadOperacionalId: string,
  operadorId: string
): ProductoBuscable[] {
  try {
    const contextoCatalogo: ContextoCatalogo = {
      contextoOperacionalId,
      identidadOperacionalId,
      operadorId,
      momento: new Date().toISOString(),
      margenMinimoConfigurable: 0.15,
      operadorTieneCapacidadLibre: false,
    }

    const umbral: UmbralDisponibilidad = {
      ultimasUnidades: 5,
    }

    const disponibilidadService = {
      getUnidadesDisponibles(productoId: string): number {
        try {
          const raw = localStorage.getItem('disateq:inventory:items')
          if (!raw) return 0
          const parsed = JSON.parse(raw) as unknown
          if (!Array.isArray(parsed)) return 0
          const item = parsed.find(entry =>
            typeof entry === 'object' &&
            entry !== null &&
            'id' in entry &&
            entry.id === productoId
          ) as { disponible?: number } | undefined
          return item?.disponible ?? 0
        } catch {
          return 0
        }
      },
    }

    const catalogo = construirCatalogo(
      contextoCatalogo,
      umbral,
      disponibilidadService
    )

    return catalogo.items.map(item => ({
      id: item.hovId,
      description: item.nombre,
      barcode: item.hovId,
      unitPrice: item.valorAplicado ?? 0,
      presentacion: item.unidadDespacho,
      stockStatus: mapearDisponibilidad(item.disponibilidad),
      hovId: item.hovId,
      factorConversion: item.factorConversion,
      requiereValorManual: item.valorAplicado === null,
    }))
  } catch {
    return []
  }
}

export function buscarProductos(
  termino: string,
  contextoOperacionalId: string,
  identidadOperacionalId: string,
  operadorId: string
): ProductoBuscable[] {
  try {
    const productos = obtenerProductosBuscables(
      contextoOperacionalId,
      identidadOperacionalId,
      operadorId
    )

    const normalized = termino.trim().toLowerCase()
    if (!normalized) return productos

    return productos.filter(product =>
      product.description.toLowerCase().includes(normalized) ||
      product.presentacion.toLowerCase().includes(normalized)
    )
  } catch {
    return []
  }
}
