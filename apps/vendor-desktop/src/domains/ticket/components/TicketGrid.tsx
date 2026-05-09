import { useTicketLines } from "../selectors/ticket.selectors";

export function TicketGrid() {
  const lines = useTicketLines();

  return (
    <section className="flex flex-col gap-4">
      <header
        className="
          flex
          items-center
          justify-between
          border-b
          border-zinc-800
          pb-3
        "
      >
        <div>
          <h1
            className="
              text-lg
              font-semibold
              tracking-tight
            "
          >
            Ticket Actual
          </h1>

          <p
            className="
              text-xs
              text-zinc-500
            "
          >
            Operación local activa
          </p>
        </div>

        <div
          className="
            rounded-md
            bg-emerald-500/10
            px-2
            py-1
            text-xs
            font-medium
            text-emerald-400
          "
        >
          ONLINE
        </div>
      </header>

      <div
        className="
          flex
          flex-col
          gap-2
        "
      >
        {lines.length === 0 ? (
          <div
            className="
              rounded-lg
              border
              border-dashed
              border-zinc-700
              p-6
              text-center
              text-sm
              text-zinc-500
            "
          >
            No hay productos en el ticket
          </div>
        ) : (
          lines.map((line) => (
            <article
              key={line.lineId}
              className="
                flex
                items-center
                justify-between
                rounded-lg
                border
                border-zinc-800
                bg-zinc-900
                px-3
                py-2
              "
            >
              <div className="min-w-0">
                <h2
                  className="
                    truncate
                    text-sm
                    font-medium
                  "
                >
                  {line.description}
                </h2>

                <p
                  className="
                    text-xs
                    text-zinc-500
                  "
                >
                  S/ {line.unitPrice.toFixed(2)}
                </p>
              </div>

              <div
                className="
                  flex
                  items-center
                  gap-4
                "
              >
                <span
                  className="
                    text-sm
                    font-medium
                  "
                >
                  × {line.quantity}
                </span>

                <span
                  className="
                    w-16
                    text-right
                    text-sm
                    font-semibold
                  "
                >
                  S/ {line.subtotal.toFixed(2)}
                </span>
              </div>
            </article>
          ))
        )}
      </div>

      <footer
        className="
          flex
          items-center
          justify-between
          border-t
          border-zinc-800
          pt-3
        "
      >
        <span
          className="
            text-sm
            text-zinc-400
          "
        >
          Total
        </span>

        <strong
          className="
            text-xl
            font-semibold
          "
        >
          S/{" "}
          {lines
            .reduce(
              (acc, line) =>
                acc + line.subtotal,
              0
            )
            .toFixed(2)}
        </strong>
      </footer>
    </section>
  );
}