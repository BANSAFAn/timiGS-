//! TimiGS Core - Rust backend for Android activity tracking
//!
//! This library provides the core functionality for TimiGS Android app:
//! - SQLite database operations
//! - Activity session management
//! - Analytics calculations
//! - Settings management

pub mod api;
pub mod db;
pub mod models;

use flutter_rust_bridge::frb;

/// Initialize the library (called from Dart on startup)
#[frb(init)]
pub fn init_app() {
    // Initialize Android logger
    #[cfg(target_os = "android")]
    android_logger::init_once(
        android_logger::Config::default()
            .with_max_level(log::LevelFilter::Debug)
            .with_tag("TimiGS-Rust"),
    );

    flutter_rust_bridge::setup_default_user_utils();
    log::info!("TimiGS Rust backend initialized");
}
