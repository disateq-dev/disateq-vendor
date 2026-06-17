import { useState, useEffect, useRef, useCallback } from "react";
import { Pin, Trash2, ClipboardList } from "lucide-react";
import { moneySum } from "../../../lib/money";
import { useLineasPreVenta } from "../selectors/preventa.selectors";
import { usePreVentaStore } from "../state/preventa.store";
import { preVentaService } from "../services/preventa.service";
import { usePOS } from "../../../context/POSContext";

let _saleCounter = 1;

export function PreVentaGrid() {
  const lines                 = useLineasPreVenta();
  const lineaNotaPendienteId  = usePreVentaStore(s => s.lineaNotaPendienteId);
  const limpiarNotaPendiente  = usePreVentaStore(s => s.limpiarNotaPendiente);
  const indiceLineaActiva     = usePreVentaStore(s => s.indiceLineaActiva);
  const setIndiceLineaActiva  = usePreVentaStore(s => s.setIndiceLineaActiva);
  const { openCobro, cashSession } = usePOS();

  const [saleNumber] = useState(() => String(_saleCounter++).padStart(6, "0"));
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState("");

  const noteInputRef    = useRef<HTMLInputElement>(null);
  const listRef         = useRef<HTMLDivElement>(null);
  const noteKeyHandled  = useRef(false);

  // Auto-scroll to last line when a new item is added
  const prevLinesLengthRef = useRef(lines.length);
  useEffect(() => {
    if (lines.length > prevLinesLengthRef.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
    prevLinesLengthRef.current = lines.length;
  }, [lines.length]);

  // Auto-scroll active line into view
  useEffect(() => {
    if (indiceLineaActiva < 0 || !listRef.current) return;
    const articles = listRef.current.querySelectorAll("article");
    articles[indiceLineaActiva]?.scrollIntoView({ block: "nearest" });
  }, [indiceLineaActiva]);

  useEffect(() => {
    if (editingNoteId) {
      const t = setTimeout(() => noteInputRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
  }, [editingNoteId]);

  // Open note editor when triggered from search zone via abrirNotaLinea()
  useEffect(() => {
    if (!lineaNotaPendienteId) return;
    const line = lines.find(l => l.lineaId === lineaNotaPendienteId);
    if (line) { setEditingNoteId(lineaNotaPendienteId); setNoteInput(line.nota ?? ""); }
    limpiarNotaPendiente();
  }, [lineaNotaPendienteId, lines, limpiarNotaPendiente]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (lines.length === 0) return;
      const tag = (document.activeElement as HTMLElement)?.tagName;
      const inInput = tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA";
      if (inInput || e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) return;

      if (e.key === "Enter") {
        e.preventDefault();
        openCobro();
        return;
      }

      if (e.key === "Delete") {
        e.preventDefault();
        preVentaService.limpiar();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [lines.length, openCobro]);

  const saveNote = useCallback(() => {
    if (!editingNoteId) return;
    preVentaService.guardarNotaLinea(editingNoteId, noteInput.trim());
    setEditingNoteId(null);
  }, [editingNoteId, noteInput]);

  const total      = moneySum(lines.map(l => l.subtotal));
  const totalUnits = lines.reduce((acc, l) => acc + l.cantidad, 0);

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-[28px] border border-[#45b356]/40 bg-[#FDFCF9]">

      {/* SheetHeader */}
      <header className="shrink-0 flex h-[42px] items-center justify-between px-4 bg-[#F2F7F3] border-b border-[#45b356]/20">
        <div className="flex items-center gap-2">
          <ClipboardList size={14} className="shrink-0 text-[#45b356]" strokeWidth={2} />
          <span className="text-[14px] font-semibold uppercase tracking-tight text-[#121416] leading-none">PRE-VENTA</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="tabular-nums text-[11px] text-[#b0bac8]">#{saleNumber}</span>
          {lines.length > 0 && (
            <span className="text-[11px] font-semibold tabular-nums text-[#6b7280]">
              {lines.length} {lines.length === 1 ? "PROD." : "PRODS."} · {totalUnits} UND
            </span>
          )}
        </div>
      </header>

      {/* LINES */}
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-2 py-1.5">
        {lines.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1.5 py-12 text-center">
            <p className="text-[13px] font-semibold text-[#c0cad4]">Ticket vacío</p>
            <p className="text-[11px] text-[#d1d9e1]">Agrega un producto para empezar</p>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {lines.map((line, idx) => {
              const isSelected    = idx === indiceLineaActiva;
              const isLastLine    = indiceLineaActiva < 0 && idx === lines.length - 1;
              const isEditingNote = editingNoteId === line.lineaId;

              return (
                <article
                  key={line.lineaId}
                  onClick={() => setIndiceLineaActiva(isSelected ? -1 : idx)}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl px-3 py-2 transition-colors ${
                    isSelected
                      ? "bg-[#F0FAF1] ring-1 ring-[#45b356]/20"
                      : isLastLine
                      ? "bg-white ring-1 ring-[#e4e9f0]"
                      : "hover:bg-white"
                  }`}
                >
                  {/* Name + price + note */}
                  <div className="min-w-0 flex-1 pt-px">
                    <p className={`truncate text-[13px] font-semibold uppercase leading-tight tracking-[0.02em] ${
                      isSelected ? "text-[#2d4f6b]" : "text-[#2F3E46]"
                    }`}>
                      {line.descripcion}
                    </p>
                    <p className="text-[11px] text-[#9ca3af]">
                      S/ {line.valorUnitario.toFixed(2)}
                    </p>
                    {isEditingNote ? (
                      <input
                        ref={noteInputRef}
                        type="text"
                        value={noteInput}
                        onChange={e => setNoteInput(e.target.value)}
                        onKeyDown={e => {
                          e.stopPropagation();
                          if (e.key === "Enter") {
                            e.preventDefault();
                            noteKeyHandled.current = true;
                            saveNote();
                            document.dispatchEvent(new CustomEvent("pos:focusSearch"));
                            return;
                          }
                          if (e.key === "Escape") {
                            e.preventDefault();
                            noteKeyHandled.current = true;
                            setEditingNoteId(null);
                          }
                        }}
                        onBlur={() => {
                          if (noteKeyHandled.current) { noteKeyHandled.current = false; return; }
                          saveNote();
                        }}
                        placeholder="anotación..."
                        className="mt-1 w-full border-b border-[#e4e9f0] bg-transparent pb-px text-[10.5px] text-[#374151] outline-none placeholder:text-[#d1d9e1]"
                      />
                    ) : line.nota ? (
                      <p
                        onClick={e => { e.stopPropagation(); setEditingNoteId(line.lineaId); setNoteInput(line.nota ?? ""); }}
                        className="mt-0.5 cursor-text truncate text-[10.5px] text-[#8b95a1]"
                      >
                        ↳ {line.nota}
                      </p>
                    ) : null}
                  </div>

                  {/* Qty strip */}
                  <div className="flex items-center gap-1 pt-px">
                    <button
                      title="Tecla [←]"
                      onClick={e => {
                        e.stopPropagation();
                        preVentaService.decrementarLinea(line.lineaId);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-[15px] font-bold text-orange-500 transition hover:bg-orange-100 hover:text-orange-600"
                    >
                      −
                    </button>
                    <span className={`w-6 text-center text-[13px] font-bold tabular-nums ${
                      isSelected ? "text-[#2d4f6b]" : "text-[#2F3E46]"
                    }`}>
                      {line.cantidad}
                    </span>
                    <button
                      title="Tecla [→]"
                      onClick={e => { e.stopPropagation(); preVentaService.incrementarLinea(line.lineaId); }}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EEF3F8] text-[15px] font-bold text-[#4F7396] transition hover:bg-[#e0e9f0] hover:text-[#3d5c7a]"
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal */}
                  <span className={`w-16 shrink-0 pt-px text-right text-[13px] font-bold tabular-nums ${
                    isSelected ? "text-[#2154d8]" : "text-[#2F3E46]"
                  }`}>
                    S/ {line.subtotal.toFixed(2)}
                  </span>

                  {/* Note + Delete */}
                  <div className="flex shrink-0 items-center gap-0.5 pt-0.5">
                    <button
                      title="Tecla [Insert]"
                      onClick={e => {
                        e.stopPropagation();
                        setIndiceLineaActiva(idx);
                        setEditingNoteId(line.lineaId);
                        setNoteInput(line.nota ?? "");
                      }}
                      className={`flex items-center justify-center rounded-lg p-1.5 transition ${
                        line.nota
                          ? "text-[#45b356] hover:bg-[#F0FAF1] hover:text-[#3a9348]"
                          : "text-[#8ab8a0] hover:bg-[#F0FAF1] hover:text-[#45b356]"
                      }`}
                    >
                      <Pin size={12} />
                    </button>
                    <button
                      title="Tecla [Supr]"
                      onClick={e => { e.stopPropagation(); preVentaService.quitarLinea(line.lineaId); }}
                      className="flex items-center justify-center rounded-lg p-1.5 text-red-400 transition hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="shrink-0 flex items-stretch gap-2 border-t border-[#f1f5f9] bg-[#f4f7fb] px-3 py-4">

        {/* LIMPIAR ~30% */}
        <button
          title="Tecla [Supr]"
          onClick={() => preVentaService.limpiar()}
          disabled={lines.length === 0}
          className={`flex w-[28%] shrink-0 items-center justify-center rounded-2xl text-[13px] font-bold uppercase tracking-wider transition ${
            lines.length === 0
              ? "cursor-not-allowed bg-[#f4f7fb] text-[#c8d4e0]"
              : "bg-[#fee2e2] text-[#dc2626] hover:bg-[#fecaca] active:scale-[0.97]"
          }`}
        >
          Limpiar
        </button>

        {/* TOTAL ~40% */}
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center py-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">Total</p>
          <strong className="text-[26px] font-extrabold leading-none tracking-tight text-[#111827] tabular-nums">
            S/ {total.toFixed(2)}
          </strong>
        </div>

        {/* COBRAR ~30% */}
        <button
          title="Tecla [Enter]"
          onClick={openCobro}
          disabled={lines.length === 0}
          className={`flex w-[28%] shrink-0 items-center justify-center rounded-2xl text-[13px] font-bold uppercase tracking-wider text-white transition ${
            lines.length === 0
              ? "cursor-not-allowed bg-[#e4e9f0] text-[#b4bfcb]"
              : !cashSession.isOpen
              ? "bg-[#78C487] hover:bg-[#6abd8a] active:scale-[0.97]"
              : "bg-[#56C264] shadow-[0_4px_18px_rgba(86,194,100,0.32)] hover:bg-[#45b356] active:scale-[0.97]"
          }`}
        >
          COBRAR →
        </button>
      </footer>
    </section>
  );
}
