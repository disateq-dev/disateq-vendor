import { useShallow } from "zustand/react/shallow";

import { usePreVentaStore } from "../state/preventa.store";

export const useLineasPreVenta = () =>
  usePreVentaStore(
    useShallow((state) =>
      state.lineOrder.map(
        (id) => state.linesById[id]
      )
    )
  );

export const useLineaPreVentaPorId = (
  lineaId: string
) =>
  usePreVentaStore(
    (state) => state.linesById[lineaId]
  );

export const useConteoLineasPreVenta = () =>
  usePreVentaStore(
    (state) => state.lineOrder.length
  );
