// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::process::Command;
use std::sync::mpsc::channel;
use tauri::api::dialog::FileDialogBuilder;
use tauri::Manager;

#[tauri::command]
fn get_secrets_path(app_handle: tauri::AppHandle) -> Result<String, String> {
    let app_data_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or_else(|| "Failed to get app data dir".to_string())?;
    let secrets_path = app_data_dir.join("secrets");
    std::fs::create_dir_all(&secrets_path)
        .map_err(|e| format!("Failed to create secrets directory: {}", e))?;
    secrets_path
        .to_str()
        .ok_or_else(|| "Failed to convert path to string".to_string())
        .map(String::from)
}

#[tauri::command]
fn open_folder(path: String) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        Command::new("explorer")
            .args([&path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "macos")]
    {
        Command::new("open")
            .args([&path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    #[cfg(target_os = "linux")]
    {
        Command::new("xdg-open")
            .args([&path])
            .spawn()
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[tauri::command]
async fn select_files(_app_handle: tauri::AppHandle) -> Result<Vec<String>, String> {
    let (tx, rx) = channel();

    FileDialogBuilder::new()
        .set_title("Select files")
        .set_directory("/")
        .pick_files(move |file_paths| {
            let result = file_paths
                .map(|paths| {
                    paths
                        .into_iter()
                        .filter_map(|path| path.to_str().map(String::from))
                        .collect::<Vec<String>>()
                })
                .ok_or_else(|| "No files selected".to_string());
            tx.send(result).unwrap();
        });

    rx.recv().unwrap()
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
        .invoke_handler(tauri::generate_handler![
            open_folder,
            get_secrets_path,
            select_files
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
