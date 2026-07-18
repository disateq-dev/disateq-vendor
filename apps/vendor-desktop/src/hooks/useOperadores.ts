import { useState, useCallback, useRef, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  type Operador, type EstadoOperador,
  estaBloqueOcupado, siguienteCodigoOperador,
  hashPinAsync, verificarPin,
} from "../domains/operator/operator.store";
import { type Rol } from "../domains/operator/roles.store";
import { accesosStore } from "../domains/operator/accesos.store";
import {
  type OperadorRow, type RolRow,
  cargarOperadoresSQLite, cargarRolesSQLite,
  crearOperadorSQLite, actualizarOperadorSQLite,
  actualizarEstadoOperadorSQLite, actualizarPinOperadorSQLite,
  actualizarCapacidadesOperadorSQLite,
  crearRolSQLite, actualizarRolSQLite, actualizarCapacidadesRolSQLite,
} from "../domains/operator/operador-sqlite.service";

function rowToOperador(row: OperadorRow): Operador {
  return {
    id: row.id,
    codigoOperador: row.codigo_operador,
    alias: row.alias,
    apellidos: row.apellidos,
    nombres: row.nombres,
    nombreCompleto: row.nombre_completo,
    dni: row.dni ?? undefined,
    telefono: row.telefono ?? undefined,
    codigoRol: row.codigo_rol,
    nombreRol: row.nombre_rol,
    baseBloque: row.base_bloque,
    asignacionBloque: row.asignacion_bloque_en
      ? { assignedAt: row.asignacion_bloque_en, releasedAt: row.liberacion_bloque_en ?? undefined }
      : undefined,
    estado: row.estado as Operador["estado"],
    motivoEstado: row.motivo_estado ?? undefined,
    fechaEstado: row.fecha_estado ?? undefined,
    pin: row.pin,
    capacidades: (() => { try { return JSON.parse(row.capacidades) as string[]; } catch { return []; } })(),
    registradoEn: row.registrado_en,
    registradoPor: row.registrado_por,
  };
}

function rowToRol(row: RolRow): Rol {
  return {
    id: row.id,
    codigo: row.codigo,
    nombre: row.nombre,
    descripcion: row.descripcion,
    capacidades: (() => { try { return JSON.parse(row.capacidades) as string[]; } catch { return []; } })(),
    requiereBloque: row.requiere_bloque === 1,
    activo: row.activo === 1,
    creadoEn: row.creado_en,
    creadoPor: row.creado_por,
  };
}

interface UseOperadoresDeps {
  addOpLog: (text: string) => void;
}

export function useOperadores({ addOpLog }: UseOperadoresDeps) {

  const [operators, setOperators] = useState<Operador[]>([]);
  const todosOperadoresRef = useRef<Operador[]>([]);
  const operatorsRef = useRef<Operador[]>([]);
  operatorsRef.current = operators;

  function aplicarOperadores(todos: Operador[]) {
    todosOperadoresRef.current = todos;
    setOperators(todos.filter(o => String(o.estado) !== "SISTEMA"));
  }

  async function recargar(): Promise<void> {
    const rows = await cargarOperadoresSQLite();
    aplicarOperadores(rows.map(rowToOperador));
  }

  useEffect(() => {
    cargarOperadoresSQLite()
      .then(rows => aplicarOperadores(rows.map(rowToOperador)))
      .catch(() => aplicarOperadores([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [activeOperator, setActiveOperator] = useState<Operador | null>(null);
  const activeOperatorRef = useRef<Operador | null>(null);
  activeOperatorRef.current = activeOperator;

  const loginOperator = useCallback(async (id: string, pin: string): Promise<boolean> => {
    const op = todosOperadoresRef.current.find(o => o.id === id);
    if (!op) return false;

    if (String(op.estado) === "SISTEMA") {
      const ok = await invoke<boolean>("verificar_pin_sistema", {
        alias: op.alias,
        pinIngresado: pin,
      }).catch(() => false);
      if (ok) {
        setActiveOperator(op);
        addOpLog(`[LOGIN] ${op.nombreCompleto} inicio sesion`);
        accesosStore.registrar({ tipo: "LOGIN_OK", operadorAlias: op.alias, operacion: "Inicio de sesion" });
      } else {
        accesosStore.registrar({ tipo: "LOGIN_FAIL", operadorAlias: op.alias, operacion: "Inicio de sesion", detalle: "PIN incorrecto" });
      }
      return ok;
    }

    const pinHash = await hashPinAsync(pin);
    const ok = verificarPin(operatorsRef.current, id, pinHash);
    if (ok) {
      setActiveOperator(op);
      addOpLog(`[LOGIN] ${op.nombreCompleto} inicio sesion`);
      accesosStore.registrar({ tipo: "LOGIN_OK", operadorAlias: op.alias, operacion: "Inicio de sesion" });
    } else {
      accesosStore.registrar({ tipo: "LOGIN_FAIL", operadorAlias: op.alias, operacion: "Inicio de sesion", detalle: "PIN incorrecto" });
    }
    return ok;
  }, [addOpLog]);

  const logoutOperator = useCallback(() => {
    const op = activeOperatorRef.current;
    setActiveOperator(null);
    if (op) addOpLog(`[LOGOUT] ${op.nombreCompleto} cerro sesion`);
  }, [addOpLog]);

  const resetOperatorPin = useCallback(async (id: string, newPin: string, motivo?: string): Promise<boolean> => {
    const newHash = await hashPinAsync(newPin);
    const result = await actualizarPinOperadorSQLite(id, newHash, null);
    if (!result.ok) return false;
    await recargar();
    const op = todosOperadoresRef.current.find(o => o.id === id);
    if (op) {
      addOpLog(`[PIN] ${op.nombreCompleto} reseteo su PIN${motivo ? ` - ${motivo}` : ""}`);
      accesosStore.registrar({ tipo: "PIN_RESETEADO", operadorAlias: op.alias, operacion: "Reseteo de PIN", detalle: motivo });
    }
    return true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addOpLog]);

  const changeOperatorPin = useCallback(async (currentPin: string, newPin: string): Promise<boolean> => {
    const op = activeOperatorRef.current;
    if (!op) return false;
    const currentHash = await hashPinAsync(currentPin);
    if (op.pin !== currentHash) return false;
    return resetOperatorPin(op.id, newPin);
  }, [resetOperatorPin]);

  const changeOperatorPinById = useCallback(async (id: string, currentPin: string, newPin: string): Promise<boolean> => {
    const op = operatorsRef.current.find(o => o.id === id);
    if (!op) return false;
    const currentHash = await hashPinAsync(currentPin);
    if (op.pin !== currentHash) return false;
    return resetOperatorPin(id, newPin);
  }, [resetOperatorPin]);

  const createOperator = useCallback((data: {
    apellidos: string; nombres: string; alias: string; dni?: string; telefono?: string;
    roleCode: string; roleName: string; blockBase: number | null;
  }): Operador => {
    if (data.blockBase !== null && estaBloqueOcupado(operatorsRef.current, data.blockBase)) {
      throw new Error(`Bloque ${data.blockBase} ya esta asignado a otro operador activo`);
    }
    const displayName = `${data.nombres.trim()} ${data.apellidos.trim()}`.trim();
    const opCode = siguienteCodigoOperador(operatorsRef.current);
    const now = new Date().toISOString();
    const op: Operador = {
      id: `op${Date.now()}`,
      codigoOperador: opCode,
      alias: data.alias,
      apellidos: data.apellidos,
      nombres: data.nombres,
      nombreCompleto: displayName,
      dni: data.dni,
      telefono: data.telefono,
      codigoRol: data.roleCode,
      nombreRol: data.roleName,
      baseBloque: data.blockBase,
      asignacionBloque: data.blockBase !== null ? { assignedAt: now } : undefined,
      estado: "ACTIVO",
      pin: "",
      capacidades: [],
      registradoEn: now,
      registradoPor: activeOperatorRef.current?.alias ?? "SISTEMA",
    };

    // Optimista
    aplicarOperadores([...todosOperadoresRef.current, op]);

    crearOperadorSQLite({
      id: op.id,
      codigo_operador: op.codigoOperador,
      alias: op.alias,
      apellidos: op.apellidos,
      nombres: op.nombres,
      nombre_completo: op.nombreCompleto,
      dni: op.dni ?? null,
      telefono: op.telefono ?? null,
      codigo_rol: op.codigoRol,
      nombre_rol: op.nombreRol,
      base_bloque: op.baseBloque,
      asignacion_bloque_en: op.asignacionBloque?.assignedAt ?? null,
      estado: op.estado,
      pin: op.pin,
      pin_salt: null,
      capacidades: JSON.stringify(op.capacidades ?? []),
      registrado_en: op.registradoEn,
      registrado_por: op.registradoPor,
    }).then(async result => {
      if (!result.ok) await recargar();
    }).catch(async () => {
      await recargar();
    });

    addOpLog(`[OPERADOR] Creado ${op.nombreCompleto} (${op.alias} - ${opCode})`);
    return op;
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    const now = new Date().toISOString();
    const updatedOp: Operador = {
      ...op,
      alias: data.alias, apellidos: data.apellidos, nombres: data.nombres,
      nombreCompleto: displayName, dni: data.dni, telefono: data.telefono,
      codigoRol: data.roleCode, nombreRol: data.roleName, baseBloque: data.blockBase,
      asignacionBloque: blockChanged && data.blockBase !== null
        ? { assignedAt: now }
        : (blockChanged && data.blockBase === null)
        ? (op.asignacionBloque ? { ...op.asignacionBloque, releasedAt: now } : undefined)
        : op.asignacionBloque,
    };
    aplicarOperadores(todosOperadoresRef.current.map(o => o.id === id ? updatedOp : o));

    actualizarOperadorSQLite({
      id: updatedOp.id, alias: updatedOp.alias, apellidos: updatedOp.apellidos,
      nombres: updatedOp.nombres, nombre_completo: updatedOp.nombreCompleto,
      dni: updatedOp.dni ?? null, telefono: updatedOp.telefono ?? null,
      codigo_rol: updatedOp.codigoRol, nombre_rol: updatedOp.nombreRol,
      base_bloque: updatedOp.baseBloque,
      asignacion_bloque_en: updatedOp.asignacionBloque?.assignedAt ?? null,
      liberacion_bloque_en: updatedOp.asignacionBloque?.releasedAt ?? null,
    }).then(async result => {
      if (!result.ok) await recargar();
    }).catch(async () => { await recargar(); });

    if (blockChanged) {
      addOpLog(data.blockBase !== null
        ? `[OPERADOR] ${displayName} asignado a BLQ ${data.blockBase}`
        : `[OPERADOR] ${displayName} sin bloque asignado`);
    }
    return true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addOpLog]);

  const setOperatorStatus = useCallback((id: string, status: EstadoOperador, reason?: string): boolean => {
    const op = operatorsRef.current.find(o => o.id === id);
    if (!op) return false;
    if (status === "ACTIVO" && op.baseBloque !== null && estaBloqueOcupado(operatorsRef.current, op.baseBloque, id)) return false;
    const now = new Date().toISOString();
    const updatedOp: Operador = {
      ...op, estado: status, fechaEstado: now, motivoEstado: reason ?? op.motivoEstado,
      ...(status === "INACTIVO" && op.baseBloque !== null ? {
        baseBloque: null,
        asignacionBloque: op.asignacionBloque
          ? { ...op.asignacionBloque, releasedAt: now }
          : { assignedAt: now, releasedAt: now },
      } : {}),
    };
    aplicarOperadores(todosOperadoresRef.current.map(o => o.id === id ? updatedOp : o));
    actualizarEstadoOperadorSQLite(id, updatedOp.estado, updatedOp.motivoEstado ?? null, updatedOp.fechaEstado ?? null)
      .then(async result => { if (!result.ok) await recargar(); })
      .catch(async () => { await recargar(); });
    const label = status === "ACTIVO" ? "reactivado" : status === "SUSPENDIDO" ? "suspendido" : "dado de baja";
    addOpLog(`[OPERADOR] ${op.nombreCompleto} ${label}${reason ? ` - ${reason}` : ""}`);
    return true;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addOpLog]);

  const assignOperatorBlock = useCallback((id: string, blockBase: number): boolean => {
    const op = operatorsRef.current.find(o => o.id === id);
    if (!op || estaBloqueOcupado(operatorsRef.current, blockBase, id)) return false;
    const now = new Date().toISOString();
    const updatedOp = { ...op, baseBloque: blockBase, asignacionBloque: { assignedAt: now } };
    aplicarOperadores(todosOperadoresRef.current.map(o => o.id === id ? updatedOp : o));
    void actualizarOperadorSQLite({
      id, alias: op.alias, apellidos: op.apellidos, nombres: op.nombres,
      nombre_completo: op.nombreCompleto, dni: op.dni ?? null, telefono: op.telefono ?? null,
      codigo_rol: op.codigoRol, nombre_rol: op.nombreRol,
      base_bloque: blockBase, asignacion_bloque_en: now, liberacion_bloque_en: null,
    });
    addOpLog(`[OPERADOR] ${op.nombreCompleto} asignado a BLQ ${blockBase}`);
    return true;
  }, [addOpLog]);

  const releaseOperatorBlock = useCallback((id: string): void => {
    const op = operatorsRef.current.find(o => o.id === id);
    if (!op || op.baseBloque === null) return;
    const blk = op.baseBloque;
    const now = new Date().toISOString();
    const updatedOp = {
      ...op, baseBloque: null,
      asignacionBloque: op.asignacionBloque
        ? { ...op.asignacionBloque, releasedAt: now }
        : { assignedAt: now, releasedAt: now },
    };
    aplicarOperadores(todosOperadoresRef.current.map(o => o.id === id ? updatedOp : o));
    void actualizarOperadorSQLite({
      id, alias: op.alias, apellidos: op.apellidos, nombres: op.nombres,
      nombre_completo: op.nombreCompleto, dni: op.dni ?? null, telefono: op.telefono ?? null,
      codigo_rol: op.codigoRol, nombre_rol: op.nombreRol,
      base_bloque: null, asignacion_bloque_en: null, liberacion_bloque_en: now,
    });
    addOpLog(`[OPERADOR] ${op.nombreCompleto} libero BLQ ${blk}`);
  }, [addOpLog]);

  const updateOperatorCapabilities = useCallback((id: string, capabilities: string[]): void => {
    const op = todosOperadoresRef.current.find(o => o.id === id);
    if (!op) return;
    aplicarOperadores(todosOperadoresRef.current.map(o => o.id === id ? { ...o, capacidades: capabilities } : o));
    void actualizarCapacidadesOperadorSQLite(id, JSON.stringify(capabilities));
  }, []);

  // ── Roles ─────────────────────────────────────────────────────
  const [roles, setRoles] = useState<Rol[]>([]);
  const rolesRef = useRef<Rol[]>([]);
  rolesRef.current = roles;

  useEffect(() => {
    cargarRolesSQLite()
      .then(rows => setRoles(rows.map(rowToRol)))
      .catch(() => setRoles([]));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const createRole = useCallback((data: { code: string; name: string; description: string }): Rol => {
    const code = data.code.trim().toUpperCase();
    if (rolesRef.current.some(r => r.codigo === code)) throw new Error(`Codigo ${code} ya existe`);
    const role: Rol = {
      id: `role-${Date.now()}`,
      codigo: code, nombre: data.name.trim(), descripcion: data.description.trim(),
      capacidades: [], requiereBloque: false, activo: true,
      creadoEn: new Date().toISOString(),
      creadoPor: activeOperatorRef.current?.nombreCompleto ?? "SISTEMA",
    };
    setRoles([...rolesRef.current, role]);
    crearRolSQLite({
      id: role.id, codigo: role.codigo, nombre: role.nombre, descripcion: role.descripcion,
      capacidades: JSON.stringify([]), requiere_bloque: 0,
      creado_en: role.creadoEn, creado_por: role.creadoPor,
    }).then(async result => {
      if (!result.ok) {
        const rows = await cargarRolesSQLite();
        setRoles(rows.map(rowToRol));
      }
    }).catch(async () => {
      const rows = await cargarRolesSQLite();
      setRoles(rows.map(rowToRol));
    });
    return role;
  }, []);

  const updateRoleData = useCallback((id: string, data: { code: string; name: string; description: string }): boolean => {
    const code = data.code.trim().toUpperCase();
    if (rolesRef.current.some(r => r.id !== id && r.codigo === code)) return false;
    setRoles(rolesRef.current.map(r => r.id === id
      ? { ...r, codigo: code, nombre: data.name.trim(), descripcion: data.description.trim() }
      : r));
    void actualizarRolSQLite({ id, codigo: code, nombre: data.name.trim(), descripcion: data.description.trim() });
    return true;
  }, []);

  const setRoleActive = useCallback((id: string, active: boolean): void => {
    const updated = rolesRef.current.map(r => r.id === id ? { ...r, activo: active } : r);
    setRoles(updated);
    const rol = updated.find(r => r.id === id);
    void actualizarCapacidadesRolSQLite(id, JSON.stringify(rol?.capacidades ?? []), active ? 1 : 0);
  }, []);

  const updateRoleCapabilities = useCallback((id: string, capabilities: string[]): void => {
    setRoles(rolesRef.current.map(r => r.id === id ? { ...r, capacidades: capabilities } : r));
    void actualizarCapacidadesRolSQLite(id, JSON.stringify(capabilities));
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
