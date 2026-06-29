# CURRENT_CONTEXT — DISATEQ Vendor™
**Última actualización:** Sesión actual — Módulo IFA + Rediseño Barra de Módulos Operacionales

---

## ÚLTIMO COMMIT
`ef5bfa8` — feat(ux): enlace de escape en SelectorPrincipiosActivos — navega a catálogo IFA si el principio no existe

---

## ESTADO GENERAL
El proyecto tiene el stack completo operativo: BD SQLite / Rust-Tauri / TypeScript / React.

---

## WORKSTREAMS COMPLETADOS EN ESTA SESIÓN

### 1. Módulo PRINCIPIOS ACTIVOS IFA — Stack completo

**Migración v10 (`116d98b`):**
- Tabla `principio_activo` ampliada con 4 columnas: `descripcion_uso`, `grupo_terapeutico`, `condicion_venta`, `es_combinacion`
- Seed de 251 IFAs desde catálogo WOLF_farma_catalogo_IFA_completo.xlsx
- Módulo Rust `seed_principios.rs` en `src/db/` declarado en `db/mod.rs`
- Patrón idempotente con `INSERT OR IGNORE` sobre `nombre_dci UNIQUE`
- Fix unicode escapes (`ef5bfa8`): archivo regenerado directamente por Python para evitar corrupción de PowerShell

**Comandos Rust (`d85e8fe`, `f8754ef`):**
- `listar_principios_activos` — ampliado con 4 campos nuevos, búsqueda dual nombre_dci + grupo_terapeutico
- `buscar_principios_activos` — LIMIT 20, búsqueda dual
- `obtener_principio_activo(id)` — detalle con productos vinculados
- `crear_principio_activo` — detecta NOMBRE_DUPLICADO
- `modificar_principio_activo` — auditoría campo a campo en correccion_catalogo
- Todos registrados en `lib.rs`

**Tipos TypeScript (`e29be51`):**
- `PrincipioActivo` ampliado
- `CondicionVentaIfa`: `'OTC' | 'OTC_RM' | 'RM' | 'RM_ESPECIAL'` (sufijo Ifa para diferenciarlo de CondicionVenta de ventas)
- `PrincipioActivoDetalle extends PrincipioActivo` con `productosVinculados`
- `CrearPrincipioActivoInput`, `ModificarPrincipioActivoInput`

**Servicios (`0a046a3`):** `obtenerPrincipioActivo`, `crearPrincipioActivo`, `modificarPrincipioActivo`

**Hook `usePrincipiosActivos` (`8b58fe9`):**
- 4 modos: `busqueda | resumen | editar | nuevo`
- Debounce 300ms, carga inicial automática
- `onGuardarNuevo` detecta NOMBRE_DUPLICADO con mensaje humanizado
- `onRecargarDetalle` con guard null

**UI (`2b26761`):**
- `PrincipiosActivosWorkspace` — layout flex-[40]/flex-[60]
- Buscador con filtro dual + chips COMBINACIÓN/CONTROLADO
- 3 sheetworks: RESUMEN (con productos vinculados), EDITAR (con motivo obligatorio), NUEVO
- Badges semánticos: OTC verde / OTC_RM amarillo / RM naranja / RM_ESPECIAL rojo

**Integración en App.tsx (`6536e34`):**
- `AbastecimientoSubModule` actualizado: `"productos" | "ifa" | "proveedores" | "laboratorios" | "ingresos" | "inventarios" | "traslados"`
- Case `ifa` → `<PrincipiosActivosWorkspace />`
- Tab interno de CatalogoFarmaciaWorkspace eliminado

**Enlace de escape (`ef5bfa8`):**
- `SelectorPrincipiosActivos` tiene enlace "¿No encuentras el IFA? → Ir al catálogo de principios activos"
- Dispara `disateq:navegar` con `{ destino: 'abastecimiento', subtab: 'ifa' }`
- Solo visible cuando `!disabled`

---

### 2. Rediseño Barra de Módulos Operacionales (`6536e34`, `bde5152`)

**Doctrina establecida:**
- Nombre canónico: BARRA DE MÓDULOS OPERACIONALES (archivo: `OperationalBar.tsx`, export: `ContextBar`)
- 7 módulos: TURNO · VENTAS · ABASTECIMIENTO · CLIENTES · REPORTES · COMPROBANTES · AJUSTES
- Color canónico por módulo predomina en toda su experiencia (módulo + opciones secundarias)

**Comportamiento de teclado:**
- `Ctrl+Espacio` — activa barra, cursor siempre en TURNO (primer módulo)
- `←→` — navega módulos (sin activar)
- `Enter` — activa módulo; si tiene secundarias las muestra en misma fila; si no, desactiva barra
- `Esc` desde secundarias — vuelve a vista de módulos (barra activa)
- `Esc` desde módulos — desactiva barra completamente
- Atajos directos: `Ctrl+Espacio` luego `T/V/A/C/R/B/J`

**Opciones secundarias:**
- Al expandir: ninguna sombreada, cursor en primera opción
- `←→` navega sin activar
- `Enter` activa la opción y sombrea — barra PERMANECE VISIBLE
- Click también activa sin cerrar barra
- La opción activa se muestra con `backgroundColor: accent, color: white`

**ABASTECIMIENTO reestructurado — dos grupos:**
- MAESTROS: PRODUCTOS · IFA · PROVEEDORES · LABORATORIOS(placeholder)
- OPERACIÓN: INGRESOS · INVENTARIOS · TRASLADOS(placeholder)
- Separador `|` entre grupos

**Separadores en vista global:**
- Después de VENTAS, ABASTECIMIENTO y REPORTES

**Listener `disateq:navegar` conectado** — navegación programática desde workspaces operativa

---

## DEUDA TÉCNICA REGISTRADA

- `nombre_dci` en seed: casing mixto (Paracetamol) vs registros anteriores uppercase (PARACETAMOL) — coexisten sin colisión por UNIQUE case-sensitive. Pendiente normalización futura.
- `Laboratorios` — placeholder en barra, sin workspace implementado. Decisión pendiente: tabla maestra o texto libre.
- `Traslados` — placeholder en barra, sin workspace.
- `Brecha 8` DIGEMID — psicotrópicos/libro control — identificada, no implementada.
- `BoxSlotType → TipoCaja` naming migration — pendiente.
- `Operador.codigo` cleanup — pendiente.
- `flex w-[N%] + gap` CSS audit — pendiente.
- `codigoInterno` en búsqueda SQL — pendiente.

---

## PRÓXIMA VENTANA DE TRABAJO

**Prueba funcional pendiente:**
1. Verificar barra de módulos operacionales en app
2. Verificar PrincipiosActivosWorkspace — carga 251 IFAs, búsqueda dual, RESUMEN/EDITAR/NUEVO
3. Verificar enlace de escape en SelectorPrincipiosActivos
4. Verificar navegación programática `disateq:navegar`

**Cola de trabajo posterior:**
- Evaluación visual CORREGIR DATOS BÁSICOS (incluye SelectorPrincipiosActivos con campos nuevos)
- Evaluación visual DESACTIVAR PRODUCTO
- Evaluación visual ASIGNACIÓN PRESENTACIONES
- Evaluación visual ASIGNACIÓN DE PRECIOS
- Evaluación visual NuevoProductoStepper
- INGRESOS — prueba end-to-end
- Laboratorios master table (decisión pendiente)
- ClientesWorkspace, ReportesWorkspace

---

## ARQUITECTURA DE MÓDULOS — ESTADO ACTUAL

```
ABASTECIMIENTO
├── PRODUCTOS     → CatalogoFarmaciaWorkspace (sin tabs internos)
├── IFA           → PrincipiosActivosWorkspace ✅ NUEVO
├── PROVEEDORES   → ProveedoresWorkspace ✅
├── LABORATORIOS  → placeholder ⏳
├── INGRESOS      → IngresosMercaderiaWorkspace ✅
├── INVENTARIOS   → InventarioFarmaciaWorkspace / InventoryWorkspace ✅
└── TRASLADOS     → placeholder ⏳
```

---

## CONVENCIONES CLAVE

- `cargo check` desde `apps\vendor-desktop\src-tauri`
- `npx tsc --noEmit` desde `apps\vendor-desktop` antes de cada commit
- `git add` explícito — nunca `git commit -am`
- Codex prompts en lenguaje natural, bloque continuo, terminan con solicitud de resumen
- Claude nunca escribe código a archivos del proyecto directamente
- Unicode en strings Rust: generar con Python, nunca transcribir manualmente por PowerShell
