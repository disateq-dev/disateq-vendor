import { useEffect, useRef, useState } from "react";
import type { ReactElement } from "react";
import { X } from "lucide-react";
import type { GrupoProducto, FormaVenta } from "../../domains/catalog/bridge-catalogo";
import type { TipoValorOperacional } from "../../domains/catalog/valor-operacional.types";

interface PresentacionSheetProps {
  grupo: GrupoProducto;
  onConfirmar: (hovId: string, valorFinal: number, tipoValor: TipoValorOperacional | null) => void;
  onCancelar: () => void;
  puedeEditarPrecio: boolean;
}

function stockChipClass(stockStatus: string): string {
  if (stockStatus === "low") return "bg-amber-50 text-amber-600";
  if (stockStatus === "out") return "bg-red-50 text-red-500";
  return "bg-emerald-50 text-emerald-600";
}

function tipoValorClass(tipoValor: TipoValorOperacional | null): string {
  if (tipoValor === "NORMAL") return "bg-[#f1f5f9] text-[#64748b]";
  if (tipoValor === "OFERTA") return "bg-[#dcfce7] text-[#16a34a]";
  if (tipoValor === "MAYORISTA") return "bg-[#dbeafe] text-[#1d4ed8]";
  if (tipoValor === "PREFERENCIAL") return "bg-[#f3e8ff] text-[#7c3aed]";
  if (tipoValor === "LIBRE") return "bg-[#fef3c7] text-[#d97706]";
  return "bg-[#fef2f2] text-[#dc2626]";
}

function stockLabel(stockStatus: string): string {
  if (stockStatus === "low") return "Queda poco";
  if (stockStatus === "out") return "Sin unidades";
  return "Disponible";
}

export function PresentacionSheet({
  grupo,
  onConfirmar,
  onCancelar,
  puedeEditarPrecio,
}: PresentacionSheetProps): ReactElement {
  const [formaActiva, setFormaActiva] = useState<FormaVenta | null>(null);
  const [precioManual, setPrecioManual] = useState<string>("");
  const firstButtonRef = useRef<HTMLButtonElement>(null);

  const precioManualNumero = Number(precioManual);
  const precioManualValido = Number.isFinite(precioManualNumero) && precioManualNumero > 0;
  const puedeAgregar = formaActiva !== null && (
    formaActiva.valorAplicado !== null || precioManualValido
  );

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancelar();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancelar]);

  useEffect(() => {
    const t = setTimeout(() => firstButtonRef.current?.focus(), 20);
    return () => clearTimeout(t);
  }, []);

  function confirmarForma(formaVenta: FormaVenta): void {
    if (formaVenta.valorAplicado !== null) {
      onConfirmar(formaVenta.hovId, formaVenta.valorAplicado, formaVenta.tipoValor);
      return;
    }
    if (puedeEditarPrecio === false) return;
    setFormaActiva(formaVenta);
    setPrecioManual("");
  }

  function confirmarActiva(): void {
    if (formaActiva === null) return;
    if (formaActiva.valorAplicado !== null) {
      onConfirmar(formaActiva.hovId, formaActiva.valorAplicado, formaActiva.tipoValor);
      return;
    }
    if (precioManualValido) {
      onConfirmar(formaActiva.hovId, precioManualNumero, "LIBRE");
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 backdrop-blur-[2px]"
      onClick={event => { if (event.target === event.currentTarget) onCancelar(); }}
    >
      <div className="w-full max-w-md rounded-t-[28px] bg-white">
        <header className="flex items-center gap-3 border-b border-[#f1f5f9] px-5 py-4">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-bold text-[#111827]">{grupo.nombre}</p>
          </div>
          <span className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${stockChipClass(grupo.stockStatus)}`}>
            {stockLabel(grupo.stockStatus)}
          </span>
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-xl p-2 text-[#9ca3af] transition hover:bg-[#f4f7fb] hover:text-[#374151]"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </header>

        <div className="flex flex-col gap-3 px-4 py-4">
          <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-[#c0cad4]">
            FORMA DE VENTA
          </p>
          <div className="grid grid-cols-2 gap-2">
            {grupo.formasVenta.map((formaVenta, index) => (
              <button
                key={formaVenta.hovId}
                ref={index === 0 ? firstButtonRef : null}
                type="button"
                onClick={() => confirmarForma(formaVenta)}
                className="rounded-2xl border border-[#e4e9f0] px-3 py-3 text-left transition hover:border-[#45b356]/40 hover:bg-[#F0FAF1] active:scale-[0.98]"
              >
                <p className="truncate text-[13px] font-bold uppercase text-[#1f2937]">
                  {formaVenta.nombre}
                </p>
                <p className={`mt-1 text-[15px] font-bold tabular-nums ${formaVenta.valorAplicado === null ? "text-[#9ca3af]" : "text-[#2d4f6b]"}`}>
                  {formaVenta.valorAplicado === null ? "S/ ---" : `S/ ${formaVenta.valorAplicado.toFixed(2)}`}
                </p>
                <span className={`mt-2 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${tipoValorClass(formaVenta.tipoValor)}`}>
                  {formaVenta.tipoValor ?? "SIN PRECIO"}
                </span>
              </button>
            ))}
          </div>

          {puedeEditarPrecio && formaActiva?.valorAplicado === null ? (
            <div className="flex flex-col gap-1">
              <label className="px-1 text-[10px] font-bold uppercase tracking-widest text-[#c0cad4]">
                PRECIO
              </label>
              <input
                type="number"
                value={precioManual}
                onChange={event => setPrecioManual(event.target.value)}
                onKeyDown={event => {
                  if (event.key === "Enter" && precioManualValido) {
                    event.preventDefault();
                    onConfirmar(formaActiva.hovId, precioManualNumero, "LIBRE");
                  }
                }}
                className="w-full rounded-xl border border-[#e4e9f0] px-3.5 py-2 text-[13px] text-[#111827] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
              />
            </div>
          ) : null}
        </div>

        <footer className="grid grid-cols-2 gap-2 border-t border-[#f0f4f8] px-4 py-3">
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-xl border border-[#e4e9f0] py-3 text-[11px] font-bold uppercase tracking-wide text-[#374151] transition hover:bg-[#f8fafd] active:scale-[0.97]"
          >
            CANCELAR
          </button>
          <button
            type="button"
            onClick={confirmarActiva}
            disabled={!puedeAgregar}
            className="rounded-xl bg-[#45b356] py-3 text-[11px] font-bold uppercase tracking-wide text-white transition hover:bg-[#3d9e41] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-35"
          >
            AGREGAR →
          </button>
        </footer>
      </div>
    </div>
  );
}
