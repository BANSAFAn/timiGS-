//! Database connection management
//!
//! Thread-safe database connection pool with proper error handling.

use anyhow::{Context, Result};
use once_cell::sync::Lazy;
use rusqlite::Connection;
use std::path::PathBuf;
use std::sync::Mutex;

use super::migrations::run_migrations;

/// Global database connection (thread-safe)
static DATABASE: Lazy<Mutex<Option<Connection>>> = Lazy::new(|| Mutex::new(None));

/// Database path storage
static DB_PATH: Lazy<Mutex<Option<PathBuf>>> = Lazy::new(|| Mutex::new(None));

/// Maximum allowed path length for security
const MAX_PATH_LENGTH: usize = 4096;

/// Initialize database with given path
///
/// # Security
/// - Validates path length to prevent buffer overflow attacks
/// - Creates parent directories safely
/// - Uses parameterized queries in migrations
pub fn init_database(path: String) -> Result<()> {
    // Input validation: check path length
    if path.is_empty() {
        anyhow::bail!("Database path cannot be empty");
    }
    if path.len() > MAX_PATH_LENGTH {
        anyhow::bail!("Database path exceeds maximum allowed length");
    }

    let path_buf = PathBuf::from(&path);

    // Security: ensure path doesn't contain null bytes
    if path.contains('\0') {
        anyhow::bail!("Invalid characters in database path");
    }

    // Create parent directory if needed
    if let Some(parent) = path_buf.parent() {
        std::fs::create_dir_all(parent).context("Failed to create database directory")?;
    }

    let conn = Connection::open(&path_buf).context("Failed to open database connection")?;

    // Enable SQLite security features
    conn.execute_batch(
        "PRAGMA journal_mode = WAL;
         PRAGMA synchronous = NORMAL;
         PRAGMA foreign_keys = ON;
         PRAGMA secure_delete = ON;",
    )
    .context("Failed to set database pragmas")?;

    // Run migrations
    run_migrations(&conn).context("Failed to run database migrations")?;

    // Store connection and path (with proper error handling)
    {
        let mut path_guard = DB_PATH
            .lock()
            .map_err(|e| anyhow::anyhow!("Failed to acquire path lock: {}", e))?;
        *path_guard = Some(path_buf);
    }

    {
        let mut db_guard = DATABASE
            .lock()
            .map_err(|e| anyhow::anyhow!("Failed to acquire database lock: {}", e))?;
        *db_guard = Some(conn);
    }

    log::info!("Database initialized securely");
    Ok(())
}

/// Get database connection with proper error handling
///
/// # Errors
/// Returns error if database is not initialized or lock is poisoned.
pub fn get_connection() -> Result<std::sync::MutexGuard<'static, Option<Connection>>> {
    let guard = DATABASE
        .lock()
        .map_err(|e| anyhow::anyhow!("Database lock poisoned: {}", e))?;

    if guard.is_none() {
        anyhow::bail!("Database not initialized. Call init_database first.");
    }
    Ok(guard)
}

/// Execute with connection (helper pattern)
///
/// Provides safe access to database connection with automatic lock management.
pub fn with_connection<F, T>(f: F) -> Result<T>
where
    F: FnOnce(&Connection) -> Result<T>,
{
    let guard = get_connection()?;
    let conn = guard
        .as_ref()
        .ok_or_else(|| anyhow::anyhow!("Database connection unavailable"))?;
    f(conn)
}

/// Close database connection safely
pub fn close_database() -> Result<()> {
    let mut guard = DATABASE
        .lock()
        .map_err(|e| anyhow::anyhow!("Failed to acquire database lock: {}", e))?;

    if let Some(conn) = guard.take() {
        // Ensure all pending writes are flushed
        drop(conn);
    }

    log::info!("Database closed safely");
    Ok(())
}

/// Get database file path (if available)
pub fn get_database_path() -> Option<PathBuf> {
    DB_PATH.lock().ok().and_then(|guard| guard.clone())
}
