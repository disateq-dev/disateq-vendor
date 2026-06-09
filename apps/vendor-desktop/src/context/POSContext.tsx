import { createContext, useCallback, useContext, useState, useEffect, useMemo, useRef, type ReactNode } from "react";
import { loadBusinessConfig } from "../config/business";
import { RUBROS, type Rubro, type VisualMode, type PrintFlow } from "../data/catalogs";
import type { Comprobante } from "../domains/documents/comprobante.types";
import { type Operador, type EstadoOperador } from "../domains/operator/operator.store";
import { type Rol } from "../domains/operator/roles.store";
import { type TurnEvent } from "../domains/cash/turn-events.store";
import { useConfigNegocio } from "../hooks/useConfigNegocio";
import { usePreVentaUX } from "../hooks/usePreVentaUX";
import { useOperadores } from "../hooks/useOperadores";
import { useNotice } from "../hooks/useNotice";
import { useBitacora, type OpLog } from "../hooks/useBitacora";
import { useSessionStats, type SessionStats, type DocCorrelatives, type DocRange, type ByMethod } from "../hooks/useSessionStats";
import { useComprobantes } from "../hooks/useComprobantes";
import { useCaja, recoverOperationalState, type CashSession, type CashBox, type CashBoxType, type CashMove, type MoveType, type MoveSource, type RegularizationStatus, type RegularizationMode } from "../hooks/useCaja";
export type { OpLog };
export type { SessionStats, DocCorrelatives, DocRange, ByMethod };
export type { CashSession, CashBox, CashBoxType, CashMove, MoveType, MoveSource, RegularizationStatus, RegularizationMode };
type FocusZone = "search" | "ticket" | "cobro";

interface POSContextValue {
  zone: FocusZone;
  enterTicket: () => void;
  enterSearch: () => void;
  cobroOpen: boolean;
  openCobro: () => void;
  closeCobro: () => void;
  newSale: () => void;
  cashSession: CashSession;
  cashBoxes: CashBox[];
  suggestedCashBox: CashBox | null;
  openCashSession: (boxCode: string, apertura: number, motivo?: string, refOp?: string, exceptionalSkipCodes?: string[]) => void;
  closeCashSession: () => void;
  correctAperturaData: (apertura: number, motivo?: string, observacion?: string, refOp?: string) => void;
  sessionStats: SessionStats;
  docCorrelatives: DocCorrelatives;
  recordSale: (netTotal: number, payMethod: string, docType?: string, docSeries?: string, docCorrelative?: number, cashComponent?: number, mixtoYapComponent?: number, mixtoTarComponent?: number) => void;
  cashMoves: CashMove[];
  addCashMove: (type: MoveType, amount: number, motivo: string, sourceType: MoveSource, fromApertura: number, fromVendido: number, observacion?: string, refId?: string, regularizationStatus?: RegularizationStatus, regularizationMode?: RegularizationMode) => CashMove;
  updateCashMove: (id: string, status: RegularizationStatus, mode?: RegularizationMode) => void;
  editCashMove: (id: string, motivo: string, observacion?: string) => void;
  opLogs: OpLog[];
  addOpLog: (text: string) => void;
  turnEvents: TurnEvent[];
  currentSessionEvents: TurnEvent[];
  comprobantes: Comprobante[];
  addComprobante: (comprobante: Comprobante) => void;
  voidComprobante: (id: string, motivo: string) => void;
  sessionNotice: string | null;
  showNotice: (msg: string) => void;
  operators: Operador[];
  activeOperator: Operador | null;
  loginOperator: (id: string, pin: string) => boolean;
  logoutOperator: () => void;
  changeOperatorPin: (currentPin: string, newPin: string) => boolean;
  changeOperatorPinById: (id: string, currentPin: string, newPin: string) => boolean;
  resetOperatorPin: (id: string, newPin: string) => boolean;
  createOperator: (data: { apellidos: string; nombres: string; alias: string; dni?: string; telefono?: string; roleCode: string; roleName: string; blockBase: number | null }) => Operador;
  updateOperatorData: (id: string, data: { apellidos: string; nombres: string; alias: string; dni?: string; telefono?: string; roleCode: string; roleName: string; blockBase: number | null }) => boolean;
  setOperatorStatus: (id: string, status: EstadoOperador, reason?: string) => boolean;
  assignOperatorBlock: (id: string, blockBase: number) => boolean;
  releaseOperatorBlock: (id: string) => void;
  updateOperatorCapabilities: (id: string, capabilities: string[]) => void;
  roles: Rol[];
  createRole: (data: { code: string; name: string; description: string }) => Rol;
  updateRoleData: (id: string, data: { code: string; name: string; description: string }) => boolean;
  setRoleActive: (id: string, active: boolean) => void;
  updateRoleCapabilities: (id: string, capabilities: string[]) => void;
  rubro: Rubro;
  setRubro: (r: Rubro) => void;
  visualMode: VisualMode;
  setVisualMode: (m: VisualMode) => void;
  printFlow: PrintFlow;
  setPrintFlow: (f: PrintFlow) => void;
}

const POSContext = createContext<POSContextValue | null>(null);

export function POSProvider({ children }: { children: ReactNode }) {
  const { sessionNotice, showNotice } = useNotice();
  const { rubro, setRubro, setVisualMode: persistVisualMode, printFlow, setPrintFlow } = useConfigNegocio();
  const [visualMode, setVisualModeState] = useState<VisualMode>(() => {
    try {
      const raw = localStorage.getItem("disateq.pos.visualMode");
      if (raw === "lista" || raw === "visual" || raw === "mixto") return raw;
    } catch { /* quota */ }
    const bc = loadBusinessConfig();
    return RUBROS[bc.rubro].defaultVisualMode;
  });
  const setVisualMode = useCallback((m: VisualMode) => {
    setVisualModeState(m);
    persistVisualMode(m);
  }, [persistVisualMode]);

  const [initState] = useState(recoverOperationalState);
  const recoveryLogRef = useRef(initState.recoveryLog);
  const cashSessionRef = useRef<CashSession>(initState.session);
  const setCobroOpenRef = useRef<(v: boolean) => void>(() => {});
  const setZoneRef      = useRef<(z: "search" | "ticket" | "cobro") => void>(() => {});

  const {
    sessionStats, sessionStatsRef,
    docCorrelatives,
    recordSale, revertirVenta, resetStats,
  } = useSessionStats({ initialStats: initState.stats });

  const {
    opLogs, addOpLog, resetOpLogs,
    turnEvents, addTurnEvent,
    currentSessionEvents,
  } = useBitacora({ cashSessionRef });

  useEffect(() => {
    if (recoveryLogRef.current) {
      addOpLog(`[RECOVERY] ${recoveryLogRef.current}`);
      recoveryLogRef.current = null;
    }
  }, [addOpLog]);

  const {
    operators, activeOperator,
    loginOperator, logoutOperator,
    changeOperatorPin, changeOperatorPinById, resetOperatorPin,
    createOperator, updateOperatorData, setOperatorStatus,
    assignOperatorBlock, releaseOperatorBlock, updateOperatorCapabilities,
    roles, createRole, updateRoleData, setRoleActive, updateRoleCapabilities,
  } = useOperadores({ addOpLog });

  const operatorsRef = useRef(operators);
  operatorsRef.current = operators;
  const activeOperatorRef = useRef<Operador | null>(null);
  activeOperatorRef.current = activeOperator;

  const {
    cashSession, cashSessionRef: cajaCashSessionRef,
    cashBoxes,
    cashMoves,
    addCashMove, updateCashMove, editCashMove,
    openCashSession, closeCashSession, correctAperturaData,
  } = useCaja({
    addOpLog, addTurnEvent,
    resetStats, resetOpLogs,
    sessionStatsRef,
    activeOperatorRef, operatorsRef,
    setCobroOpen: (v: boolean) => setCobroOpenRef.current(v),
    setZone:      (z: "search" | "ticket" | "cobro") => setZoneRef.current(z),
    initialMoves:     initState.moves,
    initialSession:   initState.session,
    initialUsedCodes: initState.usedCodes,
  });
  cashSessionRef.current = cajaCashSessionRef.current;

  const {
    zone, setZone,
    cobroOpen, setCobroOpen,
    enterTicket, enterSearch,
    openCobro, closeCobro, newSale,
  } = usePreVentaUX({ isTurnoAbierto: cashSession.isOpen, showNotice });
  setCobroOpenRef.current = setCobroOpen;
  setZoneRef.current      = setZone;

  const suggestedCashBox = useMemo(() => {
    const prefix = activeOperator?.baseBloque != null ? String(activeOperator.baseBloque)[0] : null;
    const pool   = prefix ? cashBoxes.filter(b => b.code[0] === prefix) : cashBoxes;
    return pool.find(b => b.available) ?? null;
  }, [cashBoxes, activeOperator]);

  const { comprobantes, addComprobante, voidComprobante } = useComprobantes({
    cashSessionRef,
    addOpLog,
    addTurnEvent,
    onAnulacion: revertirVenta,
  });

  return (
    <POSContext.Provider value={{
      zone, enterTicket, enterSearch,
      cobroOpen, openCobro, closeCobro, newSale,
      cashSession, cashBoxes, suggestedCashBox,
      openCashSession, closeCashSession, correctAperturaData,
      sessionStats, docCorrelatives, recordSale,
      cashMoves, addCashMove, updateCashMove, editCashMove,
      opLogs, addOpLog,
      turnEvents, currentSessionEvents,
      comprobantes, addComprobante, voidComprobante,
      sessionNotice, showNotice,
      operators, activeOperator, loginOperator, logoutOperator,
      changeOperatorPin, changeOperatorPinById, resetOperatorPin,
      createOperator, updateOperatorData, setOperatorStatus,
      assignOperatorBlock, releaseOperatorBlock, updateOperatorCapabilities,
      roles, createRole, updateRoleData, setRoleActive, updateRoleCapabilities,
      rubro, setRubro, visualMode, setVisualMode, printFlow, setPrintFlow,
    }}>
      {children}
    </POSContext.Provider>
  );
}

export function usePOS() {
  const ctx = useContext(POSContext);
  if (!ctx) throw new Error("usePOS must be used within POSProvider");
  return ctx;
}
