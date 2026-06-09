import { loadBusinessConfig } from '../../config/business'
import { RUBROS } from '../../data/catalogs'
import * as hovStore from './hov.store'

/**
 * Migración idempotente: pobla el campo `category` en HOVs existentes
 * que fueron creados antes de que el campo existiera en el tipo HOV.
 *
 * Estrategia: cruza cada HOV sin category contra el catálogo del rubro
 * activo usando productoId → CatalogProduct.category.
 *
 * Segura para ejecutar en cada arranque — no toca HOVs que ya tienen category.
 */
export function migrarCategoryHOVs(): void {
  try {
    const bc = loadBusinessConfig()
    const rubroConfig = RUBROS[bc.rubro]
    if (!rubroConfig) return

    const catalogMap = new Map(rubroConfig.catalog.map(p => [p.id, p.category]))

    const hovsSinCategory = hovStore.getAllHOVs().filter(hov => !hov.category)
    if (hovsSinCategory.length === 0) return

    for (const hov of hovsSinCategory) {
      const category = catalogMap.get(hov.productoId)
      if (category) {
        hovStore.guardarHOV({ ...hov, category })
      }
    }
  } catch {
    // migración silenciosa — nunca interrumpe el arranque
  }
}
