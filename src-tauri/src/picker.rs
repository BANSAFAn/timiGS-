//! Desktop screen/window picker for screen sharing

use serde::Serialize;

/// Represents a desktop source (window or screen) that can be shared
#[derive(Debug, Clone, Serialize)]
pub struct DesktopSource {
    pub id: String,
    pub name: String,
    pub thumbnail: String,
}

/// Get available desktop sources for screen sharing
/// Returns windows and screens that can be captured
#[cfg(target_os = "windows")]
pub fn get_sources() -> Vec<DesktopSource> {
    use windows::Win32::Foundation::{BOOL, HWND, LPARAM, TRUE};
    use windows::Win32::UI::WindowsAndMessaging::{
        EnumWindows, GetWindowTextLengthW, GetWindowTextW, IsWindowVisible,
    };
    
    let mut sources: Vec<DesktopSource> = Vec::new();
    
    unsafe extern "system" fn enum_window_proc(hwnd: HWND, lparam: LPARAM) -> BOOL {
        let sources = &mut *(lparam.0 as *mut Vec<DesktopSource>);
        
        // Only include visible windows
        if IsWindowVisible(hwnd).as_bool() {
            let len = GetWindowTextLengthW(hwnd);
            if len > 0 {
                let mut buffer = vec![0u16; (len + 1) as usize];
                let actual_len = GetWindowTextW(hwnd, &mut buffer);
                if actual_len > 0 {
                    let title = String::from_utf16_lossy(&buffer[..actual_len as usize]);
                    // Filter out empty titles and system windows
                    if !title.is_empty() && !title.starts_with("Default IME") {
                        sources.push(DesktopSource {
                            id: format!("{:?}", hwnd.0),
                            name: title,
                            thumbnail: String::new(), // Thumbnail capture not implemented yet
                        });
                    }
                }
            }
        }
        TRUE
    }
    
    unsafe {
        let _ = EnumWindows(
            Some(enum_window_proc),
            LPARAM(&mut sources as *mut Vec<DesktopSource> as isize),
        );
    }
    
    sources
}

/// Stub implementation for non-Windows platforms
#[cfg(not(target_os = "windows"))]
pub fn get_sources() -> Vec<DesktopSource> {
    Vec::new()
}
