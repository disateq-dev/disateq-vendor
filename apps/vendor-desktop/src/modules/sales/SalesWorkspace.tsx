import { useState, useRef, useEffect, useCallback } from "react";
import { ScanLine, Search, CircleCheck, AlertTriangle, CircleX, Tag, Clock } from "lucide-react";
import { useTicketStore } from "../../domains/ticket/state/ticket.store";
import { useTicketLines } from "../../domains/ticket/selectors/ticket.selectors";
import { ticketService } from "../../domains/ticket/services/ticket.service";
import { usePOS } from "../../context/POSContext";
import { RUBROS, type CatalogProduct } from "../../data/catalogs";

function statusChip(p: CatalogProduct) {
  if (p.status === "low")      return <span className="flex items-center gap-0.5 text-amber-500"><AlertTriangle size={10} strokeWidth={2} />Stock crítico</span>;
  if (p.status === "out")      return <span className="flex items-center gap-0.5 text-red-400"><CircleX size={10} strokeWidth={2} />Sin stock</span>;
  if (p.status === "promo")    return <span className="flex items-center gap-0.5 text-orange-500"><Tag size={10} strokeWidth={2} />Promoción</span>;
  if (p.status === "expiring") return <span className="flex items-center gap-0.5 text-amber-400"><Clock size={10} strokeWidth={2} />Vence pronto</span>;
  return <span className="flex items-center gap-0.5 text-[#45b356]"><CircleCheck size={10} strokeWidth={2} />Con stock</span>;
}

function tilePrice(p: CatalogProduct): { prefix: string; cls: string } {
  switch (p.status) {
    case "promo":    return { prefix: "% ", cls: "text-emerald-600" };
    case "expiring": return { prefix: "⏱ ", cls: "text-amber-500"  };
    case "out":      return { prefix: "",   cls: "text-red-400"     };
    default:         return { prefix: "",   cls: "text-[#2d4f6b]"   };
  }
}

function dotColor(p: CatalogProduct): string {
  if (p.status === "out")      return "#f87171";
  if (p.status === "low")      return "#fbbf24";
  if (p.status === "promo")    return "#fb923c";
  if (p.status === "expiring") return "#f59e0b";
  return "#34d399";
}

function safeCalc(expr: string): number | null {
  const s = expr.trim().replace(/\s+/g, "");
  if (!s) return null;
  if (!/^[0-9+\-*/.]+$/.test(s)) return null;
  const parts = s.match(/[+\-*/]|[0-9]*\.?[0-9]+/g);
  if (!parts) return null;
  const nums: number[] = [];
  const ops:  string[] = [];
  for (const p of parts) {
    if (/^[+\-*/]$/.test(p)) { ops.push(p); }
    else { const n = parseFloat(p); if (isNaN(n)) return null; nums.push(n); }
  }
  if (!nums.length || nums.length !== ops.length + 1) return null;
  let i = 0;
  while (i < ops.length) {
    if (ops[i] === "*" || ops[i] === "/") {
      if (ops[i] === "/" && nums[i + 1] === 0) return null;
      const r = ops[i] === "*" ? nums[i] * nums[i + 1] : nums[i] / nums[i + 1];
      if (!isFinite(r)) return null;
      nums.splice(i, 2, Math.round(r * 10000) / 10000);
      ops.splice(i, 1);
    } else { i++; }
  }
  let result = nums[0];
  for (let j = 0; j < ops.length; j++)
    result = ops[j] === "+" ? result + nums[j + 1] : result - nums[j + 1];
  const rounded = Math.round(result * 100) / 100;
  return isFinite(rounded) && rounded >= 0 ? rounded : null;
}

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function searchCatalog(catalog: CatalogProduct[], query: string): CatalogProduct[] {
  const q = normalize(query);
  if (!q) return catalog;
  const tokens = q.split(/\s+/).filter(Boolean);
  const seen = new Set<string>();
  const results: Product[] = [];

  for (const p of catalog) {
    const n = normalize(p.name);
    if (n.startsWith(q) || normalize(p.id).startsWith(q) || p.code.startsWith(q)) {
      results.push(p); seen.add(p.id);
    }
  }
  for (const p of catalog) {
    if (seen.has(p.id)) continue;
    if (normalize(p.name).split(" ").some(w => w.startsWith(q))) {
      results.push(p); seen.add(p.id);
    }
  }
  for (const p of catalog) {
    if (seen.has(p.id)) continue;
    const n = normalize(p.name);
    if (n.includes(q) || normalize(p.id).includes(q) || p.code.includes(q)) {
      results.push(p); seen.add(p.id);
    }
  }
  if (tokens.length > 1) {
    for (const p of catalog) {
      if (seen.has(p.id)) continue;
      const n = normalize(p.name);
      if (tokens.every(t => n.includes(t))) { results.push(p); seen.add(p.id); }
    }
  }

  return results;
}

import type { VisualMode } from "../../data/catalogs";

const VIEW_OPTS: { id: VisualMode; label: string }[] = [
  { id: "lista",  label: "Lista"   },
  { id: "visual", label: "Visual"  },
  { id: "mixto",  label: "Mixto"   },
];

function ViewToggle({ current, onChange }: { current: VisualMode; onChange: (m: VisualMode) => void }) {
  return (
    <div className="flex items-center gap-px rounded-xl bg-[#f1f5f9] p-1 shrink-0">
      {VIEW_OPTS.map(opt => (
        <button
          key={opt.id}
          onClick={() => onChange(opt.id)}
          className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition ${
            current === opt.id
              ? "bg-white text-[#111827] shadow-sm"
              : "text-[#64748b] hover:text-[#111827]"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function TileBadge({ p }: { p: CatalogProduct }) {
  return (
    <div
      className="absolute right-2 top-2 h-2 w-2 rounded-full ring-2 ring-white"
      style={{ backgroundColor: dotColor(p) }}
    />
  );
}

export function SalesWorkspace() {
  const { enterSearch, cashSession, zone, cobroOpen, closeCobro, openCobro, rubro, visualMode, setVisualMode } = usePOS();
  const rubroConfig = RUBROS[rubro];

  // "mixto" renders as visual for now — a split layout can be explored in runtime validation
  const view = visualMode === "lista" ? "dense" : "visual";

  const [visualCategory, setVisualCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedItemRef = useRef<HTMLDivElement | null>(null);

  const lines            = useTicketLines();
  const activeLineIdx    = useTicketStore(s => s.activeLineIdx);
  const setActiveLineIdx = useTicketStore(s => s.setActiveLineIdx);
  const lastLine = useTicketStore(s => {
    const lastId = s.lineOrder[s.lineOrder.length - 1];
    return lastId ? s.linesById[lastId] : null;
  });

  // Reset category filter when rubro changes
  useEffect(() => {
    setVisualCategory("all");
    setQuery("");
    setSearchQuery("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rubro]);

  const catalog = rubroConfig.catalog;

  const isCalcMode  = /^[0-9+\-*/.]+$/.test(query.trim()) && /[+\-*/]/.test(query.trim());
  const calcResult  = isCalcMode ? safeCalc(query) : null;

  const isSearching   = searchQuery.length >= 1;
  const filtered      = isSearching ? searchCatalog(catalog, searchQuery) : catalog;
  const visualCatalog = isSearching ? filtered : catalog;
  const visualItems   = visualCategory === "all"
    ? visualCatalog
    : visualCatalog.filter(p => p.category === visualCategory);

  // Mount — scanner readiness on every runtime re-entry (CASH/CONFIG/COMP → VENTAS)
  // inputRef is stable so [] is correct; fires even when zone/cobroOpen haven't changed value
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Zone transition — focus when returning from cobro or ticket zone
  useEffect(() => {
    if (cobroOpen || zone !== "search") return;
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [zone, cobroOpen]);

  // Auto-select first result when search changes
  useEffect(() => {
    setSelectedIndex(isSearching && filtered.length > 0 ? 0 : -1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Scroll selected item into view on navigation
  useEffect(() => {
    selectedItemRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  // F2/F4/F9 — scoped to VENTAS mount (no collision with CashWorkspace F4)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (cobroOpen) return;
      if (e.key === "F2") {
        e.preventDefault();
        enterSearch();
        inputRef.current?.focus();
      }
      if (e.key === "F4") {
        e.preventDefault();
        openCobro();
      }
      if (e.key === "F9") {
        e.preventDefault();
        if (lines.length > 0) openCobro();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enterSearch, cobroOpen, lines.length, openCobro]);

  // pos:focusSearch — restore focus after note save (blocked when cobro is open)
  useEffect(() => {
    const handler = () => { if (!cobroOpen) inputRef.current?.focus(); };
    document.addEventListener("pos:focusSearch", handler);
    return () => document.removeEventListener("pos:focusSearch", handler);
  }, [cobroOpen]);

  const addProductToTicket = useCallback((p: CatalogProduct) => {
    if (p.status === "out") return;
    if (cobroOpen) closeCobro();
    ticketService.addProduct({
      productId: p.id,
      description: p.name,
      barcode: p.code,
      unitPrice: p.price,
    });
    setQuery("");
    setSearchQuery("");
    inputRef.current?.focus();
  }, [cobroOpen, closeCobro]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (cobroOpen) return;
    // Helper: target line for operations — active (navigated) or fallback to last
    const targetLine = activeLineIdx >= 0 ? lines[activeLineIdx] : lastLine;

    switch (e.key) {
      case "ArrowDown":
        if (isSearching) {
          e.preventDefault();
          setSelectedIndex(i => i + 1 >= filtered.length ? 0 : i + 1);
        } else if (lines.length > 0) {
          e.preventDefault();
          setActiveLineIdx(activeLineIdx < 0 ? 0 : activeLineIdx + 1 >= lines.length ? 0 : activeLineIdx + 1);
        }
        break;
      case "ArrowUp":
        if (isSearching) {
          e.preventDefault();
          setSelectedIndex(i => i <= 0 ? filtered.length - 1 : i - 1);
        } else if (lines.length > 0) {
          e.preventDefault();
          setActiveLineIdx(activeLineIdx <= 0 ? lines.length - 1 : activeLineIdx - 1);
        }
        break;
      case "Enter": {
        if (isSearching) {
          e.preventDefault();
          const product = selectedIndex >= 0 ? filtered[selectedIndex] : filtered[0];
          if (product) addProductToTicket(product);
        } else if (activeLineIdx >= 0) {
          e.preventDefault();
          setActiveLineIdx(-1); // clear ticket navigation, return to search
        }
        break;
      }
      case "Escape":
        e.preventDefault();
        setActiveLineIdx(-1);
        setQuery("");
        setSearchQuery("");
        setSelectedIndex(-1);
        break;
      case "Tab":
        e.preventDefault(); // keep focus on search input
        break;
      // Line operations — only when input is empty
      case "+":
      case "*": {
        if (query !== "") break;
        e.preventDefault();
        if (targetLine) ticketService.incrementLine(targetLine.lineId);
        break;
      }
      case "-": {
        if (query !== "") break;
        e.preventDefault();
        if (targetLine) ticketService.decrementLine(targetLine.lineId);
        break;
      }
      case "Delete": {
        if (query !== "") break;
        e.preventDefault();
        if (targetLine) ticketService.removeLine(targetLine.lineId);
        break;
      }
      case "ArrowRight": {
        if (query !== "") break;
        e.preventDefault();
        if (targetLine) ticketService.incrementLine(targetLine.lineId);
        break;
      }
      case "ArrowLeft": {
        if (query !== "") break;
        e.preventDefault();
        if (targetLine) ticketService.decrementLine(targetLine.lineId);
        break;
      }
      case "Insert":
      case "n":
      case "N": {
        if (e.key !== "Insert" && query !== "") break;
        e.preventDefault();
        if (targetLine) ticketService.openLineNote(targetLine.lineId);
        break;
      }
    }
  }, [isSearching, filtered, selectedIndex, addProductToTicket, query, lines, activeLineIdx, setActiveLineIdx, lastLine, cobroOpen]);

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[#4F7396]/50 bg-[#FDFCF9]">

      {/* TOOLBAR — Visual mode */}
      {view === "visual" && (
        <div className="flex shrink-0 items-center gap-2 border-b border-[#f1f5f9] px-4 py-3">
          <div className="flex items-center gap-1 flex-wrap">
            {rubroConfig.categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => setVisualCategory(cat.id)}
                className={`rounded-xl px-3 py-1.5 text-[12px] font-semibold transition ${
                  visualCategory === cat.id
                    ? "bg-[#4F7396] text-white shadow-[0_2px_8px_rgba(79,115,150,0.20)]"
                    : "border border-[#e4e7ec] text-[#475467] hover:border-[#d0d5dd] hover:text-[#111827]"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <ViewToggle current={visualMode} onChange={setVisualMode} />
        </div>
      )}

      {/* SEARCH ROW */}
      <div className="flex shrink-0 h-[52px] items-center gap-3 border-b border-[#e4e9f0] bg-white px-4">
        <Search size={17} className="shrink-0 text-[#2154d8]" />

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => {
            const v = e.target.value;
            setQuery(v);
            setSearchQuery(v.trim());
          }}
          onKeyDown={handleKeyDown}
          onFocus={() => enterSearch()}
          placeholder="Buscar producto por nombre, código o barra..."
          className="min-w-0 flex-1 bg-transparent text-[14px] text-[#111827] outline-none placeholder:text-[#b8c4cf]"
          autoComplete="off"
        />

        {!cashSession.isOpen && (
          <span className="flex shrink-0 items-center gap-1.5 rounded-xl bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-500">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
            Sin turno
          </span>
        )}

        <div className="h-4 w-px shrink-0 bg-[#eaecf0]" />

        <button className="shrink-0 rounded-lg p-1.5 text-[#c0cad4] transition hover:bg-[#f4f7fb] hover:text-[#6b7280]">
          <ScanLine size={16} />
        </button>

        {view === "dense" && <ViewToggle current={visualMode} onChange={setVisualMode} />}
      </div>

      {/* CALC RESULT — debajo de la barra, como en el cierre */}
      {calcResult !== null && (
        <div className="shrink-0 flex items-center gap-2 border-b border-[#edf2f8] bg-[#f8fafd] px-5 py-1.5">
          <span className="text-[10px] font-semibold text-[#9ca3af]">=</span>
          <span className="font-mono text-[14px] font-bold tabular-nums text-[#2154d8]">S/ {calcResult.toFixed(2)}</span>
        </div>
      )}

      {/* RESULTS */}
      <div className="min-h-0 flex-1 overflow-y-auto">

        {/* ── DENSE MODE ── */}
        {view === "dense" && (
          <>
            {!isSearching && (
              <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
                <Search size={26} className="text-[#dce3ea]" />
                <p className="mt-1 text-[13px] font-semibold text-[#b0bac8]">
                  Escriba nombre, código o referencia para localizar productos rápidamente.
                </p>
                {!cashSession.isOpen && (
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-amber-400">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                    Sin turno operativo · cobro deshabilitado
                  </p>
                )}
              </div>
            )}

            {isSearching && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
                <p className="text-[13px] font-semibold text-[#b0bac8]">
                  Sin resultados para «{searchQuery}»
                </p>
              </div>
            )}

            {isSearching && filtered.length > 0 && (
              <div className="flex flex-col px-3 py-2">
                <p className="px-1 pb-1 pt-0 text-[10px] font-bold uppercase tracking-widest text-[#c0cad4]">
                  {filtered.length} resultado{filtered.length !== 1 ? "s" : ""}
                </p>
                {filtered.map((product, idx) => {
                  const isOut = product.status === "out";
                  const isSelected = idx === selectedIndex;

                  return (
                    <div
                      key={product.id}
                      ref={idx === selectedIndex ? selectedItemRef : null}
                      onClick={() => addProductToTicket(product)}
                      className={`flex cursor-pointer items-center justify-between rounded-2xl px-4 py-3 transition ${
                        isSelected
                          ? "bg-[#EEF3F8] ring-1 ring-[#4F7396]/25"
                          : "hover:bg-[#f4f7fb]"
                      }`}
                      style={isOut ? { opacity: 0.56 } : undefined}
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className="h-2.5 w-2.5 shrink-0 rounded-full"
                          style={{ backgroundColor: dotColor(product) }}
                        />
                        <div className="min-w-0">
                          <div
                            className={`truncate text-[14px] font-bold uppercase tracking-[0.025em] leading-tight ${
                              isSelected ? "text-[#2d4f6b]" : isOut ? "text-[#9ca3af]" : "text-[#2F3E46]"
                            }`}
                          >
                            {product.name}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold">
                            <span className="tabular-nums text-[#374151]">
                              {product.id}{!isOut ? ` · ${product.stock} uds.` : ""}
                            </span>
                            <span className="text-[#d1d9e1]">·</span>
                            {statusChip(product)}
                          </div>
                        </div>
                      </div>

                      <div className="ml-4 flex shrink-0 items-center gap-3">
                        <span className="text-[14px] font-semibold text-[#2F3E46]">
                          S/ {product.price.toFixed(2)}
                        </span>

                        <button
                          title="Tecla [Enter]"
                          onClick={e => { e.stopPropagation(); addProductToTicket(product); }}
                          className={`rounded-xl px-3.5 py-1.5 text-[12px] font-semibold transition ${
                            isSelected
                              ? "bg-[#4F7396] text-white hover:bg-[#3d5c7a]"
                              : "bg-[#EEF3F8] text-[#2d4f6b] hover:bg-[#e0e9f0]"
                          }`}
                        >
                          Agregar
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ── VISUAL MODE ── */}
        {view === "visual" && (
          <>
            {visualItems.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
                <p className="text-[13px] font-semibold text-[#b0bac8]">
                  {isSearching ? `Sin resultados para «${searchQuery}»` : "Sin productos en esta categoría"}
                </p>
              </div>
            )}

            {visualItems.length > 0 && (
              <>
                <p className="px-4 pb-0.5 pt-3 text-[10px] font-bold uppercase tracking-widest text-[#c0cad4]">
                  {isSearching
                    ? `${visualItems.length} resultado${visualItems.length !== 1 ? "s" : ""}`
                    : visualCategory === "all"
                      ? "Todos los productos"
                      : (rubroConfig.categories.find(c => c.id === visualCategory)?.label ?? visualCategory)
                  }
                </p>
                <div className="grid grid-cols-[repeat(auto-fill,minmax(112px,1fr))] gap-2 px-3 pb-3 pt-1">
                  {visualItems.map((product) => {
                    const isOut  = product.status === "out";
                    const price  = tilePrice(product);

                    return (
                      <button
                        key={product.id}
                        onClick={() => addProductToTicket(product)}
                        disabled={isOut}
                        className={`overflow-hidden rounded-2xl bg-white text-left transition active:scale-[0.96] ${
                          isOut
                            ? "border border-[#fef2f2] opacity-50 cursor-not-allowed shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
                            : "border border-[#eef2f8] shadow-[0_1px_4px_rgba(15,23,42,0.07)] hover:border-[#c7d7f4] hover:shadow-[0_4px_14px_rgba(33,84,216,0.10)] cursor-pointer"
                        }`}
                      >
                        <div
                          className="relative flex items-center justify-center h-[68px]"
                          style={{ backgroundColor: product.color }}
                        >
                          <span className="text-[38px] leading-none select-none">{product.emoji}</span>
                          <TileBadge p={product} />
                        </div>
                        <div className="px-2.5 pt-2 pb-2.5">
                          <p className="line-clamp-2 text-[11px] font-bold uppercase tracking-[0.025em] leading-snug text-[#2F3E46]">
                            {product.short}
                          </p>
                          <p className={`mt-1.5 text-[13px] font-extrabold tabular-nums ${price.cls}`}>
                            {price.prefix}S/ {product.price.toFixed(2)}
                          </p>
                          {product.status !== "normal" && (
                            <div className="mt-1.5 text-[10px] leading-none">{statusChip(product)}</div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </>
        )}

      </div>
    </section>
  );
}
