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
pub async fn crear_servicio_farmacia(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    nombre: String,
    tipo_servicio: String,
    descripcion: Option<String>,
    duracion_minutos: Option<i64>,
) -> Result<String, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let id = Uuid::new_v4().to_string();
    let creado_en = obtener_timestamp(pool).await?;

    sqlx::query(
        "INSERT INTO servicio_farmacia (id, nombre, tipo_servicio, descripcion, duracion_minutos, estado, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(nombre)
    .bind(tipo_servicio)
    .bind(descripcion)
    .bind(duracion_minutos)
    .bind("ACTIVO")
    .bind(creado_en)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub async fn obtener_servicios_farmacia(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    solo_activos: Option<bool>,
) -> Result<Vec<Value>, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let sql = if solo_activos == Some(true) {
        "SELECT * FROM servicio_farmacia WHERE estado = 'ACTIVO' ORDER BY nombre"
    } else {
        "SELECT * FROM servicio_farmacia ORDER BY nombre"
    };
    let rows = sqlx::query(sql).fetch_all(pool).await.map_err(|e| e.to_string())?;

    rows.into_iter()
        .map(|row| {
            Ok(json!({
                "id": row.try_get::<String, _>("id").map_err(|e| e.to_string())?,
                "nombre": row.try_get::<String, _>("nombre").map_err(|e| e.to_string())?,
                "tipo_servicio": row.try_get::<String, _>("tipo_servicio").map_err(|e| e.to_string())?,
                "descripcion": row.try_get::<Option<String>, _>("descripcion").unwrap_or(None),
                "duracion_minutos": row.try_get::<Option<i64>, _>("duracion_minutos").unwrap_or(None),
                "estado": row.try_get::<String, _>("estado").map_err(|e| e.to_string())?,
                "creado_en": row.try_get::<String, _>("creado_en").map_err(|e| e.to_string())?,
            }))
        })
        .collect()
}

#[tauri::command]
pub async fn registrar_ejecucion_servicio(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    servicio_id: String,
    operador_id: String,
    turno_id: Option<String>,
    pedido_id: Option<String>,
    timestamp_inicio: String,
    timestamp_fin: Option<String>,
    duracion_minutos: Option<i64>,
    observacion: Option<String>,
) -> Result<String, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let id = Uuid::new_v4().to_string();
    let creado_en = obtener_timestamp(pool).await?;

    sqlx::query(
        "INSERT INTO ejecucion_servicio (id, servicio_id, operador_id, turno_id, pedido_id, timestamp_inicio, timestamp_fin, duracion_minutos, observacion, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(servicio_id)
    .bind(operador_id)
    .bind(turno_id)
    .bind(pedido_id)
    .bind(timestamp_inicio)
    .bind(timestamp_fin)
    .bind(duracion_minutos)
    .bind(observacion)
    .bind(creado_en)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(id)
}
