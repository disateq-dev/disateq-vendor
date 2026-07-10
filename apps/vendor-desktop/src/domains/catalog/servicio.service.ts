import { invoke } from '@tauri-apps/api/core'
import type { ServicioCatalogo, CrearServicioCatalogoInput } from './servicio.types'

interface ServicioCatalogoRespuesta {
  id: string
  rubro: string
  tipo_servicio: string
  nombre: string
  descripcion?: string
  duracion_minutos?: number
  estado: string
  creado_en: string
}

function traducirServicioCatalogo(r: ServicioCatalogoRespuesta): ServicioCatalogo {
  return {
    id: r.id,
    rubro: r.rubro,
    tipoServicio: r.tipo_servicio,
    nombre: r.nombre,
    descripcion: r.descripcion,
    duracionMinutos: r.duracion_minutos,
    estado: r.estado as ServicioCatalogo['estado'],
    creadoEn: r.creado_en,
  }
}

export async function crearServicioCatalogo(
  input: CrearServicioCatalogoInput,
): Promise<string> {
  return invoke<string>('crear_servicio_catalogo', {
    rubro: input.rubro,
    tipoServicio: input.tipoServicio,
    nombre: input.nombre,
    descripcion: input.descripcion ?? null,
    duracionMinutos: input.duracionMinutos ?? null,
  })
}

export async function obtenerServiciosCatalogo(
  rubro?: string,
  soloActivos?: boolean,
): Promise<ServicioCatalogo[]> {
  const respuesta = await invoke<ServicioCatalogoRespuesta[]>(
    'obtener_servicios_catalogo',
    {
      rubro: rubro ?? null,
      soloActivos: soloActivos ?? null,
    },
  )
  return respuesta.map(traducirServicioCatalogo)
}

export async function desactivarServicioCatalogo(id: string): Promise<void> {
  await invoke('desactivar_servicio_catalogo', { id })
}

export async function obtenerMargenDefecto(): Promise<number> {
  return invoke<number>('obtener_margen_defecto')
}
