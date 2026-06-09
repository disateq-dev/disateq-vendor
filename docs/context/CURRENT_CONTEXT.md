# CURRENT CONTEXT — DISATEQ VENDOR™

## Branch activa
main

## Último commit
fix: Footbar simplificada — estado turno · legibilidad · firma @fhertejada™

---

## Situación general — Junio 2026

DISATEQ VENDOR está en estado de madurez operacional avanzada con normalización estructural completa.

El ciclo comercial completo está implementado y validado en runtime:
BUSCAR → AGREGAR → COBRAR → PEDIDO CONCRETADO → INVENTARIO DESCONTADO → COMPROBANTE EMITIDO

---

## SHELL — arquitectura visual validada en runtime

```
Topbar          64px  — bg-[#0f1f3d] · nombre negocio + logo + botón Power (app_exit)
ContextBar      52px  — única banda operacional · expandible por módulo
Workspace       flex-1 — p-3 gap-3
Footbar         26px  — bg-[#0a1628] · estado turno + reloj + firma
```

Header total: 116px (ganancia de 42px sobre sistema anterior de 158px)

---

## ContextBar — estado final validado

Archivo: `src/layout/OperationalBar.tsx` — exporta únicamente `ContextBar`
Archivo: `src/layout/AppShell.tsx` — monta `Topbar` + `ContextBar`

**Identidad visual:**
- Inactivo: solo icono + texto, sin fondo, sin borde — texto al 70% opacidad
- Activo: línea inferior `border-b-[3px]` cromática + fondo sutil — sin cuadros ni bordes laterales
- Cursor navMode: misma línea al 50% opacidad + fondo más tenue
- `active` determina MOD_ON — `display` (hover-preview) no activa el indicador cromático

**Expansión inline:**
- Click en módulo con subtabs → expande, muestra pills inline, oculta resto
- Click en anchor → colapsa, vuelve vista global
- Módulos con subtabs: `cash`, `abastecimiento`, `config`
- Módulos sin subtabs: navegan directamente

**Navegación keyboard-first:**

| Shortcut | Acción |
|---|---|
| `Shift+Enter` | Toggle modo navegación ContextBar |
| `←→` en navMode | Navegar módulos (salta sin acceso) |
| `Enter` en navMode | Activar módulo · expandir si tiene subtabs |
| `←→` en expanded | Navegar pills de subtabs |
| `Enter` en expanded | Activar pill enfocada |
| `Escape` en expanded | Colapsa pills · vuelve a navMode en módulo activo |
| `Escape` en navMode | Desactiva modo navegación completamente |

**Implementación técnica:**
- `stateRef` + `accessRef`: lectura fresca sin stale closures
- `useEffect` con `[]`: handler registrado una sola vez
- `e.code`: independiente del idioma del teclado
- `navModeRef` en AppShell: escucha `pos:navMode` para no interferir con Escape

---

## Footbar — estado final validado

Archivo: `src/layout/ShortcutsBar.tsx`

**Lado izquierdo** — estado del turno (text-white/50, 10.5px, font-semibold):
```
● TURNO ABIERTO · CAJA 100 · PC-VENTAS01 · 09:14 · 20h02m
○ SIN TURNO OPERATIVO  (cuando no hay turno)
```

**Lado derecho** — todo en text-white, 10px:
```
17:18 · 08 JUN  |  DisateQ VENDOR v1.0  |  @fhertejada™
```

Dependencias: solo `cashSession` de `usePOS()`. Sin `sessionStats`, `cashMoves`, `DocRange`.

---

## Identidad cromática por módulo

| Módulo | Color | Fondo topbar | Borde |
|---|---|---|---|
| TURNO / CAJA | `#2A7CA8` | `bg-[#F2F7FA]` | `border-[#2A7CA8]/15` |
| VENTAS | `#45b356` | `bg-[#F2FAF3]` | `border-[#45b356]/15` |
| COMPROBANTES | `#C05050` | `bg-[#FBF4F4]` | `border-[#C05050]/15` |
| CLIENTES | `#1e7e4f` | `bg-[#F0FAF4]` | `border-[#1e7e4f]/15` |
| REPORTES | `#2154d8` | `bg-[#F0F4FF]` | `border-[#2154d8]/15` |
| ABASTECIMIENTO | `#3D8A8A` | `bg-[#F0F7F7]` | `border-[#3D8A8A]/15` |
| CONFIG | `#697387` | `bg-[#F4F5F7]` | `border-[#697387]/15` |

**Reglas irrevocables:**
- La SheetTopbar solo contiene icono + texto. Sin badges, contadores, toggles ni botones.
- Tabs, toggles y filtros van en el body, inmediatamente debajo de la topbar.
- Badges de estado van en el body como contexto, nunca en la topbar.
- Botones de acción definitiva van en SheetBottomBar, nunca en el body.
- El color cromático pertenece al módulo, no al estado del sheet.

---

## Topbar — estado final

- Datos izquierda: `nombreComercial`, `alias`, `ruc`, `razonSocial` — todos de `BusinessConfig`
- Leídos con `useMemo([])` — correcto para datos estáticos por sesión
- Botón Power: `invoke("app_exit")` → `app.exit(0)` — cierre total de la app
- `closable: false` en `tauri.conf.json` — intencional, solo Power cierra

---

## Lo que está construido y validado

### TURNO / CAJA
Ciclo completo: apertura · movimientos · arqueo · cierre · historial · corrección · recovery.
**UIX del workspace pendiente de auditoría.**

### FONDO DE CAMBIO
Ciclo RETIRO→REINTEGRO y PRÉSTAMO→DEVOLUCIÓN/INTEGRACIÓN validados.

### VENTAS / COBRO
Catálogo vivo · Pedido canónico · Valor por contexto · ClienteBuscador · Comprobante.
Buscador dentro de SheetWork de VENTAS — correcto, no se mueve.
**Tensiones activas:** visualMode "mixto" sin implementar · rubroConfig hardcodeado · import muerto buscarProductos.

### COMPROBANTES
Workspace completo · Vista Sesión/Historial · StatsBar · Filtros · PanelDetalle · Anular · Convertir · PIN Admin.

### CLIENTES
Workspace completo · StatsBar · Filtros · F2 · PanelDetalle · Formulario inline · guards.

### REPORTES
Workspace completo · Cuatro tipos · Cuatro períodos · Generación automática · IMPRIMIR · EXCEL.

---

## Workspaces normalizados

- `CashWorkspace` — MOVIMIENTOS: totales ↑↓↩ bajaron al body como mini-stats row
- `ClientesWorkspace` — CLIENTES: badge activos + botón NUEVO CLIENTE bajaron a StatsBar
- `ComprobantesWorkspace` — COMPROBANTES: toggle sesión/historial + badge + contador bajaron al body
- `ReportesWorkspace` — REPORTES: badge tipo activo + spinner bajaron a banda de controles

### ENFORCEMENT DE CAPACIDADES
useCapacidad · useCapacidades · useContextoOperacional · Guards en ContextBar y workspaces.

### INVENTARIOS CAPA 0+1
177 productos · movimientos causales · disponibilidad derivada · reservas · alertas.

### COMPRAS CAPA 0+1
Recepción parcial incremental · causalidad compra → INVENTARIOS.

### OPERADORES + ROLES
Ciclo de vida completo · PIN · Bloque Operacional · capacidades · roles configurables.
SEED: FTEJADA / 1234 · ADMIN · acceso_total · versión 5.

### SISTEMA DE NIVELES DE PIN
PIN Operador 4 dígitos · PIN Admin 6 dígitos SHA-256 · Fase A + B completas.

---

## Inventario de shortcuts globales

| Shortcut | Lugar | Acción |
|---|---|---|
| `Shift+Enter` | ContextBar | Toggle modo navegación |
| `←→` | ContextBar navMode | Navegar módulos |
| `Enter` | ContextBar navMode | Activar módulo |
| `Escape` | ContextBar navMode | Salir sin activar |
| `←→` | ContextBar expanded | Navegar pills |
| `Enter` | ContextBar expanded | Activar pill |
| `Escape` | ContextBar expanded | Volver a navMode |
| `Ctrl+Shift+L` | AppShell | Logout operador |
| `Escape` | AppShell | Focus búsqueda VENTAS (bloqueado en navMode) |
| `F2` | SalesWorkspace | Focus búsqueda |
| `Ctrl+Enter` | SalesWorkspace | Abrir cobro |
| `Ctrl+Insert` | CashWorkspace | Corregir apertura |
| `F9` | CashWorkspace stage 2 | Guardar conteo |
| `F4` | CashWorkspace stages 3/4 | Recontar |
| `F10` | CashWorkspace stage 3 | Comparar totales |
| `Ctrl+Enter` | CashWorkspace stage 5 | Confirmar cierre |
| `F2` | ClientesWorkspace | Focus búsqueda |
| `F2` | ComprobantesWorkspace | Focus búsqueda |
| `Escape` | LoginScreen | Salir app |
| `Ctrl+Shift+O` | LoginScreen | Switch keypad/pin-change |

---

## Tensiones activas

- visualMode "mixto" sin implementación diferenciada en SalesWorkspace
- rubroConfig hardcodeado en SalesWorkspace
- Import muerto buscarProductos en SalesWorkspace
- UIX cierre a ciegas para rol VEN — pendiente
- PDF descarga ReportesWorkspace — pendiente

---

## Prioridad próximas sesiones

1. Revisión SalesWorkspace (rubroConfig, mixto, import muerto)
2. PDF descarga ReportesWorkspace

---

## Roles del equipo

Product Owner:        Fernando Miguel — decide, dirige, valida
Arquitecto Senior+BA: Claude — planifica, analiza, diseña, especifica. NO escribe código.
Desarrollador:        Codex CLI — produce código bajo instrucción atómica
Auditor:              Claude Code — revisión técnica (pendiente incorporar)

---

## Reglas permanentes

Dominio del negocio → español operacional
Infraestructura técnica → inglés estándar

"La arquitectura puede ser sofisticada.
El lenguaje visible debe ser humano, operacional y contextual."
