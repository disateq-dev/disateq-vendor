import { useState, useEffect, useRef } from "react";
import { Clock, LogIn, LogOut, Lock, CheckCircle, Printer } from "lucide-react";
import { usePOS, type CashBox, type CashBoxType, type MoveType, type CashMove } from "../../context/POSContext";
import { printCashMoveVoucher } from "../../print/printTicket";

function formatTime(d: Date): string {
  return d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

function formatDuration(from: Date): string {
  const mins = Math.floor((Date.now() - from.getTime()) / 60_000);
  const h = Math.floor(mins / 60);
  const m = String(mins % 60).padStart(2, "0");
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function typeLabel(t: CashBoxType): string {
  if (t === "normal") return "OPERACIONAL";
  if (t === "contingency-1") return "CONTINGENCIA 1";
  return "CONTINGENCIA 2";
}

function prereqCode(box: CashBox): string {
  if (box.type === "contingency-1") return box.code.slice(0, 2) + "0";
  if (box.type === "contingency-2") return box.code.slice(0, 2) + "1";
  return "";
}

function InfoRow({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-[10.5px] font-semibold uppercase tracking-widest text-[#c0cad4]">{label}</span>
      <span className={`text-[11.5px] font-semibold ${accent ? "text-emerald-600" : "text-[#374151]"}`}>{value}</span>
    </div>
  );
}

function BoxStatusBadge({ box, isActive }: { box: CashBox; isActive: boolean }) {
  if (isActive) return (
    <span className="rounded-lg bg-emerald-100 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-emerald-700">
      ACTIVA
    </span>
  );
  if (box.used) return (
    <span className="rounded-lg bg-[#f4f7fb] px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-[#c0cad4]">
      CERRADA
    </span>
  );
  if (!box.available) return (
    <span className="flex items-center gap-1 rounded-lg bg-[#fef9f0] px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-[#c08000]">
      <Lock size={8} strokeWidth={2.5} />
      REQ. {prereqCode(box)}
    </span>
  );
  return (
    <span className="rounded-lg bg-[#f0fdf4] px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-widest text-[#16a34a]">
      DISPONIBLE
    </span>
  );
}

function BoxRow({ box, isActive, isSelected, onSelect }: {
  box: CashBox;
  isActive: boolean;
  isSelected: boolean;
  onSelect?: () => void;
}) {
  const clickable = !isActive && box.available && !!onSelect;

  let cls = "flex items-center gap-3 rounded-2xl px-4 py-2.5 transition select-none";
  if (isActive)       cls += " bg-emerald-50 ring-1 ring-emerald-200";
  else if (isSelected) cls += " bg-[#edf4ff] ring-1 ring-[#2154d8]/20";
  else if (clickable)  cls += " cursor-pointer hover:bg-[#f4f7fb]";
  else                 cls += " opacity-50 cursor-default";

  const dotColor  = isActive ? "bg-emerald-500" : isSelected ? "bg-[#2154d8]" : box.available ? "bg-[#34d399]" : "bg-[#d1d5db]";
  const codeColor = isActive ? "text-emerald-700" : isSelected ? "text-[#2154d8]" : box.used || !box.available ? "text-[#c0cad4]" : "text-[#111827]";
  const labelColor = isActive ? "text-emerald-600" : isSelected ? "text-[#4b75e6]" : "text-[#c0cad4]";

  return (
    <div className={cls} onClick={clickable ? onSelect : undefined}>
      <div className={`h-2 w-2 shrink-0 rounded-full ${dotColor}`} />
      <div className="flex flex-1 items-baseline gap-2">
        <span className={`text-[14px] font-bold tabular-nums ${codeColor}`}>{box.code}</span>
        <span className={`text-[11px] font-semibold ${labelColor}`}>{typeLabel(box.type)}</span>
      </div>
      <BoxStatusBadge box={box} isActive={isActive} />
    </div>
  );
}

const MOTIVOS: Record<MoveType, string[]> = {
  ingreso: ["Cambio inicial", "Reposición", "Ajuste", "Ingreso manual"],
  egreso:  ["Taxi", "Compra rápida", "Retiro dueño", "Gasto operativo", "Cambio externo"],
};

const SERIES = ["1", "2", "3"] as const;

interface CashWorkspaceProps {
  onOpened?: () => void;
}

export function CashWorkspace({ onOpened }: CashWorkspaceProps) {
  const { cashSession, cashBoxes, suggestedCashBox, openCashSession, closeCashSession, sessionStats, cashMoves, addCashMove, showNotice } = usePOS();
  const { isOpen, cashBox: activeBox, operator, terminal, openedAt } = cashSession;

  const [selectedCode, setSelectedCode] = useState<string>(() => suggestedCashBox?.code ?? "100");
  const [duration, setDuration]         = useState("");
  const [closingMode, setClosingMode]   = useState(false);
  const [contado, setContado]           = useState("");
  const [moveType,   setMoveType]   = useState<MoveType>("ingreso");
  const [moveAmount, setMoveAmount] = useState("");
  const [moveMotivo, setMoveMotivo] = useState("");
  const [lastMove,   setLastMove]   = useState<CashMove | null>(null);
  const moveAmountRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen && suggestedCashBox) setSelectedCode(suggestedCashBox.code);
  }, [isOpen, suggestedCashBox]);

  // Reset closing mode when turno closes (external close or after confirm)
  useEffect(() => {
    if (!isOpen) { setClosingMode(false); setContado(""); }
    setLastMove(null); setMoveAmount(""); setMoveMotivo("");
  }, [isOpen]);

  useEffect(() => {
    if (!openedAt) { setDuration(""); return; }
    const update = () => setDuration(formatDuration(openedAt));
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, [openedAt]);

  const effectiveBox = isOpen ? activeBox : (cashBoxes.find(b => b.code === selectedCode) ?? suggestedCashBox);
  const canOpen      = !isOpen && !!effectiveBox?.available;
  const contadoNum       = parseFloat(contado) || 0;
  const ingresosTotal    = cashMoves.filter(m => m.type === "ingreso").reduce((s, m) => s + m.amount, 0);
  const egresosTotal     = cashMoves.filter(m => m.type === "egreso").reduce((s, m) => s + m.amount, 0);
  const efectivoEsperado = sessionStats.cash + ingresosTotal - egresosTotal;
  const diferencia       = contadoNum - efectivoEsperado;

  function handleOpen() {
    if (!effectiveBox) return;
    openCashSession(effectiveBox.code);
    onOpened?.();
  }

  function handleConfirmClose() {
    closeCashSession();
    setContado("");
  }

  function handleAddMove() {
    const amt = parseFloat(moveAmount);
    if (!amt || amt <= 0 || !moveMotivo.trim()) return;
    const move = addCashMove(moveType, amt, moveMotivo.trim());
    setLastMove(move);
    setMoveAmount("");
    showNotice(`${moveType === "ingreso" ? "Ingreso" : "Egreso"} registrado · S/ ${amt.toFixed(2)}`);
    setTimeout(() => moveAmountRef.current?.focus(), 10);
  }

  function handlePrintVoucher(move: CashMove) {
    const ts = new Date(move.timestamp);
    const p  = (n: number) => String(n).padStart(2, "0");
    printCashMoveVoucher({
      businessName: "DISATEQ TIENDA",
      moveType:     move.type,
      amount:       move.amount,
      motivo:       move.motivo,
      operator:     move.operator,
      cashBoxCode:  move.cashBoxCode,
      terminal:     move.terminal,
      dateTime:     `${p(ts.getDate())}/${p(ts.getMonth() + 1)}/${ts.getFullYear()} ${p(ts.getHours())}:${p(ts.getMinutes())}`,
    });
  }

  return (
    <section className="flex min-h-0 flex-1 gap-3">

      {/* LEFT: status + actions */}
      <div className="flex w-[252px] shrink-0 flex-col gap-3">

        {closingMode ? (
          /* ── CLOSING CARD ── */
          <div className="flex flex-col gap-4 rounded-[24px] border border-red-200 bg-white px-5 py-5 shadow-[0_4px_18px_rgba(15,23,42,0.04)]">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-red-50 text-red-500">
                <LogOut size={20} strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <span className="text-[10.5px] font-bold uppercase tracking-widest text-red-500">CERRANDO TURNO</span>
                <p className="mt-0.5 truncate text-[12px] font-semibold text-[#374151]">
                  CAJA {activeBox?.code} · {operator}
                </p>
              </div>
            </div>

            {/* Resumen turno */}
            <div className="flex flex-col gap-1.5 rounded-xl bg-[#f8fafd] px-3.5 py-3">
              <InfoRow label="Ventas"   value={`${sessionStats.count} op.`} />
              <InfoRow label="Total"    value={`S/ ${sessionStats.total.toFixed(2)}`} />
              {ingresosTotal > 0 && <InfoRow label="Ingresos" value={`+S/ ${ingresosTotal.toFixed(2)}`} />}
              {egresosTotal  > 0 && <InfoRow label="Egresos"  value={`−S/ ${egresosTotal.toFixed(2)}`} />}
              <InfoRow label="Ef. esp." value={`S/ ${efectivoEsperado.toFixed(2)}`} accent />
            </div>

            {/* Arqueo */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[#9ca3af]">
                Efectivo contado S/
              </span>
              <input
                autoFocus
                type="number"
                value={contado}
                onChange={e => setContado(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleConfirmClose(); if (e.key === "Escape") setClosingMode(false); }}
                placeholder="0.00"
                min="0"
                step="0.10"
                className="w-full rounded-xl border border-[#e4e9f0] px-3.5 py-2.5 text-[20px] font-bold text-[#2F3E46] outline-none placeholder:text-[#d1d9e1] focus:border-red-300 focus:ring-2 focus:ring-red-300/20"
              />
              {contado !== "" && (
                <p className={`text-[11px] font-semibold tabular-nums ${diferencia >= 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {diferencia >= 0
                    ? `Sobrante S/ ${diferencia.toFixed(2)}`
                    : `Faltante S/ ${Math.abs(diferencia).toFixed(2)}`}
                </p>
              )}
            </div>
          </div>

        ) : (
          /* ── SESSION STATUS CARD ── */
          <div className={`flex flex-col gap-4 rounded-[24px] border bg-white px-5 py-5 shadow-[0_4px_18px_rgba(15,23,42,0.04)] transition-colors ${
            isOpen ? "border-emerald-200" : "border-[#e4e9f0]"
          }`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] transition-colors ${
                isOpen ? "bg-emerald-50 text-emerald-600" : "bg-[#f1f5f9] text-[#9ca3af]"
              }`}>
                <Clock size={20} strokeWidth={1.5} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${isOpen ? "bg-emerald-500" : "bg-[#d1d5db]"}`} />
                  <span className={`text-[10.5px] font-bold uppercase tracking-widest ${isOpen ? "text-emerald-600" : "text-[#9ca3af]"}`}>
                    {isOpen ? "TURNO ABIERTO" : "TURNO CERRADO"}
                  </span>
                </div>
                <p className="mt-0.5 truncate text-[12px] font-semibold text-[#374151]">
                  {isOpen && activeBox
                    ? `CAJA ${activeBox.code} · ${typeLabel(activeBox.type)}`
                    : "Sin apertura operacional"}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <InfoRow label="Operador" value={operator} />
              <InfoRow label="Terminal" value={terminal} />
              {isOpen && openedAt && (
                <InfoRow label="Activo" value={`${formatTime(openedAt)} · ${duration}`} accent />
              )}
            </div>

            {/* Stats rápidos si turno activo */}
            {isOpen && sessionStats.count > 0 && (
              <div className="flex flex-col gap-1.5 rounded-xl bg-[#f8fafd] px-3.5 py-3">
                <InfoRow label="Ventas"  value={`${sessionStats.count} op.`} />
                <InfoRow label="Total"   value={`S/ ${sessionStats.total.toFixed(2)}`} />
                <InfoRow label="Efectivo" value={`S/ ${sessionStats.cash.toFixed(2)}`} accent />
              </div>
            )}
          </div>
        )}

        {/* Suggested box — only when not open and not closing */}
        {!isOpen && !closingMode && suggestedCashBox && (
          <div className="rounded-[20px] border border-[#e8eef6] bg-[#f8fafd] px-5 py-3.5">
            <p className="mb-1.5 text-[9.5px] font-bold uppercase tracking-[0.15em] text-[#b0bac8]">CAJA SUGERIDA</p>
            <p className="text-[18px] font-bold leading-none text-[#2154d8]">{suggestedCashBox.code}</p>
            <p className="mt-1 text-[10.5px] font-semibold text-[#9ca3af]">{typeLabel(suggestedCashBox.type)}</p>
          </div>
        )}

        <div className="flex-1" />

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {closingMode ? (
            <>
              <button
                onClick={handleConfirmClose}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-600 py-3.5 text-[13px] font-bold uppercase tracking-widest text-white shadow-[0_4px_14px_rgba(220,38,38,0.24)] transition hover:bg-red-700 active:scale-[0.98]"
              >
                <CheckCircle size={14} strokeWidth={2.5} />
                Confirmar cierre
              </button>
              <button
                onClick={() => { setClosingMode(false); setContado(""); }}
                className="flex w-full items-center justify-center gap-2 rounded-2xl border border-[#e4e9f0] bg-white py-3 text-[13px] font-semibold text-[#374151] transition hover:bg-[#f8fafd] active:scale-[0.98]"
              >
                Cancelar
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleOpen}
                disabled={!canOpen}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3.5 text-[13px] font-bold uppercase tracking-widest transition ${
                  canOpen
                    ? "bg-emerald-600 text-white shadow-[0_4px_14px_rgba(5,150,105,0.28)] hover:bg-emerald-700 active:scale-[0.98]"
                    : "cursor-not-allowed bg-[#f4f7fb] text-[#c8d4e0]"
                }`}
              >
                <LogIn size={14} strokeWidth={2.5} />
                Apertura de turno
              </button>
              <button
                onClick={() => setClosingMode(true)}
                disabled={!isOpen}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-[13px] font-semibold transition ${
                  isOpen
                    ? "border border-[#fca5a5] bg-[#fef2f2] text-red-600 hover:bg-red-50 active:scale-[0.98]"
                    : "cursor-not-allowed border border-[#f1f5f9] bg-white text-[#d1d5db]"
                }`}
              >
                <LogOut size={14} strokeWidth={2} />
                Cierre de turno
              </button>
            </>
          )}
        </div>
      </div>

      {/* RIGHT: movements when open, box selector when closed */}
      {isOpen ? (

        /* ── MOVEMENTS PANEL ── */
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-[#e4e9f0] bg-white shadow-[0_4px_18px_rgba(15,23,42,0.04)]">

          <div className="shrink-0 border-b border-[#f1f5f9] px-5 py-3 flex items-center justify-between">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.15em] text-[#9ca3af]">Movimientos de caja</span>
            {cashMoves.length > 0 && (
              <div className="flex gap-3">
                {ingresosTotal > 0 && <span className="text-[10px] font-bold text-emerald-600 tabular-nums">↑ S/ {ingresosTotal.toFixed(2)}</span>}
                {egresosTotal  > 0 && <span className="text-[10px] font-bold text-red-500 tabular-nums">↓ S/ {egresosTotal.toFixed(2)}</span>}
              </div>
            )}
          </div>

          {/* Form */}
          <div className="shrink-0 border-b border-[#f1f5f9] px-4 py-3 flex flex-col gap-2.5">

            {/* Type toggle */}
            <div className="flex gap-px rounded-xl bg-[#f1f5f9] p-0.5">
              {(["ingreso", "egreso"] as MoveType[]).map(t => (
                <button
                  key={t}
                  onClick={() => { setMoveType(t); setMoveMotivo(""); }}
                  className={`flex-1 rounded-[9px] py-1.5 text-[11px] font-bold uppercase tracking-wide transition ${
                    moveType === t
                      ? t === "ingreso" ? "bg-emerald-600 text-white shadow-sm" : "bg-red-500 text-white shadow-sm"
                      : "text-[#9ca3af] hover:text-[#374151]"
                  }`}
                >
                  {t === "ingreso" ? "↑ Ingreso" : "↓ Egreso"}
                </button>
              ))}
            </div>

            {/* Amount + Register */}
            <div className="flex gap-2 items-center">
              <span className="text-[11px] font-semibold text-[#9ca3af] shrink-0">S/</span>
              <input
                ref={moveAmountRef}
                type="number"
                value={moveAmount}
                onChange={e => setMoveAmount(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && moveMotivo) handleAddMove(); }}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                className="flex-1 min-w-0 rounded-xl border border-[#e4e9f0] px-3 py-2 text-[18px] font-bold text-[#2F3E46] outline-none placeholder:text-[#d1d9e1] focus:border-[#2154d8] focus:ring-2 focus:ring-[#2154d8]/10"
              />
              <button
                onClick={handleAddMove}
                disabled={!(parseFloat(moveAmount) > 0) || !moveMotivo}
                className={`shrink-0 rounded-xl px-4 py-2 text-[12px] font-bold uppercase tracking-wide transition ${
                  parseFloat(moveAmount) > 0 && moveMotivo
                    ? moveType === "ingreso"
                      ? "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.97]"
                      : "bg-red-500 text-white hover:bg-red-600 active:scale-[0.97]"
                    : "bg-[#f1f5f9] text-[#c8d4e0] cursor-not-allowed"
                }`}
              >
                Registrar
              </button>
            </div>

            {/* Motivo chips */}
            <div className="flex flex-wrap gap-1">
              {MOTIVOS[moveType].map(m => (
                <button
                  key={m}
                  onClick={() => setMoveMotivo(m === moveMotivo ? "" : m)}
                  className={`rounded-lg px-2.5 py-1 text-[10.5px] font-semibold transition ${
                    moveMotivo === m
                      ? "bg-[#2154d8] text-white"
                      : "border border-[#e4e9f0] text-[#374151] hover:border-[#c7d7f4] hover:bg-[#f0f5ff]"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* Last move + voucher prompt */}
            {lastMove && (
              <div className="flex items-center gap-2 rounded-xl bg-[#f8fafd] px-3 py-2">
                <span className={`text-[11px] font-bold ${lastMove.type === "ingreso" ? "text-emerald-600" : "text-red-500"}`}>
                  {lastMove.type === "ingreso" ? "↑" : "↓"}
                </span>
                <span className="flex-1 text-[10.5px] font-semibold text-[#374151] truncate">
                  {lastMove.motivo} · S/ {lastMove.amount.toFixed(2)}
                </span>
                <button
                  onClick={() => handlePrintVoucher(lastMove)}
                  className="flex items-center gap-1 rounded-lg border border-[#e4e9f0] px-2 py-0.5 text-[10px] font-semibold text-[#374151] transition hover:border-[#c7d7f4] hover:bg-[#f0f5ff]"
                >
                  <Printer size={9} strokeWidth={2} />
                  Voucher
                </button>
              </div>
            )}
          </div>

          {/* Moves list */}
          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-2">
            {cashMoves.length === 0 ? (
              <p className="py-8 text-center text-[10.5px] text-[#c8d4e0]">Sin movimientos en este turno</p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {[...cashMoves].reverse().map(m => {
                  const ts = new Date(m.timestamp);
                  const hm = `${String(ts.getHours()).padStart(2, "0")}:${String(ts.getMinutes()).padStart(2, "0")}`;
                  return (
                    <div key={m.id} className="flex items-center gap-2.5 rounded-xl px-3 py-2 hover:bg-[#f8fafd] group">
                      <span className={`shrink-0 text-[11px] font-bold ${m.type === "ingreso" ? "text-emerald-500" : "text-red-400"}`}>
                        {m.type === "ingreso" ? "↑" : "↓"}
                      </span>
                      <span className="flex-1 text-[11px] font-semibold text-[#374151] truncate">{m.motivo}</span>
                      <span className="text-[10px] text-[#9ca3af] tabular-nums">{hm}</span>
                      <span className={`text-[11px] font-bold tabular-nums ${m.type === "ingreso" ? "text-emerald-600" : "text-red-500"}`}>
                        {m.type === "ingreso" ? "+" : "−"}S/ {m.amount.toFixed(2)}
                      </span>
                      <button
                        onClick={() => handlePrintVoucher(m)}
                        title="Imprimir voucher"
                        className="shrink-0 opacity-0 group-hover:opacity-100 transition text-[#c0cad4] hover:text-[#2154d8]"
                      >
                        <Printer size={11} strokeWidth={2} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      ) : (

        /* ── BOX SELECTOR ── */
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[24px] border border-[#e4e9f0] bg-white shadow-[0_4px_18px_rgba(15,23,42,0.04)]">

          <div className="shrink-0 border-b border-[#f1f5f9] px-5 py-3">
            <span className="text-[10.5px] font-bold uppercase tracking-[0.15em] text-[#9ca3af]">
              Selección operacional de caja
            </span>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            {SERIES.map(prefix => {
              const seriesBoxes = cashBoxes.filter(b => b.code.startsWith(prefix));
              return (
                <div key={prefix} className="mb-4 last:mb-0">
                  <p className="mb-1.5 px-1 text-[9.5px] font-bold uppercase tracking-[0.18em] text-[#c8d4e0]">
                    SERIE {prefix}00
                  </p>
                  <div className="flex flex-col gap-0.5">
                    {seriesBoxes.map(box => (
                      <BoxRow
                        key={box.code}
                        box={box}
                        isActive={false}
                        isSelected={selectedCode === box.code}
                        onSelect={() => box.available && setSelectedCode(box.code)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </section>
  );
}
