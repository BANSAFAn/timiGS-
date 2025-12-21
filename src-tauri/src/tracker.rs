//! Windows activity tracker module

use crate::db;
use once_cell::sync::Lazy;
use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use std::sync::atomic::{AtomicBool, Ordering};
use std::thread;
use std::time::Duration;

#[cfg(windows)]
use windows::{
    Win32::{
        Foundation::HWND,
        System::ProcessStatus::GetModuleBaseNameW,
        System::Threading::{OpenProcess, PROCESS_QUERY_INFORMATION, PROCESS_VM_READ},
        UI::WindowsAndMessaging::{GetForegroundWindow, GetWindowTextW, GetWindowThreadProcessId},
    },
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

        // Open process to get executable name
        let process = OpenProcess(
            PROCESS_QUERY_INFORMATION | PROCESS_VM_READ,
            false,
            process_id,
        );

        let (app_name, exe_path) = if let Ok(handle) = process {
            let mut name_buf = [0u16; 260];
            let len = GetModuleBaseNameW(handle, None, &mut name_buf);
            
            if len > 0 {
                let exe_name = String::from_utf16_lossy(&name_buf[..len as usize]);
                let app_name = exe_name.replace(".exe", "").replace(".EXE", "");
                (app_name, exe_name)
            } else {
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

#[cfg(not(windows))]
fn get_foreground_window_info() -> Option<ActiveWindow> {
    // Stub for non-Windows platforms
    None
}

pub fn get_current_active() -> Option<ActiveWindow> {
    get_foreground_window_info()
}

pub fn get_current_session() -> Option<CurrentSession> {
    CURRENT_SESSION.lock().clone()
}

pub fn start_tracking() {
    if RUNNING.load(Ordering::SeqCst) {
        return;
    }
    
    RUNNING.store(true, Ordering::SeqCst);
    
    thread::spawn(|| {
        let mut last_app = String::new();
        let mut last_title = String::new();
        
        while RUNNING.load(Ordering::SeqCst) {
            if let Some(active) = get_foreground_window_info() {
                // Create new session if app OR window title changed
                if active.exe_path != last_app || active.window_title != last_title {
                    // End previous session
                    if let Some(session) = CURRENT_SESSION.lock().take() {
                        let _ = db::end_session(session.id);
                    }
                    
                    // Start new session
                    if let Ok(id) = db::start_session(&active.app_name, &active.window_title, &active.exe_path) {
                        *CURRENT_SESSION.lock() = Some(CurrentSession {
                            id,
                            app_name: active.app_name.clone(),
                            window_title: active.window_title.clone(),
                            exe_path: active.exe_path.clone(),
                        });
                    }
                    
                    last_app = active.exe_path;
                    last_title = active.window_title;
                }
            }
            
            thread::sleep(Duration::from_secs(1));
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
