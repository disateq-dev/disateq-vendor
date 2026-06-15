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

  // A1 — Boleta acercándose al umbral S/700 (preventiva)
  if (
    input.tipo === 'BOLETA' &&
    totalCalculado >= 600 &&
    totalCalculado <= 700 &&
    input.receptor.esGenerico === true
  ) {
    advertencias.push(
      'El total se acerca a S/ 700. Si supera ese monto se requerirá identificar al cliente.'
    )
  }

  switch (input.tipo) {
    case 'FACTURA':
      // B1 — Factura sin RUC
      if (input.receptor.tipoDocumento !== 'RUC') {
        errores.push(
          'La factura requiere el RUC del cliente. Sin este dato no se puede emitir.'
        )
      }

      // B4 — RUC con formato inválido
      if (
        input.receptor.tipoDocumento === 'RUC' &&
        input.receptor.numeroDocumento !== null &&
        !/^(10|20)\d{9}$/.test(input.receptor.numeroDocumento)
      ) {
        errores.push(
          'RUC inválido. Debe tener 11 dígitos y comenzar en 10 o 20.'
        )
      }

      if (input.receptor.numeroDocumento === null) {
        errores.push('El número de RUC es obligatorio.')
      }

      if (input.receptor.esGenerico === true) {
        errores.push('La factura no puede emitirse a receptor genérico.')
      }

      // A2 — DNI ingresado donde se espera RUC
      if (
        input.receptor.tipoDocumento === 'DNI' &&
        input.receptor.numeroDocumento !== null &&
        /^\d{8}$/.test(input.receptor.numeroDocumento)
      ) {
        advertencias.push(
          'Para factura se necesita RUC, no DNI. Verifica el tipo de documento.'
        )
      }
      break

    case 'BOLETA':
      // B2 — RUC ingresado en boleta: advierte pero no bloquea
      if (
        input.receptor.tipoDocumento === 'RUC' &&
        input.receptor.esGenerico === false
      ) {
        advertencias.push(
          'Este número parece un RUC. La boleta no da crédito fiscal ni sustenta gasto tributario.'
        )
      }

      // B3 — Boleta > S/700 sin receptor: BLOQUEO
      if (totalCalculado > 700 && input.receptor.esGenerico === true) {
        errores.push(
          'La boleta supera S/ 700. La norma exige identificar al cliente (DNI, CE o Pasaporte).'
        )
      }

      // B5 — DNI con formato inválido
      if (
        input.receptor.tipoDocumento === 'DNI' &&
        input.receptor.numeroDocumento !== null &&
        !/^\d{8}$/.test(input.receptor.numeroDocumento)
      ) {
        errores.push('El DNI debe tener exactamente 8 dígitos numéricos.')
      }

      // Receptor no genérico sin documento seleccionado
      if (
        input.receptor.esGenerico === false &&
        input.receptor.tipoDocumento === 'SIN_DOCUMENTO'
      ) {
        errores.push('Debe seleccionar un tipo de documento válido para el receptor.')
      }

      // Receptor no genérico sin número de documento
      if (
        input.receptor.esGenerico === false &&
        input.receptor.numeroDocumento === null &&
        input.receptor.tipoDocumento !== 'SIN_DOCUMENTO'
      ) {
        errores.push('El número de documento del receptor es obligatorio.')
      }
      break

    case 'NOTA_CREDITO':
    case 'NOTA_DEBITO':
      if (comprobanteReferenciadoId === null) {
        errores.push('Debe referenciar un comprobante de origen.')
      }

      if (comprobanteReferenciado == null) {
        errores.push('El comprobante referenciado no existe.')
      }

      if (comprobanteReferenciado != null) {
        if (
          comprobanteReferenciado.tipo !== 'FACTURA' &&
          comprobanteReferenciado.tipo !== 'BOLETA'
        ) {
          errores.push('Solo se puede referenciar una Factura o Boleta.')
        }

        if (comprobanteReferenciado.estado === 'ANULADO') {
          errores.push('No se puede referenciar un comprobante anulado.')
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
