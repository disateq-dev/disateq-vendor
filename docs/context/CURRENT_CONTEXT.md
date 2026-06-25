# CURRENT CONTEXT — DISATEQ VENDOR™

## Branch & Commit
* **Branch:** `main`
* **Último commit:** `3651038` — fix(abastecimiento): doctrina de color aplicada — accent #0284C7, semantica verde/naranja/rojo en todos los workspaces y subcomponentes

## Commits de la jornada 24 Jun
| Hash | Descripción |
|---|---|
| `3651038` | fix(abastecimiento): doctrina color — accent #0284C7, semántica verde/naranja/rojo todo ABASTECIMIENTO |
| `22804b2` | feat(ux): keytips flotantes hover en botones, cursor pointer global |
| `f98968b` | fix(catalogo): tipografia resultados reducida, padding botones ajustado |
| anterior | fix(catalogo): LIMPIAR panel busqueda opera solo en su contexto |
| anterior | feat(catalogo): semantica color canónica, hints teclado, Ctrl+Supr para desactivar |
| `a212cca` | feat(catalogo): boton NUEVO siempre visible Ctrl+Enter, similitud debounced paso 2 MEDICAMENTO |

---

## Recorrido de Dominios (Matriz de Estado)
* **LOGIN:** ✅
* **TURNO / CAJA:** ✅
* **ABASTECIMIENTO — CATÁLOGO:** ✅ Sprint completo cerrado + doctrina de color aplicada
* **ABASTECIMIENTO — PROVEEDORES:** ✅ Doctrina de color aplicada — pendiente evaluación visual
* **ABASTECIMIENTO — INGRESOS:** ✅ Doctrina de color aplicada — pendiente prueba end-to-end
* **ABASTECIMIENTO — INVENTARIOS:** ✅ Doctrina de color aplicada
* **COBRO:** ✅ CERRADO (etapa 1)
* **PRE-VENTA:** ✅ CERRADO
* **VENTAS:** 🔶 FormaVenta infraestructura completa — UX PresentacionSheet pendiente
* **COMPROBANTES / CLIENTES / REPORTES / OPERADORES / CONFIG:** ⬜

---

## SEMÁNTICA DE COLOR DE BOTONES — DOCTRINA GLOBAL IRREVOCABLE
Aprobada por Fernando — 24 Jun 2026. Aplica a todo DISATEQ Vendor.

| Patrón | Cuándo | Color | Hex |
|---|---|---|---|
| Outline verde | Iniciar acción nueva | Verde | `#45b356` / hover `#F2F7F3` |
| Sólido verde | Confirmar/cerrar acción iniciada | Verde relleno | `bg-[#45b356]` texto blanco |
| Outline naranja | Salir / limpiar / cancelar **reversible** | Naranja | `#f97316` / hover `#fff7ed` |
| Outline rojo | Cancelar dentro de flujo destructivo | Rojo | `#dc2626` / hover `#fef2f2` |
| Sólido rojo | Confirmar acción **irreversible**/destructiva | Rojo relleno | `bg-red-500` texto blanco |

### Regla naranja vs rojo
- **Naranja** = puedes volver. No hay consecuencias. Ej: LIMPIAR, × LIMPIAR, Cancelar sin datos
- **Rojo outline** = cancelar dentro de flujo con consecuencias. Ej: CANCELAR en CORREGIR, CANCELAR en DESACTIVAR
- **Rojo sólido** = irreversible confirmada. Ej: CONFIRMAR BAJA

### Estado deshabilitado — canónico
`disabled:opacity-50 disabled:cursor-not-allowed` — conserva color semántico al 50%. Nunca gris genérico.

---

## SISTEMA DE INPUT SEMÁNTICO — DOCTRINA GLOBAL IRREVOCABLE
Aprobado por Fernando — 24 Jun 2026. Solo para botones de acción final.

### Familia ENTER — avance / confirmación
| Atajo | Visual | Tailwind |
|---|---|---|
| `Enter` | Sólido verde total | `bg-[#45b356] text-white` |
| `Ctrl+Enter` | Borde + fondo verde semidenso | `border-[#45b356] bg-[#45b356]/20 text-[#45b356]` |
| `Shift+Enter` | Borde + fondo verde atenuado | `border-[#45b356] bg-[#45b356]/10 text-[#45b356]` |
| `Alt+Enter` | Borde verde + fondo blanco | `border-[#45b356] bg-white text-[#45b356]` |

### Familia DELETE — retroceso / eliminación
| Atajo | Visual | Tailwind |
|---|---|---|
| `Delete` | Sólido rojo total | `bg-red-500 text-white` |
| `Ctrl+Delete` | Borde + fondo rojo semidenso | `border-[#dc2626] bg-[#dc2626]/20 text-[#dc2626]` |
| `Shift+Delete` | Borde + fondo rojo atenuado | `border-[#dc2626] bg-[#dc2626]/10 text-[#dc2626]` |
| `Alt+Delete` | Borde rojo + fondo blanco | `border-[#dc2626] bg-white text-[#dc2626]` |

---

## KEYTIPS — ESTÁNDAR CANÓNICO
- Elemento: `<kbd>` (semánticamente correcto para atajos)
- Comportamiento: flotante, visible solo al hover (`opacity-0 group-hover:opacity-100`)
- Posición: `absolute -top-7 left-1/2 -translate-x-1/2`
- Estilo: `bg-[#fefce8] border border-[#fef08a] text-[#713f12] text-[9px] font-bold rounded px-1.5 py-0.5`
- Botón padre: debe tener `group relative`
- `pointer-events-none whitespace-nowrap z-10` en el `<kbd>`
- Solo se agrega keytip si el atajo está implementado — nunca hints falsos

---

## CONVENCIÓN DE BOTONES — ESTÁNDAR CANÓNICO
- Texto siempre en MAYÚSCULAS
- No tocar `py-`, `text-[Npx]` de labels, ni `size=` de íconos
- Par de panel de búsqueda: `flex-[1]` naranja izquierdo / `flex-[2]` verde derecho
- Cada LIMPIAR opera solo en su panel — nunca invade contexto ajeno
- Cursor pointer global vía `index.css`

---

## CATÁLOGO FARMACIA — Estado consolidado al 24 Jun

### Navegación teclado — COMPLETA
| Atajo | Acción |
|---|---|
| ↑↓ | Navegar resultados con preview |
| Enter | Confirmar producto seleccionado |
| ◄► | Navegar entre CORREGIR / DESACTIVAR / LIMPIAR |
| Escape (detalle) | Limpiar selección, conservar búsqueda |
| Escape (buscador) | Limpiar todo |
| Ctrl+Enter (detalle) | Ir a INGRESOS |
| Ctrl+Enter (sin detalle) | Abrir stepper NUEVO |
| Ctrl+Supr | Activar modo DESACTIVAR |

### Tres Entregas — COMPLETAS
- **A:** TipoRecursoOperacional, CategoriaGeneral, ProductoGeneral, etiquetas-ui.ts
- **B:** NuevoProductoStepper rediseñado — paso 0 tipo recurso, 4 pasos MEDICAMENTO, búsqueda similitud debounced
- **C:** DetalleProducto con 4 secciones en orden de prioridad operacional, formulario CORREGIR canónico

### Dos niveles de Escape — canónico
| Desde | Resultado |
|---|---|
| DetalleProducto modo lectura | Limpia selección, conserva término y resultados |
| Input buscador | Limpia todo |

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

**Nota:** `#639922` verde oliva eliminado de todo ABASTECIMIENTO FARMACIA en commit `3651038`.

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
| DetalleProducto.tsx | `onVolver` declarado pero no usado | Baja |
| DetalleProducto.tsx | 600+ líneas — extraer PresentacionesTab y PreciosTab | Media |
| NuevoProductoStepper.tsx | extraer pasos en componentes | Media |
| OperationalBar.tsx | Doble llamada a usePOS() | Baja |
| OperationalBar.tsx | Listener `disateq:navegar` pendiente | Media |
| OperationalBar.tsx | Color `#3D8A8A` teal residual → corregir a `#0284C7` | Media |
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
- **Subtabs:** todo prompt que agregue subtab debe tocar OperationalBar.tsx explícitamente
- **TypeScript:** `npx tsc --noEmit` desde `apps/vendor-desktop`, no raíz del repo
- **Migraciones ADD COLUMN:** verificar con `pragma_table_info` antes de ALTER TABLE
- **Seeds SQL:** en `.gitignore`. DB real: `disateq.db`
- **CURRENT_CONTEXT.md:** usar `filesystem:write_file` — `edit_file` falla
- **Prompts Codex:** lenguaje natural puro, sin bloques de código
- **Codex reenvío:** verificar filesystem si el reporte menciona archivos de entregas anteriores
- **Claude no escribe código:** Claude genera prompts para Codex — nunca modifica archivos directamente
- **Contexto operacional de botones:** cada LIMPIAR opera solo en su panel
- **Botonería:** texto en MAYÚSCULAS, keytips flotantes solo si atajo implementado, no tocar py- ni text-size ni iconos
- **Accent `#639922`:** eliminado — residuo del diseño anterior. Canónico ABASTECIMIENTO = `#0284C7`

---

## PRÓXIMA VENTANA DE TRABAJO

1. **Evaluación visual** — NuevoProductoStepper flujo completo (paso 0 + 4 pasos MEDICAMENTO)
2. **Evaluación visual** — PROVEEDORES flujo completo
3. **INGRESOS** — prueba end-to-end
4. **Conectar `disateq:navegar`** — listener en OperationalBar
5. **OperationalBar** — corregir color `#3D8A8A` → `#0284C7`
6. **BoxSlotType → TipoCaja**
7. **Operador.codigo** — verificar y eliminar si huérfano

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
