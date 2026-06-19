use base64::{engine::general_purpose::STANDARD, Engine as _};
use serde_json::{json, Value};
use sqlx::Row;
use tauri::State;

#[tauri::command]
pub async fn generar_reporte_digemid(
    db_instances: State<'_, tauri_plugin_sql::DbInstances>,
    codigo_estab: String,
) -> Result<Value, String> {
    let instances = db_instances.0.read().await;
    let db = instances.get("sqlite:disateq.db").ok_or_else(|| String::from("Base de datos no inicializada"))?;
    let tauri_plugin_sql::DbPool::Sqlite(pool) = db;
    let rows = sqlx::query("SELECT * FROM reporte_digemid_privado")
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;

    let mut ok: Vec<Value> = Vec::new();
    let mut inconsistentes: Vec<Value> = Vec::new();

    for row in rows {
        let cod_prod = row.try_get::<String, _>("CodProd").map_err(|e| e.to_string())?;
        let precio_empaque = row.try_get::<Option<f64>, _>("Precio1_Empaque").unwrap_or(None);
        let precio_unitario = row.try_get::<Option<f64>, _>("Precio2_Unitario").unwrap_or(None);
        let validacion_digemid = row.try_get::<String, _>("validacion_digemid").map_err(|e| e.to_string())?;
        let nombre_comercial = row.try_get::<String, _>("nombre_comercial").map_err(|e| e.to_string())?;
        let registro = json!({
            "CodProd": cod_prod,
            "Precio1_Empaque": precio_empaque,
            "Precio2_Unitario": precio_unitario,
            "precio_unitario_derivado": row.try_get::<Option<f64>, _>("precio_unitario_derivado").unwrap_or(None),
            "validacion_digemid": validacion_digemid,
            "nombre_comercial": nombre_comercial,
            "registro_sanitario": row.try_get::<Option<String>, _>("registro_sanitario").unwrap_or(None),
            "ifa": row.try_get::<String, _>("ifa").map_err(|e| e.to_string())?,
            "concentracion": row.try_get::<String, _>("concentracion").map_err(|e| e.to_string())?,
            "fraccion": row.try_get::<f64, _>("fraccion").map_err(|e| e.to_string())?,
        });

        if registro["validacion_digemid"] == "OK" {
            ok.push(registro);
        } else {
            inconsistentes.push(json!({
                "nombre_comercial": registro["nombre_comercial"].clone(),
                "CodProd": registro["CodProd"].clone(),
                "validacion_digemid": registro["validacion_digemid"].clone(),
            }));
        }
    }

    if !inconsistentes.is_empty() {
        return Ok(json!({
            "total_ok": ok.len(),
            "total_inconsistentes": inconsistentes.len(),
            "inconsistentes": inconsistentes,
            "csv": null,
        }));
    }

    let mut csv = String::from("CodEstab,CodProd,Precio1,Precio2");
    for registro in &ok {
        let cod_prod = registro["CodProd"].as_str().unwrap_or_default();
        let precio_empaque = registro["Precio1_Empaque"].as_f64().unwrap_or_default();
        let precio_unitario = registro["Precio2_Unitario"].as_f64().unwrap_or_default();
        csv.push_str(&format!(
            "\n{},{},{:.2},{:.2}",
            codigo_estab, cod_prod, precio_empaque, precio_unitario
        ));
    }

    Ok(json!({
        "total_ok": ok.len(),
        "total_inconsistentes": 0,
        "inconsistentes": [],
        "csv": STANDARD.encode(csv),
    }))
}
