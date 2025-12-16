//! Tauri IPC commands

use crate::{db, tracker};
use serde::{Deserialize, Serialize};
use tauri::command;

#[derive(Debug, Serialize, Deserialize)]
pub struct DateRange {
    pub from: String,
    pub to: String,
}

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

use tauri_plugin_autostart::ManagerExt;

#[command]
pub fn save_settings(app: tauri::AppHandle, settings: db::Settings) -> Result<(), String> {
    // Handle autostart
    use tauri_plugin_autostart::ManagerExt;
    if settings.autostart {
        let _ = app.autolaunch().enable();
    } else {
        let _ = app.autolaunch().disable();
    }
    
    db::save_settings(&settings).map_err(|e| e.to_string())
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
    tokio::task::spawn_blocking(|| {
        crate::auth::start_auth_flow()
    }).await.map_err(|e| e.to_string())?
}

#[command]
pub fn get_google_user() -> Option<String> {
    // Returns dummy user info if token exists, since we haven't implemented userinfo endpoint fetching yet
    if crate::db::get_setting("google_access_token").is_some() {
        Some("Authorized User".to_string()) 
    } else {
        None
    }
}

#[command]
pub async fn backup_data() -> Result<String, String> {
    tokio::task::spawn_blocking(|| {
        crate::drive::backup_data()
    }).await.map_err(|e| e.to_string())?
}

#[command]
pub async fn restore_data() -> Result<String, String> {
    tokio::task::spawn_blocking(|| {
        crate::drive::restore_data()
    }).await.map_err(|e| e.to_string())?
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
