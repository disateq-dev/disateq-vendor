# CURRENT CONTEXT — DISATEQ VENDOR™

## Branch activa
main

## Último commit
docs(arch): contingencia por fallo de terminal — escenarios y mitigaciones

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
Arqueo a ciegas para rol VEN: Stage 4 oculta esperados del sistema y resultado de conciliación.
Stage 5 cierre: fila DIFERENCIA (FALTANTE/SOBRANTE/CUADRADO) visible para roles no VEN.
Ticket de cierre incluye sección SISTEMA vs OPERADOR (tú a tú) solo para cierres de rol VEN.

### FONDO DE CAMBIO
Ciclo RETIRO→REINTEGRO y PRÉSTAMO→DEVOLUCIÓN/INTEGRACIÓN validados.

### VENTAS / COBRO
Catálogo vivo · Pedido canónico · Valor por contexto · ClienteBuscador · Comprobante.
Tres modos de búsqueda: nombre/código · calculadora inline · escáner.
Vista Lista y Visual · Feedback verde 600ms al agregar.

### COMPROBANTES
Workspace completo · Vista Sesión/Historial · StatsBar · Filtros · PanelDetalle · Anular · Convertir · PIN de Autorización.

### CLIENTES
Workspace completo · StatsBar · Filtros · F2 · PanelDetalle · Formulario inline · guards.

### REPORTES
Workspace completo · Cuatro tipos · Cuatro períodos · IMPRIMIR · EXCEL · PDF A4.

### INVENTARIOS CAPA 0+1
177 productos · movimientos causales · disponibilidad derivada · reservas · alertas.

### COMPRAS CAPA 0+1
Recepción parcial incremental · causalidad compra → INVENTARIOS.

### OPERADORES + ROLES
Ciclo de vida completo · PIN SHA-256 · Bloque Operacional · capacidades · roles configurables.
SEED: FTEJADA / 1234 · ADMIN · acceso_total · versión 5.

---

## Deudas técnicas identificadas

### Arquitectura

| # | Deuda | Impacto | Prioridad |
|---|---|---|---|
| 1 | `POSContext.tsx` — orquestador puro · deuda resuelta | — | ✅ Cerrada |
| 2 | Imports directos de storage en componentes UI — viola DIP | Medio | Media |

### Funcionalidad

| # | Deuda | Impacto | Prioridad |
|---|---|---|---|
| 3 | UIX Stage 5 cierre — fila diferencia para roles no VEN | — | ✅ Cerrada |
| 4 | Historial de búsqueda por sesión — ArrowUp en input vacío | Bajo | Baja |

### Seguridad

| # | Deuda | Impacto | Prioridad |
|---|---|---|---|
| 5 | PINs de operador en texto plano | — | ✅ Cerrada |
| 6 | Sin cifrado de localStorage | — | ✅ Resuelta por arquitectura — localStorage es caché temporal |
| 7 | Sin timeout de inactividad — sesión permanece activa indefinidamente | Medio | Media |

### Regulatorio

| # | Deuda | Impacto | Prioridad |
|---|---|---|---|
| 8 | Integración SUNAT real pendiente | Alto | Fase 6 del roadmap sync |

### Normalización GLOSARIO

| # | Deuda | Impacto | Prioridad |
|---|---|---|---|
| 9 | `emitidoPor` en `Comprobante` — debería ser `operadorId` | Bajo | Baja |
| 10 | `EstadoDisponibilidad` en minúsculas en `inventory/types.ts` | Bajo | Baja |

---

## Arquitectura de sincronización — CONSOLIDADA Y DOCUMENTADA

Documento completo: `docs/03-arquitectura/ARQUITECTURA_SYNC.md`

**Modelo:** MSP — DISATEQ como socio tecnológico
**Topología:** Edge (terminales) → Nexo DISATEQ (primario + secundario) · hasta 5 equipos por cliente en V1
**Tres rutas:** internet automático · LAN peer-to-peer · .dsync manual
**Conflictos:** event-sourcing · LWW · determinista para correlativos
**Correlativos:** series por terminal · store actual ya compatible · asignación desde Nexo en Portal
**Contingencia Nexo:** failover automático y silencioso · nexo.config.json con endpoints priorizados
**Contingencia terminal:** fallo siempre acotado · recuperación desde disco o tickets · terminalId único
**Recuperación:** terminales son el respaldo del Nexo · reconstrucción desde colas locales
**Dos proyectos:** VENDOR (sync/ + SUNAT) · PORTAL (Nexo · licencias · actualizaciones · RustDesk)

---

## Estado actual de la capa sync/

Diseño arquitectónico completo y documentado. Listo para iniciar implementación.

### Fase 1 — Cola de eventos (PRÓXIMA SESIÓN)

Archivos a crear:
```
src/sync/event-queue.types.ts
src/sync/event-queue.store.ts
```

Tipos definidos y listos para Codex:
- `SyncDominio`: pedidos · comprobantes · inventario · clientes · turno · configuracion
- `SyncOperacion`: CREAR · MODIFICAR · ANULAR · CERRAR · REGISTRAR
- `SyncEstado`: PENDIENTE · ENVIANDO · CONFIRMADO · FALLIDO
- `SyncEvent`: id · terminalId · clienteId · dominio · operacion · entidadId · payload · creadoEn · estado · intentos · ultimoIntento · confirmedAt · errorMsg
- `NexoEndpoint`: url · prioridad · activo
- `NexoConfig`: clienteId · terminalId · endpoints[] · timeoutMs · retryIntervalMs

API del store:
- `encolar(dominio, operacion, entidadId, payload): SyncEvent`
- `marcarEnviando(eventId): void`
- `confirmar(eventId): void`
- `registrarFallo(eventId, errorMsg): void`
- `obtenerPendientes(): SyncEvent[]`
- `obtenerTodos(): SyncEvent[]`
- `purgarConfirmados(): void`
- `resumen(): { pendientes: number; fallidos: number; ultimoSync: string | null }`

Puntos de integración (una línea por dominio, tras implementar el store):
- `pedido.store.ts` → encolar tras `concretarPedido()` y `abandonarPedido()`
- `comprobante.store.ts` → encolar tras `emitirComprobante()` y `anularComprobante()`
- `CashWorkspace` → encolar tras `closeCashSession()`
- `cliente.store.ts` → encolar tras crear/modificar cliente
- `inventory` → encolar tras cada `MovimientoOperacional`

Lo que NO entra en la cola:
- Estado UI efímero · PreVenta · TurnEvents · configuración de UI local

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
| `Escape` | AppShell | Focus búsqueda VENTAS |
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

## Prioridad próximas sesiones

1. Fase 1 sync — implementación cola de eventos (event-queue.types.ts + event-queue.store.ts)
2. Fase 2 sync — sync-agent + nexo.config.json + failover (Ruta 1)
3. Fase 3 sync — exportador .dsync + UI en Configuración (Ruta 3)
4. Fase 4 sync — LAN peer-to-peer (Ruta 2)
5. Fase 5 sync — bloques de correlativos multi-terminal
6. Fase 6 — API REST facturación electrónica SUNAT

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
