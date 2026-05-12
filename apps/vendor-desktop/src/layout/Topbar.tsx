import { Power, Store } from "lucide-react";

export function Topbar() {
  return (
    <section className="flex h-[64px] items-center justify-between bg-[#0f1f3d] px-5">
      {/* LEFT */}
      <section className="flex min-w-0 items-center">
        {/* BRAND */}
        <div className="flex items-center gap-3.5 pr-7">
          <div className="flex h-9 w-9 items-center justify-center rounded-[14px] bg-[#2154d8] text-white shadow-[0_4px_14px_rgba(33,84,216,0.4)]">
            <Store size={17} />
          </div>

          <div className="flex flex-col">
            <span className="text-[15px] font-extrabold tracking-tight text-white leading-none">
              DisateQ VENDOR™
            </span>
            <span className="mt-0.5 text-[10.5px] font-medium text-[#6b7fa8]">
              Ventas y Gestión Administrativa
            </span>
          </div>
        </div>

        <div className="h-8 w-px bg-white/10" />

        {/* BUSINESS */}
        <div className="min-w-0 px-7">
          <div className="flex items-center gap-2.5">
            <span className="truncate text-[13.5px] font-bold text-[#e8edf5]">
              ALMACEN DE ABARROTES PEÑA
            </span>
            <span className="text-[#3d5280]">•</span>
            <span className="text-[12.5px] font-medium text-[#7c8db8]">
              Tienda Mercado Central
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-[11px] text-[#4d5e7c]">
              R.U.C. 20608399349
            </span>
            <span className="text-[#3d5280]">•</span>
            <span className="truncate text-[11px] text-[#4d5e7c]">
              CONSORCIO PEÑA S.A.C.
            </span>
          </div>
        </div>
      </section>

      {/* RIGHT */}
      <section className="flex items-center gap-3 pl-5">
        {/* OPERATIONAL INFO */}
        <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-1.5">
          <div className="flex items-center gap-2 text-[12.5px]">
            <span className="font-bold text-[#e8edf5]">
              CAJA 02
            </span>
            <span className="text-[#3d5280]">•</span>
            <span className="text-[#7c8db8]">
              Fernando T.
            </span>
          </div>

          <div className="flex items-center gap-2 text-[11px]">
            <span className="font-semibold text-[#4ade80]">
              Turno ACTIVO
            </span>
            <span className="text-[#3d5280]">•</span>
            <span className="text-[#6b7a9a]">
              Apertura 08:15
            </span>
          </div>
        </div>

        {/* POWER */}
        <button className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#dc2626] text-white shadow-[0_2px_8px_rgba(220,38,38,0.3)] transition hover:bg-[#b91c1c]">
          <Power size={16} />
        </button>
      </section>
    </section>
  );
}
