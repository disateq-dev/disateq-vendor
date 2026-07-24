use sqlx::Row;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub async fn obtener_rubro_activo(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
) -> Result<String, String> {
    let instances = db_instances.0.read().await;
    let db = instances
        .get("sqlite:disateq.db")
        .ok_or_else(|| String::from("Base de datos no inicializada"))?;
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
    let db = instances
        .get("sqlite:disateq.db")
        .ok_or_else(|| String::from("Base de datos no inicializada"))?;
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
pub async fn verificar_db(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
) -> Result<i64, String> {
    let instances = db_instances.0.read().await;
    let db = instances
        .get("sqlite:disateq.db")
        .ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let count = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) as count FROM producto_generico")
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(count)
}

#[derive(serde::Serialize)]
pub struct ConfigPreciosVenta {
    pub precio_edicion_modo: String,
    pub precio_edicion_margen_minimo: f64,
}

#[tauri::command]
pub async fn obtener_config_precios_venta(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
) -> Result<ConfigPreciosVenta, String> {
    let instances = db_instances.0.read().await;
    let db = instances
        .get("sqlite:disateq.db")
        .ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    let row = sqlx::query(
        "SELECT precio_edicion_modo, precio_edicion_margen_minimo FROM config_establecimiento LIMIT 1"
    )
    .fetch_optional(pool)
    .await
    .map_err(|e| e.to_string())?;

    match row {
        Some(r) => Ok(ConfigPreciosVenta {
            precio_edicion_modo: r
                .try_get::<String, _>("precio_edicion_modo")
                .unwrap_or_else(|_| "PISO_COSTO".to_string()),
            precio_edicion_margen_minimo: r
                .try_get::<f64, _>("precio_edicion_margen_minimo")
                .unwrap_or(0.10),
        }),
        None => Ok(ConfigPreciosVenta {
            precio_edicion_modo: "PISO_COSTO".to_string(),
            precio_edicion_margen_minimo: 0.10,
        }),
    }
}
