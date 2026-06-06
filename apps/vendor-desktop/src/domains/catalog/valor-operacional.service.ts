import type { CrearValorOperacionalInput, ValorOperacional } from './valor-operacional.types'
import * as valorStore from './valor-operacional.store'
import * as hovStore from './hov.store'

function isValidDate(value: string): boolean {
  const date = new Date(value)
  return !Number.isNaN(date.getTime())
}

export function crearValor(input: CrearValorOperacionalInput): ValorOperacional {
  if (input.valor <= 0) {
    throw new Error('El valor debe ser mayor a cero')
  }

  const hov = hovStore.getHOVById(input.hovId)
  if (!hov) {
    throw new Error('HOV no encontrada')
  }

  if (hov.estado !== 'ACTIVA') {
    throw new Error('No se puede asignar valor a una HOV inactiva')
  }

  if (!isValidDate(input.vigencia.desde)) {
    throw new Error('La fecha de inicio de vigencia no es válida')
  }

  if (
    input.vigencia.hasta !== null &&
    (
      !isValidDate(input.vigencia.hasta) ||
      new Date(input.vigencia.hasta) <= new Date(input.vigencia.desde)
    )
  ) {
    throw new Error('La fecha de fin de vigencia debe ser posterior a la fecha de inicio')
  }

  if (
    input.tipo === 'MAYORISTA' &&
    (
      !Number.isInteger(input.condiciones.cantidadMinima) ||
      input.condiciones.cantidadMinima === null ||
      input.condiciones.cantidadMinima <= 0
    )
  ) {
    throw new Error('El tipo MAYORISTA requiere una cantidad mínima mayor a cero')
  }

  const now = new Date().toISOString()
  const valor: ValorOperacional = {
    id: crypto.randomUUID(),
    hovId: input.hovId,
    tipo: input.tipo,
    valor: input.valor,
    moneda: input.moneda,
    condiciones: input.condiciones,
    vigencia: input.vigencia,
    estado: 'ACTIVO',
    creadoEn: now,
    modificadoEn: now,
  }

  return valorStore.guardarValor(valor)
}

export function suspenderValor(id: string): ValorOperacional {
  const valor = valorStore.getValorById(id)
  if (!valor) {
    throw new Error('Valor operacional no encontrado')
  }

  if (valor.estado !== 'ACTIVO') {
    throw new Error('Solo se puede suspender un valor activo')
  }

  return valorStore.actualizarEstado(id, 'SUSPENDIDO') as ValorOperacional
}

export function verificarVigencias(): void {
  const valores = valorStore.getValoresActivos()

  valores.forEach(valor => {
    if (
      valor.vigencia.hasta !== null &&
      new Date(valor.vigencia.hasta) < new Date()
    ) {
      valorStore.actualizarEstado(valor.id, 'VENCIDO')
    }
  })
}

verificarVigencias()
