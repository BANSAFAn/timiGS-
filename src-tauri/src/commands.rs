//! Tauri IPC commands

use crate::db;
use tauri::{command, Manager};

#[cfg(target_os = "windows")]
use crate::tracker;

#[cfg(target_os = "android")]
use crate::android_tracker as tracker;

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
pub fn get_summary_by_date_cmd(date: String) -> Vec<db::AppUsageSummary> {
    db::get_summary_by_date(&date).unwrap_or_default()
}

#[command]
pub fn get_music_today_summary() -> Vec<db::MusicAppUsage> {
    db::get_today_music_summary().unwrap_or_default()
}

#[command]
pub fn get_total_music_time_today() -> i64 {
    db::get_total_music_time_today().unwrap_or(0)
}

#[command]
pub fn get_current_music_session() -> Option<db::MusicSession> {
    db::get_today_music_sessions().ok().and_then(|sessions| sessions.into_iter().next())
}

#[command]
pub fn get_music_activity_range(from: String, to: String) -> Vec<db::MusicSession> {
    use chrono::NaiveDate;

    let from_date = NaiveDate::parse_from_str(&from, "%Y-%m-%d").ok();
    let to_date = NaiveDate::parse_from_str(&to, "%Y-%m-%d").ok();

    if let (Some(f), Some(t)) = (from_date, to_date) {
        db::get_music_sessions_range(f, t).unwrap_or_default()
    } else {
        vec![]
    }
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
pub fn get_excluded_processes_cmd() -> Result<Vec<String>, String> {
    db::get_excluded_processes().map_err(|e| e.to_string())
}

#[command]
pub fn add_excluded_process_cmd(exe_path: String) -> Result<(), String> {
    db::add_excluded_process(&exe_path).map_err(|e| e.to_string())
}

#[command]
pub fn remove_excluded_process_cmd(exe_path: String) -> Result<(), String> {
    db::remove_excluded_process(&exe_path).map_err(|e| e.to_string())
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
pub fn get_local_ip() -> Result<String, String> {
    crate::p2p::get_local_ip()
}

#[command]
pub async fn send_p2p_file(target_ip: String, file_path: String) -> Result<String, String> {
    tokio::task::spawn_blocking(move || crate::p2p::send_file_to_ip(&target_ip, &file_path))
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
pub fn show_main_window_cmd(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
        let _ = window.set_always_on_top(true);
        std::thread::sleep(std::time::Duration::from_millis(50));
        let _ = window.set_always_on_top(false);
    }
}

#[command]
pub fn show_tray_window_cmd(app: tauri::AppHandle) {
    if let Some(tray_window) = app.get_webview_window("tray") {
        let _ = tray_window.show();
        let _ = tray_window.set_focus();
    }
}

use tauri::Emitter;

#[command]
pub fn emit_navigate_cmd(app: tauri::AppHandle, path: String) {
    println!("Emitting navigate event to: {}", path);
    let _ = app.emit("navigate", path);
}

// ── Focus Mode Commands ──

#[command]
pub fn start_focus_cmd(
    app_name: String,
    exe_path: String,
    duration_secs: u64,
    password: String,
) -> Result<(), String> {
    crate::focus::start_focus(&app_name, &exe_path, duration_secs, &password)
}

#[command]
pub fn stop_focus_cmd(password: String) -> Result<(), String> {
    crate::focus::stop_focus(&password)
}

#[command]
pub fn get_focus_status_cmd() -> Option<crate::focus::FocusStatus> {
    crate::focus::get_focus_status()
}

// ── Time OUT Commands ──

#[command]
pub fn start_timeout_cmd(
    app: tauri::AppHandle,
    interval_secs: u64,
    break_duration_secs: u64,
    password: String,
    enable_schedule: bool,
    schedule_start_hour: Option<u64>,
    schedule_start_minute: Option<u64>,
    schedule_end_hour: Option<u64>,
    schedule_end_minute: Option<u64>,
    custom_breaks: Option<Vec<serde_json::Value>>,
    selected_days: Vec<u32>,
) -> Result<(), String> {
    crate::timeout::start_timeout(
        interval_secs,
        break_duration_secs,
        &password,
        app,
        enable_schedule,
        schedule_start_hour,
        schedule_start_minute,
        schedule_end_hour,
        schedule_end_minute,
        custom_breaks,
        selected_days,
    )
}

#[command]
pub fn save_timeout_schedule_cmd(
    interval_secs: u64,
    break_duration_secs: u64,
    password: String,
    schedule_start_hour: Option<u64>,
    schedule_start_minute: Option<u64>,
    schedule_end_hour: Option<u64>,
    schedule_end_minute: Option<u64>,
    custom_breaks: Option<Vec<serde_json::Value>>,
    selected_days: Vec<u32>,
) -> Result<(), String> {
    // Parse custom breaks
    let breaks = custom_breaks
        .unwrap_or_default()
        .iter()
        .filter_map(|b| {
            let hour = b.get("hour")?.as_u64()? as u32;
            let minute = b.get("minute")?.as_u64()? as u32;
            let duration = b.get("duration")?.as_u64()? as u32;
            let time_minutes = hour * 60 + minute;
            Some(crate::timeout::CustomBreak {
                time_minutes,
                duration_minutes: duration,
            })
        })
        .collect();
    
    crate::timeout::save_timeout_schedule(
        interval_secs,
        break_duration_secs,
        &password,
        schedule_start_hour.unwrap_or(9),
        schedule_start_minute.unwrap_or(0),
        schedule_end_hour.unwrap_or(17),
        schedule_end_minute.unwrap_or(0),
        breaks,
        selected_days,
    )
}

#[command]
pub fn stop_timeout_cmd(app: tauri::AppHandle, password: String) -> Result<(), String> {
    crate::timeout::stop_timeout(&password, &app)
}

#[command]
pub fn get_timeout_status_cmd() -> Option<crate::timeout::TimeoutStatus> {
    crate::timeout::get_timeout_status()
}

// ── Project Boards ──

#[command]
pub fn create_project_board(name: String, board_type: String) -> Result<i64, String> {
    crate::db::create_board(&name, &board_type).map_err(|e| e.to_string())
}

#[command]
pub fn get_project_boards() -> Result<Vec<crate::db::ProjectBoard>, String> {
    crate::db::get_boards().map_err(|e| e.to_string())
}

#[command]
pub fn delete_project_board(id: i64) -> Result<(), String> {
    crate::db::delete_board(id).map_err(|e| e.to_string())
}

#[command]
pub fn get_board_items_cmd(board_id: i64) -> Result<Vec<crate::db::BoardItem>, String> {
    crate::db::get_board_items(board_id).map_err(|e| e.to_string())
}

#[command]
pub fn populate_board_cmd(board_id: i64) -> Result<usize, String> {
    crate::db::populate_board_from_activity(board_id).map_err(|e| e.to_string())
}

// ── Project Tasks ──

#[command]
pub fn add_project_task_cmd(
    board_id: i64,
    title: String,
    description: Option<String>,
    priority: String,
    due_date: Option<String>,
) -> Result<i64, String> {
    crate::db::add_project_task(
        board_id,
        &title,
        description.as_deref(),
        &priority,
        due_date.as_deref(),
    )
    .map_err(|e| e.to_string())
}

#[command]
pub fn get_project_tasks_cmd(board_id: i64) -> Result<Vec<crate::db::ProjectTask>, String> {
    crate::db::get_project_tasks(board_id).map_err(|e| e.to_string())
}

#[command]
pub fn update_project_task_status_cmd(id: i64, status: String) -> Result<(), String> {
    crate::db::update_project_task_status(id, &status).map_err(|e| e.to_string())
}

#[command]
pub fn delete_project_task_cmd(id: i64) -> Result<(), String> {
    crate::db::delete_project_task(id).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn get_music_files_cmd(
    app_handle: tauri::AppHandle,
) -> Result<Vec<crate::music::MusicFile>, String> {
    crate::music::get_music_files(&app_handle)
}

#[tauri::command]
pub fn add_music_file_cmd(
    app_handle: tauri::AppHandle,
    source_path: String,
) -> Result<crate::music::MusicFile, String> {
    crate::music::add_music_path(&app_handle, source_path)
}

#[tauri::command]
pub fn delete_music_file_cmd(app_handle: tauri::AppHandle, path: String) -> Result<(), String> {
    crate::music::remove_music_path(&app_handle, path)
}

#[tauri::command]
pub fn open_music_folder_cmd(app_handle: tauri::AppHandle) -> Result<(), String> {
    crate::music::open_music_folder(&app_handle)
}

// ── Music Playback ──

#[tauri::command]
pub fn play_music_cmd(app_handle: tauri::AppHandle, filename: String) -> Result<(), String> {
    crate::music::play_music(&app_handle, &filename)
}

#[tauri::command]
pub fn pause_music_cmd() -> Result<(), String> {
    crate::music::pause_music()
}

#[tauri::command]
pub fn resume_music_cmd() -> Result<(), String> {
    crate::music::resume_music()
}

#[tauri::command]
pub fn stop_music_cmd() -> Result<(), String> {
    crate::music::stop_music()
}

#[tauri::command]
pub fn get_music_status_cmd() -> Result<crate::music::MusicPlaybackStatus, String> {
    crate::music::get_music_status()
}

#[tauri::command]
pub fn set_music_volume_cmd(volume: f32) -> Result<(), String> {
    crate::music::set_music_volume(volume)
}

#[tauri::command]
pub fn toggle_music_loop_cmd() -> Result<bool, String> {
    crate::music::toggle_music_loop()
}

// ── Data Management ──

#[command]
pub fn reset_all_data_cmd() -> Result<(), String> {
    crate::db::reset_all_data().map_err(|e| e.to_string())
}

#[command]
pub fn export_data_csv_cmd(path: String) -> Result<(), String> {
    crate::db::export_sessions_csv(&path).map_err(|e| e.to_string())
}

#[command]
pub fn export_data_html_cmd(path: String) -> Result<(), String> {
    crate::db::export_sessions_html(&path).map_err(|e| e.to_string())
}

#[command]
pub fn save_auto_export_settings_cmd(
    enabled: bool,
    interval_hours: i64,
    folder: String,
) -> Result<(), String> {
    let mut settings = crate::db::get_settings();
    settings.auto_export_enabled = enabled;
    settings.auto_export_interval_hours = interval_hours;
    settings.auto_export_folder = folder;
    crate::db::save_settings(&settings).map_err(|e| e.to_string())
}

#[command]
pub fn get_auto_export_settings_cmd() -> Result<serde_json::Value, String> {
    let settings = crate::db::get_settings();
    Ok(serde_json::json!({
        "enabled": settings.auto_export_enabled,
        "interval_hours": settings.auto_export_interval_hours,
        "folder": settings.auto_export_folder,
        "last_export_time": settings.last_export_time
    }))
}

// ── Music ──