//! Settings API
//!
//! Secure settings management with input validation.

use anyhow::{Context, Result};
use flutter_rust_bridge::frb;

use crate::db::with_connection;
use crate::models::AppSettings;

/// Maximum key/value length
const MAX_KEY_LENGTH: usize = 128;
const MAX_VALUE_LENGTH: usize = 4096;

/// Allowed setting keys (whitelist approach)
const ALLOWED_KEYS: &[&str] = &[
    "theme",
    "language",
    "tracking_enabled",
    "tracking_interval_seconds",
    "auto_start_tracking",
    "sync_enabled",
    "sync_provider",
    "notification_enabled",
];

/// Validate setting key
fn validate_key(key: &str) -> Result<(), String> {
    if key.is_empty() || key.len() > MAX_KEY_LENGTH {
        return Err("Invalid key length".to_string());
    }
    if key.contains('\0') || key.contains(';') || key.contains('\'') {
        return Err("Invalid characters in key".to_string());
    }
    // Whitelist check for known keys
    if !ALLOWED_KEYS.contains(&key) {
        return Err(format!("Unknown setting key: {}", key));
    }
    Ok(())
}

/// Validate setting value
fn validate_value(value: &str) -> Result<(), String> {
    if value.len() > MAX_VALUE_LENGTH {
        return Err("Value exceeds maximum length".to_string());
    }
    if value.contains('\0') {
        return Err("Invalid characters in value".to_string());
    }
    Ok(())
}

/// Get all settings
#[frb]
pub fn get_settings() -> Result<AppSettings, String> {
    with_connection(|conn| {
        let mut stmt = conn
            .prepare("SELECT key, value FROM settings")
            .context("Failed to prepare settings query")?;

        let mut settings = AppSettings::new();

        let rows = stmt
            .query_map([], |row| {
                Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?))
            })
            .context("Failed to query settings")?;

        for row in rows {
            let (key, value) = row.context("Failed to parse setting row")?;
            match key.as_str() {
                "theme" => settings.theme = sanitize_string(&value, 64),
                "language" => settings.language = sanitize_string(&value, 16),
                "tracking_enabled" => settings.tracking_enabled = value == "true",
                "tracking_interval_seconds" => {
                    settings.tracking_interval_seconds = value.parse().unwrap_or(5).clamp(1, 3600)
                    // 1 second to 1 hour
                }
                "auto_start_tracking" => settings.auto_start_tracking = value == "true",
                "sync_enabled" => settings.sync_enabled = value == "true",
                "sync_provider" => {
                    settings.sync_provider = if value.is_empty() {
                        None
                    } else {
                        Some(sanitize_string(&value, 64))
                    }
                }
                "notification_enabled" => settings.notification_enabled = value == "true",
                _ => {} // Ignore unknown keys
            }
        }

        Ok(settings)
    })
    .map_err(|e| e.to_string())
}

/// Save all settings
#[frb]
pub fn save_settings(settings: AppSettings) -> Result<(), String> {
    // Validate all values before saving
    if settings.theme.len() > 64 || settings.language.len() > 16 {
        return Err("Invalid settings values".to_string());
    }

    with_connection(|conn| {
        let entries = vec![
            ("theme", settings.theme),
            ("language", settings.language),
            ("tracking_enabled", settings.tracking_enabled.to_string()),
            (
                "tracking_interval_seconds",
                settings
                    .tracking_interval_seconds
                    .clamp(1, 3600)
                    .to_string(),
            ),
            (
                "auto_start_tracking",
                settings.auto_start_tracking.to_string(),
            ),
            ("sync_enabled", settings.sync_enabled.to_string()),
            ("sync_provider", settings.sync_provider.unwrap_or_default()),
            (
                "notification_enabled",
                settings.notification_enabled.to_string(),
            ),
        ];

        for (key, value) in entries {
            conn.execute(
                "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
                rusqlite::params![key, value],
            )
            .context("Failed to save setting")?;
        }

        Ok(())
    })
    .map_err(|e| e.to_string())
}

/// Get a single setting value
#[frb]
pub fn get_setting(key: String) -> Result<Option<String>, String> {
    validate_key(&key)?;

    with_connection(|conn| {
        let result: std::result::Result<String, _> = conn.query_row(
            "SELECT value FROM settings WHERE key = ?1",
            rusqlite::params![key],
            |row| row.get(0),
        );

        match result {
            Ok(value) => Ok(Some(value)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(e.into()),
        }
    })
    .map_err(|e| e.to_string())
}

/// Save a single setting
#[frb]
pub fn save_setting(key: String, value: String) -> Result<(), String> {
    validate_key(&key)?;
    validate_value(&value)?;

    with_connection(|conn| {
        conn.execute(
            "INSERT OR REPLACE INTO settings (key, value) VALUES (?1, ?2)",
            rusqlite::params![key, value],
        )
        .context("Failed to save setting")?;
        Ok(())
    })
    .map_err(|e| e.to_string())
}

/// Sanitize string to max length (trim, no null bytes)
fn sanitize_string(s: &str, max_len: usize) -> String {
    s.chars().filter(|c| *c != '\0').take(max_len).collect()
}
