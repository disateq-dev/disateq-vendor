import type { ContextoCatalogo, DisponibilidadCatalogo, UmbralDisponibilidad } from './catalogo.types'
import { construirCatalogo } from './catalogo.service'
import { getHOVById } from './hov.store'
import { resolverValor } from './valor-operacional.resolver'
import type { TipoValorOperacional } from './valor-operacional.types'
import { loadMovimientos } from '../inventory/persistence'
import { deriveDisponibilidad, useInventoryStore } from '../inventory/store'
import { useFarmaciaStore } from '../../domains/farmacia/farmacia.store'

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
  tieneMultiplesFormas: boolean
  category?: string
  condicionVenta?: 'SIN_RECETA' | 'CON_RECETA' | 'CONTROLADO'
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

    const conteoPorProductoId = catalogo.items.reduce<Map<string, number>>((acc, item) => {
      const productoId = getHOVById(item.hovId)?.productoId ?? item.hovId
      acc.set(productoId, (acc.get(productoId) ?? 0) + 1)
      return acc
    }, new Map<string, number>())

    const farmaciaState = useFarmaciaStore.getState()
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
      tieneMultiplesFormas: (conteoPorProductoId.get(getHOVById(item.hovId)?.productoId ?? item.hovId) ?? 0) > 1,
      category: item.category,
      condicionVenta: farmaciaState.productosComerciales.find(producto => producto.id === getHOVById(item.hovId)?.productoId)?.condicionVenta,
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
    const nombreInventario = useInventoryStore.getState().items.find(item => item.itemId === productoId)?.nombre
    const nombreFallback = primero.description.includes('·')
      ? primero.description.split('·')[0].trim()
      : primero.description
    return {
      productoId,
      nombre: nombreInventario ?? nombreFallback,
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
