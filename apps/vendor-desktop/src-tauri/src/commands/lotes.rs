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
pub async fn registrar_lote(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    presentacion_id: String,
    numero_lote: String,
    fecha_vencimiento: Option<String>,
    fecha_fabricacion: Option<String>,
    cantidad_ingresada: f64,
    proveedor_id: Option<String>,
    precio_compra: Option<f64>,
) -> Result<String, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let id = Uuid::new_v4().to_string();
    let creado_en = obtener_timestamp(pool).await?;

    sqlx::query(
        "INSERT INTO lote (id, presentacion_id, numero_lote, fecha_vencimiento, fecha_fabricacion, cantidad_ingresada, cantidad_disponible, proveedor_id, precio_compra, estado, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(presentacion_id)
    .bind(numero_lote)
    .bind(fecha_vencimiento)
    .bind(fecha_fabricacion)
    .bind(cantidad_ingresada)
    .bind(cantidad_ingresada)
    .bind(proveedor_id)
    .bind(precio_compra)
    .bind("VIGENTE")
    .bind(creado_en)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub async fn resolver_lote_fefo(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    presentacion_id: String,
    unidades_requeridas: f64,
) -> Result<Vec<Value>, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let rows = sqlx::query(
        "SELECT id, numero_lote, fecha_vencimiento, cantidad_disponible FROM lote WHERE presentacion_id = ? AND estado IN ('VIGENTE', 'POR_VENCER') AND cantidad_disponible > 0 ORDER BY fecha_vencimiento ASC",
    )
    .bind(presentacion_id)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let mut restante = unidades_requeridas;
    let mut asignado = 0.0;
    let mut asignaciones: Vec<Value> = Vec::new();

    for row in rows {
        if restante <= 0.0 {
            break;
        }
        let cantidad_disponible = row.try_get::<f64, _>("cantidad_disponible").map_err(|e| e.to_string())?;
        let unidades_asignadas = cantidad_disponible.min(restante);
        restante -= unidades_asignadas;
        asignado += unidades_asignadas;
        asignaciones.push(json!({
            "lote_id": row.try_get::<String, _>("id").map_err(|e| e.to_string())?,
            "numero_lote": row.try_get::<String, _>("numero_lote").map_err(|e| e.to_string())?,
            "fecha_vencimiento": row.try_get::<String, _>("fecha_vencimiento").map_err(|e| e.to_string())?,
            "unidades_asignadas": unidades_asignadas,
        }));
    }

    if asignado < unidades_requeridas {
        return Err(format!(
            "Stock insuficiente: disponible {} de {} requeridas",
            asignado, unidades_requeridas
        ));
    }

    Ok(asignaciones)
}

#[tauri::command]
pub async fn obtener_lotes_vigentes(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    presentacion_id: String,
) -> Result<Vec<Value>, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let rows = sqlx::query("SELECT * FROM lote WHERE presentacion_id = ? AND estado IN ('VIGENTE', 'POR_VENCER') ORDER BY fecha_vencimiento ASC")
        .bind(presentacion_id)
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;

    rows.into_iter()
        .map(|row| {
            Ok(json!({
                "id": row.try_get::<String, _>("id").map_err(|e| e.to_string())?,
                "presentacion_id": row.try_get::<String, _>("presentacion_id").map_err(|e| e.to_string())?,
                "numero_lote": row.try_get::<String, _>("numero_lote").map_err(|e| e.to_string())?,
                "fecha_vencimiento": row.try_get::<String, _>("fecha_vencimiento").map_err(|e| e.to_string())?,
                "fecha_fabricacion": row.try_get::<Option<String>, _>("fecha_fabricacion").unwrap_or(None),
                "cantidad_ingresada": row.try_get::<f64, _>("cantidad_ingresada").map_err(|e| e.to_string())?,
                "cantidad_disponible": row.try_get::<f64, _>("cantidad_disponible").map_err(|e| e.to_string())?,
                "proveedor_id": row.try_get::<Option<String>, _>("proveedor_id").unwrap_or(None),
                "precio_compra": row.try_get::<Option<f64>, _>("precio_compra").unwrap_or(None),
                "estado": row.try_get::<String, _>("estado").map_err(|e| e.to_string())?,
                "creado_en": row.try_get::<String, _>("creado_en").map_err(|e| e.to_string())?,
            }))
        })
        .collect()
}

#[tauri::command]
pub async fn obtener_inventario_farmacia(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
) -> Result<Vec<Value>, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let rows = sqlx::query(
        "SELECT pc.id AS producto_id, pc.nombre_comercial, pc.requiere_lote,
pcom.id AS presentacion_id, pcom.descripcion, pcom.unidad_conteo,
COALESCE(SUM(l.cantidad_disponible), 0.0) AS total_disponible,
COUNT(l.id) AS lotes_vigentes,
MIN(l.fecha_vencimiento) AS proximo_vencimiento
FROM presentacion_comercial pcom
JOIN producto_comercial pc ON pc.id = pcom.producto_comercial_id
LEFT JOIN lote l ON l.presentacion_id = pcom.id AND l.estado = 'VIGENTE'
WHERE pc.estado = 'ACTIVO'
GROUP BY pcom.id
ORDER BY pc.nombre_comercial",
    )
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    rows.into_iter()
        .map(|row| {
            let requiere_lote = row.try_get::<i64, _>("requiere_lote").map_err(|e| e.to_string())? == 1;
            Ok(json!({
                "producto_id": row.try_get::<String, _>("producto_id").map_err(|e| e.to_string())?,
                "nombre_comercial": row.try_get::<String, _>("nombre_comercial").map_err(|e| e.to_string())?,
                "requiere_lote": requiere_lote,
                "presentacion_id": row.try_get::<String, _>("presentacion_id").map_err(|e| e.to_string())?,
                "descripcion": row.try_get::<String, _>("descripcion").map_err(|e| e.to_string())?,
                "unidad_conteo": row.try_get::<String, _>("unidad_conteo").map_err(|e| e.to_string())?,
                "total_disponible": row.try_get::<f64, _>("total_disponible").map_err(|e| e.to_string())?,
                "lotes_vigentes": row.try_get::<i64, _>("lotes_vigentes").map_err(|e| e.to_string())?,
                "proximo_vencimiento": row.try_get::<Option<String>, _>("proximo_vencimiento").unwrap_or(None),
            }))
        })
        .collect()
}
