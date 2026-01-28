import 'package:sqflite/sqflite.dart';
import '../models/task.dart';
import 'database_service.dart';

class TaskService {
  static final TaskService instance = TaskService._init();
  
  TaskService._init();

  Future<int> createTask({
    required String appName,
    String? description,
    required int goalSeconds,
    String? titleFilter,
  }) async {
    final db = await DatabaseService.instance.database;
    final now = DateTime.now();
    
    return await db.insert('tasks', {
      'app_name': appName,
      'description': description,
      'goal_seconds': goalSeconds,
      'created_at': now.toIso8601String(),
      'status': 'active',
      'title_filter': titleFilter,
    });
  }

  Future<List<Task>> getTasks() async {
    final db = await DatabaseService.instance.database;
    
    final List<Map<String, dynamic>> maps = await db.query(
      'tasks',
      orderBy: 'created_at DESC',
    );
    
    return List.generate(maps.length, (i) => Task.fromMap(maps[i]));
  }

  Future<void> updateTaskStatus(int id, String status) async {
    final db = await DatabaseService.instance.database;
    
    await db.update(
      'tasks',
      {'status': status},
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<void> deleteTask(int id) async {
    final db = await DatabaseService.instance.database;
    
    await db.delete(
      'tasks',
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  Future<int> getTaskProgress(int id) async {
    final db = await DatabaseService.instance.database;
    
    // Get task details
    final List<Map<String, dynamic>> taskMaps = await db.query(
      'tasks',
      where: 'id = ?',
      whereArgs: [id],
    );
    
    if (taskMaps.isEmpty) return 0;
    
    final task = Task.fromMap(taskMaps.first);
    
    // Get usage since task creation
    String query = '''
      SELECT SUM(duration_seconds) as total
      FROM activity_sessions
      WHERE app_name = ? AND start_time >= ?
    ''';
    
    List<dynamic> args = [task.appName, task.createdAt.toIso8601String()];
    
    if (task.titleFilter != null && task.titleFilter!.isNotEmpty) {
      query += ' AND window_title LIKE ?';
      args.add('%${task.titleFilter}%');
    }
    
    final List<Map<String, dynamic>> result = await db.rawQuery(query, args);
    
    if (result.isNotEmpty && result.first['total'] != null) {
      return result.first['total'] as int;
    }
    
    return 0;
  }

  Future<List<String>> getRecentApps() async {
    final db = await DatabaseService.instance.database;
    
    final List<Map<String, dynamic>> maps = await db.rawQuery('''
      SELECT DISTINCT app_name
      FROM activity_sessions
      ORDER BY start_time DESC
      LIMIT 50
    ''');
    
    return List.generate(maps.length, (i) => maps[i]['app_name'] as String);
  }
}
