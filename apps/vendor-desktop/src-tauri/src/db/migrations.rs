use super::schema;

pub async fn ejecutar_migraciones(db: &sqlx::SqlitePool) -> Result<(), String> {
    sqlx::raw_sql(schema::SCHEMA_CORE)
        .execute(db)
        .await
        .map_err(|e| e.to_string())?;

    let rubro_activo = sqlx::query_scalar::<_, Option<String>>(
        "SELECT rubro_activo FROM config_establecimiento LIMIT 1",
    )
    .fetch_optional(db)
    .await
    .map_err(|e| e.to_string())?
    .flatten();

    if rubro_activo.is_none() || rubro_activo.as_deref() == Some("FARMACIA") {
        sqlx::raw_sql(schema::SCHEMA_FARMACIA)
            .execute(db)
            .await
            .map_err(|e| e.to_string())?;
    }

    migrar_v2_lote_fecha_opcional(db).await?;
    migrar_v3_tipo_valor_operacional(db).await?;
    migrar_v4_stock_minimo_presentacion(db).await?;
    migrar_v5_estado_registro_sanitario(db).await?;
    migrar_v6_codigo_interno(db).await?;
    migrar_v7_correccion_catalogo(db).await?;
    migrar_v8_principios_activos(db).await?;
    migrar_v9_campos_regulatorios_ifa(db).await?;
    migrar_v10_campos_catalogo_ifa(db).await?;

    Ok(())
}

async fn migrar_v2_lote_fecha_opcional(db: &sqlx::SqlitePool) -> Result<(), String> {
    let existe_lote = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'lote'",
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())?;

    if existe_lote == 0 {
        return Ok(());
    }

    sqlx::query("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER)")
        .execute(db)
        .await
        .map_err(|e| e.to_string())?;

    let version = sqlx::query_scalar::<_, i64>("SELECT COALESCE(MAX(version), 0) FROM schema_migrations")
        .fetch_one(db)
        .await
        .map_err(|e| e.to_string())?;

    if version >= 2 {
        return Ok(());
    }

    let mut tx = db.begin().await.map_err(|e| e.to_string())?;

    sqlx::query(
        "CREATE TABLE lote_temp (
            id TEXT PRIMARY KEY,
            presentacion_id TEXT NOT NULL REFERENCES presentacion_comercial(id),
            numero_lote TEXT NOT NULL,
            fecha_vencimiento TEXT,
            fecha_fabricacion TEXT,
            cantidad_ingresada REAL NOT NULL,
            cantidad_disponible REAL NOT NULL,
            proveedor_id TEXT REFERENCES proveedor(id),
            precio_compra REAL,
            estado TEXT NOT NULL DEFAULT 'VIGENTE',
            creado_en TEXT NOT NULL
        )",
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query(
        "INSERT INTO lote_temp (
            id, presentacion_id, numero_lote, fecha_vencimiento, fecha_fabricacion,
            cantidad_ingresada, cantidad_disponible, proveedor_id, precio_compra, estado, creado_en
        )
        SELECT
            id, presentacion_id, numero_lote, fecha_vencimiento, fecha_fabricacion,
            cantidad_ingresada, cantidad_disponible, proveedor_id, precio_compra, estado, creado_en
        FROM lote",
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query("DROP TABLE lote")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query("ALTER TABLE lote_temp RENAME TO lote")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_lote_presentacion ON lote(presentacion_id)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_lote_vencimiento ON lote(fecha_vencimiento)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_lote_estado ON lote(estado)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_lote_fefo ON lote(presentacion_id, estado, fecha_vencimiento)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    sqlx::query("INSERT INTO schema_migrations (version) VALUES (2)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())
}

async fn migrar_v3_tipo_valor_operacional(db: &sqlx::SqlitePool) -> Result<(), String> {
    let existe_valor_operacional = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'valor_operacional'",
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())?;

    if existe_valor_operacional == 0 {
        return Ok(());
    }

    sqlx::query("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER)")
        .execute(db)
        .await
        .map_err(|e| e.to_string())?;

    let version = sqlx::query_scalar::<_, i64>("SELECT COALESCE(MAX(version), 0) FROM schema_migrations")
        .fetch_one(db)
        .await
        .map_err(|e| e.to_string())?;

    if version >= 3 {
        return Ok(());
    }

    let mut tx = db.begin().await.map_err(|e| e.to_string())?;

    sqlx::query("UPDATE valor_operacional SET tipo = 'VENTA_NORMAL' WHERE tipo = 'NORMAL'")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query("DROP VIEW IF EXISTS reporte_digemid_privado")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query(
        "CREATE VIEW reporte_digemid_privado AS
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
  AND pc.codigo_digemid IS NOT NULL",
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query("INSERT INTO schema_migrations (version) VALUES (3)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())
}

async fn migrar_v4_stock_minimo_presentacion(db: &sqlx::SqlitePool) -> Result<(), String> {
    let existe_presentacion_comercial = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'presentacion_comercial'",
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())?;

    if existe_presentacion_comercial == 0 {
        return Ok(());
    }

    sqlx::query("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER)")
        .execute(db)
        .await
        .map_err(|e| e.to_string())?;

    let version = sqlx::query_scalar::<_, i64>("SELECT COALESCE(MAX(version), 0) FROM schema_migrations")
        .fetch_one(db)
        .await
        .map_err(|e| e.to_string())?;

    if version >= 4 {
        return Ok(());
    }

    let mut tx = db.begin().await.map_err(|e| e.to_string())?;
    let existe_stock_minimo = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM pragma_table_info('presentacion_comercial') WHERE name = 'stock_minimo'",
    )
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    if existe_stock_minimo == 0 {
        sqlx::query("ALTER TABLE presentacion_comercial ADD COLUMN stock_minimo REAL NOT NULL DEFAULT 10.0")
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    sqlx::query("INSERT INTO schema_migrations (version) VALUES (4)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())
}

async fn migrar_v5_estado_registro_sanitario(db: &sqlx::SqlitePool) -> Result<(), String> {
    let existe_producto_comercial = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'producto_comercial'",
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())?;

    if existe_producto_comercial == 0 {
        return Ok(());
    }

    sqlx::query("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER)")
        .execute(db)
        .await
        .map_err(|e| e.to_string())?;

    let version = sqlx::query_scalar::<_, i64>("SELECT COALESCE(MAX(version), 0) FROM schema_migrations")
        .fetch_one(db)
        .await
        .map_err(|e| e.to_string())?;

    if version >= 5 {
        return Ok(());
    }

    let mut tx = db.begin().await.map_err(|e| e.to_string())?;
    let existe_estado_registro_sanitario = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM pragma_table_info('producto_comercial') WHERE name = 'estado_registro_sanitario'",
    )
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    if existe_estado_registro_sanitario == 0 {
        sqlx::query("ALTER TABLE producto_comercial ADD COLUMN estado_registro_sanitario TEXT NOT NULL DEFAULT 'VIGENTE'")
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    sqlx::query("INSERT INTO schema_migrations (version) VALUES (5)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())
}

async fn migrar_v6_codigo_interno(db: &sqlx::SqlitePool) -> Result<(), String> {
    let existe_producto_comercial = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'producto_comercial'",
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())?;

    if existe_producto_comercial == 0 {
        return Ok(());
    }

    sqlx::query("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER)")
        .execute(db)
        .await
        .map_err(|e| e.to_string())?;

    let version = sqlx::query_scalar::<_, i64>("SELECT COALESCE(MAX(version), 0) FROM schema_migrations")
        .fetch_one(db)
        .await
        .map_err(|e| e.to_string())?;

    if version >= 6 {
        return Ok(());
    }

    let mut tx = db.begin().await.map_err(|e| e.to_string())?;
    let existe_codigo_interno = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM pragma_table_info('producto_comercial') WHERE name = 'codigo_interno'",
    )
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    if existe_codigo_interno == 0 {
        sqlx::query("ALTER TABLE producto_comercial ADD COLUMN codigo_interno TEXT")
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    sqlx::query("INSERT INTO schema_migrations (version) VALUES (6)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())
}

async fn migrar_v7_correccion_catalogo(db: &sqlx::SqlitePool) -> Result<(), String> {
    let existe_producto_comercial = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'producto_comercial'",
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())?;

    if existe_producto_comercial == 0 {
        return Ok(());
    }

    sqlx::query("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER)")
        .execute(db)
        .await
        .map_err(|e| e.to_string())?;

    let version = sqlx::query_scalar::<_, i64>("SELECT COALESCE(MAX(version), 0) FROM schema_migrations")
        .fetch_one(db)
        .await
        .map_err(|e| e.to_string())?;

    if version >= 7 {
        return Ok(());
    }

    let mut tx = db.begin().await.map_err(|e| e.to_string())?;
    let existe_correccion_catalogo = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'correccion_catalogo'",
    )
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    if existe_correccion_catalogo == 0 {
        sqlx::query(
            "CREATE TABLE IF NOT EXISTS correccion_catalogo (
  id TEXT PRIMARY KEY,
  tabla TEXT NOT NULL,
  entidad_id TEXT NOT NULL,
  campo TEXT NOT NULL,
  valor_anterior TEXT NOT NULL,
  valor_nuevo TEXT NOT NULL,
  motivo TEXT NOT NULL,
  operador_id TEXT NOT NULL,
  creado_en TEXT NOT NULL
)",
        )
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

        sqlx::query("CREATE INDEX IF NOT EXISTS idx_correccion_entidad ON correccion_catalogo(tabla, entidad_id)")
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_correccion_operador ON correccion_catalogo(operador_id)")
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    sqlx::query("INSERT INTO schema_migrations (version) VALUES (7)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())
}

async fn migrar_v8_principios_activos(db: &sqlx::SqlitePool) -> Result<(), String> {
    let existe_producto_generico = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'producto_generico'",
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())?;

    if existe_producto_generico == 0 {
        return Ok(());
    }

    sqlx::query("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER)")
        .execute(db)
        .await
        .map_err(|e| e.to_string())?;

    let version = sqlx::query_scalar::<_, i64>("SELECT COALESCE(MAX(version), 0) FROM schema_migrations")
        .fetch_one(db)
        .await
        .map_err(|e| e.to_string())?;

    if version >= 8 {
        return Ok(());
    }

    let mut tx = db.begin().await.map_err(|e| e.to_string())?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS principio_activo (
  id TEXT PRIMARY KEY,
  nombre_dci TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  activo INTEGER NOT NULL DEFAULT 1,
  creado_en TEXT NOT NULL
)",
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS producto_principio_activo (
  producto_generico_id TEXT NOT NULL REFERENCES producto_generico(id),
  principio_activo_id TEXT NOT NULL REFERENCES principio_activo(id),
  orden INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (producto_generico_id, principio_activo_id)
)",
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_ppa_generico ON producto_principio_activo(producto_generico_id)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_ppa_principio ON producto_principio_activo(principio_activo_id)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_principio_dci ON principio_activo(nombre_dci)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    let productos = sqlx::query_as::<_, (String, Option<String>)>("SELECT id, ifa FROM producto_generico")
        .fetch_all(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    let creado_en = sqlx::query_scalar::<_, String>("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')")
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    for (producto_generico_id, ifa) in productos {
        let Some(ifa_valor) = ifa else {
            continue;
        };
        if ifa_valor.trim().is_empty() {
            continue;
        }

        for (index, segmento) in ifa_valor.split(" + ").enumerate() {
            let nombre_dci = segmento.trim().to_uppercase();
            if nombre_dci.is_empty() {
                continue;
            }

            let principio_activo_id = sqlx::query_scalar::<_, Option<String>>(
                "SELECT id FROM principio_activo WHERE nombre_dci = ?",
            )
            .bind(&nombre_dci)
            .fetch_optional(&mut *tx)
            .await
            .map_err(|e| e.to_string())?
            .flatten();

            let principio_activo_id = if let Some(id) = principio_activo_id {
                id
            } else {
                let id = uuid::Uuid::new_v4().to_string();
                sqlx::query(
                    "INSERT INTO principio_activo (id, nombre_dci, descripcion, activo, creado_en) VALUES (?, ?, ?, ?, ?)",
                )
                .bind(&id)
                .bind(&nombre_dci)
                .bind(Option::<String>::None)
                .bind(1_i64)
                .bind(&creado_en)
                .execute(&mut *tx)
                .await
                .map_err(|e| e.to_string())?;
                id
            };

            let existe_asociacion = sqlx::query_scalar::<_, i64>(
                "SELECT COUNT(*) FROM producto_principio_activo WHERE producto_generico_id = ? AND principio_activo_id = ?",
            )
            .bind(&producto_generico_id)
            .bind(&principio_activo_id)
            .fetch_one(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;

            if existe_asociacion == 0 {
                sqlx::query(
                    "INSERT INTO producto_principio_activo (producto_generico_id, principio_activo_id, orden) VALUES (?, ?, ?)",
                )
                .bind(&producto_generico_id)
                .bind(&principio_activo_id)
                .bind((index + 1) as i64)
                .execute(&mut *tx)
                .await
                .map_err(|e| e.to_string())?;
            }
        }
    }

    sqlx::query("INSERT INTO schema_migrations (version) VALUES (8)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())
}

async fn migrar_v9_campos_regulatorios_ifa(db: &sqlx::SqlitePool) -> Result<(), String> {
    let existe_principio_activo = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'principio_activo'",
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())?;

    if existe_principio_activo == 0 {
        return Ok(());
    }

    sqlx::query("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER)")
        .execute(db)
        .await
        .map_err(|e| e.to_string())?;

    let version = sqlx::query_scalar::<_, i64>("SELECT COALESCE(MAX(version), 0) FROM schema_migrations")
        .fetch_one(db)
        .await
        .map_err(|e| e.to_string())?;

    if version >= 9 {
        return Ok(());
    }

    let mut tx = db.begin().await.map_err(|e| e.to_string())?;
    let existe_es_esencial_minsa = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM pragma_table_info('principio_activo') WHERE name = 'es_esencial_minsa'",
    )
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    if existe_es_esencial_minsa == 0 {
        sqlx::query("ALTER TABLE principio_activo ADD COLUMN es_esencial_minsa INTEGER NOT NULL DEFAULT 0")
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    let existe_es_psicotropico = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM pragma_table_info('principio_activo') WHERE name = 'es_psicotropico'",
    )
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    if existe_es_psicotropico == 0 {
        sqlx::query("ALTER TABLE principio_activo ADD COLUMN es_psicotropico INTEGER NOT NULL DEFAULT 0")
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    sqlx::query("INSERT INTO schema_migrations (version) VALUES (9)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())
}

async fn migrar_v10_campos_catalogo_ifa(db: &sqlx::SqlitePool) -> Result<(), String> {
    let existe = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'principio_activo'",
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())?;

    if existe == 0 {
        return Ok(());
    }

    sqlx::query("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER)")
        .execute(db)
        .await
        .map_err(|e| e.to_string())?;

    let version = sqlx::query_scalar::<_, i64>("SELECT COALESCE(MAX(version), 0) FROM schema_migrations")
        .fetch_one(db)
        .await
        .map_err(|e| e.to_string())?;

    if version >= 10 {
        return Ok(());
    }

    let mut tx = db.begin().await.map_err(|e| e.to_string())?;

    let tiene_descripcion_uso = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM pragma_table_info('principio_activo') WHERE name = 'descripcion_uso'",
    )
    .fetch_one(&mut *tx).await.map_err(|e| e.to_string())?;
    if tiene_descripcion_uso == 0 {
        sqlx::query("ALTER TABLE principio_activo ADD COLUMN descripcion_uso TEXT NOT NULL DEFAULT ''")
            .execute(&mut *tx).await.map_err(|e| e.to_string())?;
    }

    let tiene_grupo = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM pragma_table_info('principio_activo') WHERE name = 'grupo_terapeutico'",
    )
    .fetch_one(&mut *tx).await.map_err(|e| e.to_string())?;
    if tiene_grupo == 0 {
        sqlx::query("ALTER TABLE principio_activo ADD COLUMN grupo_terapeutico TEXT NOT NULL DEFAULT ''")
            .execute(&mut *tx).await.map_err(|e| e.to_string())?;
    }

    let tiene_condicion = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM pragma_table_info('principio_activo') WHERE name = 'condicion_venta'",
    )
    .fetch_one(&mut *tx).await.map_err(|e| e.to_string())?;
    if tiene_condicion == 0 {
        sqlx::query("ALTER TABLE principio_activo ADD COLUMN condicion_venta TEXT NOT NULL DEFAULT 'OTC'")
            .execute(&mut *tx).await.map_err(|e| e.to_string())?;
    }

    let tiene_combinacion = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM pragma_table_info('principio_activo') WHERE name = 'es_combinacion'",
    )
    .fetch_one(&mut *tx).await.map_err(|e| e.to_string())?;
    if tiene_combinacion == 0 {
        sqlx::query("ALTER TABLE principio_activo ADD COLUMN es_combinacion INTEGER NOT NULL DEFAULT 0")
            .execute(&mut *tx).await.map_err(|e| e.to_string())?;
    }

    let creado_en = sqlx::query_scalar::<_, String>("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')")
        .fetch_one(&mut *tx).await.map_err(|e| e.to_string())?;

    for item in super::seed_principios::SEED_PRINCIPIOS_ACTIVOS {
        let id = uuid::Uuid::new_v4().to_string();
        sqlx::query(
            "INSERT OR IGNORE INTO principio_activo
                (id, nombre_dci, descripcion_uso, grupo_terapeutico, condicion_venta, es_combinacion, es_psicotropico, es_esencial_minsa, activo, creado_en)
             VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1, ?)",
        )
        .bind(&id)
        .bind(item.nombre_dci)
        .bind(item.descripcion_uso)
        .bind(item.grupo_terapeutico)
        .bind(item.condicion_venta)
        .bind(item.es_combinacion)
        .bind(item.es_psicotropico)
        .bind(&creado_en)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    }

    sqlx::query("INSERT INTO schema_migrations (version) VALUES (10)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())
}
