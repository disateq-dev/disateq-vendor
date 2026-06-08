const LS_KEY = "disateq:config:pin-admin";

export type PinAdminMeta = {
  hash: string;
  configuradoEn: string;
  configuradoPor: string;
};

async function hashPin(pin: string): Promise<string> {
  const data = new TextEncoder().encode(pin + ":disateq-vendor");
  const buffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function cargarMeta(): PinAdminMeta | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<PinAdminMeta>;
    if (
      typeof p.hash === "string" &&
      typeof p.configuradoEn === "string" &&
      typeof p.configuradoPor === "string"
    ) return p as PinAdminMeta;
    return null;
  } catch { return null; }
}

function persistirMeta(meta: PinAdminMeta): void {
  try { localStorage.setItem(LS_KEY, JSON.stringify(meta)); } catch { }
}

export const pinAdminStore = {

  estaConfigurado(): boolean {
    return cargarMeta() !== null;
  },

  async verificar(pin: string): Promise<boolean> {
    const meta = cargarMeta();
    if (!meta) return false;
    const hash = await hashPin(pin);
    return hash === meta.hash;
  },

  async configurar(pin: string, operadorCodigo: string): Promise<void> {
    const hash = await hashPin(pin);
    persistirMeta({
      hash,
      configuradoEn: new Date().toISOString(),
      configuradoPor: operadorCodigo,
    });
  },

  obtenerMeta(): PinAdminMeta | null {
    return cargarMeta();
  },
};
