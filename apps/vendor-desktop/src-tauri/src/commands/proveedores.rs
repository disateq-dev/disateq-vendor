use serde_json::{json, Value};
use sqlx::Row;
use tauri::State;
use uuid::Uuid;

async fn obtener_timestamp(pool: &sqlx::SqlitePool) -> Result<String, String> {
    sqlx::query_scalar::<_, String>("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')")
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())
}

#[tauri::command]
pub async fn crear_proveedor(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    razon_social: String,
    ruc: Option<String>,
    nombre_contacto: Option<String>,
    telefono: Option<String>,
    condiciones_pago: Option<String>,
) -> Result<String, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let id = Uuid::new_v4().to_string();
    let creado_en = obtener_timestamp(pool).await?;

    sqlx::query(
        "INSERT INTO proveedor (id, razon_social, ruc, nombre_contacto, telefono, condiciones_pago, estado, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(razon_social)
    .bind(ruc)
    .bind(nombre_contacto)
    .bind(telefono)
    .bind(condiciones_pago)
    .bind("ACTIVO")
    .bind(creado_en)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub async fn obtener_proveedores(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    solo_activos: Option<bool>,
) -> Result<Vec<Value>, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let sql = if solo_activos == Some(true) {
        "SELECT * FROM proveedor WHERE estado = 'ACTIVO' ORDER BY razon_social"
    } else {
        "SELECT * FROM proveedor ORDER BY razon_social"
    };
    let rows = sqlx::query(sql).fetch_all(pool).await.map_err(|e| e.to_string())?;

    rows.into_iter()
        .map(|row| {
            Ok(json!({
                "id": row.try_get::<String, _>("id").map_err(|e| e.to_string())?,
                "razon_social": row.try_get::<String, _>("razon_social").map_err(|e| e.to_string())?,
                "ruc": row.try_get::<Option<String>, _>("ruc").unwrap_or(None),
                "nombre_contacto": row.try_get::<Option<String>, _>("nombre_contacto").unwrap_or(None),
                "telefono": row.try_get::<Option<String>, _>("telefono").unwrap_or(None),
                "condiciones_pago": row.try_get::<Option<String>, _>("condiciones_pago").unwrap_or(None),
                "estado": row.try_get::<String, _>("estado").map_err(|e| e.to_string())?,
                "creado_en": row.try_get::<String, _>("creado_en").map_err(|e| e.to_string())?,
            }))
        })
        .collect()
}

#[tauri::command]
pub async fn actualizar_proveedor(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    id: String,
    razon_social: String,
    ruc: Option<String>,
    nombre_contacto: Option<String>,
    telefono: Option<String>,
    condiciones_pago: Option<String>,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    sqlx::query(
        "UPDATE proveedor SET razon_social = ?, ruc = ?, nombre_contacto = ?, telefono = ?, condiciones_pago = ? WHERE id = ?",
    )
    .bind(razon_social)
    .bind(ruc)
    .bind(nombre_contacto)
    .bind(telefono)
    .bind(condiciones_pago)
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn buscar_proveedores(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    termino: String,
    solo_activos: Option<bool>,
) -> Result<Vec<Value>, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let filtro = format!("%{}%", termino);
    let sql = if solo_activos == Some(true) {
        "SELECT * FROM proveedor WHERE (razon_social LIKE ? OR ruc LIKE ?) AND estado = 'ACTIVO' ORDER BY razon_social LIMIT 8"
    } else {
        "SELECT * FROM proveedor WHERE (razon_social LIKE ? OR ruc LIKE ?) ORDER BY razon_social LIMIT 8"
    };
    let rows = sqlx::query(sql)
        .bind(&filtro)
        .bind(&filtro)
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;

    rows.into_iter()
        .map(|row| {
            Ok(json!({
                "id": row.try_get::<String, _>("id").map_err(|e| e.to_string())?,
                "razon_social": row.try_get::<String, _>("razon_social").map_err(|e| e.to_string())?,
                "ruc": row.try_get::<Option<String>, _>("ruc").unwrap_or(None),
                "nombre_contacto": row.try_get::<Option<String>, _>("nombre_contacto").unwrap_or(None),
                "telefono": row.try_get::<Option<String>, _>("telefono").unwrap_or(None),
                "condiciones_pago": row.try_get::<Option<String>, _>("condiciones_pago").unwrap_or(None),
                "estado": row.try_get::<String, _>("estado").map_err(|e| e.to_string())?,
                "creado_en": row.try_get::<String, _>("creado_en").map_err(|e| e.to_string())?,
            }))
        })
        .collect()
}
