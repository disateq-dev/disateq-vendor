import { PreVentaGrid } from "../../domains/preventa/components/PreVentaGrid";
import { CobroPanel } from "./CobroPanel";
import { usePOS } from "../../context/POSContext";

export function PreVentaWorkspace() {
  const { cobroOpen } = usePOS();
  return (
    <section className="h-full w-[480px]">
      {cobroOpen ? <CobroPanel /> : <PreVentaGrid />}
    </section>
  );
}
