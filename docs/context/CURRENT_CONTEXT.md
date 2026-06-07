# CURRENT CONTEXT — DISATEQ VENDOR™

## Branch activa
main

## Commit de referencia
e77d48e — feat: enforcement capacidades + doctrina de roles VEN/GES/SOP/ADMIN + useContextoOperacional + ReportesWorkspace estabilizado

---

## Situación general — Junio 2026

DISATEQ VENDOR está en estado de madurez operacional avanzada con normalización estructural completa.

El ciclo comercial completo está implementado y validado en runtime:
BUSCAR → AGREGAR → COBRAR → PEDIDO CONCRETADO → INVENTARIO DESCONTADO → COMPROBANTE EMITIDO

---

## Lo que está construido y validado

### Runtime operacional
AppShell · ContextBar · SubContextBar · ModulesBar estabilizados.
Modelo Workspace → SheetWorks como mutación contextual funcionando.
Sistema validado en runtime real con datos operacionales — NEGOCIOS AMAZONAS · Tienda Mercado Central.

### TURNO / CAJA
Ciclo completo: apertura · movimientos · arqueo · cierre · historial · corrección de arqueos · recovery automático.

### FONDO DE CAMBIO
Ciclo RETIRO→REINTEGRO y PRÉSTAMO→DEVOLUCIÓN/INTEGRACIÓN validados.

### VENTAS / COBRO
Catálogo vivo · Pedido canónico · Valor por contexto · ClienteBuscador · Comprobante desde documents · Ciclo completo validado en runtime.

### COMPROBANTES
ComprobantesWorkspace completo · Vista Sesión/Historial · StatsBar · Filtros · PanelDetalle · Anular · Convertir a formal · guards de capacidad aplicados.

### CLIENTES
ClientesWorkspace completo · StatsBar · Filtros · buscador F2 · PanelDetalle · Acciones con motivo · Formulario creación inline · guards de capacidad · Identidad cromática #1e7e4f.

### REPORTES
ReportesWorkspace completo y estabilizado · Cuatro tipos (VENTAS/COMPROBANTES/ABASTECIMIENTO/TURNOS) · Cuatro períodos · Generación automática · StatsBar contextual · CuerpoReporte con tablas · Gráfico de barras CSS puro · Vista previa térmica · IMPRIMIR · EXCEL · Todos los accesos defensivos aplicados · Identidad cromática #2154d8.

### ENFORCEMENT DE CAPACIDADES
- useCapacidad(capacidad): boolean — bypass acceso_total
- useCapacidades(capacidades[]): boolean — requiere todas
- useContextoOperacional(): "bloque" | "general" | null
- ModulesBar: REPORTES · CLIENTES · COMPROBANTES · ABASTECIMIENTO · AJUSTES restringidos
- COMPROBANTES visible para todo operador activo (contexto !== null)
- TURNO y VENTAS sin restricción — operación nuclear
- Guards en ComprobantesWorkspace (anular/convertir) y ClientesWorkspace (CRUD)

### DOCTRINA DE ROLES OPERACIONALES
Cuatro roles base canónicos. Roles adicionales se crean por necesidad.

VEN — Ventas · requiereBloque: true
  capacidades: gestionar_clientes
  contexto: bloque siempre · opera caja · vende · cobra · emite
  cierre a ciegas — montos acumulados no visibles (pendiente UIX)

GES — Gestor · requiereBloque: false
  capacidades: observar_comprobantes_global · anular_comprobantes · corregir_arqueos ·
    reaperturar_cierres · regularizar_incidencias · observar_continuidad · ver_reportes ·
    gestionar_clientes · gestionar_inventarios · gestionar_compras
  contexto: general normalmente · bloque en emergencia si Admin asigna uno

SOP — Soporte · requiereBloque: false
  capacidades: observar_continuidad
  contexto: general siempre

ADMIN — Administrador · requiereBloque: false
  capacidades: acceso_total
  contexto: general siempre · único que crea operadores y asigna capacidades

### INVENTARIOS CAPA 0+1
177 productos · movimientos causales · disponibilidad derivada · reservas · alertas · CSV · baja lógica. Validado en runtime.

### COMPRAS CAPA 0+1
Recepción parcial incremental · causalidad compra → INVENTARIOS · estados automáticos.

### OPERADORES + ROLES
Ciclo de vida completo · PIN · Bloque Operacional · capacidades · roles configurables.
SEED operador: FTEJADA / 1234 · codigoRol ADMIN · acceso_total · versión 5.
SEED roles: VEN/GES/SOP/ADMIN · versión 3 · campo requiereBloque.

### AJUSTES
BusinessConfig (incluye tasaIGV) · OpsConfig · rubro · visualMode · printFlow.
Capacidades operacionales con etiquetas ADICIONAL/REGULARIZACIÓN/SUPERVISIÓN visibles.

### LOGIN
Distinción LOGIN vs Runtime Principal formalizada. Filtro por o.estado. Campos canónicos.

---

## Hooks disponibles

src/hooks/useCapacidad.ts
  useCapacidad(capacidad: string): boolean
  useCapacidades(capacidades: string[]): boolean

src/hooks/useContextoOperacional.ts
  useContextoOperacional(): "bloque" | "general" | null

Capacidades activas en el sistema:
  acceso_total · ver_reportes · gestionar_clientes · observar_comprobantes_global
  gestionar_inventarios · gestionar_operadores · anular_comprobantes · corregir_arqueos
  reaperturar_cierres · regularizar_incidencias · gestionar_roles · gestionar_capacidades
  gestionar_cajas · gestionar_compras · observar_continuidad

---

## Glosario canónico

Ver docs/00-governance/GLOSARIO.md — sección 10 incluye doctrina de roles.

Términos canónicos principales:
  Pedido · LineaPedido · LineaPreVenta · Comprobante · Operador · Rol · ItemOperacional · Cliente

---

## Tensiones activas

- POSContext.tsx (~1000 líneas) · boundary difuso · extracción pendiente
- visualMode === "mixto" sin implementación
- Correlativos de despacho sin persistencia
- _pedidoActivoId — estado mutable de módulo · refactor futuro
- operador aparece como "default" en reportes — se normaliza cuando el flujo de login en ventas persista el operadorId correctamente
- PDF para descarga en ReportesWorkspace — pendiente futuro
- UIX general — revisión pendiente (incluye cierre a ciegas para VEN)

---

## Dominios por estado

### Completados
TURNO/CAJA · FONDO DE CAMBIO · VENTAS/PEDIDO/COBRO · INVENTARIOS 0+1 · COMPRAS 0+1
OPERADORES+ROLES · AJUSTES/CONFIG · LOGIN · HOV/CATÁLOGO/VALOR OPERACIONAL
CLIENTES (dominio + workspace + enforcement) · COMPROBANTES (domain + workspace + enforcement)
PREVENTA · REPORTES (dominio + workspace estabilizado)
ENFORCEMENT CAPACIDADES (hooks + guards + doctrina de roles)

### Pendientes estructurales
- Extracción progresiva POSContext.tsx ← SIGUIENTE
- Correlativos de despacho con persistencia

### Pendientes futuros
- PDF descarga ReportesWorkspace
- UIX — revisión general (cierre a ciegas VEN, ajustes visuales)
- Facturación electrónica · OSE/PSE
- Sincronización multi-caja · Fidelización · SUNAT

---

## Prioridad próximas sesiones

1. Extracción progresiva POSContext.tsx ← SIGUIENTE
2. Correlativos de despacho
3. PDF descarga
4. UIX general

---

## Posición en el ciclo evolutivo

operación real            ✅
dolor operacional         ✅
ciclo comercial           ✅ cerrado y validado en runtime real
core operacional          ✅
normalización estructural ✅ TAREAS 0–8
integración UI            ✅ ClientesWorkspace · ReportesWorkspace
reconciliación/control    ✅ enforcement capacidades + doctrina de roles
sofisticación progresiva  ⬜
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
