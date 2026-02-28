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
    pub google_client_id: Option<String>,
    pub google_client_secret: Option<String>,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            language: "en".to_string(),
            theme: "dark".to_string(),
            autostart: true,
            minimize_to_tray: true,
            discord_rpc: true,
            google_client_id: None,
            google_client_secret: None,
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

    conn.execute(
        "CREATE TABLE IF NOT EXISTS cloud_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            provider TEXT NOT NULL,
            access_token TEXT NOT NULL,
            refresh_token TEXT,
            created_at TEXT NOT NULL
        )",
        [],
    )?;

    // Migration for existing table
    let _ = conn.execute("ALTER TABLE tasks ADD COLUMN title_filter TEXT", []);

    conn.execute(
        "CREATE TABLE IF NOT EXISTS project_boards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            board_type TEXT NOT NULL DEFAULT 'activity',
            github_project_id TEXT,
            github_project_url TEXT,
            synced_at TEXT,
            created_at TEXT NOT NULL
        )",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS board_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            board_id INTEGER NOT NULL,
            app_name TEXT NOT NULL,
            window_title TEXT,
            tracked_seconds INTEGER DEFAULT 0,
            status TEXT DEFAULT 'recorded',
            date TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (board_id) REFERENCES project_boards(id) ON DELETE CASCADE
        )",
        [],
    )?;

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_board_items_board_id ON board_items(board_id)",
        [],
    )?;

    conn.execute(
        "CREATE TABLE IF NOT EXISTS project_tasks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            board_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'todo',
            priority TEXT NOT NULL DEFAULT 'medium',
            due_date TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (board_id) REFERENCES project_boards(id) ON DELETE CASCADE
        )",
        [],
    )?;

    // Migration: add board_type column to existing project_boards
    let _ = conn.execute(
        "ALTER TABLE project_boards ADD COLUMN board_type TEXT NOT NULL DEFAULT 'activity'",
        [],
    );

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

pub fn get_all_sessions() -> Result<Vec<ActivitySession>> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let mut stmt = conn.prepare(
        "SELECT id, app_name, window_title, exe_path, start_time, end_time, duration_seconds 
         FROM activity_sessions 
         ORDER BY start_time DESC",
    )?;

    let sessions = stmt
        .query_map([], |row| {
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

        if let Ok(client_id) = conn.query_row(
            "SELECT value FROM settings WHERE key = 'google_client_id'",
            [],
            |row| row.get::<_, String>(0),
        ) {
            settings.google_client_id = Some(client_id);
        }

        if let Ok(client_secret) = conn.query_row(
            "SELECT value FROM settings WHERE key = 'google_client_secret'",
            [],
            |row| row.get::<_, String>(0),
        ) {
            settings.google_client_secret = Some(client_secret);
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

    if let Some(client_id) = &settings.google_client_id {
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('google_client_id', ?1)",
            [client_id],
        )?;
    }

    if let Some(client_secret) = &settings.google_client_secret {
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('google_client_secret', ?1)",
            [client_secret],
        )?;
    }

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

// Cloud Accounts

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CloudAccount {
    pub id: i64,
    pub email: String,
    pub provider: String,
    pub created_at: DateTime<Local>,
}

pub fn add_cloud_account(
    email: &str,
    provider: &str,
    access_token: &str,
    refresh_token: &str,
) -> Result<()> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    // Check if exists, update if so
    let exists: bool = conn
        .query_row(
            "SELECT EXISTS(SELECT 1 FROM cloud_accounts WHERE email = ?1 AND provider = ?2)",
            params![email, provider],
            |row| row.get(0),
        )
        .unwrap_or(false);

    if exists {
        conn.execute(
            "UPDATE cloud_accounts SET access_token = ?1, refresh_token = ?2 WHERE email = ?3 AND provider = ?4",
            params![access_token, refresh_token, email, provider],
        )?;
    } else {
        conn.execute(
            "INSERT INTO cloud_accounts (email, provider, access_token, refresh_token, created_at) VALUES (?1, ?2, ?3, ?4, ?5)",
            params![email, provider, access_token, refresh_token, Local::now().to_rfc3339()],
        )?;
    }
    Ok(())
}

pub fn get_cloud_accounts() -> Result<Vec<CloudAccount>> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let mut stmt = conn.prepare("SELECT id, email, provider, created_at FROM cloud_accounts")?;
    let rows = stmt.query_map([], |row| {
        Ok(CloudAccount {
            id: row.get(0)?,
            email: row.get(1)?,
            provider: row.get(2)?,
            created_at: DateTime::parse_from_rfc3339(&row.get::<_, String>(3)?)
                .map(|dt| dt.with_timezone(&Local))
                .unwrap_or_else(|_| Local::now()),
        })
    })?;

    let mut accounts = Vec::new();
    for row in rows {
        accounts.push(row?);
    }
    Ok(accounts)
}

pub fn get_cloud_token(id: i64) -> Result<(String, String)> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let (access, refresh): (String, String) = conn.query_row(
        "SELECT access_token, refresh_token FROM cloud_accounts WHERE id = ?1",
        params![id],
        |row| Ok((row.get(0)?, row.get(1).unwrap_or_default())),
    )?;
    Ok((access, refresh))
}

pub fn remove_cloud_account(id: i64) -> Result<()> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    conn.execute("DELETE FROM cloud_accounts WHERE id = ?1", params![id])?;
    Ok(())
}

// Project Boards

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectBoard {
    pub id: i64,
    pub name: String,
    pub board_type: String,
    pub github_project_id: Option<String>,
    pub github_project_url: Option<String>,
    pub synced_at: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BoardItem {
    pub id: i64,
    pub board_id: i64,
    pub app_name: String,
    pub window_title: Option<String>,
    pub tracked_seconds: i64,
    pub status: String,
    pub date: String,
    pub created_at: String,
}

pub fn create_board(name: &str, board_type: &str) -> Result<i64> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;
    let now = Local::now().to_rfc3339();

    conn.execute(
        "INSERT INTO project_boards (name, board_type, created_at) VALUES (?1, ?2, ?3)",
        params![name, board_type, now],
    )?;
    Ok(conn.last_insert_rowid())
}

pub fn get_boards() -> Result<Vec<ProjectBoard>> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let mut stmt = conn.prepare(
        "SELECT id, name, board_type, github_project_id, github_project_url, synced_at, created_at
         FROM project_boards ORDER BY created_at DESC",
    )?;

    let boards = stmt
        .query_map([], |row| {
            Ok(ProjectBoard {
                id: row.get(0)?,
                name: row.get(1)?,
                board_type: row.get(2)?,
                github_project_id: row.get(3)?,
                github_project_url: row.get(4)?,
                synced_at: row.get(5)?,
                created_at: row.get(6)?,
            })
        })?
        .filter_map(|r| r.ok())
        .collect();

    Ok(boards)
}

pub fn delete_board(id: i64) -> Result<()> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    conn.execute("DELETE FROM board_items WHERE board_id = ?1", params![id])?;
    conn.execute("DELETE FROM project_boards WHERE id = ?1", params![id])?;
    Ok(())
}

pub fn get_board_items(board_id: i64) -> Result<Vec<BoardItem>> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let mut stmt = conn.prepare(
        "SELECT id, board_id, app_name, window_title, tracked_seconds, status, date, created_at
         FROM board_items WHERE board_id = ?1 ORDER BY tracked_seconds DESC",
    )?;

    let items = stmt
        .query_map(params![board_id], |row| {
            Ok(BoardItem {
                id: row.get(0)?,
                board_id: row.get(1)?,
                app_name: row.get(2)?,
                window_title: row.get(3)?,
                tracked_seconds: row.get(4)?,
                status: row.get(5)?,
                date: row.get(6)?,
                created_at: row.get(7)?,
            })
        })?
        .filter_map(|r| r.ok())
        .collect();

    Ok(items)
}

pub fn add_board_item(
    board_id: i64,
    app_name: &str,
    window_title: Option<&str>,
    tracked_seconds: i64,
    date: &str,
) -> Result<i64> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;
    let now = Local::now().to_rfc3339();

    conn.execute(
        "INSERT INTO board_items (board_id, app_name, window_title, tracked_seconds, date, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![board_id, app_name, window_title, tracked_seconds, date, now],
    )?;
    Ok(conn.last_insert_rowid())
}

pub fn populate_board_from_activity(board_id: i64) -> Result<usize> {
    let today = Local::now().format("%Y-%m-%d").to_string();
    let sessions = get_today_sessions()?;

    // Group sessions by app_name
    let mut app_map: std::collections::HashMap<String, (i64, String)> =
        std::collections::HashMap::new();

    for session in &sessions {
        let entry = app_map
            .entry(session.app_name.clone())
            .or_insert((0, session.window_title.clone()));
        entry.0 += session.duration_seconds;
    }

    // Clear old items for today to avoid duplicates
    {
        let guard = DB.lock();
        let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;
        conn.execute(
            "DELETE FROM board_items WHERE board_id = ?1 AND date = ?2",
            params![board_id, today],
        )?;
    }

    let mut count = 0;
    for (app_name, (seconds, window)) in &app_map {
        if *seconds > 0 {
            add_board_item(board_id, app_name, Some(window), *seconds, &today)?;
            count += 1;
        }
    }

    Ok(count)
}

pub fn update_board_github(
    board_id: i64,
    github_project_id: &str,
    github_project_url: &str,
) -> Result<()> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;
    let now = Local::now().to_rfc3339();

    conn.execute(
        "UPDATE project_boards SET github_project_id = ?1, github_project_url = ?2, synced_at = ?3 WHERE id = ?4",
        params![github_project_id, github_project_url, now, board_id],
    )?;
    Ok(())
}

pub fn update_board_synced_at(board_id: i64) -> Result<()> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;
    let now = Local::now().to_rfc3339();

    conn.execute(
        "UPDATE project_boards SET synced_at = ?1 WHERE id = ?2",
        params![now, board_id],
    )?;
    Ok(())
}

// Project Tasks (for table & roadmap boards)

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProjectTask {
    pub id: i64,
    pub board_id: i64,
    pub title: String,
    pub description: Option<String>,
    pub status: String,
    pub priority: String,
    pub due_date: Option<String>,
    pub created_at: String,
}

pub fn add_project_task(
    board_id: i64,
    title: &str,
    description: Option<&str>,
    priority: &str,
    due_date: Option<&str>,
) -> Result<i64> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;
    let now = Local::now().to_rfc3339();

    conn.execute(
        "INSERT INTO project_tasks (board_id, title, description, priority, due_date, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        params![board_id, title, description, priority, due_date, now],
    )?;
    Ok(conn.last_insert_rowid())
}

pub fn get_project_tasks(board_id: i64) -> Result<Vec<ProjectTask>> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let mut stmt = conn.prepare(
        "SELECT id, board_id, title, description, status, priority, due_date, created_at
         FROM project_tasks WHERE board_id = ?1 ORDER BY created_at ASC",
    )?;

    let tasks = stmt
        .query_map(params![board_id], |row| {
            Ok(ProjectTask {
                id: row.get(0)?,
                board_id: row.get(1)?,
                title: row.get(2)?,
                description: row.get(3)?,
                status: row.get(4)?,
                priority: row.get(5)?,
                due_date: row.get(6)?,
                created_at: row.get(7)?,
            })
        })?
        .filter_map(|r| r.ok())
        .collect();

    Ok(tasks)
}

pub fn update_project_task_status(id: i64, status: &str) -> Result<()> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    conn.execute(
        "UPDATE project_tasks SET status = ?1 WHERE id = ?2",
        params![status, id],
    )?;
    Ok(())
}

pub fn delete_project_task(id: i64) -> Result<()> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    conn.execute("DELETE FROM project_tasks WHERE id = ?1", params![id])?;
    Ok(())
}
