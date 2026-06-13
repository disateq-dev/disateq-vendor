import { RUBROS, type Rubro } from '../../data/catalogs'
import * as hovStore from './hov.store'
import { crearHOV } from './hov.service'
import { crearValor } from './valor-operacional.service'

const CONTEXTO_OPERACIONAL_ID = 'default'
const MARGEN_COSTO = 0.7

/**
 * Seed idempotente: crea HOV + ValorOperacional NORMAL para cada producto
 * del catálogo del rubro, usando una sola presentación base ("unidad",
 * factorConversion 1, valor = price del catálogo).
 *
 * Espejo de syncCatalogToInventory — seguro de ejecutar en cada arranque
 * y en cada cambio de rubro; no duplica HOVs existentes.
 */
export function seedCatalogoFromRubro(rubro: Rubro): void {
  const config = RUBROS[rubro]
  if (!config) return

  for (const product of config.catalog) {
    if (hovStore.existeHOVActiva(product.id, 'unidad')) continue

    const costoBase = Math.max(0.01, Math.round(product.price * MARGEN_COSTO * 100) / 100)

    const hov = crearHOV({
      nombre: product.name,
      productoId: product.id,
      unidadDespacho: 'unidad',
      factorConversion: 1,
      costoBase,
      contextoOperacionalId: CONTEXTO_OPERACIONAL_ID,
      category: product.category,
    })

    if (product.price > 0) {
      crearValor({
        hovId: hov.id,
        tipo: 'NORMAL',
        valor: product.price,
        moneda: 'PEN',
        condiciones: {
          cantidadMinima: null,
          contextoOperacionalId: null,
          identidadOperacionalId: null,
        },
        vigencia: {
          desde: new Date().toISOString(),
          hasta: null,
        },
      })
    }
  }
}
