# DISATEQ Vendor — Claude Code Operational Core

## Operational Identity

DISATEQ Vendor is an operational commercial platform for small businesses operating in real-world Peruvian environments.

Core principles:

- offline-first
- operational continuity first
- simplicity over unnecessary complexity
- UX operational density over SaaS aesthetics
- humble hardware compatibility
- keyboard-first + scanner-first flows
- runtime validation over theoretical architecture

The operation must never stop.

---

## Operational Doctrine

DISATEQ Vendor follows a consolidated operational doctrine formalized in:

docs/philosophy/*

These documents are the doctrinal single source of truth for:

- operational continuity
- contextual control
- operational reconciliation
- operational UX/UI
- domain language
- anti-pattern detection
- operational evolution
- human operational modeling

Core doctrinal principles:

- operational continuity first
- visible operational simplicity
- encapsulated complexity
- auditable flexibility
- contextual control
- operational reconciliation
- progressive sophistication
- runtime-first validation
- real human operation modeling

Core anti-patterns:

- accidental ERPization
- warehouse-centric architecture
- speculative architecture
- premature complexity
- dashboard-heavy UX
- obstructive validation
- enterprise inflation
- operational bureaucracy

AI assistants must:

- preserve doctrinal coherence
- avoid semantic drift
- detect accidental ERP patterns
- protect operational UX consistency
- prioritize operational continuity
- avoid speculative abstractions

The architecture may be sophisticated.

Visible operational language must remain:
human, contextual, operational, and clear.

## Environment

Primary environment:

- Windows Terminal
- PowerShell 7
- VSCode
- Git
- Claude Code

Primary runtime:

- Tauri
- React
- TypeScript
- Vite

Repository root:

D:\DisateQ-DEV\Proyectos\disateq-vendor

Active app:

D:\DisateQ-DEV\Proyectos\disateq-vendor\apps\vendor-desktop

Primary validation target:

1366x768

Validate using real Tauri runtime.
Do NOT use browser runtime as primary UX reference.

---

## Active Frontend Architecture

Current active frontend structure:

src/
├── context/
├── domains/
├── layout/
├── modules/
├── print/

Current runtime flow:

main.tsx
→ App.tsx
→ layout/AppShell.tsx
→ modules/*
→ domains/*
→ context/*

Operational shell:

src/layout/AppShell.tsx

App.tsx acts as orchestration layer only.

---

## Current Architectural Direction

Current direction:

modules/*
↓
services/*
↓
store/*

Avoid direct store manipulation from UI modules when a service boundary exists.

Current active boundary:

src/domains/ticket/services/ticket.service.ts

Architecture must evolve incrementally.
Avoid large refactors.

---

## Workflow Rules

Mandatory workflow:

inspect real repo
→ understand current structure
→ micro-change
→ validate
→ runtime validation
→ consolidate
→ git status
→ commit
→ push
→ continue

The real repository always overrides assumptions.

Do NOT:

- invent architecture
- create parallel structures
- duplicate layouts
- introduce speculative abstractions
- overengineer
- rewrite unrelated modules

Prefer:

- micro-extractions
- surgical edits
- incremental consolidation
- runtime-first validation
- small validated steps

---

## AI Collaboration Rules

ChatGPT responsibilities:

- architecture
- operational continuity
- workflow direction
- UX/UI operational strategy
- consolidation
- boundary direction

Claude Code responsibilities:

- implementation
- runtime validation
- TypeScript/build fixes
- controlled extraction
- focused refactors
- wiring
- debugging

Codex responsibilities:

- audits
- technical review
- focused analysis

Human direction always overrides AI decisions.

---

## Token Efficiency Rules

Keep responses compact.

Avoid:

- repetition
- large explanations
- unnecessary summaries
- rewriting full files unnecessarily

Prefer:

- diffs
- targeted edits
- minimal output
- focused inspections

Use:

/compact
when:
- context becomes repetitive
- a microphase is completed
- changing technical focus
- context inflation appears

Use:

/cost
to monitor session usage.

/context
to inspect active context usage.

Keep sessions focused by domain.

---

## Communication Rules

Respond in Spanish by default.

Keep technical terminology, architecture terms, runtime concepts,
file names, APIs, TypeScript entities, and code identifiers in English
when appropriate.

Avoid unnecessary translations of technical concepts.

Prefer concise operational communication with high information density.

---

## Context Control Rules

Always ignore:

- node_modules
- dist
- target
- build artifacts
- logs
- binaries
- large generated files

Prefer .claudeignore for context control.

Do not scan the entire repository unless explicitly required.

Inspect only relevant operational areas.

---

## Runtime Validation Rules

Always validate:

- TypeScript
- runtime behavior
- keyboard flow
- operational continuity
- Tauri runtime
- 1366x768 operational layout

Never leave runtime broken.

Operational continuity has priority over architectural elegance.

---

## UX/UI Rules

DISATEQ is NOT:

- generic SaaS
- classic ERP
- empty minimalism
- dashboard-heavy software

DISATEQ IS:

- modern operational UI
- dense but ergonomic
- fast
- scanner-ready
- touch-aware
- keyboard-efficient
- operationally clear

Visual hierarchy must improve operational speed.

---

## What To Avoid

Avoid:

- overengineering
- enterprise architecture inflation
- unnecessary frameworks
- speculative systems
- massive rewrites
- duplicated structures
- context inflation
- architectural drift

Simple is not primitive.

Simple means:

- operational clarity
- low friction
- maintainability
- continuity
- speed

---

## Operational Commands

Primary runtime:

cd apps/vendor-desktop
npm run tauri dev

Recommended maintenance:

git status
git log --oneline -15

Recommended Claude workflow:

/compact
/cost
/context