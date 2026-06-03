import { useEffect, useRef } from "react";
import { X, ChevronRight } from "lucide-react";
import type { CatalogProduct, Presentacion } from "../../data/catalogs";

interface Props {
  product:      CatalogProduct;
  selectedPres: Presentacion | null;
  onSelectPres: (p: Presentacion) => void;
  onConfirm:    (product: CatalogProduct, pres: Presentacion, precio: number, tipoPrecio?: string) => void;
  onCancel:     () => void;
}

export function PresentacionSheet({ product, selectedPres, onSelectPres, onConfirm, onCancel }: Props) {
  const firstBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const t = setTimeout(() => firstBtnRef.current?.focus(), 60);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); onCancel(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onCancel]);

  const pres = product.presentaciones ?? [];

  function handleSelectPres(p: Presentacion) {
    if (!p.precios || p.precios.length === 0) {
      onConfirm(product, p, p.precio);
      return;
    }
    onSelectPres(p);
  }

  function handleSelectPrecio(pres: Presentacion, precio: number, tipo: string) {
    onConfirm(product, pres, precio, tipo);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 backdrop-blur-[2px]"
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-full max-w-md rounded-t-[28px] border border-[#e4e9f0] bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-[#f1f5f9] px-5 py-4">
          <span className="text-[28px] leading-none">{product.emoji}</span>
          <div className="flex-1 min-w-0">
            <p className="truncate text-[14px] font-bold text-[#111827]">{product.name}</p>
            <p className="text-[11px] text-[#9ca3af]">
              {selectedPres ? `${selectedPres.label} — elige el precio` : "¿Cómo lo llevas?"}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-xl p-2 text-[#9ca3af] transition hover:bg-[#f4f7fb] hover:text-[#374151]"
          >
            <X size={16} strokeWidth={2} />
          </button>
        </div>

        {/* Body */}
        <div className="px-4 py-3 flex flex-col gap-2">

          {!selectedPres ? (
            <>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#c0cad4] px-1">
                Presentación
              </p>
              {pres.map((p, idx) => (
                <button
                  key={p.id}
                  ref={idx === 0 ? firstBtnRef : null}
                  onClick={() => handleSelectPres(p)}
                  className="flex items-center gap-3 rounded-2xl border border-[#e4e9f0] px-4 py-3 text-left transition hover:border-[#45b356]/40 hover:bg-[#F0FAF1] active:scale-[0.98]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-[#1f2937]">{p.label}</p>
                    {p.precios && p.precios.length > 0 ? (
                      <p className="text-[11px] text-[#9ca3af]">
                        desde S/ {Math.min(...p.precios.map(x => x.valor)).toFixed(2)}
                      </p>
                    ) : (
                      <p className="text-[11px] text-[#9ca3af]">S/ {p.precio.toFixed(2)}</p>
                    )}
                  </div>
                  <ChevronRight size={16} strokeWidth={2} className="shrink-0 text-[#c0cad4]" />
                </button>
              ))}
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 px-1">
                <button
                  onClick={() => onSelectPres(null as unknown as Presentacion)}
                  className="text-[11px] font-semibold text-[#9ca3af] hover:text-[#374151] transition"
                >
                  ← {selectedPres.label}
                </button>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#c0cad4] px-1">
                Tipo de precio
              </p>
              {(selectedPres.precios ?? []).map((pr, idx) => (
                <button
                  key={pr.tipo}
                  ref={idx === 0 ? firstBtnRef : null}
                  onClick={() => handleSelectPrecio(selectedPres, pr.valor, pr.tipo)}
                  className="flex items-center gap-3 rounded-2xl border border-[#e4e9f0] px-4 py-3 text-left transition hover:border-[#45b356]/40 hover:bg-[#F0FAF1] active:scale-[0.98]"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-[#1f2937]">{pr.tipo}</p>
                  </div>
                  <p className="text-[15px] font-extrabold tabular-nums text-[#2d4f6b]">
                    S/ {pr.valor.toFixed(2)}
                  </p>
                </button>
              ))}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-5 pt-1">
          <button
            onClick={onCancel}
            className="w-full rounded-2xl border border-[#e4e9f0] py-3 text-[12px] font-semibold text-[#9ca3af] transition hover:bg-[#f4f7fb] hover:text-[#374151]"
          >
            Cancelar
          </button>
        </div>

      </div>
    </div>
  );
}
