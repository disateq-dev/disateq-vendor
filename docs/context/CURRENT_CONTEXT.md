# CURRENT CONTEXT — DISATEQ VENDOR™

## Branch & Commit
* **Branch:** `main`
* **Último commit:** `ba13145` — feat(abastecimiento): alinear chrome visual de IngresosMercaderiaWorkspace al patron del sistema
* **Commits de la jornada 21-22 Jun:**
  * `5a3ecd9` — docs: consolidacion documental completa (DOCTRINA.md, ARQUITECTURA_UX.md, INDICE.md, 36 archivos archivados, GLOSARIO.md enriquecido, CLAUDE.md actualizado)
  * `d34e8f7` — feat(abastecimiento): alinear chrome visual de CatalogoFarmaciaWorkspace al patron del sistema
  * `ba3abbe` — feat(abastecimiento): alinear chrome visual de ProveedoresWorkspace al patron del sistema
  * `ba13145` — feat(abastecimiento): alinear chrome visual de IngresosMercaderiaWorkspace al patron del sistema
  * `96c5eaa` — fix(abastecimiento): conectar operadorId y runtimeId reales en useIngresosMercaderia
  * `a5787d7` — feat(abastecimiento): ocultar subtabs COMPRAS e INVENTARIOS en rubro farmacia
  * `b5e339d` — feat(farmacia): implementar comandos desactivar para proveedor, producto y servicio
  * `df7dd35` — refactor(farmacia): renombrar ActualizarProveedorInput a ModificarProveedorInput

---

## Recorrido de Dominios (Matriz de Estado)
* **LOGIN:** ✅
* **TURNO / CAJA:** ✅
* **ABASTECIMIENTO — CATÁLOGO:** ✅ Chrome alineado al sistema (commit d34e8f7). Producto de prueba creado y persistido en SQLite (Panadol/Paracetamol). Búsqueda por IFA corregida — pendiente reverificación visual.
* **ABASTECIMIENTO — PROVEEDORES:** ✅ Chrome alineado al sistema (commit ba3abbe). Proveedor de prueba creado y verificado. Flujos SUNAT y manual operativos en código — AÚN NO PROBADOS visualmente.
* **ABASTECIMIENTO — INGRESOS:** ✅ Chrome alineado al sistema (commit ba13145). Overlays fixed inset-0 eliminados — contenido condicional por estado sin salir del workspace. operadorId/runtimeId conectados a sesión real (commit 96c5eaa). AÚN NO PROBADO end-to-end con datos reales.
* **ABASTECIMIENTO — COMPRAS / INVENTARIOS (legacy):** 🔶 Ocultos en rubro farmacia (commit a5787d7). Workspaces genéricos intactos para futuros rubros.
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

### Patrón de migración de schema SQLite (commit 2a3940b)
Tabla schema_migrations → migración idempotente → tabla_temp → INSERT...SELECT
→ DROP original → RENAME → recrear índices → registrar versión. Todo en una
transacción.

### CHROME VISUAL CANÓNICO — confirmado en jornada 21-22 Jun
Patrón compartido por CashWorkspace, ComprobantesWorkspace, ConfigWorkspace y
ahora los tres workspaces de FARMACIA:
- Wrapper: `rounded-[28px] border border-{accent}/50 bg-[#FDFCF9]`
- Header: `h-[42px] bg-{accent-claro}/60 border-b border-{accent}/15`
- Ícono: 13px, strokeWidth=2, color accent
- Título: `text-[13px] font-semibold uppercase tracking-tight leading-none`
- Accent FARMACIA: `#639922` / fondo `#EAF3DE`

---

## DEUDA TÉCNICA REGISTRADA

| Archivo | Problema | Prioridad |
|---|---|---|
| DetalleProducto.tsx | 203 líneas — extraer PresentacionesTab.tsx | Media |
| NuevoProductoStepper.tsx | 350 líneas — extraer PasoUno/Dos/Tres/Cuatro | Media |
| OperationalBar.tsx | Doble llamada a usePOS() — cosmético, sin impacto funcional | Baja |
| parsearHtmlSunat (COBRO) | Heurístico — pendiente comando Rust | Baja |
| FACTURA UBIGEO | Diferido a fase CPE electrónica | Baja |
| Notas de Crédito y Débito | Botones deshabilitados | Media |
| ContextBar.tsx (layout/) | Archivo huérfano, no importado activamente | Baja |
| domains/operator/blocks.store.ts | BoxSlotType/BoxSlotDef en inglés → TipoCaja/DefinicionCaja canónico | Media |
| operator.store.ts | Operador.codigo campo huérfano — eliminar tras verificar consumidores | Media |

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

## ESPECIFICACIÓN DE PRECIOS — aprobada 22 Jun, pendiente de implementar

### Cuatro tipos canónicos (ValorOperacionalFarmacia.tipo)
| Tipo | Condición |
|---|---|
| `VENTA_NORMAL` | Precio base, sin condición |
| `VENTA_MAYOREO` | Cantidad >= condicion_cantidad_minima |
| `VENTA_FRECUENTE` | Cliente tipo FRECUENTE + cumple umbral de compras |
| `VENTA_PROMOCION` | Vigencia explícita, activable/desactivable, estado ACTIVO/INACTIVO |

### Regla de resolución (waterfall)
VENTA_PROMOCION vigente > VENTA_FRECUENTE (si cliente califica) > VENTA_MAYOREO (si cantidad califica) > VENTA_NORMAL

### Pendiente de implementar — Bloques en orden
- **Capa A:** tipos TypeScript — `TipoValorOperacional` y `EstadoValorOperacional` como unions en `types.ts`
- **Capa B:** 4 comandos Rust — `crear_valor_operacional`, `actualizar_valor_operacional`, `obtener_valores_nodo`, `resolver_precio_nodo`
- **Capa D:** UI — pestaña PRECIOS en DetalleProducto.tsx (dentro de CatalogoFarmaciaWorkspace)
- **Capa C:** Schema SQL — tabla `valor_operacional` ya existe; agregar umbral frecuencia en `config_establecimiento` cuando VENTAS migre a SQLite

### Notas doctrinales
- VENTA_FRECUENTE usa `Cliente.tipo === 'FRECUENTE'` como proxy hasta que Pedido migre a SQLite
- VENTA_PROMOCION no es un módulo separado — es un ValorOperacional con fechas y estado
- CONVENIO diferido — precios negociados individualmente, fuera de este alcance
- Integración con flujo VENTAS → sesión de rediseño de VENTAS

---

## ABASTECIMIENTO — Decisiones arquitectónicas confirmadas (22 Jun)

- **ABASTECIMIENTO es categoría multi-rubro:** `farmacia/` es el primer inquilino. Nuevos rubros van como `abastecimiento/<rubro>/` hermano, no dentro de farmacia.
- **INGRESOS es el concepto canónico de compras en farmacia:** COMPRAS genérico permanece como modelo base para otros rubros. No existe ComprasFarmaciaWorkspace.
- **INVENTARIOS farmacia:** pendiente `InventarioFarmaciaWorkspace` que lea stock desde SQLite/Lotes, no desde localStorage. Routing rubro-consciente en App.tsx cuando esté listo.
- **NodoFraccionamiento, TipoFormaVenta, ValorOperacionalFarmacia:** deliberadamente fuera de GLOSARIO hasta el rediseño de VENTAS — no registrar antes de esa sesión.

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
  ↓ 34 comandos Tauri en Rust (31 originales + 3 desactivar_* commit b5e339d)
  ↓ farmacia.service.ts (26 funciones — 23 originales + 3 desactivarX)
  ↓ farmacia.store.ts (Zustand)
  ↓ components/sheet/ — SheetWork/SheetHeader/SheetBody/SheetFooter
      primer uso real en CobroPanel.tsx (VENTAS), AUN NO adoptado en ABASTECIMIENTO
  ↓ modules/abastecimiento/farmacia/
      CatalogoFarmaciaWorkspace.tsx     ✅ chrome alineado, producto de prueba creado
      ProveedoresWorkspace.tsx          ✅ chrome alineado, proveedor de prueba creado
      IngresosMercaderiaWorkspace.tsx   ✅ chrome alineado, overlays eliminados, sesión real conectada
  ↓ layout/OperationalBar.tsx — rubro-consciente, COMPRAS/INVENTARIOS ocultos en farmacia
```

---

## Próxima ventana de trabajo — Prioridad ordenada

1. **Verificar visualmente en pantalla** los tres workspaces FARMACIA tras el realineamiento de chrome — confirmar que se ven consistentes con el resto del sistema
2. **Probar IngresosMercaderiaWorkspace end-to-end real** — usar Lab. Portugal + Panadol ya creados, registrar ingreso con lote, confirmar en SQLite que se crea lote + movimiento tipo "entrada"
3. **PRECIOS — Capa A** — agregar `TipoValorOperacional` y `EstadoValorOperacional` como unions en `types.ts`, actualizar `ValorOperacionalFarmacia.tipo` y `.estado`
4. **PRECIOS — Capa B** — 4 comandos Rust para gestión de precios
5. **PRECIOS — Capa D** — pestaña PRECIOS en DetalleProducto.tsx
6. **InventarioFarmaciaWorkspace** — nuevo workspace que lee stock desde SQLite/Lotes
7. **BoxSlotType → TipoCaja** — migración de naming en blocks.store.ts (deuda de idioma)
8. **Operador.codigo** — verificar consumidores y eliminar si está huérfano

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
