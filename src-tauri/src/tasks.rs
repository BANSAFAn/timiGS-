use crate::db;
use tauri::command;

#[command]
pub fn create_task_cmd(
    app_name: String,
    description: Option<String>,
    goal_seconds: i64,
) -> Result<i64, String> {
    db::create_task(&app_name, description, goal_seconds).map_err(|e| e.to_string())
}

#[command]
pub fn get_tasks_cmd() -> Result<Vec<db::Task>, String> {
    db::get_tasks().map_err(|e| e.to_string())
}

#[command]
pub fn update_task_status_cmd(id: i64, status: String) -> Result<(), String> {
    db::update_task_status(id, &status).map_err(|e| e.to_string())
}

#[command]
pub fn delete_task_cmd(id: i64) -> Result<(), String> {
    db::delete_task(id).map_err(|e| e.to_string())
}

pub fn check_goals(app_name: &str) {
    if let Ok(tasks) = db::get_tasks() {
        for task in tasks {
            if task.status == "active" && task.app_name == app_name {
                if let Ok(usage) = db::get_app_usage_since(app_name, task.created_at) {
                    if usage >= task.goal_seconds {
                        println!("Task Completed: {}", task.app_name);
                        let _ = db::update_task_status(task.id, "completed");

                        // Simple system notification using msgbox or similar if on windows?
                        // Ideally we use tauri notification, but we are deep in a thread here.
                        // For now, status update is enough. Frontend will see it.
                    }
                }
            }
        }
    }
}
