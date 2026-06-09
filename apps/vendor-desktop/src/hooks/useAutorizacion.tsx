import { useState, useCallback, useRef } from "react";
import { Shield, X, AlertTriangle } from "lucide-react";
import { pinAutorizacionStore } from "../config/pin-autorizacion.store";
import { accesosStore } from "../domains/operator/accesos.store";

const MAX_INTENTOS = 3;

interface UseAutorizacionReturn {
  solicitarAutorizacion: (operacion: string, operadorAlias: string, onAutorizado: () => void) => void;
  PinAutorizacionModal: React.FC;
}

export function useAutorizacion(): UseAutorizacionReturn {
  const [visible,       setVisible]       = useState(false);
  const [pin,           setPin]           = useState("");
  const [error,         setError]         = useState<string | null>(null);
  const [intentos,      setIntentos]      = useState(0);
  const [alerta,        setAlerta]        = useState(false);

  const operacionRef     = useRef("");
  const operadorAliasRef = useRef("");
  const onAutorizadoRef  = useRef<() => void>(() => {});

  const solicitarAutorizacion = useCallback((
    operacion: string,
    operadorAlias: string,
    onAutorizado: () => void
  ) => {
    operacionRef.current     = operacion;
    operadorAliasRef.current = operadorAlias;
    onAutorizadoRef.current  = onAutorizado;
    setPin("");
    setError(null);
    setIntentos(0);
    setAlerta(false);
    setVisible(true);
  }, []);

  const cerrar = useCallback(() => {
    setVisible(false);
    setPin("");
    setError(null);
    setIntentos(0);
    setAlerta(false);
  }, []);

  const confirmar = useCallback(async () => {
    if (!pinAutorizacionStore.estaConfigurado()) {
      setError("PIN de Autorización no configurado. Configure en AJUSTES → OPERACIÓN.");
      return;
    }
    const ok = await pinAutorizacionStore.verificar(pin);
    if (ok) {
      accesosStore.registrar({
        tipo: "PIN_AUTORIZACION_USADO",
        operadorAlias: operadorAliasRef.current,
        operacion: operacionRef.current,
      });
      cerrar();
      onAutorizadoRef.current();
    } else {
      const nuevosIntentos = intentos + 1;
      setIntentos(nuevosIntentos);
      setPin("");
      accesosStore.registrar({
        tipo: "PIN_AUTORIZACION_FALLIDO",
        operadorAlias: operadorAliasRef.current,
        operacion: operacionRef.current,
        detalle: `Intento ${nuevosIntentos} de ${MAX_INTENTOS}`,
      });
      if (nuevosIntentos >= MAX_INTENTOS) {
        setAlerta(true);
        setError(`${MAX_INTENTOS} intentos fallidos. Verifique el PIN de Autorización.`);
      } else {
        setError(`PIN incorrecto · intento ${nuevosIntentos} de ${MAX_INTENTOS}`);
      }
    }
  }, [pin, intentos, cerrar]);

  const PinAutorizacionModal: React.FC = useCallback(() => {
    if (!visible) return null;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
        <div className="flex w-[320px] flex-col overflow-hidden rounded-[24px] border border-[#e4e9f0] bg-white shadow-[0_8px_32px_rgba(15,23,42,0.18)]">

          {/* Header */}
          <div className="flex items-center gap-2 border-b border-[#f0f4f8] bg-[#f8fafd] px-4 py-3">
            <Shield size={13} strokeWidth={2} className="shrink-0 text-[#2154d8]" />
            <span className="flex-1 text-[12px] font-bold uppercase tracking-wide text-[#374151]">
              AUTORIZACIÓN REQUERIDA
            </span>
            <button onClick={cerrar} className="text-[#c0cad4] transition hover:text-[#374151]">
              <X size={14} strokeWidth={2} />
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-3 px-4 py-4">

            <p className="text-[11px] text-[#6b7280] leading-snug">
              <span className="font-semibold text-[#374151]">{operacionRef.current}</span>
              {" "}requiere PIN de Autorización.
            </p>

            {alerta && (
              <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2">
                <AlertTriangle size={12} strokeWidth={2} className="shrink-0 text-red-500 mt-px" />
                <p className="text-[10px] font-semibold text-red-600 leading-snug">
                  Múltiples intentos fallidos registrados. Contacte al administrador del sistema.
                </p>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9ca3af]">
                PIN Autorización (6 dígitos)
              </span>
              <input
                autoFocus
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={pin}
                onChange={e => {
                  setPin(e.target.value.replace(/\D/g, "").slice(0, 6));
                  setError(null);
                }}
                onKeyDown={e => {
                  if (e.key === "Enter" && pin.length === 6) confirmar();
                  if (e.key === "Escape") cerrar();
                }}
                placeholder="••••••"
                className={`w-full rounded-xl border px-3 py-2.5 text-center text-[20px] font-bold tracking-[0.4em] text-[#1a2d4e] outline-none placeholder:text-[#d1d9e1] placeholder:tracking-normal placeholder:text-[14px] transition focus:ring-2 ${
                  error
                    ? "border-red-300 focus:border-red-400 focus:ring-red-200/40"
                    : "border-[#e4e9f0] focus:border-[#2154d8] focus:ring-[#2154d8]/10"
                }`}
              />
              {error && (
                <p className="text-[10px] font-semibold text-red-500">{error}</p>
              )}
            </div>

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-1.5">
              {["7","8","9","4","5","6","1","2","3"].map(d => (
                <button
                  key={d}
                  onClick={() => {
                    if (pin.length < 6) {
                      setPin(p => p + d);
                      setError(null);
                    }
                  }}
                  className="h-10 rounded-xl border border-[#e4edf6] bg-[#f5f8fc] text-[15px] font-semibold text-[#1a2d4e] transition hover:bg-[#eaf0f9] active:scale-95"
                >
                  {d}
                </button>
              ))}
              <button
                onClick={() => { setPin(p => p.slice(0, -1)); setError(null); }}
                className="h-10 rounded-xl border border-[#fde8e8] bg-[#fff8f8] text-[10px] font-bold uppercase tracking-wide text-red-400 transition hover:bg-[#fff1f1] active:scale-95"
              >
                ⌫
              </button>
              <button
                onClick={() => {
                  if (pin.length < 6) {
                    setPin(p => p + "0");
                    setError(null);
                  }
                }}
                className="h-10 rounded-xl border border-[#e4edf6] bg-[#f5f8fc] text-[15px] font-semibold text-[#1a2d4e] transition hover:bg-[#eaf0f9] active:scale-95"
              >
                0
              </button>
              <button
                onClick={() => { if (pin.length === 6) confirmar(); }}
                disabled={pin.length < 6 || alerta}
                className={`h-10 rounded-xl text-[10px] font-bold uppercase tracking-wide transition active:scale-95 ${
                  pin.length === 6 && !alerta
                    ? "bg-[#2154d8] text-white hover:bg-[#1a44be] shadow-sm"
                    : "bg-[#2154d8]/15 text-[#2154d8]/40 cursor-not-allowed"
                }`}
              >
                OK
              </button>
            </div>

          </div>
        </div>
      </div>
    );
  }, [visible, pin, error, alerta, cerrar, confirmar]) as React.FC;

  return { solicitarAutorizacion, PinAutorizacionModal };
}
