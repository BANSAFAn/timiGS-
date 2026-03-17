//! Notifications module for system notifications

use tauri::Emitter;

/// Send a system notification
pub fn send_notification(app_handle: &tauri::AppHandle, title: &str, body: &str) {
    // Emit event to frontend
    let _ = app_handle.emit("system-notification", NotificationPayload {
        title: title.to_string(),
        body: body.to_string(),
    });

    // Show native system notification
    #[cfg(target_os = "windows")]
    {
        show_windows_notification(title, body);
    }

    #[cfg(target_os = "macos")]
    {
        show_macos_notification(title, body);
    }

    #[cfg(target_os = "linux")]
    {
        show_linux_notification(title, body);
    }
}

#[cfg(target_os = "windows")]
fn show_windows_notification(title: &str, body: &str) {
    use std::process::Command;
    
    // Use PowerShell to show toast notification
    let script = format!(
        r#"
        [Windows.UI.Notifications.ToastNotificationManager, Windows.UI.Notifications, ContentType = WindowsRuntime] | Out-Null
        [Windows.Data.Xml.Dom.XmlDocument, Windows.Data.Xml.Dom.XmlDocument, ContentType = WindowsRuntime] | Out-Null
        
        $template = @"
<toast>
    <visual>
        <binding template="ToastText02">
            <text id="1">{}</text>
            <text id="2">{}</text>
        </binding>
    </visual>
</toast>
"@
        
        $xml = New-Object Windows.Data.Xml.Dom.XmlDocument
        $xml.LoadXml($template)
        
        $toast = [Windows.UI.Notifications.ToastNotification]::new($xml)
        [Windows.UI.Notifications.ToastNotificationManager]::CreateToastNotifier("TimiGS").Show($toast)
        "#,
        title.replace('"', "'"),
        body.replace('"', "'")
    );

    let _ = Command::new("powershell")
        .args(&["-Command", &script])
        .output();
}

#[cfg(target_os = "macos")]
fn show_macos_notification(title: &str, body: &str) {
    use std::process::Command;
    
    let script = format!(
        r#"display notification "{}" with title "{}""#,
        body.replace('"', "'"),
        title.replace('"', "'")
    );

    let _ = Command::new("osascript")
        .args(&["-e", &script])
        .output();
}

#[cfg(target_os = "linux")]
fn show_linux_notification(title: &str, body: &str) {
    use std::process::Command;
    
    let _ = Command::new("notify-send")
        .args(&[title, body])
        .output();
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
