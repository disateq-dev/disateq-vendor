import { useEffect, useState } from "react";
import { obtenerResumenSalud, type ResumenSalud } from "../domains/logging/error-logger";

interface HealthDotProps {
  onNavigate: () => void;
}

export function HealthDot({ onNavigate }: HealthDotProps) {
  const [salud, setSalud] = useState<ResumenSalud | null>(null);

  useEffect(() => {
    let montado = true;

    async function cargar() {
      const resultado = await obtenerResumenSalud();
      if (montado) setSalud(resultado);
    }

    void cargar();
    const intervalo = setInterval(() => { void cargar(); }, 60_000);
    return () => { montado = false; clearInterval(intervalo); };
  }, []);

  // No renderizar nada si el sistema está OK o todavía cargando
  if (!salud || salud.estado === "OK") return null;

  const esCritico = salud.estado === "CRITICO";
  const color = esCritico ? "#EF4444" : "#F59E0B";
  const total = salud.criticosTotal + salud.erroresTotal + salud.advertenciasTotal;
  const titulo = esCritico
    ? `${salud.criticosTotal} error${salud.criticosTotal !== 1 ? "es" : ""} crítico${salud.criticosTotal !== 1 ? "s" : ""} · Ver diagnóstico`
    : `${total} alerta${total !== 1 ? "s" : ""} · Ver diagnóstico`;

  return (
    <button
      onClick={onNavigate}
      title={titulo}
      className="shrink-0 flex items-center justify-center rounded-full transition hover:opacity-80 active:scale-95"
      style={{ width: 28, height: 28 }}
    >
      <span
        className="block rounded-full animate-pulse"
        style={{ width: 8, height: 8, backgroundColor: color }}
      />
    </button>
  );
}
