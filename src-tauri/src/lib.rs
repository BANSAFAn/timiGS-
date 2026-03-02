// TimiGS - Activity Tracker
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

mod auth;
mod commands;
mod db;
mod github_auth;
mod github_sync;
mod music;

#[cfg(desktop)]
mod discord;
mod drive;
mod icons;

mod focus;
mod p2p;
mod picker;
mod tasks;
mod timeout;
mod timer;

#[cfg(target_os = "windows")]
mod tracker;

#[cfg(target_os = "android")]
mod android_tracker;

#[cfg(desktop)]
use tauri::{tray::TrayIconBuilder, Manager, Emitter, WindowEvent};

#[cfg(desktop)]
static TRAY_LAST_SHOWN: std::sync::atomic::AtomicU64 = std::sync::atomic::AtomicU64::new(0);

#[cfg(desktop)]
use tauri_plugin_autostart::MacosLauncher;

#[cfg(target_os = "windows")]
use windows::core::PCWSTR;
#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::{MessageBoxW, MB_ICONERROR, MB_OK};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // Initialize database
    if let Err(e) = db::init_database() {
        eprintln!("Failed to initialize database: {}", e);
        #[cfg(target_os = "windows")]
        unsafe {
            let msg = format!(
                "Failed to initialize database: {}\n\nPlease check permissions.",
                e
            );
            let wide_msg: Vec<u16> = msg.encode_utf16().chain(std::iter::once(0)).collect();
            let title: Vec<u16> = "TimiGS Error"
                .encode_utf16()
                .chain(std::iter::once(0))
                .collect();
            MessageBoxW(
                None,
                PCWSTR(wide_msg.as_ptr()),
                PCWSTR(title.as_ptr()),
                MB_OK | MB_ICONERROR,
            );
        }
    }

    // Initialize music directory
    if let Err(e) = music::init_music_dir(&tauri::AppHandle::from(
        tauri::Builder::default()
            .build(tauri::generate_context!())
            .expect("failed")
            .handle()
            .clone(),
    )) {
        println!("Failed to init music dir: {}", e);
        // We'll ignore the error here since it will be properly handled inside the builder setup later.
    }

    let builder = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init());

    // Desktop-only plugins
    #[cfg(desktop)]
    let builder = builder
        .plugin(tauri_plugin_cli::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            MacosLauncher::LaunchAgent,
            Some(vec!["--minimized"]),
        ));

    let builder = builder.setup(|app| {
        #[cfg(any(target_os = "android", target_os = "ios"))]
        let _ = app;

        // Start tracking on app launch (only on desktop)
        #[cfg(target_os = "windows")]
        tracker::start_tracking();

        #[cfg(target_os = "windows")]
        timeout::init_keyboard_hook();

        #[cfg(target_os = "android")]
        android_tracker::start_tracking();

        // Setup Tray Icon (desktop only)
        #[cfg(desktop)]
        {
            use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};

            // Navigation items
            let dashboard_mi = MenuItem::with_id(app, "nav_dashboard", "🏠 Dashboard", true, None::<&str>).unwrap();
            let timeline_mi = MenuItem::with_id(app, "nav_timeline", "📊 Timeline", true, None::<&str>).unwrap();
            let tools_mi = MenuItem::with_id(app, "nav_tools", "🛠️ Tools", true, None::<&str>).unwrap();
            let analytics_mi = MenuItem::with_id(app, "nav_analytics", "📈 Analytics", true, None::<&str>).unwrap();

            // Tracking toggle
            #[cfg(target_os = "windows")]
            let is_tracking = crate::tracker::is_tracking();
            #[cfg(not(target_os = "windows"))]
            let is_tracking = false;
            let tracking_label = if is_tracking { "⏹️ Stop Tracking" } else { "▶️ Start Tracking" };
            let tracking_mi = MenuItem::with_id(app, "toggle_tracking", tracking_label, true, None::<&str>).unwrap();

            // System items
            let show_mi = MenuItem::with_id(app, "show", "🖥️ Show Window", true, None::<&str>).unwrap();
            let separator_mi = PredefinedMenuItem::separator(app).unwrap();
            let quit_mi = MenuItem::with_id(app, "quit", "❌ Quit TimiGS", true, None::<&str>).unwrap();

            let tray_menu = Menu::with_items(app, &[
                &dashboard_mi,
                &timeline_mi,
                &tools_mi,
                &analytics_mi,
                &separator_mi,
                &tracking_mi,
                &separator_mi,
                &show_mi,
                &quit_mi,
            ]).unwrap();

            let tray = TrayIconBuilder::new()
                .icon(
                    tauri::image::Image::from_bytes(include_bytes!("../icons/icon.png"))
                        .expect("failed to load tray icon"),
                )
                .tooltip("TimiGS")
                .menu(&tray_menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| {
                    match event.id.as_ref() {
                        "nav_dashboard" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                                let _ = app.emit("navigate", "/");
                            }
                        }
                        "nav_timeline" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                                let _ = app.emit("navigate", "/timeline");
                            }
                        }
                        "nav_tools" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                                let _ = app.emit("navigate", "/tools");
                            }
                        }
                        "nav_analytics" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                                let _ = app.emit("navigate", "/analytics");
                            }
                        }
                        "toggle_tracking" => {
                            #[cfg(target_os = "windows")]
                            {
                                if crate::tracker::is_tracking() {
                                    crate::tracker::stop_tracking();
                                } else {
                                    crate::tracker::start_tracking();
                                }
                            }
                        }
                        "show" => {
                            if let Some(window) = app.get_webview_window("main") {
                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                        "quit" => {
                            let _ = app.exit(0);
                        }
                        _ => {}
                    }
                })
                .build(app)?;

            // Store tray in app state to prevent it from being dropped
            app.manage(tray);
        }

        let _ = music::init_music_dir(app.handle());
        music::load_music_paths(app.handle());

        // Start auto-export timer
        std::thread::spawn(move || {
            loop {
                std::thread::sleep(std::time::Duration::from_secs(3600)); // Check every hour
                let _ = db::auto_export_if_needed();
            }
        });

        Ok(())
    });

    // Desktop-only window event handling
    #[cfg(desktop)]
    let builder = builder.on_window_event(|window, event| {
        if let WindowEvent::CloseRequested { api, .. } = event {
            // Check if we should minimize to tray
            let should_minimize = db::get_settings().minimize_to_tray;
            // Check if main window
            if window.label() == "main" && should_minimize {
                api.prevent_close();
                let _ = window.hide();
            }
        } else if let WindowEvent::Focused(focused) = event {
            // Hide tray when it loses focus (user clicks elsewhere)
            if window.label() == "tray" && !*focused {
                let window_clone = window.clone();
                std::thread::spawn(move || {
                    // Wait a bit before hiding
                    std::thread::sleep(std::time::Duration::from_millis(200));

                    // Don't hide if the tray was just shown (prevents race condition)
                    let shown_at = TRAY_LAST_SHOWN.load(std::sync::atomic::Ordering::SeqCst);
                    let now = std::time::SystemTime::now()
                        .duration_since(std::time::UNIX_EPOCH)
                        .unwrap_or_default()
                        .as_millis() as u64;

                    if now.saturating_sub(shown_at) > 300 {
                        let _ = window_clone.hide();
                    }
                });
            }
        }
    });

    builder
        .invoke_handler(tauri::generate_handler![
            commands::get_current_activity,
            commands::get_current_session,
            commands::get_today_activity,
            commands::get_today_summary,
            commands::get_weekly_stats,
            commands::get_activity_range,
            commands::get_settings,
            commands::save_settings,
            commands::get_setting_cmd,
            commands::save_setting_cmd,
            commands::start_tracking,
            commands::stop_tracking,
            commands::is_tracking,
            commands::shutdown_pc,
            commands::shutdown_pc,
            commands::get_app_icon,
            commands::get_desktop_sources,
            tasks::create_task_cmd,
            tasks::get_tasks_cmd,
            tasks::update_task_status_cmd,
            tasks::delete_task_cmd,
            tasks::get_recent_apps_cmd,
            tasks::get_task_progress_cmd,
            commands::show_main_window_cmd,
            commands::emit_navigate_cmd,
            commands::quit_app_cmd,
            #[cfg(target_os = "android")]
            commands::check_usage_permission,
            #[cfg(target_os = "android")]
            commands::request_usage_permission,
            commands::get_timer_status_cmd,
            // P2P Transfer
            commands::start_p2p_server,
            commands::stop_p2p_server,
            commands::get_local_ip,
            commands::send_p2p_file,
            // Focus Mode
            commands::start_focus_cmd,
            commands::stop_focus_cmd,
            commands::get_focus_status_cmd,
            // Time OUT
            commands::start_timeout_cmd,
            commands::stop_timeout_cmd,
            commands::get_timeout_status_cmd,
            // GitHub OAuth
            commands::login_github,
            commands::exchange_github_code,
            commands::get_github_account_cmd,
            commands::remove_github_account_cmd,
            // Project Boards
            commands::create_project_board,
            commands::get_project_boards,
            commands::delete_project_board,
            commands::get_board_items_cmd,
            commands::populate_board_cmd,
            commands::sync_board_github_cmd,
            // Project Tasks
            commands::add_project_task_cmd,
            commands::get_project_tasks_cmd,
            commands::update_project_task_status_cmd,
            commands::delete_project_task_cmd,
            // Data Management
            commands::reset_all_data_cmd,
            commands::export_data_csv_cmd,
            commands::export_data_html_cmd,
            commands::save_auto_export_settings_cmd,
            commands::get_auto_export_settings_cmd,
            // Music
            commands::get_music_files_cmd,
            commands::add_music_file_cmd,
            commands::delete_music_file_cmd,
            commands::open_music_folder_cmd,
            // Music Playback
            commands::play_music_cmd,
            commands::pause_music_cmd,
            commands::resume_music_cmd,
            commands::stop_music_cmd,
            commands::get_music_status_cmd,
            commands::set_music_volume_cmd,
            commands::toggle_music_loop_cmd,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
