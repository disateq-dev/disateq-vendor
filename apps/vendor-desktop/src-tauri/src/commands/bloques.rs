use serde_json::{json, Value};
use sqlx::Row;
use tauri::State;

#[tauri::command]
pub async fn crear_bloque_operacional(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    id: String,
    base: i64,
    auxiliares: i64,
    creado_por: String,
    creado_en: String,
) -> Result<String, String> {
    let instances = db_instances.0.read().await;
    let db = instances
        .get("sqlite:disateq.db")
        .ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    let existe_bloque =
        sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM bloque_operacional WHERE base = ?")
            .bind(base)
            .fetch_one(pool)
            .await
            .map_err(|e| e.to_string())?;

    if existe_bloque > 0 {
        return Err(format!("Ya existe un bloque con base {base}"));
    }

    sqlx::query(
        "INSERT INTO bloque_operacional (id, base, auxiliares, activo, creado_en, creado_por, modificado_en) VALUES (?, ?, ?, 1, ?, ?, ?)",
    )
    .bind(&id)
    .bind(base)
    .bind(auxiliares)
    .bind(&creado_en)
    .bind(&creado_por)
    .bind(&creado_en)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub async fn obtener_bloques_operacionales(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
) -> Result<Value, String> {
    let instances = db_instances.0.read().await;
    let db = instances
        .get("sqlite:disateq.db")
        .ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let rows = sqlx::query(
        "SELECT id, base, auxiliares, activo, creado_en, creado_por, modificado_en FROM bloque_operacional ORDER BY base ASC",
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let bloques: Result<Vec<Value>, String> = rows.into_iter().map(|row| {
        Ok(json!({
            "id": row.try_get::<String, _>("id").map_err(|e| e.to_string())?,
            "base": row.try_get::<i64, _>("base").map_err(|e| e.to_string())?,
            "auxiliares": row.try_get::<i64, _>("auxiliares").map_err(|e| e.to_string())?,
            "activo": row.try_get::<i64, _>("activo").map_err(|e| e.to_string())?,
            "creado_en": row.try_get::<String, _>("creado_en").map_err(|e| e.to_string())?,
            "creado_por": row.try_get::<String, _>("creado_por").map_err(|e| e.to_string())?,
            "modificado_en": row.try_get::<String, _>("modificado_en").map_err(|e| e.to_string())?,
        }))
    }).collect();

    Ok(json!(bloques?))
}

#[tauri::command]
pub async fn actualizar_auxiliares_bloque(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    id: String,
    auxiliares: i64,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances
        .get("sqlite:disateq.db")
        .ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let modificado_en =
        sqlx::query_scalar::<_, String>("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')")
            .fetch_one(pool)
            .await
            .map_err(|e| e.to_string())?;

    sqlx::query("UPDATE bloque_operacional SET auxiliares=?, modificado_en=? WHERE id=?")
        .bind(auxiliares)
        .bind(&modificado_en)
        .bind(&id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn activar_bloque_operacional(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    id: String,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances
        .get("sqlite:disateq.db")
        .ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let modificado_en =
        sqlx::query_scalar::<_, String>("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')")
            .fetch_one(pool)
            .await
            .map_err(|e| e.to_string())?;

    sqlx::query("UPDATE bloque_operacional SET activo=1, modificado_en=? WHERE id=?")
        .bind(&modificado_en)
        .bind(&id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn desactivar_bloque_operacional(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    id: String,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances
        .get("sqlite:disateq.db")
        .ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let modificado_en =
        sqlx::query_scalar::<_, String>("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')")
            .fetch_one(pool)
            .await
            .map_err(|e| e.to_string())?;

    sqlx::query("UPDATE bloque_operacional SET activo=0, modificado_en=? WHERE id=?")
        .bind(&modificado_en)
        .bind(&id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}
