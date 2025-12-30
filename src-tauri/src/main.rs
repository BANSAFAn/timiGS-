// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    #[cfg(all(windows, not(debug_assertions)))]
    {
        use std::panic;
        use windows::core::PCWSTR;
        use windows::Win32::UI::WindowsAndMessaging::{MessageBoxW, MB_ICONERROR, MB_OK};

        panic::set_hook(Box::new(|info| {
            let msg = format!("Application crashed: {}\n\nPlease report this error.", info);
            // Convert to UTF-16 null-terminated for Windows API
            let wide_msg: Vec<u16> = msg.encode_utf16().chain(std::iter::once(0)).collect();
            let title: Vec<u16> = "TimiGS Error"
                .encode_utf16()
                .chain(std::iter::once(0))
                .collect();

            unsafe {
                MessageBoxW(
                    None,
                    PCWSTR(wide_msg.as_ptr()),
                    PCWSTR(title.as_ptr()),
                    MB_OK | MB_ICONERROR,
                );
            }
        }));
    }

    timigs_lib::run()
}
