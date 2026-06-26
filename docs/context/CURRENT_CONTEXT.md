# CURRENT CONTEXT — DISATEQ VENDOR™

## Branch & Commit
* **Branch:** `main`
* **Último commit:** `fd4fa66` — feat(catalogo): rediseno panel derecho — VistaCatalogo resumen/detalle/presentaciones/precios, titulo dinamico

## Commits de la jornada 25 Jun
| Hash | Descripción |
|---|---|
| `fd4fa66` | feat(catalogo): rediseno panel derecho — VistaCatalogo resumen/detalle/presentaciones/precios, titulo dinamico |
| `5f54e94` | fix(catalogo): busqueda ampliar campos fabricante y codigo digemid, limite 12 en SQL |
| `a0714ae` | fix(catalogo): atajos keytips — Ctrl+Enter corregir, Ctrl+Insert ir a ingresos, link-text self-end |
| `9c79faa` | fix(catalogo): keytips — tamaño panel busqueda, dirección panel detalle, keytip ir a ingresos |
| `3651038` | fix(abastecimiento): doctrina color — accent #0284C7, semántica verde/naranja/rojo todo ABASTECIMIENTO |

---

## Recorrido de Dominios (Matriz de Estado)
* **LOGIN:** ✅
* **TURNO / CAJA:** ✅
* **ABASTECIMIENTO — CATÁLOGO:** ✅ Sprint completo cerrado. Keytips canónicos. Búsqueda 4 campos. Panel derecho rediseñado con 4 vistas.
* **ABASTECIMIENTO — PROVEEDORES:** ✅ Doctrina de color aplicada — pendiente evaluación visual
* **ABASTECIMIENTO — INGRESOS:** ✅ Doctrina de color aplicada — pendiente prueba end-to-end
* **ABASTECIMIENTO — INVENTARIOS:** ✅ Doctrina de color aplicada
* **COBRO:** ✅ CERRADO (etapa 1)
* **PRE-VENTA:** ✅ CERRADO
* **VENTAS:** 🔶 FormaVenta infraestructura completa — UX PresentacionSheet pendiente
* **COMPROBANTES / CLIENTES / REPORTES / OPERADORES / CONFIG:** ⬜

---

## CATÁLOGO FARMACIA — Estado consolidado al 25 Jun

### Modelo de vistas — panel derecho
El panel derecho ya no usa tabs. Usa un modelo de 4 vistas controladas por `VistaCatalogo`:

| Vista | Título headersheet | Descripción |
|---|---|---|
| `resumen` | `DATOS BÁSICOS PRODUCTO` | Vista de entrada al seleccionar producto. Resumen operacional + botones DETALLE / PRESENTACIONES / PRECIOS |
| `detalle` | `DETALLE PRODUCTO` | Datos completos + footer con CORREGIR / DESACTIVAR / IR A INGRESOS / LIMPIAR |
| `presentaciones` | `PRESENTACIONES PRODUCTO` | Formas de venta y nodos de fraccionamiento |
| `precios` | `PRECIOS PRODUCTO` | Valores operacionales por forma de venta |
| `corrigiendo` | `CORREGIR DATOS BÁSICOS PRODUCTO` | Formulario de corrección inline |
| `desactivando` | `DESACTIVAR PRODUCTO CATÁLOGO` | Confirmación de baja |
| `creandoAbierto` | `NUEVO PRODUCTO` | Stepper de creación |

### Vista RESUMEN — contenido canónico
**De DETALLE:** Condición de venta, Cadena de frío, Vencimiento/lote, Categoría, Estado registro sanitario
**De PRESENTACIONES:** Cantidad de presentaciones, nombre y stock mínimo de la primera
**De PRECIOS:** Texto referencial "Consultar precios en la vista Precios" (pendiente conectar valores reales)
**Botones superiores derechos:** DETALLE / PRESENTACIONES / PRECIOS — outline verde `border-[#45b356]/40`

### Navegación entre vistas
- Seleccionar producto → vista `resumen`
- Botones DETALLE / PRESENTACIONES / PRECIOS → navegan a su vista
- LIMPIAR desde cualquier vista → limpia selección y vuelve a BÚSQUEDA CATÁLOGO
- `onLimpiarDetalle` resetea `vistaActiva` a `'resumen'`
- `onSeleccionar` inicializa `vistaActiva` en `'resumen'`

### Keytips — COMPLETOS Y CANÓNICOS
| Botón | Archivo | Atajo | Dirección |
|---|---|---|---|
| × LIMPIAR (panel búsqueda) | CatalogoFarmaciaWorkspace | Esc | `-top-7` |
| + NUEVO PRODUCTO (panel búsqueda) | CatalogoFarmaciaWorkspace | Ctrl+Enter | `-top-7` |
| CORREGIR | DetalleProducto | Ctrl+Enter | `-bottom-7` |
| DESACTIVAR | DetalleProducto | Ctrl+Supr | `-bottom-7` |
| LIMPIAR (vista detalle) | DetalleProducto | Esc | `-bottom-7` |
| Ir a INGRESOS → | DetalleProducto | Ctrl+Insert | `-bottom-6` |

### Mapa de atajos teclado — CATÁLOGO
| Atajo | Acción |
|---|---|
| ↑↓ | Navegar resultados con preview |
| Enter | Confirmar producto seleccionado |
| ◄► | Navegar entre CORREGIR / DESACTIVAR / LIMPIAR |
| Escape (vista detalle) | Limpiar selección, volver a búsqueda |
| Escape (buscador) | Limpiar todo |
| Ctrl+Enter (vista detalle, ACTIVO) | Iniciar CORREGIR |
| Ctrl+Enter (sin producto seleccionado) | Abrir stepper NUEVO |
| Ctrl+Insert (vista detalle, ACTIVO) | Ir a INGRESOS |
| Ctrl+Supr (vista detalle, ACTIVO) | Activar modo DESACTIVAR |

### Búsqueda de productos — canónico
- Campos SQL: `nombre_comercial`, `ifa`, `nombre_fabricante`, `codigo_digemid`
- Límite: `LIMIT 12` en SQL (no slice en frontend)
- Debounce: 300ms
- Mínimo de caracteres: 2

### Archivos del módulo CATÁLOGO
| Archivo | Responsabilidad |
|---|---|
| `CatalogoFarmaciaWorkspace.tsx` | Layout dos paneles, título dinámico, coordinación |
| `hooks/useCatalogoFarmacia.ts` | Estado, navegación, búsqueda, handlers |
| `components/BuscadorProducto.tsx` | Lista de resultados, input, navegación teclado |
| `components/DetalleProducto.tsx` | 4 vistas + modos corrigiendo/desactivando |
| `components/NuevoProductoStepper.tsx` | Creación de producto paso a paso |

---

## SEMÁNTICA DE COLOR DE BOTONES — DOCTRINA GLOBAL IRREVOCABLE
Aprobada por Fernando — 24 Jun 2026.

| Patrón | Cuándo | Color |
|---|---|---|
| Outline verde | Iniciar acción nueva / navegar | `#45b356` / hover `#F2F7F3` |
| Sólido verde | Confirmar/cerrar acción iniciada | `bg-[#45b356]` texto blanco |
| Outline naranja | Salir / limpiar / cancelar reversible | `#f97316` / hover `#fff7ed` |
| Outline rojo | Cancelar dentro de flujo destructivo | `#dc2626` / hover `#fef2f2` |
| Sólido rojo | Confirmar acción irreversible | `bg-red-500` texto blanco |

**Estado deshabilitado canónico:** `disabled:opacity-50 disabled:cursor-not-allowed` — nunca gris genérico.

---

## SISTEMA DE INPUT SEMÁNTICO — DOCTRINA GLOBAL IRREVOCABLE
Aprobado por Fernando — 24 Jun 2026. Solo para botones de acción final.

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

## KEYTIPS — ESTÁNDAR CANÓNICO
- Elemento: `<kbd>`
- Comportamiento: `opacity-0 group-hover:opacity-100`
- Botón padre: `group relative`
- Posición por defecto: `absolute -top-7 left-1/2 -translate-x-1/2` (abre arriba)
- Posición alternativa: `absolute -bottom-7 left-1/2 -translate-x-1/2` (abre abajo — cuando el botón está en zona superior sin espacio libre encima)
- Posición link-text: `absolute -bottom-6 left-1/2 -translate-x-1/2`
- Estilo: `bg-[#fefce8] border border-[#fef08a] text-[#713f12] text-[9px] font-bold rounded px-1.5 py-0.5`
- Tamaño panel búsqueda (footer izquierdo): `text-[10px]`
- `pointer-events-none whitespace-nowrap z-10`
- Solo se agrega si el atajo está implementado

---

## CONVENCIÓN DE BOTONES — ESTÁNDAR CANÓNICO
- Texto en MAYÚSCULAS
- Par de panel de búsqueda: `flex-[1]` naranja / `flex-[2]` verde
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
| DetalleProducto.tsx | `onIrAResumen` aliasado como `_onIrAResumen` — sin uso interno | Baja |
| DetalleProducto.tsx | 600+ líneas — extraer PresentacionesTab y PreciosTab a archivos propios | Media |
| DetalleProducto.tsx | Vista PRECIOS en resumen muestra texto fijo — pendiente conectar valor real VENTA_NORMAL | Media |
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
| PreciosTab | Botones Guardar/Cancelar fuera de doctrina — usan azul en lugar de verde/naranja | Media |

---

## DOCTRINA DE CALIDAD — IRREVOCABLE

### CONVENCIÓN TAURI
**Todo argumento de invoke() TypeScript se envía SIEMPRE en camelCase.**

### LECCIONES APRENDIDAS
- **Subtabs:** todo prompt que agregue subtab debe tocar OperationalBar.tsx explícitamente
- **TypeScript:** `npx tsc --noEmit` desde `apps/vendor-desktop`, no raíz del repo
- **Migraciones ADD COLUMN:** verificar con `pragma_table_info` antes de ALTER TABLE
- **Seeds SQL:** en `.gitignore`. DB real: `disateq.db`
- **CURRENT_CONTEXT.md:** usar `filesystem:write_file` con parámetro `content` — `edit_file` falla
- **Prompts Codex:** lenguaje natural puro, sin bloques de código
- **Codex reenvío:** verificar filesystem si el reporte menciona archivos de entregas anteriores
- **Codex y npm run build:** reporta errores de compilación Rust como errores TypeScript — siempre verificar con `npx tsc --noEmit` independientemente
- **Claude no escribe código:** Claude genera prompts para Codex — nunca modifica archivos directamente
- **Contexto operacional de botones:** cada LIMPIAR opera solo en su panel
- **Botonería:** texto en MAYÚSCULAS, keytips flotantes solo si atajo implementado
- **Accent `#639922`:** eliminado — residuo del diseño anterior. Canónico ABASTECIMIENTO = `#0284C7`
- **Keytips dirección:** usar `-bottom-7` cuando el botón está en zona superior sin espacio libre encima
- **git commit -am:** incluye todos los archivos con cambios pendientes — verificar con `git diff HEAD~1 HEAD --name-only` si el conteo es mayor al esperado
- **VistaCatalogo:** el panel derecho de CATÁLOGO no usa tabs — usa vistas controladas por estado `VistaCatalogo`

---

## PRÓXIMA VENTANA DE TRABAJO

1. **Evaluación visual** — Panel derecho CATÁLOGO con las 4 vistas en la app
2. **Evaluación visual** — NuevoProductoStepper flujo completo
3. **Evaluación visual** — PROVEEDORES flujo completo
4. **INGRESOS** — prueba end-to-end
5. **Conectar `disateq:navegar`** — listener en OperationalBar
6. **OperationalBar** — corregir color `#3D8A8A` → `#0284C7`
7. **BoxSlotType → TipoCaja**
8. **Operador.codigo** — verificar y eliminar si huérfano

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
