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
    migrar_v11_tipo_recurso_producto_comercial(db).await?;
    migrar_v12_servicio_catalogo(db).await?;
    migrar_v13_seed_config_establecimiento(db).await?;
    migrar_v14_pedido_proveedor(db).await?;
    migrar_v15_error_log(db).await?;
    migrar_v16_ventas(db).await?;
    migrar_v17_comprobantes(db).await?;
    migrar_v18_sesion_caja(db).await?;
    migrar_v19_operadores(db).await?;
    migrar_v20_bonus_distribuidor(db).await?;
    migrar_v21_sesion_caja_arqueo(db).await?;
    migrar_v22_bloque_operacional(db).await?;
    migrar_v23_operadores_sistema(db).await?;

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

async fn migrar_v11_tipo_recurso_producto_comercial(db: &sqlx::SqlitePool) -> Result<(), String> {
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

    if version >= 11 {
        return Ok(());
    }

    let mut tx = db.begin().await.map_err(|e| e.to_string())?;
    let existe_tipo_recurso = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM pragma_table_info('producto_comercial') WHERE name = 'tipo_recurso'",
    )
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    if existe_tipo_recurso == 0 {
        sqlx::query("ALTER TABLE producto_comercial ADD COLUMN tipo_recurso TEXT NOT NULL DEFAULT 'MEDICAMENTO'")
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    sqlx::query("INSERT INTO schema_migrations (version) VALUES (11)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())
}

async fn migrar_v12_servicio_catalogo(db: &sqlx::SqlitePool) -> Result<(), String> {
    let existe = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='producto_comercial'",
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

    let version = sqlx::query_scalar::<_, i64>(
        "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())?;
    if version >= 12 {
        return Ok(());
    }

    let mut tx = db.begin().await.map_err(|e| e.to_string())?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS servicio_catalogo (
          id TEXT PRIMARY KEY,
          rubro TEXT NOT NULL DEFAULT 'FARMACIA',
          tipo_servicio TEXT NOT NULL,
          nombre TEXT NOT NULL,
          descripcion TEXT,
          duracion_minutos INTEGER,
          estado TEXT NOT NULL DEFAULT 'ACTIVO',
          creado_en TEXT NOT NULL
        )",
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_serv_cat_rubro ON servicio_catalogo(rubro, estado)",
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    let existe_sf = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='servicio_farmacia'",
    )
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    if existe_sf > 0 {
        sqlx::query(
            "INSERT OR IGNORE INTO servicio_catalogo
               (id, rubro, tipo_servicio, nombre, descripcion, duracion_minutos, estado, creado_en)
             SELECT id, 'FARMACIA', tipo_servicio, nombre,
                    descripcion, duracion_minutos, estado, creado_en
             FROM servicio_farmacia",
        )
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

        sqlx::query(
            "CREATE TABLE IF NOT EXISTS ejecucion_servicio_nueva (
              id TEXT PRIMARY KEY,
              servicio_id TEXT NOT NULL REFERENCES servicio_catalogo(id),
              operador_id TEXT NOT NULL,
              turno_id TEXT,
              pedido_id TEXT,
              timestamp_inicio TEXT NOT NULL,
              timestamp_fin TEXT,
              duracion_minutos INTEGER,
              observacion TEXT,
              creado_en TEXT NOT NULL
            )",
        )
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

        sqlx::query(
            "INSERT OR IGNORE INTO ejecucion_servicio_nueva
               (id, servicio_id, operador_id, turno_id, pedido_id,
                timestamp_inicio, timestamp_fin, duracion_minutos, observacion, creado_en)
             SELECT id, servicio_id, operador_id, turno_id, pedido_id,
                    timestamp_inicio, timestamp_fin, duracion_minutos, observacion, creado_en
             FROM ejecucion_servicio",
        )
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

        sqlx::query("DROP TABLE ejecucion_servicio")
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;

        sqlx::query("ALTER TABLE ejecucion_servicio_nueva RENAME TO ejecucion_servicio")
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;

        for idx in &[
            "CREATE INDEX IF NOT EXISTS idx_ejec_servicio ON ejecucion_servicio(servicio_id)",
            "CREATE INDEX IF NOT EXISTS idx_ejec_operador ON ejecucion_servicio(operador_id)",
            "CREATE INDEX IF NOT EXISTS idx_ejec_turno ON ejecucion_servicio(turno_id)",
            "CREATE INDEX IF NOT EXISTS idx_ejec_timestamp ON ejecucion_servicio(timestamp_inicio)",
            "CREATE INDEX IF NOT EXISTS idx_ejec_horario ON ejecucion_servicio(servicio_id, timestamp_inicio)",
        ] {
            sqlx::query(idx)
                .execute(&mut *tx)
                .await
                .map_err(|e| e.to_string())?;
        }

        sqlx::query("DROP TABLE servicio_farmacia")
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    let tiene_margen = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM pragma_table_info('config_establecimiento') WHERE name='margen_defecto'",
    )
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    if tiene_margen == 0 {
        sqlx::query(
            "ALTER TABLE config_establecimiento ADD COLUMN margen_defecto REAL NOT NULL DEFAULT 0.30",
        )
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    }

    sqlx::query("INSERT INTO schema_migrations (version) VALUES (12)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())
}

async fn migrar_v13_seed_config_establecimiento(db: &sqlx::SqlitePool) -> Result<(), String> {
    sqlx::query("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER)")
        .execute(db)
        .await
        .map_err(|e| e.to_string())?;

    let version = sqlx::query_scalar::<_, i64>(
        "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())?;

    if version >= 13 {
        return Ok(());
    }

    let mut tx = db.begin().await.map_err(|e| e.to_string())?;

    let tiene_fila = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM config_establecimiento",
    )
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    if tiene_fila == 0 {
        let creado_en = sqlx::query_scalar::<_, String>(
            "SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')",
        )
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

        let uuid = sqlx::query_scalar::<_, String>(
            "SELECT lower(hex(randomblob(4)) || '-' || hex(randomblob(2)) || '-4' || substr(hex(randomblob(2)),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(hex(randomblob(2)),2) || '-' || hex(randomblob(6)))",
        )
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

        sqlx::query(
            "INSERT OR IGNORE INTO config_establecimiento
               (id, rubro_activo, margen_defecto, creado_en)
             VALUES (?, 'FARMACIA', 0.30, ?)",
        )
        .bind(&uuid)
        .bind(&creado_en)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    }

    sqlx::query("INSERT INTO schema_migrations (version) VALUES (13)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())
}

async fn migrar_v14_pedido_proveedor(db: &sqlx::SqlitePool) -> Result<(), String> {
    let existe_proveedor = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'proveedor'",
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())?;

    if existe_proveedor == 0 {
        return Ok(());
    }

    sqlx::query("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER)")
        .execute(db)
        .await
        .map_err(|e| e.to_string())?;

    let version = sqlx::query_scalar::<_, i64>(
        "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())?;

    if version >= 14 {
        return Ok(());
    }

    let mut tx = db.begin().await.map_err(|e| e.to_string())?;

    let existe_pedido = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'pedido_proveedor'",
    )
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    if existe_pedido == 0 {
        sqlx::query(
            "CREATE TABLE pedido_proveedor (
              id TEXT PRIMARY KEY,
              proveedor_id TEXT NOT NULL REFERENCES proveedor(id),
              operador_id TEXT NOT NULL,
              estado TEXT NOT NULL DEFAULT 'BORRADOR',
              referencia TEXT,
              observacion TEXT,
              fecha_esperada TEXT,
              creado_en TEXT NOT NULL,
              modificado_en TEXT NOT NULL
            )",
        )
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

        sqlx::query(
            "CREATE INDEX idx_pedido_proveedor_estado ON pedido_proveedor(proveedor_id, estado)",
        )
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

        sqlx::query(
            "CREATE INDEX idx_pedido_proveedor_fecha ON pedido_proveedor(fecha_esperada)",
        )
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    }

    let existe_linea = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM sqlite_master WHERE type = 'table' AND name = 'linea_pedido_proveedor'",
    )
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    if existe_linea == 0 {
        sqlx::query(
            "CREATE TABLE linea_pedido_proveedor (
              id TEXT PRIMARY KEY,
              pedido_id TEXT NOT NULL REFERENCES pedido_proveedor(id),
              presentacion_id TEXT NOT NULL REFERENCES presentacion_comercial(id),
              producto_nombre TEXT NOT NULL,
              presentacion_descripcion TEXT NOT NULL,
              cantidad_pedida REAL NOT NULL,
              cantidad_recibida REAL NOT NULL DEFAULT 0,
              costo_unitario_acordado REAL,
              requiere_lote INTEGER NOT NULL DEFAULT 0,
              creado_en TEXT NOT NULL
            )",
        )
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

        sqlx::query(
            "CREATE INDEX idx_linea_pedido_pedido ON linea_pedido_proveedor(pedido_id)",
        )
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

        sqlx::query(
            "CREATE INDEX idx_linea_pedido_presentacion ON linea_pedido_proveedor(presentacion_id)",
        )
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    }

    sqlx::query("INSERT INTO schema_migrations (version) VALUES (14)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())
}

async fn migrar_v15_error_log(db: &sqlx::SqlitePool) -> Result<(), String> {
    sqlx::query("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER)")
        .execute(db)
        .await
        .map_err(|e| e.to_string())?;

    let version = sqlx::query_scalar::<_, i64>(
        "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())?;

    if version >= 15 {
        return Ok(());
    }

    let mut tx = db.begin().await.map_err(|e| e.to_string())?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS error_log (
          id        INTEGER PRIMARY KEY AUTOINCREMENT,
          nivel     TEXT NOT NULL,
          modulo    TEXT NOT NULL,
          mensaje   TEXT NOT NULL,
          contexto  TEXT,
          sesion_id TEXT,
          timestamp TEXT NOT NULL
        )",
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_error_log_nivel ON error_log(nivel)",
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_error_log_timestamp ON error_log(timestamp)",
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_error_log_modulo ON error_log(modulo, timestamp)",
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query("INSERT INTO schema_migrations (version) VALUES (15)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())
}

async fn migrar_v16_ventas(db: &sqlx::SqlitePool) -> Result<(), String> {
    sqlx::query("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER)")
        .execute(db)
        .await
        .map_err(|e| e.to_string())?;

    let version = sqlx::query_scalar::<_, i64>(
        "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())?;

    if version >= 16 {
        return Ok(());
    }

    let mut tx = db.begin().await.map_err(|e| e.to_string())?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS venta (
          id TEXT PRIMARY KEY,
          codigo TEXT NOT NULL,
          operador_id TEXT NOT NULL,
          caja_codigo TEXT,
          sesion_id TEXT,
          total REAL NOT NULL,
          metodo_pago TEXT NOT NULL,
          tipo_comprobante TEXT NOT NULL DEFAULT 'TIQUE_VENTA',
          estado TEXT NOT NULL DEFAULT 'CONCRETADA',
          concretada_en TEXT NOT NULL,
          creado_en TEXT NOT NULL
        )",
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS linea_venta (
          id TEXT PRIMARY KEY,
          venta_id TEXT NOT NULL REFERENCES venta(id),
          hov_id TEXT NOT NULL,
          nodo_fraccionamiento_id TEXT,
          presentacion_id TEXT,
          nombre_visible TEXT NOT NULL,
          cantidad REAL NOT NULL,
          factor_conversion REAL NOT NULL,
          unidades_base_total REAL NOT NULL,
          valor_aplicado REAL NOT NULL,
          tipo_valor TEXT NOT NULL,
          es_valor_manual INTEGER NOT NULL DEFAULT 0,
          subtotal REAL NOT NULL,
          es_servicio INTEGER NOT NULL DEFAULT 0,
          creado_en TEXT NOT NULL
        )",
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_venta_operador ON venta(operador_id)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_venta_sesion ON venta(sesion_id)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_venta_fecha ON venta(concretada_en)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_linea_venta_venta ON linea_venta(venta_id)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_linea_venta_hov ON linea_venta(hov_id)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_linea_venta_presentacion ON linea_venta(presentacion_id)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query("INSERT INTO schema_migrations (version) VALUES (16)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())
}

async fn migrar_v17_comprobantes(db: &sqlx::SqlitePool) -> Result<(), String> {
    sqlx::query("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER)")
        .execute(db)
        .await
        .map_err(|e| e.to_string())?;

    let version = sqlx::query_scalar::<_, i64>(
        "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())?;

    if version >= 17 {
        return Ok(());
    }

    let mut tx = db.begin().await.map_err(|e| e.to_string())?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS comprobante (
          id TEXT PRIMARY KEY,
          venta_id TEXT,
          tipo TEXT NOT NULL,
          serie TEXT NOT NULL,
          correlativo INTEGER NOT NULL,
          codigo_unico TEXT NOT NULL UNIQUE,
          es_formal INTEGER NOT NULL DEFAULT 0,
          requiere_envio_sunat INTEGER NOT NULL DEFAULT 0,
          leyenda_no_formal TEXT,
          estado TEXT NOT NULL DEFAULT 'EMITIDO',
          estado_sunat TEXT NOT NULL DEFAULT 'NO_APLICA',
          motivo_anulacion TEXT,
          cdr TEXT,
          fecha_envio_sunat TEXT,
          emisor_ruc TEXT NOT NULL,
          emisor_razon_social TEXT NOT NULL,
          emisor_direccion TEXT NOT NULL,
          receptor_tipo_doc TEXT NOT NULL,
          receptor_num_doc TEXT,
          receptor_nombre TEXT NOT NULL,
          receptor_es_generico INTEGER NOT NULL DEFAULT 1,
          receptor_cliente_id TEXT,
          subtotal REAL NOT NULL,
          igv REAL NOT NULL,
          isc REAL NOT NULL DEFAULT 0,
          total REAL NOT NULL,
          moneda TEXT NOT NULL DEFAULT 'PEN',
          metodo_pago TEXT NOT NULL,
          regimen TEXT NOT NULL DEFAULT 'GENERAL',
          incluye_detraccion INTEGER NOT NULL DEFAULT 0,
          operador_id TEXT NOT NULL,
          sesion_id TEXT,
          caja_codigo TEXT,
          enviado_por_canal TEXT NOT NULL DEFAULT 'NINGUNO',
          emitido_en TEXT NOT NULL,
          creado_en TEXT NOT NULL
        )",
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS linea_comprobante (
          id TEXT PRIMARY KEY,
          comprobante_id TEXT NOT NULL,
          descripcion TEXT NOT NULL,
          cantidad REAL NOT NULL,
          valor_unitario REAL NOT NULL,
          subtotal REAL NOT NULL,
          tipo_afectacion_igv TEXT NOT NULL,
          tasa_igv REAL NOT NULL DEFAULT 0,
          monto_isc REAL,
          nota_linea TEXT,
          codigo_producto_sunat TEXT,
          creado_en TEXT NOT NULL
        )",
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS correlativo (
          serie TEXT PRIMARY KEY,
          tipo TEXT NOT NULL,
          siguiente INTEGER NOT NULL DEFAULT 1,
          ultimo_emitido INTEGER NOT NULL DEFAULT 0,
          creado_en TEXT NOT NULL,
          actualizado_en TEXT NOT NULL
        )",
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_comprobante_venta ON comprobante(venta_id)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_comprobante_sesion ON comprobante(sesion_id)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_comprobante_fecha ON comprobante(emitido_en)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    sqlx::query(
        "CREATE UNIQUE INDEX IF NOT EXISTS idx_comprobante_serie_corr ON comprobante(serie, correlativo)",
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;
    sqlx::query(
        "CREATE INDEX IF NOT EXISTS idx_linea_comprobante ON linea_comprobante(comprobante_id)",
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query("INSERT INTO schema_migrations (version) VALUES (17)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())
}

async fn migrar_v18_sesion_caja(db: &sqlx::SqlitePool) -> Result<(), String> {
    sqlx::query("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER)")
        .execute(db)
        .await
        .map_err(|e| e.to_string())?;

    let version = sqlx::query_scalar::<_, i64>(
        "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())?;

    if version >= 18 {
        return Ok(());
    }

    let mut tx = db.begin().await.map_err(|e| e.to_string())?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS sesion_caja (
          id TEXT PRIMARY KEY,
          caja_codigo TEXT NOT NULL,
          caja_tipo TEXT NOT NULL,
          operador_nombre TEXT NOT NULL,
          operador_id TEXT,
          terminal TEXT NOT NULL,
          apertura REAL NOT NULL DEFAULT 0,
          motivo TEXT,
          observacion TEXT,
          ref_op TEXT,
          estado TEXT NOT NULL DEFAULT 'ABIERTA',
          close_signal TEXT,
          abierta_en TEXT NOT NULL,
          cerrada_en TEXT,
          creado_en TEXT NOT NULL
        )",
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS movimiento_caja (
          id TEXT PRIMARY KEY,
          sesion_id TEXT NOT NULL,
          tipo TEXT NOT NULL,
          monto REAL NOT NULL,
          motivo TEXT NOT NULL,
          observacion TEXT,
          ref_id TEXT,
          operador_nombre TEXT NOT NULL,
          caja_codigo TEXT NOT NULL,
          terminal TEXT NOT NULL,
          source_type TEXT NOT NULL,
          from_apertura REAL NOT NULL DEFAULT 0,
          from_vendido REAL NOT NULL DEFAULT 0,
          regularization_status TEXT,
          regularization_mode TEXT,
          timestamp TEXT NOT NULL,
          creado_en TEXT NOT NULL
        )",
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS evento_turno (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          sesion_id TEXT NOT NULL,
          tipo TEXT NOT NULL,
          texto TEXT NOT NULL,
          ts TEXT NOT NULL,
          creado_en TEXT NOT NULL
        )",
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_sesion_caja_estado ON sesion_caja(estado)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_sesion_caja_fecha ON sesion_caja(abierta_en)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_movimiento_caja_sesion ON movimiento_caja(sesion_id)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_movimiento_caja_timestamp ON movimiento_caja(timestamp)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_evento_turno_sesion ON evento_turno(sesion_id)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query("INSERT INTO schema_migrations (version) VALUES (18)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())
}

async fn migrar_v19_operadores(db: &sqlx::SqlitePool) -> Result<(), String> {
    sqlx::query("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER)")
        .execute(db)
        .await
        .map_err(|e| e.to_string())?;

    let version = sqlx::query_scalar::<_, i64>(
        "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())?;

    if version >= 19 {
        return Ok(());
    }

    let mut tx = db.begin().await.map_err(|e| e.to_string())?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS operador (
          id TEXT PRIMARY KEY,
          codigo_operador TEXT NOT NULL,
          alias TEXT NOT NULL,
          apellidos TEXT NOT NULL,
          nombres TEXT NOT NULL,
          nombre_completo TEXT NOT NULL,
          dni TEXT,
          telefono TEXT,
          codigo_rol TEXT NOT NULL,
          nombre_rol TEXT NOT NULL,
          base_bloque INTEGER,
          asignacion_bloque_en TEXT,
          liberacion_bloque_en TEXT,
          estado TEXT NOT NULL DEFAULT 'ACTIVO',
          motivo_estado TEXT,
          fecha_estado TEXT,
          pin TEXT NOT NULL DEFAULT '',
          pin_salt TEXT,
          capacidades TEXT NOT NULL DEFAULT '[]',
          registrado_en TEXT NOT NULL,
          registrado_por TEXT NOT NULL,
          modificado_en TEXT NOT NULL
        )",
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query("CREATE UNIQUE INDEX IF NOT EXISTS idx_operador_codigo ON operador(codigo_operador)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    sqlx::query("CREATE UNIQUE INDEX IF NOT EXISTS idx_operador_alias ON operador(alias)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_operador_estado ON operador(estado)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS rol (
          id TEXT PRIMARY KEY,
          codigo TEXT NOT NULL,
          nombre TEXT NOT NULL,
          descripcion TEXT NOT NULL DEFAULT '',
          capacidades TEXT NOT NULL DEFAULT '[]',
          requiere_bloque INTEGER NOT NULL DEFAULT 0,
          activo INTEGER NOT NULL DEFAULT 1,
          creado_en TEXT NOT NULL,
          creado_por TEXT NOT NULL
        )",
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query("CREATE UNIQUE INDEX IF NOT EXISTS idx_rol_codigo ON rol(codigo)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    sqlx::query("CREATE INDEX IF NOT EXISTS idx_rol_activo ON rol(activo)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    let ahora = sqlx::query_scalar::<_, String>(
        "SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')",
    )
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    let cantidad_roles = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM rol")
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    if cantidad_roles == 0 {
        for (codigo, nombre, descripcion, capacidades) in [
            (
                "VEN",
                "Ventas",
                "Operación de venta — apertura de turno, cobro, emisión de comprobantes",
                "[\"gestionar_clientes\"]",
            ),
            (
                "GES",
                "Gestor",
                "Gestión integral de la operación",
                "[\"observar_comprobantes_global\",\"anular_comprobantes\",\"corregir_arqueos\",\"reaperturar_cierres\",\"regularizar_incidencias\",\"observar_continuidad\",\"ver_reportes\",\"gestionar_clientes\",\"gestionar_inventarios\",\"gestionar_compras\"]",
            ),
            (
                "SOP",
                "Soporte",
                "Asistencia técnica y diagnóstico operacional",
                "[\"observar_continuidad\"]",
            ),
            (
                "ADMIN",
                "Administrador",
                "Acceso total al sistema",
                "[\"acceso_total\"]",
            ),
        ] {
            let id = uuid::Uuid::new_v4().to_string();
            sqlx::query(
                "INSERT OR IGNORE INTO rol
                   (id, codigo, nombre, descripcion, capacidades, requiere_bloque, activo, creado_en, creado_por)
                 VALUES (?, ?, ?, ?, ?, 0, 1, ?, 'SISTEMA')",
            )
            .bind(&id)
            .bind(codigo)
            .bind(nombre)
            .bind(descripcion)
            .bind(capacidades)
            .bind(&ahora)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
        }
    }

    let cantidad_operadores = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM operador")
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    if cantidad_operadores == 0 {
        let id = uuid::Uuid::new_v4().to_string();
        sqlx::query(
            "INSERT OR IGNORE INTO operador
               (id, codigo_operador, alias, apellidos, nombres, nombre_completo, dni, telefono,
                codigo_rol, nombre_rol, base_bloque, asignacion_bloque_en, liberacion_bloque_en,
                estado, motivo_estado, fecha_estado, pin, pin_salt, capacidades, registrado_en,
                registrado_por, modificado_en)
             VALUES (?, 'OP001', 'FTEJADA', 'TEJADA QUEVEDO', 'FERNANDO MIGUEL',
                'FERNANDO MIGUEL TEJADA QUEVEDO', NULL, NULL, 'ADMIN', 'Administrador', 900,
                ?, NULL, 'ACTIVO', NULL, NULL,
                'b9776d7ddf459c9ad5b0e1d6ac61e27befb5e99fd62446677600d7472e88a8cc', NULL,
                '[\"corregir_arqueos\",\"reaperturar_cierres\",\"regularizar_incidencias\",\"observar_comprobantes_global\",\"anular_comprobantes\",\"observar_continuidad\",\"gestionar_operadores\",\"gestionar_roles\",\"gestionar_capacidades\",\"gestionar_cajas\",\"gestionar_inventarios\",\"gestionar_compras\",\"gestionar_clientes\",\"ver_reportes\",\"acceso_total\"]',
                ?, 'SISTEMA', ?)",
        )
        .bind(&id)
        .bind(&ahora)
        .bind(&ahora)
        .bind(&ahora)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    }

    sqlx::query("INSERT INTO schema_migrations (version) VALUES (19)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())
}

async fn migrar_v20_bonus_distribuidor(db: &sqlx::SqlitePool) -> Result<(), String> {
    sqlx::query("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER)")
        .execute(db)
        .await
        .map_err(|e| e.to_string())?;

    let version = sqlx::query_scalar::<_, i64>(
        "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())?;

    if version >= 20 {
        return Ok(());
    }

    let mut tx = db.begin().await.map_err(|e| e.to_string())?;

    let existe_unidades_facturadas = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM pragma_table_info('movimiento') WHERE name = 'unidades_facturadas'",
    )
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    if existe_unidades_facturadas == 0 {
        sqlx::query("ALTER TABLE movimiento ADD COLUMN unidades_facturadas REAL")
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    let existe_sincronizado_en_venta = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM pragma_table_info('venta') WHERE name = 'sincronizado_en'",
    )
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    if existe_sincronizado_en_venta == 0 {
        sqlx::query("ALTER TABLE venta ADD COLUMN sincronizado_en TEXT")
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    let existe_sincronizado_en_comprobante = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM pragma_table_info('comprobante') WHERE name = 'sincronizado_en'",
    )
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    if existe_sincronizado_en_comprobante == 0 {
        sqlx::query("ALTER TABLE comprobante ADD COLUMN sincronizado_en TEXT")
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    sqlx::query("INSERT INTO schema_migrations (version) VALUES (20)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())
}

async fn migrar_v21_sesion_caja_arqueo(db: &sqlx::SqlitePool) -> Result<(), String> {
    sqlx::query("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER)")
        .execute(db)
        .await
        .map_err(|e| e.to_string())?;

    let version = sqlx::query_scalar::<_, i64>(
        "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())?;

    if version >= 21 {
        return Ok(());
    }

    let mut tx = db.begin().await.map_err(|e| e.to_string())?;

    let existe_arqueo_json = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM pragma_table_info('sesion_caja') WHERE name = 'arqueo_json'",
    )
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    if existe_arqueo_json == 0 {
        sqlx::query("ALTER TABLE sesion_caja ADD COLUMN arqueo_json TEXT")
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    let existe_correction_json = sqlx::query_scalar::<_, i64>(
        "SELECT COUNT(*) FROM pragma_table_info('sesion_caja') WHERE name = 'correction_json'",
    )
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    if existe_correction_json == 0 {
        sqlx::query("ALTER TABLE sesion_caja ADD COLUMN correction_json TEXT")
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
    }

    sqlx::query("INSERT INTO schema_migrations (version) VALUES (21)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())
}

async fn migrar_v22_bloque_operacional(db: &sqlx::SqlitePool) -> Result<(), String> {
    sqlx::query("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER)")
        .execute(db)
        .await
        .map_err(|e| e.to_string())?;

    let version = sqlx::query_scalar::<_, i64>(
        "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())?;

    if version >= 22 {
        return Ok(());
    }

    let mut tx = db.begin().await.map_err(|e| e.to_string())?;

    sqlx::query(
        "CREATE TABLE IF NOT EXISTS bloque_operacional (
          id TEXT PRIMARY KEY,
          base INTEGER NOT NULL UNIQUE,
          auxiliares INTEGER NOT NULL DEFAULT 2,
          activo INTEGER NOT NULL DEFAULT 1,
          creado_en TEXT NOT NULL,
          creado_por TEXT NOT NULL,
          modificado_en TEXT NOT NULL
        )",
    )
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query("CREATE INDEX IF NOT EXISTS idx_bloque_activo ON bloque_operacional(activo)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    let ahora = sqlx::query_scalar::<_, String>(
        "SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')",
    )
    .fetch_one(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    let cantidad_bloques = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM bloque_operacional")
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    if cantidad_bloques == 0 {
        let id = uuid::Uuid::new_v4().to_string();
        sqlx::query(
            "INSERT INTO bloque_operacional
               (id, base, auxiliares, activo, creado_en, creado_por, modificado_en)
             VALUES (?, 900, 2, 1, ?, 'SISTEMA', ?)",
        )
        .bind(&id)
        .bind(&ahora)
        .bind(&ahora)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    }

    sqlx::query("INSERT INTO schema_migrations (version) VALUES (22)")
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())
}

async fn migrar_v23_operadores_sistema(db: &sqlx::SqlitePool) -> Result<(), String> {
    sqlx::query("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER)")
        .execute(db)
        .await
        .map_err(|e| e.to_string())?;

    let version = sqlx::query_scalar::<_, i64>(
        "SELECT COALESCE(MAX(version), 0) FROM schema_migrations",
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())?;

    if version < 23 {
        let mut tx = db.begin().await.map_err(|e| e.to_string())?;

        let ahora = sqlx::query_scalar::<_, String>(
            "SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')",
        )
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

        sqlx::query("DELETE FROM operador WHERE alias = 'FTEJADA'")
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;

        let existe_maestro = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM operador WHERE alias = 'MAESTRO'",
        )
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

        if existe_maestro == 0 {
            let id = uuid::Uuid::new_v4().to_string();
            sqlx::query(
                "INSERT INTO operador
                   (id, codigo_operador, alias, apellidos, nombres, nombre_completo, dni, telefono,
                    codigo_rol, nombre_rol, base_bloque, asignacion_bloque_en, liberacion_bloque_en,
                    estado, motivo_estado, fecha_estado, pin, pin_salt, capacidades, registrado_en,
                    registrado_por, modificado_en)
                 VALUES (?, 'SYS001', 'MAESTRO', 'SISTEMA', 'MAESTRO',
                    'OPERADOR MAESTRO SISTEMA', NULL, NULL, 'ADMIN', 'Administrador', 900,
                    ?, NULL, 'SISTEMA', NULL, NULL, '', NULL,
                    '[\"corregir_arqueos\",\"reaperturar_cierres\",\"regularizar_incidencias\",\"observar_comprobantes_global\",\"anular_comprobantes\",\"observar_continuidad\",\"gestionar_operadores\",\"gestionar_roles\",\"gestionar_capacidades\",\"gestionar_cajas\",\"gestionar_inventarios\",\"gestionar_compras\",\"gestionar_clientes\",\"ver_reportes\",\"acceso_total\"]',
                    ?, 'SISTEMA', ?)",
            )
            .bind(&id)
            .bind(&ahora)
            .bind(&ahora)
            .bind(&ahora)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
        }

        let existe_soporte = sqlx::query_scalar::<_, i64>(
            "SELECT COUNT(*) FROM operador WHERE alias = 'SOPORTE'",
        )
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

        if existe_soporte == 0 {
            let id = uuid::Uuid::new_v4().to_string();
            sqlx::query(
                "INSERT INTO operador
                   (id, codigo_operador, alias, apellidos, nombres, nombre_completo, dni, telefono,
                    codigo_rol, nombre_rol, base_bloque, asignacion_bloque_en, liberacion_bloque_en,
                    estado, motivo_estado, fecha_estado, pin, pin_salt, capacidades, registrado_en,
                    registrado_por, modificado_en)
                 VALUES (?, 'SYS002', 'SOPORTE', 'SISTEMA', 'SOPORTE',
                    'OPERADOR SOPORTE SISTEMA', NULL, NULL, 'SOP', 'Soporte', 900,
                    ?, NULL, 'SISTEMA', NULL, NULL, '', NULL,
                    '[\"observar_continuidad\",\"ver_reportes\",\"gestionar_clientes\",\"observar_comprobantes_global\",\"gestionar_inventarios\",\"gestionar_operadores\",\"gestionar_cajas\"]',
                    ?, 'SISTEMA', ?)",
            )
            .bind(&id)
            .bind(&ahora)
            .bind(&ahora)
            .bind(&ahora)
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;
        }

        sqlx::query("INSERT INTO schema_migrations (version) VALUES (23)")
            .execute(&mut *tx)
            .await
            .map_err(|e| e.to_string())?;

        tx.commit().await.map_err(|e| e.to_string())?;
    }

    asegurar_operador_sistema(
        db,
        "SYS001",
        "MAESTRO",
        "SISTEMA",
        "MAESTRO",
        "OPERADOR MAESTRO SISTEMA",
        "ADMIN",
        "Administrador",
        "[\"corregir_arqueos\",\"reaperturar_cierres\",\"regularizar_incidencias\",\"observar_comprobantes_global\",\"anular_comprobantes\",\"observar_continuidad\",\"gestionar_operadores\",\"gestionar_roles\",\"gestionar_capacidades\",\"gestionar_cajas\",\"gestionar_inventarios\",\"gestionar_compras\",\"gestionar_clientes\",\"ver_reportes\",\"acceso_total\"]",
    )
    .await?;

    asegurar_operador_sistema(
        db,
        "SYS002",
        "SOPORTE",
        "SISTEMA",
        "SOPORTE",
        "OPERADOR SOPORTE SISTEMA",
        "SOP",
        "Soporte",
        "[\"observar_continuidad\",\"ver_reportes\",\"gestionar_clientes\",\"observar_comprobantes_global\",\"gestionar_inventarios\",\"gestionar_operadores\",\"gestionar_cajas\"]",
    )
    .await
}

async fn asegurar_operador_sistema(
    db: &sqlx::SqlitePool,
    codigo_operador: &str,
    alias: &str,
    apellidos: &str,
    nombres: &str,
    nombre_completo: &str,
    codigo_rol: &str,
    nombre_rol: &str,
    capacidades: &str,
) -> Result<(), String> {
    let existe = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM operador WHERE alias = ?")
        .bind(alias)
        .fetch_one(db)
        .await
        .map_err(|e| e.to_string())?;

    if existe > 0 {
        return Ok(());
    }

    let ahora = sqlx::query_scalar::<_, String>(
        "SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')",
    )
    .fetch_one(db)
    .await
    .map_err(|e| e.to_string())?;
    let id = uuid::Uuid::new_v4().to_string();

    sqlx::query(
        "INSERT OR IGNORE INTO operador
           (id, codigo_operador, alias, apellidos, nombres, nombre_completo, dni, telefono,
            codigo_rol, nombre_rol, base_bloque, asignacion_bloque_en, liberacion_bloque_en,
            estado, motivo_estado, fecha_estado, pin, pin_salt, capacidades, registrado_en,
            registrado_por, modificado_en)
         VALUES (?, ?, ?, ?, ?, ?, NULL, NULL, ?, ?, 900, ?, NULL, 'SISTEMA',
            NULL, NULL, '', NULL, ?, ?, 'SISTEMA', ?)",
    )
    .bind(&id)
    .bind(codigo_operador)
    .bind(alias)
    .bind(apellidos)
    .bind(nombres)
    .bind(nombre_completo)
    .bind(codigo_rol)
    .bind(nombre_rol)
    .bind(&ahora)
    .bind(capacidades)
    .bind(&ahora)
    .bind(&ahora)
    .execute(db)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}
