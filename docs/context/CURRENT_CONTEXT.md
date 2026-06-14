# CURRENT CONTEXT — DISATEQ VENDOR™

## Branch & Commit
* **Branch:** `main`
* **Último commit:** `e14e1a0` — feat: navegación teclado ContextBar, modo visual/dense VENTAS, ComprobantesWorkspace sesión+historial

---

## Commits de esta sesión

| Commit | Cambio |
|---|---|
| `6b0eab5` | fix(thermal): medir anchos por chars() no bytes |
| anterior | fix(print): footer NOTA DE VENTA HTML — SIN VALOR FISCAL. |
| `8879887` | refactor(print): moneyFormat() en lib/money.ts, dispatch unificado, voucher limpio |
| anterior | fix(print): MONEY_NUM_WIDTH constante · money_signed_label · corregir import CobroPanel |
| `e14e1a0` | feat: navegación teclado ContextBar, modo visual/dense VENTAS, ComprobantesWorkspace |

---

## Estado del Dominio de Impresión — CERRADO ✅

### thermal.rs
- CP850 activo (ESC t 2) ✅
- to_cp850(): vocales, Ñ, °, ¿, ¡, ª, º ✅
- two_col/four_col/item_row: chars().count() ✅
- MONEY_NUM_WIDTH = 8 constante global ✅
- money_label(): S/ fijo + número justificado ✅
- money_signed_label(): para ingresos/egresos/diferencia ✅
- set_tab/tab eliminados ✅

### printTicket.ts
- moneyFormat() importado desde lib/money.ts ✅
- Footer NOTA DE VENTA: "SIN VALOR FISCAL." ✅
- buildDispatch unificado ✅
- printReceiptWithDispatchHTML renombrado ✅

### lib/money.ts
- moneyFormat() exportado ✅

---

## Recorrido de Dominios (Matriz de Estado)
* **LOGIN:** ✅
* **TURNO / CAJA:** ✅
* **ABASTECIMIENTO — CATÁLOGO:** ✅
* **ABASTECIMIENTO — COMPRAS:** ✅
* **ABASTECIMIENTO — INVENTARIOS:** ✅
* **VENTAS:** 🔶 Modo visual/dense · categorías por rubro · pendiente recorrido UX completo
* **COBRO:** 🔶 Impresión térmica resuelta · pendiente BOLETA/FACTURA/COTIZACIÓN
* **COMPROBANTES:** 🔶 Vista sesión+historial · filtros · convertir a formal · pendiente normativa
* **CLIENTES | REPORTES | OPERADORES | CONFIG:** ⬜

---

## Próxima Ventana de Trabajo
1. Probar impresión en dev — verificar alineación con tildes y CP850
2. Continuar revisión COBRO (BOLETA, FACTURA, COTIZACIÓN)
3. Recorrido UX VENTAS completo
4. SQLite — prerequisito Alpha

---

*Nota del Sistema: Iniciar sesión limpia leyendo este contexto atómico.*
