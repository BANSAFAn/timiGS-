//! Time OUT module — enforced break reminders
//! During breaks: sets TimiGS to fullscreen + always-on-top and blocks other apps.

use chrono::{Datelike, Local, Timelike};
use once_cell::sync::Lazy;
use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, AtomicU64, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::Duration;
use tauri::{Emitter, Manager};

#[cfg(target_os = "windows")]
use windows::Win32::Foundation::{LPARAM, LRESULT, WPARAM};
#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::{
    CallNextHookEx, GetMessageW, SetWindowsHookExW, HHOOK, KBDLLHOOKSTRUCT,
    MSG, WH_KEYBOARD_LL,
};

#[cfg(target_os = "windows")]
static mut KBD_HOOK: HHOOK = HHOOK(std::ptr::null_mut());

#[cfg(target_os = "windows")]
unsafe extern "system" fn keyboard_hook_proc(code: i32, wparam: WPARAM, lparam: LPARAM) -> LRESULT {
    if code >= 0 {
        let is_break = BREAK_ACTIVE.load(Ordering::SeqCst);
        let kb = &*(lparam.0 as *const KBDLLHOOKSTRUCT);
        let vk_code = kb.vkCode;
        let flags = kb.flags.0;
        let alt_down = (flags & 32) != 0;

        if is_break {
            let mut block = false;
            // Alt+Tab or Alt+Esc
            if alt_down && (vk_code == 0x09 || vk_code == 0x1B) {
                block = true;
            }
            // LWIN / RWIN
            if vk_code == 0x5B || vk_code == 0x5C {
                block = true;
            }

            if block {
                println!("TimeOut Hook: Blocked VK {}!", vk_code);
                return LRESULT(1);
            }
        }
    }
    CallNextHookEx(KBD_HOOK, code, wparam, lparam)
}

#[cfg(target_os = "windows")]
pub fn init_keyboard_hook() {
    unsafe {
        if KBD_HOOK.0.is_null() {
            std::thread::spawn(|| {
                let hook = SetWindowsHookExW(
                    WH_KEYBOARD_LL,
                    Some(keyboard_hook_proc),
                    windows::Win32::Foundation::HINSTANCE(std::ptr::null_mut()),
                    0,
                )
                .unwrap_or(HHOOK(std::ptr::null_mut()));

                if hook.0.is_null() {
                    println!("TimeOut Hook: Failed to install WH_KEYBOARD_LL!");
                } else {
                    println!("TimeOut Hook: Successfully installed WH_KEYBOARD_LL.");
                }

                KBD_HOOK = hook;

                let mut msg = MSG::default();
                while GetMessageW(
                    &mut msg,
                    windows::Win32::Foundation::HWND(std::ptr::null_mut()),
                    0,
                    0,
                )
                .into()
                {
                    let _ = windows::Win32::UI::WindowsAndMessaging::TranslateMessage(&msg);
                    let _ = windows::Win32::UI::WindowsAndMessaging::DispatchMessageW(&msg);
                }
            });
        }
    }
}

static TIMEOUT_STATE: Lazy<Mutex<Option<TimeoutSession>>> = Lazy::new(|| Mutex::new(None));
static TIMEOUT_RUNNING: AtomicBool = AtomicBool::new(false);
static BREAK_ACTIVE: AtomicBool = AtomicBool::new(false);
static SCHEDULE_ENABLED: AtomicBool = AtomicBool::new(false);
// Time range
static SCHEDULE_START_HOUR: AtomicU64 = AtomicU64::new(9);
static SCHEDULE_START_MINUTE: AtomicU64 = AtomicU64::new(0);
static SCHEDULE_END_HOUR: AtomicU64 = AtomicU64::new(17);
static SCHEDULE_END_MINUTE: AtomicU64 = AtomicU64::new(0);
// Custom breaks (stored as minutes from midnight + duration)
static CUSTOM_BREAKS: Lazy<Mutex<Vec<CustomBreak>>> = Lazy::new(|| Mutex::new(vec![]));
// Days
static SCHEDULE_DAYS: Lazy<Mutex<Vec<u32>>> = Lazy::new(|| Mutex::new(vec![]));
// Schedule work/break settings
static SCHEDULE_INTERVAL_SECS: AtomicU64 = AtomicU64::new(2700); // 45 min default
static SCHEDULE_BREAK_DURATION_SECS: AtomicU64 = AtomicU64::new(600); // 10 min default
static SCHEDULE_PASSWORD_HASH: Lazy<Mutex<String>> = Lazy::new(|| Mutex::new(String::new()));

#[derive(Debug, Clone)]
pub struct CustomBreak {
    pub time_minutes: u32,    // Minutes from midnight (e.g., 11:00 AM = 660)
    pub duration_minutes: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TimeoutStatus {
    pub active: bool,
    pub break_active: bool,
    pub interval_secs: u64,
    pub break_duration_secs: u64,
    pub next_break_in: u64,
    pub break_remaining: u64,
    pub schedule_enabled: bool,
    pub schedule_start_hour: u64,
    pub schedule_start_minute: u64,
    pub schedule_end_hour: u64,
    pub schedule_end_minute: u64,
    pub schedule_days: Vec<u32>,
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
    enable_schedule: bool,
    schedule_start_hour: Option<u64>,
    schedule_start_minute: Option<u64>,
    schedule_end_hour: Option<u64>,
    schedule_end_minute: Option<u64>,
    custom_breaks: Option<Vec<serde_json::Value>>,
    selected_days: Vec<u32>,
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

    // Store schedule settings
    SCHEDULE_ENABLED.store(enable_schedule, Ordering::SeqCst);
    if let Some(h) = schedule_start_hour {
        SCHEDULE_START_HOUR.store(h, Ordering::SeqCst);
    }
    if let Some(m) = schedule_start_minute {
        SCHEDULE_START_MINUTE.store(m, Ordering::SeqCst);
    }
    if let Some(h) = schedule_end_hour {
        SCHEDULE_END_HOUR.store(h, Ordering::SeqCst);
    }
    if let Some(m) = schedule_end_minute {
        SCHEDULE_END_MINUTE.store(m, Ordering::SeqCst);
    }
    *SCHEDULE_DAYS.lock() = selected_days;

    // Parse and store custom breaks
    if let Some(breaks) = custom_breaks {
        let parsed_breaks: Vec<CustomBreak> = breaks
            .iter()
            .filter_map(|b| {
                let hour = b.get("hour")?.as_u64()? as u32;
                let minute = b.get("minute")?.as_u64()? as u32;
                let duration = b.get("duration")?.as_u64()? as u32;
                let time_minutes = hour * 60 + minute;
                Some(CustomBreak {
                    time_minutes,
                    duration_minutes: duration,
                })
            })
            .collect();
        *CUSTOM_BREAKS.lock() = parsed_breaks;
        println!("Custom breaks set: {:?}", CUSTOM_BREAKS.lock());
    }

    TIMEOUT_RUNNING.store(true, Ordering::SeqCst);
    BREAK_ACTIVE.store(false, Ordering::SeqCst);

    let app_handle_clone = app_handle.clone();
    let app_handle_schedule = app_handle.clone();
    let next_break_main = next_break.clone();
    let next_break_sched = next_break.clone();

    // Main timeout loop
    thread::spawn(move || {
        let mut was_on_break = false;
        let mut five_min_notified = false;

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
                    next_break_main.store(interval_secs, Ordering::SeqCst);
                    was_on_break = false;
                    set_break_window_state(&app_handle_clone, false);
                    let _ = app_handle_clone.emit("timeout-break-end", ());
                    five_min_notified = false; // Reset for next cycle
                } else {
                    break_countdown.store(left - 1, Ordering::SeqCst);

                    // Block other windows: minimize them and bring TimiGS back
                    #[cfg(target_os = "windows")]
                    enforce_break_focus();
                }
            } else {
                // Working period
                let left = next_break_main.load(Ordering::SeqCst);
                if left == 0 {
                    BREAK_ACTIVE.store(true, Ordering::SeqCst);
                    break_countdown.store(break_duration_secs, Ordering::SeqCst);
                    let _ = app_handle_clone.emit("timeout-break-start", break_duration_secs);
                    five_min_notified = false; // Reset for next cycle
                } else {
                    // Send 5-minute warning notification
                    if !five_min_notified && left == 300 {
                        five_min_notified = true;
                        crate::notifications::send_notification(
                            &app_handle_clone,
                            "Break in 5 minutes! ☕",
                            "Time to take a break soon. Get ready to relax!",
                        );
                    }
                    next_break_main.store(left - 1, Ordering::SeqCst);
                }
            }

            thread::sleep(Duration::from_secs(1));
        }

        // If stopped while on break, restore window
        if was_on_break {
            set_break_window_state(&app_handle_clone, false);
        }
    });

    // Schedule monitoring thread (only if schedule is enabled)
    if enable_schedule {
        thread::spawn(move || {
            let mut last_checked_minute = 999;

            while TIMEOUT_RUNNING.load(Ordering::SeqCst) {
                if SCHEDULE_ENABLED.load(Ordering::SeqCst) {
                    let now = Local::now();
                    let current_hour = now.hour() as u64;
                    let current_minute = now.minute() as u64;
                    let current_day = now.weekday().num_days_from_sunday();
                    let current_time_minutes = current_hour * 60 + current_minute;

                    let days = SCHEDULE_DAYS.lock();
                    let custom_breaks = CUSTOM_BREAKS.lock();

                    // Check if current day is in selected days
                    let is_selected_day = days.contains(&current_day);

                    if is_selected_day {
                        // Check if we should start a break now
                        for break_item in custom_breaks.iter() {
                            // Check if current time matches break time (within the same minute)
                            if current_time_minutes == break_item.time_minutes as u64
                                && current_minute != last_checked_minute
                            {
                                last_checked_minute = current_minute;

                                // Only auto-start if not already in a break
                                if !BREAK_ACTIVE.load(Ordering::SeqCst) {
                                    let session = TIMEOUT_STATE.lock();
                                    if let Some(s) = session.as_ref() {
                                        next_break_sched.store(s.interval_secs, Ordering::SeqCst);
                                    }
                                    drop(session);

                                    let _ = app_handle_schedule.emit("timeout-schedule-triggered", ());
                                }
                                break;
                            }
                        }
                    }
                    
                    if current_minute != last_checked_minute && current_minute == 0 {
                        // Reset at the start of each hour to allow re-triggering
                        last_checked_minute = 999;
                    }
                }
                
                thread::sleep(Duration::from_secs(10));
            }
        });
    }

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
        schedule_enabled: SCHEDULE_ENABLED.load(Ordering::SeqCst),
        schedule_start_hour: SCHEDULE_START_HOUR.load(Ordering::SeqCst),
        schedule_start_minute: SCHEDULE_START_MINUTE.load(Ordering::SeqCst),
        schedule_end_hour: SCHEDULE_END_HOUR.load(Ordering::SeqCst),
        schedule_end_minute: SCHEDULE_END_MINUTE.load(Ordering::SeqCst),
        schedule_days: SCHEDULE_DAYS.lock().clone(),
    })
}

/// Save timeout schedule settings
pub fn save_timeout_schedule(
    interval_secs: u64,
    break_duration_secs: u64,
    password: &str,
    schedule_start_hour: u64,
    schedule_start_minute: u64,
    schedule_end_hour: u64,
    schedule_end_minute: u64,
    custom_breaks: Vec<CustomBreak>,
    selected_days: Vec<u32>,
) -> Result<(), String> {
    let breaks_count = custom_breaks.len();
    
    SCHEDULE_INTERVAL_SECS.store(interval_secs, Ordering::SeqCst);
    SCHEDULE_BREAK_DURATION_SECS.store(break_duration_secs, Ordering::SeqCst);
    *SCHEDULE_PASSWORD_HASH.lock() = simple_hash(password);
    
    SCHEDULE_START_HOUR.store(schedule_start_hour, Ordering::SeqCst);
    SCHEDULE_START_MINUTE.store(schedule_start_minute, Ordering::SeqCst);
    SCHEDULE_END_HOUR.store(schedule_end_hour, Ordering::SeqCst);
    SCHEDULE_END_MINUTE.store(schedule_end_minute, Ordering::SeqCst);
    *CUSTOM_BREAKS.lock() = custom_breaks;
    *SCHEDULE_DAYS.lock() = selected_days;
    SCHEDULE_ENABLED.store(true, Ordering::SeqCst);
    
    println!("Timeout schedule saved with {} breaks", breaks_count);
    Ok(())
}

/// Set or restore the TimiGS window for break mode.
/// On break start: fullscreen + always-on-top + focused.
/// On break end: restore normal window state.
fn set_break_window_state(app_handle: &tauri::AppHandle, entering_break: bool) {
    if let Some(window) = app_handle.get_webview_window("main") {
        if entering_break {
            let _ = window.set_decorations(false);
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
            let _ = window.set_decorations(true);
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
