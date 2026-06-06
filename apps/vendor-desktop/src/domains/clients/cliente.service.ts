import { clienteStore } from './cliente.store'
import type { Cliente, CrearClienteInput, TipoCliente } from './cliente.types'

const CLIENTE_TYPES: TipoCliente[] = ['OCASIONAL', 'FRECUENTE', 'CONVENIO']

function getClientes(): Cliente[] {
  return CLIENTE_TYPES.reduce<Cliente[]>((acc, tipo) => {
    return acc.concat(clienteStore.getClientesPorTipo(tipo))
  }, [])
}

function generarCodigo(): string {
  const maxCodigo = getClientes().reduce((max, cliente) => {
    const match = /^CLI-(\d+)$/.exec(cliente.codigo)
    if (!match) return max

    const value = Number.parseInt(match[1], 10)
    if (Number.isNaN(value)) return max

    return Math.max(max, value)
  }, 0)

  return `CLI-${String(maxCodigo + 1).padStart(4, '0')}`
}

export function crearCliente(input: CrearClienteInput): Cliente {
  if (!input.nombre.trim()) {
    throw new Error('El nombre del cliente es obligatorio')
  }

  if (
    input.tipo === 'CONVENIO' &&
    input.identificacionFiscal.tipoDocumento === 'SIN_DOCUMENTO'
  ) {
    throw new Error('Un cliente de convenio requiere documento de identidad')
  }

  if (
    input.identificacionFiscal.tipoDocumento === 'RUC' &&
    input.identificacionFiscal.numeroDocumento === null
  ) {
    throw new Error('El número de RUC es obligatorio')
  }

  if (
    input.canales.consentimiento === false &&
    input.canales.preferenciaEnvio !== 'NINGUNO'
  ) {
    throw new Error('Sin consentimiento la preferencia de envío debe ser NINGUNO')
  }

  const now = new Date().toISOString()
  const cliente: Cliente = {
    id: crypto.randomUUID(),
    codigo: generarCodigo(),
    nombre: input.nombre,
    tipo: input.tipo,
    estado: 'ACTIVO',
    identificacionFiscal: input.identificacionFiscal,
    canales: input.canales,
    condiciones: input.condiciones,
    fidelizacion: null,
    creadoEn: now,
    modificadoEn: now,
  }

  return clienteStore.guardarCliente(cliente)
}

export function suspenderCliente(id: string, motivo: string): Cliente {
  const cliente = clienteStore.getClienteById(id)
  if (!cliente) {
    throw new Error('Cliente no encontrado')
  }

  if (cliente.estado !== 'ACTIVO') {
    throw new Error('Solo se puede suspender un cliente activo')
  }

  if (!motivo.trim()) {
    throw new Error('El motivo de suspensión es obligatorio')
  }

  return clienteStore.guardarCliente({
    ...cliente,
    estado: 'SUSPENDIDO',
    modificadoEn: new Date().toISOString(),
  })
}

export function reactivarCliente(id: string): Cliente {
  const cliente = clienteStore.getClienteById(id)
  if (!cliente) {
    throw new Error('Cliente no encontrado')
  }

  if (cliente.estado !== 'SUSPENDIDO') {
    if (cliente.estado === 'INACTIVO') {
      throw new Error('Un cliente inactivo no puede reactivarse')
    }

    throw new Error('Solo se puede reactivar un cliente suspendido')
  }

  return clienteStore.guardarCliente({
    ...cliente,
    estado: 'ACTIVO',
    modificadoEn: new Date().toISOString(),
  })
}

export function inactivarCliente(id: string, motivo: string): Cliente {
  const cliente = clienteStore.getClienteById(id)
  if (!cliente) {
    throw new Error('Cliente no encontrado')
  }

  if (cliente.estado === 'INACTIVO') {
    throw new Error('El cliente ya está inactivo')
  }

  if (!motivo.trim()) {
    throw new Error('El motivo de inactivación es obligatorio')
  }

  return clienteStore.guardarCliente({
    ...cliente,
    estado: 'INACTIVO',
    modificadoEn: new Date().toISOString(),
  })
}

export function activarFidelizacion(id: string, programaId: string): Cliente {
  const cliente = clienteStore.getClienteById(id)
  if (!cliente) {
    throw new Error('Cliente no encontrado')
  }

  if (cliente.estado !== 'ACTIVO') {
    throw new Error('Solo se puede activar fidelización en un cliente activo')
  }

  if (cliente.fidelizacion?.estado === 'ACTIVO') {
    throw new Error('El cliente ya tiene un programa de fidelización activo')
  }

  if (!programaId.trim()) {
    throw new Error('El programa de fidelización es obligatorio')
  }

  return clienteStore.guardarCliente({
    ...cliente,
    fidelizacion: {
      programaId,
      puntosAcumulados: 0,
      nivelActual: null,
      fechaIngreso: new Date().toISOString(),
      estado: 'ACTIVO',
    },
    modificadoEn: new Date().toISOString(),
  })
}
