//! Tauri IPC commands

use crate::{db, tracker};
use tauri::command;

#[command]
pub fn get_current_activity() -> Option<tracker::ActiveWindow> {
    tracker::get_current_active()
}

#[command]
pub fn get_current_session() -> Option<tracker::CurrentSession> {
    tracker::get_current_session()
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
pub fn start_tracking() {
    tracker::start_tracking();
}

#[command]
pub fn stop_tracking() {
    tracker::stop_tracking();
}

#[command]
pub fn is_tracking() -> bool {
    tracker::is_tracking()
}

// Auth & Sync Commands
#[command]
pub async fn login_google() -> Result<String, String> {
    // Run the auth flow (blocking server logic) in a blocking task to avoid blocking async runtime
    tokio::task::spawn_blocking(|| crate::auth::start_auth_flow())
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
