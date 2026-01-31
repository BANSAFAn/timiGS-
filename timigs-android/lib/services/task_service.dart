/// Task service using Rust backend via flutter_rust_bridge
///
/// Manages usage goals/tasks for apps.

import '../models/task.dart';
// import '../src/rust/api.dart' as rust_api;

class TaskService {
  static final TaskService instance = TaskService._init();

  TaskService._init();

  /// Create a new task/goal
  Future<int> createTask({
    required String appName,
    String? description,
    required int goalSeconds,
    String? titleFilter,
  }) async {
    // TODO: Replace with Rust call when bindings are generated
    // final result = await rust_api.createTask(
    //   task: rust_api.NewTask(
    //     appName: appName,
    //     description: description,
    //     goalSeconds: goalSeconds,
    //     titleFilter: titleFilter,
    //   ),
    // );
    // return result;

    return DateTime.now().millisecondsSinceEpoch;
  }

  /// Get all tasks
  Future<List<Task>> getTasks() async {
    // TODO: Replace with Rust call
    // final tasks = await rust_api.getAllTasks();
    // return tasks.map((t) => Task.fromRust(t)).toList();

    return [];
  }

  /// Get active tasks only
  Future<List<Task>> getActiveTasks() async {
    // TODO: Replace with Rust call
    // final tasks = await rust_api.getActiveTasks();
    // return tasks.map((t) => Task.fromRust(t)).toList();

    return [];
  }

  /// Update task status
  Future<void> updateTaskStatus(int id, String status) async {
    // TODO: Replace with Rust call
    // final taskStatus = switch (status) {
    //   'active' => rust_api.TaskStatus.Active,
    //   'completed' => rust_api.TaskStatus.Completed,
    //   'paused' => rust_api.TaskStatus.Paused,
    //   'cancelled' => rust_api.TaskStatus.Cancelled,
    //   _ => rust_api.TaskStatus.Active,
    // };
    // await rust_api.updateTaskStatus(taskId: id, status: taskStatus);
  }

  /// Delete a task
  Future<void> deleteTask(int id) async {
    // TODO: Replace with Rust call
    // await rust_api.deleteTask(taskId: id);
  }

  /// Get task progress (total time spent)
  Future<int> getTaskProgress(int taskId) async {
    // TODO: Implement in Rust backend
    // This requires a more complex query that joins tasks and sessions
    // For now, return placeholder
    return 0;
  }

  /// Get list of recent apps for task creation
  Future<List<String>> getRecentApps() async {
    // TODO: Replace with Rust call
    // final apps = await rust_api.getTopApps(days: 7, limit: 50);
    // return apps.map((a) => a.appName).toList();

    return [];
  }
}
