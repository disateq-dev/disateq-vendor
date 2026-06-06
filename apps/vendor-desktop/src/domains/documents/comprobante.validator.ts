import type { Comprobante, CrearComprobanteInput } from './comprobante.types'

export interface ValidationResult {
  valido: boolean
  errores: string[]
  advertencias: string[]
}

type CrearComprobanteInputConReferencia = CrearComprobanteInput & {
  comprobanteReferenciadoId?: string | null
}

export function validarComprobante(
  input: CrearComprobanteInput,
  totalCalculado: number,
  comprobanteReferenciado?: Comprobante | null
): ValidationResult {
  const errores: string[] = []
  const advertencias: string[] = []
  const inputConReferencia = input as CrearComprobanteInputConReferencia
  const comprobanteReferenciadoId = inputConReferencia.comprobanteReferenciadoId ?? null

  switch (input.tipo) {
    case 'FACTURA':
      if (input.receptor.tipoDocumento !== 'RUC') {
        errores.push('La factura requiere número de RUC')
      }

      if (input.receptor.numeroDocumento === null) {
        errores.push('El número de RUC es obligatorio')
      }

      if (input.receptor.esGenerico === true) {
        errores.push('La factura no puede emitirse a receptor genérico')
      }
      break

    case 'BOLETA':
      if (totalCalculado > 700 && input.receptor.esGenerico === true) {
        advertencias.push(
          'El monto supera S/ 700 · se recomienda consignar datos del receptor'
        )
      }

      if (input.receptor.esGenerico === false) {
        if (input.receptor.numeroDocumento === null) {
          errores.push('El número de documento del receptor es obligatorio')
        }

        if (input.receptor.tipoDocumento === 'SIN_DOCUMENTO') {
          errores.push('Debe seleccionar un tipo de documento válido para el receptor')
        }
      }
      break

    case 'NOTA_CREDITO':
    case 'NOTA_DEBITO':
      if (comprobanteReferenciadoId === null) {
        errores.push('Debe referenciar un comprobante de origen')
      }

      if (comprobanteReferenciado == null) {
        errores.push('El comprobante referenciado no existe')
      }

      if (comprobanteReferenciado != null) {
        if (
          comprobanteReferenciado.tipo !== 'FACTURA' &&
          comprobanteReferenciado.tipo !== 'BOLETA'
        ) {
          errores.push('Solo se puede referenciar una Factura o Boleta')
        }

        if (comprobanteReferenciado.estado === 'ANULADO') {
          errores.push('No se puede referenciar un comprobante anulado')
        }
      }
      break

    case 'TIQUE_VENTA':
    case 'COTIZACION':
      break
  }

  return {
    valido: errores.length === 0,
    errores,
    advertencias,
  }
}
