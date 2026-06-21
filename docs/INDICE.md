# ÍNDICE DE DOCUMENTACIÓN — DISATEQ VENDOR™

Mapa de navegación de toda la documentación activa del proyecto. Creado 21-jun-2026, al cierre de la sesión de consolidación documental.

**Cómo leer el estado:** ✓ verificado este día contra código o fuente real · — no releído línea por línea esta sesión, contenido asumido vigente por ausencia de señal en contrario · ⚠ contiene un gap o advertencia conocida, ver nota · 🔜 insumo para trabajo futuro, no accionable hoy.

---

## 1. Protocolo y gobernanza de equipo

| Documento | Ubicación | Qué contiene | Estado |
|---|---|---|---|
| `CLAUDE.md` | raíz del repo | Protocolo de sesión, flujo de trabajo obligatorio, matriz de roles del equipo (Fernando/Claude/Codex/Claude Code), guardianía doctrinal | ✓ |
| `README.md` | raíz del repo | Memorando de sucesión — formaliza a Claude como Arquitecto Senior, reemplazando a ChatGPT | ✓ |
| `AGENTS.md` | raíz del repo | Configuración de agentes Codex | — |
| `docs/codex.md` | `docs/` | Configuración/protocolo de Codex CLI | — |
| `CHANGELOG.md` | raíz del repo | Historial de versiones del producto | — |

---

## 2. Doctrina y arquitectura del producto (autoridad vigente)

| Documento | Ubicación | Qué contiene | Estado |
|---|---|---|---|
| `CONTRATO_ARQUITECTURA.md` | raíz del repo | Identidad fundacional del producto, modelo mental, anti-ERPización, mapa de dominios | — |
| `docs/DOCTRINA.md` | `docs/` | Doctrina operacional única — naturaleza del producto, principios irrenunciables, anti-patrones, modelo de operación humana. Consolida 19 documentos archivados | ✓ |
| `docs/ARQUITECTURA_UX.md` | `docs/` | Jerarquía real del runtime, contrato de `SheetWork`, color verificado por módulo, semántica de color. Consolida 3 documentos archivados | ✓ |
| `docs/03-arquitectura/ARQUITECTURA_SYNC.md` | `docs/03-arquitectura/` | Arquitectura de sincronización offline-first (cola de eventos, Nexo, rutas LAN/.dsync, failover). Todas las fases marcadas Pendiente — diseño aprobado, sin implementar | ✓ |

---

## 3. Glosario, estándares y decisiones

| Documento | Ubicación | Qué contiene | Estado |
|---|---|---|---|
| `docs/00-governance/GLOSARIO.md` | `00-governance/` | Término único y canónico por concepto — entidades, convenciones de naming, storage keys, roles operacionales, entidades FARMACIA y Cash/Operador | ✓ |
| `docs/00-governance/ESTANDARES_TECNICOS.md` | `00-governance/` | SOLID, Clean Code, DRY, KISS, YAGNI, normalización, CI/SemVer — obligatorio en todo prompt a Codex | — |
| `docs/00-governance/BITACORA_DECISIONES.md` | `00-governance/` | Decisiones activas (PENDIENTE/A EVALUAR) | ✓ |
| `docs/00-governance/BITACORA_HISTORICA.md` | `00-governance/` | Decisiones cerradas — no se lee por defecto | — |

---

## 4. Estado de sesión

| Documento | Ubicación | Qué contiene | Estado |
|---|---|---|---|
| `docs/context/CURRENT_CONTEXT.md` | `context/` | Último commit, estado de módulos, pendientes inmediatos. Se purga cada sesión | ✓ |

---

## 5. Arquitectura de dominio

| Documento | Ubicación | Qué contiene | Estado |
|---|---|---|---|
| `docs/architecture/bloque-operacional.md` | `architecture/` | Documento autoridad de Bloque Operacional — composición determinista, ciclo de vida, reglas de apertura secuencial/excepcional | ✓ |
| `docs/architecture/cash-turno-operational-model.md` | `architecture/` | Modelo operacional de Turnos | — |
| `docs/architecture/cash-movements-model.md` | `architecture/` | Movimientos de caja | — |
| `docs/architecture/cash-close-flow.md` | `architecture/` | Flujo de cierre de caja | — |
| `docs/architecture/cash-runtime-recovery.md` | `architecture/` | Recuperación operacional del runtime de caja | — |
| `docs/architecture/CONTEXTUAL_OPERATIONAL_MODEL.md` | `architecture/` | Modelo de contexto operacional | — |
| `docs/architecture/login-runtime-architecture.md` | `architecture/` | Arquitectura del runtime de login | — |
| `docs/architecture/printing-architecture.md` | `architecture/` | Arquitectura de impresión ESC/POS | — |
| `docs/architecture/inventory/*` (2 archivos) | `architecture/inventory/` | Arquitectura especulativa de INVENTARIOS | 🔜 en pausa explícita, desconectada de implementación real |
| `docs/architecture/purchases/*` (3 archivos) | `architecture/purchases/` | Arquitectura especulativa de COMPRAS | 🔜 en pausa explícita, desconectada de implementación real |

---

## 6. Sistema de diseño

| Documento | Ubicación | Qué contiene | Estado |
|---|---|---|---|
| `docs/design-system/colors.md` | `design-system/` | Paleta de colores por módulo | ⚠ contiene valores incorrectos verificados (VENTAS, TURNO) — usar `ARQUITECTURA_UX.md` §Color por módulo como fuente real |
| `docs/design-system/visual-philosophy.md` | `design-system/` | Filosofía visual — Modern Operational UI | ⚠ contiene un error verificado (VENTAS descrito como azul; es verde `#45b356`) |
| `docs/design-system/spacing-density.md` | `design-system/` | Sistema de spacing, densidad operacional, ritmo espacial, reglas de SheetWork/Sections/Blocks | ✓ leído completo, sin contradicciones encontradas |

---

## 7. Metodología y descubrimiento (insumo, no doctrina cerrada)

| Documento | Ubicación | Qué contiene | Estado |
|---|---|---|---|
| `docs/foundations/METODO_DESCUBRIMIENTO_OPERACIONAL.md` | `foundations/` | Método de auditoría operacional — preguntas, prueba de persistencia, señales de advertencia | ✓ |
| `docs/foundations/DESCUBRIMIENTOS_OPERACIONALES.md` | `foundations/` | Registro de 13 descubrimientos + exploración provisional de "Habilitación Operacional de Venta" / "Valor Operacional Asociado" | 🔜 contiene el origen conceptual probable de `FormaVenta` — leer antes de la sesión de rediseño de VENTAS |

---

## 8. Entorno de desarrollo

| Documento | Ubicación | Qué contiene | Estado |
|---|---|---|---|
| `docs/02-workflow/entorno-dev.md` | `02-workflow/` | Herramientas, filosofía y políticas del entorno de desarrollo local | — nota: nombre de carpeta duplica conceptualmente `docs/workflow/`, hoy vacía tras archivado. Sin acción tomada, solo señalado |

---

## 9. Archivo — no se lee por defecto

| Ubicación | Qué contiene |
|---|---|
| `docs/_obsoleto/` | 36 documentos reemplazados, fusionados o desactualizados. Mapeo completo en `docs/_obsoleto/README.md` |
| `docs/00-governance/BITACORA_HISTORICA.md` | Decisiones cerradas |

---

## Huecos conocidos, no resueltos hoy

- `docs/architecture/inventory/` y `docs/architecture/purchases/` no se auditaron esta sesión — especulativos por declaración previa de Fernando.
- Los `architecture/cash-*.md`, `login-runtime-architecture.md`, `printing-architecture.md` no se releyeron línea por línea hoy — se asumen vigentes por ausencia de señal en contrario, no por verificación activa.
- `docs/02-workflow/` vs `docs/workflow/` (ahora vacía) es una duplicación de nombre sin resolver — no se tocó por no estar en el alcance pedido.

---

*Documento generado por el Comité de Arquitectura — Junio 2026.*
