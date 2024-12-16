// src-tauri/src/main.rs (Rust backend)
#![cfg_attr(all(not(debug_assertions), target_os = "windows"), windows_subsystem = "windows")]

use tauri::{Manager, api::dialog::FileDialogBuilder, api::clipboard};

#[tauri::command]
async fn open_repo() -> Result<String, String> {
    let (tx, rx) = std::sync::mpsc::channel::<Option<std::path::PathBuf>>();
    FileDialogBuilder::new()
        .set_directory("/")
        .pick_folder(move |folder_path| {
            tx.send(folder_path).unwrap();
        });
    if let Ok(Some(path)) = rx.recv() {
        Ok(path.display().to_string())
    } else {
        Err("No folder selected".to_string())
    }
}

#[tauri::command]
async fn read_folder(folder_path: String, ignore_lines: Vec<String>) -> Result<Vec<String>, String> {
    use std::fs;
    use std::path::Path;
    fn walk(path: &Path, prefix: String, ignores: &[String], results: &mut Vec<String>) {
        if let Ok(entries) = path.read_dir() {
            for entry in entries.flatten() {
                let f_path = entry.path();
                let f_name = f_path.file_name().unwrap().to_string_lossy().to_string();
                let full_str = f_path.display().to_string();
                let should_ignore = ignores.iter().any(|regex| {
                    regex::Regex::new(regex).map_or(false, |re| re.is_match(&full_str))
                });
                if should_ignore { continue; }
                if f_path.is_dir() {
                    results.push(format!("{}{}/", prefix, f_name));
                    walk(&f_path, format!("{}  ", prefix), ignores, results);
                } else {
                    results.push(format!("{}{}", prefix, f_name));
                }
            }
        }
    }

    let mut result = Vec::new();
    walk(std::path::Path::new(&folder_path), "".into(), &ignore_lines, &mut result);
    Ok(result)
}

#[tauri::command]
async fn read_and_copy(folder_path: String, selected_files: Vec<String>, instructions: String) -> Result<String, String> {
    use std::fs;
    let mut final_text = String::new();
    for rel in selected_files {
        let full_path = format!("{}/{}", folder_path, rel.trim());
        if let Ok(content) = fs::read_to_string(&full_path) {
            final_text.push_str(&format!("\n--- {} ---\n{}", full_path, content));
        }
    }
    final_text.push_str("\n\nInstructions:\n");
    final_text.push_str(&instructions);
    clipboard::write_text(final_text).map_err(|e| e.to_string())?;
    Ok("Copied to clipboard!".into())
}

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![open_repo, read_folder, read_and_copy])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
