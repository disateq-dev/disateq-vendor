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

    Ok(())
}
