//! Cross-platform activity tracker module

use crate::db;
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
static CURRENT_CODING_SESSION: Lazy<Mutex<Option<CurrentCodingSession>>> = Lazy::new(|| Mutex::new(None));

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
pub struct CurrentCodingSession {
    pub id: i64,
    pub app_name: String,
    pub editor_name: String,
    pub file_path: Option<String>,
    pub language: Option<String>,
    pub project_dir: Option<String>,
    pub is_ai_assisted: bool,
    pub window_title: String,
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
                    || name_only.eq_ignore_ascii_case("timigs")
                    || name_only.eq_ignore_ascii_case("antigravity")
                    || db::is_process_excluded(&full_path)
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
    // meni shche zaiibalosia perekladaty komyenty na anhliisku, bo yakshcho khtos zakhochche dopomohchy ne iz UKR, to todi krashche na anhliisku
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
                        || app_name.eq_ignore_ascii_case("timigs")
                        || app_name.eq_ignore_ascii_case("antigravity")
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

    // Fallback: try reading from /proc directly for Wayland/X11
    // This works when xdotool/wmctrl are not available
    if let Ok(output) = Command::new("sh")
        .args(["-c", "cat /proc/$(ls /proc | grep -E '^[0-9]+$' | head -1)/comm 2>/dev/null"])
        .output()
    {
        if output.status.success() {
            if let Ok(app_name) = String::from_utf8(output.stdout) {
                let app_name = app_name.trim().to_string();
                if !app_name.is_empty() && app_name != "sh" {
                    return Some(ActiveWindow {
                        app_name: app_name.clone(),
                        window_title: format!("{} Window", app_name),
                        exe_path: format!("/usr/bin/{}", app_name),
                    });
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

pub fn get_current_coding_session() -> Option<CurrentCodingSession> {
    CURRENT_CODING_SESSION.lock().clone()
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
        let mut last_coding_key = String::new();
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

                        // End coding session if music is active
                        if let Some(session) = CURRENT_CODING_SESSION.lock().take() {
                            let _ = db::end_coding_session(session.id);
                        }
                        last_coding_key.clear();
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


                            }

                            last_app = active.exe_path.clone();
                            last_title = active.window_title.clone();
                        }

                        // Ну нахуя ви тут дивитися ?
                        let is_browser_ai = is_browser_ai_site(&active.app_name, &active.window_title);
                        let editor_opt = detect_code_editor(&active.app_name, &active.exe_path);

                        if editor_opt.is_some() || is_browser_ai {
                            let editor_name = if is_browser_ai {
                                "AI Web Assistant".to_string()
                            } else {
                                editor_opt.unwrap()
                            };
                            let coding_key = format!("{}|{}", active.exe_path, active.window_title);
                            if coding_key != last_coding_key {

                                if let Some(session) = CURRENT_CODING_SESSION.lock().take() {
                                    let _ = db::end_coding_session(session.id);
                                }

                                let (file_path, language, project_dir) =
                                    parse_coding_info(&active.window_title, &editor_name);
                                let ai = is_ai_assisted(&active.app_name, &active.window_title, &editor_name);

                                if let Ok(id) = db::start_coding_session(
                                    &active.app_name,
                                    &editor_name,
                                    file_path.as_deref(),
                                    language.as_deref(),
                                    project_dir.as_deref(),
                                    ai,
                                    &active.window_title,
                                    &active.exe_path,
                                ) {
                                    *CURRENT_CODING_SESSION.lock() = Some(CurrentCodingSession {
                                        id,
                                        app_name: active.app_name.clone(),
                                        editor_name,
                                        file_path,
                                        language,
                                        project_dir,
                                        is_ai_assisted: ai,
                                        window_title: active.window_title.clone(),
                                        exe_path: active.exe_path.clone(),
                                    });
                                }

                                last_coding_key = coding_key;
                            }
                        } else {
                            // Not a code editor - end any active coding session
                            if let Some(session) = CURRENT_CODING_SESSION.lock().take() {
                                let _ = db::end_coding_session(session.id);
                            }
                            last_coding_key.clear();
                        }
                    }
                }
            }));

            if let Err(e) = result {
                eprintln!("Tracking thread panicked: {:?}", e);
            }

            thread::sleep(Duration::from_secs(1));

            ticker += 1;
            if ticker % 3 == 0 {
                if let Some(app_handle) = APP_HANDLE.get() {
                    use tauri::Emitter;
                    let _ = app_handle.emit("activity-tracker-tick", ());
                }
            }
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
        if let Some(session) = CURRENT_CODING_SESSION.lock().take() {
            let _ = db::end_coding_session(session.id);
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
        let mut last_coding_key = String::new();
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

                        // End coding session if music is active
                        if let Some(session) = CURRENT_CODING_SESSION.lock().take() {
                            let _ = db::end_coding_session(session.id);
                        }
                        last_coding_key.clear();
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
                            }

                            last_app = active.exe_path.clone();
                            last_title = active.window_title.clone();
                        }

                        // Handle coding session (independent of regular session)
                        let is_browser_ai = is_browser_ai_site(&active.app_name, &active.window_title);
                        let editor_opt = detect_code_editor(&active.app_name, &active.exe_path);

                        if editor_opt.is_some() || is_browser_ai {
                            let editor_name = if is_browser_ai {
                                "AI Web Assistant".to_string()
                            } else {
                                editor_opt.unwrap()
                            };
                            // Ось тут нахуй лізете, тут нічого цікавого немає чи рукожоп тут !
                            let coding_key = format!("{}|{}", active.exe_path, active.window_title);
                            if coding_key != last_coding_key {
                                // End previous coding session
                                if let Some(session) = CURRENT_CODING_SESSION.lock().take() {
                                    let _ = db::end_coding_session(session.id);
                                }

                                let (file_path, language, project_dir) =
                                    parse_coding_info(&active.window_title, &editor_name);
                                let ai = is_ai_assisted(&active.app_name, &active.window_title, &editor_name);

                                if let Ok(id) = db::start_coding_session(
                                    &active.app_name,
                                    &editor_name,
                                    file_path.as_deref(),
                                    language.as_deref(),
                                    project_dir.as_deref(),
                                    ai,
                                    &active.window_title,
                                    &active.exe_path,
                                ) {
                                    *CURRENT_CODING_SESSION.lock() = Some(CurrentCodingSession {
                                        id,
                                        app_name: active.app_name.clone(),
                                        editor_name,
                                        file_path,
                                        language,
                                        project_dir,
                                        is_ai_assisted: ai,
                                        window_title: active.window_title.clone(),
                                        exe_path: active.exe_path.clone(),
                                    });
                                }

                                last_coding_key = coding_key;
                            }
                        } else {
                            // Not a code editor - end any active coding session
                            if let Some(session) = CURRENT_CODING_SESSION.lock().take() {
                                let _ = db::end_coding_session(session.id);
                            }
                            last_coding_key.clear();
                        }
                    }
                }
            }));

            if let Err(e) = result {
                eprintln!("Tracking thread panicked: {:?}", e);
            }

            thread::sleep(Duration::from_secs(1));

            ticker += 1;
            if ticker % 3 == 0 {
                if let Some(app_handle) = APP_HANDLE.get() {
                    use tauri::Emitter;
                    let _ = app_handle.emit("activity-tracker-tick", ());
                }
            }
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
        if let Some(session) = CURRENT_CODING_SESSION.lock().take() {
            let _ = db::end_coding_session(session.id);
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

// ── Code Editor Detection ──

/// Known code editors mapped to their canonical names.
/// (pattern, canonical name) - pattern is matched case-insensitively
/// against app_name (stem) and exe_path.
const CODE_EDITORS: &[(&str, &str)] = &[
    ("nvim",          "Neovim"),
    ("neovim",        "Neovim"),
    ("code",          "VS Code"),
    ("vscode",        "VS Code"),
    ("cursor",        "Cursor"),
    ("windsurf",      "Windsurf"),
    ("zed",           "Zed"),
    ("intellij",      "IntelliJ IDEA"),
    ("webstorm",      "WebStorm"),
    ("pycharm",       "PyCharm"),
    ("phpstorm",      "PhpStorm"),
    ("clion",         "CLion"),
    ("goland",        "GoLand"),
    ("rider",         "Rider"),
    ("rubymine",      "RubyMine"),
    ("datagrip",      "DataGrip"),
    ("fleet",         "Fleet"),
    ("rustrover",     "RustRover"),
    ("appcode",       "AppCode"),
    ("androidstudio", "Android Studio"),
    ("studio",        "Android Studio"),
    ("xcode",         "Xcode"),
    ("visual studio", "Visual Studio"),
    ("devenv",        "Visual Studio"),
    ("sublime_text",  "Sublime Text"),
    ("sublime",       "Sublime Text"),
    ("atom",          "Atom"),
    ("emacs",         "Emacs"),
    ("vim",           "Vim"),
    ("helix",         "Helix"),
    ("lapce",         "Lapce"),
    ("lite-xl",       "Lite XL"),
    ("notepad++",     "Notepad++"),
    ("npp",           "Notepad++"),
    ("kate",          "Kate"),
    ("kiro",          "Kiro"),
    ("qoder",         "Qoder"),
    ("robloxstudio",  "Roblox Studio"),
    ("roblox studio", "Roblox Studio"),
    ("antigravity",   "Antigravity"),
];

/// Detect if app is a code editor. Returns `Some(editor_name)` if detected.
fn detect_code_editor(app_name: &str, exe_path: &str) -> Option<String> {
    let app_lower = app_name.to_lowercase();
    let exe_lower = exe_path.to_lowercase();

    for &(pattern, canonical) in CODE_EDITORS {
        if app_lower.contains(pattern) || exe_lower.contains(pattern) {
            // Exclude "vim" from matching "neovim" (neovim is already listed first)
            // But guard against "nvim" accidentally matching some unrelated app that
            // merely contains those letters by requiring it to be a word-ish match.
            // The patterns are specific enough that a simple contains() is fine here.
            return Some(canonical.to_string());
        }
    }
    None
}

const KNOWN_EXTENSIONS: &[(&str, &str)] = &[
    ("rs", "Rust"),
    ("ts", "TypeScript"),
    ("tsx", "TypeScript"),
    ("js", "JavaScript"),
    ("jsx", "JavaScript"),
    ("mjs", "JavaScript"),
    ("cjs", "JavaScript"),
    ("py", "Python"),
    ("pyw", "Python"),
    ("go", "Go"),
    ("rb", "Ruby"),
    ("java", "Java"),
    ("kt", "Kotlin"),
    ("kts", "Kotlin"),
    ("swift", "Swift"),
    ("c", "C"),
    ("cpp", "C++"),
    ("cc", "C++"),
    ("cxx", "C++"),
    ("c++", "C++"),
    ("cs", "C#"),
    ("php", "PHP"),
    ("html", "HTML"),
    ("htm", "HTML"),
    ("css", "CSS"),
    ("scss", "CSS"),
    ("sass", "CSS"),
    ("vue", "Vue"),
    ("svelte", "Svelte"),
    ("md", "Markdown"),
    ("mdx", "Markdown"),
    ("json", "JSON"),
    ("jsonc", "JSON"),
    ("yaml", "YAML"),
    ("yml", "YAML"),
    ("toml", "TOML"),
    ("sh", "Shell"),
    ("bash", "Shell"),
    ("zsh", "Shell"),
    ("ps1", "PowerShell"),
    ("psm1", "PowerShell"),
    ("sql", "SQL"),
    ("lua", "Lua"),
    ("dart", "Dart"),
    ("ex", "Elixir"),
    ("exs", "Elixir"),
    ("hs", "Haskell"),
    ("clj", "Clojure"),
    ("cljs", "Clojure"),
    ("r", "R"),
    ("xml", "XML"),
    ("tf", "HCL"),
    ("hcl", "HCL"),
    ("zig", "Zig"),
];

fn extract_file_and_lang(window_title: &str) -> (Option<String>, Option<String>) {
    let title_lower = window_title.to_lowercase();
    for &(ext, lang) in KNOWN_EXTENSIONS {
        let ext_pattern = format!(".{}", ext);
        if let Some(idx) = title_lower.find(&ext_pattern) {
            let next_char = title_lower.chars().nth(idx + ext_pattern.len());
            let is_boundary = match next_char {
                None => true,
                Some(c) => c.is_whitespace() || c == '-' || c == '—' || c == '–' || c == '|' || c == '>' || c == '<' || c == '•',
            };
            if is_boundary {
                let mut start_idx = 0;
                let substring_before = &window_title[..idx + ext_pattern.len()];
                if let Some(sep_idx) = substring_before.rfind(" – ") {
                    start_idx = sep_idx + 3;
                } else if let Some(sep_idx) = substring_before.rfind(" - ") {
                    start_idx = sep_idx + 3;
                } else if let Some(sep_idx) = substring_before.rfind(" • ") {
                    start_idx = sep_idx + 3;
                } else if let Some(sep_idx) = substring_before.rfind(" — ") {
                    start_idx = sep_idx + 3;
                }
                let raw_path = substring_before[start_idx..].trim().trim_start_matches('•').trim().to_string();
                if !raw_path.is_empty() {
                    let path_obj = std::path::Path::new(&raw_path);
                    let file_name = path_obj.file_name()
                        .and_then(|f| f.to_str())
                        .map(|s| s.to_string())
                        .unwrap_or(raw_path);
                    return (Some(file_name), Some(lang.to_string()));
                }
            }
        }
    }
    (None, None)
}

fn detect_language(file_path: &str) -> Option<String> {
    let file_lower = file_path.to_lowercase();
    for &(ext, lang) in KNOWN_EXTENSIONS {
        let ext_pattern = format!(".{}", ext);
        if let Some(idx) = file_lower.find(&ext_pattern) {
            let next_char = file_lower.chars().nth(idx + ext_pattern.len());
            let is_boundary = match next_char {
                None => true,
                Some(c) => c.is_whitespace() || c == '-' || c == '—' || c == '–' || c == '|' || c == '>' || c == '<' || c == '•',
            };
            if is_boundary {
                return Some(lang.to_string());
            }
        }
    }
    let path = std::path::Path::new(file_path);
    if let Some(ext_os) = path.extension() {
        if let Some(ext_str) = ext_os.to_str() {
            let ext = ext_str.to_lowercase();
            for &(k_ext, lang) in KNOWN_EXTENSIONS {
                if ext == k_ext {
                    return Some(lang.to_string());
                }
            }
        }
    }
    Some("Unknown".to_string())
}

fn parse_coding_info(
    window_title: &str,
    editor_name: &str,
) -> (Option<String>, Option<String>, Option<String>) {
    if editor_name == "AI Web Assistant" {
        let title_lower = window_title.to_lowercase();
        let service = AI_SERVICES.iter()
            .find(|&&(key, _)| title_lower.contains(key))
            .map(|&(_, name)| name)
            .unwrap_or("AI Assistant");
        return (Some(service.to_string()), Some("AI Prompt".to_string()), Some("Web AI Chat".to_string()));
    }

    if editor_name == "Zed" {
        let sep = if window_title.contains(" — ") {
            Some(" — ")
        } else if window_title.contains(" – ") {
            Some(" – ")
        } else if window_title.contains(" - ") {
            Some(" - ")
        } else {
            None
        };

        if let Some(separator) = sep {
            let parts: Vec<&str> = window_title.split(separator).collect();
            if parts.len() >= 2 {
                let part_a = parts[0].trim().to_string();
                let part_b = parts[1..].join(separator).trim().to_string();

                if let (Some(file), lang) = extract_file_and_lang(&part_b) {
                    return (Some(file), lang, Some(part_a));
                }
                if let (Some(file), lang) = extract_file_and_lang(&part_a) {
                    return (Some(file), lang, Some(part_b));
                }
                let b_has_file_indicators = part_b.contains('.') || part_b.contains('/') || part_b.contains('\\');
                let a_has_file_indicators = part_a.contains('.') || part_a.contains('/') || part_a.contains('\\');
                if b_has_file_indicators && !a_has_file_indicators {
                    let path_obj = std::path::Path::new(&part_b);
                    let file_name = path_obj.file_name()
                        .and_then(|f| f.to_str())
                        .map(|s| s.to_string())
                        .unwrap_or(part_b.clone());
                    let lang = detect_language(&file_name);
                    return (Some(file_name), lang, Some(part_a));
                } else if a_has_file_indicators && !b_has_file_indicators {
                    let path_obj = std::path::Path::new(&part_a);
                    let file_name = path_obj.file_name()
                        .and_then(|f| f.to_str())
                        .map(|s| s.to_string())
                        .unwrap_or(part_a.clone());
                    let lang = detect_language(&file_name);
                    return (Some(file_name), lang, Some(part_b));
                }

                let path_obj = std::path::Path::new(&part_b);
                let file_name = path_obj.file_name()
                    .and_then(|f| f.to_str())
                    .map(|s| s.to_string())
                    .unwrap_or(part_b.clone());
                let lang = detect_language(&file_name);
                return (Some(file_name), lang, Some(part_a));
            }
        }
        if let (Some(file), lang) = extract_file_and_lang(window_title) {
            return (Some(file), lang, None);
        }
        let clean = window_title.trim();
        if !clean.is_empty() {
            if !clean.contains('.') && !clean.contains('\\') && !clean.contains('/') {
                return (None, None, Some(clean.to_string()));
            } else {
                return (Some(clean.to_string()), None, None);
            }
        }
    }

    let (extracted_file, extracted_lang) = extract_file_and_lang(window_title);
    let mut project_dir = None;
    let parts: Vec<&str> = if window_title.contains(" – ") {
        window_title.split(" – ").collect()
    } else if window_title.contains(" - ") {
        window_title.split(" - ").collect()
    } else {
        Vec::new()
    };

    if !parts.is_empty() {
        if (editor_name == "VS Code" || editor_name == "Cursor" || editor_name == "Windsurf") && parts.len() >= 2 {
            project_dir = Some(parts[1].trim().to_string());
        } else if parts.len() >= 3 {
            project_dir = Some(parts[0].trim().to_string());
        }
    }

    if let Some(file) = extracted_file {
        return (Some(file), extracted_lang, project_dir);
    }

    if editor_name == "VS Code" || editor_name == "Cursor" || editor_name == "Windsurf" {
        let clean = window_title
            .trim_end_matches(" - Visual Studio Code")
            .trim_end_matches(" - Cursor")
            .trim_end_matches(" - Windsurf");
        let clean = clean
            .trim_end_matches(" - Visual Studio Code")
            .trim();
        let parts: Vec<&str> = clean.split(" - ").collect();
        if parts.len() >= 2 {
            let file = parts[0].trim().trim_start_matches('•').trim().to_string();
            let project = parts[1].trim().to_string();
            let lang = detect_language(&file);
            return (Some(file), lang, Some(project));
        } else if !clean.is_empty() {
            let file = clean.trim().to_string();
            let lang = detect_language(&file);
            return (Some(file), lang, None);
        }
    }

    if matches!(
        editor_name,
        "IntelliJ IDEA" | "WebStorm" | "PyCharm" | "PhpStorm" | "CLion"
            | "GoLand" | "Rider" | "RubyMine" | "DataGrip" | "Fleet"
            | "Android Studio"
    ) {
        let parts: Vec<&str> = window_title.split(" – ").collect();
        if parts.len() >= 3 {
            let project = parts[0].trim().to_string();
            let file = parts[1].trim().to_string();
            let lang = detect_language(&file);
            return (Some(file), lang, Some(project));
        } else if parts.len() == 2 {
            let file = parts[0].trim().to_string();
            let lang = detect_language(&file);
            return (Some(file), lang, None);
        }
    }

    if matches!(editor_name, "Neovim" | "Vim" | "Helix" | "Lapce" | "Lite XL") {
        let title = window_title.trim();
        let candidate = title
            .trim_start_matches("NVim")
            .trim_start_matches("nvim")
            .trim_start_matches(" - ")
            .trim();
        if !candidate.is_empty() {
            if candidate.contains('.') || candidate.contains('/') || candidate.contains('\\') {
                let path = std::path::Path::new(candidate);
                let file = path
                    .file_name()
                    .and_then(|f| f.to_str())
                    .unwrap_or(candidate)
                    .to_string();
                let project = path
                    .parent()
                    .and_then(|p| p.file_name())
                    .and_then(|f| f.to_str())
                    .map(|s| s.to_string());
                let lang = detect_language(&file);
                return (Some(file), lang, project);
            }
        }
        return (Some(title.to_string()), None, None);
    }

    if editor_name == "Sublime Text" {
        let clean = window_title
            .trim_end_matches(" - Sublime Text")
            .trim();
        if !clean.is_empty() {
            let parts: Vec<&str> = clean.split(" - ").collect();
            let file = parts[0].trim().to_string();
            let lang = detect_language(&file);
            let project = parts.get(1).map(|s| s.trim().to_string());
            return (Some(file), lang, project);
        }
    }

    for suffix in [
        " - Notepad++", " - Atom", " - Emacs", " - Xcode",
    ] {
        if let Some(stripped) = window_title.strip_suffix(suffix) {
            let file = stripped.trim().to_string();
            let lang = detect_language(&file);
            return (Some(file), lang, None);
        }
    }

    if !window_title.is_empty() {
        let clean_file = window_title.trim().to_string();
        let detected_lang = detect_language(&clean_file);
        return (Some(clean_file), detected_lang, None);
    }

    (None, None, None)
}

/// Supported AI web services and their display names.
const AI_SERVICES: &[(&str, &str)] = &[
    ("chatgpt", "ChatGPT"),
    ("claude", "Claude AI"),
    ("deepseek", "DeepSeek"),
    ("gemini", "Gemini"),
    ("v0.dev", "v0.dev"),
    ("v0", "v0.dev"),
    ("copilot", "Copilot"),
    ("poe.com", "Poe"),
    ("poe", "Poe"),
    ("ollama", "Ollama"),
    ("grok", "Grok AI"),
    ("perplexity", "Perplexity"),
    ("phind", "Phind"),
    ("mistral", "Mistral AI"),
    ("qwen", "Qwen"),
    ("huggingface", "Hugging Face"),
    ("blackbox", "Blackbox AI"),
    ("lm-studio", "LM Studio"),
    ("lmstudio", "LM Studio"),
    ("jan.ai", "Jan AI"),
    ("bolt.new", "Bolt.new"),
    ("bolt", "Bolt.new"),
    ("devin", "Devin AI"),
    ("lovable", "Lovable.dev"),
    ("sider", "Sider AI"),
    ("monica", "Monica AI"),
    ("open-webui", "Open WebUI"),
    ("openwebui", "Open WebUI"),
    ("librechat", "LibreChat"),
    ("codeium", "Codeium"),
    ("tabnine", "Tabnine"),
    ("replit", "Replit Agent"),
    ("aide", "Aide"),
    ("amazon q", "Amazon Q"),
    ("codewhisperer", "Amazon Q"),
];

/// Returns true if the active window is a browser on an AI website or a standalone AI app
fn is_browser_ai_site(app_name: &str, window_title: &str) -> bool {
    let app_lower = app_name.to_lowercase();
    let title_lower = window_title.to_lowercase();

    let is_browser = app_lower.contains("chrome") ||
                     app_lower.contains("firefox") ||
                     app_lower.contains("msedge") ||
                     app_lower.contains("brave") ||
                     app_lower.contains("safari") ||
                     app_lower.contains("opera") ||
                     app_lower.contains("vivaldi") ||
                     app_lower.contains("browser");

    if is_browser {
        AI_SERVICES.iter().any(|&(key, _)| title_lower.contains(key))
    } else {
        AI_SERVICES.iter().any(|&(key, _)| app_lower.contains(key))
    }
}

/// AI tools to detect (in editor name or window title).
const AI_TOOLS: &[&str] = &[
    "composer",
    "copilot chat",
    "ai chat",
    "ask ai",
    "assistant",
    "chatgpt",
    "claude",
    "deepseek",
    "gemini",
    "supermaven",
    "qwen",
    "copilot",
    "ai-assisted",
    "ai assistant",
    "cursor chat",
    "windsurf chat",
    "ollama",
    "ai prompt",
    "prompt",
    "generate",
    "blackbox",
    "codeium",
    "tabnine",
    "replit",
    "monica",
    "sider",
    "bolt",
    "lovable",
    "devin",
];

/// Returns true if this session involves AI assistance.
fn is_ai_assisted(app_name: &str, window_title: &str, editor_name: &str) -> bool {
    let app_lower = app_name.to_lowercase();
    let title_lower = window_title.to_lowercase();

    // НАХУЙ ЦІ ШІ
    if editor_name == "AI Web Assistant" || AI_SERVICES.iter().any(|&(key, _)| app_lower.contains(key)) {
        return true;
    }

    // For general code editors, check if the window title indicates active AI usage
    AI_TOOLS.iter().any(|&tool| {
        title_lower.contains(tool)
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parser() {
        let titles = vec![
            ("timiGS- - vite-env.d.ts", "Zed"),
            ("src\\components\\CodingTracker.vue <template> > div", "Zed"),
            ("timiGS-", "Zed"),
            ("timiGS- — CodingTracker.vue", "Zed"),
            ("CodingTracker.vue - timiGS- - Visual Studio Code", "VS Code"),
        ];
        for (title, editor) in titles {
            let res = parse_coding_info(title, editor);
            println!("Title: '{}', Editor: '{}' => {:?}", title, editor, res);
        }
    }

    #[test]
    fn dump_db() {
        let conn = rusqlite::Connection::open("C:\\Users\\baneronetwo\\AppData\\Roaming\\TimiGS\\activity.db").unwrap();
        let mut stmt = conn.prepare("SELECT id, app_name, editor_name, file_path, language, is_ai_assisted, window_title FROM coding_sessions ORDER BY id DESC LIMIT 30").unwrap();
        let rows = stmt.query_map([], |row| {
            let id: i64 = row.get(0)?;
            let app_name: String = row.get(1)?;
            let editor_name: String = row.get(2)?;
            let file_path: Option<String> = row.get(3)?;
            let language: Option<String> = row.get(4)?;
            let is_ai: i64 = row.get(5)?;
            let window_title: String = row.get(6)?;
            Ok((id, app_name, editor_name, file_path, language, is_ai, window_title))
        }).unwrap();
        for r in rows {
            println!("{:?}", r.unwrap());
        }
    }
}
