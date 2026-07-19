# CURRENT_CONTEXT — DISATEQ Vendor™
**Ultima actualizacion:** 2026-07-19
**Ultimo commit:** pendiente (ver abajo)
**Rama:** `main`
**Working tree:** SUCIO — 2 archivos modificados sin commitear

---

## COMMITS DE ESTA SESION

| Commit | Descripcion |
|---|---|
| `2ef9f5e` | feat(login+auditoria): faenas 42-43 — LoginScreen corregido + PIN autorizacion SQLite + dominio auditoria multi-rubro |
| pendiente | fix(config+login): placeholder PIN legible, contador digitos, confirmacion persistente post-guardado |

---

## ARCHIVOS CON CAMBIOS SIN COMMITEAR

Estos dos archivos tienen cambios aplicados directamente por el arquitecto, pendientes de commit:

**1. `apps/vendor-desktop/src/modules/config/ConfigWorkspace.tsx`**
- Placeholder "Ingresar 6 digitos" / "Confirmar 6 digitos" (reemplaza puntos)
- Contador N/6 en label mientras se escribe
- Estado `adminJustSaved` — banner verde persistente "PIN guardado correctamente" tras guardar
- El banner no desaparece hasta que el operador cambia de pantalla

**2. `apps/vendor-desktop/src/modules/login/LoginScreen.tsx`**
- Placeholders "4-6 digitos" en campos Nuevo PIN y Confirmar PIN de vista pin-change

**Accion pendiente al abrir nueva sesion:**
1. Ejecutar `npx tsc -p tsconfig.app.json --noEmit` desde `apps/vendor-desktop`
2. Si pasa: commit con mensaje `fix(config+login): placeholder PIN legible, contador digitos, confirmacion persistente post-guardado`
3. Continuar investigando el problema del PIN de autorizacion

---

## PROBLEMA ACTIVO SIN RESOLVER — PIN DE AUTORIZACION

**Sintoma:** En AJUSTES -> Operacion, el boton "CONFIGURAR PIN DE AUTORIZACION" permanece gris aunque visualmente se ven 6 puntos en ambos campos.

**Causa confirmada:** Los 6 puntos visibles son el placeholder `••••••` (ya corregido a texto), no digitos reales. El campo esta vacio. El boton gris es correcto.

**Estado tras los fixes de esta sesion:**
- Placeholder corregido a texto legible — el operador ya puede distinguir campo vacio de campo con datos
- Contador N/6 visible mientras escribe
- Banner de confirmacion persistente tras guardar exitosamente

**Pendiente verificar en nueva sesion:**
- Confirmar que tras los fixes el flujo completo funciona: escribir PIN -> boton se activa -> guardar -> banner verde aparece -> panel superior cambia a verde con fecha y operador
- Si el problema persiste despues de los fixes de placeholder, investigar si el comando Rust `configurar_pin_autorizacion` llega a ejecutarse (el UPDATE sin WHERE puede afectar 0 filas si config_establecimiento esta vacia)

**Sospecha adicional de arquitecto:** El `UPDATE config_establecimiento SET ...` sin clausula `WHERE id = ?` es correcto en SQLite cuando hay exactamente 1 fila, pero si `config_establecimiento` esta vacia (DB nueva, migracion v13 no corrio), el UPDATE afecta 0 filas y el hash nunca se guarda. Verificar que v13 corre antes que v24 en DB nueva.

---

## DIRECTIVA ESTRATEGICA ACTIVA

**SQLite como unica fuente de verdad** — localStorage eliminado de todos los flujos de negocio criticos.
**Cero soluciones temporales** — cada decision se toma como si fuera la que llega a produccion.
**Sistema de diseno canonico activo** — paleta de modulos aprobada y congelada al 18-jul-2026.
**Multi-rubro por defecto** — antes de disenar o modificar cualquier componente, servicio, tabla o flujo, contrastar explicitamente si el cambio es universal (todos los rubros) o especifico de rubro. Lo universal va en dominios/componentes transversales. Lo especifico va bajo su rubro. Nunca mezclar.

---

## Estado de migraciones SQLite

| Version | Contenido | Estado |
|---|---|---|
| v1-v23 | Ver historial anterior | OK |
| v24 | auditoria_operacion (multi-rubro) + 3 cols PIN autorizacion en config_establecimiento | OK |

---

## Faenas completadas (historial relevante)

### Faena 40 OK — Sistema de diseno shell: paleta canonica · commit 964243f

**Paleta canonica aprobada y congelada (18-jul-2026):**

| Modulo | Accent | BG |
|---|---|---|
| TURNO | #B5741A | #FDF6EE |
| VENTAS | #0D7A6E | #E8F5F3 |
| ABASTECIMIENTO | #4A7C2F | #F0F7EC |
| CLIENTES | #1A6BB5 | #EBF4FF |
| REPORTES | #5A4DB8 | #F3F1FB |
| COMPROBANTES | #9B3E7A | #F7F0F5 |
| AJUSTES | #5C6478 | #F4F4F6 |

**Decisiones de shell consolidadas:**
- Topbar #0f1f3d — ancla oscura permanente · no tocar
- StatusBar #0f1f3d — mismo marco que Topbar
- ModulesBar y contenido sobre var(--dv-surface-base) #F7F5F1 calido
- MODULE_BG eliminado de OperationalBar.tsx — los fondos viven solo en index.css
- Topbar title: "Cerrar sesion"

### Faena 41 OK — Navbar dos filas · commit 728f91f

**Fila 1 (siempre visible, h-44px):** todos los modulos, icono size=17 + label completo, acento en modulo activo, separadores entre grupos.
**Fila 2 (condicional, h-36px):** solo modulos en CON_SECUNDARIAS (cash, abastecimiento, config), fondo tintado ${accent}0D, pills de subopciones, HealthDot solo en config.
**VENTAS, CLIENTES, REPORTES, COMPROBANTES:** nunca muestran fila 2.
**Estado:** pendiente confirmacion visual de Fernando (P0 de proxima sesion).

### Faenas 42-43 OK — LoginScreen + PIN Autorizacion + Auditoria · commit 2ef9f5e

**Faena 42 — LoginScreen auditado y corregido:**
- PC_MOTIVOS: 4 motivos canonicos operacionales
- Selector operadores: solo alias visible
- Textos: Salir, Cambiar PIN, Confirmar cambio, Volver
- Hover boton Salir: --dv-color-exit naranja
- Uniformizacion de colores de foco, altos de botones entre las 3 vistas
- Campo Codigo de Autorizacion: type=password, inputMode=numeric, maxLength=6, validacion ^\d{6}$

**Faena 43 — PIN Autorizacion SQLite + Dominio Auditoria:**
- migrar_v24: tabla auditoria_operacion + cols PIN en config_establecimiento
- 4 comandos Tauri: configurar/obtener/verificar pin + registrar auditoria
- pin-autorizacion.store.ts: migrado de localStorage a SQLite
- domains/auditoria/auditoria.service.ts: dominio transversal multi-rubro
- LoginScreen y ConfigWorkspace conectados a verificacion real

### Faena 44 (parcial, sin commit) — Fixes UX PIN configuracion

- Placeholder campos PIN: puntos -> texto legible
- Contador N/6 en labels
- Banner confirmacion persistente post-guardado
- **Pendiente: tsc + commit en proxima sesion**

---

## Estado de deuda tecnica vigente

### Diferido aceptable
- accesosStore — bitacora en localStorage — migracion futura
- supervision-authorization.service.ts — autorizaciones en localStorage
- F2 — doble movimiento despacharConFefo — diferido
- BOX_DEFS estatico en useCaja.ts — diferido
- D-PRECIOS-1 — precio por lote — diferido
- Subopciones ABASTECIMIENTO en ModulesBar — hardcodeadas para farmacia, dinamizar antes del 2do rubro
- AuditoriaWorkspace — UI de consulta pendiente (tabla existe, UI futura)

### Deudas de naming — GLOSARIO 8 (baja prioridad)
- ActualizarProveedorInput -> ModificarProveedorInput
- TicketLineDTO / TicketLineBridge -> LineaPreVenta
- emitidoPor -> operadorId
- disponible/bajo_stock/agotado -> mayusculas

---

## Proxima ventana de trabajo

1. [P0 INMEDIATO] tsc + commit de los fixes de placeholder y banner de confirmacion
2. [P0] Verificar flujo completo de configuracion de PIN en app (escribir -> activar boton -> guardar -> ver banner verde)
3. [P0] Si sigue fallando: diagnosticar si UPDATE en config_establecimiento afecta 0 filas (DB vacia)
4. Confirmar o ajustar navbar dos filas (Faena 41)
5. Auditoria UIX modulo por modulo
6. supervision-authorization.service.ts — migracion a SQLite

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
