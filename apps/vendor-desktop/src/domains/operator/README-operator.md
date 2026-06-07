# Dominio `operator`

## Propósito

Gestión de las personas que operan el sistema y sus roles operacionales.

## Responsabilidades

- Persistir y cargar `Operador` y `Rol`
- Verificar PIN de acceso
- Gestionar estados operacionales (`ACTIVO`, `SUSPENDIDO`, `INACTIVO`)
- Asignar y liberar bloques operacionales
- Resolver alias únicos

## Tipos clave

| Tipo | Archivo | Qué representa |
|---|---|---|
| `Operador` | `operator.store.ts` | Persona que opera el sistema |
| `EstadoOperador` | `operator.store.ts` | `ACTIVO / SUSPENDIDO / INACTIVO` |
| `AsignacionBloque` | `operator.store.ts` | Bloque de correlativos asignado al operador |
| `Rol` | `roles.store.ts` | Rol operacional con capacidades |

## Funciones exportadas

| Función | Descripción |
|---|---|
| `cargarOperadores()` | Lee desde `localStorage` con migración hacia atrás |
| `guardarOperadores()` | Persiste lista completa |
| `verificarPin()` | Valida PIN de un operador activo |
| `generarAlias()` | Deriva alias desde nombres y apellidos |
| `resolverAlias()` | Resuelve colisiones de alias |
| `asignarBloque()` | Asigna bloque verificando que no esté ocupado |
| `liberarBloque()` | Libera bloque con timestamp |

## Storage keys

```
disateq:operators     →  lista de Operador[]
disateq:operators:v   →  versión del seed (migración)
disateq:roles         →  lista de Rol[]
disateq:roles:v       →  versión del seed (migración)
```

## Regla de migración

`cargarOperadores()` y `cargarRoles()` incluyen compatibilidad hacia atrás con los campos del modelo anterior (`operatorCode`, `roleCode`, `active`, etc.). Esta migración puede eliminarse en una versión futura cuando todos los deployments estén actualizados.
