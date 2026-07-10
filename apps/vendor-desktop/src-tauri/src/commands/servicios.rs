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
pub async fn crear_servicio_catalogo(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    rubro: String,
    tipo_servicio: String,
    nombre: String,
    descripcion: Option<String>,
    duracion_minutos: Option<i64>,
) -> Result<String, String> {
    let instances = db_instances.0.read().await;
    let db = instances
        .get("sqlite:disateq.db")
        .ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let id = Uuid::new_v4().to_string();
    let creado_en = obtener_timestamp(pool).await?;

    sqlx::query(
        "INSERT INTO servicio_catalogo (id, rubro, tipo_servicio, nombre, descripcion, duracion_minutos, estado, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(rubro)
    .bind(tipo_servicio)
    .bind(nombre)
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
pub async fn obtener_servicios_catalogo(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    rubro: Option<String>,
    solo_activos: Option<bool>,
) -> Result<Vec<Value>, String> {
    let instances = db_instances.0.read().await;
    let db = instances
        .get("sqlite:disateq.db")
        .ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let mut consulta = sqlx::QueryBuilder::<sqlx::Sqlite>::new(
        "SELECT id, rubro, tipo_servicio, nombre, descripcion, duracion_minutos, estado, creado_en FROM servicio_catalogo",
    );
    let mut tiene_filtro = false;

    if let Some(rubro) = rubro {
        consulta.push(" WHERE rubro = ").push_bind(rubro);
        tiene_filtro = true;
    }

    if solo_activos == Some(true) {
        consulta.push(if tiene_filtro { " AND" } else { " WHERE" });
        consulta.push(" estado = 'ACTIVO'");
    }

    consulta.push(" ORDER BY nombre");
    let filas = consulta
        .build()
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;

    filas
        .into_iter()
        .map(|fila| {
            Ok(json!({
                "id": fila.try_get::<String, _>("id").map_err(|e| e.to_string())?,
                "rubro": fila.try_get::<String, _>("rubro").map_err(|e| e.to_string())?,
                "tipo_servicio": fila.try_get::<String, _>("tipo_servicio").map_err(|e| e.to_string())?,
                "nombre": fila.try_get::<String, _>("nombre").map_err(|e| e.to_string())?,
                "descripcion": fila.try_get::<Option<String>, _>("descripcion").unwrap_or(None),
                "duracion_minutos": fila.try_get::<Option<i64>, _>("duracion_minutos").unwrap_or(None),
                "estado": fila.try_get::<String, _>("estado").map_err(|e| e.to_string())?,
                "creado_en": fila.try_get::<String, _>("creado_en").map_err(|e| e.to_string())?,
            }))
        })
        .collect()
}

#[tauri::command]
pub async fn desactivar_servicio_catalogo(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    id: String,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances
        .get("sqlite:disateq.db")
        .ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    sqlx::query("UPDATE servicio_catalogo SET estado = 'INACTIVO' WHERE id = ?")
        .bind(id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
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
    let db = instances
        .get("sqlite:disateq.db")
        .ok_or_else(|| String::from("Base de datos no inicializada"))?;
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

#[tauri::command]
pub async fn obtener_margen_defecto(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
) -> Result<f64, String> {
    let instances = db_instances.0.read().await;
    let db = instances
        .get("sqlite:disateq.db")
        .ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    let margen = sqlx::query_scalar::<_, f64>(
        "SELECT COALESCE(margen_defecto, 0.30) FROM config_establecimiento LIMIT 1",
    )
    .fetch_optional(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(margen.unwrap_or(0.30_f64))
}
