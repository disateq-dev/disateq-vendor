import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Power } from "lucide-react";
import { loadBusinessConfig } from "../config/business";
import { usePOS } from "../context/POSContext";
import { usePreVentaStore } from "../domains/preventa/state/preventa.store";
import logoImg from "../assets/branding/disateq-vendor-login2.png";

export function Topbar() {
  const biz = useMemo(() => loadBusinessConfig(), []);
  const { logoutOperator, cashSession, cobroOpen, cashMoves } = usePOS();
  const [confirmando, setConfirmando] = useState(false);

  function handlePowerClick() {
    setConfirmando(true);
  }

  function handleConfirmarLogout() {
    logoutOperator();
    setConfirmando(false);
  }

  function handleCancelarLogout() {
    setConfirmando(false);
  }

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && !e.altKey && e.code === "End") {
        e.preventDefault();
        setConfirmando(true);
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    if (!confirmando) return;
    function handler(e: KeyboardEvent) {
      if (e.code === "Enter" && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        handleConfirmarLogout();
      }
      if (e.code === "Escape" && !e.ctrlKey && !e.shiftKey && !e.altKey) {
        e.preventDefault();
        handleCancelarLogout();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [confirmando]);

  return (
    <>
    <section className="flex h-[64px] items-center justify-between bg-[#0f1f3d] px-5">

      {/* LEFT */}
      <section className="flex min-w-0 items-center">

        {/* BUSINESS */}
        <div className="min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="truncate text-[16px] font-semibold text-white leading-tight">
              {biz.nombreComercial}
            </span>
            <span className="text-[#5a6a88]">·</span>
            <span className="shrink-0 text-[13px] font-medium text-[#8090b0]">
              {biz.alias}
            </span>
          </div>
          <div className="mt-[-3px] flex items-center gap-2">
            <span className="text-[12px] text-[#8090b0]">R.U.C. {biz.ruc}</span>
            <span className="text-[#5a6a88]">·</span>
            <span className="truncate text-[12px] text-[#8090b0]">{biz.razonSocial}</span>
          </div>
        </div>

      </section>

      {/* RIGHT */}
      <section className="flex items-center gap-3 pl-5">


        {/* BRAND */}
        <img
          src={logoImg}
          alt="DisateQ VENDOR™"
          draggable={false}
          className="h-[37px] w-auto object-contain"
        />

        <div className="h-8 w-px bg-white/10" />

        {/* POWER — logout operador: vuelve al LoginScreen */}
        <button
          title="Cerrar sistema"
          onClick={handlePowerClick}
          className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#dc2626] text-white shadow-[0_2px_8px_rgba(220,38,38,0.3)] transition hover:bg-[#b91c1c] active:scale-[0.95]"
        >
          <Power size={16} />
        </button>

      </section>
    </section>
      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-[2px]">
          <div className="w-[400px] rounded-[20px] bg-white shadow-[0_8px_40px_rgba(15,23,42,0.22)] overflow-hidden border border-[#e4e9f0]">
            <div className="bg-[#0f1f3d] px-5 py-3 flex items-center gap-2">
              <Power size={13} className="text-white/70" />
              <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-white">CERRAR SESIÓN</span>
            </div>
            <div className="px-5 py-4 flex flex-col gap-2">
              {(() => {
                const lineasPreVenta = usePreVentaStore.getState().lineOrder.length;
                const movPendientes = cashMoves.filter(m => m.regularizationStatus === "por_regularizar").length;
                const sinAdvertencias = !cobroOpen && lineasPreVenta === 0 && !(cashSession.isOpen && cashSession.cashBox !== null) && movPendientes === 0;

                return (
                  <>
                    {cobroOpen && (
                      <div className="bg-[#fef2f2] border border-[#fecaca] rounded-xl px-4 py-2.5 flex items-start gap-2">
                        <AlertTriangle size={13} className="shrink-0 mt-px text-[#dc2626]" />
                        <p className="text-[11px] font-semibold text-[#dc2626] leading-snug">Hay un cobro en proceso. Al cerrar sesión se cancelará la transacción.</p>
                      </div>
                    )}
                    {lineasPreVenta > 0 && (
                      <div className="bg-[#fef2f2] border border-[#fecaca] rounded-xl px-4 py-2.5 flex items-start gap-2">
                        <AlertTriangle size={13} className="shrink-0 mt-px text-[#dc2626]" />
                        <p className="text-[11px] font-semibold text-[#dc2626] leading-snug">Hay una venta en curso con {lineasPreVenta} producto(s). Se perderá al cerrar sesión.</p>
                      </div>
                    )}
                    {cashSession.isOpen && cashSession.cashBox !== null && (
                      <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl px-4 py-2.5 flex items-start gap-2">
                        <AlertTriangle size={13} className="shrink-0 mt-px text-[#d97706]" />
                        <p className="text-[11px] font-semibold text-[#d97706] leading-snug">Cuidado, la caja {cashSession.cashBox.code} quedará abierta y disponible. Recuerde cerrarla al reingresar.</p>
                      </div>
                    )}
                    {movPendientes > 0 && (
                      <div className="bg-[#fffbeb] border border-[#fde68a] rounded-xl px-4 py-2.5 flex items-start gap-2">
                        <AlertTriangle size={13} className="shrink-0 mt-px text-[#d97706]" />
                        <p className="text-[11px] font-semibold text-[#d97706] leading-snug">Hay {movPendientes} movimiento(s) de caja pendiente(s) de regularizar.</p>
                      </div>
                    )}
                    {sinAdvertencias && (
                      <p className="text-[12px] text-[#6b7280] py-1">¿Confirma que desea cerrar la sesión actual?</p>
                    )}
                  </>
                );
              })()}
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button
                onClick={handleCancelarLogout}
                className="flex-1 h-10 rounded-xl border border-[#f97316]/40 text-[#f97316] hover:bg-[#fff7ed] text-[11px] font-bold uppercase tracking-[0.07em] transition active:scale-95"
              >
                CANCELAR
              </button>
              <button
                onClick={handleConfirmarLogout}
                className="flex-[2] h-10 rounded-xl bg-[#dc2626] text-white hover:bg-[#b91c1c] text-[11px] font-bold uppercase tracking-[0.07em] transition active:scale-[0.95] shadow-[0_2px_8px_rgba(220,38,38,0.3)]"
              >
                CERRAR SESIÓN
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
