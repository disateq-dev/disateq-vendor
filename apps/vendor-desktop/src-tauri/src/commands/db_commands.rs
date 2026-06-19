use tauri::State;
use sqlx::Row;
use uuid::Uuid;

#[tauri::command]
pub async fn obtener_rubro_activo(db_instances: State<'_, tauri_plugin_sql::DbInstances>) -> Result<String, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let row = sqlx::query("SELECT rubro_activo FROM config_establecimiento LIMIT 1")
        .fetch_optional(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(row
        .and_then(|r| r.try_get::<String, _>("rubro_activo").ok())
        .unwrap_or_else(|| String::from("FARMACIA")))
}

#[tauri::command]
pub async fn inicializar_establecimiento(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    rubro: String,
    razon_social: String,
    ruc: Option<String>,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let id = Uuid::new_v4().to_string();
    let creado_en = sqlx::query_scalar::<_, String>("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')")
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query(
        "INSERT OR REPLACE INTO config_establecimiento (id, rubro_activo, razon_social, ruc, creado_en) VALUES (?, ?, ?, ?, ?)",
    )
    .bind(id)
    .bind(rubro)
    .bind(razon_social)
    .bind(ruc)
    .bind(creado_en)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn verificar_db(db_instances: State<'_, tauri_plugin_sql::DbInstances>) -> Result<i64, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let count = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) as count FROM producto_generico")
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(count)
}
