import type { CatalogoProyectado, ContextoCatalogo, DisponibilidadCatalogo, ItemCatalogo, UmbralDisponibilidad } from './catalogo.types'
import * as hovStore from './hov.store'
import { resolverValor } from './valor-operacional.resolver'

interface DisponibilidadService {
  getUnidadesDisponibles(productoId: string): number
}

const disponibilidadOrder: Record<DisponibilidadCatalogo, number> = {
  DISPONIBLE: 0,
  ULTIMAS_UNIDADES: 1,
  NO_DISPONIBLE: 2,
}

export function construirCatalogo(
  contexto: ContextoCatalogo,
  umbral: UmbralDisponibilidad,
  disponibilidadService: DisponibilidadService
): CatalogoProyectado {
  const hovs = hovStore.getHOVsActivas(contexto.contextoOperacionalId)
  if (hovs.length === 0) {
    return {
      contexto,
      items: [],
      totalItems: 0,
      proyectadoEn: new Date().toISOString(),
    }
  }

  const items: ItemCatalogo[] = hovs.map(hov => {
    const resultado = resolverValor({
      hovId: hov.id,
      cantidad: 1,
      contextoOperacionalId: contexto.contextoOperacionalId,
      identidadOperacionalId: contexto.identidadOperacionalId,
      momento: contexto.momento,
      margenMinimoConfigurable: contexto.margenMinimoConfigurable,
      operadorTieneCapacidadLibre: contexto.operadorTieneCapacidadLibre,
    })

    const unidadesDisponibles = disponibilidadService.getUnidadesDisponibles(hov.productoId)
    let disponibilidad: DisponibilidadCatalogo

    if (unidadesDisponibles <= 0) {
      disponibilidad = 'NO_DISPONIBLE'
    } else if (unidadesDisponibles <= umbral.ultimasUnidades) {
      disponibilidad = 'ULTIMAS_UNIDADES'
    } else {
      disponibilidad = 'DISPONIBLE'
    }

    return {
      hovId: hov.id,
      nombre: hov.nombre,
      unidadDespacho: hov.unidadDespacho,
      factorConversion: hov.factorConversion,
      valorAplicado: resultado.valorAplicado,
      tipoValor: resultado.tipo,
      requiereAutorizacion: resultado.requiereAutorizacion,
      disponibilidad,
      unidadesDisponibles,
    }
  })

  return {
    contexto,
    items: items.sort((a, b) => disponibilidadOrder[a.disponibilidad] - disponibilidadOrder[b.disponibilidad]),
    totalItems: items.length,
    proyectadoEn: new Date().toISOString(),
  }
}

export function filtrarCatalogo(
  catalogo: CatalogoProyectado,
  termino: string
): ItemCatalogo[] {
  const normalized = termino.trim().toLowerCase()
  if (!normalized) return catalogo.items

  return catalogo.items.filter(item =>
    item.nombre.toLowerCase().includes(normalized) ||
    item.unidadDespacho.toLowerCase().includes(normalized)
  )
}
