use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::Row;
use tauri::State;
use uuid::Uuid;

#[derive(Deserialize)]
pub(crate) struct LineaVentaInput {
    hov_id: String,
    nodo_fraccionamiento_id: Option<String>,
    nombre_visible: String,
    cantidad: f64,
    factor_conversion: f64,
    valor_aplicado: f64,
    tipo_valor: String,
    es_valor_manual: bool,
    es_servicio: bool,
}

#[tauri::command]
pub async fn registrar_venta(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    venta_id: String,
    codigo: String,
    operador_id: String,
    sesion_id: Option<String>,
    caja_codigo: Option<String>,
    total: f64,
    metodo_pago: String,
    tipo_comprobante: String,
    concretada_en: String,
    lineas: Vec<LineaVentaInput>,
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
        "INSERT INTO venta (id, codigo, operador_id, caja_codigo, sesion_id, total, metodo_pago, tipo_comprobante, concretada_en, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&venta_id)
    .bind(&codigo)
    .bind(&operador_id)
    .bind(&caja_codigo)
    .bind(&sesion_id)
    .bind(total)
    .bind(&metodo_pago)
    .bind(&tipo_comprobante)
    .bind(&concretada_en)
    .bind(&creado_en)
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    for linea in &lineas {
        let presentacion_id = match &linea.nodo_fraccionamiento_id {
            Some(nodo_fraccionamiento_id) => sqlx::query_scalar::<_, Option<String>>(
                "SELECT presentacion_id FROM nodo_fraccionamiento WHERE id = ?",
            )
            .bind(nodo_fraccionamiento_id)
            .fetch_optional(&mut *tx)
            .await
            .map_err(|e| e.to_string())?
            .flatten(),
            None => None,
        };
        let linea_id = Uuid::new_v4().to_string();
        let unidades_base_total = linea.cantidad * linea.factor_conversion;
        let subtotal = linea.cantidad * linea.valor_aplicado;

        sqlx::query(
            "INSERT INTO linea_venta (id, venta_id, hov_id, nodo_fraccionamiento_id, presentacion_id, nombre_visible, cantidad, factor_conversion, unidades_base_total, valor_aplicado, tipo_valor, es_valor_manual, subtotal, es_servicio, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(&linea_id)
        .bind(&venta_id)
        .bind(&linea.hov_id)
        .bind(&linea.nodo_fraccionamiento_id)
        .bind(&presentacion_id)
        .bind(&linea.nombre_visible)
        .bind(linea.cantidad)
        .bind(linea.factor_conversion)
        .bind(unidades_base_total)
        .bind(linea.valor_aplicado)
        .bind(&linea.tipo_valor)
        .bind(if linea.es_valor_manual { 1_i64 } else { 0_i64 })
        .bind(subtotal)
        .bind(if linea.es_servicio { 1_i64 } else { 0_i64 })
        .bind(&creado_en)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    }

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(venta_id)
}

#[tauri::command]
pub async fn obtener_ventas_sesion(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    sesion_id: String,
) -> Result<Value, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let rows = sqlx::query(
        "SELECT id, codigo, total, metodo_pago, tipo_comprobante, operador_id, concretada_en FROM venta WHERE sesion_id = ? ORDER BY concretada_en DESC",
    )
    .bind(&sesion_id)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let ventas: Result<Vec<Value>, String> = rows
        .into_iter()
        .map(|row| {
            Ok(json!({
                "id": row.try_get::<String, _>("id").map_err(|e| e.to_string())?,
                "codigo": row.try_get::<String, _>("codigo").map_err(|e| e.to_string())?,
                "total": row.try_get::<f64, _>("total").map_err(|e| e.to_string())?,
                "metodo_pago": row.try_get::<String, _>("metodo_pago").map_err(|e| e.to_string())?,
                "tipo_comprobante": row.try_get::<String, _>("tipo_comprobante").map_err(|e| e.to_string())?,
                "operador_id": row.try_get::<String, _>("operador_id").map_err(|e| e.to_string())?,
                "concretada_en": row.try_get::<String, _>("concretada_en").map_err(|e| e.to_string())?,
            }))
        })
        .collect();

    Ok(json!(ventas?))
}

#[tauri::command]
pub async fn obtener_venta_detalle(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    venta_id: String,
) -> Result<Value, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let venta = sqlx::query("SELECT * FROM venta WHERE id = ?")
        .bind(&venta_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| String::from("Venta no encontrada"))?;
    let rows = sqlx::query("SELECT * FROM linea_venta WHERE venta_id = ? ORDER BY creado_en")
        .bind(&venta_id)
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;

    let lineas: Result<Vec<Value>, String> = rows
        .into_iter()
        .map(|row| {
            Ok(json!({
                "id": row.try_get::<String, _>("id").map_err(|e| e.to_string())?,
                "venta_id": row.try_get::<String, _>("venta_id").map_err(|e| e.to_string())?,
                "hov_id": row.try_get::<String, _>("hov_id").map_err(|e| e.to_string())?,
                "nodo_fraccionamiento_id": row.try_get::<Option<String>, _>("nodo_fraccionamiento_id").unwrap_or(None),
                "presentacion_id": row.try_get::<Option<String>, _>("presentacion_id").unwrap_or(None),
                "nombre_visible": row.try_get::<String, _>("nombre_visible").map_err(|e| e.to_string())?,
                "cantidad": row.try_get::<f64, _>("cantidad").map_err(|e| e.to_string())?,
                "factor_conversion": row.try_get::<f64, _>("factor_conversion").map_err(|e| e.to_string())?,
                "unidades_base_total": row.try_get::<f64, _>("unidades_base_total").map_err(|e| e.to_string())?,
                "valor_aplicado": row.try_get::<f64, _>("valor_aplicado").map_err(|e| e.to_string())?,
                "tipo_valor": row.try_get::<String, _>("tipo_valor").map_err(|e| e.to_string())?,
                "es_valor_manual": row.try_get::<i64, _>("es_valor_manual").unwrap_or(0) != 0,
                "subtotal": row.try_get::<f64, _>("subtotal").map_err(|e| e.to_string())?,
                "es_servicio": row.try_get::<i64, _>("es_servicio").unwrap_or(0) != 0,
                "creado_en": row.try_get::<String, _>("creado_en").map_err(|e| e.to_string())?,
            }))
        })
        .collect();

    Ok(json!({
        "id": venta.try_get::<String, _>("id").map_err(|e| e.to_string())?,
        "codigo": venta.try_get::<String, _>("codigo").map_err(|e| e.to_string())?,
        "operador_id": venta.try_get::<String, _>("operador_id").map_err(|e| e.to_string())?,
        "caja_codigo": venta.try_get::<Option<String>, _>("caja_codigo").unwrap_or(None),
        "sesion_id": venta.try_get::<Option<String>, _>("sesion_id").unwrap_or(None),
        "total": venta.try_get::<f64, _>("total").map_err(|e| e.to_string())?,
        "metodo_pago": venta.try_get::<String, _>("metodo_pago").map_err(|e| e.to_string())?,
        "tipo_comprobante": venta.try_get::<String, _>("tipo_comprobante").map_err(|e| e.to_string())?,
        "estado": venta.try_get::<String, _>("estado").map_err(|e| e.to_string())?,
        "concretada_en": venta.try_get::<String, _>("concretada_en").map_err(|e| e.to_string())?,
        "creado_en": venta.try_get::<String, _>("creado_en").map_err(|e| e.to_string())?,
        "lineas": lineas?,
    }))
}
