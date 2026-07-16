use serde_json::{json, Value};
use sqlx::Row;
use tauri::State;
use uuid::Uuid;

#[tauri::command]
pub async fn abrir_sesion_caja(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    sesion_id: String,
    caja_codigo: String,
    caja_tipo: String,
    operador_nombre: String,
    operador_id: Option<String>,
    terminal: String,
    apertura: f64,
    motivo: Option<String>,
    observacion: Option<String>,
    ref_op: Option<String>,
    abierta_en: String,
) -> Result<String, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;
    let creado_en = sqlx::query_scalar::<_, String>("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')")
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query(
        "INSERT INTO sesion_caja (id, caja_codigo, caja_tipo, operador_nombre, operador_id, terminal, apertura, motivo, observacion, ref_op, estado, close_signal, abierta_en, cerrada_en, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ABIERTA', NULL, ?, NULL, ?)",
    )
    .bind(&sesion_id)
    .bind(&caja_codigo)
    .bind(&caja_tipo)
    .bind(&operador_nombre)
    .bind(&operador_id)
    .bind(&terminal)
    .bind(apertura)
    .bind(&motivo)
    .bind(&observacion)
    .bind(&ref_op)
    .bind(&abierta_en)
    .bind(&creado_en)
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(sesion_id)
}

#[tauri::command]
pub async fn cerrar_sesion_caja(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    sesion_id: String,
    cerrada_en: String,
    close_signal: String,
    arqueo_json: Option<String>,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    sqlx::query("UPDATE sesion_caja SET estado = 'CERRADA', cerrada_en = ?, close_signal = ?, arqueo_json = ? WHERE id = ?")
        .bind(&cerrada_en)
        .bind(&close_signal)
        .bind(&arqueo_json)
        .bind(&sesion_id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn registrar_movimiento_caja(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    sesion_id: String,
    tipo: String,
    monto: f64,
    motivo: String,
    observacion: Option<String>,
    ref_id: Option<String>,
    operador_nombre: String,
    caja_codigo: String,
    terminal: String,
    source_type: String,
    from_apertura: f64,
    from_vendido: f64,
    regularization_status: Option<String>,
    regularization_mode: Option<String>,
    timestamp: String,
) -> Result<String, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let id = Uuid::new_v4().to_string();
    let creado_en = sqlx::query_scalar::<_, String>("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')")
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query(
        "INSERT INTO movimiento_caja (id, sesion_id, tipo, monto, motivo, observacion, ref_id, operador_nombre, caja_codigo, terminal, source_type, from_apertura, from_vendido, regularization_status, regularization_mode, timestamp, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(&sesion_id)
    .bind(&tipo)
    .bind(monto)
    .bind(&motivo)
    .bind(&observacion)
    .bind(&ref_id)
    .bind(&operador_nombre)
    .bind(&caja_codigo)
    .bind(&terminal)
    .bind(&source_type)
    .bind(from_apertura)
    .bind(from_vendido)
    .bind(&regularization_status)
    .bind(&regularization_mode)
    .bind(&timestamp)
    .bind(&creado_en)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub async fn actualizar_movimiento_caja(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    movimiento_id: String,
    regularization_status: String,
    regularization_mode: Option<String>,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    sqlx::query("UPDATE movimiento_caja SET regularization_status = ?, regularization_mode = ? WHERE id = ?")
        .bind(&regularization_status)
        .bind(&regularization_mode)
        .bind(&movimiento_id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn registrar_evento_turno(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    sesion_id: String,
    tipo: String,
    texto: String,
    ts: String,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let creado_en = sqlx::query_scalar::<_, String>("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')")
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query("INSERT INTO evento_turno (sesion_id, tipo, texto, ts, creado_en) VALUES (?, ?, ?, ?, ?)")
        .bind(&sesion_id)
        .bind(&tipo)
        .bind(&texto)
        .bind(&ts)
        .bind(&creado_en)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn obtener_sesion_activa(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
) -> Result<Value, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let sesion = sqlx::query(
        "SELECT id, caja_codigo, caja_tipo, operador_nombre, operador_id, terminal, apertura, motivo, observacion, ref_op, estado, close_signal, abierta_en, cerrada_en FROM sesion_caja WHERE estado = 'ABIERTA' ORDER BY abierta_en DESC LIMIT 1",
    )
    .fetch_optional(pool)
    .await
    .map_err(|e| e.to_string())?;

    match sesion {
        Some(row) => Ok(json!({
            "id": row.try_get::<String, _>("id").map_err(|e| e.to_string())?,
            "caja_codigo": row.try_get::<String, _>("caja_codigo").map_err(|e| e.to_string())?,
            "caja_tipo": row.try_get::<String, _>("caja_tipo").map_err(|e| e.to_string())?,
            "operador_nombre": row.try_get::<String, _>("operador_nombre").map_err(|e| e.to_string())?,
            "operador_id": row.try_get::<Option<String>, _>("operador_id").unwrap_or(None),
            "terminal": row.try_get::<String, _>("terminal").map_err(|e| e.to_string())?,
            "apertura": row.try_get::<f64, _>("apertura").map_err(|e| e.to_string())?,
            "motivo": row.try_get::<Option<String>, _>("motivo").unwrap_or(None),
            "observacion": row.try_get::<Option<String>, _>("observacion").unwrap_or(None),
            "ref_op": row.try_get::<Option<String>, _>("ref_op").unwrap_or(None),
            "estado": row.try_get::<String, _>("estado").map_err(|e| e.to_string())?,
            "close_signal": row.try_get::<Option<String>, _>("close_signal").unwrap_or(None),
            "abierta_en": row.try_get::<String, _>("abierta_en").map_err(|e| e.to_string())?,
            "cerrada_en": row.try_get::<Option<String>, _>("cerrada_en").unwrap_or(None),
        })),
        None => Ok(json!(null)),
    }
}

#[tauri::command]
pub async fn obtener_historial_sesiones(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    limite: Option<i64>,
) -> Result<Value, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let mut query_string = String::from(
        "SELECT id, caja_codigo, caja_tipo, operador_nombre, operador_id, terminal, apertura, estado, close_signal, abierta_en, cerrada_en FROM sesion_caja ORDER BY abierta_en DESC",
    );
    if let Some(limite) = limite {
        query_string.push_str(&format!(" LIMIT {limite}"));
    }
    let rows = sqlx::query(&query_string)
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;
    let sesiones: Result<Vec<Value>, String> = rows.into_iter().map(|row| {
        Ok(json!({
            "id": row.try_get::<String, _>("id").map_err(|e| e.to_string())?,
            "caja_codigo": row.try_get::<String, _>("caja_codigo").map_err(|e| e.to_string())?,
            "caja_tipo": row.try_get::<String, _>("caja_tipo").map_err(|e| e.to_string())?,
            "operador_nombre": row.try_get::<String, _>("operador_nombre").map_err(|e| e.to_string())?,
            "operador_id": row.try_get::<Option<String>, _>("operador_id").unwrap_or(None),
            "terminal": row.try_get::<String, _>("terminal").map_err(|e| e.to_string())?,
            "apertura": row.try_get::<f64, _>("apertura").map_err(|e| e.to_string())?,
            "estado": row.try_get::<String, _>("estado").map_err(|e| e.to_string())?,
            "close_signal": row.try_get::<Option<String>, _>("close_signal").unwrap_or(None),
            "abierta_en": row.try_get::<String, _>("abierta_en").map_err(|e| e.to_string())?,
            "cerrada_en": row.try_get::<Option<String>, _>("cerrada_en").unwrap_or(None),
        }))
    }).collect();

    Ok(json!(sesiones?))
}

#[tauri::command]
pub async fn obtener_movimientos_sesion(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    sesion_id: String,
) -> Result<Value, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let rows = sqlx::query(
        "SELECT id, sesion_id, tipo, monto, motivo, observacion, ref_id, operador_nombre, caja_codigo, terminal, source_type, from_apertura, from_vendido, regularization_status, regularization_mode, timestamp FROM movimiento_caja WHERE sesion_id = ? ORDER BY timestamp ASC",
    )
    .bind(&sesion_id)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;
    let movimientos: Result<Vec<Value>, String> = rows.into_iter().map(|row| {
        Ok(json!({
            "id": row.try_get::<String, _>("id").map_err(|e| e.to_string())?,
            "sesion_id": row.try_get::<String, _>("sesion_id").map_err(|e| e.to_string())?,
            "tipo": row.try_get::<String, _>("tipo").map_err(|e| e.to_string())?,
            "monto": row.try_get::<f64, _>("monto").map_err(|e| e.to_string())?,
            "motivo": row.try_get::<String, _>("motivo").map_err(|e| e.to_string())?,
            "observacion": row.try_get::<Option<String>, _>("observacion").unwrap_or(None),
            "ref_id": row.try_get::<Option<String>, _>("ref_id").unwrap_or(None),
            "operador_nombre": row.try_get::<String, _>("operador_nombre").map_err(|e| e.to_string())?,
            "caja_codigo": row.try_get::<String, _>("caja_codigo").map_err(|e| e.to_string())?,
            "terminal": row.try_get::<String, _>("terminal").map_err(|e| e.to_string())?,
            "source_type": row.try_get::<String, _>("source_type").map_err(|e| e.to_string())?,
            "from_apertura": row.try_get::<f64, _>("from_apertura").map_err(|e| e.to_string())?,
            "from_vendido": row.try_get::<f64, _>("from_vendido").map_err(|e| e.to_string())?,
            "regularization_status": row.try_get::<Option<String>, _>("regularization_status").unwrap_or(None),
            "regularization_mode": row.try_get::<Option<String>, _>("regularization_mode").unwrap_or(None),
            "timestamp": row.try_get::<String, _>("timestamp").map_err(|e| e.to_string())?,
        }))
    }).collect();

    Ok(json!(movimientos?))
}

#[tauri::command]
pub async fn actualizar_sesion_caja_correction(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    sesion_id: String,
    close_signal: String,
    correction_json: Option<String>,
    arqueo_json: Option<String>,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    sqlx::query("UPDATE sesion_caja SET close_signal = ?, correction_json = ?, arqueo_json = ? WHERE id = ?")
        .bind(&close_signal)
        .bind(&correction_json)
        .bind(&arqueo_json)
        .bind(&sesion_id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}
