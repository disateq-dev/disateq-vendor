# CURRENT CONTEXT — DISATEQ VENDOR™

## Branch activa
main

## Commit de referencia
Pendiente — feat: Fase B enforcement PIN Admin — CashWorkspace + ComprobantesWorkspace

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
ComprobantesWorkspace completo · Vista Sesión/Historial · StatsBar · Filtros · PanelDetalle · Anular · Convertir a formal · guards de capacidad aplicados · PIN Admin requerido en anular y convertir.

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
LoginScreen conserva su mecanismo propio (pcAuthCode alfanumérico) para cambio de PIN de operador — no usa useAutorizacion, diseño correcto.

### CORRELATIVOS DE DESPACHO
Registro autónomo por serie · store propio disateq:documents:correlativos · bootstrap desde historial existente · crearComprobante() y convertirAFormal() migrados · correlativo nunca derivado del historial de documentos · CobroPanel muestra correlativo real desde correlativoStore · emitidoPor usa activeOperator.id · dispatchCorrelative es estado local de sesión sin persistencia.

### SISTEMA DE NIVELES DE PIN — COMPLETO
PIN Operador 4 dígitos · PIN Admin 6 dígitos único por sistema · hash SHA-256 via Web Crypto · sin default — requiere configuración explícita.

Trazabilidad completa en accesos.store:
  LOGIN_OK · LOGIN_FAIL · PIN_CAMBIADO · PIN_RESETEADO
  PIN_ADMIN_USADO · PIN_ADMIN_FALLIDO · PIN_ADMIN_CONFIGURADO

Hook useAutorizacion (src/hooks/useAutorizacion.tsx):
  solicitarAdmin(operacion, operadorAlias, onAutorizado): void
  PinAdminModal: React.FC
  Modal no bloqueante · 3 intentos máx · keypad numérico · SHA-256

Fase B completada — integración useAutorizacion en módulos:

  CashWorkspace:
    - Avance a stage 5 (punto de no retorno del cierre) → requiere PIN Admin
    - Corrección de datos de apertura → requiere PIN Admin
    - Inicio de arqueo (stage 0→1) → libre, reversible, no requiere PIN
    - <PinAdminModal /> renderizado en raíz del componente

  ComprobantesWorkspace:
    - Anular comprobante → requiere capacidad anular_comprobantes + PIN Admin
    - Convertir a formal → requiere capacidad anular_comprobantes + PIN Admin
    - Guards de capacidad preexistentes conservados intactos
    - <PinAdminModal /> renderizado en raíz del componente

  LoginScreen → excluida de Fase B · mecanismo propio correcto

---

## Hooks disponibles

src/hooks/useCapacidad.ts
  useCapacidad(capacidad: string): boolean
  useCapacidades(capacidades: string[]): boolean

src/hooks/useContextoOperacional.ts
  useContextoOperacional(): "bloque" | "general" | null

src/hooks/useConfigNegocio.ts
  useConfigNegocio(): { rubro, setRubro, visualMode, setVisualMode, printFlow, setPrintFlow }

src/hooks/usePreVentaUX.ts
  usePreVentaUX({ isTurnoAbierto, showNotice }): { zone, cobroOpen, enterTicket, enterSearch, openCobro, closeCobro, newSale }

src/hooks/useOperadores.ts
  useOperadores({ addOpLog }): operators · activeOperator · loginOperator · logoutOperator · changeOperatorPin · changeOperatorPinById · resetOperatorPin · createOperator · updateOperatorData · setOperatorStatus · assignOperatorBlock · releaseOperatorBlock · updateOperatorCapabilities · roles · createRole · updateRoleData · setRoleActive · updateRoleCapabilities

src/hooks/useNotice.ts
  useNotice(): { sessionNotice, showNotice }

src/hooks/useBitacora.ts
  useBitacora({ cashSessionRef }): { opLogs, addOpLog, resetOpLogs, turnEvents, addTurnEvent, currentSessionEvents }

src/hooks/useSessionStats.ts
  useSessionStats({ initialStats? }): { sessionStats, sessionStatsRef, docCorrelatives, recordSale, revertirVenta, resetStats }

src/hooks/useComprobantes.ts
  useComprobantes({ cashSessionRef, addOpLog, addTurnEvent, onAnulacion }): { comprobantes, addComprobante, voidComprobante }

src/hooks/useCaja.ts
  useCaja({ addOpLog, addTurnEvent, resetStats, resetOpLogs, sessionStatsRef, activeOperatorRef, operatorsRef, setCobroOpen, setZone, initialMoves, initialSession, initialUsedCodes }): { cashSession, cashSessionRef, cashBoxes, cashMoves, cashMovesRef, addCashMove, updateCashMove, editCashMove, openCashSession, closeCashSession, correctAperturaData }
  recoverOperationalState(): RecoveredState

src/hooks/useAutorizacion.tsx
  useAutorizacion(): { solicitarAdmin, PinAdminModal }

---

## Glosario canónico

Ver docs/00-governance/GLOSARIO.md — sección 10 incluye doctrina de roles.

Términos canónicos principales:
  Pedido · LineaPedido · LineaPreVenta · Comprobante · Operador · Rol · ItemOperacional · Cliente

---

## Tensiones activas

- POSContext.tsx · Extracción completa — 8 hooks · archivo reducido a ~160 líneas de ensamblaje puro ✅
- visualMode === "mixto" sin implementación
- Correlativos de despacho ✅ resueltos — store autónomo operativo
- _pedidoActivoId — estado mutable de módulo · refactor futuro
- operador en reportes históricos pre-2034f4c aparece como "default" — los nuevos comprobantes ya registran operadorId real
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
SISTEMA DE NIVELES DE PIN (Fase A + Fase B completas)

### Pendientes estructurales
(ninguno)

### Pendientes futuros
- PDF descarga ReportesWorkspace
- UIX — revisión general (cierre a ciegas VEN, ajustes visuales)
- Facturación electrónica · OSE/PSE
- Sincronización multi-caja · Fidelización · SUNAT

---

## Prioridad próximas sesiones

1. Auditoría UIX — SHELL · TURNO · VENTAS ← SIGUIENTE
2. Pruebas funcionales Alpha (paralelo con UIX)
3. PDF descarga ReportesWorkspace

---

## Posición en el ciclo evolutivo

operación real            ✅
dolor operacional         ✅
ciclo comercial           ✅ cerrado y validado en runtime real
core operacional          ✅
normalización estructural ✅ TAREAS 0–8
integración UI            ✅ ClientesWorkspace · ReportesWorkspace
reconciliación/control    ✅ enforcement capacidades + doctrina de roles + PIN Admin
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
