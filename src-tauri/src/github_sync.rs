use reqwest::blocking::Client;
use serde_json::Value;

use crate::db;

/// Create a new GitHub Project v2 for the authenticated user
pub fn create_project_v2(token: &str, title: &str) -> Result<(String, String), String> {
    let client = Client::new();

    // First get the user's node ID
    let user_query = r#"query { viewer { id login } }"#;
    let user_res = client
        .post("https://api.github.com/graphql")
        .header("Authorization", format!("Bearer {}", token))
        .header("User-Agent", "TimiGS")
        .json(&serde_json::json!({ "query": user_query }))
        .send()
        .map_err(|e| format!("Request failed: {}", e))?;

    let user_body: Value = user_res
        .json()
        .map_err(|e| format!("Parse failed: {}", e))?;
    let owner_id = user_body["data"]["viewer"]["id"]
        .as_str()
        .ok_or("Failed to get user ID")?
        .to_string();
    let login = user_body["data"]["viewer"]["login"]
        .as_str()
        .unwrap_or("user")
        .to_string();

    // Create the project using GraphQL variables
    let create_mutation = r#"mutation createProject($ownerId: ID!, $title: String!) {
        createProjectV2(input: {ownerId: $ownerId, title: $title}) {
            projectV2 {
                id
                number
                url
            }
        }
    }"#;

    let variables = serde_json::json!({
        "ownerId": owner_id,
        "title": title
    });

    let create_res = client
        .post("https://api.github.com/graphql")
        .header("Authorization", format!("Bearer {}", token))
        .header("User-Agent", "TimiGS")
        .json(&serde_json::json!({
            "query": create_mutation,
            "variables": variables
        }))
        .send()
        .map_err(|e| format!("Create project failed: {}", e))?;

    let create_body: Value = create_res
        .json()
        .map_err(|e| format!("Parse failed: {}", e))?;

    if let Some(errors) = create_body["errors"].as_array() {
        if !errors.is_empty() {
            return Err(format!(
                "GitHub API error: {}",
                errors[0]["message"].as_str().unwrap_or("Unknown error")
            ));
        }
    }

    let project_id = create_body["data"]["createProjectV2"]["projectV2"]["id"]
        .as_str()
        .ok_or("Failed to get created project ID")?
        .to_string();

    let project_number = create_body["data"]["createProjectV2"]["projectV2"]["number"]
        .as_u64()
        .unwrap_or(0);

    let project_url = format!(
        "https://github.com/users/{}/projects/{}",
        login, project_number
    );

    Ok((project_id, project_url))
}

/// Add a draft issue to a GitHub Project v2
pub fn add_draft_issue(
    token: &str,
    project_id: &str,
    title: &str,
    body: &str,
) -> Result<String, String> {
    let client = Client::new();

    let mutation = r#"mutation addDraftIssue($projectId: ID!, $title: String!, $body: String) {
        addProjectV2DraftIssue(input: {projectId: $projectId, title: $title, body: $body}) {
            projectItem {
                id
            }
        }
    }"#;

    let variables = serde_json::json!({
        "projectId": project_id,
        "title": title,
        "body": body
    });

    let res = client
        .post("https://api.github.com/graphql")
        .header("Authorization", format!("Bearer {}", token))
        .header("User-Agent", "TimiGS")
        .json(&serde_json::json!({
            "query": mutation,
            "variables": variables
        }))
        .send()
        .map_err(|e| format!("Add draft issue failed: {}", e))?;

    let body_resp: Value = res.json().map_err(|e| format!("Parse failed: {}", e))?;

    if let Some(errors) = body_resp["errors"].as_array() {
        if !errors.is_empty() {
            return Err(format!(
                "GitHub API error: {}",
                errors[0]["message"].as_str().unwrap_or("Unknown error")
            ));
        }
    }

    let item_id = body_resp["data"]["addProjectV2DraftIssue"]["projectItem"]["id"]
        .as_str()
        .unwrap_or("")
        .to_string();

    Ok(item_id)
}

/// Sync a local board to GitHub:
/// 1. Create project if not linked, or use existing
/// 2. Add all items as draft issues
pub fn sync_board_to_github(board_id: i64, token: &str) -> Result<String, String> {
    let boards = db::get_boards().map_err(|e| e.to_string())?;
    let board = boards
        .iter()
        .find(|b| b.id == board_id)
        .ok_or("Board not found")?;

    let items = db::get_board_items(board_id).map_err(|e| e.to_string())?;

    // Create or retrieve project ID
    let (project_id, project_url) = if let Some(ref gid) = board.github_project_id {
        (
            gid.clone(),
            board.github_project_url.clone().unwrap_or_default(),
        )
    } else {
        let (pid, purl) = create_project_v2(token, &board.name)?;
        db::update_board_github(board_id, &pid, &purl).map_err(|e| e.to_string())?;
        (pid, purl)
    };

    // Add items as draft issues
    for item in &items {
        let hours = item.tracked_seconds / 3600;
        let minutes = (item.tracked_seconds % 3600) / 60;
        let time_str = if hours > 0 {
            format!("{}h {}m", hours, minutes)
        } else {
            format!("{}m", minutes)
        };

        let title = format!("{} — {}", item.app_name, time_str);
        let body = format!(
            "📱 **App:** {}\n📅 **Date:** {}\n⏱️ **Time tracked:** {}\n📋 **Window:** {}",
            item.app_name,
            item.date,
            time_str,
            item.window_title.as_deref().unwrap_or("-")
        );

        add_draft_issue(token, &project_id, &title, &body)?;
    }

    db::update_board_synced_at(board_id).map_err(|e| e.to_string())?;

    Ok(project_url)
}
