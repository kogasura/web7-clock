// Prevents additional console window on Windows in release
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use std::sync::Mutex;
use tauri::{
    image::Image,
    menu::{Menu, MenuItem, PredefinedMenuItem, Submenu},
    tray::TrayIconBuilder,
    webview::WebviewWindowBuilder,
    Manager, WebviewUrl, WindowEvent,
};

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Settings {
    clock_id: String,
    always_on_top: bool,
    #[serde(default)]
    opacity: f64,
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
            opacity: 0.0,
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

const OPACITY_PRESETS: &[(f64, &str)] = &[
    (0.0, "0% (Transparent)"),
    (0.25, "25%"),
    (0.5, "50%"),
    (0.75, "75%"),
    (1.0, "100% (Opaque)"),
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

/// Build JS to apply background opacity
fn opacity_js(opacity: f64) -> String {
    if opacity <= 0.0 {
        "document.body.style.setProperty('background', 'transparent', 'important'); \
         var cc = document.querySelector('.clock-container'); \
         if (cc) cc.style.setProperty('background', 'transparent', 'important');".to_string()
    } else {
        format!(
            "document.body.style.setProperty('background', 'rgba(0,0,0,{o})', 'important'); \
             var cc = document.querySelector('.clock-container'); \
             if (cc) cc.style.setProperty('background', 'rgba(0,0,0,{o})', 'important');",
            o = opacity
        )
    }
}

fn build_init_script(opacity: f64, clock_id: &str) -> String {
    let apply_opacity = if is_transparent_capable(clock_id) {
        opacity_js(opacity)
    } else {
        String::new()
    };

    format!(
        r#"
        function __desktopInit() {{
            var backLink = document.querySelector('.back-link');
            if (backLink) backLink.style.display = 'none';
            var fsBtn = document.querySelector('.fullscreen-btn');
            if (fsBtn) fsBtn.style.display = 'none';

            {apply_opacity}

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
        apply_opacity = apply_opacity
    )
}

// --- Window creation ---

fn create_clock_window(
    app: &tauri::AppHandle,
    clock_id: &str,
    opacity: f64,
    always_on_top: bool,
    width: f64,
    height: f64,
    x: Option<f64>,
    y: Option<f64>,
) -> Result<tauri::WebviewWindow, Box<dyn std::error::Error>> {
    let url_str = clock_url(clock_id);
    let url = WebviewUrl::App(url_str.into());
    let init_script = build_init_script(opacity, clock_id);

    let mut builder = WebviewWindowBuilder::new(app, "main", url)
        .title("Web7 Clock")
        .transparent(true)
        .decorations(false)
        .always_on_top(always_on_top)
        .resizable(true)
        .inner_size(width, height)
        .min_inner_size(200.0, 100.0)
        .skip_taskbar(false)
        .initialization_script(&init_script);

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
    current_opacity: f64,
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

    // Opacity submenu
    let opacity_submenu = {
        let submenu = Submenu::with_id(app, "opacity", "Transparency", true)?;
        for (value, label) in OPACITY_PRESETS {
            let prefix = if (*value - current_opacity).abs() < 0.01 { "● " } else { "  " };
            let item = MenuItem::with_id(
                app,
                format!("opacity_{}", (*value * 100.0) as u32),
                format!("{}{}", prefix, label),
                true,
                None::<&str>,
            )?;
            submenu.append(&item)?;
        }
        submenu
    };

    let always_on_top_item = MenuItem::with_id(
        app,
        "always_on_top",
        if always_on_top { "● Always on Top" } else { "  Always on Top" },
        true,
        None::<&str>,
    )?;
    let separator1 = PredefinedMenuItem::separator(app)?;
    let separator2 = PredefinedMenuItem::separator(app)?;
    let quit_item = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[
            &clock_submenu,
            &opacity_submenu,
            &separator1,
            &always_on_top_item,
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
            let opacity = s.opacity;
            drop(s);

            if let Some(window) = app.get_webview_window("main") {
                window.set_always_on_top(aot).ok();
            }
            rebuild_tray(app, &clock_id, aot, opacity);
            return;
        }

        // Handle opacity presets
        if let Some(pct) = menu_id_owned.strip_prefix("opacity_") {
            if let Ok(pct_val) = pct.parse::<u32>() {
                let new_opacity = pct_val as f64 / 100.0;
                let state = app.state::<AppState>();
                let mut s = state.settings.lock().unwrap();
                s.opacity = new_opacity;
                save_settings(&s);

                let clock_id = s.clock_id.clone();
                let aot = s.always_on_top;
                drop(s);

                if let Some(window) = app.get_webview_window("main") {
                    if is_transparent_capable(&clock_id) {
                        let js = opacity_js(new_opacity);
                        window.eval(&js).ok();
                    }
                }
                rebuild_tray(app, &clock_id, aot, new_opacity);
            }
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

            let opacity = s.opacity;
            let aot = s.always_on_top;
            let cid = clock_id.to_string();
            drop(s);

            if let Some(window) = app.get_webview_window("main") {
                let nav_js = format!("window.location.href = '/clocks/{}/index.html'", cid);
                window.eval(&nav_js).ok();

                // Re-apply opacity after navigation
                if is_transparent_capable(&cid) {
                    let win = window.clone();
                    let op = opacity;
                    std::thread::spawn(move || {
                        std::thread::sleep(std::time::Duration::from_millis(500));
                        let js = opacity_js(op);
                        win.eval(&js).ok();
                    });
                }
            }
            rebuild_tray(app, &cid, aot, opacity);
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
    let opacity = s.opacity;
    drop(s);

    if let Ok(menu) = build_clock_menu(window.app_handle(), &clock_id, aot, opacity) {
        window.popup_menu(&menu).ok();
    }
}

// --- Main ---

fn main() {
    let settings = load_settings();
    let initial_clock = settings.clock_id.clone();
    let initial_always_on_top = settings.always_on_top;
    let initial_opacity = settings.opacity;
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
                initial_opacity,
                initial_always_on_top,
                initial_width,
                initial_height,
                initial_x,
                initial_y,
            )?;

            let app_handle = app.handle().clone();
            build_tray(&app_handle, &initial_clock, initial_always_on_top, initial_opacity)?;

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
    opacity: f64,
) -> Result<(), Box<dyn std::error::Error>> {
    let menu = build_clock_menu(app, current_clock, always_on_top, opacity)?;

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

fn rebuild_tray(app: &tauri::AppHandle, current_clock: &str, always_on_top: bool, opacity: f64) {
    app.remove_tray_by_id(TRAY_ID);
    build_tray(app, current_clock, always_on_top, opacity).ok();
}
