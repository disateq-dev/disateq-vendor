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

## 5. Cómo se construye — patrón verificado en la práctica

Consolidado 2026-07-27, tras la auditoría del flujo de ventas (H-C18/H-C19/
H-C20) que sirvió de evidencia viva para cada punto. Esta sección no impone
prácticas nuevas — nombra y fija lo que ya construyó y verificó el proyecto.

1. **El negocio real define la arquitectura, nunca al revés.** VENDOR es
   offline-first/desktop/SQLite porque el operador real trabaja con
   conectividad irregular y hardware humilde — no por preferencia
   tecnológica. Cualquier decisión de stack se justifica contra la condición
   real del usuario final, nunca contra moda técnica.

2. **Capas con responsabilidad única, nunca mezcladas.**
   `UI → hooks → servicios de dominio → store → puente SQLite → comando Rust`.
   Un componente de `modules/*` nunca conoce SQLite ni hashing. Señal de
   alarma: si un bug obliga a leer más de una capa para encontrarlo, la
   separación está rota.

3. **SQLite embebido como regla, `localStorage` como excepción justificada.**
   Todo dato de negocio permanente vive en SQLite desde el primer día.
   `localStorage` se reserva únicamente para estado de UI efímero (ej.
   progreso de un wizard). Precedente negativo activo: la base de clientes
   (H-C2) sigue en `localStorage` y está marcada como deuda crítica
   precisamente por esto.

4. **Migraciones siempre idempotentes, nunca destructivas.** Todo
   `ALTER TABLE` verifica `pragma_table_info` antes de ejecutar. Las
   migraciones ya escritas no se modifican — solo se agregan al final,
   numeradas (ver v29/v30 en `src-tauri/src/db/migrations.rs`).

5. **Ningún cálculo de dinero se declara correcto sin verificación en
   runtime real.** H-C19 (IGV duplicado desde el primer comprobante emitido)
   no se detectó leyendo código ni viendo la pantalla — se detectó cruzando
   dos datos reales en una venta de prueba real contra la fila persistida en
   SQLite. Regla: todo cálculo financiero se prueba de punta a punta antes de
   cerrarse como correcto.

6. **Ningún `try/catch` queda vacío sin justificación documentada.** El
   antipatrón nombrado y prohibido en `docs/codex.md`: un fallo que se traga
   en silencio deja el dato visual desincronizado del dato persistido. Misma
   causa raíz detrás de H-C4, H-C6, H-C16 y H-C17.

7. **Todo cambio es atómico, y lo audita alguien distinto de quien lo
   ejecutó.** Prompt de alcance exacto → ejecución (Codex u otro agente) →
   auditoría del archivo real en disco por el Arquitecto (Claude, y en
   prueba, Claude Code) — nunca se acepta un cambio solo por el reporte de
   quien lo hizo. `git commit` lo ejecuta siempre el Director de Producto.

   **Incidente registrado (2026-07-27):** esta misma regla se violó
   momentáneamente cuando el Arquitecto (Claude) escribió un archivo de
   gobernanza, recibió confirmación de éxito de la herramienta, y no
   releyó el archivo real antes de darlo por guardado — el archivo no
   había persistido. Detectado porque Fernando intentó moverlo con un
   comando de PowerShell y el sistema operativo reportó que no existía.
   Causa raíz identificada: coexistían dos servidores MCP de filesystem
   con nombres casi idénticos (`filesystem:*` y `Filesystem:*`), y una
   escritura se ejecutó contra el servidor equivocado sin que el mensaje
   de éxito lo distinguiera. Corrección adoptada de inmediato: ninguna
   escritura de archivo se declara exitosa sin una verificación de
   lectura inmediata, en el mismo turno, usando el mismo servidor con el
   que se escribió — y ante cualquier ambigüedad de herramienta duplicada,
   se detiene y se reporta en vez de reintentar a ciegas. Este incidente
   es la confirmación de por qué la regla existe — se aplica también hacia
   adentro, no solo a los cambios de Codex.

8. **Cero deuda técnica silenciosa.** Un hallazgo colateral descubierto
   fuera del alcance del prompt se numera y se agenda — nunca se descarta ni
   se pierde entre sesiones (patrón H-C16→H-C20, todos cerrados en la misma
   jornada en que se descubrieron).

9. **Documentación como código: una sola fuente de verdad por concepto.**
   Ya nombrado en la Sección 1 (DRY) como el hallazgo más caro del proyecto.
   Se generaliza: cada decisión de arquitectura vive en un solo documento de
   autoridad; lo demás se archiva, nunca compite por vigencia.

10. **Adopción de estándares de industria: explícita, nunca por inercia.**
    Ver Secciones 1-4 de este documento como el ejemplo vivo — se adopta lo
    que sirve a las condiciones reales del producto (SOLID, normalización,
    inyección SQL), se rechaza explícitamente lo que no aplica (Twelve-Factor
    App, OWASP completo) y se documenta el gatillo exacto que reabriría cada
    decisión diferida.

---
*Ver también `docs/00-governance/GLOSARIO.md` (naming) y
`docs/00-governance/BITACORA_DECISIONES.md` 2026-06-21 (contexto completo de
estas decisiones) y 2026-07-27 (instrumentalización de IA en el proceso de
construcción).*
