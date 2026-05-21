import { useState, useEffect, useRef } from "react";
import { X, Lock, CheckCircle2 } from "lucide-react";
import { usePOS } from "../../context/POSContext";

const MOTIVOS = [
  "OLVIDO PIN",
  "CAMBIO PREVENTIVO",
  "PIN COMPROMETIDO",
  "RECOMENDACIÓN PERIÓDICA",
  "CAMBIO SUPERVISOR",
] as const;

type Motivo = typeof MOTIVOS[number];
type SheetState = "idle" | "success";

interface Props {
  onClose: () => void;
}

function validatePin(p: string): string | null {
  if (!p)              return "Requerido";
  if (!/^\d+$/.test(p)) return "Solo números";
  if (p.length < 4)   return "Mínimo 4 dígitos";
  return null;
}

export function PinChangeSheet({ onClose }: Props) {
  const { changeOperatorPin, activeOperator } = usePOS();

  const [pinActual,  setPinActual]  = useState("");
  const [pinNuevo,   setPinNuevo]   = useState("");
  const [pinConfirm, setPinConfirm] = useState("");
  const [motivo,     setMotivo]     = useState<Motivo | "">("");
  const [error,      setError]      = useState<string | null>(null);
  const [sheetState, setSheetState] = useState<SheetState>("idle");

  const pinActualRef  = useRef<HTMLInputElement>(null);
  const pinNuevoRef   = useRef<HTMLInputElement>(null);
  const pinConfirmRef = useRef<HTMLInputElement>(null);
  const motivoRef     = useRef<HTMLSelectElement>(null);
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Autofocus primer campo al abrir
  useEffect(() => { pinActualRef.current?.focus(); }, []);

  // Escape → cerrar
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { e.preventDefault(); onClose(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Auto-cierre tras éxito
  useEffect(() => {
    if (sheetState === "success") {
      const t = setTimeout(onClose, 2200);
      return () => clearTimeout(t);
    }
  }, [sheetState, onClose]);

  function clearError() { setError(null); }

  function handleSubmit() {
    setError(null);

    const errActual = validatePin(pinActual);
    if (errActual) { setError(`PIN actual: ${errActual}`); pinActualRef.current?.focus(); return; }

    const errNuevo = validatePin(pinNuevo);
    if (errNuevo) { setError(`Nuevo PIN: ${errNuevo}`); pinNuevoRef.current?.focus(); return; }

    if (pinNuevo === pinActual) {
      setError("El nuevo PIN debe ser diferente al actual");
      pinNuevoRef.current?.focus();
      return;
    }

    if (pinNuevo !== pinConfirm) {
      setError("Los PINes no coinciden");
      pinConfirmRef.current?.focus();
      return;
    }

    if (!motivo) { setError("Seleccione un motivo"); motivoRef.current?.focus(); return; }

    const ok = changeOperatorPin(pinActual, pinNuevo);
    if (!ok) {
      setError("PIN actual incorrecto");
      setPinActual("");
      setTimeout(() => pinActualRef.current?.focus(), 0);
      return;
    }

    setSheetState("success");
  }

  // ── Success state ─────────────────────────────────────────────────
  if (sheetState === "success") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1f3d]/25">
        <div className="w-full max-w-[380px] rounded-2xl bg-white border border-[#dde4ec] shadow-[0_8px_40px_rgba(15,31,61,0.16)] px-8 py-10 flex flex-col items-center gap-3">
          <CheckCircle2 size={36} className="text-[#45b356]" />
          <p className="text-[13px] font-bold uppercase tracking-[0.12em] text-[#1a2d4e]">PIN actualizado</p>
          <p className="text-[10.5px] text-[#6b7a99]">Cierra automáticamente...</p>
        </div>
      </div>
    );
  }

  // ── Form state ────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0f1f3d]/25">
      <div className="w-full max-w-[400px] rounded-2xl bg-white border border-[#dde4ec] shadow-[0_8px_40px_rgba(15,31,61,0.16)] overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#f7f9fc] border-b border-[#dde4ec]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#1a2d4e]">Cambio de PIN Operador</p>
            {activeOperator && (
              <p className="text-[10px] text-[#6b7a99] mt-0.5">{activeOperator.code} · {activeOperator.name}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-[#b8c4d4] hover:text-[#6b7a99] transition p-1"
          >
            <X size={15} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-3">

          {/* PIN Actual */}
          <div>
            <label className="block text-[9.5px] font-bold uppercase tracking-[0.16em] text-[#a0aec0] mb-1.5">
              PIN Actual
            </label>
            <div className="relative">
              <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b8c4d4]" />
              <input
                ref={pinActualRef}
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                value={pinActual}
                onChange={e => { setPinActual(e.target.value.replace(/\D/g, "").slice(0, 6)); clearError(); }}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); pinNuevoRef.current?.focus(); } }}
                placeholder="· · · ·"
                className="w-full rounded-xl border border-[#e0e8f2] bg-[#f8fafc] pl-9 pr-4 py-2.5 text-[15px] font-bold tracking-[0.25em] text-[#1a2d4e] outline-none focus:border-[#45b356] focus:ring-2 focus:ring-[#45b356]/10 transition"
              />
            </div>
          </div>

          {/* Nuevo PIN */}
          <div>
            <label className="block text-[9.5px] font-bold uppercase tracking-[0.16em] text-[#a0aec0] mb-1.5">
              Nuevo PIN
            </label>
            <div className="relative">
              <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b8c4d4]" />
              <input
                ref={pinNuevoRef}
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                value={pinNuevo}
                onChange={e => { setPinNuevo(e.target.value.replace(/\D/g, "").slice(0, 6)); clearError(); }}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); pinConfirmRef.current?.focus(); } }}
                placeholder="· · · ·"
                className="w-full rounded-xl border border-[#e0e8f2] bg-[#f8fafc] pl-9 pr-4 py-2.5 text-[15px] font-bold tracking-[0.25em] text-[#1a2d4e] outline-none focus:border-[#45b356] focus:ring-2 focus:ring-[#45b356]/10 transition"
              />
            </div>
          </div>

          {/* Confirmar PIN */}
          <div>
            <label className="block text-[9.5px] font-bold uppercase tracking-[0.16em] text-[#a0aec0] mb-1.5">
              Confirmar Nuevo PIN
            </label>
            <div className="relative">
              <Lock size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#b8c4d4]" />
              <input
                ref={pinConfirmRef}
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                value={pinConfirm}
                onChange={e => { setPinConfirm(e.target.value.replace(/\D/g, "").slice(0, 6)); clearError(); }}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); motivoRef.current?.focus(); } }}
                placeholder="· · · ·"
                className="w-full rounded-xl border border-[#e0e8f2] bg-[#f8fafc] pl-9 pr-4 py-2.5 text-[15px] font-bold tracking-[0.25em] text-[#1a2d4e] outline-none focus:border-[#45b356] focus:ring-2 focus:ring-[#45b356]/10 transition"
              />
            </div>
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-[9.5px] font-bold uppercase tracking-[0.16em] text-[#a0aec0] mb-1.5">
              Motivo
            </label>
            <div className="relative">
              <select
                ref={motivoRef}
                value={motivo}
                onChange={e => { setMotivo(e.target.value as Motivo | ""); clearError(); }}
                onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); confirmBtnRef.current?.focus(); } }}
                className="w-full appearance-none rounded-xl border border-[#e0e8f2] bg-[#f8fafc] px-4 py-2.5 text-[12px] font-semibold text-[#1a2d4e] outline-none focus:border-[#45b356] focus:ring-2 focus:ring-[#45b356]/10 transition cursor-pointer"
              >
                <option value="">Seleccionar motivo...</option>
                {MOTIVOS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#a0aec0]">
                <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
                  <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Error inline */}
          {error && (
            <p className="text-[10px] font-semibold text-red-500 -mt-1">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#f0f4f9]">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-lg border border-[#e0e8f2] bg-white text-[11px] font-bold uppercase tracking-wider text-[#6b7a99] hover:bg-[#f7f9fc] transition"
          >
            Cancelar
          </button>
          <button
            ref={confirmBtnRef}
            onClick={handleSubmit}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleSubmit(); } }}
            className="h-9 px-5 rounded-lg bg-[#45b356] border border-[#3ca34a] text-white text-[11px] font-bold uppercase tracking-wider hover:bg-[#3ca34a] transition shadow-[0_2px_12px_rgba(69,179,86,0.30)]"
          >
            Confirmar
          </button>
        </div>

      </div>
    </div>
  );
}
