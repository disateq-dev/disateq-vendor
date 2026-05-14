import { useState, useRef, useEffect, useCallback } from "react";
import { ScanLine, Search } from "lucide-react";
import { createTicketLine } from "../../domains/ticket/state/ticket.actions";
import { useTicketStore } from "../../domains/ticket/state/ticket.store";
import { useTicketLines } from "../../domains/ticket/selectors/ticket.selectors";
import { usePOS } from "../../context/POSContext";

type StockStatus = "normal" | "low" | "out" | "promo" | "expiring";
type ViewMode = "dense" | "visual";

interface Product {
  id: string;
  name: string;
  short: string;
  price: number;
  code: string;
  color: string;
  accent: string;
  stock: number;
  status: StockStatus;
}

const CATALOG: Product[] = [
  // normal
  { id: "P001", name: "Aceite Vegetal Primor 1L",           short: "Aceite Primor 1L",     price: 12.00, code: "7751234001", color: "#FEF3C7", accent: "#B45309", stock: 45, status: "normal"   },
  { id: "P006", name: "Aceite Capri Vegetal 1L",            short: "Aceite Capri 1L",      price: 11.50, code: "7751234006", color: "#FEFCE8", accent: "#A16207", stock: 22, status: "normal"   },
  { id: "P007", name: "Fideos Don Vittorio Spaghetti 500g", short: "Don Vittorio 500g",    price:  3.20, code: "7751234007", color: "#FFF7ED", accent: "#EA580C", stock: 60, status: "normal"   },
  { id: "P008", name: "Atún Florida en Aceite 170g",        short: "Atún Florida 170g",    price:  4.50, code: "7751234008", color: "#E0F2FE", accent: "#0369A1", stock: 34, status: "normal"   },
  { id: "P016", name: "Gaseosa Inca Kola 1.5L",             short: "Inca Kola 1.5L",       price:  5.50, code: "7751234016", color: "#F7FEE7", accent: "#4D7C0F", stock: 48, status: "normal"   },
  { id: "P017", name: "Gaseosa Coca Cola 1.5L",             short: "Coca Cola 1.5L",       price:  5.80, code: "7751234017", color: "#FFF1F2", accent: "#991B1B", stock: 36, status: "normal"   },
  { id: "P018", name: "Papel Higiénico Elite x4",           short: "Papel Elite x4",       price:  9.90, code: "7751234018", color: "#F0FDF4", accent: "#166534", stock: 20, status: "normal"   },
  { id: "P019", name: "Galletas Soda Field 360g",           short: "Galletas Soda 360g",   price:  3.90, code: "7751234019", color: "#FAFAF9", accent: "#57534E", stock: 55, status: "normal"   },
  { id: "P020", name: "Café Nescafé Classic 200g",          short: "Nescafé Classic 200g", price: 24.50, code: "7751234020", color: "#FFF7ED", accent: "#7C2D12", stock: 12, status: "normal"   },
  // low
  { id: "P002", name: "Arroz Extra Familiar 5KG",           short: "Arroz Extra 5KG",      price: 18.50, code: "7751234002", color: "#ECFDF5", accent: "#065F46", stock:  3, status: "low"      },
  { id: "P009", name: "Arroz Costeño Selecto 1KG",          short: "Arroz Costeño 1KG",    price:  4.20, code: "7751234009", color: "#F0FDF4", accent: "#15803D", stock:  2, status: "low"      },
  { id: "P010", name: "Leche Evaporada Gloria 400g",        short: "Leche Evap. Gloria",   price:  3.80, code: "7751234010", color: "#EFF6FF", accent: "#1D4ED8", stock:  4, status: "low"      },
  // out
  { id: "P003", name: "Leche Gloria Entera 1L",             short: "Leche Gloria 1L",      price:  4.80, code: "7751234003", color: "#F0F9FF", accent: "#075985", stock:  0, status: "out"      },
  { id: "P011", name: "Mantequilla Gloria Con Sal 200g",    short: "Mantequilla Gloria",   price:  7.50, code: "7751234011", color: "#FFFBEB", accent: "#92400E", stock:  0, status: "out"      },
  // promo
  { id: "P004", name: "Azúcar Rubia Cartavio 1KG",          short: "Azúcar Rubia 1KG",     price:  3.50, code: "7751234004", color: "#FFF7ED", accent: "#C2410C", stock: 18, status: "promo"    },
  { id: "P012", name: "Detergente Ariel Limón 2KG",         short: "Ariel Limón 2KG",      price: 16.90, code: "7751234012", color: "#EDE9FE", accent: "#5B21B6", stock: 25, status: "promo"    },
  { id: "P013", name: "Jabón Bolivar Clásico x3",           short: "Jabón Bolivar x3",     price:  5.50, code: "7751234013", color: "#F0F9FF", accent: "#0369A1", stock: 40, status: "promo"    },
  // expiring
  { id: "P005", name: "Huevos Rosados A (30und)",           short: "Huevos Rosados A×30",  price: 22.00, code: "7751234005", color: "#FFE4E6", accent: "#BE123C", stock:  7, status: "expiring" },
  { id: "P014", name: "Pan de Molde Bimbo Blanco 500g",     short: "Pan Bimbo 500g",       price:  6.80, code: "7751234014", color: "#FFFBEB", accent: "#B45309", stock:  5, status: "expiring" },
  { id: "P015", name: "Yogurt Gloria Fresa 1KG",            short: "Yogurt Gloria Fresa",  price:  8.50, code: "7751234015", color: "#FDF2F8", accent: "#9D174D", stock:  6, status: "expiring" },
];

const BEST_SELLERS = new Set(["P001", "P007", "P016", "P017", "P002", "P004", "P019", "P020"]);

function getSubtitle(p: Product): { text: string; cls: string } {
  switch (p.status) {
    case "low":      return { text: `${p.id} · ${p.stock} uds. · ⚠ Stock crítico`,  cls: "text-amber-400"  };
    case "out":      return { text: `${p.id} · ⛔ Sin stock`,                        cls: "text-[#c8d0d8]"  };
    case "promo":    return { text: `${p.id} · ${p.stock} uds. · 🔥 Promoción`,      cls: "text-orange-400" };
    case "expiring": return { text: `${p.id} · ${p.stock} uds. · ⚠ Vence pronto`,   cls: "text-amber-400"  };
    default:         return { text: `${p.id} · ${p.stock} uds. · ✓ Con stock`,      cls: "text-emerald-300" };
  }
}

function tilePrice(p: Product): { prefix: string; cls: string } {
  switch (p.status) {
    case "promo":    return { prefix: "% ", cls: "text-emerald-600" };
    case "expiring": return { prefix: "⏱ ", cls: "text-amber-500"  };
    case "out":      return { prefix: "",   cls: "text-red-400"     };
    default:         return { prefix: "",   cls: "text-[#2154d8]"   };
  }
}

function dotColor(p: Product): string {
  if (p.status === "out")      return "#f87171";
  if (p.status === "low")      return "#fbbf24";
  if (p.status === "promo")    return "#fb923c";
  if (p.status === "expiring") return "#f59e0b";
  return "#34d399";
}

function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function searchCatalog(catalog: Product[], query: string): Product[] {
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

function TileBadge({ p }: { p: Product }) {
  return (
    <div
      className="absolute right-2 top-2 h-2 w-2 rounded-full ring-2 ring-white"
      style={{ backgroundColor: dotColor(p) }}
    />
  );
}

export function SalesWorkspace() {
  const [view, setView] = useState<ViewMode>("dense");
  const [query, setQuery] = useState("");          // controls input value
  const [searchQuery, setSearchQuery] = useState(""); // drives result list
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedItemRef = useRef<HTMLDivElement | null>(null);

  const lines            = useTicketLines();
  const addLine          = useTicketStore(s => s.addLine);
  const removeLine       = useTicketStore(s => s.removeLine);
  const updateQuantity   = useTicketStore(s => s.updateQuantity);
  const openNoteFor      = useTicketStore(s => s.openNoteFor);
  const activeLineIdx    = useTicketStore(s => s.activeLineIdx);
  const setActiveLineIdx = useTicketStore(s => s.setActiveLineIdx);
  const lastLine = useTicketStore(s => {
    const lastId = s.lineOrder[s.lineOrder.length - 1];
    return lastId ? s.linesById[lastId] : null;
  });
  const { enterSearch, cashSession, zone, cobroOpen, closeCobro } = usePOS();

  const isSearching = searchQuery.length >= 1;
  const filtered = isSearching ? searchCatalog(CATALOG, searchQuery) : CATALOG;
  const visualItems = isSearching ? filtered : CATALOG.filter(p => BEST_SELLERS.has(p.id));

  // Focus search input whenever zone returns to "search" — guard against cobro stealing focus
  useEffect(() => {
    if (cobroOpen || zone !== "search") return;
    const t = setTimeout(() => inputRef.current?.focus(), 40);
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

  // F2 global → focus search (blocked when cobro is open)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (cobroOpen) return;
      if (e.key === "F2") {
        e.preventDefault();
        enterSearch();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enterSearch, cobroOpen]);

  // pos:focusSearch — restore focus after note save (blocked when cobro is open)
  useEffect(() => {
    const handler = () => { if (!cobroOpen) inputRef.current?.focus(); };
    document.addEventListener("pos:focusSearch", handler);
    return () => document.removeEventListener("pos:focusSearch", handler);
  }, [cobroOpen]);

  const addProductToTicket = useCallback((p: Product) => {
    if (p.status === "out") return;
    if (cobroOpen) closeCobro();
    addLine(createTicketLine({
      productId: p.id,
      description: p.name,
      barcode: p.code,
      quantity: 1,
      unitPrice: p.price,
    }));
    setQuery("");
    setSearchQuery("");
    inputRef.current?.focus();
  }, [addLine, cobroOpen, closeCobro]);

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
        if (targetLine) updateQuantity(targetLine.lineId, targetLine.quantity + 1);
        break;
      }
      case "-": {
        if (query !== "") break;
        e.preventDefault();
        if (!targetLine) break;
        if (targetLine.quantity > 1) updateQuantity(targetLine.lineId, targetLine.quantity - 1);
        else removeLine(targetLine.lineId);
        break;
      }
      case "Delete": {
        if (query !== "") break;
        e.preventDefault();
        if (targetLine) removeLine(targetLine.lineId);
        break;
      }
      case "ArrowRight": {
        if (query !== "") break;
        e.preventDefault();
        if (targetLine) updateQuantity(targetLine.lineId, targetLine.quantity + 1);
        break;
      }
      case "ArrowLeft": {
        if (query !== "") break;
        e.preventDefault();
        if (!targetLine) break;
        if (targetLine.quantity > 1) updateQuantity(targetLine.lineId, targetLine.quantity - 1);
        else removeLine(targetLine.lineId);
        break;
      }
      case "Insert":
      case "n":
      case "N": {
        if (e.key !== "Insert" && query !== "") break;
        e.preventDefault();
        if (targetLine) openNoteFor(targetLine.lineId);
        break;
      }
    }
  }, [isSearching, filtered, selectedIndex, addProductToTicket, query, lines, activeLineIdx, setActiveLineIdx, lastLine, updateQuantity, removeLine, openNoteFor, cobroOpen]);

  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[#E9E4DC] bg-[#FDFBF7] shadow-[0_4px_18px_rgba(15,23,42,0.04)]">

      {/* TOOLBAR — Visual mode */}
      {view === "visual" && (
        <div className="flex shrink-0 items-center gap-2 border-b border-[#E9E4DC] px-5 py-3.5">
          <div className="flex items-center gap-1.5">
            <button className="rounded-2xl bg-[#2154d8] px-4 py-2 text-[13px] font-semibold text-white shadow-[0_2px_8px_rgba(33,84,216,0.18)]">
              General
            </button>
            <button className="rounded-2xl border border-[#e4e7ec] px-4 py-2 text-[13px] font-medium text-[#475467] transition hover:border-[#d0d5dd] hover:text-[#111827]">
              Productos
            </button>
            <button className="rounded-2xl border border-[#e4e7ec] px-4 py-2 text-[13px] font-medium text-[#475467] transition hover:border-[#d0d5dd] hover:text-[#111827]">
              Servicios
            </button>
          </div>
          <div className="flex-1" />
          <div className="flex items-center gap-1 rounded-xl bg-[#f1f5f9] p-1">
            <button
              onClick={() => setView("dense")}
              className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-[#64748b] transition hover:text-[#111827]"
            >
              Lista
            </button>
            <button className="rounded-lg bg-white px-3 py-1.5 text-[12px] font-semibold text-[#111827] shadow-sm">
              Visual
            </button>
          </div>
        </div>
      )}

      {/* SEARCH ROW */}
      <div className="flex shrink-0 h-[52px] items-center gap-3 border-b border-[#E9E4DC] px-5">
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
          className="w-full bg-transparent text-[14px] text-[#111827] outline-none placeholder:text-[#b8c4cf]"
          autoComplete="off"
        />

        <div className="h-4 w-px shrink-0 bg-[#eaecf0]" />

        <button className="shrink-0 rounded-lg p-1.5 text-[#c0cad4] transition hover:bg-[#f4f7fb] hover:text-[#6b7280]">
          <ScanLine size={16} />
        </button>

        {view === "dense" && (
          <div className="flex shrink-0 items-center gap-1 rounded-xl bg-[#f1f5f9] p-1">
            <button className="rounded-lg bg-white px-3 py-1.5 text-[12px] font-semibold text-[#111827] shadow-sm">
              Lista
            </button>
            <button
              onClick={() => setView("visual")}
              className="rounded-lg px-3 py-1.5 text-[12px] font-semibold text-[#64748b] transition hover:text-[#111827]"
            >
              Visual
            </button>
          </div>
        )}
      </div>

      {/* RESULTS */}
      <div className="min-h-0 flex-1 overflow-y-auto">

        {/* ── DENSE MODE ── */}
        {view === "dense" && (
          <>
            {!isSearching && (
              <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
                <Search size={26} className="text-[#dce3ea]" />
                <p className="mt-1 text-[13px] font-medium text-[#b0bac8]">
                  Escriba nombre, código o referencia para localizar productos rápidamente.
                </p>
                {!cashSession.isOpen && (
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-amber-400">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                    Sin turno activo · cobro deshabilitado
                  </p>
                )}
              </div>
            )}

            {isSearching && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
                <p className="text-[13px] font-medium text-[#b0bac8]">
                  Sin resultados para «{searchQuery}»
                </p>
              </div>
            )}

            {isSearching && filtered.length > 0 && (
              <div className="flex flex-col px-3 py-2">
                {filtered.map((product, idx) => {
                  const sub = getSubtitle(product);
                  const isOut = product.status === "out";
                  const isSelected = idx === selectedIndex;

                  return (
                    <div
                      key={product.id}
                      ref={idx === selectedIndex ? selectedItemRef : null}
                      onClick={() => addProductToTicket(product)}
                      className={`flex cursor-pointer items-center justify-between rounded-2xl px-4 py-3 transition ${
                        isSelected
                          ? "bg-[#EDF4FF] ring-1 ring-[#2154d8]/20"
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
                              isSelected ? "text-[#2154d8]" : isOut ? "text-[#9ca3af]" : "text-[#2F3E46]"
                            }`}
                          >
                            {product.name}
                          </div>
                          <div className={`mt-0.5 text-[11px] font-medium ${sub.cls}`}>
                            {sub.text}
                          </div>
                        </div>
                      </div>

                      <div className="ml-4 flex shrink-0 items-center gap-3">
                        <span className="text-[14px] font-semibold text-[#2F3E46]">
                          S/ {product.price.toFixed(2)}
                        </span>

                        <button
                          onClick={e => { e.stopPropagation(); addProductToTicket(product); }}
                          className={`rounded-xl px-3.5 py-1.5 text-[12px] font-semibold transition ${
                            isSelected
                              ? "bg-[#2154d8] text-white hover:bg-[#1a43b0]"
                              : "bg-[#edf4ff] text-[#2154d8] hover:bg-[#dbeafe]"
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
            {isSearching && filtered.length === 0 && (
              <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
                <p className="text-[13px] font-medium text-[#b0bac8]">
                  Sin resultados para «{searchQuery}»
                </p>
              </div>
            )}

            {(!isSearching || visualItems.length > 0) && (
              <>
                {!isSearching && (
                  <p className="px-5 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-widest text-[#c0cad4]">
                    Más vendidos
                  </p>
                )}
                <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-x-3 gap-y-2 p-4 pt-2">
                  {visualItems.map((product) => {
                    const isOut = product.status === "out";
                    const price = tilePrice(product);

                    return (
                      <button
                        key={product.id}
                        onClick={() => addProductToTicket(product)}
                        className={`overflow-hidden rounded-2xl bg-[#FDFBF7] text-left shadow-[0_1px_3px_rgba(15,23,42,0.06)] transition hover:shadow-[0_4px_14px_rgba(33,84,216,0.09)] ${
                          isOut
                            ? "border border-[#fef2f2] hover:border-[#fecaca]"
                            : "border border-[#f0f4f9] hover:border-[#c7d7f4]"
                        }`}
                        style={isOut ? { opacity: 0.54 } : undefined}
                      >
                        <div className="relative h-[52px]" style={{ backgroundColor: product.color }}>
                          <TileBadge p={product} />
                        </div>
                        <div className="p-2.5">
                          <p className="line-clamp-1 text-[12px] font-semibold uppercase tracking-[0.02em] leading-tight text-[#2F3E46]">
                            {product.short}
                          </p>
                          <p className={`mt-1 text-[13px] font-bold ${price.cls}`}>
                            {price.prefix}S/ {product.price.toFixed(2)}
                          </p>
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
