//! Tauri IPC commands

use crate::db;
use tauri::Manager;
use tauri::{command, AppHandle, Window};

#[cfg(target_os = "windows")]
use crate::tracker;

#[cfg(target_os = "android")]
use crate::android_tracker as tracker;

use tauri::command;

#[command]
#[cfg(any(target_os = "windows", target_os = "android"))]
pub fn get_current_activity() -> Option<tracker::ActiveWindow> {
    tracker::get_current_active()
}

#[command]
#[cfg(not(any(target_os = "windows", target_os = "android")))]
pub fn get_current_activity() -> Option<()> {
    None
}

#[command]
#[cfg(any(target_os = "windows", target_os = "android"))]
pub fn get_current_session() -> Option<tracker::CurrentSession> {
    tracker::get_current_session()
}

#[command]
#[cfg(not(any(target_os = "windows", target_os = "android")))]
pub fn get_current_session() -> Option<()> {
    None
}

#[command]
pub fn get_today_activity() -> Vec<db::ActivitySession> {
    db::get_today_sessions().unwrap_or_default()
}

#[command]
pub fn get_today_summary() -> Vec<db::AppUsageSummary> {
    db::get_today_summary().unwrap_or_default()
}

#[command]
pub fn get_weekly_stats() -> Vec<db::DailyStats> {
    db::get_weekly_stats().unwrap_or_default()
}

#[command]
pub fn get_activity_range(from: String, to: String) -> Vec<db::ActivitySession> {
    use chrono::NaiveDate;

    let from_date = NaiveDate::parse_from_str(&from, "%Y-%m-%d").ok();
    let to_date = NaiveDate::parse_from_str(&to, "%Y-%m-%d").ok();

    if let (Some(f), Some(t)) = (from_date, to_date) {
        db::get_sessions_range(f, t).unwrap_or_default()
    } else {
        vec![]
    }
}

#[command]
pub fn get_settings() -> db::Settings {
    db::get_settings()
}

#[command]
pub fn save_settings(app: tauri::AppHandle, settings: db::Settings) -> Result<(), String> {
    // Handle autostart (desktop only)
    #[cfg(desktop)]
    {
        use tauri_plugin_autostart::ManagerExt;
        if settings.autostart {
            let _ = app.autolaunch().enable();
        } else {
            let _ = app.autolaunch().disable();
        }
    }

    // Suppress unused variable warning on mobile
    #[cfg(mobile)]
    let _ = &app;

    db::save_settings(&settings).map_err(|e| e.to_string())
}

#[command]
pub fn get_setting_cmd(key: String) -> Option<String> {
    db::get_setting(&key)
}

#[command]
pub fn save_setting_cmd(key: String, value: String) -> Result<(), String> {
    db::save_setting(&key, &value).map_err(|e| e.to_string())
}

#[command]
#[cfg(any(target_os = "windows", target_os = "android"))]
pub fn start_tracking() {
    tracker::start_tracking();
}

#[command]
#[cfg(not(any(target_os = "windows", target_os = "android")))]
pub fn start_tracking() {
    // No-op on unsupported platforms
}

#[command]
#[cfg(any(target_os = "windows", target_os = "android"))]
pub fn stop_tracking() {
    tracker::stop_tracking();
}

#[command]
#[cfg(not(any(target_os = "windows", target_os = "android")))]
pub fn stop_tracking() {
    // No-op on unsupported platforms
}

#[command]
#[cfg(any(target_os = "windows", target_os = "android"))]
pub fn is_tracking() -> bool {
    tracker::is_tracking()
}

#[command]
#[cfg(not(any(target_os = "windows", target_os = "android")))]
pub fn is_tracking() -> bool {
    false
}

#[command]
#[cfg(target_os = "android")]
pub fn check_usage_permission() -> bool {
    tracker::check_permission()
}

#[command]
#[cfg(target_os = "android")]
pub fn request_usage_permission() -> Result<(), String> {
    tracker::request_permission()
}

// Auth & Sync Commands
#[command]
pub async fn login_google() -> Result<String, String> {
    // Run the auth flow (blocking server logic) in a blocking task to avoid blocking async runtime
    tokio::task::spawn_blocking(|| crate::auth::start_auth_flow())
        .await
        .map_err(|e| e.to_string())?
}

#[command]
pub async fn exchange_google_code(code: String) -> Result<String, String> {
    tokio::task::spawn_blocking(move || crate::auth::exchange_auth_code(code))
        .await
        .map_err(|e| e.to_string())?
}

// Old method for backward compatibility / single account check
#[command]
pub fn get_google_user() -> Option<String> {
    // Primarily used for "Connected" status.
    // We can check if ANY account exists.
    if let Ok(accounts) = crate::db::get_cloud_accounts() {
        if !accounts.is_empty() {
            return Some("Connected".to_string());
        }
    }
    None
}

#[command]
pub fn get_cloud_accounts() -> Vec<crate::db::CloudAccount> {
    crate::db::get_cloud_accounts().unwrap_or_default()
}

#[command]
pub fn remove_cloud_account(id: i64) -> Result<(), String> {
    crate::db::remove_cloud_account(id).map_err(|e| e.to_string())
}

#[command]
pub async fn create_drive_folder(account_id: i64, name: String) -> Result<String, String> {
    tokio::task::spawn_blocking(move || crate::drive::create_folder(account_id, name))
        .await
        .map_err(|e| e.to_string())?
}

#[command]
pub async fn list_drive_folders(account_id: i64) -> Result<Vec<crate::drive::DriveFolder>, String> {
    tokio::task::spawn_blocking(move || crate::drive::list_folders(account_id))
        .await
        .map_err(|e| e.to_string())?
}

#[command]
pub async fn backup_data(
    account_id: Option<i64>,
    github_token: Option<String>,
    folder_id: Option<String>,
) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        crate::drive::backup_data(account_id, github_token, folder_id)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[command]
pub async fn restore_data(
    account_id: Option<i64>,
    folder_id: Option<String>,
) -> Result<String, String> {
    tokio::task::spawn_blocking(move || crate::drive::restore_data(account_id, folder_id))
        .await
        .map_err(|e| e.to_string())?
}

#[command]
pub async fn upload_file(
    account_id: i64,
    folder_id: String,
    file_path: String,
) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        crate::drive::upload_any_file(account_id, folder_id, file_path)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[command]
pub async fn upload_file_with_data(
    account_id: i64,
    folder_id: String,
    filename: String,
    mime_type: String,
    data: Vec<u8>,
) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        let token = crate::drive::get_token(Some(account_id))?;
        let client = reqwest::blocking::Client::new();
        crate::drive::upload_file_to_drive(&client, &token, &folder_id, &filename, data, &mime_type)
    })
    .await
    .map_err(|e| e.to_string())?
}

#[command]
pub async fn download_file(
    account_id: i64,
    file_id: String,
    dest_path: String,
) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        // Resolve path: if relative, use Downloads folder
        let path = if std::path::Path::new(&dest_path).is_absolute() {
            std::path::PathBuf::from(dest_path)
        } else {
            dirs::download_dir()
                .ok_or("Could not find Downloads directory")?
                .join(dest_path)
        };

        crate::drive::download_any_file(account_id, file_id, path.to_string_lossy().to_string())
            .map(|_| format!("Saved to: {}", path.to_string_lossy()))
    })
    .await
    .map_err(|e| e.to_string())?
}

#[command]
pub async fn save_local_file(
    filename: String,
    data: Vec<u8>,
    target_folder: Option<String>,
) -> Result<String, String> {
    tokio::task::spawn_blocking(move || {
        let folder = if let Some(f) = target_folder {
            std::path::PathBuf::from(f)
        } else {
            dirs::download_dir().unwrap_or_else(|| std::path::PathBuf::from("."))
        };

        let path = folder.join(&filename);
        std::fs::write(&path, data)
            .map(|_| format!("{}", path.to_string_lossy()))
            .map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[command]
pub async fn list_drive_files(
    account_id: i64,
    folder_id: String,
) -> Result<Vec<crate::drive::DriveFile>, String> {
    tokio::task::spawn_blocking(move || crate::drive::list_files_in_folder(account_id, folder_id))
        .await
        .map_err(|e| e.to_string())?
}

#[command]
pub fn get_app_icon(path: String) -> Option<String> {
    crate::icons::get_app_icon(&path)
}

#[command]
pub fn shutdown_pc() -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use std::process::Command;
        Command::new("shutdown")
            .args(["/s", "/t", "0"])
            .spawn()
            .map_err(|e| e.to_string())?;
        Ok(())
    }
    #[cfg(not(target_os = "windows"))]
    {
        Err("Shutdown not supported on this OS".to_string())
    }
}

#[command]
pub fn get_desktop_sources() -> Vec<crate::picker::DesktopSource> {
    crate::picker::get_sources()
}

#[command]
pub async fn start_p2p_server() -> Result<String, String> {
    tokio::task::spawn_blocking(move || crate::p2p::start_server())
        .await
        .map_err(|e| e.to_string())?
}

#[command]
pub async fn stop_p2p_server() -> Result<(), String> {
    tokio::task::spawn_blocking(move || {
        crate::p2p::stop_server();
        Ok(())
    })
    .await
    .map_err(|e| e.to_string())?
}

#[command]
pub fn start_timer_cmd(app: tauri::AppHandle, duration_secs: u64) {
    crate::timer::start_timer(duration_secs, app);
}

#[command]
pub fn cancel_timer_cmd() {
    crate::timer::cancel_timer();
}

#[command]
pub fn get_timer_status_cmd() -> Option<u64> {
    crate::timer::get_remaining_time()
}

#[command]
pub fn quit_app_cmd(app: tauri::AppHandle) {
    app.exit(0);
}

#[command]
pub fn show_window_cmd(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }
}
