import { invoke } from "@tauri-apps/api/core";

export type PinAutorizacionMeta = {
  hash: string;
  configuradoEn: string | null;
  configuradoPor: string | null;
};

async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin + ":disateq-vendor");
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

export const pinAutorizacionStore = {

  async estaConfigurado(): Promise<boolean> {
    try {
      const meta = await invoke<PinAutorizacionMeta | null>("obtener_pin_autorizacion_meta");
      return meta !== null && !!meta.hash;
    } catch {
      return false;
    }
  },

  async verificar(pin: string): Promise<boolean> {
    try {
      const hash = await hashPin(pin);
      return await invoke<boolean>("verificar_pin_autorizacion", { hash });
    } catch {
      return false;
    }
  },

  async configurar(pin: string, operadorCodigo: string): Promise<void> {
    const hash = await hashPin(pin);
    await invoke<void>("configurar_pin_autorizacion", { hash, configuradoPor: operadorCodigo });
  },

  async obtenerMeta(): Promise<PinAutorizacionMeta | null> {
    try {
      return await invoke<PinAutorizacionMeta | null>("obtener_pin_autorizacion_meta");
    } catch {
      return null;
    }
  },
};
