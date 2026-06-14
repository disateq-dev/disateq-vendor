# CURRENT CONTEXT — DISATEQ VENDOR™

## Branch & Commit
* **Branch:** `main`
* **Últimos commits esta sesión:**
  - `6b0eab5` — fix(thermal): medir anchos por chars() no bytes
  - pendiente — fix(print): footer NOTA DE VENTA HTML doctrina SUNAT
  - pendiente — refactor(print): moneyFormat(), dispatch unificado, voucher limpio

---

## Estado del Dominio de Impresión — CERRADO ✅

### thermal.rs
| Elemento | Estado |
|---|---|
| CP850 activo (ESC t 2) | ✅ |
| to_cp850(): vocales, Ñ, °, ¿, ¡, ª, º | ✅ |
| two_col(): chars().count() | ✅ |
| four_col(): Vec<char> | ✅ |
| item_row(): chars() para corte y medición | ✅ |
| item_row(): S/ fijo + número justificado 7 chars | ✅ |
| money_label() en all two_col() fuera de item_row() | ✅ |
| set_tab()/tab() eliminados | ✅ |

### printTicket.ts
| Elemento | Estado |
|---|---|
| moneyFormat() importado desde lib/money.ts | ✅ |
| money() local eliminado | ✅ |
| Footer NOTA DE VENTA: "SIN VALOR FISCAL." | ✅ |
| Leyenda: "Solicite su Boleta o Factura." | ✅ |
| buildDispatchHTML/buildDispatchAppend unificados | ✅ |
| id="pt-ticket" eliminado de buildVoucherHTML | ✅ |
| printReceiptWithDispatch → printReceiptWithDispatchHTML | ✅ |

### lib/money.ts
| Elemento | Estado |
|---|---|
| moneyFormat() exportado | ✅ |

---

## Auditoría de Impresión — HALLAZGOS CERRADOS
- 🔴 C1: two_col/four_col/item_row bytes→chars ✅
- 🟡 M1: set_tab/tab eliminados ✅
- 🟡 M2: footer HTML alineado con doctrina SUNAT ✅
- 🟡 M3: buildDispatch unificado ✅
- 🟢 m1: id="pt-ticket" eliminado ✅
- 🟢 m2: printReceiptWithDispatch renombrado ✅
- 🟢 m3: money() local → moneyFormat() de lib ✅

---

## Recorrido de Dominios (Matriz de Estado)
* **LOGIN:** ✅
* **TURNO / CAJA:** ✅
* **ABASTECIMIENTO — CATÁLOGO:** ✅
* **ABASTECIMIENTO — COMPRAS:** ✅
* **ABASTECIMIENTO — INVENTARIOS:** ✅
* **VENTAS:** 🔶 Pipeline completo · pendiente recorrido UX
* **COBRO:** 🔶 Impresión térmica resuelta · pendiente BOLETA/FACTURA/COTIZACIÓN
* **COMPROBANTES:** 🔶 Pendiente documentación normativa
* **CLIENTES | REPORTES | OPERADORES | CONFIG:** ⬜

---

## Próxima Ventana de Trabajo
1. Probar impresión en dev — verificar alineación definitiva con tildes y CP850
2. Continuar revisión COBRO (BOLETA, FACTURA, COTIZACIÓN)
3. Arrancar bloque SQLite (prerequisito Alpha)

---

*Nota del Sistema: Iniciar sesión limpia leyendo este contexto atómico.*
