# CURRENT CONTEXT — DISATEQ VENDOR™

## Branch & Commit
* **Branch:** `main`
* **Último commit:** `10c8762` — feat(farmacia): stock minimo configurable por presentacion con migracion v4
* **Commits de la jornada 22 Jun:**
  * `dc88d94` — feat(farmacia): agregar tipos canonicos TipoValorOperacional y EstadoValorOperacional
  * `2467724` — feat(farmacia): implementar comandos Rust de precios y migracion v3 VENTA_NORMAL
  * `c50e84b` — feat(farmacia): implementar tab PRECIOS con carga, creacion y edicion de ValorOperacional
  * `7b0d655` — feat(farmacia): implementar InventarioFarmaciaWorkspace con disponibilidad y detalle de lotes
  * `10c8762` — feat(farmacia): stock minimo configurable por presentacion con migracion v4

---

## Recorrido de Dominios (Matriz de Estado)
* **LOGIN:** ✅
* **TURNO / CAJA:** ✅
* **ABASTECIMIENTO — CATÁLOGO:** ✅ Chrome alineado. Producto de prueba en SQLite. Tab PRECIOS funcional — carga, creación y edición de ValorOperacional por nodo. Búsqueda por IFA pendiente reverificación visual.
* **ABASTECIMIENTO — PROVEEDORES:** ✅ Chrome alineado. AÚN NO PROBADO visualmente post-commit.
* **ABASTECIMIENTO — INGRESOS:** ✅ Chrome alineado, sesión real conectada. AÚN NO PROBADO end-to-end con datos reales.
* **ABASTECIMIENTO — INVENTARIOS:** ✅ InventarioFarmaciaWorkspace operativo — disponibilidad por presentación, detalle de lotes, alerta de stock mínimo configurable por presentación (DEFAULT 10, migración v4).
* **ABASTECIMIENTO — COMPRAS (legacy):** 🔶 Oculto en rubro farmacia. Workspace genérico intacto para futuros rubros.
* **COBRO:** ✅ CERRADO (etapa 1)
* **PRE-VENTA:** ✅ CERRADO
* **VENTAS:** 🔶 FormaVenta infraestructura completa — UIX PresentacionSheet pendiente
* **COMPROBANTES / CLIENTES / REPORTES / OPERADORES / CONFIG:** ⬜

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

### Patrón de migración de schema SQLite
- Tabla temporal + INSERT...SELECT + DROP + RENAME: para cambios estructurales complejos.
- ALTER TABLE ADD COLUMN + pragma_table_info como guarda: para columnas nuevas con DEFAULT.
- Siempre en transacción. Siempre registrar versión en schema_migrations al final.
- Versiones aplicadas: v2 (lote fecha opcional), v3 (VENTA_NORMAL), v4 (stock_minimo).

### CHROME VISUAL CANÓNICO — confirmado en jornada 21-22 Jun
Patrón compartido por CashWorkspace, ComprobantesWorkspace, ConfigWorkspace y
los cuatro workspaces de FARMACIA (Catálogo, Proveedores, Ingresos, Inventario):
- Wrapper: `rounded-[28px] border border-{accent}/50 bg-[#FDFCF9]`
- Header: `h-[42px] bg-{accent-claro}/60 border-b border-{accent}/15`
- Ícono: 13px, strokeWidth=2, color accent
- Título: `text-[13px] font-semibold uppercase tracking-tight leading-none`
- Accent FARMACIA: `#639922` / fondo `#EAF3DE`

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
| actualizarProveedor (service) | Nombre usa verbo no canónico — función llama a invoke('actualizar_proveedor'); pendiente renombrar a modificarProveedor en una sesión de normalización | Baja |

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

### Vista DIGEMID
Migración v3 corrigió la vista `reporte_digemid_privado` de `tipo = 'NORMAL'` a
`tipo = 'VENTA_NORMAL'`. Schema actualizado para bases nuevas.

### Pendiente (Capa C)
Umbral de frecuencia en `config_establecimiento` — diferido a cuando VENTAS migre a SQLite.

---

## ABASTECIMIENTO — Decisiones arquitectónicas confirmadas (22 Jun)

- **ABASTECIMIENTO es categoría multi-rubro:** `farmacia/` es el primer inquilino. Nuevos rubros van como `abastecimiento/<rubro>/` hermano.
- **INGRESOS es el concepto canónico de compras en farmacia:** COMPRAS genérico permanece para otros rubros.
- **INVENTARIOS farmacia:** ✅ InventarioFarmaciaWorkspace operativo. Routing rubro-consciente en App.tsx — farmacia → InventarioFarmaciaWorkspace, otros rubros → InventoryWorkspace (legacy).
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
  ↓ 39 comandos Tauri en Rust
      lotes.rs: registrar_lote, resolver_lote_fefo, obtener_lotes_vigentes,
                obtener_inventario_farmacia
      presentaciones.rs: crear_presentacion, obtener_presentaciones, crear_nodo,
                         obtener_nodos_fraccionamiento, modificar_stock_minimo
      valores.rs: crear_valor_operacional, modificar_valor_operacional,
                  obtener_valores_nodo, resolver_precio_nodo
      (+ 27 comandos en productos, proveedores, movimientos, servicios,
          reportes, integraciones, ingresos, db_commands)
  ↓ farmacia.service.ts (33 funciones exportadas)
  ↓ farmacia.store.ts (Zustand)
  ↓ components/sheet/ — SheetWork/SheetHeader/SheetBody/SheetFooter
  ↓ modules/abastecimiento/farmacia/
      CatalogoFarmaciaWorkspace.tsx     ✅ chrome, producto prueba, tab PRECIOS funcional
      ProveedoresWorkspace.tsx          ✅ chrome, proveedor prueba — sin prueba visual post-commit
      IngresosMercaderiaWorkspace.tsx   ✅ chrome, sesión real — sin prueba end-to-end real
      InventarioFarmaciaWorkspace.tsx   ✅ disponibilidad, lotes, stock mínimo configurable
  ↓ layout/OperationalBar.tsx
      rubro farmacia: oculta COMPRAS, muestra CATÁLOGO/PROVEEDORES/INGRESOS/INVENTARIOS
```

---

## Próxima ventana de trabajo — Prioridad ordenada

1. **Verificar visualmente en pantalla** los cuatro workspaces FARMACIA — confirmar consistencia visual con el resto del sistema
2. **Probar IngresosMercaderiaWorkspace end-to-end real** — usar Lab. Portugal + Panadol ya creados, registrar ingreso con lote, confirmar en SQLite que se crea lote + movimiento tipo "entrada"
3. **BoxSlotType → TipoCaja** — migración de naming en blocks.store.ts (deuda de idioma)
4. **Operador.codigo** — verificar consumidores y eliminar si está huérfano

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
