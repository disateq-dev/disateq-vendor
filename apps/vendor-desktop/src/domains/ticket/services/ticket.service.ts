import { createTicketLine } from "../state/ticket.actions";

import { useTicketStore } from "../state/ticket.store";

type AddProductInput = {
  productId: string;
  description: string;
  barcode: string;
  unitPrice: number;
};

export const ticketService = {
  addProduct(input: AddProductInput) {
    useTicketStore.getState().addLine(
      createTicketLine({
        productId: input.productId,
        description: input.description,
        barcode: input.barcode,
        quantity: 1,
        unitPrice: input.unitPrice,
      }),
    );
  },

  incrementLine(lineId: string) {
    const state = useTicketStore.getState();

    const line = state.linesById[lineId];

    if (!line) return;

    state.updateQuantity(lineId, line.quantity + 1);
  },

  decrementLine(lineId: string) {
    const state = useTicketStore.getState();
    const line = state.linesById[lineId];
    if (!line || line.quantity <= 1) return;
    state.updateQuantity(lineId, line.quantity - 1);
  },

  removeLine(lineId: string) {
    useTicketStore.getState().removeLine(lineId);
  },

  openLineNote(lineId: string) {
    useTicketStore.getState().openNoteFor(lineId);
  },

  saveLineNote(lineId: string, note: string) {
    useTicketStore.getState().splitLine(lineId, note);
  },

  clear() {
    useTicketStore.getState().clearTicket();
  },
};