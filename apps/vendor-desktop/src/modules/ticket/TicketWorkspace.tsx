import { TicketGrid } from "../../domains/ticket/components/TicketGrid";
import { CobroPanel } from "./CobroPanel";
import { usePOS } from "../../context/POSContext";

export function TicketWorkspace() {
  const { cobroOpen } = usePOS();
  return (
    <section className="h-full w-[480px]">
      {cobroOpen ? <CobroPanel /> : <TicketGrid />}
    </section>
  );
}
