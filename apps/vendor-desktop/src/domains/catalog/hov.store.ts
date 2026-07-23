import type { HOV, HOVStore } from './hov.types'

function createEmptyStore(): HOVStore {
  return {
    hovs: [],
    ultimaSincronizacion: null,
  }
}

let store: HOVStore = createEmptyStore()

function resolverRecursoId(hov: HOV): string | undefined {
  return hov.productoId ?? hov.servicioId ?? hov.productoGeneralId
}

export function getHOVsActivas(contextoOperacionalId: string): HOV[] {
  return store.hovs.filter(hov =>
    hov.estado === 'ACTIVA' &&
    hov.contextoOperacionalId === contextoOperacionalId
  )
}

export function getHOVById(id: string): HOV | null {
  return store.hovs.find(hov => hov.id === id) ?? null
}

export function getHOVByCodigo(codigo: string): HOV | null {
  return store.hovs.find(hov => hov.codigo === codigo) ?? null
}

export function existeHOVActiva(recursoId: string | undefined, unidadDespacho: string): boolean {
  if (recursoId === undefined) return false

  return store.hovs.some(hov =>
    hov.estado === 'ACTIVA' &&
    resolverRecursoId(hov) === recursoId &&
    hov.unidadDespacho === unidadDespacho
  )
}

export function getAllHOVs(): HOV[] {
  return store.hovs
}

export function guardarHOV(hov: HOV): HOV {
  const idx = store.hovs.findIndex(item => item.id === hov.id)
  if (idx >= 0) {
    store = {
      ...store,
      hovs: store.hovs.map(item => item.id === hov.id ? hov : item),
      ultimaSincronizacion: new Date().toISOString(),
    }
  } else {
    store = {
      ...store,
      hovs: [...store.hovs, hov],
      ultimaSincronizacion: new Date().toISOString(),
    }
  }
  return hov
}

export function resetHovStore(): void {
  store = createEmptyStore()
}
