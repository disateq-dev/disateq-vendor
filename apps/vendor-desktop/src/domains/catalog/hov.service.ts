import type { CrearHOVInput, HOV } from './hov.types'
import * as hovStore from './hov.store'

export function generarCodigo(): string {
  let next = 1

  while (hovStore.getHOVByCodigo(`HOV-${String(next).padStart(4, '0')}`)) {
    next += 1
  }

  return `HOV-${String(next).padStart(4, '0')}`
}

export function crearHOV(input: CrearHOVInput): HOV {
  if (!Number.isInteger(input.factorConversion) || input.factorConversion < 1) {
    throw new Error('El factor de conversión debe ser un entero mayor a cero')
  }

  if (input.costoBase <= 0) {
    throw new Error('El costo base debe ser mayor a cero')
  }

  if (hovStore.existeHOVActiva(input.productoId, input.unidadDespacho)) {
    throw new Error('Ya existe una HOV activa para este producto y unidad de despacho')
  }

  const now = new Date().toISOString()
  const hov: HOV = {
    id: crypto.randomUUID(),
    codigo: generarCodigo(),
    nombre: input.nombre,
    productoId: input.productoId,
    unidadDespacho: input.unidadDespacho,
    factorConversion: input.factorConversion,
    costoBase: input.costoBase,
    costoBaseActualizadoEn: now,
    estado: 'ACTIVA',
    contextoOperacionalId: input.contextoOperacionalId,
    category: input.category,
    ubicacionFisica: input.ubicacionFisica,
    tipoRecurso: input.tipoRecurso ?? 'MEDICAMENTO',
    codigoBarras: input.codigoBarras,
    nodoFraccionamientoId: input.nodoFraccionamientoId,
    creadoEn: now,
    modificadoEn: now,
  }

  return hovStore.guardarHOV(hov)
}

export function suspenderHOV(id: string, motivo: string): HOV {
  void motivo

  const hov = hovStore.getHOVById(id)
  if (!hov) {
    throw new Error('HOV no encontrada')
  }

  if (hov.estado !== 'ACTIVA') {
    throw new Error('Solo se puede suspender una HOV activa')
  }

  const updated: HOV = {
    ...hov,
    estado: 'SUSPENDIDA',
    modificadoEn: new Date().toISOString(),
  }

  return hovStore.guardarHOV(updated)
}

export function retirarHOV(id: string, motivo: string): HOV {
  void motivo

  const hov = hovStore.getHOVById(id)
  if (!hov) {
    throw new Error('HOV no encontrada')
  }

  if (hov.estado === 'RETIRADA') {
    throw new Error('La HOV ya está retirada')
  }

  const updated: HOV = {
    ...hov,
    estado: 'RETIRADA',
    modificadoEn: new Date().toISOString(),
  }

  return hovStore.guardarHOV(updated)
}

export function modificarUbicacionFisica(id: string, ubicacionFisica: string | undefined): HOV {
  const hov = hovStore.getHOVById(id)
  if (!hov) {
    throw new Error('HOV no encontrada')
  }

  const updated: HOV = {
    ...hov,
    ubicacionFisica,
    modificadoEn: new Date().toISOString(),
  }

  return hovStore.guardarHOV(updated)
}

export function obtenerUbicacionesFisicasSugeridas(): string[] {
  const conteoUbicaciones = new Map<string, number>()

  hovStore.getAllHOVs().forEach((hov) => {
    const ubicacion = hov.ubicacionFisica?.trim()
    if (!ubicacion) return

    conteoUbicaciones.set(ubicacion, (conteoUbicaciones.get(ubicacion) ?? 0) + 1)
  })

  return Array.from(conteoUbicaciones.entries())
    .sort(([ubicacionA, cantidadA], [ubicacionB, cantidadB]) => {
      if (cantidadA !== cantidadB) return cantidadB - cantidadA
      return ubicacionA.localeCompare(ubicacionB)
    })
    .map(([ubicacion]) => ubicacion)
}

export function obtenerHOVsDeNodos(nodoFraccionamientoIds: string[]): HOV[] {
  return hovStore
    .getAllHOVs()
    .filter((hov) => hov.nodoFraccionamientoId !== undefined && nodoFraccionamientoIds.includes(hov.nodoFraccionamientoId))
}

export function actualizarCostoBase(hovId: string, nuevoCosto: number): HOV {
  const hov = hovStore.getHOVById(hovId)
  if (!hov) {
    throw new Error('HOV no encontrada')
  }

  if (nuevoCosto <= 0) {
    throw new Error('El costo base debe ser mayor a cero')
  }

  const now = new Date().toISOString()
  const updated: HOV = {
    ...hov,
    costoBase: nuevoCosto,
    costoBaseActualizadoEn: now,
    modificadoEn: now,
  }

  return hovStore.guardarHOV(updated)
}

export function reactivarHOV(id: string): HOV {
  const hov = hovStore.getHOVById(id)
  if (!hov) {
    throw new Error('HOV no encontrada')
  }

  if (hov.estado !== 'RETIRADA') {
    throw new Error('Solo se puede reactivar una HOV retirada')
  }

  const updated: HOV = {
    ...hov,
    estado: 'ACTIVA',
    modificadoEn: new Date().toISOString(),
  }

  return hovStore.guardarHOV(updated)
}
