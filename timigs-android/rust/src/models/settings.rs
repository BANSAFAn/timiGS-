//! Application settings model

use flutter_rust_bridge::frb;
use serde::{Deserialize, Serialize};

/// Application settings
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
#[frb(dart_metadata=("freezed"))]
pub struct AppSettings {
    pub theme: String,
    pub language: String,
    pub tracking_enabled: bool,
    pub tracking_interval_seconds: i64,
    pub auto_start_tracking: bool,
    pub sync_enabled: bool,
    pub sync_provider: Option<String>,
    pub notification_enabled: bool,
}

impl AppSettings {
    pub fn new() -> Self {
        Self {
            theme: "system".to_string(),
            language: "en".to_string(),
            tracking_enabled: true,
            tracking_interval_seconds: 5,
            auto_start_tracking: false,
            sync_enabled: false,
            sync_provider: None,
            notification_enabled: true,
        }
    }

    /// Check if dark theme
    pub fn is_dark_theme(&self) -> bool {
        self.theme == "dark"
    }
}

/// Single setting key-value pair
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SettingEntry {
    pub key: String,
    pub value: String,
}
