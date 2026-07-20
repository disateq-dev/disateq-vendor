use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize, Clone, sqlx::FromRow)]
pub struct AutorizacionSupervision {
    pub id:               String,
    pub caja_code:        String,
    pub session_id:       String,
    #[serde(rename = "type")]
    pub tipo:             String,
    pub motivo:           String,
    pub authorized_by:    String,
    pub authorized_at:    String,
    pub status:           String,
    pub executed_by:      Option<String>,
    pub executed_at:      Option<String>,
    pub validated_by:     Option<String>,
    pub validated_at:     Option<String>,
    pub postponed_motivo: Option<String>,
    pub postponed_at:     Option<String>,
    pub postponed_by:     Option<String>,
}

#[tauri::command]
pub async fn cargar_autorizaciones_supervision(
    db_instances: tauri::State<'_, tauri_plugin_sql::DbInstances>,
) -> Result<Vec<AutorizacionSupervision>, String> {
    let instances = db_instances.0.read().await;
    let db = instances
        .get("sqlite:disateq.db")
        .ok_or_else(|| String::from("DB no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    let rows = sqlx::query_as::<_, AutorizacionSupervision>(
        r#"SELECT
            id, caja_code, session_id, type as tipo, motivo,
            authorized_by, authorized_at, status,
            executed_by, executed_at,
            validated_by, validated_at,
            postponed_motivo, postponed_at, postponed_by
           FROM autorizacion_supervision
           ORDER BY authorized_at DESC"#,
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(rows)
}

#[tauri::command]
pub async fn obtener_autorizaciones_activas_bloque(
    block_prefix: String,
    db_instances: tauri::State<'_, tauri_plugin_sql::DbInstances>,
) -> Result<Vec<AutorizacionSupervision>, String> {
    let instances = db_instances.0.read().await;
    let db = instances
        .get("sqlite:disateq.db")
        .ok_or_else(|| String::from("DB no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    let prefijo = format!("{}%", block_prefix);

    let rows = sqlx::query_as::<_, AutorizacionSupervision>(
        r#"SELECT
            id, caja_code, session_id, type as tipo, motivo,
            authorized_by, authorized_at, status,
            executed_by, executed_at,
            validated_by, validated_at,
            postponed_motivo, postponed_at, postponed_by
           FROM autorizacion_supervision
           WHERE caja_code LIKE ? AND status = 'emitida'
           ORDER BY authorized_at ASC"#,
    )
    .bind(prefijo)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(rows)
}

#[derive(Debug, Deserialize)]
pub struct RegistrarAutorizacionInput {
    pub id:            String,
    pub caja_code:     String,
    pub session_id:    String,
    #[serde(rename = "type")]
    pub tipo:          String,
    pub motivo:        String,
    pub authorized_by: String,
    pub authorized_at: String,
}

#[tauri::command]
pub async fn registrar_autorizacion_supervision(
    input: RegistrarAutorizacionInput,
    db_instances: tauri::State<'_, tauri_plugin_sql::DbInstances>,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances
        .get("sqlite:disateq.db")
        .ok_or_else(|| String::from("DB no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    sqlx::query(
        "INSERT INTO autorizacion_supervision
           (id, caja_code, session_id, type, motivo, authorized_by, authorized_at, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'emitida')",
    )
    .bind(input.id)
    .bind(input.caja_code)
    .bind(input.session_id)
    .bind(input.tipo)
    .bind(input.motivo)
    .bind(input.authorized_by)
    .bind(input.authorized_at)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn ejecutar_autorizacion_supervision(
    id: String,
    executed_by: String,
    db_instances: tauri::State<'_, tauri_plugin_sql::DbInstances>,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances
        .get("sqlite:disateq.db")
        .ok_or_else(|| String::from("DB no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    let ahora = sqlx::query_scalar::<_, String>(
        "SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')",
    )
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query(
        "UPDATE autorizacion_supervision
         SET status = 'ejecutada', executed_by = ?, executed_at = ?
         WHERE id = ?",
    )
    .bind(executed_by)
    .bind(ahora)
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn validar_autorizacion_supervision(
    id: String,
    validated_by: String,
    db_instances: tauri::State<'_, tauri_plugin_sql::DbInstances>,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances
        .get("sqlite:disateq.db")
        .ok_or_else(|| String::from("DB no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    let ahora = sqlx::query_scalar::<_, String>(
        "SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')",
    )
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query(
        "UPDATE autorizacion_supervision
         SET status = 'validada', validated_by = ?, validated_at = ?
         WHERE id = ?",
    )
    .bind(validated_by)
    .bind(ahora)
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn postergar_autorizacion_supervision(
    id: String,
    motivo: String,
    postponed_by: String,
    db_instances: tauri::State<'_, tauri_plugin_sql::DbInstances>,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances
        .get("sqlite:disateq.db")
        .ok_or_else(|| String::from("DB no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    let ahora = sqlx::query_scalar::<_, String>(
        "SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')",
    )
    .fetch_one(pool)
    .await
    .map_err(|e| e.to_string())?;

    sqlx::query(
        "UPDATE autorizacion_supervision
         SET postponed_motivo = ?, postponed_by = ?, postponed_at = ?
         WHERE id = ?",
    )
    .bind(motivo)
    .bind(postponed_by)
    .bind(ahora)
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}
