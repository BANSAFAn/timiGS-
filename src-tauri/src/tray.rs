//! System tray module for TimiGS
//! Handles tray icon, right-click context menu, and left-click popup window.

use std::sync::atomic::{AtomicU64, Ordering};
use tauri::{
    image::Image,
    menu::{Menu, MenuItemBuilder, PredefinedMenuItem},
    tray::{MouseButton, TrayIconBuilder, TrayIconEvent},
    Manager,
};

/// Timestamp of when the tray popup was last shown (prevents hide race conditions)
static TRAY_LAST_SHOWN: AtomicU64 = AtomicU64::new(0);

/// Set up the system tray icon, context menu, and all event handlers.
pub fn setup(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    // ── Simple context menu: Show Window + Quit ──
    let show_window = MenuItemBuilder::with_id("show", "Open TimiGS").build(app)?;
    let sep = PredefinedMenuItem::separator(app)?;
    let quit = MenuItemBuilder::with_id("quit", "Quit").build(app)?;

    let menu = Menu::with_items(app, &[&show_window, &sep, &quit])?;

    // ── Build the tray icon ──
    let _tray = TrayIconBuilder::new()
        .icon(
            Image::from_bytes(include_bytes!("../icons/icon.png"))
                .expect("failed to load tray icon"),
        )
        .tooltip("TimiGS - Activity Tracker")
        .menu(&menu)
        .show_menu_on_left_click(false)
        .on_tray_icon_event(handle_tray_icon_event)
        .on_menu_event(handle_menu_event)
        .build(app)?;

    // Keep tray alive by storing in app state
    app.manage(_tray);

    println!("[Tray] System tray initialized successfully");
    Ok(())
}

fn handle_tray_icon_event(tray: &tauri::tray::TrayIcon, event: TrayIconEvent) {
    if let TrayIconEvent::Click {
        button: MouseButton::Left,
        rect,
        ..
    } = event
    {
        let app = tray.app_handle();
        if let Some(window) = app.get_webview_window("tray") {
            if window.is_visible().unwrap_or(false) {
                let _ = window.hide();
            } else {
                let w_width = 240.0;
                let w_height = 220.0;
                let (rect_x, rect_y) = match rect.position {
                    tauri::Position::Physical(p) => (p.x as f64, p.y as f64),
                    tauri::Position::Logical(l) => (l.x, l.y),
                };
                let rect_w = match rect.size {
                    tauri::Size::Physical(s) => s.width as f64,
                    tauri::Size::Logical(l) => l.width,
                };
                let mut x = rect_x + (rect_w / 2.0) - (w_width / 2.0);
                let mut y = rect_y - w_height;
                if x < 0.0 { x = 10.0; }
                if y < 0.0 { y = 10.0; }
                let _ = window.set_position(tauri::Position::Physical(tauri::PhysicalPosition {
                    x: x as i32,
                    y: y as i32,
                }));
                let _ = window.show();
                let _ = window.set_focus();
            }
        }
    }
}

/// Handle tray context menu item clicks
fn handle_menu_event(app: &tauri::AppHandle, event: tauri::menu::MenuEvent) {
    let id = event.id().as_ref();
    println!("[Tray] Menu event: {}", id);

    match id {
        "quit" => {
            println!("[Tray] Quitting application");
            app.exit(0);
        }
        "show" => {
            let app_clone = app.clone();
            std::thread::spawn(move || {
                show_main_window(&app_clone);
            });
        }
        _ => {
            println!("[Tray] Unknown menu event: {}", id);
        }
    }
}

/// Show and focus the main window (works even if minimized or hidden)
fn show_main_window(app: &tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.unminimize();
        let _ = window.set_focus();
        // Force focus on Windows by briefly setting always-on-top
        let _ = window.set_always_on_top(true);
        std::thread::sleep(std::time::Duration::from_millis(50));
        let _ = window.set_always_on_top(false);
    }
}

/// Handle tray popup window losing focus → auto-hide
pub fn handle_tray_focus_lost(window: &tauri::Window) {
    let win = window.clone();
    std::thread::spawn(move || {
        // Wait for any click events to finish
        std::thread::sleep(std::time::Duration::from_millis(300));

        let shown_at = TRAY_LAST_SHOWN.load(Ordering::SeqCst);
        let now = now_millis();

        // Only hide if the tray wasn't just shown (prevents race condition)
        if now.saturating_sub(shown_at) > 500 {
            let _ = win.hide();
        }
    });
}

fn now_millis() -> u64 {
    std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .unwrap_or_default()
        .as_millis() as u64
}
