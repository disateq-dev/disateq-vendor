import { useState, useEffect, useCallback } from "react";
import { getActiveAuthorizationsForBlock, type CajaAuthorization } from "../modules/cash/services/supervision-authorization.service";

export function useAutorizacionesActivas(blockPrefix: string): CajaAuthorization[] {
  const [autorizaciones, setAutorizaciones] = useState<CajaAuthorization[]>([]);

  const recargar = useCallback(async () => {
    if (!blockPrefix) { setAutorizaciones([]); return; }
    try {
      const data = await getActiveAuthorizationsForBlock(blockPrefix);
      setAutorizaciones(data);
    } catch {
      setAutorizaciones([]);
    }
  }, [blockPrefix]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  useEffect(() => {
    const handler = () => { void recargar(); };
    window.addEventListener("disateq:autorizaciones-changed", handler);
    return () => window.removeEventListener("disateq:autorizaciones-changed", handler);
  }, [recargar]);

  return autorizaciones;
}
