
---

# 3. docs/architecture/cash-close-flow.md

```md
# DISATEQ VENDOR — CASH CLOSE FLOW

## Estado

DOCUMENTO AUTORIDAD — CIERRE OPERACIONAL

---

# Filosofía cierre

El cierre es:

- operacional
- deliberado
- semi-ciego
- escalonado

Objetivo:
validar continuidad operacional real del cajón.

---

# Stage 1 — Fondo fijo

Validación:

el fondo debe retornar exactamente igual al monto de apertura.

No importa:
- ventas
- movimientos
- ingresos temporales

El fondo fijo debe quedar íntegro.

---

# Stage 2 — Conteo operacional

El operador declara:

- efectivo
- yape
- tarjeta

Sin esperado visible.

Acepta expresiones:

200+50

---

# Stage 3 — Validación

El sistema revela:

- esperado
- diferencia
- descuadre

El operador puede:

- recontar
- continuar conciliación

---

# Stage 4 — Conciliación

Vista supervisor/auditoría.

Muestra:

- movimientos
- diferencias
- op reconstruida
- desglose operacional

---

# Stage 5 — Cierre final

Confirma cierre definitivo.

Ejecuta:

- closeCashSession()
- impresión arqueo
- consumo usedCodes
- limpieza runtime

---

# Filosofía semi-ciega

El operador NO debe:

- acomodar conteo mirando esperado
- depender visualmente del sistema antes de declarar

La diferencia se revela después del conteo.

---

# Recontar

Recontar existe porque:

la diferencia se descubre después de declarar.

---

# Arqueo operacional

Representa exclusivamente:

ventas cash registradas.

No incluye:
- fondo apertura
- movimientos
- ingresos temporales

---

# Diferencia

diferencia = declarado − esperado

La diferencia es:

resultado operacional humano

NO necesariamente fraude.

---

# Impresión arqueo

La impresión es:

acto final de revelación operacional.

Actualmente el arqueo impreso es el principal registro persistente del cierre.