// TimiGS - Activity Tracker
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

mod auth;
mod commands;
mod db;
mod github_auth;
mod github_sync;

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
use tauri::{tray::TrayIconBuilder, Manager, WindowEvent};

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

        #[cfg(target_os = "android")]
        android_tracker::start_tracking();

        // Setup Tray Icon (desktop only)
        #[cfg(desktop)]
        {
            let _tray = TrayIconBuilder::new()
                .icon(
                    tauri::image::Image::from_bytes(include_bytes!("../icons/icon.png"))
                        .expect("failed to load tray icon"),
                )
                .tooltip("TimiGS")
                .show_menu_on_left_click(false)
                .on_tray_icon_event(|tray, event| {
                    if let tauri::tray::TrayIconEvent::Click {
                        button: tauri::tray::MouseButton::Left,
                        ..
                    } = event
                    {
                        let app = tray.app_handle();
                        if let Some(window) = app.get_webview_window("tray") {
                            // Toggle visibility
                            if window.is_visible().unwrap_or(false) {
                                let _ = window.hide();
                            } else {
                                // Position window near bottom-right (taskbar area)
                                use tauri::PhysicalPosition;

                                if let Ok(Some(monitor)) = window.primary_monitor() {
                                    let screen_size = monitor.size();
                                    let window_size =
                                        window.outer_size().unwrap_or(tauri::PhysicalSize {
                                            width: 180,
                                            height: 180,
                                        });

                                    // Position: bottom-right with margins for taskbar
                                    let margin = 10;
                                    let taskbar_height = 50; // Approximate taskbar height

                                    let x = screen_size.width as i32
                                        - window_size.width as i32
                                        - margin;
                                    let y = screen_size.height as i32
                                        - window_size.height as i32
                                        - taskbar_height;

                                    let _ = window.set_position(PhysicalPosition { x, y });
                                }

                                // Record the time we're showing the tray
                                TRAY_LAST_SHOWN.store(
                                    std::time::SystemTime::now()
                                        .duration_since(std::time::UNIX_EPOCH)
                                        .unwrap_or_default()
                                        .as_millis() as u64,
                                    std::sync::atomic::Ordering::SeqCst,
                                );

                                let _ = window.show();
                                let _ = window.set_focus();
                            }
                        }
                    }
                })
                .build(app);
        }

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
            commands::login_google,
            commands::exchange_google_code,
            commands::get_google_user,
            commands::backup_data,
            commands::restore_data,
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
            // Multi-Account
            commands::get_cloud_accounts,
            commands::remove_cloud_account,
            commands::create_drive_folder,
            commands::list_drive_folders,
            commands::upload_file,
            commands::upload_file_with_data,
            commands::download_file,
            commands::save_local_file,
            commands::list_drive_files,
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
