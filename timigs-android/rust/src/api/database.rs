//! Database API - initialization and management

use crate::db;
use flutter_rust_bridge::frb;

/// Initialize the database at the given path
///
/// Should be called once at app startup with the path to the database file.
/// Example path: /data/data/com.timigs.android/databases/activity.db
#[frb(sync)]
pub fn init_database(path: String) -> Result<(), String> {
    db::init_database(path).map_err(|e| e.to_string())
}

/// Close the database connection
///
/// Should be called when the app is closing to ensure data is saved.
#[frb(sync)]
pub fn close_database() -> Result<(), String> {
    db::close_database().map_err(|e| e.to_string())
}

/// Get the database file path for export/backup
#[frb(sync)]
pub fn get_database_path() -> Option<String> {
    db::get_database_path().map(|p| p.to_string_lossy().to_string())
}
