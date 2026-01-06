#[cfg(target_os = "windows")]
use base64::{engine::general_purpose, Engine as _};
#[cfg(target_os = "windows")]
use image::{ImageBuffer, Rgba};
#[cfg(target_os = "windows")]
use std::ffi::OsStr;
#[cfg(target_os = "windows")]
use std::os::windows::ffi::OsStrExt;

#[cfg(target_os = "windows")]
use windows::Win32::Foundation::HWND;
#[cfg(target_os = "windows")]
use windows::Win32::Graphics::Gdi::{
    CreateCompatibleDC, DeleteDC, DeleteObject, GetDC, GetObjectW, ReleaseDC, SelectObject, BITMAP,
    HBRUSH, HGDIOBJ,
};
#[cfg(target_os = "windows")]
use windows::Win32::UI::Shell::{SHGetFileInfoW, SHFILEINFOW, SHGFI_ICON, SHGFI_LARGEICON};
#[cfg(target_os = "windows")]
use windows::Win32::UI::WindowsAndMessaging::{
    DestroyIcon, DrawIconEx, GetIconInfo, DI_NORMAL, HICON,
};

pub fn get_app_icon(exe_path: &str) -> Option<String> {
    #[cfg(target_os = "windows")]
    unsafe {
        get_icon_windows(exe_path)
    }
    #[cfg(not(target_os = "windows"))]
    {
        let _ = exe_path; // Suppress unused variable warning
                          // TODO: Implement for Linux/macOS
        None
    }
}

#[cfg(target_os = "windows")]
unsafe fn get_icon_windows(path: &str) -> Option<String> {
    let wide_path: Vec<u16> = OsStr::new(path)
        .encode_wide()
        .chain(std::iter::once(0))
        .collect();

    let mut shfileinfo = SHFILEINFOW::default();

    use windows::Win32::Storage::FileSystem::FILE_ATTRIBUTE_NORMAL;
    let result = SHGetFileInfoW(
        windows::core::PCWSTR(wide_path.as_ptr()),
        FILE_ATTRIBUTE_NORMAL,
        Some(&mut shfileinfo),
        std::mem::size_of::<SHFILEINFOW>() as u32,
        SHGFI_ICON | SHGFI_LARGEICON,
    );

    if result == 0 {
        return None;
    }

    let hicon = shfileinfo.hIcon;
    if hicon.is_invalid() {
        return None;
    }

    let png_base64 = hicon_to_base64(hicon);

    let _ = DestroyIcon(hicon);

    png_base64
}

#[cfg(target_os = "windows")]
unsafe fn hicon_to_base64(hicon: HICON) -> Option<String> {
    // 1. Get Icon Info to extract bitmap
    let mut icon_info = std::mem::zeroed();
    // GetIconInfo returns BOOL which is wrapped in Result in newer windows-rs versions, or just BOOL.
    // Error said: no method named `as_bool` found for enum `Result`.
    // So it returns Result.
    if GetIconInfo(hicon, &mut icon_info).is_err() {
        return None;
    }

    // cleanup bitmaps from GetIconInfo later
    defer! {
        if !icon_info.hbmColor.is_invalid() { let _ = DeleteObject(icon_info.hbmColor); }
        if !icon_info.hbmMask.is_invalid() { let _ = DeleteObject(icon_info.hbmMask); }
    }

    // 2. We need to draw the Icon to a Bitmap context because GetIconInfo gives us raw bitmaps which might be complex
    // Simpler approach: Create a 32x32 bitmap and DrawIconEx into it.

    let width = 32;
    let height = 32;

    let hdc_screen = GetDC(HWND(std::ptr::null_mut()));
    let hdc_mem = CreateCompatibleDC(hdc_screen);
    let hbitmap = windows::Win32::Graphics::Gdi::CreateCompatibleBitmap(hdc_screen, width, height);

    let hold = SelectObject(hdc_mem, hbitmap);

    // Draw icon
    let _ = DrawIconEx(
        hdc_mem,
        0,
        0,
        hicon,
        width,
        height,
        0,
        HBRUSH(std::ptr::null_mut()), // Fixed: HGDIOBJ -> HBRUSH
        DI_NORMAL,
    );

    // Get Struct to read pixels
    let mut bitmap: BITMAP = std::mem::zeroed();
    GetObjectW(
        HGDIOBJ(hbitmap.0 as _),
        std::mem::size_of::<BITMAP>() as i32,
        Some(&mut bitmap as *mut _ as *mut _),
    );

    use windows::Win32::Graphics::Gdi::{
        GetDIBits, BITMAPINFO, BITMAPINFOHEADER, BI_RGB, DIB_RGB_COLORS,
    };

    let mut bi = BITMAPINFO {
        bmiHeader: BITMAPINFOHEADER {
            biSize: std::mem::size_of::<BITMAPINFOHEADER>() as u32,
            biWidth: width,
            biHeight: -height, // top-down
            biPlanes: 1,
            biBitCount: 32,
            biCompression: BI_RGB.0, // Fixed: BI_RGB -> BI_RGB.0 (u32 extraction from newtype)
            ..Default::default()
        },
        ..Default::default()
    };

    let mut pixels = vec![0u8; (width * height * 4) as usize];

    GetDIBits(
        hdc_mem,
        hbitmap,
        0,
        height as u32,
        Some(pixels.as_mut_ptr() as *mut _),
        &mut bi,
        DIB_RGB_COLORS,
    );
    // Note: Rust strict typing might complain about cast above.

    // Cleanup GDI
    SelectObject(hdc_mem, hold);
    let _ = DeleteObject(hbitmap);
    let _ = DeleteDC(hdc_mem);
    ReleaseDC(HWND(std::ptr::null_mut()), hdc_screen);

    // Convert pixels (BGRA) to RgbaImage
    // Windows logic often 0x00RRGGBB or BGRA.

    // Creating image buffer
    let mut img: ImageBuffer<Rgba<u8>, Vec<u8>> = ImageBuffer::new(width as u32, height as u32);
    for (i, pixel) in img.pixels_mut().enumerate() {
        let offset = i * 4;
        if offset + 3 < pixels.len() {
            let b = pixels[offset];
            let g = pixels[offset + 1];
            let r = pixels[offset + 2];
            let a = pixels[offset + 3]; // Alpha often 0 in simple GDI bitmaps if not handled carefully
                                        // If Alpha is 0 but color is not black, set to 255 (hack)
            let alpha = if a == 0 && (r != 0 || g != 0 || b != 0) {
                255
            } else {
                a
            };

            *pixel = Rgba([r, g, b, alpha]);
        }
    }

    // Encode to PNG
    let mut buf = Vec::new();
    let encoder = image::codecs::png::PngEncoder::new(&mut buf);
    match img.write_with_encoder(encoder) {
        Ok(_) => Some(general_purpose::STANDARD.encode(buf)),
        Err(_) => None,
    }
}
