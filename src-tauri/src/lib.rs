//! The app shell: it only serves the bundled game (`dist/`) in a full-screen web view.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .run(tauri::generate_context!())
    .expect("error while starting Glow Below");
}
