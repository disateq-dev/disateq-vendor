# ARQUITECTURA DE SINCRONIZACIÓN — DISATEQ VENDOR™

**Estado:** Decisión arquitectónica consolidada  
**Aprobado por:** Fernando Miguel — Director de Producto  
**Fecha:** Junio 2026  
**Proyecto:** DISATEQ VENDOR (capa sync/) + DISATEQ PORTAL (infraestructura)

---

## 1. CONTEXTO Y MOTIVACIÓN

### El problema real

DISATEQ VENDOR opera en el mercado peruano, donde la infraestructura eléctrica e internet es impredecible:

- Cortes de minutos a horas: escenario más común
- Cortes de días: ocurre con frecuencia en zonas periféricas
- Cortes de semanas o meses: infrecuente pero real

Ningún sistema POS del mercado peruano para pequeñas empresas contempla correctamente este escenario. DISATEQ lo convierte en ventaja competitiva.

### El modelo de negocio que lo rodea

DISATEQ opera como **MSP — Managed Service Provider**. No vende software — vende tranquilidad operacional. El cliente no contrata una app, contrata un socio tecnológico que asume su área de IT.

Esto implica:
- Preventa: acompañamiento técnico, tramitación CDT, verificación de equipamiento
- Implementación: instalación, configuración, asignación de series
- Posventa: soporte remoto continuo, monitoreo, actualizaciones

El cliente nunca administra servidores ni infraestructura. DISATEQ lo asume.

---

## 2. FILOSOFÍA DE DISEÑO

### Offline-First es no negociable

La conectividad es una optimización, nunca un requisito.

El operador **nunca** debe ver un mensaje de "sin conexión" que bloquee su operación. La venta, el comprobante, el cierre de turno — todo ocurre localmente sin importar el estado de la red.

### Eventos, no estados

El sistema sincroniza **eventos**, no registros.

```
❌ Estado:  "Stock producto X = 47"        → colisiona entre terminales
✅ Evento:  "Terminal 2 · 14:23 · vendió 3 unidades de X"   → nunca colisiona
            "Terminal 1 · 14:31 · recibió 20 unidades de X" → nunca colisiona
            Nexo aplica en orden cronológico → 47 - 3 + 20 = 64 ✓
```

Este principio elimina el 90% de los conflictos de sincronización antes de que ocurran.

### La cola nunca pierde eventos

Cada acción operacional genera un evento firmado (timestamp + terminal ID + hash) que se encola localmente. La cola es persistente y sobrevive reinicios, cortes de luz y fallas de red. Un evento solo se elimina de la cola cuando el Nexo confirma su recepción.

---

## 3. TOPOLOGÍA

### Escenario mínimo — un solo equipo

```
PC ÚNICA
├── Terminal de ventas (VENDOR · operador atiende)
├── Administración (reportes · configuración)
└── Cola de eventos local
        │
        └── Internet → Nexo DISATEQ (nube)
```

### Escenario estándar — PC principal + terminales

```
PC PRINCIPAL (admin)  ──┐
PC TERMINAL 1         ──┤── LAN ── Router ── Internet ── Nexo DISATEQ
PC TERMINAL 2         ──┤                                (nube DISATEQ)
PC TERMINAL 3         ──┤
PC TERMINAL 4         ──┘
```

### Escenario máximo V1

```
1 PC PRINCIPAL (administración + ventas opcional)
4 PC TERMINALES (ventas)
─────────────────────────────────────────────────
5 equipos por cliente · techo definido para V1
```

### Infraestructura DISATEQ (multi-cliente)

```
CLIENTE A: Terminal 1..N ──► Nexo Cliente A ──┐
CLIENTE B: Terminal 1..N ──► Nexo Cliente B ──┤──► Backbone DISATEQ
CLIENTE C: Terminal 1..N ──► Nexo Cliente C ──┘    (respaldo · monitoreo · facturación)
```

Cada cliente tiene su Nexo aislado. Los datos de un cliente nunca se mezclan con otro.

---

## 4. LAS TRES RUTAS DE SINCRONIZACIÓN

El sistema intenta las rutas en orden de preferencia. El operador no interviene en las Rutas 1 y 2.

### Ruta 1 — Sync automático por internet (preferida)

```
Cola local → sync-agent detecta internet → POST al Nexo DISATEQ → confirmación → cola vaciada
```

- Sin intervención del operador
- Si el envío falla a mitad, la cola no se vacía — reintenta completa en el siguiente ciclo
- Backoff exponencial en reintentos

### Ruta 2 — Sync LAN peer-to-peer (contingencia automática)

Activa cuando no hay internet pero sí hay red local entre terminales.

```
Terminal A (cola acumulada)
        │
        ▼
Broadcast UDP en red local → descubrimiento de peers
        │
        ▼
Terminal B responde → handshake mutuo → intercambian eventos faltantes
        │
        ▼
Terminal B (si tiene internet o hotspot) → reenvía cola combinada al Nexo DISATEQ
```

Cualquier terminal con internet activo actúa como **puente** para los demás automáticamente.

### Ruta 3 — Sneakernet .dsync (contingencia manual)

Activa cuando las Rutas 1 y 2 no están disponibles. Operación manual por el administrador.

```
VENDOR → Configuración → "Exportar sincronización"
        │
        ▼
Archivo: disateq_[cliente]_[terminal]_[fecha].dsync
  · Cifrado AES-256 con clave derivada del cliente
  · Contiene todos los eventos pendientes
  · Tamaño: kilobytes (semanas de operación ≈ 500KB)
        │
        ├── WhatsApp al soporte DISATEQ → técnico sube al portal
        ├── Portal sync.disateq.com → upload directo desde celular
        └── 30 segundos de hotspot → sync automático Ruta 1
```

El archivo `.dsync` es opaco y cifrado. Si es interceptado, no puede leerse sin la clave del cliente.

---

## 5. REGLAS DE SINCRONIZACIÓN Y RESOLUCIÓN DE CONFLICTOS

### Por tipo de dato

| Tipo de dato | Regla | Justificación |
|---|---|---|
| Ventas / Pedidos | Append-only · sin conflicto | Cada venta es un evento único |
| Comprobantes | Determinista · Nexo tiene prioridad | Serie correlativa · no puede duplicarse |
| Inventario | Aplicación ordenada por timestamp | Los movimientos son causales |
| Turno / Caja | Determinista · terminal propietario | Solo un terminal abre cada caja |
| Clientes | Last-Write-Wins por campo | Modificaciones independientes |
| Configuración | Last-Write-Wins · solo ADMIN | Cambios infrecuentes |

### El caso crítico: correlativos

Con múltiples terminales emitiendo comprobantes simultáneamente, la colisión de serie es el conflicto más crítico.

**Solución: bloques de serie asignados por el Nexo en el momento de instalación.**

```
Nexo asigna al Terminal 1: serie B001, F001 · correlativos 000001 en adelante
Nexo asigna al Terminal 2: serie B002, F002 · correlativos 000001 en adelante
Nexo asigna al Terminal 3: serie B003, F003 · correlativos 000001 en adelante
Nexo asigna al Terminal 4: serie B004, F004 · correlativos 000001 en adelante
```

Cada terminal emite dentro de su serie propia. Sin internet, sigue emitiendo en su serie. Sin colisión posible bajo ningún escenario.

**Alineación con SUNAT:** cada serie identifica un punto de emisión físico. Esto no es una decisión de DISATEQ — es la norma regulatoria. El argumento con el cliente:

> "Cada caja tiene su propia serie, igual que en cualquier farmacia de cadena o tienda por departamentos. SUNAT lo requiere para trazabilidad. La ventaja para usted es que sabe exactamente de qué caja salió cada comprobante."

**Estado del correlativo.store.ts actual:** ya compatible. El store opera por serie arbitraria — no asume serie única. Solo falta que la serie venga de configuración del Nexo en lugar de estar hardcodeada. Trabajo del Portal, no de VENDOR hoy.

---

## 6. ALTA DISPONIBILIDAD OPERACIONAL

No se implementa HA de datacenter. Se implementa **HA operacional** adecuada al perfil del cliente peruano.

### Escenarios y comportamiento

| Escenario | Comportamiento del sistema | Intervención requerida |
|---|---|---|
| Corte de internet (minutos/horas) | Cola acumula · Ruta 2 si hay LAN · Sync automático al reconectar | Ninguna |
| Corte de internet (días) | Cola acumula · exportar .dsync al cierre de cada turno como hábito | Exportar .dsync periódicamente |
| Corte de internet (semanas/meses) | Opera con normalidad · sync vía hotspot cuando es posible | Hotspot puntual · .dsync de respaldo |
| Corte eléctrico | UPS da 15-30 min · cierre limpio de turno · exportar .dsync | Cierre ordenado antes de apagar |
| Falla del Nexo DISATEQ | Terminales siguen operando · DISATEQ restaura en < 4h · sync automático al restaurar | Ninguna para el cliente |

### Recomendaciones de equipamiento (preventa)

| Elemento | Mínimo | Recomendado | Motivo |
|---|---|---|---|
| UPS | 500VA | 1000VA | 15-30 min autonomía para cierre limpio |
| Router | Básico | Con failover 4G | LAN funciona aunque caiga internet fijo |
| Terminal principal | 4GB RAM · SSD | 8GB RAM · SSD | Fluidez con VENDOR |
| Impresora térmica | USB | USB + red | Tickets como respaldo físico siempre |

---

## 7. ESTRUCTURA DE CÓDIGO — CAPA SYNC/

Lo que se agrega a VENDOR. No modifica ningún dominio existente.

```
src/sync/
├── event-queue.store.ts
│     Cola persistente de eventos pendientes
│     Firma cada evento: timestamp + terminalId + hash SHA-256
│     Nunca elimina un evento sin confirmación del Nexo
│
├── sync-agent.ts
│     Proceso background · se ejecuta cada N segundos configurable
│     Detecta conectividad · intenta Ruta 1 · activa Ruta 2 si falla
│     Backoff exponencial en reintentos · log de intentos
│
├── conflict-resolver.ts
│     Aplica reglas LWW · merge · determinista según tipo de evento
│     Importable por el Nexo para aplicar la misma lógica server-side
│
├── dsync-exporter.ts
│     Empaqueta cola pendiente en archivo .dsync cifrado AES-256
│     Genera nombre de archivo con hash de integridad
│     Importa .dsync recibido · valida firma · encola eventos
│
└── lan-discovery.ts
      Broadcast UDP en red local · descubrimiento de peers VENDOR
      Handshake de intercambio de eventos faltantes
      Elección de terminal puente si alguno tiene internet
```

---

## 8. PROYECTOS Y FASES

### PROYECTO 1 — DISATEQ VENDOR (este repositorio)

Incluye la capa `sync/` completa más la integración fiscal.

| Fase | Descripción | Estado |
|---|---|---|
| Fase 1 | Cola de eventos robusta | Pendiente |
| Fase 2 | Sync internet → Nexo DISATEQ (Ruta 1) | Pendiente |
| Fase 3 | Exportación .dsync (Ruta 3) | Pendiente |
| Fase 4 | Sync LAN peer-to-peer (Ruta 2) | Pendiente |
| Fase 5 | Bloques de correlativos multi-terminal | Pendiente |
| Fase 6 | API REST facturación electrónica SUNAT | Pendiente |

### PROYECTO 2 — DISATEQ PORTAL (repositorio separado · siguiente)

| Componente | Descripción |
|---|---|
| Nexo en nube | Un Nexo aislado por cliente · recibe eventos de terminales |
| Portal sync | sync.disateq.com · recibe archivos .dsync · procesa y confirma |
| Servidor de licencias | Activación y validación de instalaciones |
| Servidor de actualizaciones | Distribución de nuevas versiones de VENDOR |
| RustDesk | Soporte remoto a terminales del cliente |
| Panel DISATEQ | Monitoreo de Nexos · estado de clientes · alertas |

---

## 9. DECISIONES IRREVERSIBLES

1. **Offline-First absoluto** — ninguna operación puede bloquearse por falta de red
2. **Event-sourcing como mecanismo de sync** — se sincronizan eventos, no estados
3. **Series por terminal** — asignadas por el Nexo · alineadas con SUNAT
4. **DISATEQ administra el Nexo** — el cliente nunca toca infraestructura
5. **Soporte 100% remoto** — no hay desplazamiento físico de técnicos
6. **Dos proyectos separados** — VENDOR y PORTAL tienen ciclos de vida distintos

---

## 10. LO QUE NO CAMBIA DE VENDOR HOY

La capa `sync/` se agrega encima de lo existente. No se modifica:

- Ningún dominio operacional (sales, cash, inventory, documents, etc.)
- Ningún store de Zustand existente
- Ningún componente de UI
- La experiencia del operador

El operador no nota la existencia de la capa de sincronización. Opera exactamente igual que hoy.

---

*Documento generado por el Comité de Arquitectura — Junio 2026.*  
*Próxima revisión: al iniciar implementación de Fase 1.*
