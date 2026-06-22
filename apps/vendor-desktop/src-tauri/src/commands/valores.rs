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
pub async fn crear_valor_operacional(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    nodo_id: String,
    tipo: String,
    valor: f64,
    moneda: Option<String>,
    condicion_cantidad_minima: Option<f64>,
    vigencia_desde: String,
    vigencia_hasta: Option<String>,
) -> Result<String, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let id = Uuid::new_v4().to_string();
    let creado_en = obtener_timestamp(pool).await?;

    sqlx::query(
        "INSERT INTO valor_operacional (id, nodo_id, tipo, valor, moneda, condicion_cantidad_minima, vigencia_desde, vigencia_hasta, estado, creado_en, modificado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(nodo_id)
    .bind(tipo)
    .bind(valor)
    .bind(moneda.unwrap_or_else(|| String::from("PEN")))
    .bind(condicion_cantidad_minima)
    .bind(vigencia_desde)
    .bind(vigencia_hasta)
    .bind("ACTIVO")
    .bind(&creado_en)
    .bind(&creado_en)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub async fn modificar_valor_operacional(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    id: String,
    valor: Option<f64>,
    condicion_cantidad_minima: Option<f64>,
    vigencia_hasta: Option<String>,
    estado: Option<String>,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    sqlx::query(
        "UPDATE valor_operacional SET valor = COALESCE(?, valor), condicion_cantidad_minima = ?, vigencia_hasta = ?, estado = COALESCE(?, estado), modificado_en = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE id = ?",
    )
    .bind(valor)
    .bind(condicion_cantidad_minima)
    .bind(vigencia_hasta)
    .bind(estado)
    .bind(id)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn obtener_valores_nodo(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    nodo_id: String,
) -> Result<Vec<Value>, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let rows = sqlx::query("SELECT * FROM valor_operacional WHERE nodo_id = ? ORDER BY tipo, creado_en")
        .bind(nodo_id)
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;

    rows.into_iter()
        .map(|row| {
            Ok(json!({
                "id": row.try_get::<String, _>("id").map_err(|e| e.to_string())?,
                "nodo_id": row.try_get::<String, _>("nodo_id").map_err(|e| e.to_string())?,
                "tipo": row.try_get::<String, _>("tipo").map_err(|e| e.to_string())?,
                "valor": row.try_get::<f64, _>("valor").map_err(|e| e.to_string())?,
                "moneda": row.try_get::<String, _>("moneda").map_err(|e| e.to_string())?,
                "condicion_cantidad_minima": row.try_get::<Option<f64>, _>("condicion_cantidad_minima").unwrap_or(None),
                "condicion_contexto_id": row.try_get::<Option<String>, _>("condicion_contexto_id").unwrap_or(None),
                "condicion_identidad_id": row.try_get::<Option<String>, _>("condicion_identidad_id").unwrap_or(None),
                "vigencia_desde": row.try_get::<String, _>("vigencia_desde").map_err(|e| e.to_string())?,
                "vigencia_hasta": row.try_get::<Option<String>, _>("vigencia_hasta").unwrap_or(None),
                "estado": row.try_get::<String, _>("estado").map_err(|e| e.to_string())?,
                "creado_en": row.try_get::<String, _>("creado_en").map_err(|e| e.to_string())?,
                "modificado_en": row.try_get::<String, _>("modificado_en").map_err(|e| e.to_string())?,
            }))
        })
        .collect()
}

#[tauri::command]
pub async fn resolver_precio_nodo(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    nodo_id: String,
    cantidad: f64,
    tipo_cliente: Option<String>,
) -> Result<Value, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    let promocion = sqlx::query(
        "SELECT tipo, valor, moneda FROM valor_operacional WHERE nodo_id = ? AND tipo = 'VENTA_PROMOCION' AND estado = 'ACTIVO' AND vigencia_desde <= strftime('%Y-%m-%dT%H:%M:%fZ','now') AND (vigencia_hasta IS NULL OR vigencia_hasta >= strftime('%Y-%m-%dT%H:%M:%fZ','now')) LIMIT 1",
    )
    .bind(&nodo_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| e.to_string())?;

    if let Some(row) = promocion {
        return Ok(json!({
            "tipo": row.try_get::<String, _>("tipo").map_err(|e| e.to_string())?,
            "valor": row.try_get::<f64, _>("valor").map_err(|e| e.to_string())?,
            "moneda": row.try_get::<String, _>("moneda").map_err(|e| e.to_string())?,
        }));
    }

    if tipo_cliente.as_deref() == Some("FRECUENTE") {
        let frecuente = sqlx::query(
            "SELECT tipo, valor, moneda FROM valor_operacional WHERE nodo_id = ? AND tipo = 'VENTA_FRECUENTE' AND estado = 'ACTIVO' LIMIT 1",
        )
        .bind(&nodo_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| e.to_string())?;

        if let Some(row) = frecuente {
            return Ok(json!({
                "tipo": row.try_get::<String, _>("tipo").map_err(|e| e.to_string())?,
                "valor": row.try_get::<f64, _>("valor").map_err(|e| e.to_string())?,
                "moneda": row.try_get::<String, _>("moneda").map_err(|e| e.to_string())?,
            }));
        }
    }

    let mayoreo = sqlx::query(
        "SELECT tipo, valor, moneda FROM valor_operacional WHERE nodo_id = ? AND tipo = 'VENTA_MAYOREO' AND estado = 'ACTIVO' AND condicion_cantidad_minima IS NOT NULL AND ? >= condicion_cantidad_minima LIMIT 1",
    )
    .bind(&nodo_id)
    .bind(cantidad)
    .fetch_optional(pool)
    .await
    .map_err(|e| e.to_string())?;

    if let Some(row) = mayoreo {
        return Ok(json!({
            "tipo": row.try_get::<String, _>("tipo").map_err(|e| e.to_string())?,
            "valor": row.try_get::<f64, _>("valor").map_err(|e| e.to_string())?,
            "moneda": row.try_get::<String, _>("moneda").map_err(|e| e.to_string())?,
        }));
    }

    let normal = sqlx::query(
        "SELECT tipo, valor, moneda FROM valor_operacional WHERE nodo_id = ? AND tipo = 'VENTA_NORMAL' AND estado = 'ACTIVO' LIMIT 1",
    )
    .bind(&nodo_id)
    .fetch_optional(pool)
    .await
    .map_err(|e| e.to_string())?;

    if let Some(row) = normal {
        return Ok(json!({
            "tipo": row.try_get::<String, _>("tipo").map_err(|e| e.to_string())?,
            "valor": row.try_get::<f64, _>("valor").map_err(|e| e.to_string())?,
            "moneda": row.try_get::<String, _>("moneda").map_err(|e| e.to_string())?,
        }));
    }

    Err(String::from("Sin precio configurado para este nodo"))
}
