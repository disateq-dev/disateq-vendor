use serde_json::{json, Value};
use sqlx::Row;
use tauri::State;

#[tauri::command]
pub async fn buscar_en_catalogo_maestro(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    termino: String,
) -> Result<Vec<Value>, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let patron = format!("%{}%", termino);

    let resultado = sqlx::query(
        "SELECT p.cod_prod, p.nombre, p.concentracion_raw, p.presentacion, p.num_regsan, l.nombre AS laboratorio, f.nombre AS forma FROM catalogo_maestro.producto p LEFT JOIN catalogo_maestro.laboratorio l ON l.id_laboratorio = p.id_laboratorio LEFT JOIN catalogo_maestro.forma_farmaceutica f ON f.id_forma = p.id_forma WHERE p.nombre LIKE ? COLLATE NOCASE ORDER BY p.nombre LIMIT 20",
    )
    .bind(&patron)
    .fetch_all(pool)
    .await;

    let rows = match resultado {
        Ok(filas) => filas,
        Err(e) => {
            if e.to_string().contains("no such table") {
                return Ok(vec![]);
            }
            return Err(e.to_string());
        }
    };

    rows.into_iter()
        .map(|row| {
            Ok(json!({
                "codProd": row.try_get::<i64, _>("cod_prod").map_err(|e| e.to_string())?,
                "nombre": row.try_get::<Option<String>, _>("nombre").unwrap_or(None),
                "concentracionRaw": row.try_get::<Option<String>, _>("concentracion_raw").unwrap_or(None),
                "presentacion": row.try_get::<Option<String>, _>("presentacion").unwrap_or(None),
                "numRegsan": row.try_get::<Option<String>, _>("num_regsan").unwrap_or(None),
                "laboratorio": row.try_get::<Option<String>, _>("laboratorio").unwrap_or(None),
                "forma": row.try_get::<Option<String>, _>("forma").unwrap_or(None),
            }))
        })
        .collect()
}

#[tauri::command]
pub async fn obtener_detalle_catalogo_maestro(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    cod_prod: i64,
) -> Result<Option<Value>, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;

    let resultado = sqlx::query(
        "SELECT p.cod_prod, p.nombre, p.concentracion_raw, p.presentacion, p.num_regsan, p.situacion, p.clasificacion_comercial, l.nombre AS laboratorio, t.nombre AS titular, f.nombre AS forma FROM catalogo_maestro.producto p LEFT JOIN catalogo_maestro.laboratorio l ON l.id_laboratorio = p.id_laboratorio LEFT JOIN catalogo_maestro.titular t ON t.id_titular = p.id_titular LEFT JOIN catalogo_maestro.forma_farmaceutica f ON f.id_forma = p.id_forma WHERE p.cod_prod = ?",
    )
    .bind(cod_prod)
    .fetch_optional(pool)
    .await;

    let fila = match resultado {
        Ok(fila_opcional) => fila_opcional,
        Err(e) => {
            if e.to_string().contains("no such table") {
                return Ok(None);
            }
            return Err(e.to_string());
        }
    };

    let fila = match fila {
        Some(f) => f,
        None => return Ok(None),
    };

    let principios_resultado = sqlx::query(
        "SELECT pa.nombre_dci, ppa.concentracion FROM catalogo_maestro.producto_principio_activo ppa JOIN catalogo_maestro.principio_activo pa ON pa.id_principio_activo = ppa.id_principio_activo WHERE ppa.cod_prod = ?",
    )
    .bind(cod_prod)
    .fetch_all(pool)
    .await;

    let principios = match principios_resultado {
        Ok(filas) => filas
            .into_iter()
            .map(|row| {
                Ok(json!({
                    "nombreDci": row.try_get::<String, _>("nombre_dci").map_err(|e| e.to_string())?,
                    "concentracion": row.try_get::<Option<String>, _>("concentracion").unwrap_or(None),
                }))
            })
            .collect::<Result<Vec<Value>, String>>()?,
        Err(_) => vec![],
    };

    Ok(Some(json!({
        "codProd": fila.try_get::<i64, _>("cod_prod").map_err(|e| e.to_string())?,
        "nombre": fila.try_get::<Option<String>, _>("nombre").unwrap_or(None),
        "concentracionRaw": fila.try_get::<Option<String>, _>("concentracion_raw").unwrap_or(None),
        "presentacion": fila.try_get::<Option<String>, _>("presentacion").unwrap_or(None),
        "numRegsan": fila.try_get::<Option<String>, _>("num_regsan").unwrap_or(None),
        "situacion": fila.try_get::<Option<String>, _>("situacion").unwrap_or(None),
        "clasificacionComercial": fila.try_get::<Option<String>, _>("clasificacion_comercial").unwrap_or(None),
        "laboratorio": fila.try_get::<Option<String>, _>("laboratorio").unwrap_or(None),
        "titular": fila.try_get::<Option<String>, _>("titular").unwrap_or(None),
        "forma": fila.try_get::<Option<String>, _>("forma").unwrap_or(None),
        "principiosActivos": principios,
    })))
}
