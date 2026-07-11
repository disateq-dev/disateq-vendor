import type { LineaPreVenta } from '../preventa/dto/LineaPreVenta'
import { getHOVById } from '../catalog/hov.store'
import { useFarmaciaStore } from './farmacia.store'
import { inventoryService } from '../inventory/service'
import { resolverLoteFefo, registrarMovimiento } from './farmacia.service'
import { useInventoryStore } from '../inventory/store'

interface PresentacionStore {
  id: string
  productoComercialId: string
}

type FarmaciaStateConPresentaciones = ReturnType<typeof useFarmaciaStore.getState> & {
  presentaciones?: PresentacionStore[]
  presentacionesComerciales?: PresentacionStore[]
}

type LineaPreVentaConFactor = LineaPreVenta & {
  factorConversion?: number
}

export async function despacharConFefo(lines: LineaPreVenta[], docNumber: string, operadorId: string): Promise<void> {
  const runtimeId = useInventoryStore.getState().runtimeId

  for (const linea of lines) {
    try {
      const hov = getHOVById(linea.hovId)
      if (hov === null) continue

      const farmaciaState = useFarmaciaStore.getState()
      const productoComercial = farmaciaState.productosComerciales.find((producto) => producto.id === hov.productoId)
      if (productoComercial === undefined) {
        inventoryService.registrarSalida(linea.hovId, linea.cantidad, `venta:${docNumber}`)
        continue
      }

      if (!productoComercial.requiereLote) {
        inventoryService.registrarSalida(linea.hovId, linea.cantidad, `venta:${docNumber}`)
        continue
      }

      inventoryService.registrarSalida(linea.hovId, linea.cantidad, `venta:${docNumber}`)

      const farmaciaStateConPresentaciones = farmaciaState as FarmaciaStateConPresentaciones
      const presentaciones = farmaciaStateConPresentaciones.presentaciones ?? farmaciaStateConPresentaciones.presentacionesComerciales ?? []
      const presentacionId = presentaciones.find((presentacion) => presentacion.productoComercialId === productoComercial.id)?.id ?? productoComercial.id
      const lineaConFactor = linea as LineaPreVentaConFactor
      const unidadesRequeridas = linea.cantidad * (lineaConFactor.factorConversion ?? 1)

      try {
        const asignaciones = await resolverLoteFefo(presentacionId, unidadesRequeridas)
        for (const asignacion of asignaciones) {
          await registrarMovimiento({
            itemId: productoComercial.id,
            tipo: 'SALIDA_VENTA',
            unidadesBase: asignacion.unidadesAsignadas,
            loteId: asignacion.loteId,
            causa: `venta:${docNumber}`,
            operadorId,
            runtimeId,
          })
        }
      } catch {
        continue
      }
    } catch {
      continue
    }
  }

  void useFarmaciaStore.getState().cargarResumenInventario()
}
