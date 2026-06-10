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

### El terminal ES el respaldo del Nexo

La cola en cada terminal no es solo un mecanismo de envío — es una **copia de seguridad distribuida** de toda la operación. Si el Nexo falla y pierde datos, puede reconstruirse completamente desde las colas de los terminales. Los datos nunca dependen exclusivamente de la nube.

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
CLIENTE A: Terminal 1..N ──► Nexo Cliente A (primario + secundario) ──┐
CLIENTE B: Terminal 1..N ──► Nexo Cliente B (primario + secundario) ──┤──► Backbone DISATEQ
CLIENTE C: Terminal 1..N ──► Nexo Cliente C (primario + secundario) ──┘
```

Cada cliente tiene su par de Nexos aislado. Los datos de un cliente nunca se mezclan con otro.

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
- Failover automático a Nexo secundario si el primario no responde

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
| Fallo Nexo primario | VENDOR conmuta a secundario automáticamente · alerta silenciosa a DISATEQ | Ninguna para el cliente |
| Fallo ambos Nexos | Cola acumula · Ruta 3 disponible · DISATEQ restaura | Ninguna para el cliente |
| Pérdida total de datos en Nexo | DISATEQ restaura Nexo vacío · terminales re-sincronizan cola completa | Ninguna para el cliente |

### Recomendaciones de equipamiento (preventa)

| Elemento | Mínimo | Recomendado | Motivo |
|---|---|---|---|
| UPS | 500VA | 1000VA | 15-30 min autonomía para cierre limpio |
| Router | Básico | Con failover 4G | LAN funciona aunque caiga internet fijo |
| Terminal principal | 4GB RAM · SSD | 8GB RAM · SSD | Fluidez con VENDOR |
| Impresora térmica | USB | USB + red | Tickets como respaldo físico siempre |

---

## 7. CONTINGENCIA DEL NEXO — FAILOVER Y RECUPERACIÓN

### El principio fundamental

El fallo del Nexo debe ser **invisible para el cliente**. El operador nunca debe ver un error relacionado con el servidor. La operación continúa siempre.

### Configuración de endpoints (nexo.config.json)

Generado por DISATEQ durante la instalación. Nunca editado por el cliente.

```json
{
  "clienteId": "abc123",
  "terminalId": "terminal-01",
  "endpoints": [
    {
      "url": "https://cliente-a.nexo.disateq.com",
      "prioridad": 1,
      "activo": true
    },
    {
      "url": "https://cliente-a-backup.nexo.disateq.com",
      "prioridad": 2,
      "activo": true
    }
  ],
  "timeoutMs": 10000,
  "retryIntervalMs": 30000
}
```

Si DISATEQ necesita migrar el servidor — cambio de proveedor, mantenimiento, actualización — actualiza este archivo remotamente vía RustDesk o servidor de actualizaciones. VENDOR lo lee en el siguiente ciclo sin reiniciar.

### Lógica de failover en sync-agent

```
Intenta Nexo primario (prioridad 1)
        │
        ├── Responde en < timeoutMs → opera normalmente
        │
        └── Timeout o error → intenta Nexo secundario (prioridad 2)
                │
                ├── Responde → opera con secundario
                │             alerta silenciosa a DISATEQ
                │             cola sigue vaciándose sin interrupción
                │
                └── Timeout o error → ningún Nexo disponible
                                      cola acumula
                                      reintenta en retryIntervalMs
                                      Ruta 2 y 3 disponibles
```

### Sincronización entre Nexos (responsabilidad del Portal)

El Nexo primario y secundario se replican entre sí en tiempo real. Cuando el primario se restaura, el secundario le transfiere los eventos recibidos durante la caída. VENDOR no necesita saber nada de esta sincronización — solo ve endpoints que responden o no responden.

### Recuperación ante pérdida total de datos en el Nexo

```
1. DISATEQ detecta pérdida (monitoreo del Portal)
2. DISATEQ restaura Nexo desde último respaldo disponible
3. DISATEQ solicita re-sincronización a los terminales del cliente
4. Cada terminal envía su cola completa (incluyendo eventos ya confirmados)
5. Nexo reconstruye el estado desde los eventos en orden cronológico
6. Confirmación → colas de terminales se purgan normalmente
```

Los terminales son la fuente de verdad de último recurso. La pérdida de datos en el Nexo es recuperable siempre que al menos un terminal tenga su cola intacta.

---

## 8. ESTRUCTURA DE CÓDIGO — CAPA SYNC/

Lo que se agrega a VENDOR. No modifica ningún dominio existente.

```
src/sync/
├── event-queue.types.ts
│     SyncEvent · SyncDominio · SyncOperacion · SyncEstado
│     NexoEndpoint · NexoConfig
│
├── event-queue.store.ts
│     Cola persistente de eventos pendientes
│     Firma cada evento: timestamp + terminalId + hash SHA-256
│     Nunca elimina un evento sin confirmación del Nexo
│     API: encolar · marcarEnviando · confirmar · registrarFallo
│          obtenerPendientes · obtenerTodos · purgarConfirmados · resumen
│
├── sync-agent.ts
│     Proceso background · se ejecuta cada N segundos configurable
│     Lee nexo.config.json · resuelve endpoint activo con failover
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

## 9. PROYECTOS Y FASES

### PROYECTO 1 — DISATEQ VENDOR (este repositorio)

| Fase | Descripción | Estado |
|---|---|---|
| Fase 1 | Cola de eventos robusta (event-queue.types.ts + event-queue.store.ts) | Pendiente |
| Fase 2 | Sync internet → Nexo DISATEQ con failover (sync-agent.ts + nexo.config.json) | Pendiente |
| Fase 3 | Exportación .dsync (dsync-exporter.ts + UI en Configuración) | Pendiente |
| Fase 4 | Sync LAN peer-to-peer (lan-discovery.ts) | Pendiente |
| Fase 5 | Bloques de correlativos multi-terminal | Pendiente |
| Fase 6 | API REST facturación electrónica SUNAT | Pendiente |

### PROYECTO 2 — DISATEQ PORTAL (repositorio separado · siguiente)

| Componente | Descripción |
|---|---|
| Nexo en nube | Un par primario/secundario por cliente · aislado · replicado |
| Portal sync | sync.disateq.com · recibe .dsync · procesa · confirma |
| Servidor de licencias | Activación y validación de instalaciones |
| Servidor de actualizaciones | Distribución de nuevas versiones · actualiza nexo.config.json remotamente |
| RustDesk | Soporte remoto · configuración de endpoints sin visita física |
| Panel DISATEQ | Monitoreo de Nexos · alertas de failover · estado de clientes |

---

## 10. DECISIONES IRREVERSIBLES

1. **Offline-First absoluto** — ninguna operación puede bloquearse por falta de red
2. **Event-sourcing como mecanismo de sync** — se sincronizan eventos, no estados
3. **El terminal es el respaldo del Nexo** — la nube es derivable desde las colas locales
4. **Failover automático y silencioso** — el cliente nunca ve errores de servidor
5. **Series por terminal** — asignadas por el Nexo · alineadas con SUNAT
6. **DISATEQ administra el Nexo** — el cliente nunca toca infraestructura
7. **Soporte 100% remoto** — no hay desplazamiento físico de técnicos
8. **Dos proyectos separados** — VENDOR y PORTAL tienen ciclos de vida distintos

---

## 11. LO QUE NO CAMBIA DE VENDOR HOY

La capa `sync/` se agrega encima de lo existente. No se modifica:

- Ningún dominio operacional (sales, cash, inventory, documents, etc.)
- Ningún store de Zustand existente
- Ningún componente de UI
- La experiencia del operador

El operador no nota la existencia de la capa de sincronización. Opera exactamente igual que hoy.

---

*Documento generado por el Comité de Arquitectura — Junio 2026.*  
*Próxima revisión: al iniciar implementación de Fase 1.*
