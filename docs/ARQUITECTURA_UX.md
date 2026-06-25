# ARQUITECTURA UX — DISATEQ VENDOR™

## Estado del documento

Documento autoridad. Creado 21-jun-2026. Última actualización 24-jun-2026.

Reemplaza tres documentos que describían una jerarquía conceptual nunca
implementada: `03-arquitectura/arquitectura.md`,
`design-system/operational-visual-architecture.md`,
`design-system/uix-design-system-foundations.md`. Esos tres quedaron
obsoletos — archivados en `docs/_obsoleto/` (ver `docs/_obsoleto/README.md`),
no eliminados.

Todo lo descrito aquí está verificado contra código real
(`apps/vendor-desktop/src`) al 21-jun-2026, no contra intención de diseño.
Si el repo diverge de este documento en el futuro, el repo manda — se
actualiza este documento, no al revés.

---

## Jerarquía real del runtime

```
Topbar          — real
ContextBar      — real
Workspace       — real (CashWorkspace, SalesWorkspace, PreVentaWorkspace,
                  ComprobantesWorkspace, ConfigWorkspace, InventoryWorkspace,
                  PurchasesWorkspace, + workspaces de ABASTECIMIENTO FARMACIA)
  └── SheetWork — real, pero NO universal: lo usa quien lo necesita
SubContextBar   — NO EXISTE como entidad unificada
Footbar         — NO EXISTE como entidad unificada
```

`Topbar` y `ContextBar` son reales y operan como se documentó originalmente.

`SubContextBar` y `Footbar` fueron diseñados conceptualmente en una fase
temprana del proyecto y nunca se implementaron como componentes. Verificado
dos veces — `directory_tree` completo y `search_files` por patrón exacto
sobre `apps/vendor-desktop/src` — sin resultados en ningún caso. Los
módulos existentes resuelven navegación secundaria y cierre de pantalla con
patrones propios, sin esta capa.

**Corrección de precisión (auditoría 21-jun-2026, post-creación):** la cifra
"nueve módulos" citada en `BITACORA_HISTORICA.md` y heredada aquí cuenta
dominios de alto nivel, no archivos. El conteo real de archivos
`*Workspace.tsx` es **20**, repartidos en 8 dominios con Workspace propio
(`cash` solo ya tiene 6: `CashWorkspace`, `CajasWorkspace`,
`CorregirArqueoWorkspace`, `OperadoresWorkspace`, `RolesWorkspace`,
`SupervisionCajaWorkspace`). El conteo de *dominios* tampoco es 9 sino 8
(abastecimiento/farmacia, cash, comprobantes, config, inventory, preventa,
purchases, sales). Ninguna de estas dos correcciones cambia la conclusión —
sigue sin existir un solo archivo `SubContextBar`/`Footbar` — pero la cifra
"9" no debe repetirse como dato preciso en trabajo futuro.

**Esto es una decisión consolidada, no un hallazgo pendiente.** Múltiples
módulos construidos de forma independiente, por sesiones distintas, llegaron
al mismo patrón sin coordinarse — es evidencia fuerte de que `SubContextBar`
y `Footbar` como entidad unificada no responden a una necesidad operacional
real. No reabrir esta decisión sin un caso de uso concreto que la otra
arquitectura no resuelva.

---

## SheetWork — componente real

**Ubicación:** `apps/vendor-desktop/src/components/sheet/`
**Exporta:** `SheetWork`, `SheetHeader`, `SheetBody`, `SheetFooter`

### Qué es

Chrome visual reutilizable para superficies operacionales que necesitan
convivir o reemplazarse en el mismo lugar dentro de un Workspace — el
problema real que originó SheetWork ya estaba resuelto dos veces en VENTAS
antes de que existiera el componente (swap `PreVentaGrid`/`CobroPanel` en
`PreVentaWorkspace.tsx`; swap interno `main`/`client`/confirmación dentro de
`CobroPanel.tsx`). SheetWork formaliza ese chrome, no inventa el patrón.

### Qué NO es

No gestiona qué vista está activa. No anima transiciones. No impone
estructura interna (Sections/Blocks es libre, decide cada módulo). El estado
de swapeo sigue siendo responsabilidad de cada módulo consumidor —
exactamente como funcionaba antes de que el componente existiera.

### Contrato

**`SheetWork`** — `{ accent: string (hex), children, className? }`
Contenedor `<section>`: bordes redondeados 28px, fondo `#FDFCF9`, borde
teñido al 40% de opacidad del `accent`.

**`SheetHeader`** — `{ icon: LucideIcon, label: string, accent: string, right?: ReactNode }`
Barra de 42px de alto. Fondo = `tint(accent)` (mezcla del accent hacia
blanco — fórmula calibrada por reconstrucción inversa contra el valor
original `#45b356`→`#F2F7F3`; no validada visualmente para otros accents
distintos de VENTAS). Borde inferior = `accent` al 20% de opacidad. Ícono +
label en mayúsculas, semibold.

**`SheetBody`** — `{ children, className? }`
`flex-1 overflow-y-auto`. Sin lógica propia.

**`SheetFooter`** — `{ children, className? }`
Borde superior + padding. Sin lógica propia.

### Caso de uso real — única referencia a la fecha

`apps/vendor-desktop/src/modules/preventa/CobroPanel.tsx`. Patrón
verificado en código:

```tsx
<SheetWork accent="#45b356">
  {vistaActiva === "main" && estadoConfirmacion === null && (
    <SheetHeader icon={Receipt} label="COBRO" accent="#45b356" />
  )}
  {/* contenido condicional por vista: confirmación / main / cliente */}
  <SheetBody className="...">...</SheetBody>
  {vistaActiva === "main" && estadoConfirmacion === null && (
    <SheetFooter>...</SheetFooter>
  )}
</SheetWork>
```

El swap entre vistas (`main`/`client`/confirmación) ocurre por estado React
local del propio `CobroPanel`, montando/desmontando contenido dentro del
mismo `SheetWork` — no hay API de SheetWork para esto.

---

## Color por módulo

**VENTAS / COBRO: `#45b356` (verde), vía SheetWork.** Verificado en
`CobroPanel.tsx` (prop `accent`, dos usos).

**Hallazgo de auditoría (21-jun-2026): el marco "un accent por módulo" no
aplica a los módulos que no usan SheetWork.** Verificado leyendo
`CashWorkspace.tsx`, `ComprobantesWorkspace.tsx`, `ConfigWorkspace.tsx` y
`CatalogoFarmaciaWorkspace.tsx` completos: ninguno importa ni usa
`SheetWork`/`SheetHeader` — cada uno construye su propio chrome con un
color de borde/encabezado fijo en Tailwind arbitrario, no como prop
reutilizable.

---

## Semántica de color de botones — DOCTRINA GLOBAL IRREVOCABLE

**Aprobada por Fernando — 24-jun-2026. Aplica a todo DISATEQ Vendor sin excepción.**

El color no es decoración — comunica acción operacional. El operador lee el
color antes de leer el texto. Esta semántica debe mantenerse consistente en
todos los módulos para que el operador construya el reflejo correcto.

| Patrón | Cuándo usar | Color | Valores Tailwind |
|---|---|---|---|
| **Outline verde** | Iniciar una acción nueva | Verde | `border-[#45b356]/40 text-[#45b356] hover:bg-[#F2F7F3]` |
| **Sólido verde** | Confirmar / cerrar una acción ya iniciada | Verde relleno | `bg-[#45b356] text-white hover:bg-[#3a9e4a]` |
| **Outline naranja** | Salir / limpiar / cancelar **reversible** | Naranja | `border-[#f97316]/40 text-[#f97316] hover:bg-[#fff7ed]` |
| **Outline rojo** | Cancelar dentro de un flujo destructivo | Rojo | `border-[#dc2626]/40 text-[#dc2626] hover:bg-[#fef2f2]` |
| **Sólido rojo** | Confirmar acción **irreversible** / destructiva | Rojo relleno | `bg-red-500 text-white` |

### Regla naranja vs rojo — distinción crítica

**Naranja** = el operador puede volver. No hay consecuencias persistentes.
Ejemplos: `× LIMPIAR`, `× CANCELAR` al salir de un stepper sin datos.

**Rojo outline** = cancelar dentro de un flujo que ya tiene consecuencias
potenciales o que el sistema considera sensible.
Ejemplos: `CANCELAR` dentro del formulario CORREGIR, `CANCELAR` dentro del
formulario DESACTIVAR.

**Rojo sólido** = la acción es irreversible una vez ejecutada. El sistema
no puede deshacer automáticamente.
Ejemplos: `CONFIRMAR BAJA`, `ELIMINAR`.

### Ejemplos verificados en código (24-jun-2026)

| Botón | Archivo | Patrón |
|---|---|---|
| `× LIMPIAR` | CatalogoFarmaciaWorkspace.tsx | Outline naranja |
| `+ NUEVO PRODUCTO` | CatalogoFarmaciaWorkspace.tsx | Outline verde |
| `CORREGIR` | DetalleProducto.tsx | Outline verde |
| `DESACTIVAR` | DetalleProducto.tsx | Outline rojo |
| `LIMPIAR` (detalle) | DetalleProducto.tsx | Outline naranja |
| `CANCELAR` (formulario corregir) | DetalleProducto.tsx | Outline rojo |
| `GUARDAR CORRECCIÓN` | DetalleProducto.tsx | Sólido verde |
| `CANCELAR` (formulario desactivar) | DetalleProducto.tsx | Outline rojo |
| `CONFIRMAR BAJA` | DetalleProducto.tsx | Sólido rojo |
| `REACTIVAR` | DetalleProducto.tsx | Sólido verde |

### Semántica de color de estado operacional (rescatada de `00-governance/reglas.md`)

Complementaria a la semántica de botones — aplica a badges, indicadores y
estados en listas y paneles, no a botones de acción:

| Color | Significado de estado |
|---|---|
| Verde | Activo / confirmado / continuar |
| Rojo | Cerrado / inactivo / irreversible |
| Ámbar | Advertencia / requiere revisión |
| Azul / navy | Navegación / contexto / información |

---

## Sistema de input semántico — DOCTRINA GLOBAL IRREVOCABLE

**Aprobado por Fernando — 24-jun-2026.**

### Principio fundamental

No es solo una convención de colores. Es un lenguaje de teclado operacional
donde cada modificador tiene un peso semántico fijo, independiente de la
tecla base. El operador aprende una sola regla visual: más denso = más
definitivo.

**Alcance:** aplica exclusivamente a botones de acción final
(GUARDAR, CONFIRMAR, CONCRETAR, ELIMINAR, DAR DE BAJA y equivalentes).
No aplica a botones de navegación, creación, ni formularios intermedios.

---

### Semántica de modificadores

| Modificador | Semántica | Peso visual |
|---|---|---|
| Sin modificador | Acción directa e irreversible | Máximo — sólido total |
| `Ctrl+` | Acción con contexto adicional | Alto — borde denso + fondo semidenso |
| `Shift+` | Acción con reserva o parcial | Medio — borde denso + fondo atenuado |
| `Alt+` | Acción mínima / registrar sin comprometer | Bajo — borde denso + fondo blanco |

La tecla base define **qué tipo** de acción.
El modificador define **cuánto** de esa acción.

---

### Familia ENTER — acciones de avance / confirmación

Verde como color semántico. Densidad decrece con el modificador.

| Atajo | Visual | Descripción | Tailwind |
|---|---|---|---|
| `Enter` | Sólido verde total | Confirmar sin retorno — nivel máximo | `bg-[#45b356] text-white` |
| `Ctrl+Enter` | Borde verde denso + fondo verde semidenso | Confirmar con contexto adicional | `border-[#45b356] bg-[#45b356]/20 text-[#45b356]` |
| `Shift+Enter` | Borde verde denso + fondo verde atenuado | Avanzar con reserva | `border-[#45b356] bg-[#45b356]/10 text-[#45b356]` |
| `Alt+Enter` | Borde verde denso + fondo blanco | Registrar sin comprometer | `border-[#45b356] bg-white text-[#45b356]` |

---

### Familia DELETE — acciones de retroceso / eliminación

Rojo como color semántico. Densidad decrece con el modificador.

| Atajo | Visual | Descripción | Tailwind |
|---|---|---|---|
| `Delete` | Sólido rojo total | Eliminar de forma irreversible — nivel máximo | `bg-red-500 text-white` |
| `Ctrl+Delete` | Borde rojo denso + fondo rojo semidenso | Borrar o limpiar con contexto | `border-[#dc2626] bg-[#dc2626]/20 text-[#dc2626]` |
| `Shift+Delete` | Borde rojo denso + fondo rojo atenuado | Eliminar parcialmente o con reserva | `border-[#dc2626] bg-[#dc2626]/10 text-[#dc2626]` |
| `Alt+Delete` | Borde rojo denso + fondo blanco | Marcar para eliminación sin ejecutar | `border-[#dc2626] bg-white text-[#dc2626]` |

---

### Estado deshabilitado — regla canónica

**`disabled:opacity-50`** aplicado sobre el color original del botón.

El botón deshabilitado conserva su color semántico al 50% de opacidad.
El operador sabe que ese botón existe y haría algo, pero no puede ejecutarse
ahora. Es más informativo que convertirlo en gris genérico, que borra la
semántica completamente.

No usar `opacity-25` ni `opacity-40` — quedan demasiado invisibles.
No usar `opacity-75` ni superior — no comunica claramente que está inactivo.
`opacity-50` es el valor canónico único.

**Aplicación en código:**
```
disabled:opacity-50 disabled:cursor-not-allowed
```

---

## Convención de botones de acción — ESTÁNDAR CANÓNICO

**Aprobado por Fernando — 24-jun-2026.**

### Texto
- Siempre en MAYÚSCULAS
- Sin variantes de texto condicionales salvo justificación explícita

### Keytips flotantes
- Implementados con `<kbd>` — elemento HTML semánticamente correcto
- Visibles solo al hacer hover (`opacity-0 group-hover:opacity-100`)
- Posición: flotando encima del botón (`absolute -top-7`)
- Centrados horizontalmente (`left-1/2 -translate-x-1/2`)
- Estilo: `bg-[#fefce8] border border-[#fef08a] text-[#713f12] text-[9px] font-bold`
- El botón debe tener `group relative` para activar el mecanismo
- `pointer-events-none` en el `<kbd>` para no interferir con el cursor
- `whitespace-nowrap` para evitar saltos de línea en atajos compuestos

### Restricciones absolutas al modificar botones
- **Nunca tocar** `py-` (altura)
- **Nunca tocar** `text-[Npx]` del label (tipografía)
- **Nunca tocar** `size=` ni `strokeWidth` de íconos
- Sí se puede ajustar `px-` (ancho) cuando el layout lo requiera

### Par de botones de panel de búsqueda
Patrón estándar para el fondo del panel izquierdo de cualquier workspace
con búsqueda. Proporciones `flex-[1]` izquierdo / `flex-[2]` derecho.

```
[× LIMPIAR] [+ NUEVO PRODUCTO]
  naranja     verde outline
  flex-[1]    flex-[2]
```

- Ambos se ocultan cuando el stepper de creación está abierto
- Botón izquierdo: `disabled` cuando no hay término ni resultados
- Botón izquierdo: opera **solo** en su panel — nunca invade el contexto del panel derecho
- Cada panel tiene su propio LIMPIAR con su propia responsabilidad

---

## SheetHeader — composición canónica

**Regla confirmada por Fernando (23-jun-2026):**

La composición estándar e irrevocable del `SheetHeader` es **ícono + texto**,
nada más. No se agrega ningún elemento adicional por defecto.

La prop `right?: ReactNode` se mantiene en el contrato del componente
exclusivamente como válvula de escape para casos extremos futuros. Su uso
no es rutinario — requiere justificación explícita y aprobación del Director
de Producto antes de implementarse. No debe proponerse como solución de
diseño en ningún flujo ordinario.

**Regla de revisión:** si alguien propone colocar un badge, estado, contador
ou otro elemento en el `SheetHeader`, la respuesta por defecto es no. La
carga de la prueba recae en quien propone, no en quien rechaza.

---

## Iconografía — librería y tamaño canónico

**Librería canónica:** Lucide React — irrevocable mientras no se decida
migración explícita.

**Tamaño canónico de íconos en ContextBar (módulos):** `size={17}`.
El ícono debe ser perceptiblemente más grande que el texto que acompaña
(`text-[14.5px]`) para cumplir su función de anclaje visual rápido, sin
llegar a contrastar agresivamente. La relación ícono/texto correcta es
que destaque sin dominar.

**Tamaño de íconos en SheetHeader:** `size={13}`, `strokeWidth={2}` —
ya establecido y correcto. No modificar.

**Regla general:** el ícono acompaña al texto, nunca lo reemplaza en
contextos operacionales con etiqueta visible. En contextos sin etiqueta
(botones icon-only), el tamaño se define caso a caso con aprobación.

---

## Mapa de color canónico por módulo

Fuente de verdad para accent colors. Verificado contra código real
(23-jun-2026). Cualquier divergencia entre este mapa y el código
implica que el código está desactualizado — corregir el código.

| Módulo | Accent | Nota |
|---|---|---|
| TURNO / CAJA | `#2A7CA8` | Azul petróleo |
| VENTAS | `#45b356` | Verde |
| ABASTECIMIENTO | `#0284C7` | Azul sky-600 — canónico desde 22-jun-2026 |
| COMPROBANTES | `#C05050` | Terracota |
| AJUSTES / CONFIG | `#697387` | Gris azulado |
| CLIENTES | `#1e7e4f` | Verde oscuro |
| REPORTES | `#2154d8` | Azul índigo |

**Nota ABASTECIMIENTO:** el color `#3D8A8A` (teal) que aparece en
`OperationalBar.tsx` es un residuo del diseño anterior — no es el color
canónico. Debe corregirse a `#0284C7` en todos los mapas del componente
(`MOD_ON`, `PILL_ON`, `NAV_FOCUS`, `PILL_OFF`). Corrección pendiente
en prompt a Codex (23-jun-2026).

---

## Nota de archivo

`03-arquitectura/arquitectura.md`, `design-system/operational-visual-architecture.md`
y `design-system/uix-design-system-foundations.md` quedaron **obsoletos**
desde este documento. Decisión de Fernando (21-jun-2026): archivados, no
eliminados — movidos a `docs/_obsoleto/` (ver `docs/_obsoleto/README.md`).
No forman parte del flujo de información activo; no se leen por defecto ni
se citan como vigentes.
