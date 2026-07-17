import { invoke } from "@tauri-apps/api/core";

import type { BloqueOperacional } from "./blocks.store";

interface BloqueOperacionalSQLiteRow {
  id: string;
  base: number;
  auxiliares: number;
  activo: number;
  creado_en: string;
  creado_por: string;
  modificado_en: string;
}

function mapBloqueOperacional(row: BloqueOperacionalSQLiteRow): BloqueOperacional {
  return {
    id: row.id,
    base: row.base,
    auxiliares: row.auxiliares,
    activo: row.activo === 1,
    creadoEn: row.creado_en,
    creadoPor: row.creado_por,
    modificadoEn: row.modificado_en,
  };
}

export async function cargarBloquesOperacionales(): Promise<BloqueOperacional[]> {
  try {
    const bloques = await invoke<BloqueOperacionalSQLiteRow[]>("obtener_bloques_operacionales");
    return bloques.map(mapBloqueOperacional);
  } catch (e) {
    throw String(e);
  }
}

export async function crearBloqueEnSQLite(
  id: string,
  base: number,
  auxiliares: number,
  creadoPor: string,
): Promise<string> {
  try {
    const creadoEn = new Date().toISOString();

    return await invoke<string>("crear_bloque_operacional", {
      id,
      base,
      auxiliares,
      creado_por: creadoPor,
      creado_en: creadoEn,
    });
  } catch (e) {
    throw String(e);
  }
}

export async function actualizarAuxiliaresEnSQLite(id: string, auxiliares: number): Promise<void> {
  try {
    await invoke<void>("actualizar_auxiliares_bloque", { id, auxiliares });
  } catch (e) {
    throw String(e);
  }
}

export async function activarBloqueEnSQLite(id: string): Promise<void> {
  try {
    await invoke<void>("activar_bloque_operacional", { id });
  } catch (e) {
    throw String(e);
  }
}

export async function desactivarBloqueEnSQLite(id: string): Promise<void> {
  try {
    await invoke<void>("desactivar_bloque_operacional", { id });
  } catch (e) {
    throw String(e);
  }
}
