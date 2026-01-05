use crate::auth;
use crate::db::{get_all_sessions, ActivitySession};
use chrono;
use reqwest::{blocking::Client, header};
use std::collections::HashMap;
use std::fs;

use serde_json::Value;
use urlencoding;

// Helper to upload a single file (Create or Update)
fn upload_file_to_drive(
    client: &Client,
    token: &str,
    folder_id: &str,
    filename: &str,
    content: Vec<u8>,
    mime_type: &str,
) -> Result<String, String> {
    // Check if file exists to get ID
    let query = format!(
        "name='{}' and '{}' in parents and trashed=false",
        filename, folder_id
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
    let file_id = body
        .get("files")
        .and_then(|v| v.as_array())
        .and_then(|files| files.first())
        .and_then(|f| f.get("id"))
        .and_then(|id| id.as_str())
        .map(|s| s.to_string());

    if let Some(id) = file_id {
        // Update
        let update_url = format!(
            "https://www.googleapis.com/upload/drive/v3/files/{}?uploadType=media",
            id
        );
        let _ = client
            .patch(update_url)
            .header("Authorization", format!("Bearer {}", token))
            .header("Content-Type", mime_type)
            .body(content)
            .send()
            .map_err(|e| e.to_string())?;
        Ok(format!("Updated {}", filename))
    } else {
        // Create
        let create_url = "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart";
        let metadata = serde_json::json!({
            "name": filename,
            "parents": [folder_id],
            "mimeType": mime_type
        })
        .to_string();

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
                    .mime_str(mime_type)
                    .unwrap(),
            );

        let res = client
            .post(create_url)
            .header("Authorization", format!("Bearer {}", token))
            .multipart(form)
            .send()
            .map_err(|e| e.to_string())?;

        if res.status().is_success() {
            Ok(format!("Created {}", filename))
        } else {
            Err(format!("Failed to upload {}", filename))
        }
    }
}

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

    // Check for explicit API error
    if let Some(error) = body.get("error") {
        let msg = error
            .get("message")
            .and_then(|m| m.as_str())
            .unwrap_or("Unknown error");
        println!("Drive API Error: {}", msg);
        return Err(format!("Drive API Error: {}", msg));
    }

    if let Some(files) = body.get("files").and_then(|v| v.as_array()) {
        if let Some(folder) = files.first() {
            return Ok(folder["id"].as_str().unwrap().to_string());
        }
    } else {
        // Log unexpected response
        println!("Unexpected Drive Response (List): {:?}", body);
    }

    // Create folder
    let create_url = "https://www.googleapis.com/drive/v3/files?fields=id,webViewLink";
    let body_json = serde_json::json!({
        "name": folder_name,
        "mimeType": "application/vnd.google-apps.folder"
    });

    let res = client
        .post(create_url)
        .header("Authorization", format!("Bearer {}", token))
        .json(&body_json)
        .send()
        .map_err(|e| e.to_string())?;

    if res.status().is_success() {
        let body: Value = res.json().map_err(|e| e.to_string())?;
        // Try to open link if we can (requires frontend command)
        // For now just return ID.
        if let Some(link) = body.get("webViewLink").and_then(|s| s.as_str()) {
            let _ = opener::open(link); // Auto-open folder in browser
        }
        Ok(body["id"].as_str().unwrap().to_string())
    } else {
        let err_body = res.text().unwrap_or_default();
        println!("Failed to create folder: {}", err_body);
        Err(format!("Failed to create folder: {}", err_body))
    }
}

// List folders
#[derive(serde::Serialize)]
pub struct DriveFolder {
    pub id: String,
    pub name: String,
}

pub fn list_folders(account_id: i64) -> Result<Vec<DriveFolder>, String> {
    let token = get_token(Some(account_id))?;
    let client = Client::new();

    let query = "mimeType='application/vnd.google-apps.folder' and trashed=false";
    let list_url = format!(
        "https://www.googleapis.com/drive/v3/files?q={}&fields=files(id,name)",
        urlencoding::encode(query)
    );

    let res = client
        .get(&list_url)
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .map_err(|e| e.to_string())?;

    let body: Value = res.json().map_err(|e| e.to_string())?;

    let files = body
        .get("files")
        .and_then(|v| v.as_array())
        .ok_or("Failed to parse drive response")?;

    let mut folders = Vec::new();
    for f in files {
        if let (Some(id), Some(name)) = (f["id"].as_str(), f["name"].as_str()) {
            folders.push(DriveFolder {
                id: id.to_string(),
                name: name.to_string(),
            });
        }
    }
    Ok(folders)
}

// Helper to get token (either specific account or default first one)
fn get_token(account_id: Option<i64>) -> Result<String, String> {
    if let Some(id) = account_id {
        let (access, _) = crate::db::get_cloud_token(id).map_err(|e| e.to_string())?;
        Ok(access)
    } else {
        // Default: Get first account or error
        let accounts = crate::db::get_cloud_accounts().map_err(|e| e.to_string())?;
        if let Some(acc) = accounts.first() {
            let (access, _) = crate::db::get_cloud_token(acc.id).map_err(|e| e.to_string())?;
            Ok(access)
        } else {
            Err("No connected accounts".to_string())
        }
    }
}

pub fn create_folder(account_id: i64, name: String) -> Result<String, String> {
    let token = get_token(Some(account_id))?;
    let client = Client::new();
    get_or_create_folder(&client, &token, &name)
}

// Generate CSV content
fn generate_csv(sessions: &[ActivitySession]) -> String {
    let mut csv = String::from("App Name,Window Title,Start Time,End Time,Duration (s)\n");
    for s in sessions {
        csv.push_str(&format!(
            "\"{}\",\"{}\",\"{}\",\"{}\",{}\n",
            s.app_name.replace("\"", "\"\""),
            s.window_title.replace("\"", "\"\""),
            s.start_time.to_rfc3339(),
            s.end_time.map(|t| t.to_rfc3339()).unwrap_or_default(),
            s.duration_seconds
        ));
    }
    csv
}

// Generate Markdown Report
fn generate_md(sessions: &[ActivitySession]) -> String {
    let total_seconds: i64 = sessions.iter().map(|s| s.duration_seconds).sum();
    let hours = total_seconds / 3600;
    let minutes = (total_seconds % 3600) / 60;

    let mut app_stats: HashMap<String, i64> = HashMap::new();
    for s in sessions {
        *app_stats.entry(s.app_name.clone()).or_insert(0) += s.duration_seconds;
    }
    let mut sorted_apps: Vec<_> = app_stats.into_iter().collect();
    sorted_apps.sort_by(|a, b| b.1.cmp(&a.1));

    let mut md = String::new();
    md.push_str("# TimiGS Activity Report\n\n");
    md.push_str(&format!(
        "**Generated:** {}\n\n",
        chrono::Local::now().format("%Y-%m-%d %H:%M:%S")
    ));
    md.push_str(&format!(
        "**Total Time Tracked:** {}h {}m\n\n",
        hours, minutes
    ));

    md.push_str("## Top Applications\n");
    md.push_str("| App Name | Duration |\n");
    md.push_str("| --- | --- |\n");
    for (name, duration) in sorted_apps.iter().take(10) {
        let h = duration / 3600;
        let m = (duration % 3600) / 60;
        md.push_str(&format!("| {} | {}h {}m |\n", name, h, m));
    }

    md
}

// Generate GitHub CSV
fn generate_github_csv(token: &str) -> Result<String, String> {
    let client = Client::new();
    let res = client
        .get("https://api.github.com/user/events?per_page=100")
        .header("User-Agent", "TimiGS")
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .map_err(|e| format!("GitHub Fetch Error: {}", e))?;

    if !res.status().is_success() {
        return Err(format!("GitHub API Error: {}", res.status()));
    }

    let events: Value = res.json().map_err(|e| e.to_string())?;
    let array = events.as_array().ok_or("Invalid GitHub response")?;

    let mut csv = String::from("Type,Repo,Date\n");
    for event in array {
        let type_ = event["type"].as_str().unwrap_or("Unknown");
        let repo = event["repo"]["name"].as_str().unwrap_or("-");
        let date = event["created_at"].as_str().unwrap_or("-");
        csv.push_str(&format!("\"{}\",\"{}\",\"{}\"\n", type_, repo, date));
    }
    Ok(csv)
}

pub fn backup_data(
    account_id: Option<i64>,
    github_token: Option<String>,
    folder_id: Option<String>,
) -> Result<String, String> {
    let token = get_token(account_id)?;
    let client = Client::new();

    // 0. Use provided folder or ensure "TimiGS Logs" exists
    let target_folder_id = if let Some(fid) = folder_id {
        fid
    } else {
        get_or_create_folder(&client, &token, "TimiGS Logs")?
    };

    // 1. Fetch Data
    let sessions = get_all_sessions().map_err(|e| e.to_string())?;

    // 2. CSV Export
    let csv_content = generate_csv(&sessions);
    upload_file_to_drive(
        &client,
        &token,
        &target_folder_id,
        "activity_log.csv",
        csv_content.into_bytes(),
        "text/csv",
    )?;

    // 3. JSON Export
    let json_content = serde_json::to_string_pretty(&sessions).map_err(|e| e.to_string())?;
    upload_file_to_drive(
        &client,
        &token,
        &target_folder_id,
        "activity_log.json",
        json_content.into_bytes(),
        "application/json",
    )?;

    // 4. Markdown Export
    let md_content = generate_md(&sessions);
    upload_file_to_drive(
        &client,
        &token,
        &target_folder_id,
        "activity_report.md",
        md_content.into_bytes(),
        "text/markdown",
    )?;

    // 5. GitHub Export (Optional)
    let mut msg = "Exported: CSV, JSON, MD".to_string();
    if let Some(gh_token) = github_token {
        if !gh_token.is_empty() {
            match generate_github_csv(&gh_token) {
                Ok(gh_csv) => {
                    upload_file_to_drive(
                        &client,
                        &token,
                        &target_folder_id,
                        "github_activity.csv",
                        gh_csv.into_bytes(),
                        "text/csv",
                    )?;
                    msg.push_str(" + GitHub CSV");
                }
                Err(e) => println!("GitHub Export Failed: {}", e), // Non-fatal
            }
        }
    }

    // 6. DB Backup (optional but good for restore)
    let db_path = crate::db::get_db_path();
    if let Ok(content) = fs::read(&db_path) {
        let _ = upload_file_to_drive(
            &client,
            &token,
            &target_folder_id,
            "timigs_backup.db",
            content,
            "application/x-sqlite3",
        );
    }

    Ok(msg)
}

pub fn restore_data(account_id: Option<i64>, folder_id: Option<String>) -> Result<String, String> {
    let token = get_token(account_id)?;
    let client = Client::new();

    // 1. Find file
    let query = if let Some(fid) = folder_id {
        format!(
            "name='timigs_backup.db' and '{}' in parents and trashed=false",
            fid
        )
    } else {
        "name='timigs_backup.db' and trashed=false".to_string()
    };

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
    // More robust check
    let files = body
        .get("files")
        .and_then(|v| v.as_array())
        .ok_or_else(|| format!("Drive API response missing 'files': {:?}", body))?;

    let file_id = files
        .first()
        .and_then(|f| f.get("id"))
        .and_then(|id| id.as_str())
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

    // 4. Replace current DB
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
