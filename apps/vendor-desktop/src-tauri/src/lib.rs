mod thermal;

#[tauri::command]
async fn print_ticket(printer: String, data: thermal::TicketPrintData) -> Result<(), String> {
    let bytes = thermal::build_escpos(&data);
    thermal::print_raw(&printer, &bytes)
}

#[tauri::command]
fn app_exit(app: tauri::AppHandle) {
    app.exit(0);
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .invoke_handler(tauri::generate_handler![print_ticket, app_exit])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
