# DISATEQ VENDOR — CASH MOVEMENTS MODEL

## Estado

DOCUMENTO AUTORIDAD — INGRESOS / EGRESOS

---

# Filosofía operacional

Los movimientos de caja son operaciones paralelas a ventas.

NO alteran ventas registradas.

Su propósito es:

explicar alteraciones físicas legítimas del cajón.

---

# Tipos

- ingreso
- egreso

---

# Ejemplos reales

## Egresos

- mototaxi
- proveedor spot
- devolución sencillo
- gastos operacionales

## Ingresos

- monedas para cambio
- devolución egreso
- reposición efectivo

---

# Modelo CashMove

```ts
{
  id
  type
  amount
  motivo
  observacion
  refId
  operator
  cashBoxCode
  terminal
  timestamp
  sourceType
  fromApertura
  fromVendido
}