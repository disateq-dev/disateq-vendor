import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

import type { LineaPreVenta } from "../dto/LineaPreVenta";
import { moneyMul } from "../../../lib/money";

interface EstadoPreVenta {
  linesById: Record<string, LineaPreVenta>;

  lineOrder: string[];

  agregarLinea: (
    line: LineaPreVenta
  ) => void;

  quitarLinea: (
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

  splitLinea: (
    lineId: string,
    note: string
  ) => void;

  limpiarPreVenta: () => void;
  lineaNotaPendienteId: string | null;
  abrirNotaLinea: (lineId: string) => void;
  limpiarNotaPendiente: () => void;
  indiceLineaActiva: number;
  setIndiceLineaActiva: (idx: number) => void;
}

export const usePreVentaStore =
  create<EstadoPreVenta>()(
    immer((set) => ({
      linesById: {},

      lineOrder: [],

      agregarLinea: (line) =>
        set((state) => {
          // Check by lineId
          if (state.linesById[line.lineId]) {
            const ex = state.linesById[line.lineId];
            ex.quantity += line.quantity;
            ex.subtotal = moneyMul(ex.quantity, ex.unitPrice);
            state.indiceLineaActiva = -1;
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
            state.indiceLineaActiva = -1;
            return;
          }
          state.linesById[line.lineId] = line;
          state.lineOrder.push(line.lineId);
          state.indiceLineaActiva = -1;
        }),

      quitarLinea: (lineId) =>
        set((state) => {
          delete state.linesById[lineId];
          state.lineOrder = state.lineOrder.filter((id) => id !== lineId);
          const newLen = state.lineOrder.length;
          if (newLen === 0) state.indiceLineaActiva = -1;
          else if (state.indiceLineaActiva >= newLen) state.indiceLineaActiva = newLen - 1;
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

      splitLinea: (lineId, note) =>
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
              state.indiceLineaActiva = -1;
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

          const noted: LineaPreVenta = {
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
          state.indiceLineaActiva = -1;
        }),

      limpiarPreVenta: () =>
        set((state) => {
          state.linesById = {};
          state.lineOrder = [];
          state.indiceLineaActiva = -1;
        }),

      lineaNotaPendienteId: null,
      abrirNotaLinea: (lineId) =>
        set((state) => { state.lineaNotaPendienteId = lineId; }),
      limpiarNotaPendiente: () =>
        set((state) => { state.lineaNotaPendienteId = null; }),

      indiceLineaActiva: -1,
      setIndiceLineaActiva: (idx) =>
        set((state) => { state.indiceLineaActiva = idx; }),
    }))
  );
