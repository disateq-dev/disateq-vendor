# ESTÁNDARES TÉCNICOS — DISATEQ VENDOR™

## Cómo usar este documento
Antes de diseñar cualquier prompt para Codex, o de tomar cualquier decisión
técnica, consulta la sección pertinente: ¿toca código de aplicación? →
Sección 1. ¿toca SQLite/schema? → Sección 2. ¿maneja datos sensibles o
validación? → Sección 3. ¿toca CI, versión o despliegue? → Sección 4. Este
documento nombra explícitamente los marcos de referencia de la industria que
DISATEQ Vendor adopta, para que las convenciones ya en uso (CURRENT_CONTEXT.md,
docs/codex.md) tengan un porqué trazable.

## 1. Codificación y Arquitectura — adoptados completos
- **SOLID** — doctrina irrevocable desde 2026-06-19. Aplicado por capa:
  componente/hook/store/comando Rust = una responsabilidad.
- **Clean Code** — tipos explícitos siempre, sin `any`, nombres descriptivos,
  máx. ~150 líneas por archivo (ya en docs/codex.md §2).
- **DRY** — evitar duplicación, **incluyendo documentación, no solo código**.
  Hallazgo 2026-06-21: tres versiones independientes de la misma filosofía de
  proyecto fueron la violación de DRY más costosa detectada hasta ahora — más
  cara que cualquier duplicación de código encontrada.
- **KISS** — ya es la filosofía anti-ERP del proyecto con otro nombre.
- **YAGNI** — no construir capas o abstracciones especulativas hasta que
  aparezca necesidad real probada. Precedente: decisión SheetWork 2026-06-21
  (no se retrofiteó arquitectura especulativa; se extrajo solo cuando se
  confirmó necesidad real, ya resuelta ad hoc en VENTAS).

## 2. Base de Datos
- **Normalización** — ya doctrina (UUID v4 como ID único, sin claves
  naturales como PK, referencias por ID, no duplicar datos salvo en
  vistas/proyecciones de solo lectura).
- **Indexación** — NUEVO. Indexar columnas usadas frecuentemente en
  `WHERE`/`JOIN`/`ORDER BY`: claves foráneas, columnas de búsqueda de texto
  (nombre comercial, RUC), `fecha_vencimiento` para consultas FEFO. Verificar
  plan de consulta (`EXPLAIN QUERY PLAN`) antes de asumir que un índice es
  necesario — no indexar especulativamente.
- **Mínimo Privilegio** — reinterpretado para este proyecto: SQLite embebido
  no tiene grants de usuario tipo Postgres/MySQL. El equivalente real es el
  sistema de capacidades operacionales (roles VEN/GES/SOP/ADMIN,
  `useCapacidad`/`useCapacidades`) — qué operación puede invocar cada rol, no
  qué usuario de BD tiene qué permiso.
- **Cifrado en reposo** — PENDIENTE, decisión explícita de Fernando
  (2026-06-21): no exigir ahora. **Trigger de revisión obligatoria:** antes
  de cualquier release a producción con datos reales de un negocio cliente, o
  si el sistema empieza a almacenar datos personales sensibles más allá de
  RUC/razón social/datos de contacto comercial básicos.

## 3. Seguridad
- **Security by Design** — adoptado completo. Ya practicado informalmente
  (convención camelCase de Tauri, bind parameters de sqlx); ahora nombrado
  explícitamente como principio rector.
- **OWASP Top 10** — adopción PARCIAL, no el estándar completo. Aplican
  ahora: Inyección (ya cubierto — bind parameters posicionales obligatorios
  en sqlx, ver LECCIÓN APRENDIDA commit fc00277 en CURRENT_CONTEXT.md) y
  Exposición de Datos Sensibles (RUC, datos de negocio). El resto del Top 10
  (diseñado para superficie de ataque web) se reserva para cuando exista el
  backend Nexo de `03-arquitectura/ARQUITECTURA_SYNC.md`.

## 4. Escalabilidad y Despliegue
- **The Twelve-Factor App** — NO adoptado para el cliente Tauri (contradice
  por diseño offline-first/stateful de una sola instancia). Reservado para
  cuando se construya el backend Nexo (servicio cloud tradicional).
- **CI ligero** — ADOPTADO desde 2026-06-21. Pipeline automatizado en cada
  push: `npx tsc --noEmit` (desde `apps/vendor-desktop`) + `cargo check`
  (desde `apps/vendor-desktop/src-tauri`). Nota honesta: esto NO sustituye la
  auditoría manual de Claude — no detecta mismatches de casing en runtime ni
  errores de lógica de negocio, solo errores de compilación/tipos. CD
  (build/release automatizado) y tests de lógica de negocio (FEFO, cálculos
  de dinero) — diferidos a después de Alpha. Pendiente: crear el workflow
  real (ej. GitHub Actions) — esta entrada registra la decisión, no la
  implementación.
- **SemVer** — ADOPTADO desde 2026-06-21, empezando en `0.1.0` (Alpha, sin
  promesa de compatibilidad). Aplica a `package.json` de
  `apps/vendor-desktop`, `src-tauri/Cargo.toml` y `src-tauri/tauri.conf.json`
  — los tres deben mantenerse sincronizados al mismo número (verificado y
  alineado el 2026-06-21: los dos últimos ya estaban en `0.1.0` por defecto
  del scaffold de Tauri; `package.json` estaba en `0.0.0` y se corrigió).
  MAJOR: cambio que rompe compatibilidad o requiere intervención manual (ej.
  migración de schema no reversible). MINOR: feature nueva (módulo nuevo,
  flujo de creación embebida). PATCH: corrección de bug sin cambio de
  comportamiento esperado.

---
*Ver también `docs/00-governance/GLOSARIO.md` (naming) y
`docs/00-governance/BITACORA_DECISIONES.md` 2026-06-21 (contexto completo de
estas decisiones).*
