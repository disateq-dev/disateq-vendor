import { useState, useEffect, useRef } from "react";
import { Trash2 } from "lucide-react";
import { useTicketLines } from "../selectors/ticket.selectors";
import { useTicketStore } from "../state/ticket.store";
import { usePOS } from "../../../context/POSContext";

let _saleCounter = 1;

function getCurrentTime() {
  return new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

export function TicketGrid() {
  const lines = useTicketLines();
  const removeLine = useTicketStore(s => s.removeLine);
  const updateQuantity = useTicketStore(s => s.updateQuantity);
  const { zone, enterTicket, enterSearch, openCobro } = usePOS();

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [saleNumber] = useState(() => String(_saleCounter++).padStart(6, "0"));
  const [currentTime, setCurrentTime] = useState(getCurrentTime);

  // Update clock every minute
  useEffect(() => {
    const id = setInterval(() => setCurrentTime(getCurrentTime()), 60_000);
    return () => clearInterval(id);
  }, []);

  // Keep selection in bounds when lines change
  useEffect(() => {
    if (lines.length === 0) setSelectedIdx(0);
    else if (selectedIdx >= lines.length) setSelectedIdx(lines.length - 1);
  }, [lines.length, selectedIdx]);

  // Use refs to avoid stale closures without re-registering listener on every keystroke
  const linesRef = useRef(lines);
  linesRef.current = lines;
  const selectedIdxRef = useRef(selectedIdx);
  selectedIdxRef.current = selectedIdx;

  // Keyboard handler — only active when zone === 'ticket'
  useEffect(() => {
    if (zone !== "ticket") return;

    const handler = (e: KeyboardEvent) => {
      const lines = linesRef.current;
      const idx = selectedIdxRef.current;

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setSelectedIdx(i => Math.min(i + 1, lines.length - 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIdx(i => Math.max(i - 1, 0));
          break;
        case "+":
        case "*": {
          e.preventDefault();
          const line = lines[idx];
          if (line) updateQuantity(line.lineId, line.quantity + 1);
          break;
        }
        case "-": {
          e.preventDefault();
          const line = lines[idx];
          if (!line) break;
          if (line.quantity > 1) updateQuantity(line.lineId, line.quantity - 1);
          else removeLine(line.lineId);
          break;
        }
        case "Delete": {
          e.preventDefault();
          const line = lines[idx];
          if (line) removeLine(line.lineId);
          break;
        }
        case "Tab":
        case "Escape":
          e.preventDefault();
          enterSearch();
          break;
        case "F4":
          e.preventDefault();
          openCobro();
          break;
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [zone, removeLine, updateQuantity, enterSearch, openCobro]);

  const total = lines.reduce((acc, l) => acc + l.subtotal, 0);
  const isTicketActive = zone === "ticket";

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-[28px] border border-[#e4e9f0] bg-white shadow-[0_4px_18px_rgba(15,23,42,0.04)]">

      {/* HEADER */}
      <header className="shrink-0 flex items-center justify-between border-b border-[#f1f5f9] px-5 py-3">
        <div>
          <h1 className="text-[12px] font-bold uppercase tracking-widest text-[#9ca3af]">
            VENTA #{saleNumber}
          </h1>
          <p className="text-[11px] text-[#c0cad4]">{currentTime}</p>
        </div>
        <div className={`rounded-md px-2 py-1 text-[10px] font-semibold uppercase tracking-wider transition ${
          isTicketActive
            ? "bg-[#EDF4FF] text-[#2154d8]"
            : "bg-emerald-50 text-emerald-600"
        }`}>
          {isTicketActive ? "TICKET" : "ACTIVO"}
        </div>
      </header>

      {/* LINES */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-2">
        {lines.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-1.5 py-14 text-center">
            <p className="text-[13px] text-[#c0cad4]">Ticket vacío</p>
            <p className="text-[11px] text-[#d1d9e1]">Agregue productos desde el catálogo</p>
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {lines.map((line, idx) => {
              const isSelected = isTicketActive && idx === selectedIdx;
              return (
                <article
                  key={line.lineId}
                  onClick={() => { setSelectedIdx(idx); enterTicket(); }}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 transition-colors ${
                    isSelected
                      ? "bg-[#EDF4FF] ring-1 ring-[#2154d8]/20"
                      : "hover:bg-[#f8fafd]"
                  }`}
                >
                  {/* Name + price */}
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-[13px] font-semibold uppercase tracking-[0.02em] leading-tight ${
                      isSelected ? "text-[#2154d8]" : "text-[#111827]"
                    }`}>
                      {line.description}
                    </p>
                    <p className="text-[11px] text-[#9ca3af]">
                      S/ {line.unitPrice.toFixed(2)}
                    </p>
                  </div>

                  {/* Qty controls */}
                  <div className="flex items-center gap-1">
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
                    <span className="w-6 text-center text-[13px] font-bold text-[#111827]">
                      {line.quantity}
                    </span>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        updateQuantity(line.lineId, line.quantity + 1);
                      }}
                      className="flex h-6 w-6 items-center justify-center rounded-lg text-[15px] font-bold text-[#c0cad4] transition hover:bg-[#f1f5f9] hover:text-[#374151]"
                    >
                      +
                    </button>
                  </div>

                  {/* Subtotal */}
                  <span className="w-16 text-right text-[13px] font-bold text-[#111827]">
                    S/ {line.subtotal.toFixed(2)}
                  </span>

                  {/* Delete */}
                  <button
                    onClick={e => { e.stopPropagation(); removeLine(line.lineId); }}
                    className="shrink-0 rounded-lg p-1 text-[#d1d9e1] transition hover:bg-[#fef2f2] hover:text-red-400"
                  >
                    <Trash2 size={13} />
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {/* STICKY FOOTER */}
      <footer className="shrink-0 border-t border-[#f1f5f9] px-5 py-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[13px] font-medium text-[#6b7280]">Total</span>
          <strong className="text-[22px] font-bold tracking-tight text-[#111827]">
            S/ {total.toFixed(2)}
          </strong>
        </div>

        <button
          onClick={openCobro}
          disabled={lines.length === 0}
          className="w-full rounded-2xl bg-[#2154d8] py-3 text-[14px] font-bold uppercase tracking-widest text-white shadow-[0_4px_14px_rgba(33,84,216,0.22)] transition hover:bg-[#1a43b0] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35 disabled:shadow-none"
        >
          → COBRAR
        </button>
      </footer>
    </section>
  );
}
