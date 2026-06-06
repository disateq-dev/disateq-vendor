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

  actualizarCantidad: (
    lineaId: string,
    cantidad: number
  ) => void;

  actualizarNota: (
    lineaId: string,
    nota: string
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
          if (state.linesById[line.lineaId]) {
            const ex = state.linesById[line.lineaId];
            ex.cantidad += line.cantidad;
            ex.subtotal = moneyMul(ex.cantidad, ex.valorUnitario);
            state.indiceLineaActiva = -1;
            return;
          }
          // Merge only with lines that have no note — noted lines are individual
          const existingId = state.lineOrder.find(
            (id) => state.linesById[id]?.hovId === line.hovId && !state.linesById[id]?.nota
          );
          if (existingId) {
            const ex = state.linesById[existingId];
            ex.cantidad += line.cantidad;
            ex.subtotal = moneyMul(ex.cantidad, ex.valorUnitario);
            state.indiceLineaActiva = -1;
            return;
          }
          state.linesById[line.lineaId] = line;
          state.lineOrder.push(line.lineaId);
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

      actualizarCantidad: (
        lineaId,
        cantidad
      ) =>
        set((state) => {
          const line =
            state.linesById[
              lineaId
            ];

          if (!line) return;

          line.cantidad = cantidad;
          line.subtotal = moneyMul(line.cantidad, line.valorUnitario);
        }),

      actualizarNota: (lineaId, nota) =>
        set((state) => {
          const line = state.linesById[lineaId];
          if (!line) return;
          if (nota) line.nota = nota;
          else delete line.nota;
        }),

      splitLinea: (lineaId, nota) =>
        set((state) => {
          const line = state.linesById[lineaId];
          if (!line) return;

          if (!nota) {
            // Note cleared — try to reverse-merge into an unnoted sibling
            delete line.nota;
            const siblingId = state.lineOrder.find(
              id => id !== lineaId &&
                    state.linesById[id]?.hovId === line.hovId &&
                    !state.linesById[id]?.nota
            );
            if (siblingId) {
              state.linesById[siblingId].cantidad += line.cantidad;
              state.linesById[siblingId].subtotal = moneyMul(state.linesById[siblingId].cantidad, state.linesById[siblingId].valorUnitario);
              delete state.linesById[lineaId];
              state.lineOrder = state.lineOrder.filter(id => id !== lineaId);
              state.indiceLineaActiva = -1;
            }
            return;
          }

          if (line.cantidad <= 1) {
            line.nota = nota;
            return;
          }

          // Disaggregate: original keeps qty-1, new line gets qty=1 + note
          line.cantidad -= 1;
          line.subtotal  = moneyMul(line.cantidad, line.valorUnitario);

          const noted: LineaPreVenta = {
            lineaId:       crypto.randomUUID(),
            hovId:         line.hovId,
            descripcion:   line.descripcion,
            codigoBarras:  line.codigoBarras,
            cantidad:      1,
            valorUnitario: line.valorUnitario,
            subtotal:      line.valorUnitario,
            nota,
            flags:         { esPrecioManual: line.flags?.esPrecioManual ?? false, esRecuperada: false },
          };

          const idx = state.lineOrder.indexOf(lineaId);
          state.linesById[noted.lineaId] = noted;
          if (idx >= 0) state.lineOrder.splice(idx + 1, 0, noted.lineaId);
          else          state.lineOrder.push(noted.lineaId);
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
