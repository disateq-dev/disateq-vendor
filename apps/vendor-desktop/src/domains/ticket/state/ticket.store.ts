import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

import type { TicketLineDTO } from "../dto/TicketLineDTO";

interface TicketState {
  linesById: Record<string, TicketLineDTO>;

  lineOrder: string[];

  addLine: (
    line: TicketLineDTO
  ) => void;

  removeLine: (
    lineId: string
  ) => void;

  updateQuantity: (
    lineId: string,
    quantity: number
  ) => void;

  updateNote: (
    lineId: string,
    note: string
  ) => void;

  clearTicket: () => void;
  pendingNoteLineId: string | null;
  openNoteFor: (lineId: string) => void;
  clearPendingNote: () => void;
  activeLineIdx: number;
  setActiveLineIdx: (idx: number) => void;
}

export const useTicketStore =
  create<TicketState>()(
    immer((set) => ({
      linesById: {},

      lineOrder: [],

      addLine: (line) =>
        set((state) => {
          // Check by lineId
          if (state.linesById[line.lineId]) {
            const ex = state.linesById[line.lineId];
            ex.quantity += line.quantity;
            ex.subtotal = ex.quantity * ex.unitPrice;
            state.activeLineIdx = -1;
            return;
          }
          // Check by productId — same product added again
          const existingId = state.lineOrder.find(
            (id) => state.linesById[id]?.productId === line.productId
          );
          if (existingId) {
            const ex = state.linesById[existingId];
            ex.quantity += line.quantity;
            ex.subtotal = ex.quantity * ex.unitPrice;
            state.activeLineIdx = -1;
            return;
          }
          state.linesById[line.lineId] = line;
          state.lineOrder.push(line.lineId);
          state.activeLineIdx = -1;
        }),

      removeLine: (lineId) =>
        set((state) => {
          delete state.linesById[lineId];
          state.lineOrder = state.lineOrder.filter((id) => id !== lineId);
          const newLen = state.lineOrder.length;
          if (newLen === 0) state.activeLineIdx = -1;
          else if (state.activeLineIdx >= newLen) state.activeLineIdx = newLen - 1;
        }),

      updateQuantity: (
        lineId,
        quantity
      ) =>
        set((state) => {
          const line =
            state.linesById[
              lineId
            ];

          if (!line) return;

          line.quantity = quantity;

          line.subtotal =
            line.quantity *
            line.unitPrice;
        }),

      updateNote: (lineId, note) =>
        set((state) => {
          const line = state.linesById[lineId];
          if (!line) return;
          if (note) line.note = note;
          else delete line.note;
        }),

      clearTicket: () =>
        set((state) => {
          state.linesById = {};
          state.lineOrder = [];
          state.activeLineIdx = -1;
        }),

      pendingNoteLineId: null,
      openNoteFor: (lineId) =>
        set((state) => { state.pendingNoteLineId = lineId; }),
      clearPendingNote: () =>
        set((state) => { state.pendingNoteLineId = null; }),

      activeLineIdx: -1,
      setActiveLineIdx: (idx) =>
        set((state) => { state.activeLineIdx = idx; }),
    }))
  );