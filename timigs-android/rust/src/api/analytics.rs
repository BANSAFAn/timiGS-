//! Analytics API
//!
//! Secure analytics calculations with input validation.

use anyhow::{Context, Result};
use chrono::{Datelike, NaiveDate, Utc};
use flutter_rust_bridge::frb;

use crate::db::with_connection;
use crate::models::{AppUsageSummary, DailyStats, WeeklyTrend};

/// Maximum results to return (prevents DoS)
const MAX_RESULTS: i32 = 1000;
const MAX_DAYS: i32 = 365;

/// Get app usage summary for today
#[frb]
pub fn get_today_summary() -> Result<Vec<AppUsageSummary>, String> {
    with_connection(|conn| {
        let today = Utc::now().date_naive().format("%Y-%m-%d").to_string();

        let mut stmt = conn
            .prepare(
                "SELECT app_name, exe_path, 
                    SUM(duration_seconds) as total_seconds, 
                    COUNT(*) as session_count
             FROM activity_sessions
             WHERE date(start_time) = date(?1)
             GROUP BY app_name
             ORDER BY total_seconds DESC
             LIMIT ?2",
            )
            .context("Failed to prepare query")?;

        let summaries = stmt
            .query_map(rusqlite::params![today, MAX_RESULTS], |row| {
                Ok(AppUsageSummary {
                    app_name: row.get(0)?,
                    exe_path: row.get(1)?,
                    total_seconds: row.get::<_, i64>(2)?.max(0),
                    session_count: row.get::<_, i64>(3)?.max(0),
                })
            })
            .context("Failed to execute query")?
            .collect::<std::result::Result<Vec<_>, _>>()
            .context("Failed to parse results")?;

        Ok(summaries)
    })
    .map_err(|e| e.to_string())
}

/// Get app usage summary for a specific date
#[frb]
pub fn get_summary_for_date(
    year: i32,
    month: u32,
    day: u32,
) -> Result<Vec<AppUsageSummary>, String> {
    // Input validation
    if year < 1970 || year > 2100 {
        return Err("Invalid year".to_string());
    }
    if month < 1 || month > 12 {
        return Err("Invalid month".to_string());
    }
    if day < 1 || day > 31 {
        return Err("Invalid day".to_string());
    }

    with_connection(|conn| {
        let date = NaiveDate::from_ymd_opt(year, month, day)
            .ok_or_else(|| anyhow::anyhow!("Invalid date"))?;
        let date_str = date.format("%Y-%m-%d").to_string();

        let mut stmt = conn
            .prepare(
                "SELECT app_name, exe_path, 
                    SUM(duration_seconds) as total_seconds, 
                    COUNT(*) as session_count
             FROM activity_sessions
             WHERE date(start_time) = date(?1)
             GROUP BY app_name
             ORDER BY total_seconds DESC
             LIMIT ?2",
            )
            .context("Failed to prepare query")?;

        let summaries = stmt
            .query_map(rusqlite::params![date_str, MAX_RESULTS], |row| {
                Ok(AppUsageSummary {
                    app_name: row.get(0)?,
                    exe_path: row.get(1)?,
                    total_seconds: row.get::<_, i64>(2)?.max(0),
                    session_count: row.get::<_, i64>(3)?.max(0),
                })
            })
            .context("Failed to execute query")?
            .collect::<std::result::Result<Vec<_>, _>>()
            .context("Failed to parse results")?;

        Ok(summaries)
    })
    .map_err(|e| e.to_string())
}

/// Get weekly statistics (last 7 days)
#[frb]
pub fn get_weekly_stats() -> Result<Vec<DailyStats>, String> {
    with_connection(|conn| {
        let mut stmt = conn
            .prepare(
                "SELECT date(start_time) as date,
                    SUM(duration_seconds) as total_seconds,
                    COUNT(DISTINCT app_name) as app_count
             FROM activity_sessions
             WHERE start_time >= datetime('now', '-7 days')
             GROUP BY date(start_time)
             ORDER BY date DESC
             LIMIT 7",
            )
            .context("Failed to prepare query")?;

        let stats = stmt
            .query_map([], |row| {
                let date_str: String = row.get(0)?;
                let date = NaiveDate::parse_from_str(&date_str, "%Y-%m-%d")
                    .unwrap_or_else(|_| Utc::now().date_naive());

                Ok(DailyStats {
                    date,
                    total_seconds: row.get::<_, i64>(1)?.max(0),
                    app_count: row.get::<_, i64>(2)?.max(0),
                })
            })
            .context("Failed to execute query")?
            .collect::<std::result::Result<Vec<_>, _>>()
            .context("Failed to parse results")?;

        Ok(stats)
    })
    .map_err(|e| e.to_string())
}

/// Get weekly trend with aggregate data
#[frb]
pub fn get_weekly_trend() -> Result<WeeklyTrend, String> {
    let daily_stats = get_weekly_stats()?;

    let total_seconds: i64 = daily_stats.iter().map(|d| d.total_seconds).sum();

    let average_seconds = if daily_stats.is_empty() {
        0
    } else {
        total_seconds / daily_stats.len() as i64
    };

    let most_active_day = daily_stats
        .iter()
        .max_by_key(|d| d.total_seconds)
        .map(|d| d.date);

    Ok(WeeklyTrend {
        daily_stats,
        total_seconds: total_seconds.max(0),
        average_seconds: average_seconds.max(0),
        most_active_day,
    })
}

/// Get top N apps by usage time for a period
#[frb]
pub fn get_top_apps(days: i32, limit: i32) -> Result<Vec<AppUsageSummary>, String> {
    // Input validation with secure defaults
    let safe_days = days.clamp(1, MAX_DAYS);
    let safe_limit = limit.clamp(1, MAX_RESULTS);

    with_connection(|conn| {
        let days_param = format!("-{} days", safe_days);

        let mut stmt = conn
            .prepare(
                "SELECT app_name, exe_path, 
                    SUM(duration_seconds) as total_seconds, 
                    COUNT(*) as session_count
             FROM activity_sessions
             WHERE start_time >= datetime('now', ?1)
             GROUP BY app_name
             ORDER BY total_seconds DESC
             LIMIT ?2",
            )
            .context("Failed to prepare query")?;

        let summaries = stmt
            .query_map(rusqlite::params![days_param, safe_limit], |row| {
                Ok(AppUsageSummary {
                    app_name: row.get(0)?,
                    exe_path: row.get(1)?,
                    total_seconds: row.get::<_, i64>(2)?.max(0),
                    session_count: row.get::<_, i64>(3)?.max(0),
                })
            })
            .context("Failed to execute query")?
            .collect::<std::result::Result<Vec<_>, _>>()
            .context("Failed to parse results")?;

        Ok(summaries)
    })
    .map_err(|e| e.to_string())
}
