
use std::fs;
use tauri::Manager;
use tauri_plugin_fs;
use tauri_plugin_dialog;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .setup(|app| {
      // —— ここで AppData ディレクトリを取得 ——  
      if let Ok(pathbuf) = app.handle().path().app_data_dir() {
        if let Err(e) = fs::create_dir_all(&pathbuf) {
          eprintln!("⚠️ AppData ディレクトリ作成失敗: {:?}", e);
        }
      }

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
