//! Daily statistics model

use chrono::NaiveDate;
use flutter_rust_bridge::frb;
use serde::{Deserialize, Serialize};

/// Daily usage statistics
#[derive(Debug, Clone, Serialize, Deserialize)]
#[frb(dart_metadata=("freezed"))]
pub struct DailyStats {
    pub date: NaiveDate,
    pub total_seconds: i64,
    pub app_count: i64,
}

impl DailyStats {
    pub fn new(date: NaiveDate, total_seconds: i64, app_count: i64) -> Self {
        Self {
            date,
            total_seconds,
            app_count,
        }
    }

    /// Format duration as hours and minutes
    pub fn formatted_duration(&self) -> String {
        let hours = self.total_seconds / 3600;
        let minutes = (self.total_seconds % 3600) / 60;
        if hours > 0 {
            format!("{}h {}m", hours, minutes)
        } else {
            format!("{}m", minutes)
        }
    }
}

/// Weekly trend data
#[derive(Debug, Clone, Serialize, Deserialize)]
#[frb(dart_metadata=("freezed"))]
pub struct WeeklyTrend {
    pub daily_stats: Vec<DailyStats>,
    pub total_seconds: i64,
    pub average_seconds: i64,
    pub most_active_day: Option<NaiveDate>,
}
