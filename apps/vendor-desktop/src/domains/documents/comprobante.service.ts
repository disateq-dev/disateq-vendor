import { comprobanteStore } from './comprobante.store'
import {
  type Comprobante,
  type CrearComprobanteInput,
  type LineaComprobante,
  type ReceptorComprobante,
  type TipoComprobante,
} from './comprobante.types'
import { validarComprobante } from './comprobante.validator'

type ClasificacionComprobante = {
  esFormal: boolean
  requiereEnvioSUNAT: boolean
  leyendaNoFormal: string | null
}

type CrearComprobanteInputConReferencia = CrearComprobanteInput & {
  comprobanteReferenciadoId?: string | null
}

function clasificarTipo(tipo: TipoComprobante): ClasificacionComprobante {
  switch (tipo) {
    case 'FACTURA':
    case 'BOLETA':
    case 'NOTA_CREDITO':
    case 'NOTA_DEBITO':
      return {
        esFormal: true,
        requiereEnvioSUNAT: true,
        leyendaNoFormal: null,
      }

    case 'TIQUE_VENTA':
      return {
        esFormal: false,
        requiereEnvioSUNAT: false,
        leyendaNoFormal: 'ESTE DOCUMENTO NO ES UN COMPROBANTE DE PAGO CON VALOR TRIBUTARIO',
      }

    case 'COTIZACION':
      return {
        esFormal: false,
        requiereEnvioSUNAT: false,
        leyendaNoFormal: null,
      }
  }
}

function generarCodigoUnico(serie: string, correlativo: number): string {
  return `${serie}-${String(correlativo).padStart(8, '0')}`
}

function calcularSubtotal(lineas: LineaComprobante[]): number {
  return lineas.reduce((total, linea) => {
    return total + (linea.valorUnitario * linea.cantidad)
  }, 0)
}

function calcularIGV(lineas: LineaComprobante[]): number {
  return lineas.reduce((total, linea) => {
    if (linea.tipoAfectacionIGV !== 'GRAVADO') {
      return total
    }

    return total + ((linea.valorUnitario * linea.cantidad) * linea.tasaIGV)
  }, 0)
}

function calcularISC(lineas: LineaComprobante[]): number {
  return lineas.reduce((total, linea) => total + (linea.montoISC ?? 0), 0)
}

export function crearComprobante(
  input: CrearComprobanteInput,
  totalCalculado: number,
  serie: string,
  comprobanteReferenciado?: Comprobante | null
): Comprobante {
  const resultado = validarComprobante(input, totalCalculado, comprobanteReferenciado)
  if (resultado.valido === false) {
    throw new Error(resultado.errores[0])
  }

  const correlativo = comprobanteStore.getUltimoCorrelativoPorSerie(serie) + 1
  const clasificacion = clasificarTipo(input.tipo)
  const inputConReferencia = input as CrearComprobanteInputConReferencia
  const subtotal = calcularSubtotal(input.lineas)
  const igv = calcularIGV(input.lineas)
  const isc = calcularISC(input.lineas)
  const total = subtotal + igv + isc

  const comprobante: Comprobante = {
    id: crypto.randomUUID(),
    tipo: input.tipo,
    serie,
    correlativo,
    codigoUnico: generarCodigoUnico(serie, correlativo),
    esFormal: clasificacion.esFormal,
    requiereEnvioSUNAT: clasificacion.requiereEnvioSUNAT,
    leyendaNoFormal: clasificacion.leyendaNoFormal,
    pedidoId: input.pedidoId,
    comprobanteReferenciadoId: inputConReferencia.comprobanteReferenciadoId ?? null,
    comprobanteOrigenId: null,
    emisor: input.emisor,
    receptor: input.receptor,
    lineas: input.lineas,
    subtotal,
    igv,
    isc,
    total,
    moneda: input.moneda,
    metodoPago: input.metodoPago,
    tributario: input.tributario,
    estado: 'EMITIDO',
    estadoSUNAT: clasificacion.requiereEnvioSUNAT ? 'PENDIENTE' : 'NO_APLICA',
    cdr: null,
    fechaEnvioSUNAT: null,
    motivoAnulacion: null,
    emitidoEn: new Date().toISOString(),
    emitidoPor: input.emitidoPor,
    enviadoPorCanal: 'NINGUNO',
  }

  return comprobanteStore.guardarComprobante(comprobante)
}

export function anularComprobante(id: string, motivo: string): Comprobante {
  const comprobante = comprobanteStore.getComprobanteById(id)
  if (!comprobante) {
    throw new Error('Comprobante no encontrado')
  }

  if (comprobante.estado === 'ANULADO') {
    throw new Error('El comprobante ya está anulado')
  }

  if (comprobante.esFormal === true && comprobante.estadoSUNAT === 'ACEPTADO') {
    throw new Error('Un comprobante aceptado por SUNAT solo puede anularse mediante Nota de Crédito')
  }

  if (!motivo.trim()) {
    throw new Error('El motivo de anulación es obligatorio')
  }

  return comprobanteStore.guardarComprobante({
    ...comprobante,
    estado: 'ANULADO',
    motivoAnulacion: motivo,
  })
}

export function convertirAFormal(
  id: string,
  tipo: 'FACTURA' | 'BOLETA',
  serie: string,
  receptor: ReceptorComprobante,
  emitidoPor: string
): Comprobante {
  const origen = comprobanteStore.getComprobanteById(id)
  if (!origen) {
    throw new Error('Comprobante no encontrado')
  }

  if (origen.tipo !== 'TIQUE_VENTA' && origen.tipo !== 'COTIZACION') {
    throw new Error('Solo se puede convertir un Tique de Venta o Cotización')
  }

  if (origen.estado === 'ANULADO') {
    throw new Error('No se puede convertir un comprobante anulado')
  }

  if (origen.estado === 'REFERENCIADO') {
    throw new Error('Este comprobante ya fue convertido')
  }

  const correlativo = comprobanteStore.getUltimoCorrelativoPorSerie(serie) + 1
  const clasificacion = clasificarTipo(tipo)
  const now = new Date().toISOString()

  const comprobanteFormal: Comprobante = {
    id: crypto.randomUUID(),
    tipo,
    serie,
    correlativo,
    codigoUnico: generarCodigoUnico(serie, correlativo),
    esFormal: clasificacion.esFormal,
    requiereEnvioSUNAT: clasificacion.requiereEnvioSUNAT,
    leyendaNoFormal: clasificacion.leyendaNoFormal,
    pedidoId: origen.pedidoId,
    comprobanteReferenciadoId: null,
    comprobanteOrigenId: origen.id,
    emisor: origen.emisor,
    receptor,
    lineas: origen.lineas,
    subtotal: origen.subtotal,
    igv: origen.igv,
    isc: origen.isc,
    total: origen.total,
    moneda: origen.moneda,
    metodoPago: origen.metodoPago,
    tributario: origen.tributario,
    estado: 'EMITIDO',
    estadoSUNAT: 'PENDIENTE',
    cdr: null,
    fechaEnvioSUNAT: null,
    motivoAnulacion: null,
    emitidoEn: now,
    emitidoPor,
    enviadoPorCanal: 'NINGUNO',
  }

  comprobanteStore.guardarComprobante(comprobanteFormal)
  comprobanteStore.guardarComprobante({
    ...origen,
    estado: 'REFERENCIADO',
  })

  return comprobanteFormal
}
