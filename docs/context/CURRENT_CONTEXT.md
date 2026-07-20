# CURRENT_CONTEXT — DISATEQ Vendor™
**Ultima actualizacion:** 2026-07-20
**Ultimo commit:** `7120017` — feat(navbar): reorganizar grupos separadores + AUDITORIA como proximamente
**Rama:** `main`
**Working tree:** LIMPIO

---

## HISTORIAL DE COMMITS (sesion 2026-07-19/20)

| Commit | Descripcion |
|---|---|
| `7b74df0` | fix(config+login): placeholder PIN legible, contador digitos, confirmacion persistente |
| `086f3d0` | chore(rust): consolidar estado commands y db de sesiones anteriores |
| `3f29a1b` | fix(rust/pin): migrar comandos PIN a DbInstances + UPSERT seguro en config_establecimiento |
| `a015941` | chore(login): eliminar comentarios de seccion y ambiente de desarrollo |
| `7edc8d8` | feat(navbar): preview fila2 en hover, toggle colapso, ArrowDown/Up, eliminar ModulesBar |
| `a398345` | feat(shell): estado inicial null, HomeWorkspace, estilos fila1 reposo/hover/activo |
| `7120017` | feat(navbar): reorganizar grupos separadores + AUDITORIA como proximamente |

---

## ACCION INMEDIATA AL RETOMAR

Working tree limpio. No hay archivos pendientes de commit.

**Pendientes operacionales:**
- Detalles menores de la barra de opciones — Fernando los anotara al cierre de pruebas
- P3: Auditoria UX modulo por modulo — objetivo produccion
- P4: supervision-authorization.service.ts — migracion a SQLite

---

## PENDIENTES EN ORDEN

| Prioridad | Item | Estado |
|---|---|---|
| P1 | Detalles menores navbar — barra de opciones | Detectados en prueba, pendiente lista de Fernando |
| P2 | Auditoria UX modulo por modulo — objetivo produccion | Pendiente |
| P3 | supervision-authorization.service.ts — migracion a SQLite | Pendiente |

---

## ESTADO DE LA NAVBAR (Faena 45 — cerrada)

**Comportamiento mouse confirmado OK:**
- Estado inicial null: app carga sin modulo activo, area de trabajo en blanco (HomeWorkspace)
- Fila 1 reposo: icono color canonico, texto #201E1E opacidad 70%, fondo transparente
- Fila 1 hover: fondo ${accent}0D (5%), borde inferior accent, texto #201E1E
- Fila 1 activo: fondo ${accent}1A (10%), borde inferior accent, texto #201E1E
- Preview fila 2 en hover: hover sobre modulo con secundarias muestra SUS subopciones temporalmente
- Toggle fila 2: click en modulo activo colapsa/expande fila 2 sin cambiar workspace
- AUDITORIA: placeholder "Proximamente", opacidad 0.3, tieneAcceso=false siempre

**Comportamiento teclado:**
- Ctrl+Space: activa modo navegacion
- ArrowLeft/Right: navega entre modulos
- ArrowDown: expande fila 2 si el modulo tiene secundarias
- ArrowUp: colapsa fila 2 y vuelve a fila 1
- Enter: activa modulo / confirma subopcion
- Escape: colapsa fila 2 o desactiva modo navegacion

**Grupos y separadores (orden canonico):**
- Grupo 1: TURNO + VENTAS (separador despues de VENTAS)
- Grupo 2: ABASTECIMIENTO (separador despues de ABASTECIMIENTO)
- Grupo 3: CLIENTES + COMPROBANTES + REPORTES + AUDITORIA (separador despues de AUDITORIA)
- Grupo 4: AJUSTES

**MODULES_ORDER canonico:**
  cash, sales, abastecimiento, clientes, comprobantes, reportes, auditoria, config

**AUDITORIA:**
- Color: #7B6EA0
- Icono: Shield (lucide-react)
- Label: AUDITORIA
- Acceso: false (siempre — placeholder hasta implementacion UI)
- Tooltip: "Proximamente"
- Workspace: pendiente (AuditoriaWorkspace — tabla auditoria_operacion ya existe en SQLite)

---

## DIRECTIVA ESTRATEGICA ACTIVA

**SQLite como unica fuente de verdad** — localStorage eliminado de todos los flujos de negocio criticos.
**Cero soluciones temporales** — cada decision se toma como si fuera la que llega a produccion.
**Sistema de diseno canonico activo** — paleta de modulos aprobada y congelada.
**Multi-rubro por defecto** — antes de disenar o modificar cualquier componente, servicio, tabla o
flujo, contrastar explicitamente si el cambio es universal (todos los rubros) o especifico de rubro.
Lo universal va en dominios/componentes transversales. Lo especifico va bajo su rubro. Nunca mezclar.

---

## Estado de migraciones SQLite

| Version | Contenido | Estado |
|---|---|---|
| v1-v23 | Ver historial anterior | OK |
| v24 | auditoria_operacion (multi-rubro) + 3 cols PIN autorizacion en config_establecimiento | OK |

---

## Faenas completadas (historial relevante)

### Faena 40 OK — Sistema de diseno shell: paleta canonica · commit 964243f

**Paleta canonica aprobada y congelada:**

| Modulo | Token accent | Token bg | Accent | BG |
|---|---|---|---|---|
| TURNO | --dv-mod-turno | --dv-mod-turno-bg | #B5741A | #FDF6EE |
| VENTAS | --dv-mod-ventas | --dv-mod-ventas-bg | #0D7A6E | #E8F5F3 |
| ABASTECIMIENTO | --dv-mod-abastecimiento | --dv-mod-abastecimiento-bg | #4A7C2F | #F0F7EC |
| CLIENTES | --dv-mod-clientes | --dv-mod-clientes-bg | #1A6BB5 | #EBF4FF |
| REPORTES | --dv-mod-reportes | --dv-mod-reportes-bg | #5A4DB8 | #F3F1FB |
| COMPROBANTES | --dv-mod-comprobantes | --dv-mod-comprobantes-bg | #9B3E7A | #F7F0F5 |
| CONFIG | --dv-mod-config | --dv-mod-config-bg | #5C6478 | #F4F4F6 |
| AUDITORIA | (nuevo) | (nuevo) | #7B6EA0 | pendiente token |

**Decisiones de shell consolidadas:**
- Topbar #0f1f3d — ancla oscura permanente, no tocar
- StatusBar #0f1f3d — mismo marco que Topbar
- Contenido sobre var(--dv-surface-base) #F7F5F1 calido
- MODULE_BG eliminado de OperationalBar.tsx — los fondos viven solo en index.css
- Topbar title: "Cerrar sesion"

### Faena 41 OK — Navbar dos filas · commits 728f91f + 7edc8d8 + a398345 + 7120017

**Estado final verificado en prueba por Fernando.**
Ver seccion ESTADO DE LA NAVBAR arriba para detalle completo.
Detalles menores pendientes de lista al cierre de pruebas.

### Faenas 42-43 OK — LoginScreen + PIN Autorizacion + Auditoria · commit 2ef9f5e

**Faena 42 — LoginScreen auditado y corregido:**
- PC_MOTIVOS: 4 motivos canonicos operacionales
- Selector operadores: solo alias visible
- Textos: Salir, Cambiar PIN, Confirmar cambio, Volver
- Hover boton Salir: --dv-color-exit naranja
- Campo Codigo de Autorizacion: type=password, inputMode=numeric, maxLength=6, validacion ^\d{6}$

**Faena 43 — PIN Autorizacion SQLite + Dominio Auditoria:**
- migrar_v24: tabla auditoria_operacion + cols PIN en config_establecimiento
- 4 comandos Tauri: configurar/obtener/verificar pin + registrar auditoria
- pin-autorizacion.store.ts: migrado de localStorage a SQLite
- domains/auditoria/auditoria.service.ts: dominio transversal multi-rubro
- LoginScreen y ConfigWorkspace conectados a verificacion real

### Faena 44 OK — Fixes UX PIN + limpieza LoginScreen · commits 7b74df0 + a015941 + 3f29a1b

- Placeholder campos PIN: texto legible
- Contador N/6 en labels de ConfigWorkspace
- Banner confirmacion persistente post-guardado en ConfigWorkspace
- 4 comandos Rust PIN migrados a DbInstances + UPSERT seguro
- LoginScreen.tsx: 18 comentarios de seccion eliminados
- PIN probado en runtime: OK

### Faena 45 OK — Navbar comportamiento operacional · commits 7edc8d8 + a398345 + 7120017

- Preview fila 2 en hover (variable derivada expandidoVisible, sin nuevo estado)
- Toggle fila 2 al click en modulo activo
- ArrowDown/ArrowUp teclado para expandir/colapsar fila 2
- Eliminacion de ModulesBar.tsx (huerfano)
- Estado inicial null + HomeWorkspace (area de trabajo en blanco)
- Estilos fila 1: reposo/hover/activo con densidades de fondo diferenciadas
- Reorganizacion de grupos y separadores
- AUDITORIA como placeholder "Proximamente"
- Prueba en runtime: OK (detalles menores pendientes)

---

## Estado de deuda tecnica vigente

### Diferido aceptable
- accesosStore — bitacora en localStorage — migracion futura
- supervision-authorization.service.ts — autorizaciones en localStorage (P3)
- F2 — doble movimiento despacharConFefo — diferido
- BOX_DEFS estatico en useCaja.ts — diferido
- D-PRECIOS-1 — precio por lote — diferido
- Subopciones ABASTECIMIENTO — hardcodeadas para farmacia, dinamizar antes del 2do rubro
- AuditoriaWorkspace — UI de consulta pendiente (tabla existe, UI futura)
- Token CSS --dv-mod-auditoria pendiente en index.css

### Deudas de naming — GLOSARIO 8 (baja prioridad)
- ActualizarProveedorInput -> ModificarProveedorInput
- TicketLineDTO / TicketLineBridge -> LineaPreVenta
- emitidoPor -> operadorId
- disponible/bajo_stock/agotado -> mayusculas

---

## Arquitectura de referencia rapida

**Monorepo:** D:\DisateQ-DEV\Proyectos\disateq-vendor
**TS check:** npx tsc -p tsconfig.app.json --noEmit desde apps/vendor-desktop
**Cargo check:** desde apps/vendor-desktop/src-tauri
**Git:** git -C "D:\DisateQ-DEV\Proyectos\disateq-vendor" [comando]

**Tauri 2 — regla critica:**
Invoke params en camelCase desde JS -> Tauri convierte a snake_case para Rust.

**Tokens de color de accion (inmutables):**
- --dv-color-new: #45b356 — iniciar accion nueva
- --dv-color-confirm: #3B6B34 — confirmar accion
- --dv-color-danger: #DC2626 — destructivo
- --dv-color-exit: #B85C10 — salir/cancelar reversible

**Roles canonicos del sistema:**
- ADMIN — Administrador (acceso total)
- GES — Gestor (supervision e intervencion operacional)
- SOP — Soporte (diagnostico tecnico)
- VEN — Ventas (operacion de caja y venta)
- MAESTRO / SOPORTE — operadores SISTEMA (estado SISTEMA, indestructibles)
- No existe rol SUPERVISOR — concepto absorbido por GES

**Reglas de apertura de sesion:**
1. Leer este archivo antes de cualquier accion.
2. Auditar archivos desde filesystem — nunca asumir desde memoria.
3. No avanzar sin confirmacion explicita de Fernando.
4. Git: siempre git add explicito, nunca -am.
5. Reescribir este archivo completo al cerrar sesion.
6. Al cerrar modulo: ejecutar mapa de integridad de flujos (Rule #6).
7. Multi-rubro: antes de cualquier cambio, contrastar si es universal o especifico de rubro.

**CRITICO — .env.build:**
- apps/vendor-desktop/src-tauri/.env.build
- Contenido: DISATEQ_SYSTEM_PIN=<valor alfanumerico>
- Nunca commitear — protegido por .gitignore

---

## Dominio Auditoria — referencia rapida

**Ubicacion:** src/domains/auditoria/auditoria.service.ts
**Tabla SQLite:** auditoria_operacion
**Convencion:** sin prefijo = universal, prefijo RUBRO_ = especifico de rubro
**Campos:** rubro, dominio, tipo_operacion, operador_id, operador_alias, ejecutado_por, detalle (JSON), resultado
**Primer uso:** cambio de PIN en LoginScreen + configuracion en ConfigWorkspace

---

## Reset total del sistema (para pruebas)

```powershell
Remove-Item "$env:APPDATA\com.disateq.vendor\disateq.db"
```
