import { useState, useCallback, useRef } from "react";
import {
  type Operador, type EstadoOperador,
  cargarOperadores, verificarPin, cambiarPin, establecerPin,
  guardarOperadores, estaBloqueOcupado, asignarBloque, liberarBloque,
  establecerCapacidades, siguienteCodigoOperador,
} from "../domains/operator/operator.store";
import {
  type Rol,
  cargarRoles, guardarRoles, establecerCapacidadesRol, estaCodigoRolOcupado,
} from "../domains/operator/roles.store";
import { accesosStore } from "../domains/operator/accesos.store";

interface UseOperadoresDeps {
  addOpLog: (text: string) => void;
}

export function useOperadores({ addOpLog }: UseOperadoresDeps) {
  const [operators, setOperators] = useState<Operador[]>(cargarOperadores);
  const operatorsRef = useRef(operators);
  operatorsRef.current = operators;

  const [activeOperator, setActiveOperator] = useState<Operador | null>(null);
  const activeOperatorRef = useRef<Operador | null>(null);
  activeOperatorRef.current = activeOperator;

  const loginOperator = useCallback((id: string, pin: string): boolean => {
    const ok = verificarPin(operatorsRef.current, id, pin);
    const op = operatorsRef.current.find(o => o.id === id);
    if (ok && op) {
      setActiveOperator(op);
      addOpLog(`[LOGIN] ${op.nombreCompleto} inició sesión`);
      accesosStore.registrar({
        tipo: "LOGIN_OK",
        operadorAlias: op.alias,
        operacion: "Inicio de sesión",
      });
    } else {
      accesosStore.registrar({
        tipo: "LOGIN_FAIL",
        operadorAlias: op?.alias ?? id,
        operacion: "Inicio de sesión",
        detalle: "PIN incorrecto",
      });
    }
    return ok;
  }, [addOpLog]);

  const logoutOperator = useCallback(() => {
    const op = activeOperatorRef.current;
    setActiveOperator(null);
    if (op) addOpLog(`[LOGOUT] ${op.nombreCompleto} cerró sesión`);
  }, [addOpLog]);

  const changeOperatorPin = useCallback((currentPin: string, newPin: string): boolean => {
    const op = activeOperatorRef.current;
    if (!op) return false;
    const updated = cambiarPin(operatorsRef.current, op.id, currentPin, newPin);
    if (!updated) return false;
    guardarOperadores(updated);
    setOperators(updated);
    addOpLog(`[PIN] ${op.nombreCompleto} actualizó su PIN`);
    return true;
  }, [addOpLog]);

  const changeOperatorPinById = useCallback((id: string, currentPin: string, newPin: string): boolean => {
    const updated = cambiarPin(operatorsRef.current, id, currentPin, newPin);
    if (!updated) return false;
    guardarOperadores(updated);
    setOperators(updated);
    const op = operatorsRef.current.find(o => o.id === id);
    if (op) addOpLog(`[PIN] ${op.nombreCompleto} actualizó su PIN (login)`);
    return true;
  }, [addOpLog]);

  const resetOperatorPin = useCallback((id: string, newPin: string, motivo?: string): boolean => {
    const updated = establecerPin(operatorsRef.current, id, newPin);
    if (!updated) return false;
    guardarOperadores(updated);
    setOperators(updated);
    const op = operatorsRef.current.find(o => o.id === id);
    if (op) {
      addOpLog(`[PIN] ${op.nombreCompleto} reseteó su PIN${motivo ? ` · ${motivo}` : ""}`);
      accesosStore.registrar({
        tipo: "PIN_RESETEADO",
        operadorAlias: op.alias,
        operacion: "Reseteo de PIN",
        detalle: motivo,
      });
    }
    return true;
  }, [addOpLog]);

  const createOperator = useCallback((data: {
    apellidos: string; nombres: string; alias: string; dni?: string; telefono?: string;
    roleCode: string; roleName: string; blockBase: number | null;
  }): Operador => {
    if (data.blockBase !== null && estaBloqueOcupado(operatorsRef.current, data.blockBase)) {
      throw new Error(`Bloque ${data.blockBase} ya está asignado a otro operador activo`);
    }
    const displayName = `${data.nombres.trim()} ${data.apellidos.trim()}`.trim();
    const opCode = siguienteCodigoOperador(operatorsRef.current);
    const op: Operador = {
      id: `op${Date.now()}`,
      codigoOperador: opCode,
      codigo: data.alias,
      alias: data.alias,
      apellidos: data.apellidos,
      nombres: data.nombres,
      nombreCompleto: displayName,
      dni: data.dni,
      telefono: data.telefono,
      codigoRol: data.roleCode,
      nombreRol: data.roleName,
      baseBloque: data.blockBase,
      asignacionBloque: data.blockBase !== null ? { assignedAt: new Date().toISOString() } : undefined,
      estado: "ACTIVO",
      pin: "",
      capacidades: [],
      registradoEn: new Date().toISOString(),
      registradoPor: activeOperatorRef.current?.codigoOperador || activeOperatorRef.current?.codigo || "SISTEMA",
    };
    const updated = [...operatorsRef.current, op];
    guardarOperadores(updated);
    setOperators(updated);
    addOpLog(`[OPERADOR] Creado ${op.nombreCompleto} (${op.alias} · ${opCode})${data.blockBase ? ` · BLQ ${data.blockBase}` : ""}`);
    return op;
  }, [addOpLog]);

  const updateOperatorData = useCallback((id: string, data: {
    apellidos: string; nombres: string; alias: string; dni?: string; telefono?: string;
    roleCode: string; roleName: string; blockBase: number | null;
  }): boolean => {
    const op = operatorsRef.current.find(o => o.id === id);
    if (!op) return false;
    if (data.blockBase !== null && estaBloqueOcupado(operatorsRef.current, data.blockBase, id)) return false;
    const blockChanged = data.blockBase !== op.baseBloque;
    const displayName = `${data.nombres.trim()} ${data.apellidos.trim()}`.trim();
    const updated = operatorsRef.current.map(o => o.id === id ? {
      ...o,
      codigo: data.alias,
      alias: data.alias,
      apellidos: data.apellidos,
      nombres: data.nombres,
      nombreCompleto: displayName,
      dni: data.dni,
      telefono: data.telefono,
      codigoRol: data.roleCode,
      nombreRol: data.roleName,
      baseBloque: data.blockBase,
      asignacionBloque: blockChanged && data.blockBase !== null
        ? { assignedAt: new Date().toISOString() }
        : (blockChanged && data.blockBase === null)
        ? (o.asignacionBloque ? { ...o.asignacionBloque, releasedAt: new Date().toISOString() } : undefined)
        : o.asignacionBloque,
    } : o);
    guardarOperadores(updated);
    setOperators(updated);
    if (blockChanged) {
      addOpLog(data.blockBase !== null
        ? `[OPERADOR] ${displayName} asignado a BLQ ${data.blockBase}`
        : `[OPERADOR] ${displayName} sin bloque asignado`);
    }
    return true;
  }, [addOpLog]);

  const setOperatorStatus = useCallback((id: string, status: EstadoOperador, reason?: string): boolean => {
    const op = operatorsRef.current.find(o => o.id === id);
    if (!op) return false;
    if (status === "ACTIVO" && op.baseBloque !== null && estaBloqueOcupado(operatorsRef.current, op.baseBloque, id)) return false;
    const now = new Date().toISOString();
    let updatedOp: typeof op = { ...op, estado: status, fechaEstado: now, motivoEstado: reason ?? op.motivoEstado };
    if (status === "INACTIVO" && op.baseBloque !== null) {
      updatedOp = {
        ...updatedOp,
        baseBloque: null,
        asignacionBloque: op.asignacionBloque
          ? { ...op.asignacionBloque, releasedAt: now }
          : { assignedAt: now, releasedAt: now },
      };
    }
    const updated = operatorsRef.current.map(o => o.id === id ? updatedOp : o);
    guardarOperadores(updated);
    setOperators(updated);
    const label = status === "ACTIVO" ? "reactivado" : status === "SUSPENDIDO" ? "suspendido" : "dado de baja";
    const reasonTag = reason ? ` · Motivo: ${reason}` : "";
    addOpLog(`[OPERADOR] ${op.nombreCompleto} ${label}${reasonTag}`);
    return true;
  }, [addOpLog]);

  const assignOperatorBlock = useCallback((id: string, blockBase: number): boolean => {
    const updated = asignarBloque(operatorsRef.current, id, blockBase);
    if (!updated) return false;
    guardarOperadores(updated);
    setOperators(updated);
    const op = operatorsRef.current.find(o => o.id === id);
    if (op) addOpLog(`[OPERADOR] ${op.nombreCompleto} asignado a BLQ ${blockBase}`);
    return true;
  }, [addOpLog]);

  const releaseOperatorBlock = useCallback((id: string): void => {
    const op = operatorsRef.current.find(o => o.id === id);
    if (!op || op.baseBloque === null) return;
    const blk = op.baseBloque;
    const updated = liberarBloque(operatorsRef.current, id);
    guardarOperadores(updated);
    setOperators(updated);
    addOpLog(`[OPERADOR] ${op.nombreCompleto} liberó BLQ ${blk}`);
  }, [addOpLog]);

  const updateOperatorCapabilities = useCallback((id: string, capabilities: string[]): void => {
    const updated = establecerCapacidades(operatorsRef.current, id, capabilities);
    guardarOperadores(updated);
    setOperators(updated);
  }, []);

  // ── Roles ────────────────────────────────────────────────────
  const [roles, setRoles] = useState<Rol[]>(cargarRoles);
  const rolesRef = useRef(roles);
  rolesRef.current = roles;

  const createRole = useCallback((data: { code: string; name: string; description: string }): Rol => {
    const code = data.code.trim().toUpperCase();
    if (estaCodigoRolOcupado(rolesRef.current, code)) throw new Error(`Código ${code} ya existe`);
    const role: Rol = {
      id: `role-${Date.now()}`,
      codigo: code,
      nombre: data.name.trim(),
      descripcion: data.description.trim(),
      capacidades: [],
      requiereBloque: false,
      activo: true,
      creadoEn: new Date().toISOString(),
      creadoPor: activeOperatorRef.current?.nombreCompleto ?? "SISTEMA",
    };
    const updated = [...rolesRef.current, role];
    guardarRoles(updated);
    setRoles(updated);
    return role;
  }, []);

  const updateRoleData = useCallback((id: string, data: { code: string; name: string; description: string }): boolean => {
    const code = data.code.trim().toUpperCase();
    if (estaCodigoRolOcupado(rolesRef.current, code, id)) return false;
    const updated = rolesRef.current.map(r => r.id === id
      ? { ...r, codigo: code, nombre: data.name.trim(), descripcion: data.description.trim() }
      : r
    );
    guardarRoles(updated);
    setRoles(updated);
    return true;
  }, []);

  const setRoleActive = useCallback((id: string, active: boolean): void => {
    const updated = rolesRef.current.map(r => r.id === id ? { ...r, activo: active } : r);
    guardarRoles(updated);
    setRoles(updated);
  }, []);

  const updateRoleCapabilities = useCallback((id: string, capabilities: string[]): void => {
    const updated = establecerCapacidadesRol(rolesRef.current, id, capabilities);
    guardarRoles(updated);
    setRoles(updated);
  }, []);

  return {
    operators, activeOperator,
    loginOperator, logoutOperator,
    changeOperatorPin, changeOperatorPinById, resetOperatorPin,
    createOperator, updateOperatorData, setOperatorStatus,
    assignOperatorBlock, releaseOperatorBlock, updateOperatorCapabilities,
    roles,
    createRole, updateRoleData, setRoleActive, updateRoleCapabilities,
  };
}
