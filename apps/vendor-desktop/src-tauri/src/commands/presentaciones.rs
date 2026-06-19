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

fn bool_a_i64(value: bool) -> i64 {
    if value { 1 } else { 0 }
}

#[tauri::command]
pub async fn crear_presentacion(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    producto_comercial_id: String,
    descripcion: String,
    fraccion_digemid: f64,
    unidad_conteo: String,
    factor_conversion_base: f64,
    codigo_barras: Option<String>,
    proveedor_habitual_id: Option<String>,
    costo_compra: Option<f64>,
) -> Result<String, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let id = Uuid::new_v4().to_string();
    let creado_en = obtener_timestamp(pool).await?;

    sqlx::query(
        "INSERT INTO presentacion_comercial (id, producto_comercial_id, descripcion, fraccion_digemid, unidad_conteo, factor_conversion_base, codigo_barras, proveedor_habitual_id, costo_compra, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(producto_comercial_id)
    .bind(descripcion)
    .bind(fraccion_digemid)
    .bind(unidad_conteo)
    .bind(factor_conversion_base)
    .bind(codigo_barras)
    .bind(proveedor_habitual_id)
    .bind(costo_compra)
    .bind(creado_en)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub async fn obtener_presentaciones(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    producto_comercial_id: String,
) -> Result<Vec<Value>, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let rows = sqlx::query("SELECT * FROM presentacion_comercial WHERE producto_comercial_id = ? ORDER BY creado_en")
        .bind(producto_comercial_id)
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;

    rows.into_iter()
        .map(|row| {
            Ok(json!({
                "id": row.try_get::<String, _>("id").map_err(|e| e.to_string())?,
                "producto_comercial_id": row.try_get::<String, _>("producto_comercial_id").map_err(|e| e.to_string())?,
                "descripcion": row.try_get::<String, _>("descripcion").map_err(|e| e.to_string())?,
                "fraccion_digemid": row.try_get::<f64, _>("fraccion_digemid").map_err(|e| e.to_string())?,
                "unidad_conteo": row.try_get::<String, _>("unidad_conteo").map_err(|e| e.to_string())?,
                "factor_conversion_base": row.try_get::<f64, _>("factor_conversion_base").map_err(|e| e.to_string())?,
                "codigo_barras": row.try_get::<Option<String>, _>("codigo_barras").unwrap_or(None),
                "proveedor_habitual_id": row.try_get::<Option<String>, _>("proveedor_habitual_id").unwrap_or(None),
                "costo_compra": row.try_get::<Option<f64>, _>("costo_compra").unwrap_or(None),
                "creado_en": row.try_get::<String, _>("creado_en").map_err(|e| e.to_string())?,
            }))
        })
        .collect()
}

#[tauri::command]
pub async fn crear_nodo(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    presentacion_id: String,
    nodo_padre_id: Option<String>,
    nombre_forma_venta: String,
    tipo_forma_venta: String,
    unidades_en_nodo_padre: Option<f64>,
    unidades_base: f64,
    es_vendible: bool,
    es_comprable: bool,
    descripcion_promo: Option<String>,
) -> Result<String, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let id = Uuid::new_v4().to_string();
    let creado_en = obtener_timestamp(pool).await?;

    sqlx::query(
        "INSERT INTO nodo_fraccionamiento (id, presentacion_id, nodo_padre_id, nombre_forma_venta, tipo_forma_venta, unidades_en_nodo_padre, unidades_base, es_vendible, es_comprable, descripcion_promo, estado, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&id)
    .bind(presentacion_id)
    .bind(nodo_padre_id)
    .bind(nombre_forma_venta)
    .bind(tipo_forma_venta)
    .bind(unidades_en_nodo_padre)
    .bind(unidades_base)
    .bind(bool_a_i64(es_vendible))
    .bind(bool_a_i64(es_comprable))
    .bind(descripcion_promo)
    .bind("ACTIVO")
    .bind(creado_en)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(id)
}

#[tauri::command]
pub async fn obtener_nodos_fraccionamiento(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    presentacion_id: String,
) -> Result<Vec<Value>, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let rows = sqlx::query("SELECT * FROM nodo_fraccionamiento WHERE presentacion_id = ? AND estado = 'ACTIVO' ORDER BY unidades_base DESC")
        .bind(presentacion_id)
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;

    rows.into_iter()
        .map(|row| {
            Ok(json!({
                "id": row.try_get::<String, _>("id").map_err(|e| e.to_string())?,
                "presentacion_id": row.try_get::<String, _>("presentacion_id").map_err(|e| e.to_string())?,
                "nodo_padre_id": row.try_get::<Option<String>, _>("nodo_padre_id").unwrap_or(None),
                "nombre_forma_venta": row.try_get::<String, _>("nombre_forma_venta").map_err(|e| e.to_string())?,
                "tipo_forma_venta": row.try_get::<String, _>("tipo_forma_venta").map_err(|e| e.to_string())?,
                "unidades_en_nodo_padre": row.try_get::<Option<f64>, _>("unidades_en_nodo_padre").unwrap_or(None),
                "unidades_base": row.try_get::<f64, _>("unidades_base").map_err(|e| e.to_string())?,
                "es_vendible": row.try_get::<i64, _>("es_vendible").map_err(|e| e.to_string())? == 1,
                "es_comprable": row.try_get::<i64, _>("es_comprable").map_err(|e| e.to_string())? == 1,
                "descripcion_promo": row.try_get::<Option<String>, _>("descripcion_promo").unwrap_or(None),
                "estado": row.try_get::<String, _>("estado").map_err(|e| e.to_string())?,
                "creado_en": row.try_get::<String, _>("creado_en").map_err(|e| e.to_string())?,
            }))
        })
        .collect()
}
