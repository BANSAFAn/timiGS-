use crate::db;
use tauri::{command, Emitter};

#[command]
pub fn create_task_cmd(
    app_name: String,
    description: Option<String>,
    goal_seconds: i64,
    title_filter: Option<String>,
) -> Result<i64, String> {
    db::create_task(&app_name, description, goal_seconds, title_filter).map_err(|e| e.to_string())
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

#[command]
pub fn get_recent_apps_cmd() -> Result<Vec<String>, String> {
    db::get_recent_apps().map_err(|e| e.to_string())
}

#[command]
pub fn get_task_progress_cmd(id: i64) -> Result<i64, String> {
    let tasks = db::get_tasks().map_err(|e| e.to_string())?;
    let task = tasks.iter().find(|t| t.id == id).ok_or("Task not found")?;

    db::get_app_usage_since(&task.app_name, task.created_at, task.title_filter.as_ref())
        .map_err(|e| e.to_string())
}

pub fn check_goals(app_handle: &tauri::AppHandle, app_name: &str) {
    if let Ok(tasks) = db::get_tasks() {
        for task in tasks {
            if task.status == "active" && task.app_name == app_name {
                if let Ok(usage) =
                    db::get_app_usage_since(app_name, task.created_at, task.title_filter.as_ref())
                {
                    if usage >= task.goal_seconds {
                        println!("Task Completed: {}", task.app_name);
                        let _ = db::update_task_status(task.id, "completed");

                        // Emit event to notify frontend
                        let _ = app_handle.emit("task-completed", task.id);
                        
                        // Send notification
                        crate::notifications::send_notification(
                            app_handle,
                            "Task Completed! 🎉",
                            &format!("You've reached your goal for {}", task.app_name),
                        );
                    }
                }
            }
        }
    }
}
