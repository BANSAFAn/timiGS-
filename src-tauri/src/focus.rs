//! Фокус покус....


use once_cell::sync::Lazy;
use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::thread;
use std::time::Duration;

static FOCUS_STATE: Lazy<Mutex<Option<FocusSession>>> = Lazy::new(|| Mutex::new(None));
static FOCUS_RUNNING: AtomicBool = AtomicBool::new(false);

use std::sync::atomic::AtomicU32;
pub static GLOBAL_APP_HANDLE: Lazy<Mutex<Option<tauri::AppHandle>>> = Lazy::new(|| Mutex::new(None));
pub static FOCUS_BYPASS_ATTEMPTS: AtomicU32 = AtomicU32::new(0);

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FocusStatus {
    pub active: bool,
    pub app_name: String,
    pub exe_path: String,
    pub remaining_secs: u64,
    pub total_secs: u64,
}

struct FocusSession {
    app_name: String,
    exe_path: String,
    password_hash: String,
    remaining: Arc<std::sync::atomic::AtomicU64>,
    total_secs: u64,
}

fn simple_hash(password: &str) -> String {
    let mut hash: u64 = 5381;
    for byte in password.bytes() {
        hash = hash.wrapping_mul(33).wrapping_add(byte as u64);
    }
    format!("{:x}", hash)
}

pub fn start_focus(
    app_name: &str,
    exe_path: &str,
    duration_secs: u64,
    password: &str,
) -> Result<(), String> {
    if FOCUS_RUNNING.load(Ordering::SeqCst) {
        return Err("Focus mode is already active".to_string());
    }
// виправити проблему що бере іноді не той шлях до файлу
    let remaining = Arc::new(std::sync::atomic::AtomicU64::new(duration_secs));
    let password_hash = simple_hash(password);

    *FOCUS_STATE.lock() = Some(FocusSession {
        app_name: app_name.to_string(),
        exe_path: exe_path.to_string(),
        password_hash,
        remaining: remaining.clone(),
        total_secs: duration_secs,
    });

    FOCUS_BYPASS_ATTEMPTS.store(0, Ordering::SeqCst);
    FOCUS_RUNNING.store(true, Ordering::SeqCst);

    let _target_exe = exe_path.to_lowercase();

    thread::spawn(move || {
        while FOCUS_RUNNING.load(Ordering::SeqCst) {
            let left = remaining.load(Ordering::SeqCst);
            if left == 0 {
                FOCUS_RUNNING.store(false, Ordering::SeqCst);
                *FOCUS_STATE.lock() = None;
                break;
            }

            #[cfg(target_os = "windows")]
            enforce_focus(&_target_exe);

            thread::sleep(Duration::from_millis(250));

            let current = remaining.load(Ordering::SeqCst);
            if current > 0 {
                remaining.store(current - 1, Ordering::SeqCst);
            }

            thread::sleep(Duration::from_millis(750));
        }
    });

    Ok(())
}

pub fn stop_focus(password: &str) -> Result<(), String> {
    let state = FOCUS_STATE.lock();
    if let Some(session) = state.as_ref() {
        if simple_hash(password) != session.password_hash {
            return Err("Wrong password".to_string());
        }
    } else {
        return Err("Focus mode is not active".to_string());
    }
    drop(state);

    FOCUS_RUNNING.store(false, Ordering::SeqCst);
    *FOCUS_STATE.lock() = None;
    Ok(())
}

pub fn get_focus_status() -> Option<FocusStatus> {
    let state = FOCUS_STATE.lock();
    state.as_ref().map(|s| FocusStatus {
        active: FOCUS_RUNNING.load(Ordering::SeqCst),
        app_name: s.app_name.clone(),
        exe_path: s.exe_path.clone(),
        remaining_secs: s.remaining.load(Ordering::SeqCst),
        total_secs: s.total_secs,
    })
}

#[cfg(target_os = "windows")]
fn enforce_focus(target_exe_lower: &str) {
    use windows::Win32::Foundation::{BOOL, HWND, LPARAM};
    use windows::Win32::UI::WindowsAndMessaging::{
        EnumWindows, GetForegroundWindow, GetWindowThreadProcessId, IsWindowVisible,
        SetForegroundWindow, ShowWindow, SW_MINIMIZE, SW_RESTORE, GetWindowTextW, GetClassNameW,
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

        // Get window class name
        let mut class_buf = [0u16; 256];
        let class_len = GetClassNameW(hwnd, &mut class_buf);
        let class_name = if class_len > 0 {
            String::from_utf16_lossy(&class_buf[..class_len as usize])
        } else {
            String::new()
        };
        let class_name_lower = class_name.to_lowercase();

        // Get window title
        let mut title_buf = [0u16; 512];
        let title_len = GetWindowTextW(hwnd, &mut title_buf);
        let title_name = if title_len > 0 {
            String::from_utf16_lossy(&title_buf[..title_len as usize])
        } else {
            String::new()
        };
        let title_name_lower = title_name.to_lowercase();

        let mut is_allowed = fg_exe_lower.contains(target_exe_lower);

        if !is_allowed {
            // Check if it's the app itself (TimiGS), but not its DevTools
            if (fg_exe_lower.contains("timigs")
                || fg_exe_lower.contains("msedgewebview2")
                || fg_exe_lower.contains("webview2"))
                && !title_name_lower.contains("devtools")
            {
                is_allowed = true;
            }
        }

        if !is_allowed {
            // Check if it's explorer.exe, but only allowed parts (like taskbar/tray).
            // Block desktop (Progman, WorkerW) and file explorer (CabinetWClass, ExploreWClass)
            if fg_exe_lower.contains("explorer.exe") {
                let is_blocked_class = class_name_lower.contains("progman")
                    || class_name_lower.contains("workerw")
                    || class_name_lower.contains("cabinetwclass")
                    || class_name_lower.contains("explorewclass");
                if !is_blocked_class {
                    is_allowed = true;
                }
            }
        }

        if !is_allowed {
            let _ = ShowWindow(hwnd, SW_MINIMIZE);
            
            let attempts = FOCUS_BYPASS_ATTEMPTS.fetch_add(1, Ordering::SeqCst) + 1;
            if attempts >= 5 {
                FOCUS_BYPASS_ATTEMPTS.store(0, Ordering::SeqCst);
                if let Some(app_handle) = GLOBAL_APP_HANDLE.lock().as_ref() {
                    let app_handle_clone = app_handle.clone();
                    thread::spawn(move || {
                        use tauri::Emitter;
                        let _ = app_handle_clone.emit("focus-bypass-attempt", ());
                    });
                }
            }

            let target_owned = target_exe_lower.to_string();
            struct EnumData {
                target: String,
                found: Option<HWND>,
            }

            let mut data = EnumData {
                target: target_owned,
                found: None,
            };

            let data_ptr = LPARAM(&mut data as *mut EnumData as isize);

            unsafe extern "system" fn enum_callback(hwnd: HWND, lparam: LPARAM) -> BOOL {
                let data = &mut *(lparam.0 as *mut EnumData);

                if !IsWindowVisible(hwnd).as_bool() {
                    return BOOL(1); // continue
                }

                let mut pid: u32 = 0;
                GetWindowThreadProcessId(hwnd, Some(&mut pid));
                if pid == 0 {
                    return BOOL(1);
                }

                let exe = get_process_exe(pid);
                let exe_lower = exe.to_lowercase();

                if exe_lower.contains(&data.target) {
                    data.found = Some(hwnd);
                    return BOOL(0); // stop
                }

                BOOL(1)
            }

            let _ = EnumWindows(Some(enum_callback), data_ptr);

            if let Some(target_hwnd) = data.found {
                let _ = ShowWindow(target_hwnd, SW_RESTORE);
                let _ = SetForegroundWindow(target_hwnd);
            }
        }
    }
}

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
