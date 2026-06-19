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
