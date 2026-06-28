# CURRENT CONTEXT — DISATEQ VENDOR™

## Branch & Commit
* **Branch:** `main`
* **Último commit:** `a8becec` — refactor(catalogo): GUARDAR CORRECCION unificado — datos basicos + condiciones operacionales en un solo handler, Ctrl+Enter como atajo

## Commits de la jornada 27 Jun
| Hash | Descripción |
|---|---|
| `a8becec` | refactor(catalogo): GUARDAR CORRECCION unificado — datos basicos + condiciones operacionales en un solo handler, Ctrl+Enter como atajo |
| `1806517` | fix(catalogo): CORREGIR footer VOLVER->detalle+keytips, DESACTIVAR header+footer fijo+keytips, eliminar CANCELAR |
| `8580070` | fix(catalogo): readonly bg-[#fffef7] text-slate-400, mayusculas en IFA/Concentracion/Forma, footer fijo VOLVER+GUARDAR, eliminar CANCELAR |
| `bc87c1e` | feat(catalogo): codigoInterno en ProductoComercial — migration v6, backend Rust, frontend CORREGIR con semántica visual editable/readonly |
| `83bc40e` | feat(catalogo): correccion_catalogo — tabla auditoria v7, comando Rust corregir_datos_operacionales, tipos y service TS |
| `968f5fe` | fix(catalogo): CORREGIR — reducir espaciado interlineal a gap-2 |
| `1a9a053` | fix(catalogo): CORREGIR — ancho proporcional CODIGO INTERNO 130px, CODIGO DIGEMID 190px, NOMBRE COMERCIAL flex-1 |
| `6b0f162` | refactor(catalogo): reorganizar formulario CORREGIR — orden por relevancia operacional, campos en grid, aviso historial en header |
| `2d39fec` | fix(catalogo): Enter en CORREGIR/DESACTIVAR — bloquear intercepcion en BuscadorProducto y CatalogoFarmaciaWorkspace cuando hay producto confirmado |

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
  - CORREGIR DATOS BÁSICOS ✅ reorganizado, codigoInterno, condiciones operacionales, guardado unificado — pendiente prueba UI final
  - DESACTIVAR PRODUCTO ✅ header, footer fijo, keytips — pendiente prueba UI final
  - ASIGNACIÓN PRESENTACIONES ⬜
  - ASIGNACIÓN DE PRECIOS ⬜
  - NuevoProductoStepper ⬜
* **ABASTECIMIENTO — PROVEEDORES:** ✅ Doctrina de color — pendiente evaluación visual
* **ABASTECIMIENTO — INGRESOS:** ✅ Doctrina de color — pendiente end-to-end
* **ABASTECIMIENTO — INVENTARIOS:** ✅ Doctrina de color
* **COBRO:** ✅ CERRADO (etapa 1)
* **PRE-VENTA:** ✅ CERRADO
* **VENTAS:** 🔶 FormaVenta infraestructura completa — UX PresentacionSheet pendiente
* **COMPROBANTES / CLIENTES / REPORTES / OPERADORES / CONFIG:** ⬜

---

## ⚠ PRÓXIMA SESIÓN — PARÉNTESIS PRIORITARIO: BRECHAS DIGEMID

Antes de continuar con la evaluación visual del catálogo, la próxima sesión debe abordar las brechas identificadas contra el Estándar DIGEMID Perú. Por su importancia regulatoria y operacional, se tratan como deuda arquitectónica crítica.

### Brechas identificadas — prioridad alta

**BRECHA 1 — DCI combinados (requerimiento legal)**
El campo `ifa` actual es texto libre y no soporta múltiples principios activos (ej. "Paracetamol + Clorfenamina"). Solución: **Tabla Maestra de Principios Activos** con soporte para combinaciones mediante separador `+`. Campo `ifa` en `ProductoComercial` pasa a ser FK o referencia a esta tabla. Impacta: creación de producto, búsqueda en catálogo y ventas.

**BRECHA 2 — Búsqueda genérica obligatoria en ventas (requerimiento legal)**
El buscador actual no permite buscar por DCI y mostrar todos los productos (genéricos y marcas) que comparten el mismo principio activo. Según normativa peruana, el establecimiento debe informar alternativas económicas al paciente. Impacta: módulo VENTAS — buscador de productos.

**BRECHA 3 — FEFO en despacho de lotes (requerimiento operacional alto)**
Al despachar un producto con lote, el sistema debe sugerir automáticamente el lote más próximo a vencer (First Expired, First Out). Sin esto, el inventario puede acumular productos vencidos sin control. Impacta: VENTAS e INGRESOS/INVENTARIOS.

**BRECHA 4 — Alerta de vencimiento próximo < 6 meses (requerimiento operacional medio)**
Al seleccionar un producto en venta, si el lote activo vence en menos de 6 meses, debe aparecer advertencia visual en pantalla del vendedor. Impacta: módulo VENTAS.

**BRECHA 5 — Bloqueo/confirmación por Receta Médica en ventas (requerimiento legal)**
`condicionVenta` ya existe en el modelo. Falta el flujo de validación en el punto de venta: alerta visual o confirmación obligatoria antes de emitir comprobante para productos CON_RECETA o CONTROLADO. Impacta: módulo VENTAS — flujo de cobro.

### Brechas identificadas — prioridad media

**BRECHA 6 — Descripción Corta de Venta autoconcatenada**
Fórmula DIGEMID: `[Nombre Comercial] + [Concentración] + [Forma Farmacéutica] + [Presentación]`. Ejemplo: `PARACETAMOL 500mg Tab (Caja x 100)`. Debe formalizarse como campo calculado para la pantalla de ventas. Actualmente la concatenación existe en el topbar del catálogo pero no como estándar de ventas.

**BRECHA 7 — Stock mínimo genéricos esenciales — Ley N° 32033 (30%)**
Las boticas deben mantener al menos 30% de stock en medicamentos genéricos esenciales. El sistema debe emitir alerta cuando el stock caiga por debajo de la cuota legal. Impacta: módulo INVENTARIOS.

### Brechas ya cubiertas ✅
Código de barras en PresentacionComercial · Registro Sanitario · Condición de Venta · Lote y Vencimiento · Fraccionamiento DIGEMID · Presentación Comercial · Fabricante

---

## CATÁLOGO FARMACIA — Estado consolidado al 27 Jun

### CORREGIR DATOS BÁSICOS — Orden de campos irrevocable

| Fila | Campos | Editable |
|---|---|---|
| Header | Nombre · Fabricante · Fechas · Badge · Aviso historial | No |
| 1 | CODIGO INTERNO (w-130px) · CODIGO DIGEMID (w-190px) · NOMBRE COMERCIAL (flex-1) | Sí / ADMIN / Sí |
| 2 | IFA / PRINCIPIO ACTIVO · FABRICANTE / LABORATORIO | No (mayúsculas) / Sí |
| 3 | CONCENTRACION / DOSIS · FORMA FARMACEUTICA | No (mayúsculas) |
| 4 | CONDICION DE VENTA · REFRIGERAR · CON VENCIMIENTO | Sí — con MOTIVO obligatorio si hay cambio |
| 5 | REGISTRO SANITARIO · ESTADO DEL REGISTRO | ADMIN |

### Doctrina GUARDAR CORRECCIÓN — IRREVOCABLE
- **Un solo botón GUARDAR CORRECCIÓN** — unifica datos básicos y condiciones operacionales
- **Flujo:** siempre guarda datos básicos → si hay cambio operacional y motivo vacío muestra error inline y no cierra → si hay cambio con motivo ejecuta corregirDatosOperacionales → cierra formulario
- **Atajo:** `Ctrl+Enter` — no colisiona con inputs de texto
- **MOTIVO DE CORRECCION** aparece inline solo cuando hay cambio operacional detectado
- **Auditoría:** cada campo operacional modificado genera fila en `correccion_catalogo`

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

### Schema migrations
| Version | Cambio |
|---|---|
| v2 | lote.fecha_vencimiento nullable |
| v3 | valor_operacional.tipo VENTA_NORMAL, vista reporte_digemid_privado |
| v4 | presentacion_comercial.stock_minimo |
| v5 | producto_comercial.estado_registro_sanitario DEFAULT VIGENTE |
| v6 | producto_comercial.codigo_interno TEXT (max 12, mayúsculas) |
| v7 | tabla correccion_catalogo + índices |

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

## DISEÑOS PENDIENTES

### Tabla Maestra de Principios Activos (IFA)
Catálogo normalizado de IFA con combinaciones posibles (soporte para `+`) y descripción operacional breve. Requerimiento legal DIGEMID. Campo `ifa` en `ProductoComercial` pasaría a ser FK. Impacta creación de producto, búsqueda en catálogo y ventas. **Abordar en próxima sesión como paréntesis prioritario.**

### Líneas de Laboratorio
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
| NuevoProductoStepper.tsx | Extraer pasos en componentes | Media |
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
| ProductoComercial | ifa como FK a tabla principios_activos — diseño diferido | Pendiente |
| ProductoComercial | lineaLaboratorio — diseño y migración diferidos | Pendiente |
| VENTAS | Búsqueda genérica por DCI — requerimiento legal DIGEMID | Alta |
| VENTAS | Bloqueo/confirmación por Receta Médica en cobro | Alta |
| VENTAS | Alerta vencimiento < 6 meses al despachar | Media |
| VENTAS/INVENTARIOS | FEFO — despacho por lote más próximo a vencer | Alta |
| INVENTARIOS | Alerta stock mínimo genéricos esenciales — Ley 32033 | Media |
| VENTAS | Descripción Corta de Venta autoconcatenada (fórmula DIGEMID) | Media |

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
- **GUARDAR CORRECCIÓN:** unificado — datos básicos siempre, condiciones operacionales si hay cambio con motivo
- **Enter en formularios:** nunca usar Enter simple como atajo de guardado — usar Ctrl+Enter
- **correccion_catalogo:** una fila por campo modificado — no JSON agregado
- **VOLVER en modos corrigiendo/desactivando:** siempre va a onIrADetalle, no onIrAResumen

---

## PRÓXIMA VENTANA DE TRABAJO

**PARÉNTESIS PRIORITARIO — Brechas DIGEMID:**
1. Diseño Tabla Maestra de Principios Activos (IFA + combinaciones)
2. Diseño búsqueda genérica por DCI
3. Diseño FEFO en despacho de lotes
4. Diseño bloqueo por Receta Médica en ventas
5. Diseño alerta vencimiento < 6 meses

**Continuación evaluación visual catálogo (post-paréntesis):**
6. Prueba UI — CORREGIR DATOS BÁSICOS completa
7. Prueba UI — DESACTIVAR PRODUCTO
8. Evaluación visual — ASIGNACIÓN PRESENTACIONES
9. Evaluación visual — ASIGNACIÓN DE PRECIOS
10. Evaluación visual — NuevoProductoStepper
11. Evaluación visual — PROVEEDORES flujo completo
12. INGRESOS — prueba end-to-end
13. BuscadorProducto — agregar codigoInterno a búsqueda SQL
14. Conectar `disateq:navegar` — listener en OperationalBar
15. OperationalBar — corregir color `#3D8A8A` → `#0284C7`
16. BoxSlotType → TipoCaja
17. Operador.codigo — verificar y eliminar si huérfano

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
