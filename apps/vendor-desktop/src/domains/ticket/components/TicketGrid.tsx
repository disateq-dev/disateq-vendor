import { useTicketLines } from "../selectors/ticket.selectors";

export function TicketGrid() {
  const lines = useTicketLines();

  return (
    <div>
      <h2>Ticket</h2>

      {lines.length === 0 ? (
        <p>No hay productos.</p>
      ) : (
        <ul>
          {lines.map((line) => (
            <li key={line.lineId}>
              {line.description} × {line.quantity}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}