import { useState, useCallback, useMemo } from "react";
import {
  type TurnEvent,
  type TurnEventType,
} from "../domains/cash/turn-events.store";
import type { CashSession } from "../context/POSContext";
import { registrarEventoTurnoEnSQLite } from '../domains/cash/sesion-caja-sqlite.service'

export type OpLog = { id: string; ts: string; text: string };

interface UseBitacoraDeps {
  cashSessionRef: React.RefObject<CashSession>;
  initialOpLogs?: OpLog[];
}

export function useBitacora({ cashSessionRef, initialOpLogs: _initialOpLogs }: UseBitacoraDeps) {
  const [opLogs, setOpLogs] = useState<OpLog[]>([]);

  const [turnEvents, setTurnEvents] = useState<TurnEvent[]>([]);

  const addOpLog = useCallback((text: string) => {
    const entry: OpLog = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      ts: new Date().toISOString(),
      text,
    };
    setOpLogs(prev => [...prev, entry]);
  }, []);

  const addTurnEvent = useCallback((sk: string, type: TurnEventType, text: string) => {
    if (!sk) return;
    const entry: TurnEvent = {
      id:         `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sessionKey: sk,
      ts:         new Date().toISOString(),
      type,
      text,
    };
    setTurnEvents(prev => [...prev, entry]);
    void registrarEventoTurnoEnSQLite(entry.sessionKey, entry.type, entry.text, entry.ts);
  }, []);

  const cashSession = cashSessionRef.current;
  const currentSessionEvents = useMemo(() => {
    if (!cashSession?.isOpen || !cashSession.cashBox || !cashSession.openedAt) return [];
    const sk = `${cashSession.cashBox.code}-${cashSession.openedAt.toISOString()}`;
    return turnEvents.filter(e => e.sessionKey === sk);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnEvents, cashSessionRef.current]);

  const resetOpLogs = useCallback(() => setOpLogs([]), []);

  return {
    opLogs, addOpLog, resetOpLogs,
    turnEvents, addTurnEvent,
    currentSessionEvents,
  };
}
