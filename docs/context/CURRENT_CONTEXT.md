# CURRENT CONTEXT — DISATEQ VENDOR™

## Branch & Commit
* **Branch:** `main`
* **Último commit:** `6ada611` — feat(abastecimiento): creación de producto embebida en flujo de Ingresos
* **Commits de la jornada 19-20 Jun:**
  * `95cc297` — feat(sqlite): tauri-plugin-sql v2 + schema CORE + FARMACIA + comandos DB iniciales
  * `cc23da3` — feat(sqlite): 18 comandos Tauri dominio farmacia
  * `9b9eb0b` — feat(farmacia): tipos TypeScript, service y store Zustand dominio farmacia
  * `6f20956` — feat(abastecimiento): CatalogoFarmaciaWorkspace
  * `b593de9` — feat(abastecimiento): ProveedoresWorkspace
  * `2a3940b` — feat(abastecimiento): IngresosMercaderiaWorkspace
  * `a8b7758` — fix(abastecimiento): navegación Catálogo→Proveedores→Ingresos→Compras→Inventarios
  * `966b936` — fix(farmacia): camelCase nativo de Tauri 2.x en invoke()
  * `fc00277` — fix(catalogo): búsqueda por nombre comercial o IFA, categoria_farmacia faltante
  * `b888909` — fix(farmacia): traducción snake_case→camelCase en 7 funciones de lectura (ver bitácora 2026-06-20)
  * `6ada611` — feat(abastecimiento): creación de producto embebida en flujo de Ingresos (fase 1 de 2 — ver auditoría doctrinal 2026-06-20 en BITACORA_DECISIONES.md)
* **Próximo paso:** verificar en pantalla — buscar "Paracetamol" en Catálogo debe encontrar "Panadol" con categoría ANALGESICO visible (pendiente desde antes, sin tocar esta sesión). Además, probar manualmente el nuevo flujo: en Ingresos, buscar un producto inexistente, confirmar que aparece "Este producto no existe — regístralo ahora", completar el stepper y verificar que la línea se agrega automáticamente al ingreso en curso.

---

## Recorrido de Dominios (Matriz de Estado)
* **LOGIN:** ✅
* **TURNO / CAJA:** ✅
* **ABASTECIMIENTO — CATÁLOGO:** ✅ Producto de prueba creado y persistido en SQLite
  (Genérico: Paracetamol 1000mg Tableta Recubierta Analgésico · Comercial: Panadol,
  Lab. Portugal, RS EN08232, Sin Receta, Requiere Lote · Presentación: Caja Blíster
  x 100 Tabletas, Fracción 100, Costo S/25.00 · Nodo raíz: Caja x 100, vendible,
  comprable). Búsqueda por IFA corregida — pendiente reverificación visual.
* **ABASTECIMIENTO — PROVEEDORES:** ✅ Proveedor de prueba creado y verificado
  (LABORATORIOS PORTUGAL S.R.L., RUC 20100204330, ACTIVO) — búsqueda confirmada funcionando
* **ABASTECIMIENTO — INGRESOS:** ✅ Código operativo, AÚN NO PROBADO end-to-end con
  datos reales (proveedor + producto ya existen, falta la prueba de registrar el ingreso).
  Además, desde commit `6ada611`, si la búsqueda de producto no encuentra resultados el
  operador puede registrarlo sin salir del flujo (reutiliza `NuevoProductoStepper` sin
  modificarlo, agrega la línea automáticamente al ingreso en curso) — AUDITADO en
  código, AÚN NO PROBADO visualmente en pantalla.
* **ABASTECIMIENTO — COMPRAS / INVENTARIOS (legacy):** 🔶 Prototipo localStorage, fallback
* **COBRO:** ✅ CERRADO (etapa 1)
* **PRE-VENTA:** ✅ CERRADO
* **VENTAS:** 🔶 FormaVenta infraestructura completa — UIX PresentacionSheet pendiente
* **COMPROBANTES / CLIENTES / REPORTES / OPERADORES / CONFIG:** ⬜

---

## DOCTRINA DE CALIDAD — IRREVOCABLE desde 2026-06-19

### SOLID
- **S:** Un componente/hook/comando = una responsabilidad.
- **O:** Tipos se extienden, schemas con migración versionada.
- **I:** Props segregadas.
- **D:** Componentes dependen de hooks/servicios, no de localStorage ni invoke directo.

### CONVENCIÓN TAURI — IRREVOCABLE desde 2026-06-20 (commit 966b936)
**Todo argumento de invoke() del lado TypeScript se envía SIEMPRE en camelCase.**
Convención nativa de Tauri 2.x, sin `rename_all` en Rust. Cuidado: el casing
camelCase se basa en el NOMBRE DEL PARÁMETRO RUST, no en el campo del tipo
TypeScript (ej. `codigo_digemid` → `codigoDigemid`, no `codigoDIGEMID`). Las
RESPUESTAS de los comandos siguen en snake_case (construidas manualmente con
`serde_json::json!`) — eso no cambia, sigue requiriendo función traductora
(ver `traducirProveedor` en farmacia.service.ts).

### LECCIÓN APRENDIDA — navegación de subtabs (commit a8b7758)
Todo prompt que agregue un subtab nuevo debe tocar EXPLÍCITAMENTE
OperationalBar.tsx (arrays ABAST_TABS/CASH_TABS/CONFIG_TABS), no solo App.tsx.

### LECCIÓN APRENDIDA — casing Tauri (commit 966b936)
`npx tsc --noEmit` NUNCA detecta mismatches de casing en argumentos de invoke()
porque TypeScript no valida nombres de string keys contra la firma del comando
Rust. Solo se manifiesta en runtime real. Todo prompt que cree comandos Tauri
nuevos debe especificar explícitamente la convención camelCase.

### LECCIÓN APRENDIDA — búsqueda multi-campo en SQL con sqlx (commit fc00277)
Cuando una condición LIKE necesita buscar en múltiples columnas con OR usando
el mismo término (ej. "(columnaA LIKE ? OR columnaB LIKE ?)"), sqlx requiere
bind posicional — un .bind() por cada "?", aunque el valor sea idéntico:
`query.bind(patron.clone()).bind(patron)`. Olvidar el segundo bind causa
"wrong number of bound parameters" en runtime, no se detecta en compilación.

### LECCIÓN APRENDIDA — ubicación de verificación TypeScript (commit 6ada611)
`npx tsc --noEmit` NO resuelve desde la raíz del repo (`D:\DisateQ-DEV\Proyectos\disateq-vendor`)
— no hay `tsc` instalado/resoluble ahí. Debe ejecutarse parado en
`apps/vendor-desktop`. La convención de "commits desde la raíz" para `git`
sigue intacta; lo que cambia es dónde se corre la verificación de tipos antes
de comitear. Todo prompt futuro a Codex que pida verificación con tsc debe
especificar explícitamente `apps/vendor-desktop` como directorio de ejecución.

### Patrón de migración de schema SQLite (commit 2a3940b)
1. Tabla `schema_migrations(version INTEGER)`. 2. Migración idempotente
(si version >= N, no hace nada). 3. tabla_temp con nuevo schema → INSERT...SELECT
columna por columna → DROP original → RENAME → recrear índices → registrar
versión. Todo en una transacción.

---

## DEUDA TÉCNICA REGISTRADA

| Archivo | Problema | Prioridad |
|---|---|---|
| DetalleProducto.tsx | 203 líneas — extraer PresentacionesTab.tsx | Media |
| NuevoProductoStepper.tsx | 350 líneas — extraer PasoUno/Dos/Tres/Cuatro | Media |
| useIngresosMercaderia.ts | 207 líneas — excepción documentada | Media |
| useIngresosMercaderia.ts | operadorId/runtimeId placeholders fijos — falta store sesión/turno real | Alta (bloquea producción) |
| useProveedores.ts | onActualizar mezcla camelCase leve inconsistencia | Baja |
| farmacia.service.ts | `obtenerProveedores()` no traduce snake_case→camelCase (mismo bug que el resuelto en b888909, quedó fuera de esa auditoría). Hoy es código muerto — ninguna pantalla la llama, ambas usan `buscarProveedores()` que sí está bien | Media (corregir antes de conectarla a cualquier pantalla nueva) |
| parsearHtmlSunat (COBRO) | Heurístico — pendiente comando Rust | Baja |
| FACTURA UBIGEO | Diferido a fase CPE electrónica | Baja |
| Notas de Crédito y Débito | Botones deshabilitados | Media |
| ContextBar.tsx (layout/) | Archivo huérfano, no importado activamente | Baja |

---

## A EVALUAR EN USO REAL — IngresosMercaderiaWorkspace
Tres decisiones abiertas (ver bitácora 2026-06-20 para detalle):
1. Flujo de un solo paso (sin recepción parcial)
2. Lote genérico sin fecha de vencimiento obligatoria
3. Búsqueda plana de presentaciones (sin selector de 2 pasos)
No tocar sin confirmar con Fernando que hubo prueba real que las cuestionó.

---

## PROPUESTA DE DISEÑO PENDIENTE DE RESPUESTA — Dos sheets separadas en Catálogo

Fernando propuso durante la prueba manual (tras crear el producto Paracetamol/Panadol):
dividir visualmente CatalogoFarmaciaWorkspace en dos sheets/paneles distintos —
"PANEL BÚSQUEDA PRODUCTO" y "PANEL CREAR PRODUCTO" — en lugar del esquema actual
donde ambos modos viven en la misma área cambiando de contenido.

**Razón explícita de Fernando:** "porque le da al operador un contexto real de
todo el proceso."

**Estado:** PENDIENTE — Claude pidió pausar esta discusión de diseño para
resolver primero los dos bugs funcionales descubiertos durante la misma prueba
(búsqueda solo por nombre comercial sin IFA, categoria_farmacia faltante en
respuesta — ambos ya resueltos en commit fc00277). Retomar esta conversación
de diseño en la próxima ventana de trabajo: entender si Fernando se refiere a
(a) que el stepper de creación debería aparecer como sheet deslizante/superpuesta
sobre la búsqueda en vez de reemplazar el contenido en la misma área, o (b) un
layout de split con buscador y formulario visibles simultáneamente (el primer
mockup que se descartó al inicio del diseño de Catálogo por riesgo de
contaminación visual con miles de productos). Aclarar con Fernando antes de
diseñar cualquier cambio.

---

## Integraciones externas — Estado

### SUNAT consulta RUC — ✅ OPERATIVO, verificado en código tras fix de casing
- Comando: `consultar_ruc` en `integraciones.rs`
- URL configurable desde `config_establecimiento.api_ruc_url`, fallback `https://api.apis.net.pe/v1/ruc`
- Patrón UIX: SQLite primero, SUNAT segundo
- Nota: no requirió cambio en el fix de casing (ya enviaba { ruc } sin guion bajo)

### DIGEMID reporte OPPF — ✅ DISEÑADO, UIX de exportación pendiente
- Vista: `reporte_digemid_privado` · Comando: `generar_reporte_digemid`

---

## Stack técnico completo — verificado en filesystem al 20 Jun

```
SQLite (10 tablas + schema_migrations + vista reporte_digemid_privado)
  ↓ 31 comandos Tauri en Rust (snake_case en Rust, sin cambios)
  ↓ farmacia.service.ts (23 funciones, camelCase en argumentos de invoke)
  ↓ farmacia.store.ts (Zustand)
  ↓ modules/abastecimiento/farmacia/
      CatalogoFarmaciaWorkspace.tsx        ✅ producto de prueba creado, búsqueda IFA corregida
      ProveedoresWorkspace.tsx            ✅ proveedor de prueba creado y verificado
      IngresosMercaderiaWorkspace.tsx     ✅ código OK, prueba end-to-end pendiente
  ↓ layout/OperationalBar.tsx — navegación sincronizada
```

---

## Próxima ventana de trabajo — Prioridad ordenada
1. **Verificar visualmente** que "Paracetamol" ahora encuentra "Panadol" con categoría ANALGESICO
2. **Resolver conversación de diseño pendiente**: ¿sheets separadas en Catálogo? (ver sección arriba)
3. **Probar IngresosMercaderiaWorkspace end-to-end real**: usar el proveedor Lab. Portugal
   + el producto Panadol ya creados, registrar un ingreso con lote, confirmar en SQLite
   que se creó lote + movimiento tipo "entrada". Incluye probar el flujo nuevo de
   creación embebida (commit `6ada611`): buscar un producto inexistente desde Ingresos,
   confirmar botón "Este producto no existe — regístralo ahora", completar el stepper
   y verificar que la línea aparece automáticamente en el ingreso.
4. **Aplicar mismo patrón de creación embebida a Proveedores (fase 2)** — auditoría
   doctrinal 2026-06-20 en BITACORA_DECISIONES.md identificó el mismo síntoma
   (severidad MEDIA) en `ProveedoresWorkspace`: si `SelectorProveedorIngreso` no
   encuentra resultados, ofrecer inline "Consultar en SUNAT" o "Registrar manualmente",
   reutilizando `ConsultaSunatProveedor` y `FormularioProveedor` sin modificarlos,
   mismo patrón de retorno automático al Ingreso en curso.
5. **Conectar operadorId/runtimeId reales** en useIngresosMercaderia.ts — requiere store sesión/turno
6. **PresentacionSheet rediseño** — UIX FormaVenta con datos SQLite reales
7. **ClientesWorkspace** — prerequisito precio FRECUENTE
8. **Notas de Crédito y Débito**
9. **Refactoring deuda técnica** — DetalleProducto.tsx, NuevoProductoStepper.tsx, useIngresosMercaderia.ts

---

## Mapa de Atajos Canónicos — CONSOLIDADO

### COBRO
| Acción | Atajo |
|---|---|
| TIQUE | Ctrl + 7 |
| BOLETA | Ctrl + 8 |
| FACTURA | Ctrl + 9 |
| COTIZACIÓN | Ctrl + 4 |
| EFECTIVO | Ctrl + E |
| YAPE | Ctrl + Y |
| TARJETA | Ctrl + T |
| MIXTO | Ctrl + M |
| GUARDAR | Ctrl + Insert |
| IMPRIMIR | Enter |
| CERRAR COBRO | Escape |

---

## Doctrina de Footer — CONSOLIDADA
- 1 botón: 100% · 2 botones: 50/50 · 3 botones: 25/25/50
- Principal: verde #4CAF50, siempre a la derecha

## Doctrina de Impresión — IRREVERSIBLE
ESC/POS vía Rust/Tauri. HTML/CSS solo fallback PDF.

## Nomenclatura Canónica
- FormaVenta / FormaCompra / UnidadBase
- ProductoGenerico / ProductoComercial / PresentacionComercial / NodoFraccionamiento

---
*Iniciar sesión limpia leyendo este contexto. Si hay discrepancia entre este documento y el filesystem real, el filesystem es la fuente de verdad.*
