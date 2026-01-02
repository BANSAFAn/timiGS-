//! Database module for storing and retrieving activity data

use chrono::{DateTime, Local, NaiveDate};
use once_cell::sync::Lazy;
use parking_lot::Mutex;
use rusqlite::{params, Connection, Result};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

static DB: Lazy<Mutex<Option<Connection>>> = Lazy::new(|| Mutex::new(None));

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActivitySession {
    pub id: Option<i64>,
    pub app_name: String,
    pub window_title: String,
    pub exe_path: String,
    pub start_time: DateTime<Local>,
    pub end_time: Option<DateTime<Local>>,
    pub duration_seconds: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AppUsageSummary {
    pub app_name: String,
    pub exe_path: String,
    pub total_seconds: i64,
    pub session_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DailyStats {
    pub date: String,
    pub total_seconds: i64,
    pub app_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub language: String,
    pub theme: String,
    pub autostart: bool,
    pub minimize_to_tray: bool,
    pub discord_rpc: bool,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            language: "en".to_string(),
            theme: "dark".to_string(),
            autostart: true,
            minimize_to_tray: true,
            discord_rpc: true,
        }
    }
}

pub fn get_db_path() -> PathBuf {
    let app_data = dirs::data_dir().unwrap_or_else(|| PathBuf::from("."));
    let db_dir = app_data.join("TimiGS");
    std::fs::create_dir_all(&db_dir).ok();
    db_dir.join("activity.db")
}

pub fn init_database() -> Result<()> {
    let db_path = get_db_path();
    let conn = Connection::open(&db_path)?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS activity_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            app_name TEXT NOT NULL,
            window_title TEXT NOT NULL,
            exe_path TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT,
            duration_seconds INTEGER DEFAULT 0
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_start_time ON activity_sessions(start_time)",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            app_name TEXT NOT NULL,
            description TEXT,
            goal_seconds INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            status TEXT DEFAULT 'active',
            title_filter TEXT
        )",
        [],
    )?;

    // Migration for existing table
    let _ = conn.execute("ALTER TABLE tasks ADD COLUMN title_filter TEXT", []);

    *DB.lock() = Some(conn);
    Ok(())
}

pub fn start_session(app_name: &str, window_title: &str, exe_path: &str) -> Result<i64> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let now = Local::now();
    conn.execute(
        "INSERT INTO activity_sessions (app_name, window_title, exe_path, start_time) VALUES (?1, ?2, ?3, ?4)",
        params![app_name, window_title, exe_path, now.to_rfc3339()],
    )?;

    Ok(conn.last_insert_rowid())
}

pub fn end_session(id: i64) -> Result<()> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let now = Local::now();

    // Get start time to calculate duration
    let start_time: String = conn.query_row(
        "SELECT start_time FROM activity_sessions WHERE id = ?1",
        [id],
        |row| row.get(0),
    )?;

    if let Ok(start) = DateTime::parse_from_rfc3339(&start_time) {
        let duration = (now - start.with_timezone(&Local)).num_seconds();
        conn.execute(
            "UPDATE activity_sessions SET end_time = ?1, duration_seconds = ?2 WHERE id = ?3",
            params![now.to_rfc3339(), duration, id],
        )?;
    }

    Ok(())
}

pub fn get_today_sessions() -> Result<Vec<ActivitySession>> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let today = Local::now().date_naive();
    let start_of_day = today.and_hms_opt(0, 0, 0).unwrap();

    let mut stmt = conn.prepare(
        "SELECT id, app_name, window_title, exe_path, start_time, end_time, duration_seconds 
         FROM activity_sessions 
         WHERE date(start_time) = date(?1)
         ORDER BY start_time DESC",
    )?;

    let sessions = stmt
        .query_map([start_of_day.to_string()], |row| {
            Ok(ActivitySession {
                id: Some(row.get(0)?),
                app_name: row.get(1)?,
                window_title: row.get(2)?,
                exe_path: row.get(3)?,
                start_time: DateTime::parse_from_rfc3339(&row.get::<_, String>(4)?)
                    .map(|dt| dt.with_timezone(&Local))
                    .unwrap_or_else(|_| Local::now()),
                end_time: row
                    .get::<_, Option<String>>(5)?
                    .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
                    .map(|dt| dt.with_timezone(&Local)),
                duration_seconds: row.get(6)?,
            })
        })?
        .collect::<Result<Vec<_>>>()?;

    Ok(sessions)
}

pub fn get_sessions_range(from: NaiveDate, to: NaiveDate) -> Result<Vec<ActivitySession>> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let mut stmt = conn.prepare(
        "SELECT id, app_name, window_title, exe_path, start_time, end_time, duration_seconds 
         FROM activity_sessions 
         WHERE date(start_time) >= date(?1) AND date(start_time) <= date(?2)
         ORDER BY start_time DESC",
    )?;

    let sessions = stmt
        .query_map(params![from.to_string(), to.to_string()], |row| {
            Ok(ActivitySession {
                id: Some(row.get(0)?),
                app_name: row.get(1)?,
                window_title: row.get(2)?,
                exe_path: row.get(3)?,
                start_time: DateTime::parse_from_rfc3339(&row.get::<_, String>(4)?)
                    .map(|dt| dt.with_timezone(&Local))
                    .unwrap_or_else(|_| Local::now()),
                end_time: row
                    .get::<_, Option<String>>(5)?
                    .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
                    .map(|dt| dt.with_timezone(&Local)),
                duration_seconds: row.get(6)?,
            })
        })?
        .collect::<Result<Vec<_>>>()?;

    Ok(sessions)
}

pub fn get_today_summary() -> Result<Vec<AppUsageSummary>> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let today = Local::now().date_naive();

    let mut stmt = conn.prepare(
        "SELECT app_name, exe_path, SUM(duration_seconds) as total, COUNT(*) as count
         FROM activity_sessions 
         WHERE date(start_time) = date(?1)
         GROUP BY app_name
         ORDER BY total DESC",
    )?;

    let summaries = stmt
        .query_map([today.to_string()], |row| {
            Ok(AppUsageSummary {
                app_name: row.get(0)?,
                exe_path: row.get(1)?,
                total_seconds: row.get(2)?,
                session_count: row.get(3)?,
            })
        })?
        .collect::<Result<Vec<_>>>()?;

    Ok(summaries)
}

pub fn get_weekly_stats() -> Result<Vec<DailyStats>> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let mut stmt = conn.prepare(
        "SELECT date(start_time) as day, SUM(duration_seconds) as total, COUNT(DISTINCT app_name) as apps
         FROM activity_sessions 
         WHERE start_time >= datetime('now', '-7 days')
         GROUP BY day
         ORDER BY day DESC"
    )?;

    let stats = stmt
        .query_map([], |row| {
            Ok(DailyStats {
                date: row.get(0)?,
                total_seconds: row.get(1)?,
                app_count: row.get(2)?,
            })
        })?
        .collect::<Result<Vec<_>>>()?;

    Ok(stats)
}

pub fn get_settings() -> Settings {
    let guard = DB.lock();
    if let Some(conn) = guard.as_ref() {
        let mut settings = Settings::default();

        if let Ok(lang) = conn.query_row(
            "SELECT value FROM settings WHERE key = 'language'",
            [],
            |row| row.get::<_, String>(0),
        ) {
            settings.language = lang;
        }

        if let Ok(theme) = conn.query_row(
            "SELECT value FROM settings WHERE key = 'theme'",
            [],
            |row| row.get::<_, String>(0),
        ) {
            settings.theme = theme;
        }

        if let Ok(autostart) = conn.query_row(
            "SELECT value FROM settings WHERE key = 'autostart'",
            [],
            |row| row.get::<_, String>(0),
        ) {
            settings.autostart = autostart == "true";
        }

        if let Ok(minimize) = conn.query_row(
            "SELECT value FROM settings WHERE key = 'minimize_to_tray'",
            [],
            |row| row.get::<_, String>(0),
        ) {
            settings.minimize_to_tray = minimize == "true";
        }

        if let Ok(discord) = conn.query_row(
            "SELECT value FROM settings WHERE key = 'discord_rpc'",
            [],
            |row| row.get::<_, String>(0),
        ) {
            settings.discord_rpc = discord == "true";
        }

        settings
    } else {
        Settings::default()
    }
}

pub fn save_settings(settings: &Settings) -> Result<()> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('language', ?1)",
        [&settings.language],
    )?;
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('theme', ?1)",
        [&settings.theme],
    )?;
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('autostart', ?1)",
        [if settings.autostart { "true" } else { "false" }],
    )?;
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('minimize_to_tray', ?1)",
        [if settings.minimize_to_tray {
            "true"
        } else {
            "false"
        }],
    )?;
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('discord_rpc', ?1)",
        [if settings.discord_rpc {
            "true"
        } else {
            "false"
        }],
    )?;

    Ok(())
}

pub fn get_setting(key: &str) -> Option<String> {
    let guard = DB.lock();
    if let Some(conn) = guard.as_ref() {
        conn.query_row("SELECT value FROM settings WHERE key = ?1", [key], |row| {
            row.get(0)
        })
        .ok()
    } else {
        None
    }
}

pub fn save_setting(key: &str, value: &str) -> Result<()> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
        params![key, value],
    )?;

    Ok(())
}

// Tasks

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Task {
    pub id: i64,
    pub app_name: String,
    pub description: Option<String>,
    pub goal_seconds: i64,
    pub created_at: DateTime<Local>,
    pub status: String, // "active", "completed", "paused"
    pub title_filter: Option<String>,
}

pub fn create_task(
    app_name: &str,
    description: Option<String>,
    goal_seconds: i64,
    title_filter: Option<String>,
) -> Result<i64> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let now = Local::now();
    conn.execute(
        "INSERT INTO tasks (app_name, description, goal_seconds, created_at, status, title_filter) VALUES (?1, ?2, ?3, ?4, 'active', ?5)",
        params![app_name, description, goal_seconds, now.to_rfc3339(), title_filter],
    )?;

    Ok(conn.last_insert_rowid())
}

pub fn get_tasks() -> Result<Vec<Task>> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let mut stmt = conn.prepare(
        "SELECT id, app_name, description, goal_seconds, created_at, status, title_filter FROM tasks ORDER BY created_at DESC"
    )?;

    let tasks = stmt
        .query_map([], |row| {
            Ok(Task {
                id: row.get(0)?,
                app_name: row.get(1)?,
                description: row.get(2)?,
                goal_seconds: row.get(3)?,
                created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(4)?)
                    .map(|dt| dt.with_timezone(&Local))
                    .unwrap_or_else(|_| Local::now()),
                status: row.get(5)?,
                title_filter: row.get(6).ok(),
            })
        })?
        .collect::<Result<Vec<_>>>()?;

    Ok(tasks)
}

pub fn update_task_status(id: i64, status: &str) -> Result<()> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    conn.execute(
        "UPDATE tasks SET status = ?1 WHERE id = ?2",
        params![status, id],
    )?;
    Ok(())
}

pub fn delete_task(id: i64) -> Result<()> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    conn.execute("DELETE FROM tasks WHERE id = ?1", [id])?;
    Ok(())
}

pub fn get_app_usage_since(
    app_name: &str,
    since: DateTime<Local>,
    title_filter: Option<&String>,
) -> Result<i64> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let query = if let Some(_filter) = title_filter {
        "SELECT SUM(duration_seconds) FROM activity_sessions WHERE app_name = ?1 AND start_time >= ?2 AND window_title LIKE ?"
    } else {
        "SELECT SUM(duration_seconds) FROM activity_sessions WHERE app_name = ?1 AND start_time >= ?2"
    };

    let total: Option<i64> = if let Some(filter) = title_filter {
        let pattern = format!("%{}%", filter);
        conn.query_row(
            query,
            params![app_name, since.to_rfc3339(), pattern],
            |row| row.get(0),
        )
        .ok()
    } else {
        conn.query_row(query, params![app_name, since.to_rfc3339()], |row| {
            row.get(0)
        })
        .ok()
    };

    Ok(total.unwrap_or(0))
}

pub fn get_recent_apps() -> Result<Vec<String>> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let mut stmt = conn.prepare(
        "SELECT DISTINCT app_name FROM activity_sessions ORDER BY start_time DESC LIMIT 50",
    )?;

    let apps = stmt
        .query_map([], |row| row.get(0))?
        .collect::<Result<Vec<String>>>()?;

    Ok(apps)
}
