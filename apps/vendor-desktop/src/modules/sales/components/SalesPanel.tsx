export function SalesPanel() {
  return (
    <div className="flex h-full gap-3 p-3">
      {/* SEARCH + RESULTS */}
      <section className="flex w-[55%] flex-col gap-3">
        <div className="overflow-hidden rounded-2xl border border-[#e4e9f0] bg-white">
          {/* SEARCHBAR */}
          <div className="flex h-[72px] items-center border-b border-[#e4e9f0] px-5">
            <div className="mr-4 text-2xl text-[#b8c4d4]">
              ⌕
            </div>

            <input
              type="text"
              placeholder="Buscar producto o escanear código..."
              className="w-full border-none bg-transparent text-[24px] font-semibold tracking-tight text-[#1a2d4e] outline-none placeholder:font-medium placeholder:text-[#b8c4d4]"
            />
          </div>

          {/* RESULTS */}
          <div className="flex flex-col gap-2 p-2">
            <button className="flex items-center justify-between rounded-2xl px-4 py-4 text-left transition-colors hover:bg-[#f8fafc]">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-emerald-400" />

                <div>
                  <div className="text-[17px] font-semibold tracking-tight text-[#1a2d4e]">
                    Arroz Costeño 1kg
                  </div>

                  <div className="mt-1 text-sm text-[#6b7a99]">
                    P001 · S/ 5.00
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[16px] font-semibold text-emerald-600">
                  Stock: 45
                </div>
              </div>
            </button>

            <button className="flex items-center justify-between rounded-2xl px-4 py-4 text-left transition-colors hover:bg-[#f8fafc]">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-amber-400" />

                <div>
                  <div className="text-[17px] font-semibold tracking-tight text-[#1a2d4e]">
                    Azúcar Rubia 1kg
                  </div>

                  <div className="mt-1 text-sm text-[#6b7a99]">
                    P002 · S/ 3.50
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[16px] font-semibold text-amber-500">
                  Stock: 3 ⚠
                </div>
              </div>
            </button>

            <button
              disabled
              className="flex items-center justify-between rounded-2xl px-4 py-4 text-left opacity-50"
            >
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-red-300" />

                <div>
                  <div className="text-[17px] font-semibold tracking-tight text-[#374151]">
                    Aceite Primor 1L
                  </div>

                  <div className="mt-1 text-sm text-[#6b7a99]">
                    P003 · S/ 12.00
                  </div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[16px] font-semibold text-red-300">
                  SIN STOCK
                </div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* SALE DETAIL */}
      <aside className="flex w-[45%] flex-col overflow-hidden rounded-2xl border border-[#e4e9f0] bg-white">
        {/* ITEMS */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex items-start justify-between rounded-2xl border border-[#e4e9f0] bg-white p-4 transition-colors hover:bg-[#f8fafc]">
            {/* LEFT */}
            <div className="flex flex-1 items-start gap-4">
              <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#e4e9f0] text-lg text-[#6b7a99] transition-colors hover:bg-[#f0f4f9]">
                ⌂
              </button>

              <div className="flex-1">
                <div className="text-[17px] font-semibold tracking-tight text-[#1a2d4e]">
                  Chaufa Especial
                </div>

                <div className="mt-1 text-sm text-[#6b7a99]">
                  Sin cebolla · Poco ají
                </div>

                {/* ACTIONS */}
                <div className="mt-4 flex items-center gap-2">
                  <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#e4e9f0] text-lg font-medium text-[#374151] transition-colors hover:bg-[#f0f4f9]">
                    −
                  </button>

                  <div className="flex h-11 min-w-[52px] items-center justify-center rounded-xl border border-[#e4e9f0] bg-[#f8fafc] px-3 text-base font-semibold text-[#1a2d4e]">
                    2
                  </div>

                  <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#e4e9f0] text-lg font-medium text-[#374151] transition-colors hover:bg-[#f0f4f9]">
                    +
                  </button>

                  <button className="ml-2 flex h-11 w-11 items-center justify-center rounded-xl border border-[#e4e9f0] text-lg text-[#6b7a99] transition-colors hover:bg-[#f0f4f9]">
                    📌
                  </button>

                  <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-100 text-lg text-red-400 transition-colors hover:bg-red-50">
                    ⨯
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT */}
            <div className="ml-4 text-right">
              <div className="text-[24px] font-semibold tracking-tight text-[#1a2d4e]">
                S/ 36.00
              </div>

              <div className="mt-2 text-sm text-[#6b7a99]">
                S/ 18.00 c/u
              </div>
            </div>
          </div>
        </div>

        {/* TOTALS */}
        <div className="border-t border-[#e4e9f0] p-4">
          <div className="mb-5 flex items-center justify-between">
            <span className="text-[18px] font-semibold tracking-tight text-[#1a2d4e]">
              TOTAL
            </span>

            <span className="text-5xl font-semibold tracking-tight text-[#1a2d4e]">
              S/ 36.00
            </span>
          </div>

          <button className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-[#45b356] text-[17px] font-bold uppercase tracking-wider text-white shadow-[0_4px_14px_rgba(69,179,86,0.32)] transition hover:bg-[#35994a] active:scale-[0.98]">
            COBRAR
            <span className="text-xl">
              ›
            </span>
          </button>
        </div>
      </aside>
    </div>
  )
}