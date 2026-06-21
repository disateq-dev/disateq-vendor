# docs/_obsoleto/ — Documentación reemplazada

Archivo de documentos **reemplazados**, movidos aquí el 21-jun-2026 durante
la consolidación documental. Nada se elimina — mismo principio ya aplicado
en `BITACORA_HISTORICA.md`: se preserva el razonamiento histórico, no se
acumula por defecto en cada lectura.

**Regla — NO se leen de forma rutinaria.** Ningún archivo bajo esta carpeta
forma parte del flujo de información activo del proyecto. Claude no los lee
al iniciar sesión, no los usa como fuente para diagnóstico, diseño ni
auditoría, y no los cita como vigentes. Se consultan únicamente si una
auditoría futura necesita el razonamiento original detrás de un documento ya
reemplazado.

## Qué reemplazó a qué

**Consolidados en `docs/DOCTRINA.md` (14):**
`00-governance/{principios,reglas}.md`, `01-vision/{filosofia,principios,vision}.md`,
`03-frontend/ux-pos-operacional.md`, `06-ux/{principios-ux,resolucion-operacional}.md`,
`philosophy/{ANTI_PATTERNS,EVOLUTION_AND_CONSOLIDATION,HUMAN_OPERATION_MODEL,
OPERATIONAL_DOCTRINE,UNIVERSAL_OPERATIONAL_PATTERNS,UX_OPERATIONAL_PRINCIPLES}.md`

**Consolidados en `docs/ARQUITECTURA_UX.md` (3):**
`03-arquitectura/arquitectura.md`,
`design-system/{operational-visual-architecture,uix-design-system-foundations}.md`

**Vacíos o auto-marcados obsoletos antes de archivar, sin contenido que
migrar (12):**
`00-governance/{convenciones,decisiones,versionado,workflow}.md`,
`architecture/documentation/documentation-standards.md`,
`design-system/{foundations,radius-system,typography}.md`,
`operational/{02_ACTIVE_RUNTIME_CONTEXT,03_CURRENT_PHASE,04_ARCHITECTURE_CONTEXT}.md`,
`recovery/context-restoration.md`

**Fusionado en `docs/00-governance/GLOSARIO.md` (1, archivado 21-jun-2026 en
ronda separada):**
`philosophy/DOMAIN_LANGUAGE.md` — las entidades Cash/Operador (Alias
Operacional, Código Operador, Rol, AsignacionBloque, Bloque Operacional,
TipoCaja) pasaron a `GLOSARIO.md` §1. La doctrina general (Conceptos
Oficiales, Reglas de Naming) se descartó por solaparse con `DOCTRINA.md`;
"IA y Lenguaje" quedó cubierto en `CLAUDE.md` §5.

**Fosiles de gobernanza/protocolo desactualizados, sin fusión —
contradecían el equipo y protocolo vigentes (6, archivados 21-jun-2026):**
`00-governance/ia-governance.md` — describía el equipo previo al memorando
de sucesión (`Humano → ChatGPT Arquitecto → Claude Code Constructor →
Codex Auditor`), contradicho por `README.md` y `CLAUDE.md` §5 vigentes.
`workflow/{README,session-boot,session-close}.md` y
`operational/{00_COMMANDS,01_BOOT_OPERATIONAL}.md` — protócolo de sesión
paralelo (palabras de comando "Vamos"/"Hecho"/"Confirmo"/"Alto") que
`CLAUDE.md` no usa ni referencia — mecánica de confirmación actual vive solo
en `CLAUDE.md` §3.

36 archivos en total. Estructura de subcarpetas preservada igual a su
ubicación original dentro de `docs/`.
