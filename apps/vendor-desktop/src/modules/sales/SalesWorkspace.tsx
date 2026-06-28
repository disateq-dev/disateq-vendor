import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { ScanLine, Search, CircleCheck, AlertTriangle, CircleX } from "lucide-react";
import { usePreVentaStore } from "../../domains/preventa/state/preventa.store";
import { useLineasPreVenta } from "../../domains/preventa/selectors/preventa.selectors";
import { preVentaService } from "../../domains/preventa/services/preventa.service";
import { usePOS } from "../../context/POSContext";
import { getHOVById } from "../../domains/catalog/hov.store";
import {
  agruparPorProducto,
  obtenerProductosBuscables,
  type GrupoProducto,
  type ProductoBuscable
} from "../../domains/catalog/bridge-catalogo";
import type { TipoValorOperacional } from "../../domains/catalog/valor-operacional.types";
import { loadBusinessConfig } from "../../config/business";
import { RUBROS } from "../../data/catalogs";
import { PresentacionSheet } from "./PresentacionSheet";
import { ConfirmacionRecetaPanel } from "./components/ConfirmacionRecetaPanel";

function statusChip(p: ProductoBuscable) {
  if (p.stockStatus === "low") return <span className="flex items-center gap-0.5 text-amber-500"><AlertTriangle size={10} strokeWidth={2} />Queda poco</span>;
  if (p.stockStatus === "out") return <span className="flex items-center gap-0.5 text-red-400"><CircleX size={10} strokeWidth={2} />Sin unidades</span>;
  return <span className="flex items-center gap-0.5 text-[#45b356]"><CircleCheck size={10} strokeWidth={2} />Disponible</span>;
}

function tilePrice(p: ProductoBuscable): { prefix: string; cls: string } {
  if (p.stockStatus === "out") return { prefix: "", cls: "text-red-400" };
  return { prefix: "", cls: "text-[#2d4f6b]" };
}

function dotColor(p: ProductoBuscable): string {
  if (p.stockStatus === "out") return "#f87171";
  if (p.stockStatus === "low") return "#fbbf24";
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

function searchCatalog(
  productos: ProductoBuscable[],
  query: string
): ProductoBuscable[] {
  // Búsqueda exacta por código de barras (pistola o teclado)
  const trimmed = query.trim();
  if (trimmed.length >= 4) {
    const exactBarcode = productos.find(p => p.barcode === trimmed);
    if (exactBarcode) return [exactBarcode];
  }

  const q = normalize(query);
  if (!q) return productos;
  const tokens = q.split(/\s+/).filter(Boolean);
  const seen = new Set<string>();
  const results: ProductoBuscable[] = [];

  for (const p of productos) {
    const n = normalize(p.description);
    if (n.startsWith(q) || normalize(p.id).startsWith(q) || normalize(p.dciTexto ?? '').startsWith(q)) {
      results.push(p); seen.add(p.id);
    }
  }
  for (const p of productos) {
    if (seen.has(p.id)) continue;
    if (normalize(p.description).split(" ").some(w => w.startsWith(q)) || normalize(p.dciTexto ?? '').split(' ').some(w => w.startsWith(q))) {
      results.push(p); seen.add(p.id);
    }
  }
  for (const p of productos) {
    if (seen.has(p.id)) continue;
    const n = normalize(p.description);
    if (n.includes(q) || normalize(p.id).includes(q) || normalize(p.dciTexto ?? '').includes(q)) {
      results.push(p); seen.add(p.id);
    }
  }
  if (tokens.length > 1) {
    for (const p of productos) {
      if (seen.has(p.id)) continue;
      const n = normalize(p.description);
      if (tokens.every(t => n.includes(t)) || tokens.every(t => normalize(p.dciTexto ?? '').includes(t))) {
        results.push(p); seen.add(p.id);
      }
    }
  }
  return results;
}

type POSRuntimeContext = ReturnType<typeof usePOS> & {
  contextoOperacionalId?: string;
  identidadOperacionalId?: string;
  operadorActivo?: { id?: string };
};

function TileBadge({ p }: { p: ProductoBuscable }) {
  return (
    <div
      className="absolute right-2 top-2 h-2 w-2 rounded-full ring-2 ring-white"
      style={{ backgroundColor: dotColor(p) }}
    />
  );
}

export function SalesWorkspace() {
  const posContext = usePOS() as POSRuntimeContext;
  const { enterSearch, cashSession, zone, cobroOpen, closeCobro, openCobro, visualMode } = posContext;
  const rubroConfig = useMemo(() => {
    const bc = loadBusinessConfig();
    return RUBROS[bc.rubro];
  }, []);

  const view = visualMode === "lista" ? "dense" : "visual";

  const [visualCategory, setVisualCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [isFocused, setIsFocused] = useState(false);
  const [lastAdded, setLastAdded] = useState<string | null>(null);
  const [grupoActivo, setGrupoActivo] = useState<GrupoProducto | null>(null);
  const [confirmaReceta, setConfirmaReceta] = useState<{ producto: ProductoBuscable; condicion: "CON_RECETA" | "CONTROLADO" } | null>(null);
  const [puedeEditarPrecio] = useState<boolean>(false);
  const lastAddedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedItemRef = useRef<HTMLDivElement | null>(null);

  const lines                 = useLineasPreVenta();
  const indiceLineaActiva     = usePreVentaStore(s => s.indiceLineaActiva);
  const setIndiceLineaActiva  = usePreVentaStore(s => s.setIndiceLineaActiva);
  const lastLine = usePreVentaStore(s => {
    const lastId = s.lineOrder[s.lineOrder.length - 1];
    return lastId ? s.linesById[lastId] : null;
  });

  const catalogoActivo = useMemo(() =>
    obtenerProductosBuscables(
      posContext.contextoOperacionalId ?? "default",
      posContext.identidadOperacionalId ?? "default",
      posContext.operadorActivo?.id ?? "default"
    ),
    [posContext.contextoOperacionalId,
     posContext.identidadOperacionalId,
     posContext.operadorActivo?.id]
  );

  // Reset category filter when catalog changes
  useEffect(() => {
    setVisualCategory("all");
    setQuery("");
    setSearchQuery("");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalogoActivo]);

  const isCalcMode  = /^[0-9+\-*/.]+$/.test(query.trim()) && /[+\-*/]/.test(query.trim());
  const calcResult  = isCalcMode ? safeCalc(query) : null;

  const isSearching   = !isCalcMode && searchQuery.length >= 1;
  const filtered      = isSearching ? searchCatalog(catalogoActivo, searchQuery) : catalogoActivo;
  const visualCatalog = isSearching ? filtered : catalogoActivo;
  const visualItems   = visualCategory === "all"
    ? visualCatalog
    : visualCatalog.filter(p => p.category === visualCategory);

  // Mount — scanner readiness on every runtime re-entry (CASH/CONFIG/COMP → VENTAS)
  // inputRef is stable so [] is correct; fires even when zone/cobroOpen haven't changed value
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Cobro close — restore scanner/search focus
  useEffect(() => {
    if (cobroOpen) return;
    const t = setTimeout(() => inputRef.current?.focus(), 80);
    return () => clearTimeout(t);
  }, [cobroOpen]);

  // Auto-select first result when search changes
  useEffect(() => {
    setSelectedIndex(isSearching && filtered.length > 0 ? 0 : -1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery]);

  // Scroll selected item into view on navigation
  useEffect(() => {
    selectedItemRef.current?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  // F2 / Ctrl+Enter / F9 — scoped to VENTAS mount
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (cobroOpen) return;
      if (e.key === "F2" && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        enterSearch();
        inputRef.current?.focus();
      }
      if (e.ctrlKey && e.key === "Enter") {
        e.preventDefault();
        openCobro();
      }

    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enterSearch, cobroOpen, openCobro]);

  // pos:focusSearch — restore focus after note save (blocked when cobro is open)
  useEffect(() => {
    const handler = () => { if (!cobroOpen) inputRef.current?.focus(); };
    document.addEventListener("pos:focusSearch", handler);
    return () => document.removeEventListener("pos:focusSearch", handler);
  }, [cobroOpen]);

  // Limpiar timer lastAdded en unmount
  useEffect(() => {
    return () => {
      if (lastAddedTimerRef.current) clearTimeout(lastAddedTimerRef.current);
    };
  }, []);

  const addProductToTicket = useCallback((p: ProductoBuscable) => {
    if (p.stockStatus === "out") return;
    if (p.condicionVenta === "CON_RECETA" || p.condicionVenta === "CONTROLADO") {
      setConfirmaReceta({ producto: p, condicion: p.condicionVenta });
      return;
    }
    if (cobroOpen) closeCobro();
    const hov = getHOVById(p.hovId);
    const productoId = hov?.productoId ?? p.hovId;
    const grupo = agruparPorProducto(catalogoActivo).find(g => g.productoId === productoId);
    if (grupo && grupo.formasVenta.length > 1) {
      setGrupoActivo(grupo);
      return;
    }
    preVentaService.agregarProductoDesdeHOV({
      hovId: p.hovId,
      descripcion: p.description,
      cantidad: 1,
      valorUnitario: p.unitPrice,
      presentacion: p.presentacion,
      factorConversion: p.factorConversion,
      requiereValorManual: p.requiereValorManual,
      contextoOperacionalId: posContext.contextoOperacionalId ?? "default",
      identidadOperacionalId: posContext.identidadOperacionalId ?? "default",
      operadorId: posContext.operadorActivo?.id ?? "default",
      margenMinimoConfigurable: 0.15,
      operadorTieneCapacidadLibre: false,
    });
    if (lastAddedTimerRef.current) clearTimeout(lastAddedTimerRef.current);
    setLastAdded(p.hovId);
    lastAddedTimerRef.current = setTimeout(() => setLastAdded(null), 600);
    setQuery("");
    setSearchQuery("");
    inputRef.current?.focus();
  }, [catalogoActivo, cobroOpen, closeCobro, posContext]);

  const handleConfirmarForma = useCallback((hovId: string, valorFinal: number, tipoValor: TipoValorOperacional | null) => {
    void tipoValor;
    const hov = getHOVById(hovId);
    const producto = catalogoActivo.find(p => p.hovId === hovId);
    if (!hov || !producto) return;
    preVentaService.agregarProductoDesdeHOV({
      hovId,
      descripcion: producto.description,
      cantidad: 1,
      valorUnitario: valorFinal,
      presentacion: producto.presentacion,
      factorConversion: producto.factorConversion,
      requiereValorManual: producto.requiereValorManual,
      contextoOperacionalId: posContext.contextoOperacionalId ?? "default",
      identidadOperacionalId: posContext.identidadOperacionalId ?? "default",
      operadorId: posContext.operadorActivo?.id ?? "default",
      margenMinimoConfigurable: 0.15,
      operadorTieneCapacidadLibre: false,
    });
    setGrupoActivo(null);
    setQuery("");
    setSearchQuery("");
    inputRef.current?.focus();
  }, [catalogoActivo, posContext]);

  const handleConfirmarReceta = useCallback(() => {
    if (confirmaReceta === null) return;
    preVentaService.agregarProductoDesdeHOV({
      hovId: confirmaReceta.producto.hovId,
      descripcion: confirmaReceta.producto.description,
      cantidad: 1,
      valorUnitario: confirmaReceta.producto.unitPrice,
      presentacion: confirmaReceta.producto.presentacion,
      factorConversion: confirmaReceta.producto.factorConversion,
      requiereValorManual: confirmaReceta.producto.requiereValorManual,
      contextoOperacionalId: posContext.contextoOperacionalId ?? "default",
      identidadOperacionalId: posContext.identidadOperacionalId ?? "default",
      operadorId: posContext.operadorActivo?.id ?? "default",
      margenMinimoConfigurable: 0.15,
      operadorTieneCapacidadLibre: false,
    });
    setLastAdded(confirmaReceta.producto.hovId);
    setTimeout(() => setLastAdded(null), 600);
    setQuery("");
    setSearchQuery("");
    setConfirmaReceta(null);
    inputRef.current?.focus();
  }, [confirmaReceta, posContext]);

  const handleCancelarReceta = useCallback(() => {
    setConfirmaReceta(null);
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    // Helper: target line for operations — active (navigated) or fallback to last
    const targetLine = indiceLineaActiva >= 0 ? lines[indiceLineaActiva] : lastLine;

    switch (e.key) {
      case "ArrowDown":
        if (isSearching) {
          e.preventDefault();
          setSelectedIndex(i => i + 1 >= filtered.length ? 0 : i + 1);
        } else if (lines.length > 0) {
          e.preventDefault();
          setIndiceLineaActiva(indiceLineaActiva < 0 ? 0 : indiceLineaActiva + 1 >= lines.length ? 0 : indiceLineaActiva + 1);
        }
        break;
      case "ArrowUp":
        if (isSearching) {
          e.preventDefault();
          setSelectedIndex(i => i <= 0 ? filtered.length - 1 : i - 1);
        } else if (lines.length > 0) {
          e.preventDefault();
          setIndiceLineaActiva(indiceLineaActiva <= 0 ? lines.length - 1 : indiceLineaActiva - 1);
        }
        break;
      case "Enter": {
        if (e.ctrlKey) break; // Ctrl+Enter → openCobro, handled by global listener
        if (isSearching) {
          e.preventDefault();
          e.stopPropagation();
          const product = selectedIndex >= 0 ? filtered[selectedIndex] : filtered[0];
          if (product) addProductToTicket(product);
        } else if (indiceLineaActiva >= 0) {
          e.preventDefault();
          setIndiceLineaActiva(-1); // clear ticket navigation, return to search
        }
        break;
      }
      case "Escape":
        e.preventDefault();
        setIndiceLineaActiva(-1);
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
        if (targetLine) preVentaService.incrementarLinea(targetLine.lineaId);
        break;
      }
      case "-": {
        if (query !== "") break;
        e.preventDefault();
        if (targetLine) preVentaService.decrementarLinea(targetLine.lineaId);
        break;
      }
      case "Delete": {
        if (e.ctrlKey) break;
        if (query !== "") break;
        e.preventDefault();
        if (targetLine) preVentaService.quitarLinea(targetLine.lineaId);
        break;
      }
      case "ArrowRight": {
        if (query !== "") break;
        e.preventDefault();
        if (targetLine) preVentaService.incrementarLinea(targetLine.lineaId);
        break;
      }
      case "ArrowLeft": {
        if (query !== "") break;
        e.preventDefault();
        if (targetLine) preVentaService.decrementarLinea(targetLine.lineaId);
        break;
      }
      case "Insert":
      case "n":
      case "N": {
        if (e.key !== "Insert" && query !== "") break;
        e.preventDefault();
        if (targetLine) preVentaService.abrirNotaLinea(targetLine.lineaId);
        break;
      }
    }
  }, [isSearching, filtered, selectedIndex, addProductToTicket, query, lines, indiceLineaActiva, setIndiceLineaActiva, lastLine, cobroOpen]);

  return (
    <>
      <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-[28px] border border-[#45b356]/40 bg-[#FDFCF9]">

      {/* SEARCH CONTROL — primera línea del body, sin SheetTopbar */}
      <div className="shrink-0 px-3 pt-3 pb-0">
        <div
          className={`flex items-center gap-2.5 rounded-[14px] border bg-white px-3.5 h-[44px] outline-none transition ${
            isFocused
              ? "border-[#45b356]/70 ring-2 ring-[#45b356]/10"
              : cashSession.isOpen
                ? "border-[#45b356]/40"
                : "border-[#e4e9f0]"
          }`}
        >
          <Search size={15} strokeWidth={2} className="shrink-0 text-[#45b356]" />

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => {
              const v = e.target.value;
              const trimmed = v.trim();
              if (trimmed.length >= 4) {
                const exactMatch = catalogoActivo.find(p => p.barcode === trimmed);
                if (exactMatch) {
                  addProductToTicket(exactMatch);
                  return;
                }
              }
              setQuery(v);
              setSearchQuery(trimmed);
            }}
            onKeyDown={handleKeyDown}
            onFocus={() => { if (cobroOpen) closeCobro(); enterSearch(); setIsFocused(true); }}
            onBlur={() => setIsFocused(false)}
            placeholder="Buscar producto, código o barra..."
            className="min-w-0 flex-1 bg-transparent text-[13px] text-[#111827] outline-none placeholder:text-[#b8c4cf]"
            autoComplete="off"
          />

          {!cashSession.isOpen && (
            <span className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-600">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
              Sin turno
            </span>
          )}

          <div className="h-3.5 w-px shrink-0 bg-[#e4e9f0]" />

          <button
            tabIndex={-1}
            title="Escanear código de barras (F3)"
            onClick={() => inputRef.current?.focus()}
            className="flex shrink-0 items-center justify-center rounded-lg p-1 text-[#c0cad4] transition hover:bg-[#f4f7fb] hover:text-[#45b356]"
          >
            <ScanLine size={15} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* CATEGORÍAS RUBRO — solo en modo visual, debajo del control */}
      {view === "visual" && rubroConfig.categories.length > 1 && (
        <div className="shrink-0 flex items-center gap-1.5 flex-wrap px-3 pt-2">
          {rubroConfig.categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setVisualCategory(cat.id)}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold transition ${
                visualCategory === cat.id
                  ? "bg-[#45b356]/15 border border-[#45b356]/35 text-[#1e5c2a]"
                  : "border border-[#e4e7ec] text-[#475467] hover:border-[#d0d5dd] hover:text-[#111827]"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* CALC RESULT — debajo de la barra, como en el cierre */}
      {calcResult !== null && (
        <div className="shrink-0 flex items-center gap-2 border-b border-[#edf2f8] bg-[#f8fafd] px-5 py-1.5">
          <span className="text-[10px] font-semibold text-[#9ca3af]">=</span>
          <span className="font-mono text-[14px] font-bold tabular-nums text-[#2154d8]">S/ {calcResult.toFixed(2)}</span>
        </div>
      )}

      {/* RESULTS */}
      <div className="relative w-full min-h-0 flex-1">
      <div className="min-h-0 flex-1 overflow-y-auto pt-3">

        {/* ── DENSE MODE ── */}
        {view === "dense" && (
          <>
            {!isSearching && (
              <div className="flex flex-col items-center justify-center gap-2 py-14 text-center">
                <Search size={26} className="text-[#dce3ea]" />
                <p className="mt-1 text-[13px] font-semibold text-[#b0bac8]">
                  Busca por nombre, código o escanea para agregar.
                </p>
                {!cashSession.isOpen && (
                  <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-semibold text-amber-400">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
                    Sin turno activo · no se puede cobrar
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
                  const isOut = product.stockStatus === "out";
                  const isSelected = idx === selectedIndex;
                  const formasCount = product.tieneMultiplesFormas
                    ? agruparPorProducto(catalogoActivo).find(g => g.formasVenta.some(f => f.hovId === product.hovId))?.formasVenta.length ?? 1
                    : 1;

                  return (
                    <div
                      key={product.id}
                      ref={idx === selectedIndex ? selectedItemRef : null}
                      onClick={() => addProductToTicket(product)}
                      className={`flex cursor-pointer items-center justify-between rounded-2xl px-4 py-3 transition ${
                        lastAdded === product.hovId
                          ? "bg-[#dcfce7] ring-1 ring-[#45b356]/40"
                          : isSelected
                            ? "bg-[#F0FAF1] ring-1 ring-[#45b356]/20"
                            : "hover:bg-[#f3faf4]"
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
                            {product.description}
                          </div>
                          <div className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold">
                            <span className="tabular-nums text-[#374151]">
                              {product.barcode || product.id}
                            </span>
                            <span className="text-[#d1d9e1]">·</span>
                            {statusChip(product)}
                            {product.tieneMultiplesFormas && formasCount > 1 && (
                              <span className="rounded-full bg-[#eff6ff] px-1.5 py-0.5 text-[10px] font-semibold text-[#2563eb]">
                                {formasCount} formas
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="ml-4 flex shrink-0 items-center">
                        <span className="text-[14px] font-semibold text-[#2F3E46]">
                          S/ {product.unitPrice.toFixed(2)}
                        </span>
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
                    const isOut  = product.stockStatus === "out";
                    const price  = tilePrice(product);
                    const formasCount = product.tieneMultiplesFormas
                      ? agruparPorProducto(catalogoActivo).find(g => g.formasVenta.some(f => f.hovId === product.hovId))?.formasVenta.length ?? 1
                      : 1;

                    return (
                      <button
                        key={product.id}
                        onClick={() => addProductToTicket(product)}
                        disabled={isOut}
                        className={`overflow-hidden rounded-2xl bg-white text-left transition active:scale-[0.96] ${
                          isOut
                            ? "border border-[#fef2f2] opacity-50 cursor-not-allowed shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
                            : lastAdded === product.hovId
                              ? "border border-[#45b356]/60 shadow-[0_4px_14px_rgba(69,179,86,0.18)] ring-2 ring-[#45b356]/15 cursor-pointer"
                              : "border border-[#eef2f8] shadow-[0_1px_4px_rgba(15,23,42,0.07)] hover:border-[#a8d9ac] hover:shadow-[0_4px_14px_rgba(69,179,86,0.10)] cursor-pointer"
                        }`}
                      >
                        <div
                          className="relative flex items-center justify-center h-[68px]"
                          style={{ backgroundColor: "#F8FAFC" }}
                        >
                          <span className="text-[38px] leading-none select-none" />
                          <TileBadge p={product} />
                        </div>
                        <div className="px-2.5 pt-2 pb-2.5">
                          <p className="line-clamp-2 text-[11px] font-bold uppercase tracking-[0.025em] leading-snug text-[#2F3E46]">
                            {product.description}
                          </p>
                          <p className={`mt-1.5 text-[13px] font-extrabold tabular-nums ${price.cls}`}>
                            {price.prefix}S/ {product.unitPrice.toFixed(2)}
                          </p>
                          {product.tieneMultiplesFormas && formasCount > 1 && (
                            <span className="mt-1.5 inline-flex rounded-full bg-[#eff6ff] px-1.5 py-0.5 text-[10px] font-semibold text-[#2563eb]">
                              {formasCount} formas
                            </span>
                          )}
                          {product.stockStatus !== "normal" && (
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
      {confirmaReceta !== null && (
        <ConfirmacionRecetaPanel
          nombreProducto={confirmaReceta.producto.description}
          condicion={confirmaReceta.condicion}
          onConfirmar={handleConfirmarReceta}
          onCancelar={handleCancelarReceta}
        />
      )}
      </div>
      </section>
      {grupoActivo && (
        <PresentacionSheet
          grupo={grupoActivo}
          onConfirmar={handleConfirmarForma}
          onCancelar={() => setGrupoActivo(null)}
          puedeEditarPrecio={puedeEditarPrecio}
        />
      )}
    </>
  );
}
