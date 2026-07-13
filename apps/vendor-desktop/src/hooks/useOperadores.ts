import { useState, useCallback, useRef, useEffect } from "react";
import {
  type Operador, type EstadoOperador,
  cargarOperadores, verificarPin, cambiarPin, establecerPin,
  guardarOperadores, estaBloqueOcupado, asignarBloque, liberarBloque,
  establecerCapacidades, siguienteCodigoOperador,
  hashPinAsync, migrarPinsOperadores,
} from "../domains/operator/operator.store";
import {
  type Rol,
  cargarRoles, guardarRoles, establecerCapacidadesRol, estaCodigoRolOcupado,
} from "../domains/operator/roles.store";
import { accesosStore } from "../domains/operator/accesos.store";
import {
  type OperadorRow,
  cargarOperadoresSQLite, cargarRolesSQLite,
  crearOperadorSQLite, actualizarOperadorSQLite,
  actualizarEstadoOperadorSQLite, actualizarPinOperadorSQLite,
  actualizarCapacidadesOperadorSQLite,
  crearRolSQLite, actualizarRolSQLite, actualizarCapacidadesRolSQLite,
} from "../domains/operator/operador-sqlite.service";

function operadorRowToOperador(row: OperadorRow): Operador {
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

interface UseOperadoresDeps {
  addOpLog: (text: string) => void;
}

export function useOperadores({ addOpLog }: UseOperadoresDeps) {
  const [operators, setOperators] = useState<Operador[]>([]);
  const operatorsRef = useRef(operators);
  operatorsRef.current = operators;

  // Carga inicial desde SQLite con migración one-shot desde localStorage
  useEffect(() => {
    cargarOperadoresSQLite().then(async rows => {
      if (rows.length > 0) {
        setOperators(rows.map(operadorRowToOperador));
      } else {
        // SQLite vacío — migrar desde localStorage
        const legacy = cargarOperadores();
        const migrados = await migrarPinsOperadores(legacy);
        await Promise.all(migrados.map(op =>
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
          })
        ));
        setOperators(migrados);
      }
    }).catch(() => {
      // Fallback final a localStorage
      setOperators(cargarOperadores());
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [activeOperator, setActiveOperator] = useState<Operador | null>(null);
  const activeOperatorRef = useRef<Operador | null>(null);
  activeOperatorRef.current = activeOperator;

  const loginOperator = useCallback(async (id: string, pin: string): Promise<boolean> => {
    const pinHash = await hashPinAsync(pin);
    const ok = verificarPin(operatorsRef.current, id, pinHash);
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

  const changeOperatorPin = useCallback(async (currentPin: string, newPin: string): Promise<boolean> => {
    const op = activeOperatorRef.current;
    if (!op) return false;
    const [currentHash, newHash] = await Promise.all([hashPinAsync(currentPin), hashPinAsync(newPin)]);
    const updated = cambiarPin(operatorsRef.current, op.id, currentHash, newHash);
    if (!updated) return false;
    guardarOperadores(updated);
    setOperators(updated);
    addOpLog(`[PIN] ${op.nombreCompleto} actualizó su PIN`);
    return true;
  }, [addOpLog]);

  const changeOperatorPinById = useCallback(async (id: string, currentPin: string, newPin: string): Promise<boolean> => {
    const [currentHash, newHash] = await Promise.all([hashPinAsync(currentPin), hashPinAsync(newPin)]);
    const updated = cambiarPin(operatorsRef.current, id, currentHash, newHash);
    if (!updated) return false;
    guardarOperadores(updated);
    setOperators(updated);
    const op = operatorsRef.current.find(o => o.id === id);
    if (op) addOpLog(`[PIN] ${op.nombreCompleto} actualizó su PIN (login)`);
    return true;
  }, [addOpLog]);

  const resetOperatorPin = useCallback(async (id: string, newPin: string, motivo?: string): Promise<boolean> => {
    const newHash = await hashPinAsync(newPin);
    const updated = establecerPin(operatorsRef.current, id, newHash);
    if (!updated) return false;
    guardarOperadores(updated);
    setOperators(updated);
    void actualizarPinOperadorSQLite(id, newHash, null);
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
      registradoPor: activeOperatorRef.current?.codigoOperador || activeOperatorRef.current?.alias || "SISTEMA",
    };
    const updated = [...operatorsRef.current, op];
    guardarOperadores(updated);
    setOperators(updated);
    void crearOperadorSQLite({
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
    });
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
    const opActualizado = updated.find(o => o.id === id);
    if (opActualizado) {
      void actualizarOperadorSQLite({
        id: opActualizado.id,
        alias: opActualizado.alias,
        apellidos: opActualizado.apellidos,
        nombres: opActualizado.nombres,
        nombre_completo: opActualizado.nombreCompleto,
        dni: opActualizado.dni ?? null,
        telefono: opActualizado.telefono ?? null,
        codigo_rol: opActualizado.codigoRol,
        nombre_rol: opActualizado.nombreRol,
        base_bloque: opActualizado.baseBloque,
        asignacion_bloque_en: opActualizado.asignacionBloque?.assignedAt ?? null,
        liberacion_bloque_en: opActualizado.asignacionBloque?.releasedAt ?? null,
      });
    }
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
    void actualizarEstadoOperadorSQLite(
      id,
      updatedOp.estado,
      updatedOp.motivoEstado ?? null,
      updatedOp.fechaEstado ?? null,
    );
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
    const opLiberado = updated.find(o => o.id === id);
    if (opLiberado) {
      void actualizarOperadorSQLite({
        id: opLiberado.id,
        alias: opLiberado.alias,
        apellidos: opLiberado.apellidos,
        nombres: opLiberado.nombres,
        nombre_completo: opLiberado.nombreCompleto,
        dni: opLiberado.dni ?? null,
        telefono: opLiberado.telefono ?? null,
        codigo_rol: opLiberado.codigoRol,
        nombre_rol: opLiberado.nombreRol,
        base_bloque: null,
        asignacion_bloque_en: null,
        liberacion_bloque_en: new Date().toISOString(),
      });
    }
    addOpLog(`[OPERADOR] ${op.nombreCompleto} liberó BLQ ${blk}`);
  }, [addOpLog]);

  const updateOperatorCapabilities = useCallback((id: string, capabilities: string[]): void => {
    const updated = establecerCapacidades(operatorsRef.current, id, capabilities);
    guardarOperadores(updated);
    setOperators(updated);
    void actualizarCapacidadesOperadorSQLite(id, JSON.stringify(capabilities));
  }, []);

  // ── Roles ────────────────────────────────────────────────────
  const [roles, setRoles] = useState<Rol[]>([]);
  // Carga inicial de roles desde SQLite con migración one-shot desde localStorage
  useEffect(() => {
    cargarRolesSQLite().then(async rows => {
      if (rows.length > 0) {
        setRoles(rows.map(r => ({
          id: r.id,
          codigo: r.codigo,
          nombre: r.nombre,
          descripcion: r.descripcion,
          capacidades: (() => { try { return JSON.parse(r.capacidades) as string[]; } catch { return []; } })(),
          requiereBloque: r.requiere_bloque === 1,
          activo: r.activo === 1,
          creadoEn: r.creado_en,
          creadoPor: r.creado_por,
        })));
      } else {
        // SQLite vacío — migrar desde localStorage
        const legacy = cargarRoles();
        await Promise.all(legacy.map(r =>
          crearRolSQLite({
            id: r.id,
            codigo: r.codigo,
            nombre: r.nombre,
            descripcion: r.descripcion,
            capacidades: JSON.stringify(r.capacidades ?? []),
            requiere_bloque: r.requiereBloque ? 1 : 0,
            creado_en: r.creadoEn,
            creado_por: r.creadoPor,
          })
        ));
        setRoles(legacy);
      }
    }).catch(() => {
      setRoles(cargarRoles());
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
    void crearRolSQLite({
      id: role.id,
      codigo: role.codigo,
      nombre: role.nombre,
      descripcion: role.descripcion,
      capacidades: JSON.stringify(role.capacidades ?? []),
      requiere_bloque: role.requiereBloque ? 1 : 0,
      creado_en: role.creadoEn,
      creado_por: role.creadoPor,
    });
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
    void actualizarRolSQLite({ id, codigo: code, nombre: data.name.trim(), descripcion: data.description.trim() });
    return true;
  }, []);

  const setRoleActive = useCallback((id: string, active: boolean): void => {
    const updated = rolesRef.current.map(r => r.id === id ? { ...r, activo: active } : r);
    guardarRoles(updated);
    setRoles(updated);
    void actualizarCapacidadesRolSQLite(id, JSON.stringify(updated.find(r => r.id === id)?.capacidades ?? []), active ? 1 : 0);
  }, []);

  const updateRoleCapabilities = useCallback((id: string, capabilities: string[]): void => {
    const updated = establecerCapacidadesRol(rolesRef.current, id, capabilities);
    guardarRoles(updated);
    setRoles(updated);
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
