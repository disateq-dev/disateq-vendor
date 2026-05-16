import { useState, useEffect, useRef, useCallback } from "react";
import { Pin, Trash2 } from "lucide-react";
import { useTicketLines } from "../selectors/ticket.selectors";
import { useTicketStore } from "../state/ticket.store";
import { ticketService } from "../services/ticket.service";
import { usePOS } from "../../../context/POSContext";

let _saleCounter = 1;

export function TicketGrid() {
  const lines             = useTicketLines();
  const pendingNoteLineId = useTicketStore(s => s.pendingNoteLineId);
  const clearPendingNote  = useTicketStore(s => s.clearPendingNote);
  const activeLineIdx     = useTicketStore(s => s.activeLineIdx);
  const setActiveLineIdx  = useTicketStore(s => s.setActiveLineIdx);
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
    if (activeLineIdx < 0 || !listRef.current) return;
    const articles = listRef.current.querySelectorAll("article");
    articles[activeLineIdx]?.scrollIntoView({ block: "nearest" });
  }, [activeLineIdx]);

  useEffect(() => {
    if (editingNoteId) {
      const t = setTimeout(() => noteInputRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
  }, [editingNoteId]);

  // Open note editor when triggered from search zone via openNoteFor()
  useEffect(() => {
    if (!pendingNoteLineId) return;
    const line = lines.find(l => l.lineId === pendingNoteLineId);
    if (line) { setEditingNoteId(pendingNoteLineId); setNoteInput(line.note ?? ""); }
    clearPendingNote();
  }, [pendingNoteLineId, lines, clearPendingNote]);

  const saveNote = useCallback(() => {
    if (!editingNoteId) return;
    ticketService.saveLineNote(editingNoteId, noteInput.trim());
    setEditingNoteId(null);
  }, [editingNoteId, noteInput]);

  const total      = lines.reduce((acc, l) => acc + l.subtotal, 0);
  const totalUnits = lines.reduce((acc, l) => acc + l.quantity, 0);

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-[28px] border border-[#e4e9f0] bg-[#f8fafd] shadow-[0_4px_18px_rgba(15,23,42,0.04)]">

      {/* HEADER */}
      <header className="shrink-0 flex flex-col border-b border-[#f1f5f9] bg-[#f4f7fb] px-4 pt-2.5 pb-2">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-bold tracking-wide text-[#2F3E46]">
            PRE-VENTA <span className="text-[#374151]">#{saleNumber}</span>
          </span>
          {lines.length > 0 ? (
            <span className="text-[13px] font-bold tracking-widest text-[#2F3E46]">
              {lines.length} {lines.length === 1 ? "ÍT." : "ÍTEMS"} · {totalUnits} UND
            </span>
          ) : (
            <span className="text-[13px] text-[#c0cad4]">—</span>
          )}
        </div>
      </header>

      {/* LINES */}
      <div ref={listRef} className="min-h-0 flex-1 overflow-y-auto px-2 py-1.5">
        {lines.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1.5 py-12 text-center">
            <p className="text-[13px] font-medium text-[#c0cad4]">Ticket vacío</p>
            <p className="text-[11px] text-[#d1d9e1]">Busque un producto para comenzar</p>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {lines.map((line, idx) => {
              const isSelected    = idx === activeLineIdx;
              const isLastLine    = activeLineIdx < 0 && idx === lines.length - 1;
              const isEditingNote = editingNoteId === line.lineId;

              return (
                <article
                  key={line.lineId}
                  onClick={() => setActiveLineIdx(isSelected ? -1 : idx)}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl px-3 py-2 transition-colors ${
                    isSelected
                      ? "bg-[#EDF4FF] ring-1 ring-[#2154d8]/20"
                      : isLastLine
                      ? "bg-white ring-1 ring-[#e4e9f0]"
                      : "hover:bg-white"
                  }`}
                >
                  {/* Name + price + note */}
                  <div className="min-w-0 flex-1 pt-px">
                    <p className={`truncate text-[13px] font-semibold uppercase leading-tight tracking-[0.02em] ${
                      isSelected ? "text-[#2154d8]" : "text-[#2F3E46]"
                    }`}>
                      {line.description}
                    </p>
                    <p className="text-[11px] text-[#9ca3af]">
                      S/ {line.unitPrice.toFixed(2)}
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
                        placeholder="observación..."
                        className="mt-1 w-full border-b border-[#e4e9f0] bg-transparent pb-px text-[10.5px] text-[#374151] outline-none placeholder:text-[#d1d9e1]"
                      />
                    ) : line.note ? (
                      <p
                        onClick={e => { e.stopPropagation(); setEditingNoteId(line.lineId); setNoteInput(line.note ?? ""); }}
                        className="mt-0.5 cursor-text truncate text-[10.5px] text-[#8b95a1]"
                      >
                        ↳ {line.note}
                      </p>
                    ) : null}
                  </div>

                  {/* Qty strip */}
                  <div className="flex items-center gap-1 pt-px">
                    <button
                      title="Tecla [←]"
                      onClick={e => {
                        e.stopPropagation();
                        ticketService.decrementLine(line.lineId);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-orange-50 text-[15px] font-bold text-orange-500 transition hover:bg-orange-100 hover:text-orange-600"
                    >
                      −
                    </button>
                    <span className={`w-6 text-center text-[13px] font-bold tabular-nums ${
                      isSelected ? "text-[#2154d8]" : "text-[#2F3E46]"
                    }`}>
                      {line.quantity}
                    </span>
                    <button
                      title="Tecla [→]"
                      onClick={e => { e.stopPropagation(); ticketService.incrementLine(line.lineId); }}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[15px] font-bold text-[#2154d8] transition hover:bg-blue-100 hover:text-[#1a43b0]"
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
                        setActiveLineIdx(idx);
                        setEditingNoteId(line.lineId);
                        setNoteInput(line.note ?? "");
                      }}
                      className={`flex items-center justify-center rounded-lg p-1.5 transition ${
                        line.note
                          ? "text-[#2154d8] hover:bg-blue-50 hover:text-[#1a43b0]"
                          : "text-[#93c5fd] hover:bg-blue-50 hover:text-[#2154d8]"
                      }`}
                    >
                      <Pin size={12} />
                    </button>
                    <button
                      title="Tecla [Supr]"
                      onClick={e => { e.stopPropagation(); ticketService.removeLine(line.lineId); }}
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
          onClick={() => ticketService.clear()}
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
          title="Tecla [F9]"
          onClick={openCobro}
          disabled={lines.length === 0}
          className={`flex w-[28%] shrink-0 items-center justify-center rounded-2xl text-[13px] font-bold uppercase tracking-wider text-white transition ${
            lines.length === 0
              ? "cursor-not-allowed bg-[#e4e9f0] text-[#b4bfcb]"
              : !cashSession.isOpen
              ? "bg-[#6abd8a] hover:bg-[#5aad7a] active:scale-[0.97]"
              : "bg-[#16a34a] shadow-[0_4px_18px_rgba(22,163,74,0.32)] hover:bg-[#15803d] active:scale-[0.97]"
          }`}
        >
          COBRAR →
        </button>
      </footer>
    </section>
  );
}
