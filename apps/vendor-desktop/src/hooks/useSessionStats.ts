import { useState, useCallback, useRef } from "react";
import { moneySub } from "../lib/money";
import type { Comprobante } from "../domains/documents/comprobante.types";

export type DocRange  = { series: string; first: number; last: number; count: number };
export type ByMethod  = { efe: number; yap: number; tar: number; mix: number };
export type SessionStats = {
  count: number; total: number; cash: number; yape: number; tarjeta: number;
  docRanges: Partial<Record<string, DocRange>>;
  byMethod: ByMethod;
};
export type DocCorrelatives = Partial<Record<string, number>>;

export const NULL_STATS: SessionStats = {
  count: 0, total: 0, cash: 0, yape: 0, tarjeta: 0, docRanges: {},
  byMethod: { efe: 0, yap: 0, tar: 0, mix: 0 },
};

interface UseSessionStatsDeps {
  initialStats?: SessionStats;
}

export function useSessionStats({ initialStats }: UseSessionStatsDeps = {}) {
  const [sessionStats, setSessionStats] = useState<SessionStats>(
    initialStats ?? NULL_STATS
  );

  const [docCorrelatives, setDocCorrelatives] = useState<DocCorrelatives>({});

  const sessionStatsRef = useRef(sessionStats);
  sessionStatsRef.current = sessionStats;

  const recordSale = useCallback((
    netTotal: number, payMethod: string,
    docType?: string, docSeries?: string, docCorrelative?: number,
    cashComponent?: number, mixtoYapComponent?: number, mixtoTarComponent?: number,
  ) => {
    setSessionStats(prev => {
      const ranges = { ...prev.docRanges };
      if (docType && docSeries && docCorrelative !== undefined) {
        const existing = ranges[docType];
        ranges[docType] = existing
          ? { series: docSeries, first: existing.first, last: docCorrelative, count: existing.count + 1 }
          : { series: docSeries, first: docCorrelative, last: docCorrelative, count: 1 };
      }
      const addCash = payMethod === "efectivo" ? netTotal : payMethod === "mixto" ? (cashComponent ?? 0) : 0;
      const addYape = payMethod === "yape"     ? netTotal : payMethod === "mixto" ? (mixtoYapComponent ?? 0) : 0;
      const addTar  = payMethod === "tarjeta"  ? netTotal : payMethod === "mixto" ? (mixtoTarComponent ?? 0) : 0;
      return {
        count:     prev.count + 1,
        total:     prev.total + netTotal,
        cash:      prev.cash    + addCash,
        yape:      prev.yape    + addYape,
        tarjeta:   prev.tarjeta + addTar,
        docRanges: ranges,
        byMethod: {
          efe: prev.byMethod.efe + (payMethod === "efectivo" ? 1 : 0),
          yap: prev.byMethod.yap + (payMethod === "yape"     ? 1 : 0),
          tar: prev.byMethod.tar + (payMethod === "tarjeta"  ? 1 : 0),
          mix: prev.byMethod.mix + (payMethod === "mixto"    ? 1 : 0),
        },
      };
    });
    if (docType && docCorrelative !== undefined) {
      setDocCorrelatives(prev => ({ ...prev, [docType]: docCorrelative }));
    }
  }, []);

  const revertirVenta = useCallback((c: Comprobante) => {
    setSessionStats(prev => ({
      count:     prev.count - 1,
      total:     moneySub(prev.total, c.total),
      cash:      prev.cash,
      yape:      prev.yape,
      tarjeta:   prev.tarjeta,
      docRanges: prev.docRanges,
      byMethod: {
        efe: prev.byMethod.efe - (c.metodoPago === "EFECTIVO" ? 1 : 0),
        yap: prev.byMethod.yap - (c.metodoPago === "YAPE"     ? 1 : 0),
        tar: prev.byMethod.tar - (c.metodoPago === "TARJETA"  ? 1 : 0),
        mix: prev.byMethod.mix - (c.metodoPago === "MIXTO"    ? 1 : 0),
      },
    }));
  }, []);

  const resetStats = useCallback(() => setSessionStats(NULL_STATS), []);

  return {
    sessionStats, sessionStatsRef,
    docCorrelatives,
    recordSale, revertirVenta, resetStats,
  };
}
