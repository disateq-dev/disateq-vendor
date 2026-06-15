import { loadBusinessConfig } from '../../config/business'
import { crearComprobante } from './comprobante.service'
import type {
  Comprobante,
  CrearComprobanteInput,
  EmisorComprobante,
  LineaComprobante,
  MetodoPago,
  ReceptorComprobante,
  TipoAfectacionIGV,
  TipoComprobante,
} from './comprobante.types'

interface EmitirComprobanteInput {
  tipo: TipoComprobante
  serie: string
  lineas: Array<{
    description: string
    quantity: number
    unitPrice: number
    subtotal: number
    note: string | null
  }>
  subtotal: number
  igv: number
  isc: number
  total: number
  tipoAfectacionIGV: TipoAfectacionIGV
  metodoPago: MetodoPago
  mixtoBreakdown?: {
    efe: number
    yap: number
    tar: number
  }
  customer: {
    docNumber: string
    name: string
    clienteId?: string | null
    email?: string | null
    whatsapp?: string | null
    consentimientoContacto?: boolean
  } | null
  emitidoPor: string
  pedidoId: string | null
}

type CrearComprobanteInputConReferencia = CrearComprobanteInput & {
  comprobanteReferenciadoId: string | null
}

export function emitirComprobante(input: EmitirComprobanteInput): Comprobante {
  try {
    const biz = loadBusinessConfig()
    const emisor: EmisorComprobante = {
      ruc: biz.ruc,
      razonSocial: biz.razonSocial,
      direccion: biz.direccion,
    }

    const receptor: ReceptorComprobante = input.customer === null
      ? {
          tipoDocumento: 'SIN_DOCUMENTO',
          numeroDocumento: null,
          nombre: 'Clientes Varios',
          direccion: null,
          esGenerico: true,
          fuente: 'SIN_RECEPTOR',
          clienteId: null,
          validadoSunat: false,
          email: null,
          whatsapp: null,
          consentimientoContacto: false,
        }
      : {
          tipoDocumento: input.customer.docNumber?.length === 11
            ? 'RUC'
            : input.customer.docNumber?.length === 8
            ? 'DNI'
            : 'SIN_DOCUMENTO',
          numeroDocumento: input.customer.docNumber || null,
          nombre: input.customer.name,
          direccion: null,
          esGenerico: false,
          fuente: 'INGRESO_MANUAL',
          clienteId: input.customer.clienteId ?? null,
          validadoSunat: false,
          email: input.customer.email ?? null,
          whatsapp: input.customer.whatsapp ?? null,
          consentimientoContacto: input.customer.consentimientoContacto ?? false,
        }

    const lineas: LineaComprobante[] = input.lineas.map(linea => ({
      id: crypto.randomUUID(),
      descripcion: linea.description,
      cantidad: linea.quantity,
      valorUnitario: linea.unitPrice,
      subtotal: linea.subtotal,
      codigoProductoSUNAT: null,
      tipoAfectacionIGV: input.tipoAfectacionIGV,
      tasaIGV: input.tipoAfectacionIGV === 'GRAVADO' ? 0.18 : 0,
      montoISC: null,
      notaLinea: linea.note,
    }))

    const comprobanteInput: CrearComprobanteInputConReferencia = {
      tipo: input.tipo,
      pedidoId: input.pedidoId,
      emisor,
      receptor,
      lineas,
      moneda: 'PEN',
      metodoPago: input.metodoPago,
      tributario: {
        regimen: 'GENERAL',
        incluyeDetraccion: false,
        porcentajeDetraccion: null,
      },
      emitidoPor: input.emitidoPor,
      comprobanteReferenciadoId: null,
    }

    return crearComprobante(
      comprobanteInput,
      input.total,
      input.serie
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Error al emitir comprobante: ${message}`)
  }
}

const TIPO_A_DOC_TYPE: Record<string, string> = {
  TIQUE_VENTA:  'nota',
  BOLETA:       'boleta',
  FACTURA:      'factura',
  COTIZACION:   'cotizacion',
  NOTA_CREDITO: 'nota_credito',
  NOTA_DEBITO:  'nota_debito',
}

export function construirReceiptData(
  comprobante: Comprobante,
  dateTime: string,
  baseImponible: number,
  discountNum: number,
  netTotal: number,
  receivedNum: number,
  change: number,
  mixtoBreakdown?: { efe: number; yap: number; tar: number }
): object {
  const biz = loadBusinessConfig()

  return {
    businessName: comprobante.emisor.razonSocial,
    businessRuc: comprobante.emisor.ruc,
    businessAddr: comprobante.emisor.direccion,
    businessPhone: biz.telefono || null,
    docType: TIPO_A_DOC_TYPE[comprobante.tipo] ?? comprobante.tipo.toLowerCase(),
    docSeries: comprobante.serie,
    docCorrelative: comprobante.correlativo,
    dateTime,
    customer: comprobante.receptor.esGenerico
      ? null
      : {
          docNumber: comprobante.receptor.numeroDocumento,
          name: comprobante.receptor.nombre,
        },
    lines: comprobante.lineas.map(l => ({
      description: l.descripcion,
      quantity: l.cantidad,
      unitPrice: l.valorUnitario,
      subtotal: l.subtotal,
      note: l.notaLinea,
    })),
    baseImponible,
    igv: comprobante.igv,
    discountNum,
    total: comprobante.total,
    netTotal,
    payMethod: comprobante.metodoPago,
    receivedNum,
    change,
    mixtoBreakdown: mixtoBreakdown ?? undefined,
  }
}
