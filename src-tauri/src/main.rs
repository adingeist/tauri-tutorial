// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use tauri::Manager;

#[tauri::command]
fn get_secrets_path(app_handle: tauri::AppHandle) -> Result<String, String> {
    let app_data_dir = app_handle.path_resolver().app_data_dir()
        .ok_or_else(|| "Failed to get app data dir".to_string())?;
    let secrets_path = app_data_dir.join("secrets");
    std::fs::create_dir_all(&secrets_path)
        .map_err(|e| format!("Failed to create secrets directory: {}", e))?;
    secrets_path.to_str()
        .ok_or_else(|| "Failed to convert path to string".to_string())
        .map(String::from)
}

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            #[cfg(debug_assertions)]
            {
                let window = app.get_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![get_secrets_path])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
