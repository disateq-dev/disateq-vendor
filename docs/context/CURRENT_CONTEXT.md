# CURRENT CONTEXT — DISATEQ VENDOR™

## Branch & Commit
* **Branch:** `main`
* **Último commit:** `6b0f162` — refactor(catalogo): reorganizar formulario CORREGIR — orden por relevancia operacional, campos en grid, aviso historial en header

## Commits de la jornada 27 Jun
| Hash | Descripción |
|---|---|
| `6b0f162` | refactor(catalogo): reorganizar formulario CORREGIR — orden por relevancia operacional, campos en grid, aviso historial en header |
| `2d39fec` | fix(catalogo): Enter en CORREGIR/DESACTIVAR — bloquear intercepcion en BuscadorProducto y CatalogoFarmaciaWorkspace cuando hay producto confirmado |

## Commits de la jornada 26 Jun
| Hash | Descripción |
|---|---|
| `b3647b2` | fix(catalogo): LIMPIAR resumen conserva resultados via onLimpiarDetalle, Escape en detalle vuelve a resumen via onIrAResumen |
| `35c5008` | refactor(catalogo): LIMPIAR en CORREGIR/DESACTIVAR renombrado a VOLVER con onIrAResumen, LIMPIAR topbar detalle eliminado, indiceAccion cicla entre 2 botones |
| `6e6ee02` | feat(catalogo): navegacion flechas+Enter en botones DETALLE/PRESENTACIONES/PRECIOS, colores diferenciados violeta/cyan/ambar |
| `4689630` | fix(catalogo): renombrar DATOS BASICOS a RESUMEN DEL PRODUCTO, actualizar mensaje estado vacio |
| `494f29a` | fix(catalogo): LIMPIAR fijo en footer inferior datos basicos, sin linea divisoria, LIMPIAR busqueda desactivado al confirmar producto, keytips uniformes text-11px |
| `403e2e1` | fix(catalogo): detalle producto — acciones en topbar, Ir a INGRESOS debajo alineado derecha, footer navegacion PRESENTACIONES/PRECIOS/VOLVER |
| `ec715fc` | fix(catalogo): flechas y Enter restringidos a vistaActiva detalle, Alt+P renombrado a Alt+E, hover persistente boton DETALLE |
| `83a7efb` | chore: eliminar directorios fantasma apps/vendor-desktop/apps y src raiz, regla canonica de rutas |

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
* **ABASTECIMIENTO — CATÁLOGO:** 🔶 Evaluación visual en curso
  - RESUMEN DEL PRODUCTO ✅
  - DETALLE DEL PRODUCTO ✅ navegación teclado completa
  - CORREGIR DATOS BÁSICOS ✅ reorganizado por relevancia operacional — pendiente evaluación visual completa
  - ASIGNACIÓN PRESENTACIONES ⬜ pendiente evaluación visual
  - ASIGNACIÓN DE PRECIOS ⬜ pendiente evaluación visual
  - NuevoProductoStepper ⬜ pendiente evaluación visual
* **ABASTECIMIENTO — PROVEEDORES:** ✅ Doctrina de color aplicada — pendiente evaluación visual
* **ABASTECIMIENTO — INGRESOS:** ✅ Doctrina de color aplicada — pendiente prueba end-to-end
* **ABASTECIMIENTO — INVENTARIOS:** ✅ Doctrina de color aplicada
* **COBRO:** ✅ CERRADO (etapa 1)
* **PRE-VENTA:** ✅ CERRADO
* **VENTAS:** 🔶 FormaVenta infraestructura completa — UX PresentacionSheet pendiente
* **COMPROBANTES / CLIENTES / REPORTES / OPERADORES / CONFIG:** ⬜

---

## CATÁLOGO FARMACIA — Estado consolidado al 27 Jun

### Modelo de sheetworks — panel derecho — IRREVOCABLE

| Vista | Título headersheet | Topbar | Cuerpo | Footer |
|---|---|---|---|---|
| `resumen` | `RESUMEN DEL PRODUCTO` | Nombre+fabricante+fechas · Derecha: DETALLE/PRESENTACIONES/PRECIOS | Resumen DETALLE/PRESENTACIONES/PRECIOS | LIMPIAR fijo inferior derecha |
| `detalle` | `DETALLE DEL PRODUCTO` | Nombre+fabricante+fechas+badge · Derecha: CORREGIR/DESACTIVAR + Ir a INGRESOS debajo | Todos los datos del producto | PRESENTACIONES · PRECIOS · VOLVER |
| `presentaciones` | `ASIGNACIÓN PRESENTACIONES PRODUCTO` | Nombre + fabricante | Formas de venta y nodos | — |
| `precios` | `ASIGNACIÓN DE PRECIOS PRODUCTO` | Nombre + fabricante | Valores operacionales | — |
| `corrigiendo` | `CORREGIR DATOS BÁSICOS PRODUCTO` | — | Formulario corrección reorganizado | VOLVER · CANCELAR · GUARDAR CORRECCIÓN |
| `desactivando` | `DESACTIVAR PRODUCTO CATÁLOGO` | — | Confirmación baja | VOLVER · CANCELAR · CONFIRMAR BAJA |
| `creandoAbierto` | `NUEVO PRODUCTO` | — | Stepper creación | — |

### CORREGIR DATOS BÁSICOS — Orden de campos irrevocable (27 Jun)

| Fila | Campos | Editable |
|---|---|---|
| Header | Nombre · Fabricante · Fechas · Badge ACTIVO/INACTIVO · Aviso historial | No |
| 1 | ID PRODUCTO · CODIGO DIGEMID | No / ADMIN |
| 2 | NOMBRE COMERCIAL · IFA / PRINCIPIO ACTIVO | Sí / No |
| 3 | FABRICANTE / LABORATORIO | Sí |
| 4 | CONCENTRACION / DOSIS · FORMA FARMACEUTICA | No |
| 5 | CONDICION DE VENTA · REFRIGERAR · CON VENCIMIENTO | Solo lectura (operación especial futura) |
| 6 | REGISTRO SANITARIO · ESTADO DEL REGISTRO | ADMIN |

**País origen:** eliminado del formulario.
**Titular:** omitido — pendiente contraste con fuentes externas.
**Condiciones operacionales:** solo lectura con nota "requiere operación especial de corrección crítica".
**Registro sanitario:** campos bloqueados para no-ADMIN con aviso ámbar.
**Aviso historial:** integrado en header lado derecho, debajo del badge, texto abreviado.

### Semántica de navegación — IRREVOCABLE

| Acción | Handler | Resultado |
|---|---|---|
| × LIMPIAR panel búsqueda | `onLimpiar` | Limpia todo: término + resultados + producto |
| LIMPIAR footer RESUMEN | `onLimpiarDetalle` | Deselecciona producto, conserva resultados, reactiva ↑↓ |
| VOLVER footer DETALLE | `onIrAResumen` | Regresa a RESUMEN, producto sigue seleccionado |
| VOLVER en CORREGIR/DESACTIVAR | `onIrAResumen` + resetModo | Regresa a RESUMEN, cancela modo |
| Escape en `vistaActiva=detalle` | `onIrAResumen` | Regresa a RESUMEN |
| Escape en `vistaActiva=resumen` | `onLimpiar` | Limpia todo |
| Escape en `modo=corrigiendo` | resetModo lectura | Cancela corrección, permanece en DETALLE |
| Escape en `modo=desactivando` | resetModo lectura | Cancela desactivación, permanece en DETALLE |

### Botones navegadores RESUMEN DEL PRODUCTO — IRREVOCABLE
| Botón | Índice | Color | Fondo hover/activo |
|---|---|---|---|
| DETALLE | 0 | `#7C3AED` violeta | `#EDE9FE` |
| PRESENTACIONES | 1 | `#0891B2` cyan | `#ECFEFF` |
| PRECIOS | 2 | `#D97706` ámbar | `#FEF3C7` |

### Footer DETALLE DEL PRODUCTO — IRREVOCABLE
- Posición: `shrink-0 flex justify-end gap-2 px-5 pb-4` — fuera del área scrolleable
- Botones con `px-5`, sin `flex-[1]`, sin línea divisoria
- Condición: `vistaActiva === 'detalle' && modo === 'lectura'`

### indiceAccion en DETALLE DEL PRODUCTO — IRREVOCABLE
- Módulo 2: 0=CORREGIR · 1=DESACTIVAR
- ◄►: cicla · Enter: ejecuta acción del índice activo

### Mapa de atajos teclado — CATÁLOGO
| Atajo | Contexto | Acción |
|---|---|---|
| ↑↓ | Búsqueda | Navegar resultados |
| Enter | Búsqueda | Confirmar producto |
| Escape | Resumen/lectura | onLimpiar completo |
| Escape | Detalle/lectura | onIrAResumen |
| Escape | Corrigiendo | Cancelar corrección → lectura |
| Escape | Desactivando | Cancelar → lectura |
| Ctrl+Enter | Sin producto | Abrir stepper NUEVO |
| ◄► | Resumen | Ciclar DETALLE/PRESENTACIONES/PRECIOS |
| Enter | Resumen (índice≥0) | Navegar a sheetwork |
| Alt+D | Cualquier lectura | Ir a DETALLE |
| Alt+E | Cualquier lectura | Ir a PRESENTACIONES |
| Alt+R | Cualquier lectura | Ir a PRECIOS |
| ◄► | Detalle | Ciclar CORREGIR/DESACTIVAR |
| Enter | Detalle (índice≥0) | Ejecutar acción |
| Ctrl+Enter | Detalle ACTIVO | Iniciar CORREGIR |
| Ctrl+Insert | Detalle ACTIVO | Ir a INGRESOS |
| Ctrl+Supr | Detalle ACTIVO | Activar DESACTIVAR |

### Archivos del módulo CATÁLOGO
| Archivo | Responsabilidad |
|---|---|
| `CatalogoFarmaciaWorkspace.tsx` | Layout, título dinámico, coordinación |
| `hooks/useCatalogoFarmacia.ts` | Estado, navegación, búsqueda, handlers |
| `components/BuscadorProducto.tsx` | Lista resultados, input, navegación teclado |
| `components/DetalleProducto.tsx` | Todas las sheetworks autónomas |
| `components/NuevoProductoStepper.tsx` | Creación paso a paso |

### Lecciones aprendidas — teclado y UX
- Múltiples listeners de teclado: BuscadorProducto y CatalogoFarmaciaWorkspace deben inhibir ArrowDown/ArrowUp/Enter cuando hay producto confirmado — control exclusivo a DetalleProducto
- Footer fijo fuera del área scrolleable: cadena `shrink-0` obligatoria
- Aviso historial integrado en header en lugar de banner separado — más limpio y no ocupa espacio vertical

---

## DISEÑO PENDIENTE — LÍNEAS DE LABORATORIO

Concepto identificado: un laboratorio/fabricante organiza su portafolio en **líneas** (ej. Línea Analgésicos, Línea Antibióticos, Línea Pediátricos).

**Relevancia operacional:**
- Abastecimiento: negociar pedidos por línea con el distribuidor
- Catálogo: filtrar por línea del laboratorio
- Reportes: consumo y rotación por línea
- Ventas: identificar sustitutos dentro de la misma línea

**Decisión diferida:** puede implementarse como tabla maestra de líneas por laboratorio (para establecimientos maduros con reportes) o como texto libre asignable al registrar el producto (para establecimientos pequeños). Ambas formas son válidas.

**Impacto:** requiere campo nuevo en `ProductoComercial` (`lineaLaboratorio`) y posiblemente tabla maestra `lineas_laboratorio`. Se diseñará cuando se retome el módulo de registro de productos.

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
| Violeta `#7C3AED` | Navegador DETALLE (caso especial CATÁLOGO) | `#EDE9FE` |
| Cyan `#0891B2` | Navegador PRESENTACIONES (caso especial CATÁLOGO) | `#ECFEFF` |
| Ámbar `#D97706` | Navegador PRECIOS (caso especial CATÁLOGO) | `#FEF3C7` |

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
- Texto en MAYÚSCULAS · `py-2 text-[12px]` en botones de acción
- Par panel búsqueda: `flex-[1]` naranja / `flex-[2]` verde
- Footer sheetwork DETALLE: `px-5` por botón, `justify-end`
- LIMPIAR opera solo en su panel

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
| DetalleProducto.tsx | 1000+ líneas — extraer PresentacionesTab y PreciosTab a archivos propios | Media |
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
| ProductoComercial | Campo `lineaLaboratorio` pendiente de diseño y migración | Pendiente decisión |
| CORREGIR | Condiciones operacionales (condicionVenta, requiereLote, requiereCadenaFrio) — solo lectura por ahora, requieren operación especial futura | Media |
| CORREGIR | Fabricante/Titular — contraste con fuentes externas pendiente para definir si Titular es relevante | Baja |

---

## DOCTRINA DE CALIDAD — IRREVOCABLE

### CONVENCIÓN TAURI
**Todo argumento de invoke() TypeScript se envía SIEMPRE en camelCase.**

### LECCIONES APRENDIDAS
- **TypeScript:** `npx tsc --noEmit` desde `apps\vendor-desktop`, no raíz del repo
- **CURRENT_CONTEXT.md:** usar `filesystem:write_file` con parámetro `content`
- **Prompts Codex:** lenguaje natural puro, sin bloques de código
- **Claude no escribe código:** nunca modifica archivos directamente
- **Keytips canónicos:** `text-[11px] px-2 py-1` · contenedor: `overflow-visible`
- **Footer fijo:** cadena flex completa — wrapper `flex-1 min-h-0 flex flex-col` → section `flex min-h-0 flex-1 flex-col` → área scroll `overflow-auto flex-1` → footer `shrink-0`
- **onLimpiar vs onLimpiarDetalle:** onLimpiar = limpia todo / onLimpiarDetalle = deselecciona producto conservando resultados
- **Escape contextual:** en detalle → onIrAResumen / en resumen → onLimpiar / en corrigiendo/desactivando → resetModo
- **Intercepción de teclado — múltiples listeners:** con producto confirmado, BuscadorProducto y CatalogoFarmaciaWorkspace deben inhibir ArrowDown/ArrowUp/Enter completamente
- **Backend modificarProductoComercial:** solo soporta nombreComercial, nombreFabricante, nombreTitular, paisOrigen, registroSanitario, estadoRegistroSanitario, codigoDIGEMID — condicionVenta/requiereLote/requiereCadenaFrio NO están en el comando Rust

---

## PRÓXIMA VENTANA DE TRABAJO

1. **Evaluación visual** — CORREGIR DATOS BÁSICOS completa en UI
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
