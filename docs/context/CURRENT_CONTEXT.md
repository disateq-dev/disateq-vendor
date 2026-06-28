# CURRENT CONTEXT — DISATEQ VENDOR™

## Branch & Commit
* **Branch:** `main`
* **Último commit:** `f0960ca` — feat(ventas): Brecha DIGEMID 5 — bloqueo/confirmacion receta medica en cobro

## Commits de la jornada 28 Jun
| Hash | Descripción |
|---|---|
| `f0960ca` | feat(ventas): Brecha DIGEMID 5 — bloqueo/confirmacion receta medica en cobro |
| `2a994cb` | feat(catalogo): SelectorPrincipiosActivos — selector IFA con autocompletado, chips y auditoria integrado en CORREGIR |
| `239caea` | feat(catalogo): servicio obtenerPrincipiosDeProducto — desbloqueo selector IFA |
| `3e40feb` | feat(catalogo): migración v9 — campos regulatorios IFA, tipos PrincipioActivo, servicios listar/buscar/asignar |
| `22404a8` | feat(catalogo): migracion v8 — tabla maestra principio_activo, producto_principio_activo, migracion de datos IFA, 4 comandos Rust |

## Commits de la jornada 27 Jun
| Hash | Descripción |
|---|---|
| `a8becec` | refactor(catalogo): GUARDAR CORRECCION unificado — datos basicos + condiciones operacionales en un solo handler, Ctrl+Enter como atajo |
| `1806517` | fix(catalogo): CORREGIR footer VOLVER->detalle+keytips, DESACTIVAR header+footer fijo+keytips, eliminar CANCELAR |
| `8580070` | fix(catalogo): readonly bg-[#fffef7] text-slate-400, mayusculas en IFA/Concentracion/Forma, footer fijo VOLVER+GUARDAR, eliminar CANCELAR |
| `bc87c1e` | feat(catalogo): codigoInterno en ProductoComercial — migration v6, backend Rust, frontend CORREGIR con semantica visual editable/readonly |
| `83bc40e` | feat(catalogo): correccion_catalogo — tabla auditoria v7, comando Rust corregir_datos_operacionales, tipos y service TS |

---

## REGLA CANÓNICA DE RUTAS — IRREVOCABLE

| Operación | Directorio de ejecución |
|---|---|
| `npx tsc --noEmit` | `D:\DisateQ-DEV\Proyectos\disateq-vendor\apps\vendor-desktop` |
| `npm run dev` | `D:\DisateQ-DEV\Proyectos\disateq-vendor\apps\vendor-desktop` |
| `git` — cualquier operación | `D:\DisateQ-DEV\Proyectos\disateq-vendor` (raíz del repo) |
| Archivos fuente React/TS | `D:\DisateQ-DEV\Proyectos\disateq-vendor\apps\vendor-desktop\src` |
| Archivos fuente Rust | `D:\DisateQ-DEV\Proyectos\disateq-vendor\apps\vendor-desktop\src-tauri` |
| Documentación | `D:\DisateQ-DEV\Proyectos\disateq-vendor\docs` |

---

## Recorrido de Dominios (Matriz de Estado)
* **LOGIN:** ✅
* **TURNO / CAJA:** ✅
* **ABASTECIMIENTO — CATÁLOGO:** 🔶 Evaluación visual en curso
  - RESUMEN DEL PRODUCTO ✅
  - DETALLE DEL PRODUCTO ✅ navegación teclado completa
  - CORREGIR DATOS BÁSICOS ✅ reorganizado, codigoInterno, condiciones operacionales, guardado unificado, SelectorPrincipiosActivos integrado — pendiente prueba UI final
  - DESACTIVAR PRODUCTO ✅ header, footer fijo, keytips — pendiente prueba UI final
  - ASIGNACIÓN PRESENTACIONES ⬜
  - ASIGNACIÓN DE PRECIOS ⬜
  - NuevoProductoStepper ⬜
* **ABASTECIMIENTO — PROVEEDORES:** ✅ Doctrina de color — pendiente evaluación visual
* **ABASTECIMIENTO — INGRESOS:** ✅ Doctrina de color — pendiente end-to-end
* **ABASTECIMIENTO — INVENTARIOS:** ✅ Doctrina de color
* **COBRO:** ✅ CERRADO (etapa 1)
* **PRE-VENTA:** ✅ CERRADO
* **VENTAS:** 🔶 FormaVenta infraestructura completa — Brecha 5 cerrada — Brecha 2 siguiente
* **COMPROBANTES / CLIENTES / REPORTES / OPERADORES / CONFIG:** ⬜

---

## PARÉNTESIS DIGEMID — Estado al cierre de jornada 28 Jun

| Brecha | Estado |
|---|---|
| 1 — Tabla Maestra IFA + combinaciones + SelectorUI | ✅ CERRADA |
| 2 — Búsqueda genérica por DCI en ventas | ⬜ SIGUIENTE |
| 3 — FEFO en despacho de lotes | ⬜ |
| 4 — Alerta vencimiento < 6 meses (semáforo 3 niveles) | ⬜ |
| 5 — Bloqueo/confirmación receta médica en cobro | ✅ CERRADA — commit f0960ca |
| 6 — Descripción corta autoconcatenada (fórmula DIGEMID) | ⬜ |
| 7 — Stock mínimo genéricos esenciales — Ley 32033 | ⬜ |
| 8 — Psicotrópicos/estupefacientes — libro control DIGEMID | ⬜ Registrada nueva |

### Orden de ataque próxima sesión (Brechas 2-7)
1. **Brecha 2** — Búsqueda genérica DCI en ventas — depende tabla principio_activo ya construida
2. **Brecha 3** — FEFO — comando resolver_lote_fefo ya existe en Rust, falta flujo UI ventas
3. **Brecha 4** — Semáforo vencimiento — CRITICO <60 días, ALERTA <180 días, OK el resto
4. **Brecha 7** — Stock mínimo esenciales — campo esEsencialMinsa ya en modelo
5. **Brecha 6** — Descripción autoconcatenada — independiente, puede ir en paralelo

---

## BRECHA 5 — Arquitectura implementada (IRREVOCABLE)

### Archivos modificados
- `domains/catalog/bridge-catalogo.ts` — `ProductoBuscable` extendido con `condicionVenta?: 'SIN_RECETA' | 'CON_RECETA' | 'CONTROLADO'`. Proyección desde `useFarmaciaStore.getState().productosComerciales` vía `HOV.productoId`.
- `domains/preventa/dto/LineaPreVenta.ts` — `flags.requirioReceta?: boolean` agregado.
- `modules/sales/components/ConfirmacionRecetaPanel.tsx` — Panel inline nuevo. Props: nombreProducto, condicion, onConfirmar, onCancelar. Teclado: Enter confirma, Escape cancela.
- `modules/sales/SalesWorkspace.tsx` — Estado `confirmaReceta`, intercepción en `addProductToTicket`, handlers `handleConfirmarReceta` / `handleCancelarReceta`, renderizado condicional del panel.

### Regla operacional — IRREVOCABLE
- `SIN_RECETA` → agrega inmediatamente, sin interrupción
- `CON_RECETA` → panel naranja (`#f97316`), confirmación obligatoria del operador
- `CONTROLADO` → panel rojo (`#dc2626`), confirmación obligatoria del operador
- Sin modal — doctrina Anti-Modal respetada. Panel inline absoluto sobre zona de resultados.
- Foco restaurado al buscador tras confirmar o cancelar.

### Diferido (no resuelto en esta brecha)
- Captura de número de receta (requiere input adicional)
- Bloqueo por PIN de supervisor para CONTROLADO
- Tabla libro_control_digemid — Brecha 8

---

## BRECHA 1 — Arquitectura implementada (IRREVOCABLE)

### Modelo de datos
- **`principio_activo`** — tabla maestra normalizada: id, nombre_dci (UNIQUE), descripcion, activo, es_esencial_minsa, es_psicotropico, creado_en
- **`producto_principio_activo`** — asociación N:M: producto_generico_id, principio_activo_id, orden. PK compuesta.
- **`producto_generico.ifa`** — campo denormalizado regenerado automáticamente al asignar principios (concatenación " + " en orden)
- Índices: idx_ppa_generico, idx_ppa_principio, idx_principio_dci

### Migraciones
| Version | Cambio |
|---|---|
| v2 | lote.fecha_vencimiento nullable |
| v3 | valor_operacional.tipo VENTA_NORMAL, vista reporte_digemid_privado |
| v4 | presentacion_comercial.stock_minimo |
| v5 | producto_comercial.estado_registro_sanitario DEFAULT VIGENTE |
| v6 | producto_comercial.codigo_interno TEXT (max 12, mayúsculas) |
| v7 | tabla correccion_catalogo + índices |
| v8 | tabla principio_activo + producto_principio_activo + migración datos IFA existentes |
| v9 | principio_activo.es_esencial_minsa + es_psicotropico (INTEGER DEFAULT 0) |

### Comandos Rust (productos.rs)
| Comando | Propósito |
|---|---|
| `listar_principios_activos` | Todos los IFA activos ordenados por nombre_dci |
| `buscar_principios_activos(query)` | Búsqueda por prefijo LIKE en mayúsculas, LIMIT 10 |
| `obtener_principios_de_producto(productoGenericoId)` | Lista ordenada por orden para un producto |
| `asignar_principios_a_producto(productoGenericoId, principioActivoIds, operadorId, motivo)` | Reemplaza asociaciones, regenera ifa, audita si hay motivo |

### Tipos TypeScript (farmacia/types.ts)
```
interface PrincipioActivo {
  id: string
  nombreDci: string
  descripcion?: string
  activo: boolean
  esEsencialMinsa: boolean
  esPsicotropico: boolean
}

interface AsignacionPrincipiosInput {
  productoGenericoId: string
  principioActivoIds: string[]
  operadorId: string
  motivo?: string
}
```
- `ProductoGenerico` extendida con `principiosActivos?: PrincipioActivo[]`

### Servicios (farmacia.service.ts)
- `listarPrincipiosActivos()` — sin args
- `buscarPrincipiosActivos(query)` — autocompletado
- `asignarPrincipiosAProducto(input)` — escritura con auditoría
- `obtenerPrincipiosDeProducto(productoGenericoId)` — lectura por producto

### Regla operacional IFA — IRREVOCABLE
- **Sin historial:** selector editable sin restricción adicional
- **Con historial:** motivo obligatorio, registro en correccion_catalogo (tabla=producto_generico, campo=composicion_ifa)
- `verificarHistorialProducto` consulta movimientos existentes para determinar la condición

### SelectorPrincipiosActivos (componente UI)
- Ubicación: `src/modules/abastecimiento/farmacia/components/SelectorPrincipiosActivos.tsx`
- Props: productoGenericoId, tieneHistorial, operadorId, onCambio, motivo, disabled
- Comportamiento: carga principios actuales al montar, búsqueda con debounce 250ms, chips eliminables, dropdown con badges ESENCIAL (verde) y CTRL (rojo), aviso historial en amber
- Integrado en CORREGIR DATOS BÁSICOS reemplazando el input readonly de IFA

---

## CATÁLOGO FARMACIA — Estado consolidado

### CORREGIR DATOS BÁSICOS — Orden de campos irrevocable

| Fila | Campos | Editable |
|---|---|---|
| Header | Nombre · Fabricante · Fechas · Badge · Aviso historial | No |
| 1 | CODIGO INTERNO (w-130px) · CODIGO DIGEMID (w-190px) · NOMBRE COMERCIAL (flex-1) | Sí / ADMIN / Sí |
| 2 | IFA / PRINCIPIO ACTIVO (SelectorPrincipiosActivos) · FABRICANTE / LABORATORIO | Selector interactivo / Sí |
| 3 | CONCENTRACION / DOSIS · FORMA FARMACEUTICA | No (mayúsculas) |
| 4 | CONDICION DE VENTA · REFRIGERAR · CON VENCIMIENTO | Sí — con MOTIVO obligatorio si hay cambio |
| 5 | REGISTRO SANITARIO · ESTADO DEL REGISTRO | ADMIN |

### Doctrina GUARDAR CORRECCIÓN — IRREVOCABLE
- **Un solo botón GUARDAR CORRECCIÓN** — ejecuta en orden: asignarPrincipiosAProducto (si hay ids) → modificarProductoComercial → corregirDatosOperacionales (si hay cambio operacional con motivo)
- **Atajo:** `Ctrl+Enter`
- **MOTIVO DE CORRECCION** aparece inline solo cuando hay cambio operacional detectado
- **Auditoría IFA:** registro en correccion_catalogo solo si tieneHistorial y hay motivo

### DESACTIVAR PRODUCTO — Estado irrevocable
- Header con nombre + fabricante + fechas + badge
- Footer fijo: VOLVER (Esc → onIrADetalle) · CONFIRMAR BAJA (Ctrl+Supr → sólido rojo)
- Sin CANCELAR

### Semántica visual de campos CORREGIR — IRREVOCABLE
| Estado | Fondo | Texto |
|---|---|---|
| Editable | `bg-white` | `text-slate-800` |
| Solo lectura crítico | `bg-[#fffef7]` | `text-slate-400` |
| Solo lectura ADMIN bloqueado | `bg-[#fffef7]` | `text-slate-400` |

### Tabla correccion_catalogo — estructura canónica
```
id TEXT PRIMARY KEY
tabla TEXT NOT NULL
entidad_id TEXT NOT NULL
campo TEXT NOT NULL
valor_anterior TEXT NOT NULL
valor_nuevo TEXT NOT NULL
motivo TEXT NOT NULL
operador_id TEXT NOT NULL
creado_en TEXT NOT NULL
```

---

## CONVIVENCIA DE TIPOS OPERACIONALES — DOCTRINA

```
TipoRecursoOperacional: MEDICAMENTO | PRODUCTO_GENERAL | SERVICIO

HOV (punto de unificación del catálogo)
├── tipoRecurso = MEDICAMENTO   → ProductoComercial → ProductoGenerico → principio_activo
├── tipoRecurso = PRODUCTO_GENERAL → ProductoGeneral (sin IFA, sin lote obligatorio)
└── tipoRecurso = SERVICIO      → ServicioFarmacia (sin stock, sin lote, tiene duracionMinutos)
```

La tabla `principio_activo` y `producto_principio_activo` SOLO aplican a MEDICAMENTO. `ProductoGeneral` y `ServicioFarmacia` no se tocan.

---

## DISEÑOS PENDIENTES

### Brecha 8 — Psicotrópicos/Estupefacientes
Campo `es_psicotropico` ya existe en `principio_activo` (v9). Falta: tabla `libro_control_digemid` y flujo en ventas para productos CONTROLADO con este flag. Diseño diferido.

### Tabla Maestra de Líneas de Laboratorio
Un laboratorio organiza su portafolio en líneas comerciales o terapéuticas. Implementación diferida — puede ser tabla maestra o texto libre. Campo futuro: `lineaLaboratorio` en `ProductoComercial`.

---

## SEMÁNTICA DE COLOR DE BOTONES — DOCTRINA GLOBAL IRREVOCABLE

| Patrón | Cuándo | Color |
|---|---|---|
| Outline verde | Iniciar acción nueva | `#45b356` / hover `#F2F7F3` |
| Sólido verde | Confirmar acción | `bg-[#45b356]` texto blanco |
| Outline naranja | Salir / limpiar / volver | `#f97316` / hover `#fff7ed` |
| Outline rojo | Cancelar flujo destructivo | `#dc2626` / hover `#fef2f2` |
| Sólido rojo | Confirmar acción irreversible | `bg-red-500` texto blanco |
| Outline azul `#0284C7` | Navegadores genéricos | hover `#E0F2FE` |
| Violeta `#7C3AED` | Navegador DETALLE | `#EDE9FE` |
| Cyan `#0891B2` | Navegador PRESENTACIONES | `#ECFEFF` |
| Ámbar `#D97706` | Navegador PRECIOS | `#FEF3C7` |

**Estado deshabilitado canónico:** `disabled:opacity-50 disabled:cursor-not-allowed`

---

## ACCENT CANÓNICO POR MÓDULO
| Módulo | Accent | Tint |
|---|---|---|
| ABASTECIMIENTO | `#0284C7` | `#E0F2FE` |
| VENTAS / COBRO | `#45b356` | `#F2F7F3` |
| TURNO / CAJA | `#2A7CA8` | — |
| COMPROBANTES | `#C05050` | — |
| AJUSTES / CONFIG | `#697387` | — |
| CLIENTES | `#1e7e4f` | — |
| REPORTES | `#2154d8` | — |

---

## REGLA IRREVOCABLE DE ROLES
- **Fernando** = Product Owner — decide, ejecuta, commitea
- **Claude** = Arquitecto Senior — diseña, especifica, genera prompts — **NUNCA escribe código directamente**
- **Codex** = Desarrollador atómico — ejecuta prompts de Claude

---

## DEUDA TÉCNICA REGISTRADA

| Archivo | Problema | Prioridad |
|---|---|---|
| DetalleProducto.tsx | 1000+ líneas — extraer PresentacionesTab y PreciosTab | Media |
| DetalleProducto.tsx | Vista PRECIOS en resumen muestra texto fijo | Media |
| PreciosTab | Botones Guardar/Cancelar fuera de doctrina — usan azul | Media |
| NuevoProductoStepper.tsx | Extraer pasos en componentes + integrar SelectorPrincipiosActivos | Media |
| OperationalBar.tsx | Listener `disateq:navegar` pendiente | Media |
| OperationalBar.tsx | Color `#3D8A8A` teal → `#0284C7` | Media |
| OperationalBar.tsx | Doble llamada a usePOS() | Baja |
| catalogo.service.ts | ItemCatalogo no proyecta condicionVenta desde SQLite | Media |
| BuscadorProducto.tsx | codigoInterno no incluido en búsqueda SQL | Media |
| blocks.store.ts | BoxSlotType → TipoCaja | Media |
| operator.store.ts | Operador.codigo huérfano | Media |
| farmacia.service.ts | actualizarProveedor → modificarProveedor | Baja |
| ContextBar.tsx | Archivo huérfano | Baja |
| DetalleProveedor.tsx | Botones sin auditar directamente | Baja |
| ProductoComercial | lineaLaboratorio — diseño y migración diferidos | Pendiente |
| VENTAS | Búsqueda genérica por DCI — Brecha 2 | Alta |
| VENTAS | Alerta vencimiento semáforo 3 niveles — Brecha 4 | Media |
| VENTAS/INVENTARIOS | FEFO — despacho por lote más próximo a vencer — Brecha 3 | Alta |
| INVENTARIOS | Alerta stock mínimo genéricos esenciales — Brecha 7 | Media |
| VENTAS | Descripción Corta autoconcatenada (fórmula DIGEMID) — Brecha 6 | Media |
| VENTAS/DIGEMID | Libro control psicotrópicos/estupefacientes — Brecha 8 | Pendiente diseño |

---

## PRÓXIMA VENTANA DE TRABAJO

**Continuar Paréntesis DIGEMID — Brechas 2 a 7:**
1. Brecha 2 — Búsqueda genérica DCI en ventas
2. Brecha 3 — FEFO en despacho
3. Brecha 4 — Semáforo vencimiento
4. Brecha 7 — Stock mínimo esenciales Ley 32033
5. Brecha 6 — Descripción autoconcatenada

**Post-paréntesis DIGEMID — continuación evaluación visual catálogo:**
6. Prueba UI — CORREGIR DATOS BÁSICOS completa (incluye SelectorPrincipiosActivos)
7. Prueba UI — DESACTIVAR PRODUCTO
8. Evaluación visual — ASIGNACIÓN PRESENTACIONES
9. Evaluación visual — ASIGNACIÓN DE PRECIOS
10. Evaluación visual — NuevoProductoStepper (integrar SelectorPrincipiosActivos)
11. Evaluación visual — PROVEEDORES flujo completo
12. INGRESOS — prueba end-to-end
13. BuscadorProducto — agregar codigoInterno a búsqueda SQL
14. Conectar `disateq:navegar` — listener en OperationalBar
15. OperationalBar — corregir color `#3D8A8A` → `#0284C7`
16. BoxSlotType → TipoCaja
17. Operador.codigo — verificar y eliminar si huérfano

---

## DOCTRINA DE CALIDAD — IRREVOCABLE

### CONVENCIÓN TAURI
**Todo argumento de invoke() TypeScript se envía SIEMPRE en camelCase.**

### LECCIONES APRENDIDAS
- **TypeScript:** `npx tsc --noEmit` desde `apps\vendor-desktop`
- **CURRENT_CONTEXT.md:** usar `filesystem:write_file`
- **Prompts Codex:** lenguaje natural puro, sin bloques de código
- **Footer fijo:** cadena flex completa — `shrink-0` obligatorio
- **Intercepción de teclado:** BuscadorProducto y CatalogoFarmaciaWorkspace deben inhibir con producto confirmado
- **GUARDAR CORRECCIÓN:** unificado — principios IFA → datos básicos → condiciones operacionales si hay cambio
- **Enter en formularios:** nunca usar Enter simple como atajo de guardado — usar Ctrl+Enter
- **correccion_catalogo:** una fila por campo modificado — no JSON agregado
- **VOLVER en modos corrigiendo/desactivando:** siempre va a onIrADetalle, no onIrAResumen
- **git commit -am:** no rastrea archivos nuevos — usar `git add` explícito antes del commit
- **Archivos nuevos Codex:** siempre verificar con `git status` si hay archivos no rastreados antes de commitear
- **Comandos git:** siempre con ruta completa `git -C "D:\DisateQ-DEV\Proyectos\disateq-vendor" ...`

### SEMÁFORO DE VENCIMIENTO — DOCTRINA (del análisis WOLF farma)
| Días hasta vencimiento | Nivel | Acción en UI |
|---|---|---|
| < 60 días | `CRITICO` | Alerta roja bloqueante — requiere confirmación |
| < 180 días | `ALERTA` | Advertencia naranja informativa |
| ≥ 180 días | `OK` | Despacho sin interrupción |

---

## Datos de prueba
5 genéricos · 8 comerciales · 8 presentaciones · 16 lotes · 2 proveedores · 11 precios
Seed en `.gitignore`. DB: `$env:APPDATA\com.disateq.vendor\disateq.db`

---

## Mapa de Atajos — COBRO
TIQUE Ctrl+7 · BOLETA Ctrl+8 · FACTURA Ctrl+9 · COTIZACION Ctrl+4
EFECTIVO Ctrl+E · YAPE Ctrl+Y · TARJETA Ctrl+T · MIXTO Ctrl+M
GUARDAR Ctrl+Insert · IMPRIMIR Enter · CERRAR Escape

## Doctrina de Footer
1 botón 100% · 2 botones 50/50 · 3 botones 25/25/50 · Principal verde derecha

## Doctrina de Impresión
ESC/POS via Rust/Tauri. HTML/CSS solo fallback PDF.

## Nomenclatura Canónica
FormaVenta / FormaCompra / UnidadBase
ProductoGenerico / ProductoComercial / PresentacionComercial / NodoFraccionamiento
TipoRecursoOperacional / ProductoGeneral / ServicioFarmacia

---
*Iniciar sesión limpia leyendo este contexto. Si hay discrepancia entre este documento y el filesystem real, el filesystem es la fuente de verdad.*
