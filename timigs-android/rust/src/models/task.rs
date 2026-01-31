//! Task/Goal model

use chrono::{DateTime, Utc};
use flutter_rust_bridge::frb;
use serde::{Deserialize, Serialize};

/// Task status enum
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[frb(dart_metadata=("freezed"))]
pub enum TaskStatus {
    Active,
    Completed,
    Paused,
    Cancelled,
}

impl Default for TaskStatus {
    fn default() -> Self {
        Self::Active
    }
}

/// Usage goal/task for an app
#[derive(Debug, Clone, Serialize, Deserialize)]
#[frb(dart_metadata=("freezed"))]
pub struct Task {
    pub id: i64,
    pub app_name: String,
    pub description: Option<String>,
    pub goal_seconds: i64,
    pub created_at: DateTime<Utc>,
    pub status: TaskStatus,
    pub title_filter: Option<String>,
}

impl Task {
    pub fn is_active(&self) -> bool {
        self.status == TaskStatus::Active
    }

    /// Calculate progress percentage given actual seconds
    pub fn progress_percentage(&self, actual_seconds: i64) -> f64 {
        if self.goal_seconds == 0 {
            100.0
        } else {
            ((actual_seconds as f64 / self.goal_seconds as f64) * 100.0).min(100.0)
        }
    }
}

/// Input for creating a new task
#[derive(Debug, Clone, Serialize, Deserialize)]
#[frb(dart_metadata=("freezed"))]
pub struct NewTask {
    pub app_name: String,
    pub description: Option<String>,
    pub goal_seconds: i64,
    pub title_filter: Option<String>,
}
