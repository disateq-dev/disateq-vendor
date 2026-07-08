import { invoke } from '@tauri-apps/api/core'

export interface SugerenciaCatalogoMaestro {
  codProd: number
  nombre: string | null
  concentracionRaw: string | null
  presentacion: string | null
  numRegsan: string | null
  laboratorio: string | null
  forma: string | null
}

export interface DetalleCatalogoMaestro extends SugerenciaCatalogoMaestro {
  situacion: string | null
  clasificacionComercial: string | null
  titular: string | null
  principiosActivos: {
    nombreDci: string
    concentracion: string | null
  }[]
}

export async function buscarEnCatalogoMaestro(termino: string): Promise<SugerenciaCatalogoMaestro[]> {
  return invoke<SugerenciaCatalogoMaestro[]>('buscar_en_catalogo_maestro', { termino })
}

export async function obtenerDetalleCatalogoMaestro(codProd: number): Promise<DetalleCatalogoMaestro | null> {
  return invoke<DetalleCatalogoMaestro | null>('obtener_detalle_catalogo_maestro', { codProd })
}
