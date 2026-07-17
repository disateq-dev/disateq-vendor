import { useCallback, useEffect, useState } from "react";

import { definirCajasDeBloque, type BloqueOperacional, type TipoCaja } from "../../../domains/operator/blocks.store";
import {
  activarBloqueEnSQLite,
  actualizarAuxiliaresEnSQLite,
  cargarBloquesOperacionales,
  crearBloqueEnSQLite,
  desactivarBloqueEnSQLite,
} from "../../../domains/operator/bloque-operacional-sqlite.service";

export interface DefinicionSlot {
  codigo: string;
  tipoCaja: TipoCaja;
  hasHistorial: boolean;
}

interface UseBloquesResult {
  bloques: BloqueOperacional[];
  cargando: boolean;
  errorCarga: string | null;
  crearBloque: (base: number, auxiliares: number, creadoPor: string) => Promise<string>;
  editarAuxiliares: (id: string, auxiliares: number) => Promise<void>;
  activarBloque: (id: string) => Promise<void>;
  desactivarBloque: (id: string) => Promise<void>;
  derivarSlots: (bloque: BloqueOperacional, codigosConHistorial: Set<string>) => DefinicionSlot[];
}

function derivarSlots(bloque: BloqueOperacional, codigosConHistorial: Set<string>): DefinicionSlot[] {
  return definirCajasDeBloque([bloque.base]).map(definicionCaja => ({
    codigo: definicionCaja.codigo,
    tipoCaja: definicionCaja.tipoCaja,
    hasHistorial: codigosConHistorial.has(definicionCaja.codigo),
  }));
}

export default function useBloques(): UseBloquesResult {
  const [bloques, setBloques] = useState<BloqueOperacional[]>([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const recargarBloques = useCallback(async (): Promise<BloqueOperacional[]> => {
    const bloquesActualizados = await cargarBloquesOperacionales();
    setBloques(bloquesActualizados);
    return bloquesActualizados;
  }, []);

  useEffect(() => {
    let activo = true;

    async function cargar(): Promise<void> {
      try {
        const bloquesIniciales = await cargarBloquesOperacionales();
        if (activo) {
          setBloques(bloquesIniciales);
        }
      } catch (e) {
        if (activo) {
          setErrorCarga(String(e));
        }
      } finally {
        if (activo) {
          setCargando(false);
        }
      }
    }

    void cargar();

    return () => {
      activo = false;
    };
  }, []);

  const crearBloque = useCallback(async (
    base: number,
    auxiliares: number,
    creadoPor: string,
  ): Promise<string> => {
    try {
      const id = crypto.randomUUID();
      const idCreado = await crearBloqueEnSQLite(id, base, auxiliares, creadoPor);
      await recargarBloques();
      return idCreado;
    } catch (e) {
      throw String(e);
    }
  }, [recargarBloques]);

  const editarAuxiliares = useCallback(async (id: string, auxiliares: number): Promise<void> => {
    try {
      await actualizarAuxiliaresEnSQLite(id, auxiliares);
      await recargarBloques();
    } catch (e) {
      throw String(e);
    }
  }, [recargarBloques]);

  const activarBloque = useCallback(async (id: string): Promise<void> => {
    try {
      await activarBloqueEnSQLite(id);
      await recargarBloques();
    } catch (e) {
      throw String(e);
    }
  }, [recargarBloques]);

  const desactivarBloque = useCallback(async (id: string): Promise<void> => {
    try {
      await desactivarBloqueEnSQLite(id);
      await recargarBloques();
    } catch (e) {
      throw String(e);
    }
  }, [recargarBloques]);

  return {
    bloques,
    cargando,
    errorCarga,
    crearBloque,
    editarAuxiliares,
    activarBloque,
    desactivarBloque,
    derivarSlots,
  };
}
