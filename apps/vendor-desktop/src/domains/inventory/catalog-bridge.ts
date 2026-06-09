import { RUBROS, type Rubro } from '../../data/catalogs';
import { inventoryService } from './service';

/**
 * Registra los productos del catálogo activo como ítems de inventario
 * usando el mismo id del catálogo como itemId.
 * Si el ítem ya existe, registrarItem() lo ignora — operación idempotente.
 */
export function syncCatalogToInventory(rubro: Rubro): void {
  const config = RUBROS[rubro];
  if (!config) return;
  config.catalog.forEach(product => {
    inventoryService.registrarItem({
      itemId:     product.id,
      nombre:     product.name,
      unidadBase: 'unidad',
    });
    if (product.stock > 0 && inventoryService.disponibilidad(product.id) === 0) {
      inventoryService.registrarEntrada(product.id, product.stock, 'seed-catalogo');
    }
  });
}
