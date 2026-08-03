//! Notifications module for system notifications

use tauri::Emitter;

/// Send a system notification
pub fn send_notification(app_handle: &tauri::AppHandle, title: &str, body: &str) {
    // Emit event to frontend
    let _ = app_handle.emit("system-notification", NotificationPayload {
        title: title.to_string(),
        body: body.to_string(),
    });

    // Show native system notification directly via tauri-plugin-notification (no external shell processes)
    #[cfg(desktop)]
    {
        use tauri_plugin_notification::NotificationExt;
        let _ = app_handle
            .notification()
            .builder()
            .title(title)
            .body(body)
            .show();
    }
}

/// Notification payload for frontend
#[derive(Clone, serde::Serialize)]
pub struct NotificationPayload {
    pub title: String,
    pub body: String,
}

/// Command to send notification from frontend
#[tauri::command]
pub fn send_notification_cmd(
    app: tauri::AppHandle,
    title: String,
    body: String,
) -> Result<(), String> {
    send_notification(&app, &title, &body);
    Ok(())
}
