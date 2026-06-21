# ARQUITECTURA UX — DISATEQ VENDOR™

## Estado del documento

Documento autoridad. Creado 21-jun-2026.

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

### Decisión pendiente activa

Adopción en ABASTECIMIENTO FARMACIA — ver `docs/context/CURRENT_CONTEXT.md`
→ Próxima ventana de trabajo, punto 2. No se repite aquí para evitar
duplicar el mismo problema que originó este documento.

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
reutilizable. Valores reales encontrados:

| Módulo | Color real | Mecanismo |
|---|---|---|
| VENTAS / COBRO | `#45b356` (verde) | Prop `accent` de SheetWork |
| TURNO / CAJA | `#2A7CA8` (azul-petróleo) en bordes y headers; botones de acción positiva reutilizan `#45b356`, cierre/peligro usa `#dc2626`/`#b91c1c` | Hardcodeado, sin SheetWork — no es un accent único, son varios colores semánticos por acción |
| COMPROBANTES | `#C05050` (terracota) | Hardcodeado, sin SheetWork |
| AJUSTES / CONFIG | `#697387` (gris azulado) | Hardcodeado, sin SheetWork |
| FARMACIA (Catálogo, verificado) | `#639922` (verde oliva) | Hardcodeado, sin SheetWork — header propio de 64px, no el SheetHeader de 42px |

Los valores de `design-system/colors.md` para VENTAS (`#F2A900`) y de
`visual-philosophy.md` ("azul operacional") quedan invalidados por código
real en los dos casos verificados. TURNO en `colors.md` (`#78C487`) tampoco
coincide con el `#2A7CA8` real encontrado — ese documento no debe
consultarse como fuente de color, está archivado en `docs/_obsoleto/`.

Proveedores e Ingresos (las otras dos workspaces de FARMACIA), Sales,
PreVenta, Inventory y Purchases no se verificaron en esta sesión — pendiente
de auditoría puntual si se necesita su color exacto.

### Semántica de color (rescatada de `00-governance/reglas.md`, auditoría 21-jun-2026)

Esta regla no estaba en ninguno de los 3 documentos que este archivo
reemplaza, pero sí en uno de los 19 que reemplaza `DOCTRINA.md`. Pertenece
aquí, no allá, porque es regla de color, no de doctrina de producto.
El color no es decoración — comunica estado operacional:

| Color | Significado |
|---|---|
| Verde | Confirmar / continuar |
| Rojo | Cerrar / acción irreversible |
| Ámbar | Advertencia / revisión |
| Azul / navy | Navegación / contexto |

Consistente con lo verificado en código: `CashWorkspace.tsx` usa rojo
(`#dc2626`/`#b91c1c`) exclusivamente para cierre de turno (irreversible) y
verde para confirmaciones; `ComprobantesWorkspace.tsx` usa ámbar para
"REFERENCIADO" (estado de revisión) y rojo para "ANULADO". No se auditó
exhaustivamente cada uso de color contra esta tabla — es regla declarada,
no verificación completa caso por caso.

---

## Nota de archivo

`03-arquitectura/arquitectura.md`, `design-system/operational-visual-architecture.md`
y `design-system/uix-design-system-foundations.md` quedaron **obsoletos**
desde este documento. Decisión de Fernando (21-jun-2026): archivados, no
eliminados — movidos a `docs/_obsoleto/` (ver `docs/_obsoleto/README.md`).
No forman parte del flujo de información activo; no se leen por defecto ni
se citan como vigentes.
