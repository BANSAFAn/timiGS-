//! Time OUT module — enforced break reminders
//! During breaks: sets TimiGS to fullscreen + always-on-top and blocks other apps.

use once_cell::sync::Lazy;
use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::Duration;
use tauri::{Emitter, Manager};

static TIMEOUT_STATE: Lazy<Mutex<Option<TimeoutSession>>> = Lazy::new(|| Mutex::new(None));
static TIMEOUT_RUNNING: AtomicBool = AtomicBool::new(false);
static BREAK_ACTIVE: AtomicBool = AtomicBool::new(false);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeoutStatus {
    pub active: bool,
    pub break_active: bool,
    pub interval_secs: u64,
    pub break_duration_secs: u64,
    pub next_break_in: u64,
    pub break_remaining: u64,
}

struct TimeoutSession {
    interval_secs: u64,
    break_duration_secs: u64,
    password_hash: String,
    next_break_countdown: Arc<AtomicU64>,
    break_countdown: Arc<AtomicU64>,
}

fn simple_hash(password: &str) -> String {
    let mut hash: u64 = 5381;
    for byte in password.bytes() {
        hash = hash.wrapping_mul(33).wrapping_add(byte as u64);
    }
    format!("{:x}", hash)
}

pub fn start_timeout(
    interval_secs: u64,
    break_duration_secs: u64,
    password: &str,
    app_handle: tauri::AppHandle,
) -> Result<(), String> {
    if TIMEOUT_RUNNING.load(Ordering::SeqCst) {
        return Err("Time OUT is already active".to_string());
    }

    let password_hash = simple_hash(password);

    let next_break = Arc::new(AtomicU64::new(interval_secs));
    let break_countdown = Arc::new(AtomicU64::new(0));

    *TIMEOUT_STATE.lock() = Some(TimeoutSession {
        interval_secs,
        break_duration_secs,
        password_hash,
        next_break_countdown: next_break.clone(),
        break_countdown: break_countdown.clone(),
    });

    TIMEOUT_RUNNING.store(true, Ordering::SeqCst);
    BREAK_ACTIVE.store(false, Ordering::SeqCst);

    let app_handle_clone = app_handle.clone();

    thread::spawn(move || {
        let mut was_on_break = false;

        while TIMEOUT_RUNNING.load(Ordering::SeqCst) {
            if BREAK_ACTIVE.load(Ordering::SeqCst) {
                // Just entered break — make window fullscreen + always on top
                if !was_on_break {
                    was_on_break = true;
                    set_break_window_state(&app_handle_clone, true);
                }

                let left = break_countdown.load(Ordering::SeqCst);
                if left == 0 {
                    // Break over — restore window
                    BREAK_ACTIVE.store(false, Ordering::SeqCst);
                    next_break.store(interval_secs, Ordering::SeqCst);
                    was_on_break = false;
                    set_break_window_state(&app_handle_clone, false);
                    let _ = app_handle.emit("timeout-break-end", ());
                } else {
                    break_countdown.store(left - 1, Ordering::SeqCst);

                    // Block other windows: minimize them and bring TimiGS back
                    #[cfg(target_os = "windows")]
                    enforce_break_focus();
                }
            } else {
                // Working period
                let left = next_break.load(Ordering::SeqCst);
                if left == 0 {
                    BREAK_ACTIVE.store(true, Ordering::SeqCst);
                    break_countdown.store(break_duration_secs, Ordering::SeqCst);
                    let _ = app_handle.emit("timeout-break-start", break_duration_secs);
                } else {
                    next_break.store(left - 1, Ordering::SeqCst);
                }
            }

            thread::sleep(Duration::from_secs(1));
        }

        // If stopped while on break, restore window
        if was_on_break {
            set_break_window_state(&app_handle_clone, false);
        }
    });

    Ok(())
}

pub fn stop_timeout(password: &str, app_handle: &tauri::AppHandle) -> Result<(), String> {
    let state = TIMEOUT_STATE.lock();
    if let Some(session) = state.as_ref() {
        if simple_hash(password) != session.password_hash {
            return Err("Wrong password".to_string());
        }
    } else {
        return Err("Time OUT is not active".to_string());
    }
    drop(state);

    // Restore window if currently on break
    if BREAK_ACTIVE.load(Ordering::SeqCst) {
        set_break_window_state(app_handle, false);
    }

    TIMEOUT_RUNNING.store(false, Ordering::SeqCst);
    BREAK_ACTIVE.store(false, Ordering::SeqCst);
    *TIMEOUT_STATE.lock() = None;
    Ok(())
}

pub fn get_timeout_status() -> Option<TimeoutStatus> {
    let state = TIMEOUT_STATE.lock();
    state.as_ref().map(|s| TimeoutStatus {
        active: TIMEOUT_RUNNING.load(Ordering::SeqCst),
        break_active: BREAK_ACTIVE.load(Ordering::SeqCst),
        interval_secs: s.interval_secs,
        break_duration_secs: s.break_duration_secs,
        next_break_in: s.next_break_countdown.load(Ordering::SeqCst),
        break_remaining: s.break_countdown.load(Ordering::SeqCst),
    })
}

/// Set or restore the TimiGS window for break mode.
/// On break start: fullscreen + always-on-top + focused.
/// On break end: restore normal window state.
fn set_break_window_state(app_handle: &tauri::AppHandle, entering_break: bool) {
    if let Some(window) = app_handle.get_webview_window("main") {
        if entering_break {
            let _ = window.set_always_on_top(true);
            let _ = window.set_fullscreen(true);
            let _ = window.set_focus();
            // Disable close/minimize buttons during break
            let _ = window.set_closable(false);
            let _ = window.set_minimizable(false);
        } else {
            let _ = window.set_fullscreen(false);
            let _ = window.set_always_on_top(false);
            let _ = window.set_closable(true);
            let _ = window.set_minimizable(true);
        }
    }
}

/// During break: if any non-TimiGS window is in foreground, minimize it
/// and bring the TimiGS window back to foreground.
#[cfg(target_os = "windows")]
fn enforce_break_focus() {
    use windows::Win32::Foundation::{BOOL, HWND, LPARAM};
    use windows::Win32::UI::WindowsAndMessaging::{
        EnumWindows, GetForegroundWindow, GetWindowThreadProcessId, IsWindowVisible,
        SetForegroundWindow, ShowWindow, SW_MINIMIZE, SW_RESTORE,
    };

    unsafe {
        let hwnd: HWND = GetForegroundWindow();
        if hwnd.0.is_null() {
            return;
        }

        let mut process_id: u32 = 0;
        GetWindowThreadProcessId(hwnd, Some(&mut process_id));
        if process_id == 0 {
            return;
        }

        let fg_exe = get_process_exe(process_id);
        let fg_exe_lower = fg_exe.to_lowercase();

        // Allow TimiGS and explorer only
        let is_allowed = fg_exe_lower.contains("explorer.exe") || fg_exe_lower.contains("timigs");

        if !is_allowed {
            let _ = ShowWindow(hwnd, SW_MINIMIZE);

            // Find TimiGS window and bring it back
            struct EnumData {
                found: Option<HWND>,
            }

            let mut data = EnumData { found: None };
            let data_ptr = LPARAM(&mut data as *mut EnumData as isize);

            unsafe extern "system" fn enum_callback(hwnd: HWND, lparam: LPARAM) -> BOOL {
                let data = &mut *(lparam.0 as *mut EnumData);

                if !IsWindowVisible(hwnd).as_bool() {
                    return BOOL(1);
                }

                let mut pid: u32 = 0;
                GetWindowThreadProcessId(hwnd, Some(&mut pid));
                if pid == 0 {
                    return BOOL(1);
                }

                let exe = get_process_exe(pid);
                if exe.to_lowercase().contains("timigs") {
                    data.found = Some(hwnd);
                    return BOOL(0);
                }

                BOOL(1)
            }

            let _ = EnumWindows(Some(enum_callback), data_ptr);

            if let Some(timigs_hwnd) = data.found {
                let _ = ShowWindow(timigs_hwnd, SW_RESTORE);
                let _ = SetForegroundWindow(timigs_hwnd);
            }
        }
    }
}

/// Helper: get exe path for a process ID.
#[cfg(target_os = "windows")]
fn get_process_exe(process_id: u32) -> String {
    use windows::Win32::System::Threading::{
        OpenProcess, PROCESS_QUERY_INFORMATION, PROCESS_VM_READ,
    };

    unsafe {
        let process = OpenProcess(
            PROCESS_QUERY_INFORMATION | PROCESS_VM_READ,
            false,
            process_id,
        );

        if let Ok(handle) = process {
            let mut name_buf = [0u16; 1024];
            let len = windows::Win32::System::ProcessStatus::GetModuleFileNameExW(
                handle,
                None,
                &mut name_buf,
            );
            let _ = windows::Win32::Foundation::CloseHandle(handle);

            if len > 0 {
                return String::from_utf16_lossy(&name_buf[..len as usize]);
            }
        }
        String::new()
    }
}
