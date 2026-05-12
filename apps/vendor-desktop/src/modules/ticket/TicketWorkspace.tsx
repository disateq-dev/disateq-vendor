import { TicketGrid } from "../../domains/ticket/components/TicketGrid";
import { CobroPanel } from "./CobroPanel";

export function TicketWorkspace() {
  return (
    <section className="relative h-full w-[420px]">
      <TicketGrid />
      <CobroPanel />
    </section>
  );
}
