import type { ContextoCatalogo, DisponibilidadCatalogo, UmbralDisponibilidad } from './catalogo.types'
import { construirCatalogo } from './catalogo.service'
import { getHOVById } from './hov.store'
import { resolverValor } from './valor-operacional.resolver'
import type { TipoValorOperacional } from './valor-operacional.types'
import { loadMovimientos } from '../inventory/persistence'
import { deriveDisponibilidad } from '../inventory/store'

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
  category?: string
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
          return deriveDisponibilidad(loadMovimientos(), productoId)
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
      barcode: item.codigoBarras ?? '',
      unitPrice: item.valorAplicado ?? 0,
      presentacion: item.unidadDespacho,
      stockStatus: mapearDisponibilidad(item.disponibilidad),
      hovId: item.hovId,
      factorConversion: item.factorConversion,
      requiereValorManual: item.valorAplicado === null,
      category: item.category,
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

export interface FormaVenta {
  hovId: string
  nombre: string
  factorConversion: number
  valorAplicado: number | null
  tipoValor: TipoValorOperacional | null
  requiereAutorizacion: boolean
}

export interface GrupoProducto {
  productoId: string
  nombre: string
  stockStatus: string
  barcode: string
  formasVenta: FormaVenta[]
}

export function agruparPorProducto(productos: ProductoBuscable[]): GrupoProducto[] {
  const grupos = new Map<string, ProductoBuscable[]>()

  productos.forEach(producto => {
    const hov = getHOVById(producto.hovId)
    const productoId = hov?.productoId ?? producto.hovId
    const grupo = grupos.get(productoId) ?? []
    grupos.set(productoId, [...grupo, producto])
  })

  return Array.from(grupos.entries()).map(([productoId, grupo]) => {
    const primero = grupo[0]
    return {
      productoId,
      nombre: primero.description,
      stockStatus: primero.stockStatus,
      barcode: primero.barcode,
      formasVenta: grupo.map(producto => {
        const resultado = resolverValor({
          hovId: producto.hovId,
          cantidad: 1,
          contextoOperacionalId: 'default',
          identidadOperacionalId: 'default',
          momento: new Date().toISOString(),
          margenMinimoConfigurable: 0.15,
          operadorTieneCapacidadLibre: false,
        })
        return {
          hovId: producto.hovId,
          nombre: producto.presentacion,
          factorConversion: producto.factorConversion,
          valorAplicado: resultado.valorAplicado,
          tipoValor: resultado.tipo,
          requiereAutorizacion: resultado.requiereAutorizacion,
        }
      }),
    }
  })
}
