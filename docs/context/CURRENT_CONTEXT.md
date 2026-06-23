# CURRENT CONTEXT — DISATEQ VENDOR™

## Branch & Commit
* **Branch:** `main`
* **Último commit:** `2923334` — refactor(farmacia): simplificar tarjeta resultado catalogo a dos lineas, quitar boton NUEVO header
* **Commits de la jornada 22 Jun:**
  * `dc88d94` — feat(farmacia): agregar tipos canonicos TipoValorOperacional y EstadoValorOperacional
  * `2467724` — feat(farmacia): implementar comandos Rust de precios y migracion v3 VENTA_NORMAL
  * `c50e84b` — feat(farmacia): implementar tab PRECIOS con carga, creacion y edicion de ValorOperacional
  * `7b0d655` — feat(farmacia): implementar InventarioFarmaciaWorkspace con disponibilidad y detalle de lotes
  * `10c8762` — feat(farmacia): stock minimo configurable por presentacion con migracion v4
  * `968c5f9` — refactor(farmacia): redisenar CatalogoWorkspace con flujo buscar-primero y accent teal
  * `b40bbe2` — chore: eliminar archivo fantasma de ruta malformada
  * `5541d45` — refactor(farmacia): color azul sky, paneles 40/60, teclado y limpiar en BuscadorProducto
  * `4333c21` — chore: excluir seeds SQL del repositorio
  * `2923334` — refactor(farmacia): simplificar tarjeta resultado catalogo a dos lineas, quitar boton NUEVO header

---

## Recorrido de Dominios (Matriz de Estado)
* **LOGIN:** ✅
* **TURNO / CAJA:** ✅
* **ABASTECIMIENTO — CATÁLOGO:** 🔶 Rediseño UX completado (buscar-primero, paneles 40/60, teclado, limpiar, tarjeta 2 líneas). Datos de prueba en SQLite (8 productos, 16 lotes, 2 proveedores). DetalleProducto pendiente de evaluación visual. NuevoProductoStepper pendiente de evaluación visual.
* **ABASTECIMIENTO — PROVEEDORES:** ⬜ Pendiente evaluación visual con datos reales.
* **ABASTECIMIENTO — INGRESOS:** ⬜ Pendiente prueba end-to-end real con datos reales.
* **ABASTECIMIENTO — INVENTARIOS:** ✅ InventarioFarmaciaWorkspace operativo — disponibilidad por presentación, detalle de lotes, alerta de stock mínimo configurable por presentación (DEFAULT 10, migración v4).
* **ABASTECIMIENTO — COMPRAS (legacy):** 🔶 Oculto en rubro farmacia. Workspace genérico intacto para futuros rubros.
* **COBRO:** ✅ CERRADO (etapa 1)
* **PRE-VENTA:** ✅ CERRADO
* **VENTAS:** 🔶 FormaVenta infraestructura completa — UIX PresentacionSheet pendiente
* **COMPROBANTES / CLIENTES / REPORTES / OPERADORES / CONFIG:** ⬜

---

## DECISIONES DE DISEÑO CONFIRMADAS — jornada 22 Jun

### Accent canónico ABASTECIMIENTO
- Color: `#0284C7` (azul sky-600) — aprobado 22 Jun
- Fondo tint: `#E0F2FE`
- Reemplaza definitivamente `#639922` (verde oliva) que colisionaba con VENTAS

### Semántica de color por módulo — mapa completo
| Módulo | Accent | Fondo tint |
|---|---|---|
| VENTAS / COBRO | `#45b356` verde | `#F2F7F3` |
| TURNO / CAJA | `#2A7CA8` azul-petróleo | — |
| COMPROBANTES | `#C05050` terracota | — |
| AJUSTES / CONFIG | `#697387` gris azulado | — |
| ABASTECIMIENTO | `#0284C7` azul sky | `#E0F2FE` |

### CatalogoFarmaciaWorkspace — arquitectura aprobada
- Dos paneles permanentes: 40% izquierdo (cabina de control) / 60% derecho (superficie de resultado)
- Panel izquierdo: siempre muestra BuscadorProducto
- Panel derecho: 4 estados — empty / DetalleProducto / NuevoProductoStepper / sin resultados
- Flujo canónico: buscar primero → seleccionar → crear solo si no existe
- Botón CREAR: protagonista cuando sin resultados, NO existe en header
- Teclado: ↑↓ navegar · Enter seleccionar · Escape limpiar
- Tarjeta resultado: 2 líneas — nombre+concentración+forma / código·fabricante·lote
- Código DIGEMID visible solo para ADMIN; fallback id truncado 8 chars

---

## DOCTRINA DE CALIDAD — IRREVOCABLE desde 2026-06-19

Marco completo de estándares (SOLID, Clean Code, DRY, KISS, YAGNI, Base de
Datos, Seguridad, CI/SemVer): ver `docs/00-governance/ESTANDARES_TECNICOS.md`.

### CONVENCIÓN TAURI — IRREVOCABLE desde 2026-06-20 (commit 966b936)
**Todo argumento de invoke() del lado TypeScript se envía SIEMPRE en camelCase.**
Convención nativa de Tauri 2.x, sin `rename_all` en Rust. Cuidado: el casing
camelCase se basa en el NOMBRE DEL PARÁMETRO RUST, no en el campo del tipo
TypeScript. Las RESPUESTAS siguen en snake_case — requieren función traductora.

### LECCIÓN APRENDIDA — navegación de subtabs (commit a8b7758)
Todo prompt que agregue un subtab nuevo debe tocar EXPLÍCITAMENTE
OperationalBar.tsx (arrays ABAST_TABS/CASH_TABS/CONFIG_TABS), no solo App.tsx.

### LECCIÓN APRENDIDA — casing Tauri (commit 966b936)
`npx tsc --noEmit` NUNCA detecta mismatches de casing en argumentos de invoke().
Solo se manifiesta en runtime real. Todo prompt que cree comandos Tauri nuevos
debe especificar explícitamente la convención camelCase.

### LECCIÓN APRENDIDA — búsqueda multi-campo en SQL con sqlx (commit fc00277)
Cuando LIKE necesita buscar en múltiples columnas con OR, sqlx requiere bind
posicional — un .bind() por cada "?", aunque el valor sea idéntico.

### LECCIÓN APRENDIDA — ubicación de verificación TypeScript (commit 6ada611)
`npx tsc --noEmit` debe ejecutarse desde `apps/vendor-desktop`, no desde la
raíz del repo. La convención de commits desde la raíz sigue intacta.

### LECCIÓN APRENDIDA — idempotencia de migraciones con ADD COLUMN (commit 10c8762)
Cuando SCHEMA_FARMACIA crea una columna nueva para bases frescas, la migración
correspondiente debe verificar si la columna ya existe via
`pragma_table_info('tabla') WHERE name = 'columna'` antes de ejecutar
ALTER TABLE ADD COLUMN. Sin esta guarda, bases nuevas fallan al arrancar.

### LECCIÓN APRENDIDA — seeds SQL (jornada 22 Jun)
Los archivos seed_*.sql están en .gitignore — no se trackean en el repo.
Ruta de la base en desarrollo: `%APPDATA%\com.disateq.vendor\disateq.db` (nombre real, no disateq_vendor.db).
Ejecutar seeds con: `sqlite3 "$env:APPDATA\com.disateq.vendor\disateq.db" ".read <ruta>.sql"`

### Patrón de migración de schema SQLite
- Tabla temporal + INSERT...SELECT + DROP + RENAME: para cambios estructurales complejos.
- ALTER TABLE ADD COLUMN + pragma_table_info como guarda: para columnas nuevas con DEFAULT.
- Siempre en transacción. Siempre registrar versión en schema_migrations al final.
- Versiones aplicadas: v2 (lote fecha opcional), v3 (VENTA_NORMAL), v4 (stock_minimo).

### CHROME VISUAL CANÓNICO — confirmado y actualizado 22 Jun
Patrón compartido por todos los workspaces:
- Wrapper: `rounded-[28px] border border-{accent}/50 bg-[#FDFCF9]`
- Header: `h-[42px] bg-{accent-claro}/60 border-b border-{accent}/15`
- Ícono: 13px, strokeWidth=2, color accent
- Título: `text-[13px] font-semibold uppercase tracking-tight leading-none`
- **Accent ABASTECIMIENTO: `#0284C7` / fondo `#E0F2FE`** (actualizado — era `#639922`)

---

## DEUDA TÉCNICA REGISTRADA

| Archivo | Problema | Prioridad |
|---|---|---|
| DetalleProducto.tsx | 400+ líneas — extraer PresentacionesTab.tsx y PreciosTab.tsx | Media |
| NuevoProductoStepper.tsx | 350 líneas — extraer PasoUno/Dos/Tres/Cuatro | Media |
| OperationalBar.tsx | Doble llamada a usePOS() — cosmético, sin impacto funcional | Baja |
| parsearHtmlSunat (COBRO) | Heurístico — pendiente comando Rust | Baja |
| FACTURA UBIGEO | Diferido a fase CPE electrónica | Baja |
| Notas de Crédito y Débito | Botones deshabilitados | Media |
| ContextBar.tsx (layout/) | Archivo huérfano, no importado activamente | Baja |
| domains/operator/blocks.store.ts | BoxSlotType/BoxSlotDef en inglés → TipoCaja/DefinicionCaja canónico | Media |
| operator.store.ts | Operador.codigo campo huérfano — eliminar tras verificar consumidores | Media |
| actualizarProveedor (service) | Nombre usa verbo no canónico — pendiente renombrar a modificarProveedor | Baja |

---

## A EVALUAR EN USO REAL — IngresosMercaderiaWorkspace
Tres decisiones abiertas (ver BITACORA_DECISIONES.md 2026-06-20 para detalle):
1. Flujo de un solo paso (sin recepción parcial)
2. Lote genérico sin fecha de vencimiento obligatoria
3. Búsqueda plana de presentaciones (sin selector de 2 pasos)
No tocar sin confirmar con Fernando que hubo prueba real que las cuestionó.

---

## GOBERNANZA DOCUMENTAL — estado al 22 Jun

Documentación activa consolidada. Ver `docs/INDICE.md` para mapa completo.
Autoridades vigentes: `docs/DOCTRINA.md`, `docs/ARQUITECTURA_UX.md`,
`docs/00-governance/GLOSARIO.md`, `CLAUDE.md`, `CONTRATO_ARQUITECTURA.md`.
36 archivos archivados en `docs/_obsoleto/` — no leer por defecto.

---

## PRECIOS — implementado al 22 Jun (commits dc88d94, 2467724, c50e84b)

### Cuatro tipos canónicos implementados
| Tipo | Condición |
|---|---|
| `VENTA_NORMAL` | Precio base, sin condición |
| `VENTA_MAYOREO` | Cantidad >= condicion_cantidad_minima |
| `VENTA_FRECUENTE` | Cliente tipo FRECUENTE + cumple umbral de compras |
| `VENTA_PROMOCION` | Vigencia explícita, activable/desactivable, estado ACTIVO/INACTIVO |

### Regla de resolución (waterfall) — implementada en resolver_precio_nodo
VENTA_PROMOCION vigente > VENTA_FRECUENTE (si cliente califica) > VENTA_MAYOREO (si cantidad califica) > VENTA_NORMAL

### Pendiente (Capa C)
Umbral de frecuencia en `config_establecimiento` — diferido a cuando VENTAS migre a SQLite.

---

## ABASTECIMIENTO — Decisiones arquitectónicas confirmadas (22 Jun)

- **ABASTECIMIENTO es categoría multi-rubro:** `farmacia/` es el primer inquilino. Nuevos rubros van como `abastecimiento/<rubro>/` hermano.
- **INGRESOS es el concepto canónico de compras en farmacia:** COMPRAS genérico permanece para otros rubros.
- **INVENTARIOS farmacia:** ✅ InventarioFarmaciaWorkspace operativo. Routing rubro-consciente en App.tsx.
- **NodoFraccionamiento, TipoFormaVenta, ValorOperacionalFarmacia:** deliberadamente fuera de GLOSARIO hasta el rediseño de VENTAS.

---

## Integraciones externas — Estado

### SUNAT consulta RUC — ✅ OPERATIVO
- Comando: `consultar_ruc` en `integraciones.rs`
- URL configurable desde `config_establecimiento.api_ruc_url`, fallback `https://api.apis.net.pe/v1/ruc`

### DIGEMID reporte OPPF — ✅ DISEÑADO, UIX de exportación pendiente
- Vista: `reporte_digemid_privado` · Comando: `generar_reporte_digemid`

---

## Stack técnico completo — verificado en filesystem al 22 Jun

```
SQLite (10 tablas + schema_migrations + vista reporte_digemid_privado)
  Migraciones aplicadas: v2 (lote fecha opcional) · v3 (VENTA_NORMAL) · v4 (stock_minimo)
  Datos de prueba: 5 genéricos · 8 comerciales · 8 presentaciones · 16 lotes · 2 proveedores
  ↓ 39 comandos Tauri en Rust
      lotes.rs · presentaciones.rs · valores.rs
      (+ productos, proveedores, movimientos, servicios, reportes, integraciones, ingresos, db_commands)
  ↓ farmacia.service.ts (33 funciones exportadas)
  ↓ farmacia.store.ts (Zustand)
  ↓ components/sheet/ — SheetWork/SheetHeader/SheetBody/SheetFooter
  ↓ modules/abastecimiento/farmacia/
      CatalogoFarmaciaWorkspace.tsx     🔶 UX rediseñada — DetalleProducto y Stepper pendientes evaluación
      ProveedoresWorkspace.tsx          ⬜ pendiente evaluación visual con datos reales
      IngresosMercaderiaWorkspace.tsx   ⬜ pendiente prueba end-to-end real
      InventarioFarmaciaWorkspace.tsx   ✅ disponibilidad, lotes, stock mínimo configurable
  ↓ layout/OperationalBar.tsx
      rubro farmacia: oculta COMPRAS, muestra CATÁLOGO/PROVEEDORES/INGRESOS/INVENTARIOS
```

---

## Próxima ventana de trabajo — Prioridad ordenada

1. **CATÁLOGO — evaluar DetalleProducto** en panel derecho con datos reales (tabs DETALLE / PRESENTACIONES / PRECIOS)
2. **CATÁLOGO — evaluar NuevoProductoStepper** — flujo de 4 pasos con datos reales
3. **PROVEEDORES** — evaluación visual con datos reales
4. **INGRESOS** — prueba end-to-end real con Lab. Portugal + productos del seed
5. **BoxSlotType → TipoCaja** — migración de naming en blocks.store.ts
6. **Operador.codigo** — verificar consumidores y eliminar si huérfano

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
