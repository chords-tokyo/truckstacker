
use std::fs;
use tauri::{Manager, Emitter, menu::{MenuBuilder, MenuItemBuilder, SubmenuBuilder}, Window};
use tauri_plugin_fs;
use tauri_plugin_dialog;

// Tauri commands
#[tauri::command]
async fn trigger_export(window: Window) -> Result<(), String> {
    println!("🔥 Tauri command: trigger_export 呼び出し");
    window.emit("menu-export-data", ()).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
async fn trigger_import(window: Window) -> Result<(), String> {
    println!("🔥 Tauri command: trigger_import 呼び出し");
    window.emit("menu-import-data", ()).map_err(|e| e.to_string())?;
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
    .invoke_handler(tauri::generate_handler![trigger_export, trigger_import])
    .setup(|app| {
      // —— ここで AppData ディレクトリを取得 ——  
      if let Ok(pathbuf) = app.handle().path().app_data_dir() {
        if let Err(e) = fs::create_dir_all(&pathbuf) {
          eprintln!("⚠️ AppData ディレクトリ作成失敗: {:?}", e);
        } else {
          println!("✅ データ保存場所: {:?}", pathbuf);
        }
      }

      // メニューの作成
      let export_item = MenuItemBuilder::with_id("export_data", "データをエクスポート")
        .accelerator("CmdOrCtrl+E")
        .build(app)?;
      let import_item = MenuItemBuilder::with_id("import_data", "データをインポート") 
        .accelerator("CmdOrCtrl+I")
        .build(app)?;
      let quit_item = MenuItemBuilder::with_id("quit", "終了")
        .accelerator("CmdOrCtrl+Q")
        .build(app)?;

      let file_submenu = SubmenuBuilder::new(app, "File")
        .items(&[&export_item, &import_item, &quit_item])
        .build()?;

      let menu = MenuBuilder::new(app)
        .items(&[&file_submenu])
        .build()?;

      app.set_menu(menu)?;

      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      Ok(())
    })
    .on_menu_event(|app, event| {
      println!("🎯 メニューイベント受信: {}", event.id().as_ref());
      match event.id().as_ref() {
        "export_data" => {
          println!("📤 エクスポートメニューがクリックされました");
          if let Some(window) = app.get_webview_window("main") {
            if let Err(e) = window.emit("menu-export-data", ()) {
              println!("❌ ウィンドウイベント送信エラー: {:?}", e);
            } else {
              println!("✅ ウィンドウ経由でmenu-export-data イベント送信完了");
            }
          }
        }
        "import_data" => {
          println!("📥 インポートメニューがクリックされました");
          if let Some(window) = app.get_webview_window("main") {
            if let Err(e) = window.emit("menu-import-data", ()) {
              println!("❌ ウィンドウイベント送信エラー: {:?}", e);
            } else {
              println!("✅ ウィンドウ経由でmenu-import-data イベント送信完了");
            }
          }
        }
        "quit" => {
          println!("🚪 終了メニューがクリックされました");
          app.exit(0);
        }
        _ => {
          println!("🤷 未知のメニューイベント: {}", event.id().as_ref());
        }
      }
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
