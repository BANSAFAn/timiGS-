//! App usage summary model

use flutter_rust_bridge::frb;
use serde::{Deserialize, Serialize};

/// Summary of app usage for a period
#[derive(Debug, Clone, Serialize, Deserialize)]
#[frb(dart_metadata=("freezed"))]
pub struct AppUsageSummary {
    pub app_name: String,
    pub exe_path: String,
    pub total_seconds: i64,
    pub session_count: i64,
}

impl AppUsageSummary {
    pub fn new(app_name: String, exe_path: String, total_seconds: i64, session_count: i64) -> Self {
        Self {
            app_name,
            exe_path,
            total_seconds,
            session_count,
        }
    }

    /// Format duration as HH:MM:SS
    pub fn formatted_duration(&self) -> String {
        let hours = self.total_seconds / 3600;
        let minutes = (self.total_seconds % 3600) / 60;
        let seconds = self.total_seconds % 60;
        format!("{:02}:{:02}:{:02}", hours, minutes, seconds)
    }

    /// Calculate percentage of total time
    pub fn percentage_of(&self, total_seconds: i64) -> f64 {
        if total_seconds == 0 {
            0.0
        } else {
            (self.total_seconds as f64 / total_seconds as f64) * 100.0
        }
    }
}
