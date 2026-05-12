import { useState, useEffect, useRef, useCallback } from "react";
import { Trash2, X } from "lucide-react";
import { useTicketLines } from "../selectors/ticket.selectors";
import { useTicketStore } from "../state/ticket.store";
import { usePOS } from "../../../context/POSContext";

let _saleCounter = 1;

export function TicketGrid() {
  const lines = useTicketLines();
  const removeLine    = useTicketStore(s => s.removeLine);
  const updateQuantity = useTicketStore(s => s.updateQuantity);
  const updateNote    = useTicketStore(s => s.updateNote);
  const clearTicket   = useTicketStore(s => s.clearTicket);
  const { zone, enterTicket, enterSearch, openCobro, cashSession } = usePOS();

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [saleNumber] = useState(() => String(_saleCounter++).padStart(6, "0"));
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteInput, setNoteInput] = useState("");

  const noteInputRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    if (lines.length === 0) setSelectedIdx(0);
    else if (selectedIdx >= lines.length) setSelectedIdx(lines.length - 1);
  }, [lines.length, selectedIdx]);

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
  const totalUnits = lines.reduce((acc, l) => acc + l.quantity, 0);
  const isTicketActive = zone === "ticket";

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-[28px] border border-[#e4e9f0] bg-white shadow-[0_4px_18px_rgba(15,23,42,0.04)]">

      {/* HEADER */}
      <header className="shrink-0 flex items-center gap-2 border-b border-[#f1f5f9] px-4 py-2.5">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <span className="shrink-0 text-[11px] font-bold uppercase tracking-widest text-[#9ca3af]">
            #{saleNumber}
          </span>
          {lines.length > 0 && (
            <>
              <span className="shrink-0 text-[#dde4ec]">·</span>
              <span className="shrink-0 text-[11px] font-semibold text-[#374151]">
                {lines.length} {lines.length === 1 ? "ítem" : "ítems"}
              </span>
              <span className="shrink-0 text-[#dde4ec]">·</span>
              <span className="shrink-0 text-[11px] font-bold text-[#111827]">
                S/ {total.toFixed(2)}
              </span>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          {lines.length > 0 && (
            <button
              onClick={clearTicket}
              title="Limpiar ticket"
              className="rounded-lg p-1 text-[#d1d9e1] transition hover:bg-[#fef2f2] hover:text-red-400"
            >
              <X size={13} />
            </button>
          )}
          <div className={`rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition ${
            isTicketActive ? "bg-[#EDF4FF] text-[#2154d8]" : "bg-emerald-50 text-emerald-600"
          }`}>
            {isTicketActive ? "TICKET" : "ACTIVO"}
          </div>
        </div>
      </header>

      {/* LINES */}
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-1.5">
        {lines.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1.5 py-12 text-center">
            <p className="text-[13px] font-medium text-[#c0cad4]">Ticket vacío</p>
            <p className="text-[11px] text-[#d1d9e1]">Busque un producto para comenzar</p>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {lines.map((line, idx) => {
              const isSelected   = isTicketActive && idx === selectedIdx;
              const isEditingNote = editingNoteId === line.lineId;

              return (
                <article
                  key={line.lineId}
                  onClick={() => { setSelectedIdx(idx); enterTicket(); }}
                  className={`flex cursor-pointer items-start gap-3 rounded-2xl px-3 py-2 transition-colors ${
                    isSelected ? "bg-[#EDF4FF] ring-1 ring-[#2154d8]/20" : "hover:bg-[#f8fafd]"
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
                    ) : isSelected ? (
                      <p
                        onClick={e => { e.stopPropagation(); setEditingNoteId(line.lineId); setNoteInput(""); }}
                        className="mt-0.5 cursor-text text-[10px] text-[#c8d4e0]"
                      >
                        📝 Observación
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
                      className="flex h-6 w-6 items-center justify-center rounded-lg text-[15px] font-bold text-[#c0cad4] transition hover:bg-[#f1f5f9] hover:text-[#374151]"
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
                      className="flex h-6 w-6 items-center justify-center rounded-lg text-[15px] font-bold text-[#c0cad4] transition hover:bg-[#f1f5f9] hover:text-[#374151]"
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

                  {/* Delete */}
                  <button
                    onClick={e => { e.stopPropagation(); removeLine(line.lineId); }}
                    className="shrink-0 rounded-lg p-1 pt-1.5 text-[#d1d9e1] transition hover:bg-[#fef2f2] hover:text-red-400"
                  >
                    <Trash2 size={13} />
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* FOOTER */}
      <footer className="shrink-0 border-t border-[#f1f5f9] px-5 py-4">
        <div className="mb-3 flex items-end justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="text-[9.5px] font-bold uppercase tracking-[0.15em] text-[#c8d4e0]">
              {lines.length > 0 ? `${lines.length} ${lines.length === 1 ? "ítem" : "ítems"}` : "Sin ítems"}
            </span>
            {totalUnits > 0 && (
              <span className="text-[10.5px] font-semibold text-[#b8c4cf]">
                {totalUnits} {totalUnits === 1 ? "unidad" : "unidades"}
              </span>
            )}
          </div>
          <strong className="text-[30px] font-bold leading-none tracking-tight text-[#111827]">
            S/ {total.toFixed(2)}
          </strong>
        </div>

        <button
          onClick={openCobro}
          disabled={lines.length === 0}
          className={`w-full rounded-2xl py-3.5 text-[15px] font-bold uppercase tracking-widest text-white transition ${
            lines.length === 0
              ? "cursor-not-allowed bg-[#2154d8] opacity-30 shadow-none"
              : !cashSession.isOpen
              ? "bg-[#2154d8] opacity-55 shadow-[0_2px_6px_rgba(33,84,216,0.12)] hover:opacity-65"
              : "bg-[#2154d8] shadow-[0_4px_18px_rgba(33,84,216,0.3)] hover:bg-[#1a43b0] active:scale-[0.98]"
          }`}
        >
          → COBRAR
        </button>
      </footer>
    </section>
  );
}
