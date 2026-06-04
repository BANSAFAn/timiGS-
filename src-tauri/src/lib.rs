// TimiGS - Activity Tracker
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

mod auth;
mod commands;
mod db;
mod music;

mod drive;
mod icons;

#[cfg(desktop)]
mod tray;

mod focus;
mod notifications;
mod p2p;
mod picker;
mod tasks;
mod timeout;
mod timer;

#[cfg(any(target_os = "windows", target_os = "linux"))]
mod tracker;

#[cfg(desktop)]
use tauri::WindowEvent;

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
                "Failed to initialize database: {}\n\nPlease check permissions.\n\nDatabase path: {:?}",
                e,
                db::get_db_path()
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
        ))
        .plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
            use tauri::Manager;
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.show();
                let _ = window.unminimize();
                let _ = window.set_focus();
                
                // Force focus on Windows
                let _ = window.set_always_on_top(true);
                let _ = window.set_always_on_top(false);
            }
            
            // Check language and send notification
            let lang = db::get_settings().language;
            let (title, body) = if lang == "uk" {
                ("TimiGS вже запущено", "Програма вже працює. Перевірте екран або системний трей.")
            } else {
                ("TimiGS is already running", "The application is already active. Checking screen or system tray.")
            };
            
            notifications::send_notification(app, title, body);
        }));

    let builder = builder.setup(|app| {
        #[cfg(target_os = "ios")]
        let _ = app;

        // Handle CLI arguments (desktop only)
        #[cfg(desktop)]
        {
            use tauri_plugin_cli::CliExt;
            use tauri::Manager;
            
            let is_autostart = std::env::args().any(|arg| arg == "--minimized" || arg == "-m");
            let mut start_minimized = is_autostart;
            
            if let Ok(matches) = app.cli().matches() {
                if let Some(arg_data) = matches.args.get("minimized") {
                    if arg_data.value.as_bool().unwrap_or(false) || arg_data.occurrences > 0 {
                        start_minimized = true;
                    }
                }
            }
            
            if start_minimized {
                println!("TimiGS: Starting in autostart mode (minimized to tray)");
                let app_handle = app.handle().clone();
                std::thread::spawn(move || {
                    std::thread::sleep(std::time::Duration::from_millis(500));
                    let _ = notifications::send_notification(
                        &app_handle,
                        "TimiGS Started",
                        "Activity tracking is now running in the background"
                    );
                });
            } else {
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.show();
                }
            }
        }

        // Start tracking on app launch (only on supported platforms)
        #[cfg(target_os = "windows")]
        {
            println!("Starting activity tracking for Windows...");
            tracker::start_tracking_with_app_handle(app.handle().clone());
        }

        #[cfg(target_os = "linux")]
        {
            println!("Starting activity tracking for Linux...");
            crate::tracker::start_tracking_with_app_handle(app.handle().clone());
        }

        #[cfg(target_os = "windows")]
        timeout::init_keyboard_hook();

        // Setup Tray Icon (desktop only)
        #[cfg(desktop)]
        {
            if let Err(e) = crate::tray::setup(app) {
                eprintln!("Failed to setup tray: {}", e);
            }
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
            if window.label() == "main" && should_minimize {
                api.prevent_close();
                let _ = window.hide();
            }
        } else if let WindowEvent::Focused(focused) = event {
            // Auto-hide tray popup when it loses focus
            if window.label() == "tray" && !*focused {
                crate::tray::handle_tray_focus_lost(window);
            }
        }
    });

    builder
        .invoke_handler(tauri::generate_handler![
            commands::get_current_activity,
            commands::get_current_session,
            commands::get_today_activity,
            commands::get_today_summary,
            commands::get_summary_by_date_cmd,
            commands::get_computer_name,
            commands::get_music_today_summary,
            commands::get_total_music_time_today,
            commands::get_current_music_session,
            commands::get_music_activity_range,
            commands::get_weekly_stats,
            commands::get_activity_range,
            commands::get_settings,
            commands::save_settings,
            commands::get_setting_cmd,
            commands::save_setting_cmd,
            commands::get_excluded_processes_cmd,
            commands::add_excluded_process_cmd,
            commands::remove_excluded_process_cmd,
            commands::start_tracking,
            commands::stop_tracking,
            commands::is_tracking,
            commands::shutdown_pc,
            commands::shutdown_pc,
            commands::get_app_icon,
            commands::get_website_favicon,
            commands::get_desktop_sources,
            // Platform detection
            commands::get_platform,
            commands::get_device_stats,
            commands::get_db_path,
            // P2P Sync
            commands::discover_devices,
            commands::connect_to_device,
            commands::get_device_info,
            commands::get_remote_processes,
            tasks::create_task_cmd,
            tasks::get_tasks_cmd,
            tasks::update_task_status_cmd,
            tasks::delete_task_cmd,
            tasks::get_recent_apps_cmd,
            tasks::get_task_progress_cmd,
            commands::show_main_window_cmd,
            commands::show_tray_window_cmd,
            commands::emit_navigate_cmd,
            commands::quit_app_cmd,
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
            commands::save_timeout_schedule_cmd,
            // Project Boards
            commands::create_project_board,
            commands::get_project_boards,
            commands::delete_project_board,
            commands::get_board_items_cmd,
            commands::populate_board_cmd,
            // Project Tasks
            commands::add_project_task_cmd,
            commands::get_project_tasks_cmd,
            commands::update_project_task_status_cmd,
            commands::delete_project_task_cmd,
            // Data Management
            commands::reset_all_data_cmd,
            commands::export_data_csv_cmd,
            commands::export_data_html_cmd,
            commands::export_data_json_cmd,
            commands::import_data_cmd,
            commands::export_data_markdown_cmd,
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
            // Notifications
            notifications::send_notification_cmd,
            // Coding Tracker
            commands::get_today_coding_sessions,
            commands::get_coding_sessions_range_cmd,
            commands::get_coding_stats_today,
            commands::get_coding_project_stats_today,
            commands::get_total_coding_time_today,
            commands::get_total_ai_coding_time_today,
            commands::get_current_coding_session,
            commands::get_current_media_info,
            commands::lookup_app_info_online,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
