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

async fn verificar_historial_presentacion_en_tx(
    tx: &mut sqlx::SqliteConnection,
    presentacion_id: &str,
) -> Result<bool, String> {
    let count_lote = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM lote WHERE presentacion_id = ?")
        .bind(presentacion_id)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    if count_lote > 0 {
        return Ok(true);
    }

    let count_movimiento = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM movimiento WHERE item_id = ?")
        .bind(presentacion_id)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    Ok(count_movimiento > 0)
}

async fn verificar_historial_nodo_en_tx(
    tx: &mut sqlx::SqliteConnection,
    nodo_id: &str,
) -> Result<bool, String> {
    let count_movimiento = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM movimiento WHERE nodo_id = ?")
        .bind(nodo_id)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    Ok(count_movimiento > 0)
}

async fn registrar_correccion(
    tx: &mut sqlx::SqliteConnection,
    tabla: &str,
    entidad_id: &str,
    campo: &str,
    valor_anterior: String,
    valor_nuevo: String,
    motivo: &str,
    operador_id: &str,
    creado_en: &str,
) -> Result<(), String> {
    sqlx::query("INSERT INTO correccion_catalogo (id, tabla, entidad_id, campo, valor_anterior, valor_nuevo, motivo, operador_id, creado_en) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)")
        .bind(Uuid::new_v4().to_string())
        .bind(tabla)
        .bind(entidad_id)
        .bind(campo)
        .bind(valor_anterior)
        .bind(valor_nuevo)
        .bind(motivo)
        .bind(operador_id)
        .bind(creado_en)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
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
                "stock_minimo": row.try_get::<f64, _>("stock_minimo").map_err(|e| e.to_string())?,
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

#[tauri::command]
pub async fn modificar_stock_minimo(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    presentacion_id: String,
    stock_minimo: f64,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    sqlx::query("UPDATE presentacion_comercial SET stock_minimo = ? WHERE id = ?")
        .bind(stock_minimo)
        .bind(presentacion_id)
        .execute(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn verificar_historial_presentacion(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    presentacion_id: String,
) -> Result<bool, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    let count_lote = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM lote WHERE presentacion_id = ?")
        .bind(&presentacion_id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    if count_lote > 0 {
        return Ok(true);
    }

    let count_movimiento = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM movimiento WHERE item_id = ?")
        .bind(presentacion_id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(count_movimiento > 0)
}

#[tauri::command]
pub async fn verificar_historial_nodo(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    nodo_id: String,
) -> Result<bool, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    let count_movimiento = sqlx::query_scalar::<_, i64>("SELECT COUNT(*) FROM movimiento WHERE nodo_id = ?")
        .bind(nodo_id)
        .fetch_one(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(count_movimiento > 0)
}

#[tauri::command]
pub async fn modificar_presentacion(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    id: String,
    descripcion: String,
    codigo_barras: Option<String>,
    costo_compra: Option<f64>,
    fraccion_digemid: Option<f64>,
    unidad_conteo: Option<String>,
    factor_conversion_base: Option<f64>,
    motivo: Option<String>,
    operador_id: Option<String>,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    let row = sqlx::query("SELECT descripcion, codigo_barras, costo_compra, fraccion_digemid, unidad_conteo, factor_conversion_base FROM presentacion_comercial WHERE id = ?")
        .bind(&id)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    let descripcion_actual = row.try_get::<String, _>("descripcion").map_err(|e| e.to_string())?;
    let codigo_barras_actual = row.try_get::<Option<String>, _>("codigo_barras").unwrap_or(None);
    let costo_compra_actual = row.try_get::<Option<f64>, _>("costo_compra").unwrap_or(None);
    let fraccion_digemid_actual = row.try_get::<f64, _>("fraccion_digemid").map_err(|e| e.to_string())?;
    let unidad_conteo_actual = row.try_get::<String, _>("unidad_conteo").map_err(|e| e.to_string())?;
    let factor_conversion_base_actual = row.try_get::<f64, _>("factor_conversion_base").map_err(|e| e.to_string())?;
    let tiene_historial = verificar_historial_presentacion_en_tx(&mut *tx, &id).await?;

    if tiene_historial {
        if let Some(valor) = fraccion_digemid {
            if valor != fraccion_digemid_actual {
                return Err(String::from("CAMPO_BLOQUEADO_POR_HISTORIAL"));
            }
        }
        if let Some(valor) = &unidad_conteo {
            if valor != &unidad_conteo_actual {
                return Err(String::from("CAMPO_BLOQUEADO_POR_HISTORIAL"));
            }
        }
        if let Some(valor) = factor_conversion_base {
            if valor != factor_conversion_base_actual {
                return Err(String::from("CAMPO_BLOQUEADO_POR_HISTORIAL"));
            }
        }
    }

    let fraccion_digemid_nueva = fraccion_digemid.unwrap_or(fraccion_digemid_actual);
    let unidad_conteo_nueva = unidad_conteo.unwrap_or_else(|| unidad_conteo_actual.clone());
    let factor_conversion_base_nuevo = factor_conversion_base.unwrap_or(factor_conversion_base_actual);
    let hay_cambios = descripcion_actual != descripcion
        || codigo_barras_actual != codigo_barras
        || costo_compra_actual != costo_compra
        || fraccion_digemid_actual != fraccion_digemid_nueva
        || unidad_conteo_actual != unidad_conteo_nueva
        || factor_conversion_base_actual != factor_conversion_base_nuevo;
    let motivo_auditoria = motivo.unwrap_or_default().trim().to_string();

    if tiene_historial && hay_cambios && motivo_auditoria.is_empty() {
        return Err(String::from("MOTIVO_REQUERIDO"));
    }

    let operador_auditoria = operador_id.unwrap_or_default();
    let creado_en = sqlx::query_scalar::<_, String>("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')")
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    if descripcion_actual != descripcion {
        registrar_correccion(&mut *tx, "presentacion_comercial", &id, "descripcion", descripcion_actual, descripcion.clone(), &motivo_auditoria, &operador_auditoria, &creado_en).await?;
    }
    if codigo_barras_actual != codigo_barras {
        registrar_correccion(&mut *tx, "presentacion_comercial", &id, "codigo_barras", codigo_barras_actual.unwrap_or_default(), codigo_barras.clone().unwrap_or_default(), &motivo_auditoria, &operador_auditoria, &creado_en).await?;
    }
    if costo_compra_actual != costo_compra {
        registrar_correccion(&mut *tx, "presentacion_comercial", &id, "costo_compra", costo_compra_actual.map(|value| value.to_string()).unwrap_or_default(), costo_compra.map(|value| value.to_string()).unwrap_or_default(), &motivo_auditoria, &operador_auditoria, &creado_en).await?;
    }
    if fraccion_digemid_actual != fraccion_digemid_nueva {
        registrar_correccion(&mut *tx, "presentacion_comercial", &id, "fraccion_digemid", fraccion_digemid_actual.to_string(), fraccion_digemid_nueva.to_string(), &motivo_auditoria, &operador_auditoria, &creado_en).await?;
    }
    if unidad_conteo_actual != unidad_conteo_nueva {
        registrar_correccion(&mut *tx, "presentacion_comercial", &id, "unidad_conteo", unidad_conteo_actual, unidad_conteo_nueva.clone(), &motivo_auditoria, &operador_auditoria, &creado_en).await?;
    }
    if factor_conversion_base_actual != factor_conversion_base_nuevo {
        registrar_correccion(&mut *tx, "presentacion_comercial", &id, "factor_conversion_base", factor_conversion_base_actual.to_string(), factor_conversion_base_nuevo.to_string(), &motivo_auditoria, &operador_auditoria, &creado_en).await?;
    }

    sqlx::query("UPDATE presentacion_comercial SET descripcion = ?, codigo_barras = ?, costo_compra = ?, fraccion_digemid = ?, unidad_conteo = ?, factor_conversion_base = ? WHERE id = ?")
        .bind(descripcion)
        .bind(codigo_barras)
        .bind(costo_compra)
        .bind(fraccion_digemid_nueva)
        .bind(unidad_conteo_nueva)
        .bind(factor_conversion_base_nuevo)
        .bind(id)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn modificar_nodo(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    id: String,
    nombre_forma_venta: String,
    descripcion_promo: Option<String>,
    es_vendible: bool,
    tipo_forma_venta: Option<String>,
    unidades_base: Option<f64>,
    motivo: Option<String>,
    operador_id: Option<String>,
) -> Result<(), String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let mut tx = pool.begin().await.map_err(|e| e.to_string())?;

    let row = sqlx::query("SELECT nombre_forma_venta, descripcion_promo, es_vendible, tipo_forma_venta, unidades_base FROM nodo_fraccionamiento WHERE id = ?")
        .bind(&id)
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    let nombre_forma_venta_actual = row.try_get::<String, _>("nombre_forma_venta").map_err(|e| e.to_string())?;
    let descripcion_promo_actual = row.try_get::<Option<String>, _>("descripcion_promo").unwrap_or(None);
    let es_vendible_actual = row.try_get::<i64, _>("es_vendible").map_err(|e| e.to_string())?;
    let tipo_forma_venta_actual = row.try_get::<String, _>("tipo_forma_venta").map_err(|e| e.to_string())?;
    let unidades_base_actual = row.try_get::<f64, _>("unidades_base").map_err(|e| e.to_string())?;
    let tiene_historial = verificar_historial_nodo_en_tx(&mut *tx, &id).await?;

    if tiene_historial {
        if let Some(valor) = &tipo_forma_venta {
            if valor != &tipo_forma_venta_actual {
                return Err(String::from("CAMPO_BLOQUEADO_POR_HISTORIAL"));
            }
        }
        if let Some(valor) = unidades_base {
            if valor != unidades_base_actual {
                return Err(String::from("CAMPO_BLOQUEADO_POR_HISTORIAL"));
            }
        }
    }

    let es_vendible_nuevo = bool_a_i64(es_vendible);
    let tipo_forma_venta_nuevo = tipo_forma_venta.unwrap_or_else(|| tipo_forma_venta_actual.clone());
    let unidades_base_nuevo = unidades_base.unwrap_or(unidades_base_actual);
    let hay_cambios = nombre_forma_venta_actual != nombre_forma_venta
        || descripcion_promo_actual != descripcion_promo
        || es_vendible_actual != es_vendible_nuevo
        || tipo_forma_venta_actual != tipo_forma_venta_nuevo
        || unidades_base_actual != unidades_base_nuevo;
    let motivo_auditoria = motivo.unwrap_or_default().trim().to_string();

    if tiene_historial && hay_cambios && motivo_auditoria.is_empty() {
        return Err(String::from("MOTIVO_REQUERIDO"));
    }

    let operador_auditoria = operador_id.unwrap_or_default();
    let creado_en = sqlx::query_scalar::<_, String>("SELECT strftime('%Y-%m-%dT%H:%M:%fZ','now')")
        .fetch_one(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    if nombre_forma_venta_actual != nombre_forma_venta {
        registrar_correccion(&mut *tx, "nodo_fraccionamiento", &id, "nombre_forma_venta", nombre_forma_venta_actual, nombre_forma_venta.clone(), &motivo_auditoria, &operador_auditoria, &creado_en).await?;
    }
    if descripcion_promo_actual != descripcion_promo {
        registrar_correccion(&mut *tx, "nodo_fraccionamiento", &id, "descripcion_promo", descripcion_promo_actual.unwrap_or_default(), descripcion_promo.clone().unwrap_or_default(), &motivo_auditoria, &operador_auditoria, &creado_en).await?;
    }
    if es_vendible_actual != es_vendible_nuevo {
        registrar_correccion(&mut *tx, "nodo_fraccionamiento", &id, "es_vendible", es_vendible_actual.to_string(), es_vendible_nuevo.to_string(), &motivo_auditoria, &operador_auditoria, &creado_en).await?;
    }
    if tipo_forma_venta_actual != tipo_forma_venta_nuevo {
        registrar_correccion(&mut *tx, "nodo_fraccionamiento", &id, "tipo_forma_venta", tipo_forma_venta_actual, tipo_forma_venta_nuevo.clone(), &motivo_auditoria, &operador_auditoria, &creado_en).await?;
    }
    if unidades_base_actual != unidades_base_nuevo {
        registrar_correccion(&mut *tx, "nodo_fraccionamiento", &id, "unidades_base", unidades_base_actual.to_string(), unidades_base_nuevo.to_string(), &motivo_auditoria, &operador_auditoria, &creado_en).await?;
    }

    sqlx::query("UPDATE nodo_fraccionamiento SET nombre_forma_venta = ?, descripcion_promo = ?, es_vendible = ?, tipo_forma_venta = ?, unidades_base = ? WHERE id = ?")
        .bind(nombre_forma_venta)
        .bind(descripcion_promo)
        .bind(es_vendible_nuevo)
        .bind(tipo_forma_venta_nuevo)
        .bind(unidades_base_nuevo)
        .bind(id)
        .execute(&mut *tx)
        .await
        .map_err(|e| e.to_string())?;

    tx.commit().await.map_err(|e| e.to_string())?;

    Ok(())
}
