//! Cross-platform activity tracker module

use crate::db;
#[cfg(desktop)]
use crate::discord;
use once_cell::sync::Lazy;
use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::Duration;

#[cfg(windows)]
use windows::Win32::{
    Foundation::HWND,
    System::Threading::{OpenProcess, PROCESS_QUERY_INFORMATION, PROCESS_VM_READ},
    UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowTextW, GetWindowThreadProcessId},
};

static RUNNING: AtomicBool = AtomicBool::new(false);
static APP_HANDLE: once_cell::sync::OnceCell<tauri::AppHandle> = once_cell::sync::OnceCell::new();
static CURRENT_SESSION: Lazy<Mutex<Option<CurrentSession>>> = Lazy::new(|| Mutex::new(None));
static CURRENT_MUSIC_SESSION: Lazy<Mutex<Option<CurrentMusicSession>>> = Lazy::new(|| Mutex::new(None));

// List of music streaming applications
const MUSIC_APPS: &[&str] = &[
    "spotify",
    "spotify.exe",
    "yandex music",
    "yandex-music",
    "yamusic",
    "apple music",
    "applemusic",
    "music",
    "audible",
    "soundcloud",
    "tidal",
    "deezer",
    "qobuz",
    "rhythmbox",
    "clementine",
    "cmus",
    "foobar2000",
    "foobar",
    "itunes",
    "musicbee",
    "aimp",
    "winamp",
    "vlc",
    "mpv",
    "potplayer",
    "kmplayer",
    "gom",
    // YouTube Music (including browser tabs)
    "youtube music",
    "youtubemusic",
    "youtube.com/music",
];

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CurrentSession {
    pub id: i64,
    pub app_name: String,
    pub window_title: String,
    pub exe_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CurrentMusicSession {
    pub id: i64,
    pub app_name: String,
    pub window_title: Option<String>,
    pub exe_path: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ActiveWindow {
    pub app_name: String,
    pub window_title: String,
    pub exe_path: String,
}

#[cfg(windows)]
fn get_foreground_window_info() -> Option<ActiveWindow> {
    unsafe {
        let hwnd: HWND = GetForegroundWindow();
        if hwnd.0.is_null() {
            return None;
        }

        // Get window title
        let mut title_buf = [0u16; 512];
        let len = GetWindowTextW(hwnd, &mut title_buf);
        let window_title = if len > 0 {
            String::from_utf16_lossy(&title_buf[..len as usize])
        } else {
            String::new()
        };

        // Get process ID
        let mut process_id: u32 = 0;
        GetWindowThreadProcessId(hwnd, Some(&mut process_id));

        if process_id == 0 {
            return None;
        }

        // Я не спав 7 годин, я вже заїбався честно.....
        let process = OpenProcess(
            PROCESS_QUERY_INFORMATION | PROCESS_VM_READ,
            false,
            process_id,
        );

        let (app_name, exe_path) = if let Ok(handle) = process {
            let mut name_buf = [0u16; 1024];
            let len = windows::Win32::System::ProcessStatus::GetModuleFileNameExW(
                handle,
                None,
                &mut name_buf,
            );

            if len > 0 {
                let full_path = String::from_utf16_lossy(&name_buf[..len as usize]);
                let path = std::path::Path::new(&full_path);

                let _exe_name = path
                    .file_name()
                    .and_then(|n| n.to_str())
                    .unwrap_or("unknown.exe")
                    .to_string();

                let name_only = path
                    .file_stem()
                    .and_then(|n| n.to_str())
                    .unwrap_or("Unknown")
                    .to_string();

                // Filter ignored apps
                if name_only.eq_ignore_ascii_case("explorer")
                    || name_only.eq_ignore_ascii_case("LockApp")
                {
                    let _ = windows::Win32::Foundation::CloseHandle(handle);
                    return None;
                }

                let _ = windows::Win32::Foundation::CloseHandle(handle);
                (name_only, full_path)
            } else {
                let _ = windows::Win32::Foundation::CloseHandle(handle);
                ("Unknown".to_string(), "unknown.exe".to_string())
            }
        } else {
            ("Unknown".to_string(), "unknown.exe".to_string())
        };

        Some(ActiveWindow {
            app_name,
            window_title,
            exe_path,
        })
    }
}

#[cfg(target_os = "linux")]
fn get_foreground_window_info() -> Option<ActiveWindow> {
    use std::process::Command;
// мені ще заїбалося перекладати коменти на англійську, бо якщо хтось захоче допомогти не із УКР, то тоді краще на англійську
    // Try to get active window using xdotool (most reliable)
    if let Ok(output) = Command::new("xdotool")
        .args(["getactivewindow", "getwindowname"])
        .output()
    {
        if output.status.success() {
            if let Ok(title) = String::from_utf8(output.stdout) {
                let title = title.trim().to_string();
                if !title.is_empty() {
                    // Try to get the window class/application name
                    let app_name = Command::new("xdotool")
                        .args(["getactivewindow", "getwindowclassname"])
                        .output()
                        .ok()
                        .and_then(|o| String::from_utf8(o.stdout).ok())
                        .map(|s| s.trim().to_string())
                        .unwrap_or_else(|| "Unknown".to_string());

                    // Get executable path from /proc if possible
                    let exe_path = Command::new("xdotool")
                        .args(["getactivewindow", "getwindowpid"])
                        .output()
                        .ok()
                        .and_then(|o| String::from_utf8(o.stdout).ok())
                        .and_then(|pid_str| {
                            let pid = pid_str.trim();
                            let proc_path = format!("/proc/{}/exe", pid);
                            std::fs::read_link(&proc_path).ok()
                        })
                        .and_then(|p| p.into_os_string().into_string().ok())
                        .unwrap_or_else(|| "unknown".to_string());

                    // Filter ignored apps
                    if app_name.eq_ignore_ascii_case("explorer")
                        || app_name.eq_ignore_ascii_case("LockApp")
                        || app_name.is_empty()
                    {
                        return None;
                    }

                    return Some(ActiveWindow {
                        app_name,
                        window_title: title,
                        exe_path,
                    });
                }
            }
        }
    }

    // Fallback: try wmctrl
    if let Ok(output) = Command::new("wmctrl")
        .arg("-lp")
        .output()
    {
        if output.status.success() {
            if let Ok(output_str) = String::from_utf8(output.stdout) {
                // Get the last line (active window)
                if let Some(line) = output_str.lines().last() {
                    let parts: Vec<&str> = line.split_whitespace().collect();
                    if parts.len() >= 3 {
                        let app_name = parts[2].to_string();
                        let title = parts[3..].join(" ");

                        return Some(ActiveWindow {
                            app_name,
                            window_title: title,
                            exe_path: "unknown".to_string(),
                        });
                    }
                }
            }
        }
    }

    None
}

#[cfg(not(any(windows, target_os = "linux")))]
fn get_foreground_window_info() -> Option<ActiveWindow> {
    // Stub for unsupported platforms (macOS, etc.)
    None
}

pub fn get_current_active() -> Option<ActiveWindow> {
    get_foreground_window_info()
}

pub fn get_current_session() -> Option<CurrentSession> {
    CURRENT_SESSION.lock().clone()
}

pub fn start_tracking_with_app_handle(app_handle: tauri::AppHandle) {
    if RUNNING.load(Ordering::SeqCst) {
        return;
    }

    let _ = APP_HANDLE.set(app_handle);
    RUNNING.store(true, Ordering::SeqCst);

    let _ = thread::spawn(|| {
        let mut last_app = String::new();
        let mut last_title = String::new();
        let mut last_music_app = String::new();
        let mut ticker = 0;

        while RUNNING.load(Ordering::SeqCst) {
            // Use catch_unwind to prevent panics from crashing the thread
            let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
                if let Some(active) = get_foreground_window_info() {
                    // Check if this is YouTube Music in browser
                    let is_yt_music = is_youtube_music_title(&active.window_title);

                    // Check if this is a music app (including YouTube Music in browser)
                    let is_music = is_music_app(&active.app_name, &active.exe_path) || is_yt_music;

                    if is_music {
                        // For YouTube Music in browser, use "YouTube Music" as app name
                        let app_name = if is_yt_music {
                            "YouTube Music".to_string()
                        } else {
                            active.app_name.clone()
                        };

                        // Handle music session
                        if active.exe_path != last_music_app {
                            // End previous music session
                            if let Some(session) = CURRENT_MUSIC_SESSION.lock().take() {
                                let _ = db::end_music_session(session.id);
                            }

                            // Start new music session
                            if let Ok(id) = db::start_music_session(
                                &app_name,
                                Some(&active.window_title),
                                &active.exe_path
                            ) {
                                *CURRENT_MUSIC_SESSION.lock() = Some(CurrentMusicSession {
                                    id,
                                    app_name: app_name.clone(),
                                    window_title: Some(active.window_title.clone()),
                                    exe_path: active.exe_path.clone(),
                                });
                            }

                            last_music_app = active.exe_path;
                        }
                    } else {
                        last_music_app = String::new();

                        // Handle regular session
                        if active.exe_path != last_app || active.window_title != last_title {
                            // End previous session
                            if let Some(session) = CURRENT_SESSION.lock().take() {
                                let _ = db::end_session(session.id);
                            }

                            // Start new session
                            if let Ok(id) =
                                db::start_session(&active.app_name, &active.window_title, &active.exe_path)
                            {
                                *CURRENT_SESSION.lock() = Some(CurrentSession {
                                    id,
                                    app_name: active.app_name.clone(),
                                    window_title: active.window_title.clone(),
                                    exe_path: active.exe_path.clone(),
                                });

                                // Update Discord-presence
                                #[cfg(desktop)]
                                if db::get_settings().discord_rpc {
                                    discord::update_presence(&active.app_name, &active.window_title);
                                } else {
                                    discord::clear_presence();
                                }
                            }

                            last_app = active.exe_path;
                            last_title = active.window_title;
                        }
                    }
                }
            }));

            if let Err(e) = result {
                eprintln!("Tracking thread panicked: {:?}", e);
            }

            thread::sleep(Duration::from_secs(1));

            ticker += 1;
            if ticker >= 60 {
                ticker = 0;
                if let Some(session) = CURRENT_SESSION.lock().as_ref() {
                    if let Some(app_handle) = APP_HANDLE.get() {
                        let _ = crate::tasks::check_goals(app_handle, &session.app_name);
                    }
                }
            }
        }

        // End final sessions when stopping
        if let Some(session) = CURRENT_SESSION.lock().take() {
            let _ = db::end_session(session.id);
        }
        if let Some(session) = CURRENT_MUSIC_SESSION.lock().take() {
            let _ = db::end_music_session(session.id);
        }
    });
}

pub fn start_tracking() {
    if RUNNING.load(Ordering::SeqCst) {
        return;
    }

    RUNNING.store(true, Ordering::SeqCst);

    let _ = thread::spawn(|| {
        let mut last_app = String::new();
        let mut last_title = String::new();
        let mut last_music_app = String::new();
        let mut ticker = 0;

        while RUNNING.load(Ordering::SeqCst) {
            // Use catch_unwind to prevent panics from crashing the thread
            let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
                if let Some(active) = get_foreground_window_info() {
                    // Check if this is YouTube Music in browser
                    let is_yt_music = is_youtube_music_title(&active.window_title);
                    
                    // Check if this is a music app (including YouTube Music in browser)
                    let is_music = is_music_app(&active.app_name, &active.exe_path) || is_yt_music;
                    
                    if is_music {
                        // For YouTube Music in browser, use "YouTube Music" as app name
                        let app_name = if is_yt_music {
                            "YouTube Music".to_string()
                        } else {
                            active.app_name.clone()
                        };
                        
                        // Handle music session
                        if active.exe_path != last_music_app {
                            // End previous music session
                            if let Some(session) = CURRENT_MUSIC_SESSION.lock().take() {
                                let _ = db::end_music_session(session.id);
                            }

                            // Start new music session
                            if let Ok(id) = db::start_music_session(
                                &app_name,
                                Some(&active.window_title),
                                &active.exe_path
                            ) {
                                *CURRENT_MUSIC_SESSION.lock() = Some(CurrentMusicSession {
                                    id,
                                    app_name: app_name.clone(),
                                    window_title: Some(active.window_title.clone()),
                                    exe_path: active.exe_path.clone(),
                                });
                            }

                            last_music_app = active.exe_path;
                        }
                    } else {
                        // End music session if we were in one
                        if let Some(session) = CURRENT_MUSIC_SESSION.lock().take() {
                            let _ = db::end_music_session(session.id);
                        }
                        last_music_app.clear();

                        // Handle regular session
                        if active.exe_path != last_app || active.window_title != last_title {
                            // End previous session
                            if let Some(session) = CURRENT_SESSION.lock().take() {
                                let _ = db::end_session(session.id);
                            }

                            // Start new session
                            if let Ok(id) =
                                db::start_session(&active.app_name, &active.window_title, &active.exe_path)
                            {
                                *CURRENT_SESSION.lock() = Some(CurrentSession {
                                    id,
                                    app_name: active.app_name.clone(),
                                    window_title: active.window_title.clone(),
                                    exe_path: active.exe_path.clone(),
                                });

                                // Update Discord Presence
                                #[cfg(desktop)]
                                if db::get_settings().discord_rpc {
                                    discord::update_presence(&active.app_name, &active.window_title);
                                } else {
                                    discord::clear_presence();
                                }
                            }

                            last_app = active.exe_path;
                            last_title = active.window_title;
                        }
                    }
                }
            }));

            if let Err(e) = result {
                eprintln!("Tracking thread panicked: {:?}", e);
            }

            thread::sleep(Duration::from_secs(1));

            ticker += 1;
            if ticker >= 60 {
                ticker = 0;
                if let Some(session) = CURRENT_SESSION.lock().as_ref() {
                    if let Some(app_handle) = APP_HANDLE.get() {
                        let _ = crate::tasks::check_goals(app_handle, &session.app_name);
                    }
                }
            }
        }

        // End final sessions when stopping
        if let Some(session) = CURRENT_SESSION.lock().take() {
            let _ = db::end_session(session.id);
        }
        if let Some(session) = CURRENT_MUSIC_SESSION.lock().take() {
            let _ = db::end_music_session(session.id);
        }
    });
}

pub fn stop_tracking() {
    RUNNING.store(false, Ordering::SeqCst);
}

pub fn is_tracking() -> bool {
    RUNNING.load(Ordering::SeqCst)
}

/// Check if the app is a music player
fn is_music_app(app_name: &str, exe_path: &str) -> bool {
    let app_lower = app_name.to_lowercase();
    let exe_lower = exe_path.to_lowercase();

    // First check direct music apps
    if MUSIC_APPS.iter().any(|&music_app| {
        app_lower.contains(music_app) || exe_lower.contains(music_app)
    }) {
        return true;
    }

    // Check for YouTube Music in browser tabs (Vivaldi, Chrome, etc.)
    // Window title patterns: "Song Name - Artist | YouTube Music" or "YouTube Music"
    if app_lower.contains("vivaldi") || app_lower.contains("chrome") || 
       app_lower.contains("msedge") || app_lower.contains("firefox") ||
       app_lower.contains("brave") {
        // Will check window title in the main tracking loop
        return false;
    }

    false
}

/// Check if a browser window title indicates YouTube Music
fn is_youtube_music_title(window_title: &str) -> bool {
    let title_lower = window_title.to_lowercase();
    title_lower.contains("youtube music") || 
    (title_lower.contains("youtube.com") && title_lower.contains("music")) ||
    (title_lower.ends_with("| youtube music") || title_lower.contains("| youtube music"))
}
