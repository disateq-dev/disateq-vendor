import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

import type { TicketLineDTO } from "../dto/TicketLineDTO";
import { moneyMul } from "../../../lib/money";

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

  splitLine: (
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
            ex.subtotal = moneyMul(ex.quantity, ex.unitPrice);
            state.activeLineIdx = -1;
            return;
          }
          // Merge only with lines that have no note — noted lines are individual
          const existingId = state.lineOrder.find(
            (id) => state.linesById[id]?.productId === line.productId && !state.linesById[id]?.note
          );
          if (existingId) {
            const ex = state.linesById[existingId];
            ex.quantity += line.quantity;
            ex.subtotal = moneyMul(ex.quantity, ex.unitPrice);
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
          line.subtotal = moneyMul(line.quantity, line.unitPrice);
        }),

      updateNote: (lineId, note) =>
        set((state) => {
          const line = state.linesById[lineId];
          if (!line) return;
          if (note) line.note = note;
          else delete line.note;
        }),

      splitLine: (lineId, note) =>
        set((state) => {
          const line = state.linesById[lineId];
          if (!line) return;

          if (!note) {
            // Note cleared — try to reverse-merge into an unnoted sibling
            delete line.note;
            const siblingId = state.lineOrder.find(
              id => id !== lineId &&
                    state.linesById[id]?.productId === line.productId &&
                    !state.linesById[id]?.note
            );
            if (siblingId) {
              state.linesById[siblingId].quantity += line.quantity;
              state.linesById[siblingId].subtotal = moneyMul(state.linesById[siblingId].quantity, state.linesById[siblingId].unitPrice);
              delete state.linesById[lineId];
              state.lineOrder = state.lineOrder.filter(id => id !== lineId);
              state.activeLineIdx = -1;
            }
            return;
          }

          if (line.quantity <= 1) {
            line.note = note;
            return;
          }

          // Disaggregate: original keeps qty-1, new line gets qty=1 + note
          line.quantity -= 1;
          line.subtotal  = moneyMul(line.quantity, line.unitPrice);

          const noted: TicketLineDTO = {
            lineId:      crypto.randomUUID(),
            productId:   line.productId,
            description: line.description,
            barcode:     line.barcode,
            quantity:    1,
            unitPrice:   line.unitPrice,
            subtotal:    line.unitPrice,
            note,
            flags:       { isManualPrice: line.flags?.isManualPrice ?? false, isRecovered: false },
          };

          const idx = state.lineOrder.indexOf(lineId);
          state.linesById[noted.lineId] = noted;
          if (idx >= 0) state.lineOrder.splice(idx + 1, 0, noted.lineId);
          else          state.lineOrder.push(noted.lineId);
          state.activeLineIdx = -1;
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