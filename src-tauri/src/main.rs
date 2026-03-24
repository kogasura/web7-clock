// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{
    image::Image,
    menu::{CheckMenuItem, Menu, MenuItem, PredefinedMenuItem, Submenu},
    tray::TrayIconBuilder,
    webview::WebviewWindowBuilder,
    Manager, WebviewUrl, WindowEvent,
};
use tauri::utils::config::Color;

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Settings {
    clock_id: String,
    always_on_top: bool,
    transparent: bool,
    width: f64,
    height: f64,
    x: Option<f64>,
    y: Option<f64>,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            clock_id: "neon".to_string(),
            always_on_top: true,
            transparent: true,
            width: 520.0,
            height: 240.0,
            x: None,
            y: None,
        }
    }
}

struct AppState {
    settings: Mutex<Settings>,
}

const CLOCKS: &[(&str, &str, bool)] = &[
    ("neon", "NEON", true),
    ("minimal", "MINIMAL", true),
    ("retro", "RETRO", true),
    ("matrix", "MATRIX", true),
    ("gradient", "GRADIENT", true),
    ("flip", "FLIP", true),
    ("cyber", "CYBER", true),
    ("terminal", "TERMINAL", true),
    ("glass", "GLASS", true),
    ("forest", "FOREST", false),
    ("fireplace", "FIREPLACE", false),
    ("ocean", "OCEAN", false),
];

fn settings_path() -> PathBuf {
    let dir = dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("web7-clock");
    fs::create_dir_all(&dir).ok();
    dir.join("settings.json")
}

fn load_settings() -> Settings {
    let path = settings_path();
    if path.exists() {
        fs::read_to_string(&path)
            .ok()
            .and_then(|s| serde_json::from_str(&s).ok())
            .unwrap_or_default()
    } else {
        Settings::default()
    }
}

fn save_settings(settings: &Settings) {
    let path = settings_path();
    if let Ok(json) = serde_json::to_string_pretty(settings) {
        fs::write(path, json).ok();
    }
}

fn clock_url(clock_id: &str) -> String {
    format!("clocks/{}/index.html", clock_id)
}

fn is_transparent_capable(clock_id: &str) -> bool {
    CLOCKS
        .iter()
        .find(|(id, _, _)| *id == clock_id)
        .map(|(_, _, t)| *t)
        .unwrap_or(false)
}

fn build_init_script(transparent: bool, clock_id: &str) -> String {
    let transparent_css = if transparent && is_transparent_capable(clock_id) {
        "html, body { background: transparent !important; } .clock-container { background: transparent !important; }"
    } else {
        ""
    };

    format!(
        r#"
        function __desktopInit() {{
            var prev = document.getElementById('desktop-override');
            if (prev) prev.remove();

            var backLink = document.querySelector('.back-link');
            if (backLink) backLink.style.display = 'none';
            var fsBtn = document.querySelector('.fullscreen-btn');
            if (fsBtn) fsBtn.style.display = 'none';

            var style = document.createElement('style');
            style.id = 'desktop-override';
            style.textContent = `{transparent_css}`;
            document.head.appendChild(style);

            var container = document.querySelector('.clock-container');
            if (container) {{
                container.style.cursor = 'move';
                container.addEventListener('mousedown', function(e) {{
                    if (e.button === 0) {{
                        e.preventDefault();
                        try {{
                            if (window.__TAURI_INTERNALS__) {{
                                window.__TAURI_INTERNALS__.invoke('start_drag');
                            }}
                        }} catch(err) {{}}
                    }}
                }});
            }}

            document.addEventListener('contextmenu', function(e) {{
                e.preventDefault();
                try {{
                    if (window.__TAURI_INTERNALS__) {{
                        window.__TAURI_INTERNALS__.invoke('show_context_menu');
                    }}
                }} catch(err) {{}}
            }});
        }}

        if (document.readyState === 'loading') {{
            document.addEventListener('DOMContentLoaded', __desktopInit);
        }} else {{
            __desktopInit();
        }}
        "#,
        transparent_css = transparent_css
    )
}

// --- Window creation ---

fn create_clock_window(
    app: &tauri::AppHandle,
    clock_id: &str,
    transparent: bool,
    always_on_top: bool,
    width: f64,
    height: f64,
    x: Option<f64>,
    y: Option<f64>,
) -> Result<tauri::WebviewWindow, Box<dyn std::error::Error>> {
    let url_str = clock_url(clock_id);
    let url = WebviewUrl::App(url_str.into());
    let init_script = build_init_script(transparent, clock_id);

    let mut builder = WebviewWindowBuilder::new(app, "main", url)
        .title("Web7 Clock")
        .transparent(true)
        .decorations(false)
        .always_on_top(always_on_top)
        .resizable(true)
        .inner_size(width, height)
        .min_inner_size(200.0, 100.0)
        .skip_taskbar(false)
        .initialization_script(&init_script)
        .background_color(Color(0, 0, 0, 0));

    if let (Some(x), Some(y)) = (x, y) {
        builder = builder.position(x, y);
    }

    Ok(builder.build()?)
}

// --- Shared menu builder ---

fn build_clock_menu(
    app: &tauri::AppHandle,
    current_clock: &str,
    always_on_top: bool,
    transparent: bool,
) -> Result<Menu<tauri::Wry>, Box<dyn std::error::Error>> {
    let mut clock_items: Vec<MenuItem<tauri::Wry>> = Vec::new();
    for (id, name, _) in CLOCKS {
        let prefix = if *id == current_clock { "● " } else { "  " };
        let item = MenuItem::with_id(
            app,
            format!("clock_{}", id),
            format!("{}{}", prefix, name),
            true,
            None::<&str>,
        )?;
        clock_items.push(item);
    }

    let clock_submenu = {
        let submenu = Submenu::with_id(app, "clocks", "Clock Design", true)?;
        for item in &clock_items {
            submenu.append(item)?;
        }
        submenu
    };

    let always_on_top_item =
        CheckMenuItem::with_id(app, "always_on_top", "Always on Top", true, always_on_top, None::<&str>)?;
    let transparent_item =
        CheckMenuItem::with_id(app, "transparent", "Transparent", true, transparent, None::<&str>)?;
    let separator1 = PredefinedMenuItem::separator(app)?;
    let separator2 = PredefinedMenuItem::separator(app)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[
            &clock_submenu,
            &separator1,
            &always_on_top_item,
            &transparent_item,
            &separator2,
            &quit_item,
        ],
    )?;

    Ok(menu)
}

// --- Shared menu action handler ---

fn handle_menu_action(app: &tauri::AppHandle, menu_id: &str) {
    if menu_id == "quit" {
        app.exit(0);
        return;
    }

    // Defer all heavy work to avoid deadlock when called from popup_menu context
    let app_clone = app.clone();
    let menu_id_owned = menu_id.to_string();
    std::thread::spawn(move || {
        std::thread::sleep(std::time::Duration::from_millis(150));

        let app = &app_clone;

        if menu_id_owned == "always_on_top" {
            let state = app.state::<AppState>();
            let mut s = state.settings.lock().unwrap();
            s.always_on_top = !s.always_on_top;
            save_settings(&s);

            let clock_id = s.clock_id.clone();
            let aot = s.always_on_top;
            let trans = s.transparent;
            drop(s);

            if let Some(window) = app.get_webview_window("main") {
                window.set_always_on_top(aot).ok();
            }
            rebuild_tray(app, &clock_id, aot, trans);
            return;
        }

        if menu_id_owned == "transparent" {
            let state = app.state::<AppState>();
            let mut s = state.settings.lock().unwrap();
            s.transparent = !s.transparent;
            save_settings(&s);

            let clock_id = s.clock_id.clone();
            let trans = s.transparent;
            let aot = s.always_on_top;
            drop(s);

            if let Some(window) = app.get_webview_window("main") {
                let js = build_init_script(trans, &clock_id);
                window.eval(&js).ok();
            }
            rebuild_tray(app, &clock_id, aot, trans);
            return;
        }

        if let Some(clock_id) = menu_id_owned.strip_prefix("clock_") {
            // Validate clock_id against known list
            if !CLOCKS.iter().any(|(id, _, _)| *id == clock_id) {
                return;
            }
            let state = app.state::<AppState>();
            let mut s = state.settings.lock().unwrap();
            s.clock_id = clock_id.to_string();
            save_settings(&s);

            let transparent = s.transparent;
            let aot = s.always_on_top;
            let cid = clock_id.to_string();
            drop(s);

            if let Some(window) = app.get_webview_window("main") {
                let js = format!("window.location.href = '/clocks/{}/index.html'", cid);
                window.eval(&js).ok();
            }
            rebuild_tray(app, &cid, aot, transparent);
        }
    });
}

// --- Tauri commands ---

#[tauri::command]
fn start_drag(window: tauri::WebviewWindow) {
    window.start_dragging().ok();
}

#[tauri::command]
fn show_context_menu(window: tauri::WebviewWindow, state: tauri::State<'_, AppState>) {
    let s = state.settings.lock().unwrap();
    let clock_id = s.clock_id.clone();
    let aot = s.always_on_top;
    let trans = s.transparent;
    drop(s);

    if let Ok(menu) = build_clock_menu(window.app_handle(), &clock_id, aot, trans) {
        window.popup_menu(&menu).ok();
    }
}

// --- Main ---

fn main() {
    let settings = load_settings();
    let initial_clock = settings.clock_id.clone();
    let initial_always_on_top = settings.always_on_top;
    let initial_transparent = settings.transparent;
    let initial_width = settings.width;
    let initial_height = settings.height;
    let initial_x = settings.x;
    let initial_y = settings.y;

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![start_drag, show_context_menu])
        .manage(AppState {
            settings: Mutex::new(settings),
        })
        .on_menu_event(|app, event| {
            handle_menu_action(app, event.id().as_ref());
        })
        .setup(move |app| {
            create_clock_window(
                app.handle(),
                &initial_clock,
                initial_transparent,
                initial_always_on_top,
                initial_width,
                initial_height,
                initial_x,
                initial_y,
            )?;

            let app_handle = app.handle().clone();
            build_tray(&app_handle, &initial_clock, initial_always_on_top, initial_transparent)?;

            Ok(())
        })
        .on_window_event(|window, event| {
            match event {
                WindowEvent::Moved(pos) => {
                    let state = window.state::<AppState>();
                    let mut s = state.settings.lock().unwrap();
                    s.x = Some(pos.x as f64);
                    s.y = Some(pos.y as f64);
                    save_settings(&s);
                }
                WindowEvent::Resized(size) => {
                    let state = window.state::<AppState>();
                    let mut s = state.settings.lock().unwrap();
                    s.width = size.width as f64;
                    s.height = size.height as f64;
                    save_settings(&s);
                }
                _ => {}
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// --- Tray ---

const TRAY_ID: &str = "main-tray";

fn build_tray(
    app: &tauri::AppHandle,
    current_clock: &str,
    always_on_top: bool,
    transparent: bool,
) -> Result<(), Box<dyn std::error::Error>> {
    let menu = build_clock_menu(app, current_clock, always_on_top, transparent)?;

    let icon_bytes = include_bytes!("../icons/icon.png");
    let icon = Image::from_bytes(icon_bytes)?;

    let app_handle = app.clone();
    TrayIconBuilder::with_id(TRAY_ID)
        .icon(icon)
        .menu(&menu)
        .tooltip("Web7 Clock")
        .on_menu_event(move |tray_app, event| {
            handle_menu_action(tray_app, event.id().as_ref());
        })
        .build(&app_handle)?;

    Ok(())
}

fn rebuild_tray(app: &tauri::AppHandle, current_clock: &str, always_on_top: bool, transparent: bool) {
    // Remove old tray, then create new one
    app.remove_tray_by_id(TRAY_ID);
    build_tray(app, current_clock, always_on_top, transparent).ok();
}
