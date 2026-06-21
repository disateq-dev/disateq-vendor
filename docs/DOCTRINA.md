# DOCTRINA — DISATEQ VENDOR™

## Estado del documento

Documento autoridad permanente. Creado 21-jun-2026.

Consolida 19 documentos que repetían, con variaciones cosméticas, el mismo
cuerpo doctrinal: `00-governance/{principios,reglas}.md`,
`01-vision/{filosofia,principios,vision}.md`, `03-frontend/ux-pos-operacional.md`,
`06-ux/{principios-ux,resolucion-operacional}.md`,
`philosophy/{ANTI_PATTERNS,EVOLUTION_AND_CONSOLIDATION,HUMAN_OPERATION_MODEL,
OPERATIONAL_DOCTRINE,UNIVERSAL_OPERATIONAL_PATTERNS,UX_OPERATIONAL_PRINCIPLES}.md`.

Cada principio se escribe aquí una sola vez. Los 19 documentos de origen
quedaron obsoletos — archivados en `docs/_obsoleto/` (ver
`docs/_obsoleto/README.md`), no eliminados.

**Nota de transparencia (auditoría 21-jun-2026):** un ítem de la sección 4
("Catálogo-centric design") no proviene de los 19 archivos listados —
proviene de `CONTRATO_ARQUITECTURA.md` ("Anti Catalogo-Centrismo"),
documento previo a esta consolidación. Es doctrina válida, pero esta cabecera
debía decirlo.

No se consolidan aquí (van por otro camino, ya decidido):
`philosophy/DOMAIN_LANGUAGE.md` (fusión directa a `GLOSARIO.md`), los 5
documentos especulativos de INVENTARIOS/COMPRAS (`architecture/inventory/*`,
`architecture/purchases/*` — en pausa explícita), e `ia-governance.md` /
`visual-philosophy.md` §13 (organigrama obsoleto, corrección puntual aparte,
no consolidación doctrinal).

---

## 1. Naturaleza del producto

DISATEQ VENDOR™ es software operacional con identidad: runtime operacional
persistente, moderno, desktop-first, offline-first y evolutivo, diseñado
para pequeños negocios reales peruanos (farmacias, food service, ferretería,
óptica) que operan bajo conectividad irregular, hardware humilde y
contingencias reales.

**NO busca ser:** ERP enterprise complejo, dashboard SaaS genérico, sistema
administrativo inflado, plataforma dependiente completamente de cloud, POS
aislado, catálogo de productos con movimientos anexos, gestor documental,
sistema de formularios.

**SÍ busca:** continuidad operacional contextual, flujo operacional causal,
simplicidad operacional visible, complejidad encapsulada, control
contextual, flexibilidad auditable, reconciliación operacional,
progresividad funcional, UX operacional moderna.

**Principio rector:** "De lo operacionalmente necesario a lo funcionalmente
elaborado sin perder trazabilidad, control, normatividad y seguridad."

El diferencial del producto no es la facturación electrónica ni la
integración SUNAT — es continuidad operacional real bajo condiciones
comerciales peruanas reales. DISATEQ Vendor™ y DisateQ Integrador CPE™ son
sistemas desacoplados: la operación comercial nunca depende completamente de
SUNAT, conectividad o servicios externos.

---

## 2. Principios operacionales irrenunciables

- **Continuidad operacional** — la operación nunca debe detenerse
  innecesariamente. Toda decisión de UX, runtime, persistencia,
  sincronización o arquitectura prioriza continuidad operacional real.
- **Offline-first real** — la conectividad es una optimización, nunca un
  requisito. El sistema opera, persiste localmente y resuelve sincronización
  diferida sin depender de internet.
- **Runtime operacional persistente** — el sistema se siente como un único
  entorno continuo. Nunca como navegación multipágina, dashboards
  desconectados o módulos aislados.
- **Keyboard-first** — toda operación frecuente se resuelve rápido por
  teclado, sin dependencia excesiva del mouse.
- **Scanner-native** — el escáner es extensión natural del runtime: foco
  persistente, velocidad inmediata, mínima interrupción visual.
- **Touch-compatible, no touch-first** — la compatibilidad táctil existe sin
  degradar densidad operacional ni velocidad keyboard-first.

  > **Contradicción entre fuentes, resuelta y confirmada por Fernando
  > (21-jun-2026):** `06-ux/principios-ux.md` declaraba "Touch-first" sin
  > matiz; `03-frontend/ux-pos-operacional.md` declaraba explícitamente
  > "touch-compatible, pero NO touch-first... NO como geometría principal
  > del sistema". Fernando confirmó la segunda versión como correcta —
  > "Touch-first" en `principios-ux.md` quedó superado en el camino de
  > consolidación de conceptos del propio proyecto, no es un error de esta
  > auditoría. Cierra como definitivo, no como pendiente.
- **Densidad operacional** — información útil sin saturación. Evitar
  whitespace excesivo, cards infladas, layouts inflados, dashboardización.
- **Hardware humilde como identidad arquitectónica**, no limitación
  secundaria — laptops básicas, mini PCs, equipos compartidos son la
  realidad del mercado objetivo. Validación UX base en 1366×768 antes que en
  monitores grandes.
- **Baja fricción cognitiva** — simple no significa limitado. Significa
  rápido, claro, natural, con menor carga cognitiva.
- **Complejidad encapsulada** — la sofisticación pertenece a la
  arquitectura. Nunca se traslada innecesariamente al operador.
- **Escalabilidad progresiva** — el sistema evoluciona hacia múltiples
  equipos, sincronización y administración centralizada sin romper
  simplicidad ni continuidad operacional.

---

## 3. Modelo evolutivo

```
operación real
  ↓ dolor operacional
  ↓ solución mínima operativa
  ↓ validación runtime
  ↓ reconciliación / control
  ↓ sofisticación progresiva
  ↓ consolidación doctrinal
  ↓ estabilización
```

DISATEQ **no** evoluciona mediante reconstrucción constante, reescritura
ideológica, enterprise inflation, acumulación indiscriminada de features,
complejidad preventiva o arquitectura especulativa.

**Consolidar antes de expandir.** Antes de crear nuevos módulos, expandir
arquitectura o generar documentación nueva: consolidar autoridad, eliminar
drift, estabilizar naming, validar runtime real.

**Validación en runtime real, no en teoría.** La validación principal ocurre
en operación contextual y flujo operacional vivo — no en diagramas ni
abstracción conceptual. La teoría nunca reemplaza la validación práctica.

**Repo real manda.** Toda decisión verifica runtime real, inspecciona el
repo real, valida implementación real por encima de teoría abstracta. Caso
de referencia vivo de esta regla: la jerarquía `SubContextBar`/`Footbar`
documentada en arquitectura nunca se contrastó contra lo que cada sesión
construía — nueve módulos independientes convergieron en un patrón distinto
sin coordinarse entre sí, evidencia de que el repo real, no el documento,
reflejaba la necesidad operacional real (ver `ARQUITECTURA_UX.md`).

**Depuración contextual.** La documentación se mantiene vigente, evita
redundancia, archiva historia útil sin eliminarla, y elimina contexto
contaminante. No se crean documentos redundantes, vacíos, especulativos o
artificiales — todo documento debe justificar autoridad, utilidad
operacional y continuidad conceptual.

---

## 4. Anti-patrones oficiales

Lista única — antes repetida, con variaciones cosméticas, en seis documentos
distintos.

- **ERPización accidental** — exceso de validaciones, workflows rígidos,
  formularios administrativos gigantes, arquitectura centrada en control y
  no en operación.
- **Warehouse-centric / inventory-centric / master-data-centric design** —
  modelar disponibilidad operacional como logística clásica rígida.
- **Dashboard-heavy UX** — priorizar dashboards administrativos sobre
  operación contextual real; dashboards SaaS vacíos.
- **CRUD-first / CRUD operacional tradicional visible** — exponer el
  paradigma Crear/Editar/Listar tal cual al operador, en vez de traducirlo a
  contexto y evento.
- **Catálogo-centric design** — recursos que existen por registro maestro
  aislado, no por participar en una operación real.
- **Complejidad prematura / arquitectura especulativa** — sofisticación o
  boundaries artificiales antes de validación operacional real.
- **Validación obstructiva permanente / control paralizante** — bloquear
  operación legítima por rigidez preventiva extrema.
- **Naming ERP heredado** sin validación de coherencia doctrinal.
- **Complejidad visible** — exponer complejidad sistémica innecesariamente
  al operador en vez de encapsularla en la arquitectura.
- **UX desacoplada de operación** — diseñar interfaz por tendencia visual
  en vez de por operación real.
- **Context inflation** — documentos redundantes, prompts gigantes,
  filosofía repetida, contexto fósil.
- **Modularización ERP artificial** — silos administrativos rígidos que
  rompen causalidad operacional.
- **Mobile-first accidental, tabletización innecesaria, toolbarización
  excesiva, modalitis, overlays invasivos, wizardización innecesaria.**
- **Enterprise inflation** — patrones enterprise antes de validación
  operacional real comprobada.

---

## 5. Modelo de operación humana

DISATEQ modela operación humana real, no operación idealizada. La operación
humana cambia constantemente, tiene urgencias, contiene diferencias y exige
continuidad incluso sin consistencia absoluta previa.

**Exactitud progresiva.** No toda diferencia exige bloqueo inmediato o
interrupción operacional. La consistencia puede converger después mediante
reconciliación, trazabilidad y causalidad observable.

**Flexibilidad auditable.** Válida únicamente cuando existe trazabilidad,
responsabilidad observable y causalidad contextual. Nunca se convierte en
informalidad invisible ni pérdida de control.

**Control no obstructivo.** El control protege la operación; no la
paraliza.

**Responsabilidad observable.** Toda acción operacional relevante deja
causalidad observable, mantiene trazabilidad y permite auditoría.

**El operador no administra complejidad sistémica — opera.** La
complejidad pertenece a la arquitectura, el control, la trazabilidad y la
convergencia operacional, nunca al flujo operacional visible.

---

## Nota de archivo

Los 19 documentos fuente listados en "Estado del documento" quedaron
**obsoletos** desde este documento. Decisión de Fernando (21-jun-2026):
archivados, no eliminados — movidos a `docs/_obsoleto/` (ver
`docs/_obsoleto/README.md`). No forman parte del flujo de información activo;
no se leen por defecto ni se citan como vigentes.
