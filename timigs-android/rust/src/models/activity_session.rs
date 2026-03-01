//! Activity session model

use chrono::{DateTime, Utc};
use flutter_rust_bridge::frb;
use serde::{Deserialize, Serialize};

/// Represents a single app usage session
#[derive(Debug, Clone, Serialize, Deserialize)]
#[frb(dart_metadata=("freezed"))]
pub struct ActivitySession {
    pub id: i64,
    pub app_name: String,
    pub window_title: String,
    pub exe_path: String,
    pub start_time: DateTime<Utc>,
    pub end_time: Option<DateTime<Utc>>,
    pub duration_seconds: i64,
}

impl ActivitySession {
    pub fn new(
        id: i64,
        app_name: String,
        window_title: String,
        exe_path: String,
        start_time: DateTime<Utc>,
    ) -> Self {
        Self {
            id,
            app_name,
            window_title,
            exe_path,
            start_time,
            end_time: None,
            duration_seconds: 0,
        }
    }

    /// Calculate duration from start to end time
    pub fn calculate_duration(&self) -> i64 {
        if let Some(end) = self.end_time {
            (end - self.start_time).num_seconds()
        } else {
            0
        }
    }
}

/// Input for creating a new session (without id)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[frb(dart_metadata=("freezed"))]
pub struct NewSession {
    pub app_name: String,
    pub window_title: String,
    pub exe_path: String,
}
