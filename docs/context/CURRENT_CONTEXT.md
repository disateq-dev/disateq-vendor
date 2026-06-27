# CURRENT CONTEXT — DISATEQ VENDOR™

## Branch & Commit
* **Branch:** `main`
* **Último commit:** `9c16d5b` — feat(catalogo): CORREGIR — condiciones operacionales editables con auditoria, motivo obligatorio, deteccion de cambio

## Commits de la jornada 27 Jun
| Hash | Descripción |
|---|---|
| `9c16d5b` | feat(catalogo): CORREGIR — condiciones operacionales editables con auditoria, motivo obligatorio, deteccion de cambio |
| `83bc40e` | feat(catalogo): correccion_catalogo — tabla auditoria v7, comando Rust corregir_datos_operacionales, tipos y service TS |
| `968f5fe` | fix(catalogo): CORREGIR — reducir espaciado interlineal a gap-2 |
| `1a9a053` | fix(catalogo): CORREGIR — ancho proporcional CODIGO INTERNO 130px, CODIGO DIGEMID 190px, NOMBRE COMERCIAL flex-1 |
| `bc87c1e` | feat(catalogo): codigoInterno en ProductoComercial — migration v6, backend Rust, frontend CORREGIR con semántica visual editable/readonly |
| `6b0f162` | refactor(catalogo): reorganizar formulario CORREGIR — orden por relevancia operacional, campos en grid, aviso historial en header |
| `2d39fec` | fix(catalogo): Enter en CORREGIR/DESACTIVAR — bloquear intercepcion en BuscadorProducto y CatalogoFarmaciaWorkspace cuando hay producto confirmado |

---

## REGLA CANÓNICA DE RUTAS — IRREVOCABLE

| Operación | Directorio de ejecución |
|---|---|
| `npx tsc --noEmit` | `D:\DisateQ-DEV\Proyectos\disateq-vendor\apps\vendor-desktop` |
| `npm run dev` | `D:\DisateQ-DEV\Proyectos\disateq-vendor\apps\vendor-desktop` |
| `git` — cualquier operación | `D:\DisateQ-DEV\Proyectos\disateq-vendor` (raíz del repo) |
| Archivos fuente React/TS | `D:\DisateQ-DEV\Proyectos\disateq-vendor\apps\vendor-desktop\src` |
| Archivos fuente Rust | `D:\DisateQ-DEV\Proyectos\disateq-vendor\apps\vendor-desktop\src-tauri` |
| Documentación | `D:\DisateQ-DEV\Proyectos\disateq-vendor\docs` |

---

## Recorrido de Dominios (Matriz de Estado)
* **LOGIN:** ✅
* **TURNO / CAJA:** ✅
* **ABASTECIMIENTO — CATÁLOGO:** 🔶 Evaluación visual en curso
  - RESUMEN DEL PRODUCTO ✅
  - DETALLE DEL PRODUCTO ✅ navegación teclado completa
  - CORREGIR DATOS BÁSICOS ✅ reorganizado, codigoInterno, condiciones operacionales editables con auditoría — pendiente evaluación visual completa
  - ASIGNACIÓN PRESENTACIONES ⬜
  - ASIGNACIÓN DE PRECIOS ⬜
  - NuevoProductoStepper ⬜
* **ABASTECIMIENTO — PROVEEDORES:** ✅ Doctrina de color — pendiente evaluación visual
* **ABASTECIMIENTO — INGRESOS:** ✅ Doctrina de color — pendiente end-to-end
* **ABASTECIMIENTO — INVENTARIOS:** ✅ Doctrina de color
* **COBRO:** ✅ CERRADO (etapa 1)
* **PRE-VENTA:** ✅ CERRADO
* **VENTAS:** 🔶 FormaVenta infraestructura completa — UX PresentacionSheet pendiente
* **COMPROBANTES / CLIENTES / REPORTES / OPERADORES / CONFIG:** ⬜

---

## CATÁLOGO FARMACIA — Estado consolidado al 27 Jun

### CORREGIR DATOS BÁSICOS — Orden de campos irrevocable

| Fila | Campos | Editable |
|---|---|---|
| Header | Nombre · Fabricante · Fechas · Badge · Aviso historial | No |
| 1 | CODIGO INTERNO (w-130px) · CODIGO DIGEMID (w-190px) · NOMBRE COMERCIAL (flex-1) | Sí / ADMIN / Sí |
| 2 | IFA / PRINCIPIO ACTIVO · FABRICANTE / LABORATORIO | No / Sí |
| 3 | CONCENTRACION / DOSIS · FORMA FARMACEUTICA | No |
| 4 | CONDICION DE VENTA · REFRIGERAR · CON VENCIMIENTO | Sí — con motivo obligatorio y auditoría |
| 5 | REGISTRO SANITARIO · ESTADO DEL REGISTRO | ADMIN |

### CONDICIONES OPERACIONALES — Doctrina de corrección con auditoría
- Tres selects editables siempre visibles
- Campo MOTIVO DE CORRECCION aparece solo cuando hay cambio detectado (comparando formularioOperacional vs producto)
- Botón GUARDAR CORRECCION OPERACIONAL deshabilitado hasta que motivo tenga texto
- Cada campo modificado genera una fila en `correccion_catalogo` con valor_anterior, valor_nuevo, motivo, operador_id
- Todo en una sola transacción Rust
- Handler: `onGuardarCorreccionOperacional` — independiente de `onGuardarCorreccion`

### CODIGO INTERNO — Doctrina canónica
- Campo operacional del establecimiento — no regulatorio
- Máximo 12 caracteres, alfanumérico, normalizado a mayúsculas en onChange
- Editable por cualquier operador con acceso a CORREGIR
- Buscable en catálogo (pendiente conectar en BuscadorProducto)

### CODIGO DIGEMID — Doctrina canónica
- Campo regulatorio DIGEMID — solo ADMIN
- Máximo 20 caracteres
- Readonly con fondo `bg-[#fefce8]` para no-ADMIN

### Semántica visual de campos en CORREGIR — IRREVOCABLE
| Estado | Fondo | Texto |
|---|---|---|
| Editable | `bg-white` | `text-slate-800` |
| Solo lectura crítico | `bg-[#fefce8]` | `text-slate-500` |
| Solo lectura ADMIN bloqueado | `bg-[#fefce8]` | `text-slate-500` |

### Schema migrations
| Version | Cambio |
|---|---|
| v2 | lote.fecha_vencimiento nullable |
| v3 | valor_operacional.tipo VENTA_NORMAL, vista reporte_digemid_privado |
| v4 | presentacion_comercial.stock_minimo |
| v5 | producto_comercial.estado_registro_sanitario DEFAULT VIGENTE |
| v6 | producto_comercial.codigo_interno TEXT |
| v7 | tabla correccion_catalogo + índices |

### Tabla correccion_catalogo — estructura canónica
```
id TEXT PRIMARY KEY
tabla TEXT NOT NULL              -- 'producto_comercial'
entidad_id TEXT NOT NULL         -- id del producto
campo TEXT NOT NULL              -- 'condicion_venta' | 'requiere_lote' | 'requiere_cadena_frio'
valor_anterior TEXT NOT NULL
valor_nuevo TEXT NOT NULL
motivo TEXT NOT NULL
operador_id TEXT NOT NULL
creado_en TEXT NOT NULL
```
Índices: `idx_correccion_entidad (tabla, entidad_id)` · `idx_correccion_operador (operador_id)`

---

## DISEÑO PENDIENTE — LÍNEAS DE LABORATORIO
Concepto: un laboratorio organiza su portafolio en líneas comerciales o terapéuticas.
Implementación diferida — puede ser tabla maestra o texto libre.
Campo futuro: `lineaLaboratorio` en `ProductoComercial`.

---

## SEMÁNTICA DE COLOR DE BOTONES — DOCTRINA GLOBAL IRREVOCABLE

| Patrón | Cuándo | Color |
|---|---|---|
| Outline verde | Iniciar acción nueva | `#45b356` / hover `#F2F7F3` |
| Sólido verde | Confirmar acción | `bg-[#45b356]` texto blanco |
| Outline naranja | Salir / limpiar / volver | `#f97316` / hover `#fff7ed` |
| Outline rojo | Cancelar flujo destructivo | `#dc2626` / hover `#fef2f2` |
| Sólido rojo | Confirmar acción irreversible | `bg-red-500` texto blanco |
| Outline azul `#0284C7` | Navegadores genéricos | hover `#E0F2FE` |
| Violeta `#7C3AED` | Navegador DETALLE | `#EDE9FE` |
| Cyan `#0891B2` | Navegador PRESENTACIONES | `#ECFEFF` |
| Ámbar `#D97706` | Navegador PRECIOS | `#FEF3C7` |

**Estado deshabilitado canónico:** `disabled:opacity-50 disabled:cursor-not-allowed`

---

## ACCENT CANÓNICO POR MÓDULO
| Módulo | Accent | Tint |
|---|---|---|
| ABASTECIMIENTO | `#0284C7` | `#E0F2FE` |
| VENTAS / COBRO | `#45b356` | `#F2F7F3` |
| TURNO / CAJA | `#2A7CA8` | — |
| COMPROBANTES | `#C05050` | — |
| AJUSTES / CONFIG | `#697387` | — |
| CLIENTES | `#1e7e4f` | — |
| REPORTES | `#2154d8` | — |

---

## REGLA IRREVOCABLE DE ROLES
- **Fernando** = Product Owner — decide, ejecuta, commitea
- **Claude** = Arquitecto Senior — diseña, especifica, genera prompts — **NUNCA escribe código directamente**
- **Codex** = Desarrollador atómico — ejecuta prompts de Claude
- Claude no debe intentar editar archivos del proyecto bajo ninguna circunstancia

---

## DEUDA TÉCNICA REGISTRADA

| Archivo | Problema | Prioridad |
|---|---|---|
| DetalleProducto.tsx | 1000+ líneas — extraer PresentacionesTab y PreciosTab | Media |
| DetalleProducto.tsx | Vista PRECIOS en resumen muestra texto fijo | Media |
| PreciosTab | Botones Guardar/Cancelar fuera de doctrina — usan azul | Media |
| NuevoProductoStepper.tsx | Extraer pasos en componentes | Media |
| OperationalBar.tsx | Listener `disateq:navegar` pendiente | Media |
| OperationalBar.tsx | Color `#3D8A8A` teal → `#0284C7` | Media |
| OperationalBar.tsx | Doble llamada a usePOS() | Baja |
| catalogo.service.ts | ItemCatalogo no proyecta condicionVenta desde SQLite | Media |
| BuscadorProducto.tsx | codigoInterno no incluido en búsqueda SQL | Media |
| blocks.store.ts | BoxSlotType → TipoCaja | Media |
| operator.store.ts | Operador.codigo huérfano | Media |
| farmacia.service.ts | actualizarProveedor → modificarProveedor | Baja |
| ContextBar.tsx | Archivo huérfano | Baja |
| DetalleProveedor.tsx | Botones sin auditar directamente | Baja |
| ProductoComercial | lineaLaboratorio — diseño y migración diferidos | Pendiente |

---

## DOCTRINA DE CALIDAD — IRREVOCABLE

### CONVENCIÓN TAURI
**Todo argumento de invoke() TypeScript se envía SIEMPRE en camelCase.**

### LECCIONES APRENDIDAS
- **TypeScript:** `npx tsc --noEmit` desde `apps\vendor-desktop`
- **CURRENT_CONTEXT.md:** usar `filesystem:write_file`
- **Prompts Codex:** lenguaje natural puro, sin bloques de código
- **Footer fijo:** cadena flex completa — `shrink-0` obligatorio
- **Intercepción de teclado:** BuscadorProducto y CatalogoFarmaciaWorkspace deben inhibir con producto confirmado
- **Backend modificarProductoComercial:** no soporta condicionVenta/requiereLote/requiereCadenaFrio — usar corregirDatosOperacionales
- **correccion_catalogo:** una fila por campo modificado — no JSON agregado

---

## PRÓXIMA VENTANA DE TRABAJO

1. **Evaluación visual** — CORREGIR DATOS BÁSICOS completa en UI
2. **Evaluación visual** — ASIGNACIÓN PRESENTACIONES
3. **Evaluación visual** — ASIGNACIÓN DE PRECIOS
4. **Evaluación visual** — NuevoProductoStepper
5. **Evaluación visual** — PROVEEDORES flujo completo
6. **INGRESOS** — prueba end-to-end
7. **BuscadorProducto** — agregar codigoInterno a la búsqueda SQL
8. **Conectar `disateq:navegar`** — listener en OperationalBar
9. **OperationalBar** — corregir color `#3D8A8A` → `#0284C7`
10. **BoxSlotType → TipoCaja**
11. **Operador.codigo** — verificar y eliminar si huérfano

---

## Datos de prueba
5 genéricos · 8 comerciales · 8 presentaciones · 16 lotes · 2 proveedores · 11 precios
Seed en `.gitignore`. DB: `$env:APPDATA\com.disateq.vendor\disateq.db`

---

## Mapa de Atajos — COBRO
TIQUE Ctrl+7 · BOLETA Ctrl+8 · FACTURA Ctrl+9 · COTIZACION Ctrl+4
EFECTIVO Ctrl+E · YAPE Ctrl+Y · TARJETA Ctrl+T · MIXTO Ctrl+M
GUARDAR Ctrl+Insert · IMPRIMIR Enter · CERRAR Escape

## Doctrina de Footer
1 botón 100% · 2 botones 50/50 · 3 botones 25/25/50 · Principal verde derecha

## Doctrina de Impresión
ESC/POS via Rust/Tauri. HTML/CSS solo fallback PDF.

## Nomenclatura Canónica
FormaVenta / FormaCompra / UnidadBase
ProductoGenerico / ProductoComercial / PresentacionComercial / NodoFraccionamiento
TipoRecursoOperacional / ProductoGeneral / ServicioFarmacia

---
*Iniciar sesión limpia leyendo este contexto. Si hay discrepancia entre este documento y el filesystem real, el filesystem es la fuente de verdad.*
