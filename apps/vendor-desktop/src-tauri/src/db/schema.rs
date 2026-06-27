pub const SCHEMA_CORE: &str = r#"
CREATE TABLE IF NOT EXISTS config_establecimiento (
  id TEXT PRIMARY KEY,
  codigo_estab_oppf TEXT,
  rubro_activo TEXT NOT NULL DEFAULT 'FARMACIA',
  razon_social TEXT,
  ruc TEXT,
  direccion TEXT,
  telefono TEXT,
  creado_en TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS proveedor (
  id TEXT PRIMARY KEY,
  razon_social TEXT NOT NULL,
  ruc TEXT,
  nombre_contacto TEXT,
  telefono TEXT,
  condiciones_pago TEXT,
  estado TEXT NOT NULL DEFAULT 'ACTIVO',
  creado_en TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_proveedor_estado ON proveedor(estado);

CREATE TABLE IF NOT EXISTS movimiento (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL,
  tipo TEXT NOT NULL,
  unidades_base REAL NOT NULL,
  lote_id TEXT,
  nodo_id TEXT,
  causa TEXT NOT NULL,
  referencia_id TEXT,
  operador_id TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  runtime_id TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_mov_item ON movimiento(item_id);
CREATE INDEX IF NOT EXISTS idx_mov_lote ON movimiento(lote_id);
CREATE INDEX IF NOT EXISTS idx_mov_timestamp ON movimiento(timestamp);
"#;

pub const SCHEMA_FARMACIA: &str = r#"
CREATE TABLE IF NOT EXISTS producto_generico (
  id TEXT PRIMARY KEY,
  ifa TEXT NOT NULL,
  concentracion TEXT NOT NULL,
  forma_farmaceutica TEXT NOT NULL,
  categoria_farmacia TEXT NOT NULL,
  permite_fraccion INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS producto_comercial (
  id TEXT PRIMARY KEY,
  producto_generico_id TEXT NOT NULL REFERENCES producto_generico(id),
  nombre_comercial TEXT NOT NULL,
  nombre_fabricante TEXT NOT NULL,
  nombre_titular TEXT,
  pais_origen TEXT NOT NULL DEFAULT 'PE',
  registro_sanitario TEXT,
  codigo_digemid TEXT,
  codigo_interno TEXT,
  condicion_venta TEXT NOT NULL DEFAULT 'SIN_RECETA',
  requiere_lote INTEGER NOT NULL DEFAULT 0,
  requiere_cadena_frio INTEGER NOT NULL DEFAULT 0,
  estado TEXT NOT NULL DEFAULT 'ACTIVO',
  creado_en TEXT NOT NULL,
  modificado_en TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pc_generico ON producto_comercial(producto_generico_id);
CREATE INDEX IF NOT EXISTS idx_pc_estado ON producto_comercial(estado);
CREATE INDEX IF NOT EXISTS idx_pc_reg_san ON producto_comercial(registro_sanitario);

CREATE TABLE IF NOT EXISTS correccion_catalogo (
  id TEXT PRIMARY KEY,
  tabla TEXT NOT NULL,
  entidad_id TEXT NOT NULL,
  campo TEXT NOT NULL,
  valor_anterior TEXT NOT NULL,
  valor_nuevo TEXT NOT NULL,
  motivo TEXT NOT NULL,
  operador_id TEXT NOT NULL,
  creado_en TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_correccion_entidad ON correccion_catalogo(tabla, entidad_id);
CREATE INDEX IF NOT EXISTS idx_correccion_operador ON correccion_catalogo(operador_id);

CREATE TABLE IF NOT EXISTS presentacion_comercial (
  id TEXT PRIMARY KEY,
  producto_comercial_id TEXT NOT NULL REFERENCES producto_comercial(id),
  descripcion TEXT NOT NULL,
  fraccion_digemid REAL NOT NULL,
  unidad_conteo TEXT NOT NULL,
  factor_conversion_base REAL NOT NULL,
  codigo_barras TEXT,
  proveedor_habitual_id TEXT REFERENCES proveedor(id),
  costo_compra REAL,
  stock_minimo REAL NOT NULL DEFAULT 10.0,
  creado_en TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_pres_comercial ON presentacion_comercial(producto_comercial_id);
CREATE INDEX IF NOT EXISTS idx_pres_barras ON presentacion_comercial(codigo_barras);

CREATE TABLE IF NOT EXISTS nodo_fraccionamiento (
  id TEXT PRIMARY KEY,
  presentacion_id TEXT NOT NULL REFERENCES presentacion_comercial(id),
  nodo_padre_id TEXT REFERENCES nodo_fraccionamiento(id),
  nombre_forma_venta TEXT NOT NULL,
  tipo_forma_venta TEXT NOT NULL,
  unidades_en_nodo_padre REAL,
  unidades_base REAL NOT NULL,
  es_vendible INTEGER NOT NULL DEFAULT 1,
  es_comprable INTEGER NOT NULL DEFAULT 0,
  descripcion_promo TEXT,
  estado TEXT NOT NULL DEFAULT 'ACTIVO',
  creado_en TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_nodo_presentacion ON nodo_fraccionamiento(presentacion_id);
CREATE INDEX IF NOT EXISTS idx_nodo_padre ON nodo_fraccionamiento(nodo_padre_id);
CREATE INDEX IF NOT EXISTS idx_nodo_vendible ON nodo_fraccionamiento(es_vendible, estado);

CREATE TABLE IF NOT EXISTS lote (
  id TEXT PRIMARY KEY,
  presentacion_id TEXT NOT NULL REFERENCES presentacion_comercial(id),
  numero_lote TEXT NOT NULL,
  fecha_vencimiento TEXT NOT NULL,
  fecha_fabricacion TEXT,
  cantidad_ingresada REAL NOT NULL,
  cantidad_disponible REAL NOT NULL,
  proveedor_id TEXT REFERENCES proveedor(id),
  precio_compra REAL,
  estado TEXT NOT NULL DEFAULT 'VIGENTE',
  creado_en TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_lote_presentacion ON lote(presentacion_id);
CREATE INDEX IF NOT EXISTS idx_lote_vencimiento ON lote(fecha_vencimiento);
CREATE INDEX IF NOT EXISTS idx_lote_estado ON lote(estado);
CREATE INDEX IF NOT EXISTS idx_lote_fefo ON lote(presentacion_id, estado, fecha_vencimiento);

CREATE TABLE IF NOT EXISTS valor_operacional (
  id TEXT PRIMARY KEY,
  nodo_id TEXT NOT NULL REFERENCES nodo_fraccionamiento(id),
  tipo TEXT NOT NULL,
  valor REAL NOT NULL,
  moneda TEXT NOT NULL DEFAULT 'PEN',
  condicion_cantidad_minima REAL,
  condicion_contexto_id TEXT,
  condicion_identidad_id TEXT,
  vigencia_desde TEXT NOT NULL,
  vigencia_hasta TEXT,
  estado TEXT NOT NULL DEFAULT 'ACTIVO',
  creado_en TEXT NOT NULL,
  modificado_en TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_valor_nodo ON valor_operacional(nodo_id, estado);
CREATE INDEX IF NOT EXISTS idx_valor_tipo ON valor_operacional(tipo);

CREATE TABLE IF NOT EXISTS servicio_farmacia (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo_servicio TEXT NOT NULL,
  descripcion TEXT,
  duracion_minutos INTEGER,
  estado TEXT NOT NULL DEFAULT 'ACTIVO',
  creado_en TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ejecucion_servicio (
  id TEXT PRIMARY KEY,
  servicio_id TEXT NOT NULL REFERENCES servicio_farmacia(id),
  operador_id TEXT NOT NULL,
  turno_id TEXT,
  pedido_id TEXT,
  timestamp_inicio TEXT NOT NULL,
  timestamp_fin TEXT,
  duracion_minutos INTEGER,
  observacion TEXT,
  creado_en TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ejec_servicio ON ejecucion_servicio(servicio_id);
CREATE INDEX IF NOT EXISTS idx_ejec_operador ON ejecucion_servicio(operador_id);
CREATE INDEX IF NOT EXISTS idx_ejec_turno ON ejecucion_servicio(turno_id);
CREATE INDEX IF NOT EXISTS idx_ejec_timestamp ON ejecucion_servicio(timestamp_inicio);
CREATE INDEX IF NOT EXISTS idx_ejec_horario ON ejecucion_servicio(servicio_id, timestamp_inicio);

CREATE VIEW IF NOT EXISTS reporte_digemid_privado AS
SELECT
  pc.codigo_digemid AS CodProd,
  vo_empaque.valor AS Precio1_Empaque,
  vo_unidad.valor AS Precio2_Unitario,
  ROUND(CAST(vo_empaque.valor AS REAL) / nf_raiz.unidades_base, 2) AS precio_unitario_derivado,
  CASE
    WHEN vo_empaque.valor IS NULL
      OR vo_unidad.valor IS NULL
      OR ABS(vo_unidad.valor - ROUND(CAST(vo_empaque.valor AS REAL) / nf_raiz.unidades_base, 2)) > 0.01
    THEN 'INCONSISTENTE'
    ELSE 'OK'
  END AS validacion_digemid,
  pc.nombre_comercial,
  pc.registro_sanitario,
  pg.ifa,
  pg.concentracion,
  nf_raiz.unidades_base AS fraccion
FROM nodo_fraccionamiento nf_raiz
JOIN presentacion_comercial pcom ON pcom.id = nf_raiz.presentacion_id
JOIN producto_comercial pc ON pc.id = pcom.producto_comercial_id
JOIN producto_generico pg ON pg.id = pc.producto_generico_id
LEFT JOIN valor_operacional vo_empaque ON vo_empaque.nodo_id = nf_raiz.id
  AND vo_empaque.tipo = 'VENTA_NORMAL'
  AND vo_empaque.estado = 'ACTIVO'
LEFT JOIN nodo_fraccionamiento nf_hoja ON nf_hoja.presentacion_id = nf_raiz.presentacion_id
  AND nf_hoja.tipo_forma_venta = 'FRACCION'
  AND nf_hoja.unidades_base = 1
LEFT JOIN valor_operacional vo_unidad ON vo_unidad.nodo_id = nf_hoja.id
  AND vo_unidad.tipo = 'VENTA_NORMAL'
  AND vo_unidad.estado = 'ACTIVO'
WHERE nf_raiz.nodo_padre_id IS NULL
  AND nf_raiz.estado = 'ACTIVO'
  AND pc.estado = 'ACTIVO'
  AND pc.codigo_digemid IS NOT NULL;
"#;
