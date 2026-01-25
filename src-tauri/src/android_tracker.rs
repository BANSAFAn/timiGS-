//! Android activity tracker module using UsageStatsManager

use crate::db;
use once_cell::sync::Lazy;
use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::Duration;

#[cfg(target_os = "android")]
use jni::{
    objects::{JClass, JObject, JString, JValue},
    sys::jlong,
    JNIEnv, JavaVM,
};

static RUNNING: AtomicBool = AtomicBool::new(false);
static CURRENT_SESSION: Lazy<Mutex<Option<CurrentSession>>> = Lazy::new(|| Mutex::new(None));

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CurrentSession {
    pub id: i64,
    pub app_name: String,
    pub window_title: String,
    pub exe_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActiveWindow {
    pub app_name: String,
    pub window_title: String,
    pub exe_path: String,
}

#[derive(Debug, Clone)]
struct AppUsageStats {
    package_name: String,
    app_name: String,
    total_time_ms: i64,
    last_used_ms: i64,
}

#[cfg(target_os = "android")]
fn get_usage_stats(start_time_ms: i64, end_time_ms: i64) -> Result<Vec<AppUsageStats>, String> {
    // This will be called from Kotlin/Java side via JNI
    // For now, return empty vec - actual implementation requires Kotlin service
    Ok(Vec::new())
}

#[cfg(not(target_os = "android"))]
fn get_usage_stats(_start_time_ms: i64, _end_time_ms: i64) -> Result<Vec<AppUsageStats>, String> {
    Err("Android tracking only available on Android platform".to_string())
}

pub fn get_current_active() -> Option<ActiveWindow> {
    // On Android, we don't have real-time foreground app detection
    // Return the last known active app from database
    CURRENT_SESSION.lock().as_ref().map(|session| ActiveWindow {
        app_name: session.app_name.clone(),
        window_title: session.window_title.clone(),
        exe_path: session.exe_path.clone(),
    })
}

pub fn get_current_session() -> Option<CurrentSession> {
    CURRENT_SESSION.lock().clone()
}

pub fn check_permission() -> bool {
    #[cfg(target_os = "android")]
    {
        // This should call Android API to check PACKAGE_USAGE_STATS permission
        // For now, return false - will be implemented in Kotlin
        false
    }
    #[cfg(not(target_os = "android"))]
    {
        false
    }
}

pub fn request_permission() -> Result<(), String> {
    #[cfg(target_os = "android")]
    {
        // This should open Android Settings to request permission
        // Will be implemented in Kotlin service
        Ok(())
    }
    #[cfg(not(target_os = "android"))]
    {
        Err("Permission request only available on Android".to_string())
    }
}

pub fn start_tracking() {
    if RUNNING.load(Ordering::SeqCst) {
        return;
    }

    RUNNING.store(true, Ordering::SeqCst);

    let _ = thread::spawn(|| {
        let mut last_package = String::new();

        while RUNNING.load(Ordering::SeqCst) {
            // Poll usage stats every 5 minutes
            let now = chrono::Utc::now().timestamp_millis();
            let five_min_ago = now - (5 * 60 * 1000);

            if let Ok(stats) = get_usage_stats(five_min_ago, now) {
                // Find the most recently used app
                if let Some(most_recent) = stats.iter().max_by_key(|s| s.last_used_ms) {
                    if most_recent.package_name != last_package {
                        // End previous session
                        if let Some(session) = CURRENT_SESSION.lock().take() {
                            let _ = db::end_session(session.id);
                        }

                        // Start new session
                        // Note: On Android we don't have window titles, use package name
                        if let Ok(id) = db::start_session(
                            &most_recent.app_name,
                            &most_recent.package_name,
                            &most_recent.package_name,
                        ) {
                            *CURRENT_SESSION.lock() = Some(CurrentSession {
                                id,
                                app_name: most_recent.app_name.clone(),
                                window_title: most_recent.package_name.clone(),
                                exe_path: most_recent.package_name.clone(),
                            });
                        }

                        last_package = most_recent.package_name.clone();
                    }
                }
            }

            // Sleep for 5 minutes before next poll
            thread::sleep(Duration::from_secs(300));
        }

        // End final session when stopping
        if let Some(session) = CURRENT_SESSION.lock().take() {
            let _ = db::end_session(session.id);
        }
    });
}

pub fn stop_tracking() {
    RUNNING.store(false, Ordering::SeqCst);
}

pub fn is_tracking() -> bool {
    RUNNING.load(Ordering::SeqCst)
}

// JNI callback from Kotlin to provide usage stats
#[cfg(target_os = "android")]
#[no_mangle]
pub extern "C" fn Java_com_timigs_app_UsageStatsService_updateUsageStats(
    env: JNIEnv,
    _class: JClass,
    package_name: JString,
    app_name: JString,
    total_time_ms: jlong,
    last_used_ms: jlong,
) {
    let package: String = env
        .get_string(package_name)
        .map(|s| s.into())
        .unwrap_or_default();
    let name: String = env
        .get_string(app_name)
        .map(|s| s.into())
        .unwrap_or_default();

    // Store in database
    let _ = db::start_session(&name, &package, &package);
}
