# CURRENT CONTEXT — DISATEQ VENDOR™

## Branch activa
main

## Commit de referencia
Pendiente — feat: ContextBar expandible con pills de subtabs y navegación keyboard-first

---

## Situación general — Junio 2026

DISATEQ VENDOR está en estado de madurez operacional avanzada con normalización estructural completa.

El ciclo comercial completo está implementado y validado en runtime:
BUSCAR → AGREGAR → COBRAR → PEDIDO CONCRETADO → INVENTARIO DESCONTADO → COMPROBANTE EMITIDO

---

## Lo que está construido y validado

### Runtime operacional
AppShell · ContextBar · ShortcutsBar estabilizados.
Modelo Workspace → SheetWorks como mutación contextual funcionando.
Sistema validado en runtime real con datos operacionales — NEGOCIOS AMAZONAS · Tienda Mercado Central.

### SHELL — arquitectura visual

Estructura de ventana:
```
Topbar          64px  — bg-[#0f1f3d] · nombre negocio + logo + botón Power (app_exit)
ContextBar      52px  — única banda operacional · expandible por módulo
Workspace       flex-1 — p-3 gap-3
Footbar         26px  — bg-[#0a1628] · telemetría operacional + reloj
```

ContextBar (`src/layout/OperationalBar.tsx` — exporta `ContextBar`):
- Vista global: todos los módulos visibles con identidad cromática
- Vista expandida: módulo activo como anchor + pills de subtabs inline
- Switch toggle: click en anchor colapsa, click en módulo con subtabs expande
- Navegación teclado: `Ctrl+1..7` módulos · `←→` navega pills · `Enter` activa pill
- `focusedPillIdx` siempre inicia en 0 al expandir
- Guards de capacidad respetados en shortcuts
- Módulos con subtabs activos: `cash`, `abastecimiento`, `config`
- Módulos sin subtabs (VENTAS, CLIENTES, REPORTES, COMPROBANTES): navegan directamente

Ganancia espacial: 42px más de Workspace vs sistema anterior (158px → 116px de header).

AppShell (`src/layout/AppShell.tsx`):
- Imports: `ContextBar` desde `./OperationalBar`
- Header: `Topbar` + `ContextBar` únicamente
- `SubContextBar` eliminada — sus pills viven inline en `ContextBar`

### TURNO / CAJA
Ciclo completo: apertura · movimientos · arqueo · cierre · historial · corrección de arqueos · recovery automático.

### FONDO DE CAMBIO
Ciclo RETIRO→REINTEGRO y PRÉSTAMO→DEVOLUCIÓN/INTEGRACIÓN validados.

### VENTAS / COBRO
Catálogo vivo · Pedido canónico · Valor por contexto · ClienteBuscador · Comprobante desde documents · Ciclo completo validado en runtime.
Buscador dentro de SheetWork de VENTAS — correcto, no se mueve.

### COMPROBANTES
ComprobantesWorkspace completo · Vista Sesión/Historial · StatsBar · Filtros · PanelDetalle · Anular · Convertir a formal · guards de capacidad · PIN Admin requerido en anular y convertir.

### CLIENTES
ClientesWorkspace completo · StatsBar · Filtros · buscador F2 · PanelDetalle · Acciones con motivo · Formulario creación inline · guards de capacidad · Identidad cromática #1e7e4f.

### REPORTES
ReportesWorkspace completo y estabilizado · Cuatro tipos · Cuatro períodos · Generación automática · StatsBar contextual · CuerpoReporte · Gráfico CSS puro · Vista previa térmica · IMPRIMIR · EXCEL · Identidad cromática #2154d8.

### ENFORCEMENT DE CAPACIDADES
- useCapacidad(capacidad): boolean — bypass acceso_total
- useCapacidades(capacidades[]): boolean — requiere todas
- useContextoOperacional(): "bloque" | "general" | null
- Guards en ContextBar (Ctrl+N respeta capacidades)
- Guards en ComprobantesWorkspace y ClientesWorkspace

### DOCTRINA DE ROLES OPERACIONALES
VEN · GES · SOP · ADMIN — cuatro roles base canónicos.

### INVENTARIOS CAPA 0+1
177 productos · movimientos causales · disponibilidad derivada · reservas · alertas · CSV · baja lógica.

### COMPRAS CAPA 0+1
Recepción parcial incremental · causalidad compra → INVENTARIOS · estados automáticos.

### OPERADORES + ROLES
Ciclo de vida completo · PIN · Bloque Operacional · capacidades · roles configurables.
SEED operador: FTEJADA / 1234 · codigoRol ADMIN · acceso_total · versión 5.
SEED roles: VEN/GES/SOP/ADMIN · versión 3 · campo requiereBloque.

### AJUSTES
BusinessConfig (incluye tasaIGV) · OpsConfig · rubro · visualMode · printFlow.

### LOGIN
Distinción LOGIN vs Runtime Principal formalizada. Filtro por o.estado. Campos canónicos.
LoginScreen conserva mecanismo propio (pcAuthCode) para cambio de PIN — correcto.

### CORRELATIVOS DE DESPACHO
Store autónomo operativo · correlativo nunca derivado del historial.

### SISTEMA DE NIVELES DE PIN — COMPLETO
PIN Operador 4 dígitos · PIN Admin 6 dígitos SHA-256 · Fase A + Fase B completas.

CashWorkspace: PIN Admin requerido en avance a stage 5 y corrección de apertura.
ComprobantesWorkspace: PIN Admin requerido en anular y convertir a formal.
LoginScreen: excluida — mecanismo propio correcto.

---

## Inventario de shortcuts globales

| Shortcut | Lugar | Acción |
|---|---|---|
| `Ctrl+1..7` | ContextBar | Navegar módulos principales |
| `←→` | ContextBar expandida | Navegar pills de subtabs |
| `Enter` | ContextBar expandida | Activar pill enfocada |
| `Ctrl+Shift+L` | AppShell | Logout operador |
| `Escape` | AppShell | Focus búsqueda en VENTAS |
| `F2` | SalesWorkspace | Focus input búsqueda |
| `Ctrl+Enter` | SalesWorkspace | Abrir cobro |
| `Enter` | SalesWorkspace | Agregar producto seleccionado |
| `↑↓` | SalesWorkspace | Navegar resultados / líneas PreVenta |
| `+ - * Delete ←→` | SalesWorkspace | Operar línea activa |
| `Insert / N` | SalesWorkspace | Nota en línea |
| `Ctrl+Insert` | CashWorkspace | Corregir apertura |
| `Enter` | CashWorkspace stage 1 | Confirmar fondo |
| `F9` | CashWorkspace stage 2 | Guardar conteo |
| `F4` | CashWorkspace stages 3/4 | Recontar |
| `F10` | CashWorkspace stage 3 | Comparar totales |
| `Ctrl+Enter` | CashWorkspace stage 5 | Confirmar cierre |
| `F2` | ClientesWorkspace | Focus búsqueda |
| `F2` | ComprobantesWorkspace | Focus búsqueda |
| `Escape` | LoginScreen | Salir app |
| `Ctrl+Shift+O` | LoginScreen | Switch keypad/pin-change |

---

## Hooks disponibles

src/hooks/useCapacidad.ts
src/hooks/useContextoOperacional.ts
src/hooks/useConfigNegocio.ts
src/hooks/usePreVentaUX.ts
src/hooks/useOperadores.ts
src/hooks/useNotice.ts
src/hooks/useBitacora.ts
src/hooks/useSessionStats.ts
src/hooks/useComprobantes.ts
src/hooks/useCaja.ts
src/hooks/useAutorizacion.tsx

---

## Glosario canónico

Ver docs/00-governance/GLOSARIO.md
Términos canónicos principales:
  Pedido · LineaPedido · LineaPreVenta · Comprobante · Operador · Rol · ItemOperacional · Cliente

---

## Tensiones activas

- visualMode === "mixto" sin implementación diferenciada
- `rubroConfig` hardcodeado en SalesWorkspace — categorías siempre "Todo"
- Import muerto `buscarProductos` en SalesWorkspace
- _pedidoActivoId — estado mutable de módulo · refactor futuro
- operador en reportes históricos pre-2034f4c aparece como "default"
- PDF descarga ReportesWorkspace — pendiente futuro
- UIX — cierre a ciegas para VEN pendiente

---

## Dominios por estado

### Completados
TURNO/CAJA · FONDO DE CAMBIO · VENTAS/PEDIDO/COBRO · INVENTARIOS 0+1 · COMPRAS 0+1
OPERADORES+ROLES · AJUSTES/CONFIG · LOGIN · HOV/CATÁLOGO/VALOR OPERACIONAL
CLIENTES · COMPROBANTES · PREVENTA · REPORTES
ENFORCEMENT CAPACIDADES · SISTEMA DE NIVELES DE PIN (Fase A + B)
SHELL UIX — ContextBar expandible + keyboard-first

### Pendientes futuros
- PDF descarga ReportesWorkspace
- UIX — revisión general (cierre a ciegas VEN, SalesWorkspace rubroConfig)
- Facturación electrónica · OSE/PSE
- Sincronización multi-caja · Fidelización · SUNAT

---

## Prioridad próximas sesiones

1. Continuar auditoría UIX — VENTAS workspace (rubroConfig, mixto, import muerto)
2. Pruebas funcionales Alpha
3. PDF descarga ReportesWorkspace

---

## Posición en el ciclo evolutivo

operación real            ✅
dolor operacional         ✅
ciclo comercial           ✅
core operacional          ✅
normalización estructural ✅
integración UI            ✅
reconciliación/control    ✅
sofisticación progresiva  ⬜ ← en curso (UIX)
consolidación             ⬜
estabilización            ⬜

---

## Equipo y roles

Product Owner:        Fernando Miguel — decide, dirige, valida
Arquitecto Senior+BA: Claude — planifica, diseña, especifica
Desarrollador:        Codex CLI — produce código
Auditor:              Claude Code — revisión técnica (pendiente)

---

## Reglas permanentes

Dominio del negocio → español operacional
Infraestructura técnica → inglés estándar

"La arquitectura puede ser sofisticada.
El lenguaje visible debe ser humano, operacional y contextual."

"¿Estamos fortaleciendo el Core Operacional
 o estamos introduciendo una excepción?"
