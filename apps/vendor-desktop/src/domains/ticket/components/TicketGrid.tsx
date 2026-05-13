import { useState, useEffect, useRef, useCallback } from "react";
import { Pin, Trash2 } from "lucide-react";
import { useTicketLines } from "../selectors/ticket.selectors";
import { useTicketStore } from "../state/ticket.store";
import { usePOS } from "../../../context/POSContext";

let _saleCounter = 1;

export function TicketGrid() {
  const lines = useTicketLines();
  const removeLine         = useTicketStore(s => s.removeLine);
  const updateQuantity     = useTicketStore(s => s.updateQuantity);
  const updateNote         = useTicketStore(s => s.updateNote);
  const clearTicket        = useTicketStore(s => s.clearTicket);
  const pendingNoteLineId  = useTicketStore(s => s.pendingNoteLineId);
  const clearPendingNote   = useTicketStore(s => s.clearPendingNote);
  const { zone, enterTicket, enterSearch, openCobro, cashSession } = usePOS();

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [saleNumber] = useState(() => String(_saleCounter++).padStart(6, "0"));
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState("");

  const noteInputRef = useRef<HTMLInputElement>(null);
  const listRef      = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (lines.length === 0) setSelectedIdx(0);
    else if (selectedIdx >= lines.length) setSelectedIdx(lines.length - 1);
  }, [lines.length, selectedIdx]);

  // Auto-scroll to last line when a new item is added
  const prevLinesLengthRef = useRef(lines.length);
  useEffect(() => {
    if (lines.length > prevLinesLengthRef.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
    prevLinesLengthRef.current = lines.length;
  }, [lines.length]);

  useEffect(() => {
    if (editingNoteId) {
      const t = setTimeout(() => noteInputRef.current?.focus(), 20);
      return () => clearTimeout(t);
    }
  }, [editingNoteId]);

  const linesRef = useRef(lines);
  linesRef.current = lines;
  const selectedIdxRef = useRef(selectedIdx);
  selectedIdxRef.current = selectedIdx;
  const editingNoteIdRef = useRef(editingNoteId);
  editingNoteIdRef.current = editingNoteId;

  // Open note editor when triggered from search zone via openNoteFor()
  useEffect(() => {
    if (!pendingNoteLineId) return;
    const line = lines.find(l => l.lineId === pendingNoteLineId);
    if (line) { setEditingNoteId(pendingNoteLineId); setNoteInput(line.note ?? ""); }
    clearPendingNote();
  }, [pendingNoteLineId, lines, clearPendingNote]);

  const saveNote = useCallback(() => {
    if (!editingNoteId) return;
    updateNote(editingNoteId, noteInput.trim());
    setEditingNoteId(null);
  }, [editingNoteId, noteInput, updateNote]);

  useEffect(() => {
    if (zone !== "ticket") return;
    const handler = (e: KeyboardEvent) => {
      if (editingNoteIdRef.current) return;
      const lines = linesRef.current;
      const idx = selectedIdxRef.current;
      switch (e.key) {
        case "ArrowDown": e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, lines.length - 1)); break;
        case "ArrowUp":   e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); break;
        case "+":
        case "*": {
          e.preventDefault();
          const l = lines[idx]; if (l) updateQuantity(l.lineId, l.quantity + 1);
          break;
        }
        case "-": {
          e.preventDefault();
          const l = lines[idx]; if (!l) break;
          if (l.quantity > 1) updateQuantity(l.lineId, l.quantity - 1); else removeLine(l.lineId);
          break;
        }
        case "Delete": { e.preventDefault(); const l = lines[idx]; if (l) removeLine(l.lineId); break; }
        case "n":
        case "N": {
          e.preventDefault();
          const l = lines[idx];
          if (l) { setEditingNoteId(l.lineId); setNoteInput(l.note ?? ""); }
          break;
        }
        case "Tab":
        case "Escape": e.preventDefault(); enterSearch(); break;
        case "F4": e.preventDefault(); openCobro(); break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [zone, removeLine, updateQuantity, updateNote, enterSearch, openCobro]);

  const total      = lines.reduce((acc, l) => acc + l.subtotal, 0);
  const isTicketActive = zone === "ticket";

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-[28px] border border-[#e4e9f0] bg-white shadow-[0_4px_18px_rgba(15,23,42,0.04)]">

      {/* HEADER */}
      <header className="shrink-0 flex items-center justify-between border-b border-[#f1f5f9] px-4 py-2.5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#9ca3af]">PRE-VENTA</span>
        <span className="text-[11px] font-bold uppercase tracking-widest text-[#9ca3af]">
          VENTA N° {saleNumber}{lines.length > 0 ? ` · ${lines.length} ${lines.length === 1 ? "ÍTEM" : "ÍTEMS"}` : ""}
        </span>
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
              const isSelected    = isTicketActive && idx === selectedIdx;
              const isLastLine    = !isTicketActive && idx === lines.length - 1;
              const isEditingNote = editingNoteId === line.lineId;

              return (
                <article
                  key={line.lineId}
                  onClick={() => { setSelectedIdx(idx); enterTicket(); }}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl px-3 py-2 transition-colors ${
                    isSelected
                      ? "bg-[#EDF4FF] ring-1 ring-[#2154d8]/20"
                      : isLastLine
                      ? "bg-[#f8fafd] ring-1 ring-[#e8eef5]"
                      : "hover:bg-[#f8fafd]"
                  }`}
                >
                  {/* Name + price + note */}
                  <div className="min-w-0 flex-1 pt-px">
                    <p className={`truncate text-[13px] font-semibold uppercase leading-tight tracking-[0.02em] ${
                      isSelected ? "text-[#2154d8]" : "text-[#111827]"
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
                          if (e.key === "Enter")  { e.preventDefault(); saveNote(); }
                          if (e.key === "Escape") { e.preventDefault(); setEditingNoteId(null); }
                          e.stopPropagation();
                        }}
                        onBlur={saveNote}
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
                      onClick={e => {
                        e.stopPropagation();
                        if (line.quantity > 1) updateQuantity(line.lineId, line.quantity - 1);
                        else removeLine(line.lineId);
                      }}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f4f7fb] text-[15px] font-bold text-[#7c8b97] transition hover:bg-[#e4edff] hover:text-[#2154d8]"
                    >
                      −
                    </button>
                    <span className={`w-6 text-center text-[13px] font-bold tabular-nums ${
                      isSelected ? "text-[#2154d8]" : "text-[#111827]"
                    }`}>
                      {line.quantity}
                    </span>
                    <button
                      onClick={e => { e.stopPropagation(); updateQuantity(line.lineId, line.quantity + 1); }}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f4f7fb] text-[15px] font-bold text-[#7c8b97] transition hover:bg-[#e4edff] hover:text-[#2154d8]"
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal */}
                  <span className={`w-16 shrink-0 pt-px text-right text-[13px] font-bold tabular-nums ${
                    isSelected ? "text-[#2154d8]" : "text-[#111827]"
                  }`}>
                    S/ {line.subtotal.toFixed(2)}
                  </span>

                  {/* Note + Delete */}
                  <div className="flex shrink-0 items-center gap-0.5 pt-0.5">
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        setSelectedIdx(idx);
                        enterTicket();
                        setEditingNoteId(line.lineId);
                        setNoteInput(line.note ?? "");
                      }}
                      title="Nota"
                      className={`rounded-lg p-1 transition ${
                        line.note
                          ? "text-[#60a5fa] hover:bg-[#eff6ff] hover:text-[#2154d8]"
                          : "text-[#c8d4e0] hover:bg-[#f0f5ff] hover:text-[#7c8b97]"
                      }`}
                    >
                      <Pin size={12} />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); removeLine(line.lineId); }}
                      className="rounded-lg p-1 text-[#fca5a5] transition hover:bg-[#fef2f2] hover:text-red-500"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="shrink-0 flex items-stretch gap-2 border-t border-[#f1f5f9] px-3 py-3">

        {/* LIMPIAR ~30% */}
        <button
          onClick={clearTicket}
          disabled={lines.length === 0}
          className={`flex w-[28%] shrink-0 items-center justify-center rounded-2xl text-[12px] font-bold uppercase tracking-wider transition ${
            lines.length === 0
              ? "cursor-not-allowed bg-[#f4f7fb] text-[#c8d4e0]"
              : "bg-[#fee2e2] text-[#dc2626] hover:bg-[#fecaca] active:scale-[0.97]"
          }`}
        >
          Limpiar
        </button>

        {/* TOTAL ~40% */}
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center py-1">
          <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-[#c8d4e0]">Total</p>
          <strong className="text-[22px] font-bold leading-none tracking-tight text-[#111827]">
            S/ {total.toFixed(2)}
          </strong>
        </div>

        {/* COBRAR ~30% */}
        <button
          onClick={openCobro}
          disabled={lines.length === 0}
          className={`flex w-[28%] shrink-0 items-center justify-center rounded-2xl text-[12px] font-bold uppercase tracking-wider text-white transition ${
            lines.length === 0
              ? "cursor-not-allowed bg-[#e4e9f0] text-[#b4bfcb]"
              : !cashSession.isOpen
              ? "bg-[#6ea4e0] hover:bg-[#5a94d0] active:scale-[0.97]"
              : "bg-[#2154d8] shadow-[0_4px_18px_rgba(33,84,216,0.32)] hover:bg-[#1a43b0] active:scale-[0.97]"
          }`}
        >
          COBRAR →
        </button>
      </footer>
    </section>
  );
}
