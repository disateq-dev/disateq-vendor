# DISATEQ VENDOR — CASH RUNTIME RECOVERY

## Estado

DOCUMENTO AUTORIDAD — RECOVERY / CONTINUIDAD

---

# Filosofía

El sistema prioriza:

continuidad operacional runtime.

Debe resistir:

- cierres abruptos
- reinicios
- fallos parciales
- inconsistencias runtime

---

# Persistencia

Persisten:

- correlativos
- comprobantes
- usedCodes

Persistencia temporal runtime:

- cashMoves
- sessionStats
- sesión activa

---

# Recovery Guards

El sistema ejecuta guards de recuperación al iniciar.

Objetivo:
detectar inconsistencias y restaurar continuidad operacional válida.

---

# usedCodes

usedCodes representa cajas consumidas operacionalmente.

Una caja usada:
NO debe reutilizarse el mismo día.

---

# closeCashSession

Ejecuta:

- reset stats
- reset moves
- cierre sesión
- append usedCodes

---

# openCashSession

Inicializa:

- sesión viva
- apertura
- runtime operacional

---

# Limpieza automática

El sistema elimina:

- moves huérfanos
- sesiones inconsistentes
- runtime inválido

Objetivo:
evitar estados corruptos persistentes.

---

# Filosofía resiliencia

El sistema debe:

seguir operando aun bajo inconsistencias parciales.

La continuidad operacional tiene prioridad sobre rigidez absoluta.

---

# Contexto de Bloque Operacional

El recovery de prerequisitos de contingencia
es la aplicación de las reglas del Bloque Operacional en startup.

Si una sesión de Caja Auxiliar está activa
pero el prerequisito de su bloque no está registrado como usado,
el sistema lo restaura automáticamente para preservar coherencia.

Ver: [bloque-operacional.md](bloque-operacional.md)