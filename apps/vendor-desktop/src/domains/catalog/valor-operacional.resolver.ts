import type { ResultadoResolucion, TipoValorOperacional, ValorOperacional } from './valor-operacional.types'
import * as valorStore from './valor-operacional.store'
import * as hovStore from './hov.store'

interface ContextoResolucion {
  hovId: string
  cantidad: number
  contextoOperacionalId: string
  identidadOperacionalId: string
  momento: string
  margenMinimoConfigurable: number
  operadorTieneCapacidadLibre: boolean
}

export function resolverValor(contexto: ContextoResolucion): ResultadoResolucion {
  const hov = hovStore.getHOVById(contexto.hovId)
  if (hov === null) {
    return {
      valido: false,
      valorAplicado: null,
      tipo: null,
      requiereAutorizacion: false,
      error: 'HOV no encontrada',
    }
  }

  if (hov.estado !== 'ACTIVA') {
    return {
      valido: false,
      valorAplicado: null,
      tipo: null,
      requiereAutorizacion: false,
      error: 'HOV no disponible',
    }
  }

  const valores = valorStore.getValoresActivosPorHOV(contexto.hovId)
  const ahora = new Date(contexto.momento)

  function estaVigente(valor: ValorOperacional): boolean {
    if (valor.vigencia.hasta === null) return true
    return new Date(valor.vigencia.hasta) >= ahora
  }

  function aplicaAlContexto(valor: ValorOperacional): boolean {
    if (valor.condiciones.contextoOperacionalId === null) return true
    return valor.condiciones.contextoOperacionalId === contexto.contextoOperacionalId
  }

  function aplicaALaIdentidad(valor: ValorOperacional): boolean {
    if (valor.condiciones.identidadOperacionalId === null) return true
    return valor.condiciones.identidadOperacionalId === contexto.identidadOperacionalId
  }

  function validarFinal(valorFinal: number, tipo: TipoValorOperacional): ResultadoResolucion {
    const costoBase = hov.costoBase

    if (valorFinal <= 0) {
      return {
        valido: false,
        valorAplicado: null,
        tipo: null,
        requiereAutorizacion: false,
        error: 'El valor no puede ser cero o negativo',
      }
    }

    if (valorFinal < costoBase) {
      return {
        valido: false,
        valorAplicado: null,
        tipo: null,
        requiereAutorizacion: false,
        error: 'El valor no puede ser menor al costo base',
      }
    }

    const margenMinimo = costoBase * (1 + contexto.margenMinimoConfigurable)
    if (valorFinal < margenMinimo) {
      return {
        valido: true,
        valorAplicado: valorFinal,
        tipo,
        requiereAutorizacion: true,
      }
    }

    return {
      valido: true,
      valorAplicado: valorFinal,
      tipo,
      requiereAutorizacion: false,
    }
  }

  const oferta = valores.find(valor =>
    valor.tipo === 'OFERTA' &&
    estaVigente(valor) === true &&
    aplicaAlContexto(valor) === true
  )
  if (oferta) return validarFinal(oferta.valor, 'OFERTA')

  const preferencial = valores.find(valor =>
    valor.tipo === 'PREFERENCIAL' &&
    estaVigente(valor) === true &&
    aplicaAlContexto(valor) === true &&
    aplicaALaIdentidad(valor) === true
  )
  if (preferencial) return validarFinal(preferencial.valor, 'PREFERENCIAL')

  const mayorista = valores.find(valor =>
    valor.tipo === 'MAYORISTA' &&
    estaVigente(valor) === true &&
    aplicaAlContexto(valor) === true &&
    valor.condiciones.cantidadMinima !== null &&
    contexto.cantidad >= valor.condiciones.cantidadMinima
  )
  if (mayorista) return validarFinal(mayorista.valor, 'MAYORISTA')

  const normal = valores.find(valor =>
    valor.tipo === 'NORMAL' &&
    estaVigente(valor) === true &&
    aplicaAlContexto(valor) === true
  )
  if (normal) return validarFinal(normal.valor, 'NORMAL')

  if (contexto.operadorTieneCapacidadLibre === false) {
    return {
      valido: false,
      valorAplicado: null,
      tipo: null,
      requiereAutorizacion: false,
      error: 'Sin valor definido para esta HOV en este contexto',
    }
  }

  return {
    valido: false,
    valorAplicado: null,
    tipo: 'LIBRE',
    requiereAutorizacion: true,
    error: 'Sin valor definido · ingreso manual requerido',
  }
}
