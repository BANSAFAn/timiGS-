//! Tasks API
//!
//! Secure task management with input validation.

use chrono::Utc;
use flutter_rust_bridge::frb;
use anyhow::{Context, Result};

use crate::db::with_connection;
use crate::models::{Task, TaskStatus, NewTask};

/// Maximum string lengths
const MAX_APP_NAME_LENGTH: usize = 256;
const MAX_DESCRIPTION_LENGTH: usize = 1024;
const MAX_FILTER_LENGTH: usize = 256;
const MAX_GOAL_SECONDS: i64 = 86400 * 365; // 1 year max
const MAX_RESULTS: i32 = 100;

/// Validate task input
fn validate_new_task(task: &NewTask) -> Result<(), String> {
    if task.app_name.is_empty() || task.app_name.len() > MAX_APP_NAME_LENGTH {
        return Err("Invalid app name length".to_string());
    }
    if task.app_name.contains('\0') {
        return Err("Invalid characters in app name".to_string());
    }
    if let Some(ref desc) = task.description {
        if desc.len() > MAX_DESCRIPTION_LENGTH {
            return Err("Description too long".to_string());
        }
    }
    if let Some(ref filter) = task.title_filter {
        if filter.len() > MAX_FILTER_LENGTH {
            return Err("Filter too long".to_string());
        }
    }
    if task.goal_seconds <= 0 || task.goal_seconds > MAX_GOAL_SECONDS {
        return Err("Invalid goal duration".to_string());
    }
    Ok(())
}

/// Create a new task
#[frb]
pub fn create_task(task: NewTask) -> Result<i64, String> {
    validate_new_task(&task)?;
    
    with_connection(|conn| {
        let now = Utc::now().to_rfc3339();
        
        conn.execute(
            "INSERT INTO tasks (app_name, description, goal_seconds, created_at, status, title_filter)
             VALUES (?1, ?2, ?3, ?4, 'active', ?5)",
            rusqlite::params![
                task.app_name,
                task.description.as_deref().unwrap_or(""),
                task.goal_seconds,
                now,
                task.title_filter.as_deref().unwrap_or(""),
            ],
        ).context("Failed to create task")?;
        
        Ok(conn.last_insert_rowid())
    }).map_err(|e| e.to_string())
}

/// Get all active tasks
#[frb]
pub fn get_active_tasks() -> Result<Vec<Task>, String> {
    with_connection(|conn| {
        let mut stmt = conn.prepare(
            "SELECT id, app_name, description, goal_seconds, created_at, status, title_filter
             FROM tasks
             WHERE status = 'active'
             ORDER BY created_at DESC
             LIMIT ?1"
        ).context("Failed to prepare query")?;
        
        let tasks = stmt.query_map(rusqlite::params![MAX_RESULTS], |row| {
            Ok(Task {
                id: row.get(0)?,
                app_name: row.get(1)?,
                description: row.get(2)?,
                goal_seconds: row.get::<_, i64>(3)?.max(0),
                created_at: parse_datetime_safe(row.get::<_, String>(4)?),
                status: parse_status_safe(row.get::<_, String>(5)?),
                title_filter: row.get(6)?,
            })
        }).context("Failed to execute query")?
        .collect::<std::result::Result<Vec<_>, _>>()
        .context("Failed to parse results")?;
        
        Ok(tasks)
    }).map_err(|e| e.to_string())
}

/// Get all tasks
#[frb]
pub fn get_all_tasks() -> Result<Vec<Task>, String> {
    with_connection(|conn| {
        let mut stmt = conn.prepare(
            "SELECT id, app_name, description, goal_seconds, created_at, status, title_filter
             FROM tasks
             ORDER BY created_at DESC
             LIMIT ?1"
        ).context("Failed to prepare query")?;
        
        let tasks = stmt.query_map(rusqlite::params![MAX_RESULTS], |row| {
            Ok(Task {
                id: row.get(0)?,
                app_name: row.get(1)?,
                description: row.get(2)?,
                goal_seconds: row.get::<_, i64>(3)?.max(0),
                created_at: parse_datetime_safe(row.get::<_, String>(4)?),
                status: parse_status_safe(row.get::<_, String>(5)?),
                title_filter: row.get(6)?,
            })
        }).context("Failed to execute query")?
        .collect::<std::result::Result<Vec<_>, _>>()
        .context("Failed to parse results")?;
        
        Ok(tasks)
    }).map_err(|e| e.to_string())
}

/// Update task status
#[frb]
pub fn update_task_status(task_id: i64, status: TaskStatus) -> Result<(), String> {
    if task_id <= 0 {
        return Err("Invalid task ID".to_string());
    }
    
    with_connection(|conn| {
        let status_str = match status {
            TaskStatus::Active => "active",
            TaskStatus::Completed => "completed",
            TaskStatus::Paused => "paused",
            TaskStatus::Cancelled => "cancelled",
        };
        
        let rows = conn.execute(
            "UPDATE tasks SET status = ?1 WHERE id = ?2",
            rusqlite::params![status_str, task_id],
        ).context("Failed to update task status")?;
        
        if rows == 0 {
            anyhow::bail!("Task not found");
        }
        
        Ok(())
    }).map_err(|e| e.to_string())
}

/// Delete a task
#[frb]
pub fn delete_task(task_id: i64) -> Result<(), String> {
    if task_id <= 0 {
        return Err("Invalid task ID".to_string());
    }
    
    with_connection(|conn| {
        let rows = conn.execute(
            "DELETE FROM tasks WHERE id = ?1", 
            rusqlite::params![task_id]
        ).context("Failed to delete task")?;
        
        if rows == 0 {
            anyhow::bail!("Task not found");
        }
        
        Ok(())
    }).map_err(|e| e.to_string())
}

/// Parse datetime string safely (never panics)
fn parse_datetime_safe(s: String) -> chrono::DateTime<Utc> {
    chrono::DateTime::parse_from_rfc3339(&s)
        .map(|dt| dt.with_timezone(&Utc))
        .unwrap_or_else(|_| Utc::now())
}

/// Parse status string safely
fn parse_status_safe(s: String) -> TaskStatus {
    match s.as_str() {
        "active" => TaskStatus::Active,
        "completed" => TaskStatus::Completed,
        "paused" => TaskStatus::Paused,
        "cancelled" => TaskStatus::Cancelled,
        _ => TaskStatus::Active, // Safe default
    }
}
