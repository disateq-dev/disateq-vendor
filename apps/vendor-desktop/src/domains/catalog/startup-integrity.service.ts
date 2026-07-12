import { getAllHOVs } from './hov.store'
import { getValoresActivos } from './valor-operacional.store'
import { proyectarAHov, sincronizarValorHov } from '../farmacia/hov-projector.service'
import {
  obtenerProductosComerciales,
  obtenerPresentaciones,
  obtenerNodosFraccionamiento,
  obtenerValoresNodo,
} from '../farmacia/farmacia.service'

import { logWarn, logCritical } from '../logging/error-logger'

/**
 * Verificación de integridad de caché al arranque.
 *
 * Ejecutar una vez por sesión, al autenticar el operador, solo si rubro === 'farmacia'.
 *
 * Fase A: Si LS-HOV está vacío y SQLite tiene productos activos con nodos vendibles,
 *         reconstruye las HOVs proyectando cada nodo vendible.
 *
 * Fase B: Si LS-VALOR está vacío y SQLite tiene valores operacionales activos,
 *         rehidrata el store sincronizando el valor NORMAL de cada nodo vendible.
 *
 * Ambas fases son idempotentes: proyectarAHov y sincronizarValorHov verifican
 * existencia antes de crear. Seguro ejecutar aunque la caché no esté vacía.
 */
export async function verificarIntegridadCacheFarmacia(): Promise<void> {
  try {
    const hovsExistentes = getAllHOVs()
    const valoresExistentes = getValoresActivos()

    const necesitaHovs = hovsExistentes.length === 0
    const necesitaValores = valoresExistentes.length === 0

    if (!necesitaHovs && !necesitaValores) return

    const productos = await obtenerProductosComerciales(undefined, true)
    if (productos.length === 0) return

    for (const producto of productos) {
      const presentaciones = await obtenerPresentaciones(producto.id)

      for (const presentacion of presentaciones) {
        const nodos = await obtenerNodosFraccionamiento(presentacion.id)
        const nodosVendibles = nodos.filter(n => n.esVendible)

        for (const nodo of nodosVendibles) {
          if (necesitaHovs) {
            try {
              proyectarAHov(
                nodo,
                presentacion,
                producto,
                null,
                'default',
                producto.tipoRecurso,
              )
            } catch (err) {
              void logWarn('startup-integrity', 'HOV no proyectable', {
                nodoId: nodo.id,
                presentacionId: presentacion.id,
                error: String(err),
              })
            }
          }

          if (necesitaValores) {
            try {
              const valores = await obtenerValoresNodo(nodo.id)
              const valorNormal = valores.find(
                v => v.tipo === 'VENTA_NORMAL' && v.estado === 'ACTIVO',
              )
              if (valorNormal !== undefined) {
                sincronizarValorHov(nodo, valorNormal.valor)
              }
            } catch (err) {
              void logWarn('startup-integrity', 'Valor no sincronizable', {
                nodoId: nodo.id,
                error: String(err),
              })
            }
          }
        }
      }
    }
  } catch (err) {
    void logCritical('startup-integrity', 'Fallo en verificación de integridad de caché', {
      error: String(err),
    })
  }
}
