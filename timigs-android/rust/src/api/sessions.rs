//! Session management API
//! 
//! Provides secure session tracking with input validation.

use chrono::{DateTime, NaiveDate, Utc, Datelike};
use flutter_rust_bridge::frb;
use anyhow::{Context, Result};

use crate::db::with_connection;
use crate::models::{ActivitySession, NewSession};

/// Maximum allowed string length for inputs
const MAX_STRING_LENGTH: usize = 1024;

/// Sanitize and validate string input
fn validate_string(input: &str, field_name: &str) -> Result<(), String> {
    if input.len() > MAX_STRING_LENGTH {
        return Err(format!("{} exceeds maximum length of {} characters", field_name, MAX_STRING_LENGTH));
    }
    if input.contains('\0') {
        return Err(format!("{} contains invalid characters", field_name));
    }
    Ok(())
}

/// Start a new activity session
/// 
/// # Security
/// - Validates all string inputs
/// - Uses parameterized queries (prevents SQL injection)
/// 
/// Returns the ID of the created session.
#[frb]
pub fn start_session(session: NewSession) -> Result<i64, String> {
    // Input validation
    validate_string(&session.app_name, "app_name")?;
    validate_string(&session.window_title, "window_title")?;
    validate_string(&session.exe_path, "exe_path")?;
    
    with_connection(|conn| {
        let now = Utc::now().to_rfc3339();
        
        // Parameterized query prevents SQL injection
        conn.execute(
            "INSERT INTO activity_sessions (app_name, window_title, exe_path, start_time) 
             VALUES (?1, ?2, ?3, ?4)",
            rusqlite::params![&session.app_name, &session.window_title, &session.exe_path, &now],
        ).context("Failed to insert session")?;
        
        Ok(conn.last_insert_rowid())
    }).map_err(|e| e.to_string())
}

/// End an activity session
/// 
/// # Security
/// - Validates session_id is positive
/// - Uses parameterized queries
#[frb]
pub fn end_session(session_id: i64) -> Result<(), String> {
    // Input validation
    if session_id <= 0 {
        return Err("Invalid session ID".to_string());
    }
    
    with_connection(|conn| {
        let now = Utc::now();
        
        // Get start time with proper error handling
        let start_time: String = conn.query_row(
            "SELECT start_time FROM activity_sessions WHERE id = ?1",
            rusqlite::params![session_id],
            |row| row.get(0),
        ).context("Session not found")?;
        
        let start = DateTime::parse_from_rfc3339(&start_time)
            .context("Invalid datetime format in database")?
            .with_timezone(&Utc);
        
        let duration = (now - start).num_seconds().max(0); // Ensure non-negative
        
        conn.execute(
            "UPDATE activity_sessions SET end_time = ?1, duration_seconds = ?2 WHERE id = ?3",
            rusqlite::params![now.to_rfc3339(), duration, session_id],
        ).context("Failed to update session")?;
        
        Ok(())
    }).map_err(|e| e.to_string())
}

/// Get sessions for a specific date
/// 
/// # Security
/// - Validates date components
/// - Uses parameterized queries
#[frb]
pub fn get_sessions_for_date(year: i32, month: u32, day: u32) -> Result<Vec<ActivitySession>, String> {
    // Input validation
    if year < 1970 || year > 2100 {
        return Err("Invalid year".to_string());
    }
    if month < 1 || month > 12 {
        return Err("Invalid month".to_string());
    }
    if day < 1 || day > 31 {
        return Err("Invalid day".to_string());
    }
    
    with_connection(|conn| {
        let date = NaiveDate::from_ymd_opt(year, month, day)
            .ok_or_else(|| anyhow::anyhow!("Invalid date: {}-{}-{}", year, month, day))?;
        let date_str = date.format("%Y-%m-%d").to_string();
        
        let mut stmt = conn.prepare(
            "SELECT id, app_name, window_title, exe_path, start_time, end_time, duration_seconds 
             FROM activity_sessions 
             WHERE date(start_time) = date(?1)
             ORDER BY start_time DESC
             LIMIT 1000" // Prevent excessive data retrieval
        ).context("Failed to prepare query")?;
        
        let sessions = stmt.query_map(rusqlite::params![date_str], |row| {
            Ok(ActivitySession {
                id: row.get(0)?,
                app_name: row.get(1)?,
                window_title: row.get(2)?,
                exe_path: row.get(3)?,
                start_time: parse_datetime_safe(row.get::<_, String>(4)?),
                end_time: row.get::<_, Option<String>>(5)?.map(parse_datetime_safe),
                duration_seconds: row.get(6)?,
            })
        }).context("Failed to execute query")?
        .collect::<Result<Vec<_>, _>>()
        .context("Failed to parse results")?;
        
        Ok(sessions)
    }).map_err(|e| e.to_string())
}

/// Get today's sessions
#[frb]
pub fn get_today_sessions() -> Result<Vec<ActivitySession>, String> {
    let today = Utc::now().date_naive();
    get_sessions_for_date(today.year(), today.month(), today.day())
}

/// Get total tracked time for today in seconds
#[frb]
pub fn get_total_time_today() -> Result<i64, String> {
    with_connection(|conn| {
        let today = Utc::now().date_naive().format("%Y-%m-%d").to_string();
        
        let total: i64 = conn.query_row(
            "SELECT COALESCE(SUM(duration_seconds), 0) FROM activity_sessions WHERE date(start_time) = date(?1)",
            rusqlite::params![today],
            |row| row.get(0),
        ).context("Failed to query total time")?;
        
        Ok(total.max(0)) // Ensure non-negative
    }).map_err(|e| e.to_string())
}

/// Parse datetime string safely (never panics)
fn parse_datetime_safe(s: String) -> DateTime<Utc> {
    DateTime::parse_from_rfc3339(&s)
        .map(|dt| dt.with_timezone(&Utc))
        .unwrap_or_else(|_| {
            log::warn!("Failed to parse datetime: {}", s);
            Utc::now()
        })
}
