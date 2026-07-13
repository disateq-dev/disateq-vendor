use serde::Deserialize;
use serde_json::{json, Value};
use sqlx::Row;
use tauri::State;
use uuid::Uuid;

#[derive(Deserialize)]
pub(crate) struct LineaComprobanteInput {
    descripcion: String,
    cantidad: f64,
    valor_unitario: f64,
    subtotal: f64,
    tipo_afectacion_igv: String,
    tasa_igv: f64,
    monto_isc: Option<f64>,
    nota_linea: Option<String>,
    codigo_producto_sunat: Option<String>,
}

#[tauri::command]
pub async fn registrar_comprobante(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    comprobante_id: String,
    venta_id: Option<String>,
    tipo: String,
    serie: String,
    correlativo: i64,
    codigo_unico: String,
    es_formal: bool,
    requiere_envio_sunat: bool,
    leyenda_no_formal: Option<String>,
    estado_sunat: String,
    emisor_ruc: String,
    emisor_razon_social: String,
    emisor_direccion: String,
    receptor_tipo_doc: String,
    receptor_num_doc: Option<String>,
    receptor_nombre: String,
    receptor_es_generico: bool,
    receptor_cliente_id: Option<String>,
    subtotal: f64,
    igv: f64,
    isc: f64,
    total: f64,
    moneda: String,
    metodo_pago: String,
    regimen: String,
    incluye_detraccion: bool,
    operador_id: String,
    sesion_id: Option<String>,
    caja_codigo: Option<String>,
    enviado_por_canal: String,
    emitido_en: String,
    lineas: Vec<LineaComprobanteInput>,
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
        "INSERT INTO comprobante (id, venta_id, tipo, serie, correlativo, codigo_unico, es_formal, requiere_envio_sunat, leyenda_no_formal, estado, estado_sunat, motivo_anulacion, cdr, fecha_envio_sunat, emisor_ruc, emisor_razon_social, emisor_direccion, receptor_tipo_doc, receptor_num_doc, receptor_nombre, receptor_es_generico, receptor_cliente_id, subtotal, igv, isc, total, moneda, metodo_pago, regimen, incluye_detraccion, operador_id, sesion_id, caja_codigo, enviado_por_canal, emitido_en, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'EMITIDO', ?, NULL, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    )
    .bind(&comprobante_id)
    .bind(&venta_id)
    .bind(&tipo)
    .bind(&serie)
    .bind(correlativo)
    .bind(&codigo_unico)
    .bind(if es_formal { 1_i64 } else { 0_i64 })
    .bind(if requiere_envio_sunat { 1_i64 } else { 0_i64 })
    .bind(&leyenda_no_formal)
    .bind(&estado_sunat)
    .bind(&emisor_ruc)
    .bind(&emisor_razon_social)
    .bind(&emisor_direccion)
    .bind(&receptor_tipo_doc)
    .bind(&receptor_num_doc)
    .bind(&receptor_nombre)
    .bind(if receptor_es_generico { 1_i64 } else { 0_i64 })
    .bind(&receptor_cliente_id)
    .bind(subtotal)
    .bind(igv)
    .bind(isc)
    .bind(total)
    .bind(&moneda)
    .bind(&metodo_pago)
    .bind(&regimen)
    .bind(if incluye_detraccion { 1_i64 } else { 0_i64 })
    .bind(&operador_id)
    .bind(&sesion_id)
    .bind(&caja_codigo)
    .bind(&enviado_por_canal)
    .bind(&emitido_en)
    .bind(&creado_en)
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    for linea in &lineas {
        let linea_id = Uuid::new_v4().to_string();
        sqlx::query(
            "INSERT INTO linea_comprobante (id, comprobante_id, descripcion, cantidad, valor_unitario, subtotal, tipo_afectacion_igv, tasa_igv, monto_isc, nota_linea, codigo_producto_sunat, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        )
        .bind(&linea_id)
        .bind(&comprobante_id)
        .bind(&linea.descripcion)
        .bind(linea.cantidad)
        .bind(linea.valor_unitario)
        .bind(linea.subtotal)
        .bind(&linea.tipo_afectacion_igv)
        .bind(linea.tasa_igv)
        .bind(linea.monto_isc)
        .bind(&linea.nota_linea)
        .bind(&linea.codigo_producto_sunat)
        .bind(&creado_en)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;
    }

    sqlx::query(
        "INSERT INTO correlativo (serie, tipo, siguiente, ultimo_emitido, creado_en, actualizado_en) VALUES (?, ?, ?, ?, ?, ?) ON CONFLICT(serie) DO UPDATE SET siguiente = excluded.siguiente, ultimo_emitido = excluded.ultimo_emitido, actualizado_en = excluded.actualizado_en",
    )
    .bind(&serie)
    .bind(&tipo)
    .bind(correlativo + 1)
    .bind(correlativo)
    .bind(&creado_en)
    .bind(&creado_en)
    .execute(&mut *tx)
    .await
    .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())?;
    Ok(comprobante_id)
}

#[tauri::command]
pub async fn obtener_siguiente_correlativo(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    serie: String,
) -> Result<i64, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let siguiente = sqlx::query_scalar::<_, i64>("SELECT siguiente FROM correlativo WHERE serie = ?")
        .bind(&serie)
        .fetch_optional(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(siguiente.unwrap_or(1))
}

#[tauri::command]
pub async fn obtener_comprobantes_sesion(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    sesion_id: String,
) -> Result<Value, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let rows = sqlx::query(
        "SELECT id, venta_id, tipo, serie, correlativo, codigo_unico, es_formal, estado, estado_sunat, receptor_nombre, receptor_es_generico, subtotal, igv, total, metodo_pago, operador_id, emitido_en FROM comprobante WHERE sesion_id = ? ORDER BY emitido_en DESC",
    )
    .bind(&sesion_id)
    .fetch_all(pool)
    .await
    .map_err(|e| e.to_string())?;

    let comprobantes: Result<Vec<Value>, String> = rows.into_iter().map(|row| {
        Ok(json!({
            "id": row.try_get::<String, _>("id").map_err(|e| e.to_string())?,
            "venta_id": row.try_get::<Option<String>, _>("venta_id").unwrap_or(None),
            "tipo": row.try_get::<String, _>("tipo").map_err(|e| e.to_string())?,
            "serie": row.try_get::<String, _>("serie").map_err(|e| e.to_string())?,
            "correlativo": row.try_get::<i64, _>("correlativo").map_err(|e| e.to_string())?,
            "codigo_unico": row.try_get::<String, _>("codigo_unico").map_err(|e| e.to_string())?,
            "es_formal": row.try_get::<i64, _>("es_formal").unwrap_or(0) != 0,
            "estado": row.try_get::<String, _>("estado").map_err(|e| e.to_string())?,
            "estado_sunat": row.try_get::<String, _>("estado_sunat").map_err(|e| e.to_string())?,
            "receptor_nombre": row.try_get::<String, _>("receptor_nombre").map_err(|e| e.to_string())?,
            "receptor_es_generico": row.try_get::<i64, _>("receptor_es_generico").unwrap_or(0) != 0,
            "subtotal": row.try_get::<f64, _>("subtotal").map_err(|e| e.to_string())?,
            "igv": row.try_get::<f64, _>("igv").map_err(|e| e.to_string())?,
            "total": row.try_get::<f64, _>("total").map_err(|e| e.to_string())?,
            "metodo_pago": row.try_get::<String, _>("metodo_pago").map_err(|e| e.to_string())?,
            "operador_id": row.try_get::<String, _>("operador_id").map_err(|e| e.to_string())?,
            "emitido_en": row.try_get::<String, _>("emitido_en").map_err(|e| e.to_string())?,
        }))
    }).collect();

    Ok(json!(comprobantes?))
}

#[tauri::command]
pub async fn obtener_comprobantes_historial(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    tipo: Option<String>,
    estado: Option<String>,
    limite: Option<i64>,
) -> Result<Value, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let mut query_string = String::from(
        "SELECT id, venta_id, tipo, serie, correlativo, codigo_unico, es_formal, estado, estado_sunat, receptor_nombre, receptor_es_generico, subtotal, igv, total, metodo_pago, operador_id, emitido_en FROM comprobante WHERE 1=1",
    );
    if let Some(tipo) = tipo {
        query_string.push_str(&format!(" AND tipo = '{tipo}'"));
    }
    if let Some(estado) = estado {
        query_string.push_str(&format!(" AND estado = '{estado}'"));
    }
    query_string.push_str(" ORDER BY emitido_en DESC");
    if let Some(limite) = limite {
        query_string.push_str(&format!(" LIMIT {limite}"));
    }

    let rows = sqlx::query(&query_string)
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;
    let comprobantes: Result<Vec<Value>, String> = rows.into_iter().map(|row| {
        Ok(json!({
            "id": row.try_get::<String, _>("id").map_err(|e| e.to_string())?,
            "venta_id": row.try_get::<Option<String>, _>("venta_id").unwrap_or(None),
            "tipo": row.try_get::<String, _>("tipo").map_err(|e| e.to_string())?,
            "serie": row.try_get::<String, _>("serie").map_err(|e| e.to_string())?,
            "correlativo": row.try_get::<i64, _>("correlativo").map_err(|e| e.to_string())?,
            "codigo_unico": row.try_get::<String, _>("codigo_unico").map_err(|e| e.to_string())?,
            "es_formal": row.try_get::<i64, _>("es_formal").unwrap_or(0) != 0,
            "estado": row.try_get::<String, _>("estado").map_err(|e| e.to_string())?,
            "estado_sunat": row.try_get::<String, _>("estado_sunat").map_err(|e| e.to_string())?,
            "receptor_nombre": row.try_get::<String, _>("receptor_nombre").map_err(|e| e.to_string())?,
            "receptor_es_generico": row.try_get::<i64, _>("receptor_es_generico").unwrap_or(0) != 0,
            "subtotal": row.try_get::<f64, _>("subtotal").map_err(|e| e.to_string())?,
            "igv": row.try_get::<f64, _>("igv").map_err(|e| e.to_string())?,
            "total": row.try_get::<f64, _>("total").map_err(|e| e.to_string())?,
            "metodo_pago": row.try_get::<String, _>("metodo_pago").map_err(|e| e.to_string())?,
            "operador_id": row.try_get::<String, _>("operador_id").map_err(|e| e.to_string())?,
            "emitido_en": row.try_get::<String, _>("emitido_en").map_err(|e| e.to_string())?,
        }))
    }).collect();

    Ok(json!(comprobantes?))
}

#[tauri::command]
pub async fn obtener_comprobante_detalle(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    comprobante_id: String,
) -> Result<Value, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let comprobante = sqlx::query("SELECT * FROM comprobante WHERE id = ?")
        .bind(&comprobante_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| String::from("Comprobante no encontrado"))?;
    let rows = sqlx::query("SELECT * FROM linea_comprobante WHERE comprobante_id = ? ORDER BY creado_en")
        .bind(&comprobante_id)
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;
    let lineas: Result<Vec<Value>, String> = rows.into_iter().map(|row| {
        Ok(json!({
            "id": row.try_get::<String, _>("id").map_err(|e| e.to_string())?,
            "comprobante_id": row.try_get::<String, _>("comprobante_id").map_err(|e| e.to_string())?,
            "descripcion": row.try_get::<String, _>("descripcion").map_err(|e| e.to_string())?,
            "cantidad": row.try_get::<f64, _>("cantidad").map_err(|e| e.to_string())?,
            "valor_unitario": row.try_get::<f64, _>("valor_unitario").map_err(|e| e.to_string())?,
            "subtotal": row.try_get::<f64, _>("subtotal").map_err(|e| e.to_string())?,
            "tipo_afectacion_igv": row.try_get::<String, _>("tipo_afectacion_igv").map_err(|e| e.to_string())?,
            "tasa_igv": row.try_get::<f64, _>("tasa_igv").map_err(|e| e.to_string())?,
            "monto_isc": row.try_get::<Option<f64>, _>("monto_isc").unwrap_or(None),
            "nota_linea": row.try_get::<Option<String>, _>("nota_linea").unwrap_or(None),
            "codigo_producto_sunat": row.try_get::<Option<String>, _>("codigo_producto_sunat").unwrap_or(None),
            "creado_en": row.try_get::<String, _>("creado_en").map_err(|e| e.to_string())?,
        }))
    }).collect();

    Ok(json!({
        "comprobante": {
            "id": comprobante.try_get::<String, _>("id").map_err(|e| e.to_string())?,
            "venta_id": comprobante.try_get::<Option<String>, _>("venta_id").unwrap_or(None),
            "tipo": comprobante.try_get::<String, _>("tipo").map_err(|e| e.to_string())?,
            "serie": comprobante.try_get::<String, _>("serie").map_err(|e| e.to_string())?,
            "correlativo": comprobante.try_get::<i64, _>("correlativo").map_err(|e| e.to_string())?,
            "codigo_unico": comprobante.try_get::<String, _>("codigo_unico").map_err(|e| e.to_string())?,
            "es_formal": comprobante.try_get::<i64, _>("es_formal").unwrap_or(0) != 0,
            "requiere_envio_sunat": comprobante.try_get::<i64, _>("requiere_envio_sunat").unwrap_or(0) != 0,
            "leyenda_no_formal": comprobante.try_get::<Option<String>, _>("leyenda_no_formal").unwrap_or(None),
            "estado": comprobante.try_get::<String, _>("estado").map_err(|e| e.to_string())?,
            "estado_sunat": comprobante.try_get::<String, _>("estado_sunat").map_err(|e| e.to_string())?,
            "motivo_anulacion": comprobante.try_get::<Option<String>, _>("motivo_anulacion").unwrap_or(None),
            "cdr": comprobante.try_get::<Option<String>, _>("cdr").unwrap_or(None),
            "fecha_envio_sunat": comprobante.try_get::<Option<String>, _>("fecha_envio_sunat").unwrap_or(None),
            "emisor_ruc": comprobante.try_get::<String, _>("emisor_ruc").map_err(|e| e.to_string())?,
            "emisor_razon_social": comprobante.try_get::<String, _>("emisor_razon_social").map_err(|e| e.to_string())?,
            "emisor_direccion": comprobante.try_get::<String, _>("emisor_direccion").map_err(|e| e.to_string())?,
            "receptor_tipo_doc": comprobante.try_get::<String, _>("receptor_tipo_doc").map_err(|e| e.to_string())?,
            "receptor_num_doc": comprobante.try_get::<Option<String>, _>("receptor_num_doc").unwrap_or(None),
            "receptor_nombre": comprobante.try_get::<String, _>("receptor_nombre").map_err(|e| e.to_string())?,
            "receptor_es_generico": comprobante.try_get::<i64, _>("receptor_es_generico").unwrap_or(0) != 0,
            "receptor_cliente_id": comprobante.try_get::<Option<String>, _>("receptor_cliente_id").unwrap_or(None),
            "subtotal": comprobante.try_get::<f64, _>("subtotal").map_err(|e| e.to_string())?,
            "igv": comprobante.try_get::<f64, _>("igv").map_err(|e| e.to_string())?,
            "isc": comprobante.try_get::<f64, _>("isc").map_err(|e| e.to_string())?,
            "total": comprobante.try_get::<f64, _>("total").map_err(|e| e.to_string())?,
            "moneda": comprobante.try_get::<String, _>("moneda").map_err(|e| e.to_string())?,
            "metodo_pago": comprobante.try_get::<String, _>("metodo_pago").map_err(|e| e.to_string())?,
            "regimen": comprobante.try_get::<String, _>("regimen").map_err(|e| e.to_string())?,
            "incluye_detraccion": comprobante.try_get::<i64, _>("incluye_detraccion").unwrap_or(0) != 0,
            "operador_id": comprobante.try_get::<String, _>("operador_id").map_err(|e| e.to_string())?,
            "sesion_id": comprobante.try_get::<Option<String>, _>("sesion_id").unwrap_or(None),
            "caja_codigo": comprobante.try_get::<Option<String>, _>("caja_codigo").unwrap_or(None),
            "enviado_por_canal": comprobante.try_get::<String, _>("enviado_por_canal").map_err(|e| e.to_string())?,
            "emitido_en": comprobante.try_get::<String, _>("emitido_en").map_err(|e| e.to_string())?,
            "creado_en": comprobante.try_get::<String, _>("creado_en").map_err(|e| e.to_string())?,
        },
        "lineas": lineas?,
    }))
}

#[tauri::command]
pub async fn anular_comprobante_sqlite(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    comprobante_id: String,
    motivo: String,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let estado = sqlx::query_scalar::<_, String>("SELECT estado FROM comprobante WHERE id = ?")
        .bind(&comprobante_id)
        .fetch_optional(pool)
        .await
        .map_err(|e| e.to_string())?
        .ok_or_else(|| String::from("Comprobante no encontrado"))?;
    if estado == "ANULADO" {
        return Err(String::from("El comprobante ya está anulado"));
    }
    if motivo.trim().is_empty() {
        return Err(String::from("El motivo de anulación es obligatorio"));
    }

    sqlx::query("UPDATE comprobante SET estado = 'ANULADO', motivo_anulacion = ? WHERE id = ?")
        .bind(&motivo)
        .bind(&comprobante_id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
pub async fn actualizar_estado_sunat(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    comprobante_id: String,
    estado_sunat: String,
    cdr: Option<String>,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let ahora = sqlx::query_scalar::<_, String>("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')")
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    sqlx::query(
        "UPDATE comprobante SET estado_sunat = ?, cdr = ?, fecha_envio_sunat = CASE WHEN ? = 'ENVIADO' THEN ? ELSE fecha_envio_sunat END WHERE id = ?",
    )
    .bind(&estado_sunat)
    .bind(&cdr)
    .bind(&estado_sunat)
    .bind(&ahora)
    .bind(&comprobante_id)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;
    Ok(())
}
