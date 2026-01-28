// TimiGS - Activity Tracker
// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/

mod auth;
mod commands;
mod db;

#[cfg(desktop)]
mod discord;
mod drive;
mod icons;

mod picker;
mod tasks;

#[cfg(target_os = "windows")]
mod tracker;

#[cfg(target_os = "android")]
mod android_tracker;

#[cfg(desktop)]
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager, WindowEvent,
};

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
        .plugin(tauri_plugin_deep_link::init());

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
            if let Ok(quit_i) = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>) {
                if let Ok(show_i) =
                    MenuItem::with_id(app, "show", "Show Window", true, None::<&str>)
                {
                    if let Ok(menu) = Menu::with_items(app, &[&show_i, &quit_i]) {
                        let mut tray_builder = TrayIconBuilder::new()
                            .menu(&menu)
                            .show_menu_on_left_click(true)
                            .on_menu_event(|app, event| match event.id.as_ref() {
                                "quit" => {
                                    #[cfg(target_os = "windows")]
                                    tracker::stop_tracking();
                                    app.exit(0);
                                }
                                "show" => {
                                    if let Some(window) = app.get_webview_window("main") {
                                        let _ = window.show();
                                        let _ = window.set_focus();
                                    }
                                }
                                _ => {}
                            })
                            .on_tray_icon_event(|tray, event| {
                                if let tauri::tray::TrayIconEvent::DoubleClick { .. } = event {
                                    let app = tray.app_handle();
                                    if let Some(window) = app.get_webview_window("main") {
                                        let _ = window.show();
                                        let _ = window.set_focus();
                                    }
                                }
                            });

                        if let Some(icon) = app.default_window_icon() {
                            tray_builder = tray_builder.icon(icon.clone());
                        }

                        let _ = tray_builder.build(app);
                    }
                }
            }
        }

        Ok(())
    });

    // Desktop-only window event handling
    #[cfg(desktop)]
    let builder = builder.on_window_event(|window, event| {
        if let WindowEvent::CloseRequested { api, .. } = event {
            // Check if we should minimize to tray
            let should_minimize = db::get_settings().minimize_to_tray;

            if should_minimize {
                api.prevent_close();
                let _ = window.hide();
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
            #[cfg(target_os = "android")]
            commands::check_usage_permission,
            #[cfg(target_os = "android")]
            commands::request_usage_permission,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
