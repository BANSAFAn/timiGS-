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
pub struct MusicSession {
    pub id: Option<i64>,
    pub app_name: String,
    pub window_title: Option<String>,
    pub exe_path: String,
    pub start_time: DateTime<Local>,
    pub end_time: Option<DateTime<Local>>,
    pub duration_seconds: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MusicAppUsage {
    pub app_name: String,
    pub exe_path: String,
    pub total_seconds: i64,
    session_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodingSession {
    pub id: i64,
    pub app_name: String,
    pub editor_name: String,
    pub file_path: Option<String>,
    pub language: Option<String>,
    pub project_dir: Option<String>,
    pub is_ai_assisted: bool,
    pub window_title: String,
    pub exe_path: String,
    pub start_time: String,
    pub end_time: Option<String>,
    pub duration_seconds: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodingStats {
    pub language: String,
    pub total_seconds: i64,
    pub ai_seconds: i64,
    pub manual_seconds: i64,
    pub session_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CodingProjectStats {
    pub project_dir: String,
    pub total_seconds: i64,
    pub ai_seconds: i64,
    pub session_count: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Settings {
    pub language: String,
    pub theme: String,
    pub autostart: bool,
    pub minimize_to_tray: bool,
    pub auto_export_enabled: bool,
    pub auto_export_interval_hours: i64,
    pub auto_export_folder: String,
    pub last_export_time: Option<String>,
    pub excluded_processes: Vec<String>,
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            language: "en".to_string(),
            theme: "dark".to_string(),
            autostart: true,
            minimize_to_tray: true,
            auto_export_enabled: false,
            auto_export_interval_hours: 24,
            auto_export_folder: String::new(),
            last_export_time: None,
            excluded_processes: Vec::new(),
        }
    }
}

pub fn get_db_path() -> PathBuf {
    // Try multiple fallback locations for robustness
    let app_data = dirs::data_dir()
        .or_else(|| dirs::data_local_dir())
        .or_else(|| {
            // Fallback to executable directory if user dirs not available
            std::env::current_exe()
                .ok()
                .and_then(|p| p.parent().map(|p| p.to_path_buf()))
        })
        .unwrap_or_else(|| PathBuf::from("."));
    
    let db_dir = app_data.join("TimiGS");
    
    // Ensure directory exists with proper error handling
    if let Err(e) = std::fs::create_dir_all(&db_dir) {
        eprintln!("Failed to create database directory {:?}: {}", db_dir, e);
        eprintln!("Falling back to current directory for database");
        // Fallback to current directory
        return PathBuf::from("activity.db");
    }
    
    let db_path = db_dir.join("activity.db");
    eprintln!("Database path: {:?}", db_path);
    db_path
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

    conn.execute(
        "CREATE TABLE IF NOT EXISTS cloud_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT NOT NULL,
            provider TEXT NOT NULL,
            access_token TEXT NOT NULL,
            refresh_token TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL
        )",
        [],
    )?;
//music kurwa (Це ідея Славіка....ОСЬ СУКА Я ХОТІЛ КИНУТИ ПУЛ, НО НІ ТРЕБА ЙОМУ ЗАХУЯРИТИ ТАКУ ІДЕЮ)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS music_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            app_name TEXT NOT NULL,
            window_title TEXT,
            exe_path TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT,
            duration_seconds INTEGER DEFAULT 0
        )",
        [],
    )?;
// НІ ну реально їбашити базу для музики)
    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_music_start_time ON music_sessions(start_time)",
        [],
    )?;

    // Coding sessions - track developer activity
    conn.execute(
        "CREATE TABLE IF NOT EXISTS coding_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            app_name TEXT NOT NULL,
            editor_name TEXT NOT NULL,
            file_path TEXT,
            language TEXT,
            project_dir TEXT,
            is_ai_assisted INTEGER NOT NULL DEFAULT 0,
            window_title TEXT NOT NULL,
            exe_path TEXT NOT NULL,
            start_time TEXT NOT NULL,
            end_time TEXT,
            duration_seconds INTEGER DEFAULT 0
        )",
        [],
    )?;

    // Safe migrations for coding_sessions (ignored if column already exists)
    let _ = conn.execute("ALTER TABLE coding_sessions ADD COLUMN app_name TEXT NOT NULL DEFAULT ''", []);
    let _ = conn.execute("ALTER TABLE coding_sessions ADD COLUMN editor_name TEXT NOT NULL DEFAULT ''", []);
    let _ = conn.execute("ALTER TABLE coding_sessions ADD COLUMN file_path TEXT", []);
    let _ = conn.execute("ALTER TABLE coding_sessions ADD COLUMN language TEXT", []);
    let _ = conn.execute("ALTER TABLE coding_sessions ADD COLUMN project_dir TEXT", []);
    let _ = conn.execute("ALTER TABLE coding_sessions ADD COLUMN is_ai_assisted INTEGER NOT NULL DEFAULT 0", []);
    let _ = conn.execute("ALTER TABLE coding_sessions ADD COLUMN window_title TEXT NOT NULL DEFAULT ''", []);
    let _ = conn.execute("ALTER TABLE coding_sessions ADD COLUMN exe_path TEXT NOT NULL DEFAULT ''", []);
    let _ = conn.execute("ALTER TABLE coding_sessions ADD COLUMN start_time TEXT NOT NULL DEFAULT ''", []);
    let _ = conn.execute("ALTER TABLE coding_sessions ADD COLUMN end_time TEXT", []);
    let _ = conn.execute("ALTER TABLE coding_sessions ADD COLUMN duration_seconds INTEGER DEFAULT 0", []);

    conn.execute(
        "CREATE INDEX IF NOT EXISTS idx_coding_start_time ON coding_sessions(start_time)",
        [],
    )?;

    *DB.lock() = Some(conn);
    Ok(())
}

pub fn close_database() {
    *DB.lock() = None;
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

pub fn end_session_retroactive(id: i64, end_time: DateTime<Local>) -> Result<()> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let start_time: String = conn.query_row(
        "SELECT start_time FROM activity_sessions WHERE id = ?1",
        [id],
        |row| row.get(0),
    )?;

    if let Ok(start) = DateTime::parse_from_rfc3339(&start_time) {
        let duration = (end_time - start.with_timezone(&Local)).num_seconds();
        let duration = std::cmp::max(0, duration);
        conn.execute(
            "UPDATE activity_sessions SET end_time = ?1, duration_seconds = ?2 WHERE id = ?3",
            params![end_time.to_rfc3339(), duration, id],
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

pub fn get_summary_by_date(date_str: &str) -> Result<Vec<AppUsageSummary>> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let mut stmt = conn.prepare(
        "SELECT app_name, exe_path, SUM(duration_seconds) as total, COUNT(*) as count
         FROM activity_sessions
         WHERE date(start_time) = date(?1)
         GROUP BY app_name
         ORDER BY total DESC",
    )?;

    let summaries = stmt
        .query_map([date_str.to_string()], |row| {
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

    // Retrieve sessions from the last 10 days to cover timezone boundaries
    let mut stmt = conn.prepare(
        "SELECT id, app_name, start_time, end_time, duration_seconds
         FROM activity_sessions
         WHERE start_time >= datetime('now', '-10 days')"
    )?;

    struct RawSession {
        id: i64,
        app_name: String,
        start_time: String,
        end_time: Option<String>,
        duration_seconds: i64,
    }

    let raw_sessions = stmt
        .query_map([], |row| {
            Ok(RawSession {
                id: row.get(0)?,
                app_name: row.get(1)?,
                start_time: row.get(2)?,
                end_time: row.get(3)?,
                duration_seconds: row.get(4)?,
            })
        })?
        .collect::<std::result::Result<Vec<_>, rusqlite::Error>>()?;

    use chrono::TimeZone;
    use std::collections::HashSet;

    let current_session_id = crate::tracker::get_current_session().map(|s| s.id);

    let today = Local::now().date_naive();
    let mut stats = Vec::new();

    // Compute stats for today and the preceding 7 days (8 days total)
    for i in 0..8 {
        let day = today - chrono::Duration::days(i);
        let day_str = day.format("%Y-%m-%d").to_string();

        let day_start = match Local.from_local_datetime(&day.and_hms_opt(0, 0, 0).unwrap()) {
            chrono::LocalResult::Single(dt) => dt,
            chrono::LocalResult::Ambiguous(dt1, _) => dt1,
            chrono::LocalResult::None => {
                // Fallback using UTC conversion
                Local.from_utc_datetime(&day.and_hms_opt(0, 0, 0).unwrap())
            }
        };

        let day_end = match Local.from_local_datetime(&(day + chrono::Duration::days(1)).and_hms_opt(0, 0, 0).unwrap()) {
            chrono::LocalResult::Single(dt) => dt,
            chrono::LocalResult::Ambiguous(dt1, _) => dt1,
            chrono::LocalResult::None => {
                Local.from_utc_datetime(&(day + chrono::Duration::days(1)).and_hms_opt(0, 0, 0).unwrap())
            }
        };

        let mut intervals = Vec::new();
        let mut apps_for_day = HashSet::new();

        for s in &raw_sessions {
            let start = match DateTime::parse_from_rfc3339(&s.start_time) {
                Ok(dt) => dt.with_timezone(&Local),
                Err(_) => continue,
            };

            let mut end = if let Some(ref end_str) = s.end_time {
                match DateTime::parse_from_rfc3339(end_str) {
                    Ok(dt) => dt.with_timezone(&Local),
                    Err(_) => {
                        if s.duration_seconds > 0 {
                            start + chrono::Duration::seconds(s.duration_seconds)
                        } else {
                            start
                        }
                    }
                }
            } else {
                // end_time is NULL in the database
                if Some(s.id) == current_session_id {
                    // It is the currently active regular session
                    Local::now()
                } else if s.duration_seconds > 0 {
                    // It is a dangling session but has some recorded duration
                    start + chrono::Duration::seconds(s.duration_seconds)
                } else {
                    // Dangling session without recorded duration (e.g. from crash)
                    start
                }
            };

            if end < start {
                end = start;
            }

            let overlap_start = if start > day_start { start } else { day_start };
            let overlap_end = if end < day_end { end } else { day_end };

            if overlap_start < overlap_end {
                intervals.push((overlap_start, overlap_end));
                apps_for_day.insert(s.app_name.clone());
            }
        }

        let total_seconds = if intervals.is_empty() {
            0
        } else {
            intervals.sort_by_key(|k| k.0);
            let mut merged = Vec::new();
            let mut current = intervals[0];

            for next in intervals.into_iter().skip(1) {
                if next.0 <= current.1 {
                    if next.1 > current.1 {
                        current.1 = next.1;
                    }
                } else {
                    merged.push(current);
                    current = next;
                }
            }
            merged.push(current);

            merged.iter()
                .map(|(s, e)| (*e - *s).num_seconds())
                .sum::<i64>()
        };

        stats.push(DailyStats {
            date: day_str,
            total_seconds,
            app_count: apps_for_day.len() as i64,
        });
    }

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



        if let Ok(auto_export_enabled) = conn.query_row(
            "SELECT value FROM settings WHERE key = 'auto_export_enabled'",
            [],
            |row| row.get::<_, String>(0),
        ) {
            settings.auto_export_enabled = auto_export_enabled == "true";
        }

        if let Ok(interval) = conn.query_row(
            "SELECT value FROM settings WHERE key = 'auto_export_interval_hours'",
            [],
            |row| row.get::<_, i64>(0),
        ) {
            settings.auto_export_interval_hours = interval;
        }

        if let Ok(folder) = conn.query_row(
            "SELECT value FROM settings WHERE key = 'auto_export_folder'",
            [],
            |row| row.get::<_, String>(0),
        ) {
            settings.auto_export_folder = folder;
        }

        if let Ok(last_export) = conn.query_row(
            "SELECT value FROM settings WHERE key = 'last_export_time'",
            [],
            |row| row.get::<_, String>(0),
        ) {
            settings.last_export_time = Some(last_export);
        }

        if let Ok(excluded) = conn.query_row(
            "SELECT value FROM settings WHERE key = 'excluded_processes'",
            [],
            |row| row.get::<_, String>(0),
        ) {
            settings.excluded_processes = serde_json::from_str(&excluded).unwrap_or_default();
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
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('auto_export_enabled', ?1)",
        [if settings.auto_export_enabled {
            "true"
        } else {
            "false"
        }],
    )?;
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('auto_export_interval_hours', ?1)",
        [&settings.auto_export_interval_hours.to_string()],
    )?;
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('auto_export_folder', ?1)",
        [&settings.auto_export_folder],
    )?;
    if let Some(ref last_export) = settings.last_export_time {
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('last_export_time', ?1)",
            [last_export],
        )?;
    }

    // Save excluded processes as JSON
    let excluded_json = serde_json::to_string(&settings.excluded_processes).unwrap_or_else(|_| "[]".to_string());
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('excluded_processes', ?1)",
        [&excluded_json],
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

// Excluded Processes Management
pub fn get_excluded_processes() -> Result<Vec<String>> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let result: Option<String> = conn
        .query_row("SELECT value FROM settings WHERE key = 'excluded_processes'", [], |row| {
            row.get(0)
        })
        .ok();

    match result {
        Some(json_str) => Ok(serde_json::from_str(&json_str).unwrap_or_default()),
        None => Ok(Vec::new()),
    }
}

pub fn add_excluded_process(exe_path: &str) -> Result<()> {
    let mut excluded = get_excluded_processes()?;
    
    // Normalize path for comparison (lowercase)
    let exe_lower = exe_path.to_lowercase();
    
    // Don't add if already exists
    if !excluded.iter().any(|p| p.to_lowercase() == exe_lower) {
        excluded.push(exe_path.to_string());
        
        let excluded_json = serde_json::to_string(&excluded).unwrap_or_else(|_| "[]".to_string());
        save_setting("excluded_processes", &excluded_json)?;
    }
    
    Ok(())
}

pub fn remove_excluded_process(exe_path: &str) -> Result<()> {
    let mut excluded = get_excluded_processes()?;
    let exe_lower = exe_path.to_lowercase();
    
    excluded.retain(|p| p.to_lowercase() != exe_lower);
    
    let excluded_json = serde_json::to_string(&excluded).unwrap_or_else(|_| "[]".to_string());
    save_setting("excluded_processes", &excluded_json)?;
    
    Ok(())
}

pub fn is_process_excluded(exe_path: &str) -> bool {
    if let Ok(excluded) = get_excluded_processes() {
        let exe_lower = exe_path.to_lowercase();
        excluded.iter().any(|p| p.to_lowercase() == exe_lower)
    } else {
        false
    }
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

// Cloud Accounts

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CloudAccount {
    pub id: i64,
    pub email: String,
    pub provider: String,
    pub created_at: String,
}

pub fn add_cloud_account(
    email: &str,
    provider: &str,
    access_token: &str,
    refresh_token: &str,
) -> Result<i64> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;
    let now = Local::now().to_rfc3339();

    // Remove existing account for this provider to avoid duplicates
    conn.execute(
        "DELETE FROM cloud_accounts WHERE provider = ?1",
        params![provider],
    )?;

    conn.execute(
        "INSERT INTO cloud_accounts (email, provider, access_token, refresh_token, created_at)
         VALUES (?1, ?2, ?3, ?4, ?5)",
        params![email, provider, access_token, refresh_token, now],
    )?;

    Ok(conn.last_insert_rowid())
}

pub fn get_cloud_accounts() -> Result<Vec<CloudAccount>> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let mut stmt = conn.prepare(
        "SELECT id, email, provider, created_at FROM cloud_accounts ORDER BY created_at DESC",
    )?;

    let accounts = stmt
        .query_map([], |row| {
            Ok(CloudAccount {
                id: row.get(0)?,
                email: row.get(1)?,
                provider: row.get(2)?,
                created_at: row.get(3)?,
            })
        })?
        .filter_map(|r| r.ok())
        .collect();

    Ok(accounts)
}

pub fn get_cloud_token(account_id: i64) -> Result<(String, String)> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    conn.query_row(
        "SELECT access_token, refresh_token FROM cloud_accounts WHERE id = ?1",
        params![account_id],
        |row| Ok((row.get(0)?, row.get(1)?)),
    )
}

pub fn remove_cloud_account(account_id: i64) -> Result<()> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    conn.execute(
        "DELETE FROM cloud_accounts WHERE id = ?1",
        params![account_id],
    )?;
    Ok(())
}

// Data Management

pub fn reset_all_data() -> Result<()> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    conn.execute("DELETE FROM music_sessions", [])?;
    conn.execute("DELETE FROM activity_sessions", [])?;
    conn.execute("DELETE FROM tasks", [])?;
    conn.execute("DELETE FROM board_items", [])?;
    conn.execute("DELETE FROM project_boards", [])?;
    conn.execute("DELETE FROM project_tasks", [])?;
    conn.execute("DELETE FROM cloud_accounts", [])?;
    conn.execute("DELETE FROM settings", [])?;
    conn.execute("DELETE FROM coding_sessions", [])?;

    Ok(())
}

pub fn export_sessions_csv(path: &str, start_date: &str, end_date: &str) -> Result<()> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let mut stmt = conn.prepare(
        "SELECT app_name, window_title, exe_path, start_time, end_time, duration_seconds
         FROM activity_sessions 
         WHERE date(start_time) >= date(?) AND date(start_time) <= date(?)
         ORDER BY start_time DESC",
    )?;

    let mut csv_content =
        String::from("App Name,Window Title,Exe Path,Start Time,End Time,Duration (seconds)\n");

    let rows = stmt.query_map([start_date, end_date], |row| {
        let app_name: String = row.get(0)?;
        let window_title: String = row.get(1)?;
        let exe_path: String = row.get(2)?;
        let start_time: String = row.get(3)?;
        let end_time: Option<String> = row.get(4)?;
        let duration: i64 = row.get(5)?;
        Ok((
            app_name,
            window_title,
            exe_path,
            start_time,
            end_time,
            duration,
        ))
    })?;

    for row in rows {
        if let Ok((app, title, exe, start, end, dur)) = row {
            // Escape CSV fields that may contain commas or quotes
            let escape = |s: &str| -> String {
                if s.contains(',') || s.contains('"') || s.contains('\n') {
                    format!("\"{}\"", s.replace('"', "\"\""))
                } else {
                    s.to_string()
                }
            };
            csv_content.push_str(&format!(
                "{},{},{},{},{},{}\n",
                escape(&app),
                escape(&title),
                escape(&exe),
                escape(&start),
                escape(&end.unwrap_or_default()),
                dur
            ));
        }
    }

    std::fs::write(path, csv_content)
        .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;

    Ok(())
}

pub fn export_sessions_html(path: &str, start_date: &str, end_date: &str) -> Result<()> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let mut stmt = conn.prepare(
        "SELECT app_name, window_title, start_time, end_time, duration_seconds
         FROM activity_sessions 
         WHERE date(start_time) >= date(?) AND date(start_time) <= date(?)
         ORDER BY start_time DESC",
    )?;

    let mut html_content = String::from(r#"<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>TimiGS Activity Report</title>
    <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; background: #0f172a; color: #e2e8f0; padding: 20px; }
        h2 { color: #8b5cf6; margin-bottom: 20px; }
        table { border-collapse: collapse; width: 100%; background: #1e293b; border-radius: 8px; overflow: hidden; }
        th { background: linear-gradient(135deg, #8b5cf6, #6d28d9); color: white; padding: 14px 12px; text-align: left; font-weight: 600; }
        td { padding: 12px; border-bottom: 1px solid #334155; }
        tr:hover td { background: #334155; }
        .duration { color: #60a5fa; font-weight: 600; }
        .timestamp { color: #94a3b8; font-size: 0.9em; }
    </style>
</head>
<body>
    <h2>📊 TimiGS Activity Report</h2>
    <table>
        <thead>
            <tr>
                <th>Application</th>
                <th>Window Title</th>
                <th>Start Time</th>
                <th>End Time</th>
                <th>Duration</th>
            </tr>
        </thead>
        <tbody>
"#);

    let rows = stmt.query_map([start_date, end_date], |row| {
        let app_name: String = row.get(0)?;
        let window_title: String = row.get(1)?;
        let start_time: String = row.get(2)?;
        let end_time: Option<String> = row.get(3)?;
        let duration: i64 = row.get(4)?;
        Ok((app_name, window_title, start_time, end_time, duration))
    })?;

    for row in rows {
        if let Ok((app, title, start, end, dur)) = row {
            let hrs = dur / 3600;
            let mins = (dur % 3600) / 60;
            let secs = dur % 60;
            let duration_str = if hrs > 0 {
                format!("{}h {}m {}s", hrs, mins, secs)
            } else if mins > 0 {
                format!("{}m {}s", mins, secs)
            } else {
                format!("{}s", secs)
            };

            let escape = |s: &str| -> String {
                s.replace('&', "&amp;").replace('<', "&lt;").replace('>', "&gt;").replace('"', "&quot;")
            };

            html_content.push_str(&format!(
                r#"<tr>
                    <td><strong>{}</strong></td>
                    <td>{}</td>
                    <td class="timestamp">{}</td>
                    <td class="timestamp">{}</td>
                    <td class="duration">{}</td>
                </tr>"#,
                escape(&app),
                escape(&title),
                escape(&start),
                escape(&end.unwrap_or_else(|| "Now".to_string())),
                duration_str
            ));
        }
    }

    html_content.push_str(r#"
        </tbody>
    </table>
</body>
</html>"#);

    std::fs::write(path, html_content)
        .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;

    Ok(())
}

pub fn export_sessions_json(path: &str, start_date: &str, end_date: &str) -> Result<()> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let mut stmt = conn.prepare(
        "SELECT app_name, window_title, exe_path, start_time, end_time, duration_seconds
         FROM activity_sessions 
         WHERE date(start_time) >= date(?) AND date(start_time) <= date(?)
         ORDER BY start_time DESC",
    )?;

    let rows = stmt.query_map([start_date, end_date], |row| {
        let app_name: String = row.get(0)?;
        let window_title: String = row.get(1)?;
        let exe_path: String = row.get(2)?;
        let start_time: String = row.get(3)?;
        let end_time: Option<String> = row.get(4)?;
        let duration: i64 = row.get(5)?;
        Ok(serde_json::json!({
            "app_name": app_name,
            "window_title": window_title,
            "exe_path": exe_path,
            "start_time": start_time,
            "end_time": end_time,
            "duration_seconds": duration,
        }))
    })?;

    let mut activities = Vec::new();
    for row in rows {
        if let Ok(val) = row {
            activities.push(val);
        }
    }

    let json_content = serde_json::to_string_pretty(&activities)
        .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;

    std::fs::write(path, json_content)
        .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;

    Ok(())
}

pub fn import_sessions_json(path: &str) -> Result<usize> {
    let content = std::fs::read_to_string(path)
        .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;

    let sessions: Vec<serde_json::Value> = serde_json::from_str(&content)
        .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;

    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let mut count = 0;
    for session in sessions {
        let app_name = session["app_name"].as_str().unwrap_or("Unknown");
        let window_title = session["window_title"].as_str().unwrap_or("");
        let exe_path = session["exe_path"].as_str().unwrap_or("");
        let start_time = session["start_time"].as_str().unwrap_or("");
        let end_time = session["end_time"].as_str(); // Option<&str>
        let duration = session["duration_seconds"].as_i64().unwrap_or(0);

        let exists: i64 = conn.query_row(
            "SELECT count(*) FROM activity_sessions WHERE start_time = ?1 AND exe_path = ?2",
            params![start_time, exe_path],
            |row| row.get(0),
        ).unwrap_or(0);

        if exists == 0 {
            conn.execute(
                "INSERT INTO activity_sessions (app_name, window_title, exe_path, start_time, end_time, duration_seconds)
                 VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                params![
                    app_name,
                    window_title,
                    exe_path,
                    start_time,
                    end_time,
                    duration,
                ],
            )?;
            count += 1;
        }
    }

    Ok(count)
}

pub fn import_sessions_csv(path: &str) -> Result<usize> {
    let mut reader = csv::ReaderBuilder::new()
        .has_headers(true)
        .from_path(path)
        .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;

    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let mut count = 0;
    for result in reader.records() {
        if let Ok(record) = result {
            if record.len() < 6 {
                continue;
            }

            let app_name = &record[0];
            let window_title = &record[1];
            let exe_path = &record[2];
            let start_time = &record[3];
            let end_time_str = &record[4];
            let duration: i64 = record[5].parse().unwrap_or(0);

            let end_time = if end_time_str.trim().is_empty() {
                None
            } else {
                Some(end_time_str)
            };

            let exists: i64 = conn.query_row(
                "SELECT count(*) FROM activity_sessions WHERE start_time = ?1 AND exe_path = ?2",
                params![start_time, exe_path],
                |row| row.get(0),
            ).unwrap_or(0);

            if exists == 0 {
                conn.execute(
                    "INSERT INTO activity_sessions (app_name, window_title, exe_path, start_time, end_time, duration_seconds)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                    params![
                        app_name,
                        window_title,
                        exe_path,
                        start_time,
                        end_time,
                        duration,
                    ],
                )?;
                count += 1;
            }
        }
    }

    Ok(count)
}

pub fn import_sessions_markdown(path: &str) -> Result<usize> {
    let content = std::fs::read_to_string(path)
        .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;

    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let mut count = 0;
    
    for line in content.lines() {
        let line = line.trim();
        if line.starts_with('|') && !line.contains("---|") && !line.contains("App Name | Window Title") {
            let parts: Vec<&str> = line.split('|').map(|s| s.trim()).collect();
            if parts.len() >= 6 {
                let app_name = parts[1].replace("\\|", "|");
                let window_title = parts[2].replace("\\|", "|");
                let start_time = parts[3];
                let end_time_str = parts[4];
                let duration: i64 = parts[5].parse().unwrap_or(0);
                
                let end_time = if end_time_str.is_empty() { None } else { Some(end_time_str) };
                let exe_path = "imported_from_markdown";

                let exists: i64 = conn.query_row(
                    "SELECT count(*) FROM activity_sessions WHERE start_time = ?1 AND exe_path = ?2",
                    params![start_time, exe_path],
                    |row| row.get(0),
                ).unwrap_or(0);

                if exists == 0 {
                    conn.execute(
                        "INSERT INTO activity_sessions (app_name, window_title, exe_path, start_time, end_time, duration_seconds)
                         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                        params![app_name, window_title, exe_path, start_time, end_time, duration],
                    )?;
                    count += 1;
                }
            }
        }
    }
    
    Ok(count)
}

pub fn import_sessions_html(path: &str) -> Result<usize> {
    let content = std::fs::read_to_string(path)
        .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;
        
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let mut count = 0;
    
    for tr_block in content.split("<tr>").skip(2) {
        let td_parts: Vec<&str> = tr_block.split("</td>").collect();
        if td_parts.len() >= 5 {
            let app_name = td_parts[0].split("<strong>").nth(1).unwrap_or("").split("</strong>").next().unwrap_or("").trim()
                .replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", "\"");
            
            let window_title = td_parts[1].split("<td>").nth(1).unwrap_or("").trim()
                .replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", "\"");
            
            let start_time = td_parts[2].split("\">").nth(1).unwrap_or("").trim()
                .replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", "\"");
            
            let end_time_str = td_parts[3].split("\">").nth(1).unwrap_or("").trim()
                .replace("&amp;", "&").replace("&lt;", "<").replace("&gt;", ">").replace("&quot;", "\"");
            
            let end_time = if end_time_str == "Now" || end_time_str.is_empty() { None } else { Some(end_time_str.as_str()) };
            
            let duration_str = td_parts[4].split("\">").nth(1).unwrap_or("").trim();
            let mut duration: i64 = 0;
            for part in duration_str.split_whitespace() {
                 let num = part.trim_end_matches(&['h', 'm', 's'][..]).parse::<i64>().unwrap_or(0);
                 if part.ends_with('h') { duration += num * 3600; }
                 else if part.ends_with('m') { duration += num * 60; }
                 else if part.ends_with('s') { duration += num; }
            }
            
            let exe_path = "imported_from_html";

            let exists: i64 = conn.query_row(
                "SELECT count(*) FROM activity_sessions WHERE start_time = ?1 AND exe_path = ?2",
                params![start_time, exe_path],
                |row| row.get(0),
            ).unwrap_or(0);

            if exists == 0 && !app_name.is_empty() {
                conn.execute(
                    "INSERT INTO activity_sessions (app_name, window_title, exe_path, start_time, end_time, duration_seconds)
                     VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
                    params![app_name, window_title, exe_path, start_time, end_time, duration],
                )?;
                count += 1;
            }
        }
    }
    
    Ok(count)
}

pub fn export_sessions_markdown(path: &str, start_date: &str, end_date: &str) -> Result<()> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let mut stmt = conn.prepare(
        "SELECT app_name, window_title, exe_path, start_time, end_time, duration_seconds
         FROM activity_sessions 
         WHERE date(start_time) >= date(?) AND date(start_time) <= date(?)
         ORDER BY start_time DESC",
    )?;

    let mut md_content = String::from("# TimiGS Activity Report\n\n");
    md_content.push_str("| App Name | Window Title | Start Time | End Time | Duration (seconds) |\n");
    md_content.push_str("|---|---|---|---|---|\n");

    let rows = stmt.query_map([start_date, end_date], |row| {
        let app_name: String = row.get(0)?;
        let window_title: String = row.get(1)?;
        let exe_path: String = row.get(2)?;
        let start_time: String = row.get(3)?;
        let end_time: Option<String> = row.get(4)?;
        let duration: i64 = row.get(5)?;
        Ok((
            app_name,
            window_title,
            exe_path,
            start_time,
            end_time,
            duration,
        ))
    })?;

    for row in rows {
        if let Ok((app, title, _exe, start, end, dur)) = row {
            let escape = |s: &str| -> String {
                s.replace('|', "\\|")
            };
            md_content.push_str(&format!(
                "| {} | {} | {} | {} | {} |\n",
                escape(&app),
                escape(&title),
                escape(&start),
                escape(&end.unwrap_or_default()),
                dur
            ));
        }
    }

    std::fs::write(path, md_content)
        .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;

    Ok(())
}

pub fn auto_export_if_needed() -> Result<()> {
    let settings = get_settings();

    if !settings.auto_export_enabled || settings.auto_export_folder.is_empty() {
        return Ok(());
    }

    let now = Local::now();
    let last_export = settings.last_export_time
        .and_then(|s| DateTime::parse_from_rfc3339(&s).ok())
        .map(|dt| dt.with_timezone(&Local));

    let should_export = match last_export {
        None => true,
        Some(last) => {
            let elapsed = now.signed_duration_since(last).num_hours();
            elapsed >= settings.auto_export_interval_hours
        }
    };

    if should_export {
        let timestamp = now.format("%Y-%m-%d_%H-%M-%S").to_string();
        let filename = format!("TimiGS_Activity_{}.html", timestamp);
        let export_path = PathBuf::from(&settings.auto_export_folder).join(filename);

        std::fs::create_dir_all(&settings.auto_export_folder)
            .map_err(|e| rusqlite::Error::ToSqlConversionFailure(Box::new(e)))?;

        export_sessions_html(export_path.to_str().unwrap(), "1970-01-01", "2099-12-31")?;

        save_last_export_time(&now.to_rfc3339())?;
    }

    Ok(())
}

fn save_last_export_time(time: &str) -> Result<()> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;
    conn.execute(
        "INSERT OR REPLACE INTO settings (key, value) VALUES ('last_export_time', ?1)",
        [time],
    )?;
    Ok(())
}

/// Get all activity sessions (for export/sync)
pub fn get_all_activity() -> Result<Vec<ActivitySession>> {
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
        .filter_map(|r| r.ok())
        .collect();

    Ok(sessions)
}

// Music Sessions Functions

pub fn start_music_session(app_name: &str, window_title: Option<&str>, exe_path: &str) -> Result<i64> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let now = Local::now();
    conn.execute(
        "INSERT INTO music_sessions (app_name, window_title, exe_path, start_time) VALUES (?1, ?2, ?3, ?4)",
        params![app_name, window_title, exe_path, now.to_rfc3339()],
    )?;

    Ok(conn.last_insert_rowid())
}

pub fn end_music_session(id: i64) -> Result<()> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let now = Local::now();

    // Get start time to calculate duration
    let start_time: String = conn.query_row(
        "SELECT start_time FROM music_sessions WHERE id = ?1",
        [id],
        |row| row.get(0),
    )?;

    if let Ok(start) = DateTime::parse_from_rfc3339(&start_time) {
        let duration = (now - start.with_timezone(&Local)).num_seconds();
        conn.execute(
            "UPDATE music_sessions SET end_time = ?1, duration_seconds = ?2 WHERE id = ?3",
            params![now.to_rfc3339(), duration, id],
        )?;
    }

    Ok(())
}

pub fn end_music_session_retroactive(id: i64, end_time: DateTime<Local>) -> Result<()> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let start_time: String = conn.query_row(
        "SELECT start_time FROM music_sessions WHERE id = ?1",
        [id],
        |row| row.get(0),
    )?;

    if let Ok(start) = DateTime::parse_from_rfc3339(&start_time) {
        let duration = (end_time - start.with_timezone(&Local)).num_seconds();
        let duration = std::cmp::max(0, duration);
        conn.execute(
            "UPDATE music_sessions SET end_time = ?1, duration_seconds = ?2 WHERE id = ?3",
            params![end_time.to_rfc3339(), duration, id],
        )?;
    }

    Ok(())
}

pub fn get_today_music_summary() -> Result<Vec<MusicAppUsage>> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let today = Local::now().date_naive();

    let mut stmt = conn.prepare(
        "SELECT app_name, exe_path, SUM(duration_seconds) as total, COUNT(*) as count
         FROM music_sessions
         WHERE date(start_time) = date(?1)
         GROUP BY app_name
         ORDER BY total DESC",
    )?;

    let summaries = stmt
        .query_map([today.to_string()], |row| {
            Ok(MusicAppUsage {
                app_name: row.get(0)?,
                exe_path: row.get(1)?,
                total_seconds: row.get(2)?,
                session_count: row.get(3)?,
            })
        })?
        .collect::<Result<Vec<_>>>()?;

    Ok(summaries)
}

pub fn get_today_music_sessions() -> Result<Vec<MusicSession>> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let today = Local::now().date_naive();
    let start_of_day = today.and_hms_opt(0, 0, 0).unwrap();

    let mut stmt = conn.prepare(
        "SELECT id, app_name, window_title, exe_path, start_time, end_time, duration_seconds
         FROM music_sessions
         WHERE date(start_time) = date(?1)
         ORDER BY start_time DESC",
    )?;

    let sessions = stmt
        .query_map([start_of_day.to_string()], |row| {
            Ok(MusicSession {
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

pub fn get_music_sessions_range(from: NaiveDate, to: NaiveDate) -> Result<Vec<MusicSession>> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    // Use date() function for proper date comparison
    let from_date_str = from.format("%Y-%m-%d").to_string();
    let to_date_str = to.format("%Y-%m-%d").to_string();

    let mut stmt = conn.prepare(
        "SELECT id, app_name, window_title, exe_path, start_time, end_time, duration_seconds
         FROM music_sessions
         WHERE date(start_time) >= date(?1) AND date(start_time) <= date(?2)
         ORDER BY start_time DESC",
    )?;

    let sessions = stmt
        .query_map(
            [from_date_str, to_date_str],
            |row| {
                Ok(MusicSession {
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
            },
        )?
        .collect::<Result<Vec<_>>>()?;

    Ok(sessions)
}

pub fn get_total_music_time_today() -> Result<i64> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let today = Local::now().date_naive();

    let total: Option<i64> = conn.query_row(
        "SELECT SUM(duration_seconds) FROM music_sessions WHERE date(start_time) = date(?1)",
        [today.to_string()],
        |row| row.get(0),
    ).ok();

    Ok(total.unwrap_or(0))
}

// ── Coding Session Functions ──

pub fn start_coding_session(
    app_name: &str,
    editor_name: &str,
    file_path: Option<&str>,
    language: Option<&str>,
    project_dir: Option<&str>,
    is_ai_assisted: bool,
    window_title: &str,
    exe_path: &str,
) -> Result<i64> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let now = Local::now();
    let ai_flag: i64 = if is_ai_assisted { 1 } else { 0 };
    conn.execute(
        "INSERT INTO coding_sessions \
         (app_name, editor_name, file_path, language, project_dir, is_ai_assisted, window_title, exe_path, start_time) \
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)",
        params![
            app_name,
            editor_name,
            file_path,
            language,
            project_dir,
            ai_flag,
            window_title,
            exe_path,
            now.to_rfc3339()
        ],
    )?;

    Ok(conn.last_insert_rowid())
}

pub fn end_coding_session(id: i64) -> Result<()> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let now = Local::now();

    let start_time: String = conn.query_row(
        "SELECT start_time FROM coding_sessions WHERE id = ?1",
        [id],
        |row| row.get(0),
    )?;

    if let Ok(start) = DateTime::parse_from_rfc3339(&start_time) {
        let duration = (now - start.with_timezone(&Local)).num_seconds();
        conn.execute(
            "UPDATE coding_sessions SET end_time = ?1, duration_seconds = ?2 WHERE id = ?3",
            params![now.to_rfc3339(), duration, id],
        )?;
    }

    Ok(())
}

pub fn end_coding_session_retroactive(id: i64, end_time: DateTime<Local>) -> Result<()> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let start_time: String = conn.query_row(
        "SELECT start_time FROM coding_sessions WHERE id = ?1",
        [id],
        |row| row.get(0),
    )?;

    if let Ok(start) = DateTime::parse_from_rfc3339(&start_time) {
        let duration = (end_time - start.with_timezone(&Local)).num_seconds();
        let duration = std::cmp::max(0, duration);
        conn.execute(
            "UPDATE coding_sessions SET end_time = ?1, duration_seconds = ?2 WHERE id = ?3",
            params![end_time.to_rfc3339(), duration, id],
        )?;
    }

    Ok(())
}

pub fn get_today_coding_sessions() -> Result<Vec<CodingSession>> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let today = Local::now().date_naive();
    let start_of_day = today.and_hms_opt(0, 0, 0).unwrap();

    let mut stmt = conn.prepare(
        "SELECT id, app_name, editor_name, file_path, language, project_dir, \
                is_ai_assisted, window_title, exe_path, start_time, end_time, duration_seconds \
         FROM coding_sessions \
         WHERE date(start_time) = date(?1) \
         ORDER BY start_time DESC",
    )?;

    let sessions = stmt
        .query_map([start_of_day.to_string()], |row| {
            Ok(CodingSession {
                id: row.get(0)?,
                app_name: row.get(1)?,
                editor_name: row.get(2)?,
                file_path: row.get(3)?,
                language: row.get(4)?,
                project_dir: row.get(5)?,
                is_ai_assisted: row.get::<_, i64>(6)? != 0,
                window_title: row.get(7)?,
                exe_path: row.get(8)?,
                start_time: row.get(9)?,
                end_time: row.get(10)?,
                duration_seconds: row.get(11)?,
            })
        })?
        .collect::<Result<Vec<_>>>()?;

    Ok(sessions)
}

pub fn get_coding_sessions_range(from: &str, to: &str) -> Result<Vec<CodingSession>> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let mut stmt = conn.prepare(
        "SELECT id, app_name, editor_name, file_path, language, project_dir, \
                is_ai_assisted, window_title, exe_path, start_time, end_time, duration_seconds \
         FROM coding_sessions \
         WHERE date(start_time) >= date(?1) AND date(start_time) <= date(?2) \
         ORDER BY start_time DESC",
    )?;

    let sessions = stmt
        .query_map(params![from, to], |row| {
            Ok(CodingSession {
                id: row.get(0)?,
                app_name: row.get(1)?,
                editor_name: row.get(2)?,
                file_path: row.get(3)?,
                language: row.get(4)?,
                project_dir: row.get(5)?,
                is_ai_assisted: row.get::<_, i64>(6)? != 0,
                window_title: row.get(7)?,
                exe_path: row.get(8)?,
                start_time: row.get(9)?,
                end_time: row.get(10)?,
                duration_seconds: row.get(11)?,
            })
        })?
        .collect::<Result<Vec<_>>>()?;

    Ok(sessions)
}

pub fn get_coding_stats_today() -> Result<Vec<CodingStats>> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let today = Local::now().date_naive();

    let mut stmt = conn.prepare(
        "SELECT \
             COALESCE(language, 'Unknown') as lang, \
             SUM(duration_seconds) as total, \
             SUM(CASE WHEN is_ai_assisted = 1 THEN duration_seconds ELSE 0 END) as ai_secs, \
             SUM(CASE WHEN is_ai_assisted = 0 THEN duration_seconds ELSE 0 END) as manual_secs, \
             COUNT(*) as cnt \
         FROM coding_sessions \
         WHERE date(start_time) = date(?1) \
         GROUP BY lang \
         ORDER BY total DESC",
    )?;

    let stats = stmt
        .query_map([today.to_string()], |row| {
            Ok(CodingStats {
                language: row.get(0)?,
                total_seconds: row.get(1)?,
                ai_seconds: row.get(2)?,
                manual_seconds: row.get(3)?,
                session_count: row.get(4)?,
            })
        })?
        .collect::<Result<Vec<_>>>()?;

    Ok(stats)
}

pub fn get_coding_project_stats_today() -> Result<Vec<CodingProjectStats>> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let today = Local::now().date_naive();

    let mut stmt = conn.prepare(
        "SELECT \
             COALESCE(project_dir, 'Unknown') as proj, \
             SUM(duration_seconds) as total, \
             SUM(CASE WHEN is_ai_assisted = 1 THEN duration_seconds ELSE 0 END) as ai_secs, \
             COUNT(*) as cnt \
         FROM coding_sessions \
         WHERE date(start_time) = date(?1) \
         GROUP BY proj \
         ORDER BY total DESC",
    )?;

    let stats = stmt
        .query_map([today.to_string()], |row| {
            Ok(CodingProjectStats {
                project_dir: row.get(0)?,
                total_seconds: row.get(1)?,
                ai_seconds: row.get(2)?,
                session_count: row.get(3)?,
            })
        })?
        .collect::<Result<Vec<_>>>()?;

    Ok(stats)
}

pub fn get_total_coding_time_today() -> Result<i64> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let today = Local::now().date_naive();

    let total: Option<i64> = conn.query_row(
        "SELECT SUM(duration_seconds) FROM coding_sessions WHERE date(start_time) = date(?1)",
        [today.to_string()],
        |row| row.get(0),
    ).ok();

    Ok(total.unwrap_or(0))
}

pub fn get_total_ai_coding_time_today() -> Result<i64> {
    let guard = DB.lock();
    let conn = guard.as_ref().ok_or(rusqlite::Error::InvalidQuery)?;

    let today = Local::now().date_naive();

    let total: Option<i64> = conn.query_row(
        "SELECT SUM(duration_seconds) FROM coding_sessions \
         WHERE date(start_time) = date(?1) AND is_ai_assisted = 1",
        [today.to_string()],
        |row| row.get(0),
    ).ok();

    Ok(total.unwrap_or(0))
}

#[test]
fn test_inspect_db() {
    let db_path = get_db_path();
    println!("Database path: {:?}", db_path);
    let conn = Connection::open(&db_path).unwrap();
    
    // Daily totals
    println!("\n--- Daily Totals ---");
    let mut stmt = conn.prepare("
        SELECT date(start_time) as day, SUM(duration_seconds) as total_sec, COUNT(*) as session_count
        FROM activity_sessions
        GROUP BY day
        ORDER BY day DESC
        LIMIT 15
    ").unwrap();
    let mut rows = stmt.query([]).unwrap();
    while let Some(row) = rows.next().unwrap() {
        let day: String = row.get(0).unwrap();
        let total_sec: Option<i64> = row.get(1).unwrap();
        let count: i64 = row.get(2).unwrap();
        let total_sec = total_sec.unwrap_or(0);
        println!("Date: {} | Total Hours: {:.2} | Sessions: {}", day, total_sec as f64 / 3600.0, count);
    }
    
    // Check GetLastInputInfo
    #[cfg(target_os = "windows")]
    {
        use windows::Win32::UI::Input::KeyboardAndMouse::{GetLastInputInfo, LASTINPUTINFO};
        #[link(name = "kernel32")]
        extern "system" {
            fn GetTickCount() -> u32;
        }

        let mut lii = LASTINPUTINFO::default();
        lii.cbSize = std::mem::size_of::<LASTINPUTINFO>() as u32;
        unsafe {
            if GetLastInputInfo(&mut lii).as_bool() {
                let tick_count = GetTickCount();
                let idle_millis = tick_count.wrapping_sub(lii.dwTime);
                println!("GetLastInputInfo succeeded! dwTime: {}, current tick: {}, idle ms: {}", lii.dwTime, tick_count, idle_millis);
            } else {
                println!("GetLastInputInfo failed!");
            }
        }
    }
}

