# DISATEQ VENDOR — CASH / TURNO OPERATIONAL MODEL

## Estado

DOCUMENTO AUTORIDAD — MODELO OPERACIONAL TURNOS/CAJA

---

# Filosofía operacional

TURNOS no representa una sesión de usuario.

TURNOS representa continuidad operacional de una caja viva.

CAJA no es hardware ni login:
es un recurso operacional lógico secuencial.

El sistema prioriza:

- continuidad operacional
- resiliencia runtime
- velocidad operacional
- trazabilidad suficiente
- conciliación humana real

Evitar:

- ERPización
- hipercontrol
- burocracia operacional
- dashboards financieros

---

# Modelo CAJA

Las cajas funcionan como bloques secuenciales:

100 → 101 → 102
200 → 201 → 202

Semántica:

- XX0 → operación normal
- XX1 → contingencia secuencial
- XX2 → contingencia extrema secuencial

Una caja contingente solo puede utilizarse si la anterior ya fue usada.

---

# Exceptional Mode

Modo excepcional utilizado para preservar continuidad operacional.

Permite marcar prerequisitos como usados sin haber sido abiertos realmente.

Objetivo:
preservar secuencia operacional y evitar bloqueos.

---

# TURNOS

TURNOS representa:

- apertura operacional
- operación comercial viva
- movimientos caja
- conciliación
- arqueo
- cierre

---

# Principio central

Continuidad operacional primero.
Auditoría después.

El sistema registra realidad operacional.
No intenta controlar toda microdinámica física humana.

---

# Fondo fijo vs ventas

Separación crítica del sistema.

## Fondo fijo

Capital operacional de apertura.

Debe retornar exactamente igual al cierre.

NO representa ventas.

---

## Ventas cash

Representan operación comercial efectiva.

Se acumulan en:

stats.cash

También llamado:

cashVendido
arqueoOperacional

---

# Filosofía arqueo operacional

arqueoOperacional = cashVendido

Los movimientos NO modifican arqueoOperacional.

Objetivo:
comparar ventas cash registradas contra realidad física declarada por operador.

---

# Cierre operacional

El cierre es:

- semi-ciego
- escalonado
- deliberado

NO debe sentirse:
- dashboard financiero
- conciliación automática
- wizard enterprise

Debe sentirse:
- serio
- compacto
- operacional

---

# Filosofía cierre

El operador:

- cuenta físicamente
- declara realidad operacional
- luego descubre diferencias

El sistema NO debe inducir “acomodo” previo del conteo.

---

# Persistencia

Persisten entre sesiones:

- correlativos
- comprobantes
- usedCodes

No persisten:

- cashMoves
- arqueos
- opLogs

Actualmente el arqueo impreso es el registro permanente principal del cierre.