use base64::{engine::general_purpose, Engine as _};
use image::ImageFormat;
use serde::Serialize;
use std::ffi::c_void;
use std::io::Cursor;
use std::mem;
use windows::Win32::Foundation::{BOOL, HWND, LPARAM, RECT};
use windows::Win32::Graphics::Gdi::{
    CreateCompatibleBitmap, CreateCompatibleDC, DeleteDC, DeleteObject, GetDC, GetDIBits,
    ReleaseDC, SelectObject, SetStretchBltMode, StretchBlt, BITMAPINFO, BITMAPINFOHEADER, BI_RGB,
    DIB_RGB_COLORS, HALFTONE, SRCCOPY,
};
use windows::Win32::UI::WindowsAndMessaging::{
    EnumWindows, GetWindowRect, GetWindowTextLengthW, GetWindowTextW, IsWindowVisible,
};

#[derive(Serialize, Clone)]
pub struct DesktopSource {
    pub id: String,
    pub name: String,
    pub thumbnail: String, // Base64 PNG
}

// Global vector to collect windows during enumeration
// Note: In a real production app, we might pass a pointer to a struct,
// but for simplicity with the C-callback, using a thread-local or safe static is tricky.
// We'll use a standard approach of passing the Vec pointer as LPARAM.

pub fn get_sources() -> Vec<DesktopSource> {
    let mut sources = Vec::new();

    unsafe {
        let lparam = &mut sources as *mut Vec<DesktopSource> as isize;
        let _ = EnumWindows(Some(enum_windows_proc), LPARAM(lparam));
    }

    sources
}

unsafe extern "system" fn enum_windows_proc(hwnd: HWND, lparam: LPARAM) -> BOOL {
    if !IsWindowVisible(hwnd).as_bool() {
        return BOOL(1);
    }

    // Filter out small windows or tooltips?
    let mut rect = RECT::default();
    let _ = GetWindowRect(hwnd, &mut rect);
    let width = rect.right - rect.left;
    let height = rect.bottom - rect.top;

    if width < 100 || height < 100 {
        return BOOL(1);
    }

    // Get Title
    let len = GetWindowTextLengthW(hwnd);
    if len > 0 {
        let mut buf = vec![0u16; (len + 1) as usize];
        if GetWindowTextW(hwnd, &mut buf) > 0 {
            let title = String::from_utf16_lossy(&buf[..len as usize]);

            // Filter some common system windows
            if title == "Program Manager"
                || title == "Settings"
                || title == "Microsoft Text Input Application"
            {
                return BOOL(1);
            }

            // Capture Thumbnail
            if let Some(thumb) = capture_window_thumb(hwnd, width, height) {
                let source = DesktopSource {
                    id: format!("window:{}", hwnd.0 as isize), // Simple ID for now
                    name: title,
                    thumbnail: thumb,
                };

                let sources_ptr = lparam.0 as *mut Vec<DesktopSource>;
                (*sources_ptr).push(source);
            }
        }
    }

    BOOL(1)
}

unsafe fn capture_window_thumb(hwnd: HWND, w: i32, h: i32) -> Option<String> {
    // We want a small thumbnail, e.g., 300px width max aspect ratio
    let thumb_w = 320;
    let thumb_h = (h as f32 * (320.0 / w as f32)) as i32;

    let hdc_window = GetDC(hwnd);
    let hdc_mem = CreateCompatibleDC(hdc_window);
    let hbitmap = CreateCompatibleBitmap(hdc_window, thumb_w, thumb_h);
    let old_obj = SelectObject(hdc_mem, hbitmap);

    // Use PrintWindow for capturing (works better for some transparent apps than BitBlt)
    // Actually PrintWindow writes to the bitmap size.
    // We might need to capture full size then scale down?
    // For simplicity/perf, let's try StretchBlt from Screen/Window DC directly.

    // Setup StretchBlt mode
    SetStretchBltMode(hdc_mem, HALFTONE);

    // Copy from Window DC to Memory DC (Scaling down)
    // Note: PrintWindow renders to the DC at original size usually.
    // Let's try StretchBlt from the window DC.
    // IsWindowVisible check passed, but some windows might be minimized.
    // If minimized, we might get black. For now assume restored.

    let success = StretchBlt(
        hdc_mem, 0, 0, thumb_w, thumb_h, hdc_window, 0, 0, w, h, SRCCOPY,
    );

    if !success.as_bool() {
        // Fallback or cleanup
    }

    // Extract bits
    let mut bi = BITMAPINFOHEADER::default();
    bi.biSize = mem::size_of::<BITMAPINFOHEADER>() as u32;
    bi.biWidth = thumb_w;
    bi.biHeight = -thumb_h; // Top-down
    bi.biPlanes = 1;
    bi.biBitCount = 32;
    bi.biCompression = BI_RGB.0;

    let mut info = BITMAPINFO::default();
    info.bmiHeader = bi;

    let mut pixels = vec![0u8; (thumb_w * thumb_h * 4) as usize];

    let result = GetDIBits(
        hdc_mem,
        hbitmap,
        0,
        thumb_h as u32,
        Some(pixels.as_mut_ptr() as *mut c_void),
        &mut info,
        DIB_RGB_COLORS,
    );

    // Cleanup GDI
    SelectObject(hdc_mem, old_obj);
    DeleteObject(hbitmap);
    DeleteDC(hdc_mem);
    ReleaseDC(hwnd, hdc_window);

    if result == 0 {
        return None;
    }

    // Convert BGR/BGRA to image crate DynamicImage -> PNG
    // Windows GDI returns BGRA usually
    // We can use the `image` crate to encode.
    // Pixels are in `pixels`.

    let img_buf =
        image::ImageBuffer::<image::Rgba<u8>, _>::from_raw(thumb_w as u32, thumb_h as u32, pixels)?;
    // Use iterator to swap BGR to RGB?
    // Or just save and let image handle it?
    // Usually Windows bitmaps are BGRA.
    // Convert BGRA -> RGBA
    let mut rgba_img = image::DynamicImage::ImageRgba8(img_buf).to_rgba8();

    for pixel in rgba_img.pixels_mut() {
        // Swap Blue and Red
        let tmp = pixel[0];
        pixel[0] = pixel[2];
        pixel[2] = tmp;
        // Alpha is handy if capturing transparent, but often ignored in GDI screenshots (set to 0 or 255)
        // Ensure alpha is 255 if it looks transparent?
        if pixel[3] == 0 {
            pixel[3] = 255;
        }
    }

    let mut cursor = Cursor::new(Vec::new());
    match rgba_img.write_to(&mut cursor, ImageFormat::Png) {
        Ok(_) => {
            let base64_str = general_purpose::STANDARD.encode(cursor.get_ref());
            Some(format!("data:image/png;base64,{}", base64_str))
        }
        Err(_) => None,
    }
}
