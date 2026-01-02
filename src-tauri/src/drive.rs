use crate::auth;
use reqwest::blocking::Client;
use std::fs;

use serde_json::Value;
use urlencoding;

// Helper to get or create folder
fn get_or_create_folder(client: &Client, token: &str, folder_name: &str) -> Result<String, String> {
    // Check if folder exists
    let query = format!(
        "name='{}' and mimeType='application/vnd.google-apps.folder' and trashed=false",
        folder_name
    );
    let list_url = format!(
        "https://www.googleapis.com/drive/v3/files?q={}",
        urlencoding::encode(&query)
    );

    let res = client
        .get(&list_url)
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .map_err(|e| e.to_string())?;

    let body: Value = res.json().map_err(|e| e.to_string())?;
    let files = body["files"]
        .as_array()
        .ok_or("Failed to parse drive response")?;

    if let Some(folder) = files.first() {
        return Ok(folder["id"].as_str().unwrap().to_string());
    }

    // Create folder
    let create_url = "https://www.googleapis.com/drive/v3/files";
    let body = serde_json::json!({
        "name": folder_name,
        "mimeType": "application/vnd.google-apps.folder"
    });

    let res = client
        .post(create_url)
        .header("Authorization", format!("Bearer {}", token))
        .json(&body)
        .send()
        .map_err(|e| e.to_string())?;

    if res.status().is_success() {
        let body: Value = res.json().map_err(|e| e.to_string())?;
        Ok(body["id"].as_str().unwrap().to_string())
    } else {
        Err("Failed to create folder".to_string())
    }
}

// Upload local DB file to Google Drive
// Simple strategy: Overwrite file with name "timigs_backup.db"
pub fn backup_data() -> Result<String, String> {
    let token = auth::get_valid_token()?;
    let client = Client::new();

    // 0. Ensure "TimiGS Logs" folder exists
    let folder_id = get_or_create_folder(&client, &token, "TimiGS Logs")?;

    // 1. Check if file exists to get ID (INSIDE the folder)
    // q = name='timigs_backup.db' and 'folderId' in parents
    let query = format!(
        "name='timigs_backup.db' and '{}' in parents and trashed=false",
        folder_id
    );
    let list_url = format!(
        "https://www.googleapis.com/drive/v3/files?q={}",
        urlencoding::encode(&query)
    );

    let res = client
        .get(list_url)
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .map_err(|e| e.to_string())?;

    let body: Value = res.json().map_err(|e| e.to_string())?;
    let files = body["files"]
        .as_array()
        .ok_or("Failed to parse drive response")?;

    let file_id = files
        .first()
        .and_then(|f| f["id"].as_str().map(|s| s.to_string()));

    // 2. Read local DB path
    let db_path = crate::db::get_db_path();

    // 3. Upload or Update
    if let Some(id) = file_id {
        // Update existing (using PATCH/UPDATE endpoint usually requires different flow for media)
        // Simple Update: upload to /upload/drive/v3/files/fileId?uploadType=media
        let update_url = format!(
            "https://www.googleapis.com/upload/drive/v3/files/{}?uploadType=media",
            id
        );
        let content = fs::read(&db_path).map_err(|e| e.to_string())?;

        let _ = client
            .patch(update_url)
            .header("Authorization", format!("Bearer {}", token))
            .body(content)
            .send()
            .map_err(|e| e.to_string())?;

        Ok(format!("Backup updated in 'TimiGS Logs' (ID: {})", id))
    } else {
        // Create new (Multipart for metadata + content)
        // Simpler: Just create with uploadType=multipart is best, but reqwest blocking multipart is easy.

        let create_url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";

        let metadata = serde_json::json!({
            "name": "timigs_backup.db",
            "parents": [folder_id],
            "mimeType": "application/x-sqlite3"
        })
        .to_string();

        let content = fs::read(&db_path).map_err(|e| e.to_string())?;

        let form = reqwest::blocking::multipart::Form::new()
            .part(
                "metadata",
                reqwest::blocking::multipart::Part::text(metadata)
                    .mime_str("application/json")
                    .unwrap(),
            )
            .part(
                "file",
                reqwest::blocking::multipart::Part::bytes(content)
                    .mime_str("application/x-sqlite3")
                    .unwrap(),
            );

        let res = client
            .post(create_url)
            .header("Authorization", format!("Bearer {}", token))
            .multipart(form)
            .send()
            .map_err(|e| e.to_string())?;

        if res.status().is_success() {
            Ok("Backup created in 'TimiGS Logs' folder".to_string())
        } else {
            Err(format!("Upload failed: {:?}", res.text()))
        }
    }
}

pub fn restore_data() -> Result<String, String> {
    let token = auth::get_valid_token()?;
    let client = Client::new();

    // 1. Find file
    let list_url =
        "https://www.googleapis.com/drive/v3/files?q=name='timigs_backup.db' and trashed=false";
    let res = client
        .get(list_url)
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .map_err(|e| e.to_string())?;

    let body: Value = res.json().map_err(|e| e.to_string())?;
    let files = body["files"]
        .as_array()
        .ok_or("Failed to parse drive response")?;

    let file_id = files
        .first()
        .and_then(|f| f["id"].as_str())
        .ok_or("No backup found in Google Drive")?;

    // 2. Download
    let download_url = format!(
        "https://www.googleapis.com/drive/v3/files/{}?alt=media",
        file_id
    );
    let mut res = client
        .get(download_url)
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .map_err(|e| e.to_string())?;

    // 3. Write to temp file first to ensure integrity
    let db_path = crate::db::get_db_path();
    let temp_path = db_path.with_extension("db.temp");

    let mut file = fs::File::create(&temp_path).map_err(|e| e.to_string())?;
    res.copy_to(&mut file).map_err(|e| e.to_string())?;

    // 4. Replace current DB (Requires closing connection if possible, or simple replace on next restart)
    // Windows might lock the DB file if it's open by the app.
    // Ideally we should close DB connection before this.
    // For now, we rename.

    // Close DB logic is missing in db.rs (Lazy static mutex is hard to close explicitly).
    // This is a known issue. We might need to restart app.
    // Or we tell user "Restart to apply".

    // Attempt replace (might fail on Windows if locked)
    match fs::rename(&temp_path, &db_path) {
        Ok(_) => Ok("Data restored. Please restart application.".to_string()),
        Err(_) => {
            // Fallback: Try copy content if rename fails (still might be locked)
            Err(
                "Cannot replace database file while in use. Please close app and replace manually."
                    .to_string(),
            )
        }
    }
}
