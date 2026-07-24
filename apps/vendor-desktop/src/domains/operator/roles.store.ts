export type Rol = {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string;
  capacidades: string[];
  requiereBloque: boolean;
  activo: boolean;
  creadoEn: string;
  creadoPor: string;
};

export function establecerCapacidadesRol(roles: Rol[], id: string, capacidades: string[]): Rol[] {
  return roles.map(r => r.id === id ? { ...r, capacidades } : r);
}

export function estaCodigoRolOcupado(roles: Rol[], codigo: string, excludeId?: string): boolean {
  return roles.some(r => r.id !== excludeId && r.codigo === codigo);
}
