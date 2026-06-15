# CURRENT CONTEXT — DISATEQ VENDOR™

## Branch & Commit
* **Branch:** `main`
* **Último commit:** `7484fb1` — fix(thermal): punto centrado · y símbolo grado ° al encoder CP850

---

## Doctrina de Impresión — DECISIÓN IRREVERSIBLE

La impresión siempre se resuelve por **ESC/POS vía Rust/Tauri**.
El path HTML/CSS existe únicamente como fallback para exportar PDF desde ComprobantesWorkspace.
Ningún flujo operacional normal usa el path HTML.

---

## Pendientes de Impresión (futura implementación)

- **Logo térmico:** PNG → bitmap monocromo raster (`ESC *` / `GS v 0`) — Post-Alpha
- **QR térmico:** generación raster via `qrcode` + `image` — junto con BOLETA/FACTURA electrónica
- **PrintConfig futuro:** `{ logoPath, logoEnabled, qrEnabled }` — dato QR derivado del comprobante

---

## Recorrido de Dominios (Matriz de Estado)
* **LOGIN:** ✅
* **TURNO / CAJA:** ✅
* **ABASTECIMIENTO — CATÁLOGO:** ✅
* **ABASTECIMIENTO — COMPRAS:** ✅
* **ABASTECIMIENTO — INVENTARIOS:** ✅
* **VENTAS:** 🔶 Pendiente recorrido UX completo
* **COBRO:** 🔶 Impresión validada · pendiente BOLETA/FACTURA/COTIZACIÓN
* **COMPROBANTES:** 🔶 Pendiente documentación normativa
* **CLIENTES | REPORTES | OPERADORES | CONFIG:** ⬜

---

## Próxima Ventana de Trabajo
1. Revisión COBRO — BOLETA, FACTURA, COTIZACIÓN
2. Recorrido UX VENTAS
3. SQLite — prerequisito Alpha

---

*Nota del Sistema: Iniciar sesión limpia leyendo este contexto atómico.*
