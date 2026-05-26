# PURCHASES DOMAIN BOUNDARIES

## Propósito del documento

Definir límites explícitos de responsabilidad entre COMPRAS y otros dominios de DISATEQ VENDOR™.

El objetivo es:
- preservar desacople semántico,
- evitar centralización excesiva,
- proteger simplicidad operacional,
- y mantener evolución arquitectónica controlada.

Las separaciones documentadas aquí deben preservarse transversalmente en:
- runtime,
- persistencia,
- stores,
- sincronización,
- DTOs,
- y evolución futura del sistema.

---

## COMPRAS vs INVENTARIOS

### COMPRAS conserva

- contexto de abastecimiento,
- causalidad comercial,
- intención operacional,
- contexto proveedor,
- promociones,
- bonificaciones,
- devoluciones contextuales,
- y regularización comercial.

### INVENTARIOS conserva

- existencia,
- disponibilidad,
- movimientos físicos,
- estados derivados,
- y reconstrucción operacional.

INVENTARIOS no debe depender de:
- interpretación comercial,
- deuda,
- tributación,
- promociones,
- ni conciliación financiera.

COMPRAS no debe controlar disponibilidad directamente.

---

## COMPRAS vs PAGOS / CAJA

### COMPRAS conserva

- contexto de abastecimiento,
- compromiso operacional,
- y relación contextual de deuda.

### PAGOS / CAJA conserva

- movimiento financiero,
- salida de dinero,
- conciliación de caja,
- y trazabilidad monetaria.

Una compra puede existir:
- antes del pago,
- con pago parcial,
- o con conciliación posterior.

El abastecimiento no depende del cierre financiero.

---

## COMPRAS vs COMPROBANTES

### COMPRAS conserva

- realidad operacional,
- abastecimiento,
- recepción,
- causalidad comercial,
- y continuidad operacional.

### COMPROBANTES conserva

- representación tributaria,
- estructura normativa,
- validación fiscal,
- emisión documental,
- y formalización tributaria.

La representación normativa no debe controlar captura operacional.

COMPRAS debe continuar operando:
- sin SUNAT,
- sin XML,
- sin validación remota,
- y sin completitud tributaria inmediata.

---

## COMPRAS vs PROVEEDORES

### COMPRAS conserva

- contexto puntual de abastecimiento,
- causalidad comercial del evento,
- y relación operacional inmediata.

### PROVEEDORES conserva

- identidad relacional,
- historial comercial,
- contexto acumulado,
- y referencias operacionales.

COMPRAS debe tolerar:
- proveedores ambiguos,
- parciales,
- o progresivamente identificados.

---

## COMPRAS vs CONTABILIDAD

COMPRAS no debe transformarse en:
- motor contable,
- sistema financiero enterprise,
- ni núcleo tributario centralizado.

El dominio conserva:
- trazabilidad operacional suficiente,
- contexto comercial,
- y causalidad de abastecimiento,

pero no responsabilidad contable exhaustiva.

Capacidades financieras avanzadas deben permanecer desacopladas del núcleo operacional.

---

## Separaciones semánticas fundamentales

- compra ≠ pago
- documento ≠ recepción física
- movimiento físico ≠ contexto comercial
- existencia ≠ costo
- abastecimiento ≠ obligación financiera
- captura ≠ normalización
- operación ≠ representación tributaria

Estas separaciones deben preservarse transversalmente en:
- runtime,
- persistencia,
- stores,
- sincronización,
- DTOs,
- y evolución futura del sistema.

---

## Anti-patrones de acoplamiento

Evitar:
- lógica tributaria dentro de INVENTARIOS,
- lógica financiera dentro de abastecimiento,
- disponibilidad controlada por conciliación,
- bloqueo operacional por validación documental,
- stores monolíticos multi-dominio,
- y dependencia estructural entre dominios desacoplados.

---

## Evolución futura

La integración entre dominios debe ocurrir mediante:
- causalidad compartida,
- eventos operacionales,
- derivación contextual,
- y enriquecimiento progresivo,

sin fusionar responsabilidades semánticas.

Ningún dominio debe absorber responsabilidades estructurales ajenas.

