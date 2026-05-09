import { useShallow } from "zustand/react/shallow";

import { useTicketStore } from "../state/ticket.store";

export const useTicketLines = () =>
  useTicketStore(
    useShallow((state) =>
      state.lineOrder.map(
        (id) => state.linesById[id]
      )
    )
  );

export const useTicketLineById = (
  lineId: string
) =>
  useTicketStore(
    (state) => state.linesById[lineId]
  );

export const useTicketLineCount = () =>
  useTicketStore(
    (state) => state.lineOrder.length
  );