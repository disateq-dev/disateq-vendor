export function SalesPanel() {
  return (
    <div className="flex h-full gap-3 p-3">
      {/* SEARCH + RESULTS */}
      <section className="flex w-[55%] flex-col gap-3">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
          {/* SEARCHBAR */}
          <div className="flex h-[72px] items-center border-b border-zinc-100 px-5">
            <div className="mr-4 text-2xl text-zinc-300">
              ⌕
            </div>

            <input
              type="text"
              placeholder="Buscar producto o escanear código..."
              className="w-full border-none bg-transparent text-[24px] font-semibold tracking-tight text-zinc-900 outline-none placeholder:font-medium placeholder:text-zinc-400"
            />
          </div>

          {/* RESULTS */}
          <div className="flex flex-col gap-2 p-2">
            <button className="flex items-center justify-between rounded-2xl px-4 py-4 text-left transition-colors hover:bg-zinc-50">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-emerald-400" />

                <div>
                  <div className="text-[17px] font-semibold tracking-tight text-zinc-900">
                    Arroz Costeño 1kg
                  </div>

                  <div className="mt-1 text-sm text-zinc-500">
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

            <button className="flex items-center justify-between rounded-2xl px-4 py-4 text-left transition-colors hover:bg-zinc-50">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 rounded-full bg-amber-400" />

                <div>
                  <div className="text-[17px] font-semibold tracking-tight text-zinc-900">
                    Azúcar Rubia 1kg
                  </div>

                  <div className="mt-1 text-sm text-zinc-500">
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
                  <div className="text-[17px] font-semibold tracking-tight text-zinc-700">
                    Aceite Primor 1L
                  </div>

                  <div className="mt-1 text-sm text-zinc-500">
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
      <aside className="flex w-[45%] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white">
        {/* ITEMS */}
        <div className="flex-1 overflow-y-auto p-3">
          <div className="flex items-start justify-between rounded-2xl border border-zinc-100 bg-white p-4 transition-colors hover:bg-zinc-50">
            {/* LEFT */}
            <div className="flex flex-1 items-start gap-4">
              <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 text-lg text-zinc-500 transition-colors hover:bg-zinc-100">
                ⌂
              </button>

              <div className="flex-1">
                <div className="text-[17px] font-semibold tracking-tight text-zinc-900">
                  Chaufa Especial
                </div>

                <div className="mt-1 text-sm text-zinc-500">
                  Sin cebolla · Poco ají
                </div>

                {/* ACTIONS */}
                <div className="mt-4 flex items-center gap-2">
                  <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 text-lg font-medium text-zinc-600 transition-colors hover:bg-zinc-100">
                    −
                  </button>

                  <div className="flex h-11 min-w-[52px] items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50 px-3 text-base font-semibold text-zinc-900">
                    2
                  </div>

                  <button className="flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 text-lg font-medium text-zinc-600 transition-colors hover:bg-zinc-100">
                    +
                  </button>

                  <button className="ml-2 flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 text-lg text-zinc-500 transition-colors hover:bg-zinc-100">
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
              <div className="text-[24px] font-semibold tracking-tight text-zinc-900">
                S/ 36.00
              </div>

              <div className="mt-2 text-sm text-zinc-500">
                S/ 18.00 c/u
              </div>
            </div>
          </div>
        </div>

        {/* TOTALS */}
        <div className="border-t border-zinc-100 p-4">
          <div className="mb-5 flex items-center justify-between">
            <span className="text-[18px] font-semibold tracking-tight text-zinc-900">
              TOTAL
            </span>

            <span className="text-5xl font-semibold tracking-tight text-zinc-900">
              S/ 36.00
            </span>
          </div>

          <button className="flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-zinc-900 text-[17px] font-semibold tracking-tight text-white transition-colors hover:bg-zinc-800">
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