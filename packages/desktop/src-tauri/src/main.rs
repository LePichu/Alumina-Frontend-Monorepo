// No console window behind the app in a Windows release build.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::collections::HashSet;
use std::path::PathBuf;
use std::sync::Mutex;

use tauri::ipc::Response;
use tauri::{AppHandle, DragDropEvent, Manager, State, WindowEvent};
use tauri_plugin_dialog::DialogExt;

/// The files the person has chosen — dropped on the window, or picked in its
/// file picker: the only ones the page may read.
///
/// A page in WebKitGTK is no longer handed the files in a drop at all —
/// `dataTransfer.files` comes back empty (WebKit bugs 320301, 323277, since the
/// fix for CVE-2025-13947) — so the window takes the drop itself, and the page,
/// told the paths, asks for each file's bytes here. The picker is the window's
/// too (`pick_files`), so what it hands back is read the same way. Asking for
/// any other path is refused: a file is readable because someone chose it, and
/// for no other reason.
#[derive(Default)]
struct Chosen(Mutex<HashSet<PathBuf>>);

impl Chosen {
    fn grant(&self, paths: impl IntoIterator<Item = PathBuf>) {
        if let Ok(mut known) = self.0.lock() {
            known.extend(paths);
        }
    }
}

/// The bytes of a file that was chosen, unaltered.
#[tauri::command]
fn read_chosen(path: PathBuf, chosen: State<'_, Chosen>) -> Result<Response, String> {
    let known = chosen
        .0
        .lock()
        .map_err(|_| "the list of chosen files is unavailable".to_string())?
        .contains(&path);
    if !known {
        return Err(format!("{} was not chosen", path.display()));
    }
    std::fs::read(&path)
        .map(Response::new)
        .map_err(|error| format!("{}: {error}", path.display()))
}

/// Asks for files with the desktop's own picker — through the XDG desktop
/// portal, so GNOME's or KDE's own dialog — and grants the page those files.
/// Nothing, if the picker was dismissed.
#[tauri::command]
async fn pick_files(
    app: AppHandle,
    label: String,
    extensions: Vec<String>,
    multiple: bool,
) -> Result<Vec<PathBuf>, String> {
    let handle = app.clone();
    let picked = tauri::async_runtime::spawn_blocking(move || {
        let endings: Vec<&str> = extensions.iter().map(String::as_str).collect();
        let mut picker = handle.dialog().file().add_filter(label, &endings);
        if let Some(window) = handle.get_webview_window("main") {
            picker = picker.set_parent(&window);
        }
        if multiple {
            picker.blocking_pick_files()
        } else {
            picker.blocking_pick_file().map(|file| vec![file])
        }
    })
    .await
    .map_err(|error| error.to_string())?;

    let paths: Vec<PathBuf> = picked
        .unwrap_or_default()
        .into_iter()
        .filter_map(|file| file.into_path().ok())
        .collect();
    app.state::<Chosen>().grant(paths.iter().cloned());
    Ok(paths)
}

/// One window, framed by the page rather than by the system: `decorations` is
/// off in tauri.conf.json, and the slicer's `AppShell` bar is the title bar —
/// its buttons and its drag reach the window through `@tauri-apps/api`.
fn main() {
    tauri::Builder::default()
        // How the page reaches mica in a build: see lib/mica.ts in the slicer.
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(Chosen::default())
        // Heard here before the page hears of the drop, so the paths are known
        // by the time it asks for them.
        .on_window_event(|window, event| {
            if let WindowEvent::DragDrop(DragDropEvent::Drop { paths, .. }) = event {
                window.state::<Chosen>().grant(paths.iter().cloned());
            }
        })
        .invoke_handler(tauri::generate_handler![read_chosen, pick_files])
        .run(tauri::generate_context!())
        .expect("the desktop app failed to start");
}
