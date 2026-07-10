mod db;
mod commands;
mod thermal;

#[tauri::command]
async fn print_ticket(printer: String, data: thermal::TicketPrintData) -> Result<(), String> {
    let bytes = thermal::build_escpos(&data);
    thermal::print_raw(&printer, &bytes)
}

#[tauri::command]
async fn print_ticket_with_dispatch(
    printer: String,
    receipt: thermal::TicketPrintData,
    dispatch: thermal::DispatchPrintData,
) -> Result<(), String> {
    let mut bytes = thermal::build_escpos(&receipt);
    bytes.extend(thermal::build_dispatch_escpos(&dispatch));
    thermal::print_raw(&printer, &bytes)
}

#[tauri::command]
async fn print_cash_move(printer: String, data: thermal::VoucherMovePrintData) -> Result<(), String> {
    let bytes = thermal::build_cash_move_escpos(&data);
    thermal::print_raw(&printer, &bytes)
}

#[tauri::command]
async fn print_arqueo(printer: String, data: thermal::ArqueoPrintData) -> Result<(), String> {
    let bytes = thermal::build_arqueo_escpos(&data);
    thermal::print_raw(&printer, &bytes)
}

#[tauri::command]
async fn print_correccion(printer: String, data: thermal::CorreccionPrintData) -> Result<(), String> {
    let bytes = thermal::build_correccion_escpos(&data);
    thermal::print_raw(&printer, &bytes)
}

#[tauri::command]
fn app_exit(app: tauri::AppHandle) {
    app.exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_single_instance::init(|app, _argv, _cwd| {
      // Segunda instancia detectada — enfocar la existente
      use tauri::Manager;
      if let Some(window) = app.get_webview_window("main") {
        let _ = window.unminimize();
        let _ = window.show();
        let _ = window.set_focus();
      }
    }))
    .plugin(tauri_plugin_sql::Builder::default().build())
    .setup(|app| {
      use tauri::Manager;
      if let Some(window) = app.get_webview_window("main") {
        let ico_bytes = include_bytes!("../icons/icon.ico");
        if let Ok(img) = image::load_from_memory(ico_bytes) {
          let rgba = img.to_rgba8();
          let (w, h) = (rgba.width(), rgba.height());
          let icon = tauri::image::Image::new_owned(rgba.into_raw(), w, h);
          let _ = window.set_icon(icon);
        }
      }
      let db_instances = app.state::<tauri_plugin_sql::DbInstances>();
      let app_path = app.path().app_config_dir()?;
      std::fs::create_dir_all(&app_path)?;
      let db_path = app_path.join("disateq.db");
      let db_url = format!(
        "sqlite:{}",
        db_path
          .to_str()
          .ok_or_else(|| String::from("Ruta de base de datos inválida"))?
      );
      let ruta_catalogo_maestro: Option<std::path::PathBuf> = {
        let candidato_recurso = app
          .path()
          .resource_dir()
          .ok()
          .map(|dir| dir.join("data").join("catalogo_digemid.sqlite"));
        let candidato_dev = std::path::PathBuf::from("data/catalogo_digemid.sqlite");
        candidato_recurso
          .filter(|p| p.exists())
          .or_else(|| Some(candidato_dev).filter(|p| p.exists()))
      };
      tauri::async_runtime::block_on(async {
        use sqlx::migrate::MigrateDatabase;
        if !sqlx::Sqlite::database_exists(&db_url).await.map_err(|e| e.to_string())? {
          sqlx::Sqlite::create_database(&db_url).await.map_err(|e| e.to_string())?;
        }
        let pool = sqlx::sqlite::SqlitePoolOptions::new()
          .after_connect({
            let ruta_catalogo_maestro = ruta_catalogo_maestro.clone();
            move |conn, _meta| {
              let ruta_catalogo_maestro = ruta_catalogo_maestro.clone();
              Box::pin(async move {
                if let Some(ruta) = ruta_catalogo_maestro {
                  if let Some(ruta_str) = ruta.to_str() {
                    let ruta_normalizada = ruta_str.strip_prefix(r"\\?\").unwrap_or(ruta_str);
                    let uri = format!("file:{}?mode=ro", ruta_normalizada.replace('\\', "/"));
                    let _ = sqlx::query("ATTACH DATABASE ? AS catalogo_maestro")
                      .bind(uri)
                      .execute(&mut *conn)
                      .await;
                  }
                }
                Ok(())
              })
            }
          })
          .connect(&db_url)
          .await
          .map_err(|e| e.to_string())?;
        db::migrations::ejecutar_migraciones(&pool).await?;
        db_instances
          .0
          .write()
          .await
          .insert(String::from("sqlite:disateq.db"), tauri_plugin_sql::DbPool::Sqlite(pool));
        Ok::<(), String>(())
      })
        .map_err(|e| -> Box<dyn std::error::Error> { e.into() })?;
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![print_ticket, print_ticket_with_dispatch, print_cash_move, print_arqueo, print_correccion, app_exit, commands::db_commands::obtener_rubro_activo, commands::db_commands::inicializar_establecimiento, commands::db_commands::verificar_db, commands::productos::crear_producto_generico, commands::productos::obtener_productos_genericos, commands::productos::crear_producto_comercial, commands::productos::obtener_productos_comerciales, commands::presentaciones::crear_presentacion, commands::presentaciones::obtener_presentaciones, commands::presentaciones::crear_nodo, commands::presentaciones::obtener_nodos_fraccionamiento, commands::presentaciones::verificar_historial_presentacion, commands::presentaciones::verificar_historial_nodo, commands::presentaciones::modificar_presentacion, commands::presentaciones::modificar_nodo, commands::proveedores::crear_proveedor, commands::proveedores::obtener_proveedores, commands::lotes::registrar_lote, commands::lotes::resolver_lote_fefo, commands::lotes::obtener_lotes_vigentes, commands::movimientos::registrar_movimiento, commands::servicios::crear_servicio_catalogo, commands::servicios::obtener_servicios_catalogo, commands::servicios::desactivar_servicio_catalogo, commands::servicios::obtener_margen_defecto, commands::servicios::registrar_ejecucion_servicio, commands::reportes::generar_reporte_digemid, commands::proveedores::actualizar_proveedor, commands::integraciones::consultar_ruc, commands::proveedores::buscar_proveedores, commands::ingresos::registrar_ingreso, commands::proveedores::desactivar_proveedor, commands::productos::desactivar_producto_comercial, commands::productos::reactivar_producto_comercial, commands::productos::modificar_producto_comercial, commands::productos::corregir_datos_operacionales, commands::productos::verificar_historial_producto, commands::productos::eliminar_producto_comercial_fisico, commands::valores::crear_valor_operacional, commands::valores::modificar_valor_operacional, commands::valores::obtener_valores_nodo, commands::valores::resolver_precio_nodo, commands::lotes::obtener_inventario_farmacia, commands::presentaciones::modificar_stock_minimo, commands::productos::listar_principios_activos, commands::productos::buscar_principios_activos, commands::productos::obtener_principios_de_producto, commands::productos::asignar_principios_a_producto, commands::productos::obtener_principio_activo, commands::productos::crear_principio_activo, commands::productos::modificar_principio_activo, commands::catalogo_maestro::buscar_en_catalogo_maestro, commands::catalogo_maestro::obtener_detalle_catalogo_maestro])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
