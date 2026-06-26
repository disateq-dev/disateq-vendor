# CURRENT CONTEXT — DISATEQ VENDOR™

## Branch & Commit
* **Branch:** `main`
* **Último commit:** `403e2e1` — fix(catalogo): detalle producto — acciones en topbar, Ir a INGRESOS debajo alineado derecha, footer navegacion PRESENTACIONES/PRECIOS/VOLVER

## Commits de la jornada 26 Jun
| Hash | Descripción |
|---|---|
| `403e2e1` | fix(catalogo): detalle producto — acciones en topbar, Ir a INGRESOS debajo alineado derecha, footer navegacion PRESENTACIONES/PRECIOS/VOLVER |
| `ec715fc` | fix(catalogo): flechas y Enter restringidos a vistaActiva detalle, Alt+P renombrado a Alt+E, hover persistente boton DETALLE |
| `83a7efb` | chore: eliminar directorios fantasma apps/vendor-desktop/apps y src raiz, regla canonica de rutas |
| (no capturado) | refactor(catalogo): sheetworks autonomas — topbar propia por vista, limpiar HeaderProducto y corregirRef |
| (no capturado) | fix(catalogo): botones detalle/presentaciones/precios alineados con header producto, color #0284C7, keytips Alt+D/Alt+E/Alt+R |

## Commits de la jornada 25 Jun
| Hash | Descripción |
|---|---|
| `fd4fa66` | feat(catalogo): rediseno panel derecho — VistaCatalogo resumen/detalle/presentaciones/precios, titulo dinamico |
| `5f54e94` | fix(catalogo): busqueda ampliar campos fabricante y codigo digemid, limite 12 en SQL |
| `a0714ae` | fix(catalogo): atajos keytips — Ctrl+Enter corregir, Ctrl+Insert ir a ingresos, link-text self-end |
| `9c79faa` | fix(catalogo): keytips — tamaño panel busqueda, dirección panel detalle, keytip ir a ingresos |
| `3651038` | fix(abastecimiento): doctrina color — accent #0284C7, semántica verde/naranja/rojo todo ABASTECIMIENTO |

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

**Nunca ejecutar `tsc` desde la raíz del repo.**
**Nunca ejecutar `git` desde dentro de `apps\vendor-desktop`.**
**Codex siempre recibe rutas absolutas completas en sus prompts.**

---

## Recorrido de Dominios (Matriz de Estado)
* **LOGIN:** ✅
* **TURNO / CAJA:** ✅
* **ABASTECIMIENTO — CATÁLOGO:** 🔶 Evaluación visual en curso — DETALLE DEL PRODUCTO pendiente de verificación visual
* **ABASTECIMIENTO — PROVEEDORES:** ✅ Doctrina de color aplicada — pendiente evaluación visual
* **ABASTECIMIENTO — INGRESOS:** ✅ Doctrina de color aplicada — pendiente prueba end-to-end
* **ABASTECIMIENTO — INVENTARIOS:** ✅ Doctrina de color aplicada
* **COBRO:** ✅ CERRADO (etapa 1)
* **PRE-VENTA:** ✅ CERRADO
* **VENTAS:** 🔶 FormaVenta infraestructura completa — UX PresentacionSheet pendiente
* **COMPROBANTES / CLIENTES / REPORTES / OPERADORES / CONFIG:** ⬜

---

## CATÁLOGO FARMACIA — Estado consolidado al 26 Jun

### Modelo de sheetworks — panel derecho
El panel derecho usa un modelo de sheetworks autónomas controladas por `VistaCatalogo`. Cada sheetwork tiene su propia topbar, título en headersheet e iconografía.

| Vista | Título headersheet | Topbar | Footer | Descripción |
|---|---|---|---|---|
| `resumen` | `DATOS BÁSICOS PRODUCTO` | Nombre + fabricante + fechas · Derecha: DETALLE/PRESENTACIONES/PRECIOS | — | Resumen operacional |
| `detalle` | `DETALLE DEL PRODUCTO` | Nombre + fabricante + fechas + badge · Derecha: CORREGIR/DESACTIVAR/LIMPIAR + Ir a INGRESOS debajo | PRESENTACIONES · PRECIOS · VOLVER | Todos los datos del producto |
| `presentaciones` | `ASIGNACIÓN PRESENTACIONES PRODUCTO` | Nombre + fabricante | — | Formas de venta y nodos |
| `precios` | `ASIGNACIÓN DE PRECIOS PRODUCTO` | Nombre + fabricante | — | Valores operacionales |
| `corrigiendo` | `CORREGIR DATOS BÁSICOS PRODUCTO` | — | LIMPIAR · CANCELAR · GUARDAR CORRECCIÓN | Formulario de corrección inline |
| `desactivando` | `DESACTIVAR PRODUCTO CATÁLOGO` | — | LIMPIAR · CANCELAR · CONFIRMAR BAJA | Confirmación de baja |
| `creandoAbierto` | `NUEVO PRODUCTO` | — | — | Stepper de creación |

### Doctrina de sheetworks — IRREVOCABLE
- Cada sheetwork es autónoma — gestiona su propia topbar, cuerpo y footer
- No existe header global compartido entre sheetworks
- Botones DETALLE/PRESENTACIONES/PRECIOS en DATOS BÁSICOS: navegadores de salida, topbar derecha, color outline `#0284C7`
- Botones CORREGIR/DESACTIVAR/LIMPIAR en DETALLE: acciones de la topbar derecha, fila superior
- Link Ir a INGRESOS: debajo de los botones de acción, alineado a la derecha (`self-end`)
- Footer de DETALLE: PRESENTACIONES (Alt+E) · PRECIOS (Alt+R) · VOLVER (Esc → onIrAResumen), proporciones `flex-[1]` cada uno

### Mapa de atajos teclado — CATÁLOGO
| Atajo | Sheetwork | Acción |
|---|---|---|
| ↑↓ | Búsqueda | Navegar resultados con preview |
| Enter | Búsqueda | Confirmar producto seleccionado |
| Escape | Búsqueda | Limpiar todo |
| Ctrl+Enter | Búsqueda (sin producto) | Abrir stepper NUEVO |
| Alt+D | Datos Básicos / Detalle | Ir a DETALLE DEL PRODUCTO |
| Alt+E | Datos Básicos / Detalle | Ir a ASIGNACIÓN PRESENTACIONES |
| Alt+R | Datos Básicos / Detalle | Ir a ASIGNACIÓN DE PRECIOS |
| ◄► | Detalle | Navegar entre CORREGIR / DESACTIVAR / LIMPIAR |
| Enter | Detalle | Ejecutar acción seleccionada con ◄► |
| Escape | Detalle (lectura) | Limpiar selección |
| Ctrl+Enter | Detalle (ACTIVO) | Iniciar CORREGIR |
| Ctrl+Insert | Detalle (ACTIVO) | Ir a INGRESOS |
| Ctrl+Supr | Detalle (ACTIVO) | Activar modo DESACTIVAR |

### Keytips — ESTÁNDAR CANÓNICO ACTUALIZADO
- Tamaño: `text-[11px]` · Padding: `px-2 py-1`
- Estilo: `bg-[#fefce8] border border-[#fef08a] text-[#713f12] text-[11px] font-bold rounded px-2 py-1`
- Comportamiento: `opacity-0 group-hover:opacity-100 transition-opacity duration-150`
- Posición botones zona inferior: `absolute -bottom-7 left-1/2 -translate-x-1/2`
- Posición botones zona superior: `absolute -top-7 left-1/2 -translate-x-1/2`
- Posición link-text: `absolute -bottom-6 left-1/2 -translate-x-1/2`
- `pointer-events-none whitespace-nowrap z-10`
- Contenedor de navegadores con keytips `-top-7`: debe tener `overflow-visible`

### Búsqueda de productos — canónico
- Campos SQL: `nombre_comercial`, `ifa`, `nombre_fabricante`, `codigo_digemid`
- Límite: `LIMIT 12` en SQL · Debounce: 300ms · Mínimo: 2 caracteres

### Archivos del módulo CATÁLOGO
| Archivo | Responsabilidad |
|---|---|
| `CatalogoFarmaciaWorkspace.tsx` | Layout dos paneles, título dinámico, coordinación |
| `hooks/useCatalogoFarmacia.ts` | Estado, navegación, búsqueda, handlers |
| `components/BuscadorProducto.tsx` | Lista de resultados, input, navegación teclado |
| `components/DetalleProducto.tsx` | Sheetworks autónomas completas |
| `components/NuevoProductoStepper.tsx` | Creación de producto paso a paso |

---

## SEMÁNTICA DE COLOR DE BOTONES — DOCTRINA GLOBAL IRREVOCABLE

| Patrón | Cuándo | Color |
|---|---|---|
| Outline verde | Iniciar acción nueva | `#45b356` / hover `#F2F7F3` |
| Sólido verde | Confirmar acción | `bg-[#45b356]` texto blanco |
| Outline naranja | Salir / limpiar / volver | `#f97316` / hover `#fff7ed` |
| Outline rojo | Cancelar dentro de flujo destructivo | `#dc2626` / hover `#fef2f2` |
| Sólido rojo | Confirmar acción irreversible | `bg-red-500` texto blanco |
| Outline azul `#0284C7` | Navegadores de sheetwork | hover `#E0F2FE` |
| Sólido azul `#0284C7` | Navegador de sheetwork activo | texto blanco |

**Estado deshabilitado canónico:** `disabled:opacity-50 disabled:cursor-not-allowed`

---

## SISTEMA DE INPUT SEMÁNTICO — DOCTRINA GLOBAL IRREVOCABLE

### Familia ENTER
| Atajo | Tailwind |
|---|---|
| `Enter` | `bg-[#45b356] text-white` |
| `Ctrl+Enter` | `border-[#45b356] bg-[#45b356]/20 text-[#45b356]` |
| `Shift+Enter` | `border-[#45b356] bg-[#45b356]/10 text-[#45b356]` |
| `Alt+Enter` | `border-[#45b356] bg-white text-[#45b356]` |

### Familia DELETE
| Atajo | Tailwind |
|---|---|
| `Delete` | `bg-red-500 text-white` |
| `Ctrl+Delete` | `border-[#dc2626] bg-[#dc2626]/20 text-[#dc2626]` |
| `Shift+Delete` | `border-[#dc2626] bg-[#dc2626]/10 text-[#dc2626]` |
| `Alt+Delete` | `border-[#dc2626] bg-white text-[#dc2626]` |

---

## CONVENCIÓN DE BOTONES — ESTÁNDAR CANÓNICO
- Texto en MAYÚSCULAS
- Par de panel de búsqueda: `flex-[1]` naranja / `flex-[2]` verde
- Footer sheetwork DETALLE: `flex-[1]` para cada botón
- LIMPIAR opera solo en su panel — nunca invade contexto ajeno
- Cursor pointer global vía `index.css`

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
- **Claude** = Arquitecto Senior — diseña, especifica, genera prompts para Codex — **NUNCA escribe código directamente**
- **Codex** = Desarrollador atómico — ejecuta prompts de Claude
- Claude no debe intentar editar archivos del proyecto bajo ninguna circunstancia

---

## SCHEMA MIGRATIONS
| Version | Cambio |
|---|---|
| v2 | lote.fecha_vencimiento nullable |
| v3 | valor_operacional.tipo VENTA_NORMAL, vista reporte_digemid_privado |
| v4 | presentacion_comercial.stock_minimo |
| v5 | producto_comercial.estado_registro_sanitario DEFAULT VIGENTE |

---

## DEUDA TÉCNICA REGISTRADA

| Archivo | Problema | Prioridad |
|---|---|---|
| DetalleProducto.tsx | 700+ líneas — extraer PresentacionesTab y PreciosTab a archivos propios | Media |
| DetalleProducto.tsx | Vista PRECIOS en resumen muestra texto fijo — pendiente conectar valor real VENTA_NORMAL | Media |
| PreciosTab | Botones Guardar/Cancelar fuera de doctrina — usan azul en lugar de verde/naranja | Media |
| NuevoProductoStepper.tsx | Extraer pasos en componentes | Media |
| OperationalBar.tsx | Listener `disateq:navegar` pendiente de conectar | Media |
| OperationalBar.tsx | Color `#3D8A8A` teal residual → corregir a `#0284C7` | Media |
| OperationalBar.tsx | Doble llamada a usePOS() | Baja |
| catalogo.service.ts | ItemCatalogo no proyecta condicionVenta desde SQLite | Media |
| blocks.store.ts | BoxSlotType → TipoCaja | Media |
| operator.store.ts | Operador.codigo huérfano | Media |
| farmacia.service.ts | actualizarProveedor → modificarProveedor | Baja |
| ContextBar.tsx | Archivo huérfano | Baja |
| DetalleProveedor.tsx | Solo accent corregido — botones sin auditar directamente | Baja |

---

## DOCTRINA DE CALIDAD — IRREVOCABLE

### CONVENCIÓN TAURI
**Todo argumento de invoke() TypeScript se envía SIEMPRE en camelCase.**

### LECCIONES APRENDIDAS
- **TypeScript:** `npx tsc --noEmit` desde `apps\vendor-desktop`, no raíz del repo
- **Migraciones ADD COLUMN:** verificar con `pragma_table_info` antes de ALTER TABLE
- **Seeds SQL:** en `.gitignore`. DB real: `disateq.db`
- **CURRENT_CONTEXT.md:** usar `filesystem:write_file` con parámetro `content`
- **Prompts Codex:** lenguaje natural puro, sin bloques de código
- **Codex reenvío:** verificar filesystem si el reporte menciona archivos de entregas anteriores
- **Claude no escribe código:** Claude genera prompts para Codex — nunca modifica archivos directamente
- **Botonería:** texto en MAYÚSCULAS, keytips flotantes solo si atajo implementado
- **Accent `#639922`:** eliminado — residuo del diseño anterior. Canónico ABASTECIMIENTO = `#0284C7`
- **Keytips tamaño canónico:** `text-[11px] px-2 py-1`
- **Contenedor de navegadores con keytips -top-7:** debe tener `overflow-visible`
- **Flechas ◄►  y Enter con indiceAccion:** exclusivos de `vistaActiva === 'detalle'`
- **onIrAResumen:** prop activa sin alias — botón VOLVER en footer de DETALLE
- **Directorios fantasma eliminados 26 Jun:** `apps\vendor-desktop\apps` y `src\` en raíz

---

## PRÓXIMA VENTANA DE TRABAJO

1. **Evaluación visual** — DETALLE DEL PRODUCTO (verificar topbar acciones + footer navegación)
2. **Evaluación visual** — ASIGNACIÓN PRESENTACIONES
3. **Evaluación visual** — ASIGNACIÓN DE PRECIOS
4. **Evaluación visual** — NuevoProductoStepper flujo completo
5. **Evaluación visual** — PROVEEDORES flujo completo
6. **INGRESOS** — prueba end-to-end
7. **Conectar `disateq:navegar`** — listener en OperationalBar
8. **OperationalBar** — corregir color `#3D8A8A` → `#0284C7`
9. **BoxSlotType → TipoCaja**
10. **Operador.codigo** — verificar y eliminar si huérfano

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
