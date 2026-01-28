import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';
import '../models/activity_session.dart';
import '../models/app_usage_summary.dart';
import '../models/daily_stats.dart';
import '../models/settings.dart';

class DatabaseService {
  static final DatabaseService instance = DatabaseService._init();
  static Database? _database;

  DatabaseService._init();

  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('activity.db');
    return _database!;
  }

  Future<Database> _initDB(String filePath) async {
    final Directory appDocDir = await getApplicationDocumentsDirectory();
    final String dbPath = join(appDocDir.path, filePath);
    
    return await openDatabase(
      dbPath,
      version: 1,
      onCreate: _createDB,
    );
  }

  Future<void> _createDB(Database db, int version) async {
    await db.execute('''
      CREATE TABLE activity_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        app_name TEXT NOT NULL,
        window_title TEXT NOT NULL,
        exe_path TEXT NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT,
        duration_seconds INTEGER DEFAULT 0
      )
    ''');

    await db.execute('''
      CREATE TABLE settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE TABLE tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        app_name TEXT NOT NULL,
        description TEXT,
        goal_seconds INTEGER NOT NULL,
        created_at TEXT NOT NULL,
        status TEXT DEFAULT 'active',
        title_filter TEXT
      )
    ''');

    await db.execute('''
      CREATE TABLE cloud_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT NOT NULL,
        provider TEXT NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT,
        created_at TEXT NOT NULL
      )
    ''');

    await db.execute('''
      CREATE INDEX idx_start_time ON activity_sessions(start_time)
    ''');
  }

  // Activity Sessions
  Future<int> startSession({
    required String appName,
    required String windowTitle,
    required String exePath,
  }) async {
    final db = await database;
    final now = DateTime.now().toIso8601String();
    
    return await db.insert('activity_sessions', {
      'app_name': appName,
      'window_title': windowTitle,
      'exe_path': exePath,
      'start_time': now,
    });
  }

  Future<void> endSession(int id) async {
    final db = await database;
    final now = DateTime.now();
    
    // Get start time
    final List<Map<String, dynamic>> result = await db.query(
      'activity_sessions',
      columns: ['start_time'],
      where: 'id = ?',
      whereArgs: [id],
    );
    
    if (result.isNotEmpty) {
      final startTime = DateTime.parse(result.first['start_time'] as String);
      final duration = now.difference(startTime).inSeconds;
      
      await db.update(
        'activity_sessions',
        {
          'end_time': now.toIso8601String(),
          'duration_seconds': duration,
        },
        where: 'id = ?',
        whereArgs: [id],
      );
    }
  }

  Future<List<ActivitySession>> getTodaySessions() async {
    final db = await database;
    final today = DateTime.now();
    final startOfDay = DateTime(today.year, today.month, today.day);
    
    final List<Map<String, dynamic>> maps = await db.query(
      'activity_sessions',
      where: 'date(start_time) = date(?)',
      whereArgs: [startOfDay.toIso8601String()],
      orderBy: 'start_time DESC',
    );
    
    return List.generate(maps.length, (i) => ActivitySession.fromMap(maps[i]));
  }

  Future<List<ActivitySession>> getSessionsForDate(DateTime date) async {
    final db = await database;
    final startOfDay = DateTime(date.year, date.month, date.day);
    
    final List<Map<String, dynamic>> maps = await db.query(
      'activity_sessions',
      where: 'date(start_time) = date(?)',
      whereArgs: [startOfDay.toIso8601String()],
      orderBy: 'start_time DESC',
    );
    
    return List.generate(maps.length, (i) => ActivitySession.fromMap(maps[i]));
  }

  Future<List<AppUsageSummary>> getTodaySummary() async {
    final db = await database;
    final today = DateTime.now();
    final startOfDay = DateTime(today.year, today.month, today.day);
    
    final List<Map<String, dynamic>> maps = await db.rawQuery('''
      SELECT app_name, exe_path, 
             SUM(duration_seconds) as total_seconds, 
             COUNT(*) as session_count
      FROM activity_sessions
      WHERE date(start_time) = date(?)
      GROUP BY app_name
      ORDER BY total_seconds DESC
    ''', [startOfDay.toIso8601String()]);
    
    return List.generate(maps.length, (i) {
      return AppUsageSummary(
        appName: maps[i]['app_name'] as String,
        exePath: maps[i]['exe_path'] as String,
        totalSeconds: maps[i]['total_seconds'] as int,
        sessionCount: maps[i]['session_count'] as int,
      );
    });
  }

  Future<List<DailyStats>> getWeeklyStats() async {
    final db = await database;
    
    final List<Map<String, dynamic>> maps = await db.rawQuery('''
      SELECT date(start_time) as date,
             SUM(duration_seconds) as total_seconds,
             COUNT(DISTINCT app_name) as app_count
      FROM activity_sessions
      WHERE start_time >= datetime('now', '-7 days')
      GROUP BY date(start_time)
      ORDER BY date DESC
    ''');
    
    return List.generate(maps.length, (i) => DailyStats.fromMap(maps[i]));
  }

  // Settings
  Future<AppSettings> getSettings() async {
    final db = await database;
    
    final Map<String, String> settingsMap = {};
    final List<Map<String, dynamic>> maps = await db.query('settings');
    
    for (var map in maps) {
      settingsMap[map['key'] as String] = map['value'] as String;
    }
    
    return AppSettings.fromMap(settingsMap);
  }

  Future<void> saveSettings(AppSettings settings) async {
    final db = await database;
    final settingsMap = settings.toMap();
    
    for (var entry in settingsMap.entries) {
      if (entry.value != null) {
        await db.insert(
          'settings',
          {'key': entry.key, 'value': entry.value.toString()},
          conflictAlgorithm: ConflictAlgorithm.replace,
        );
      }
    }
  }

  Future<String?> getSetting(String key) async {
    final db = await database;
    
    final List<Map<String, dynamic>> maps = await db.query(
      'settings',
      where: 'key = ?',
      whereArgs: [key],
    );
    
    if (maps.isNotEmpty) {
      return maps.first['value'] as String;
    }
    return null;
  }

  Future<void> saveSetting(String key, String value) async {
    final db = await database;
    
    await db.insert(
      'settings',
      {'key': key, 'value': value},
      conflictAlgorithm: ConflictAlgorithm.replace,
    );
  }

  // Get total time today
  Future<int> getTotalTimeToday() async {
    final db = await database;
    final today = DateTime.now();
    final startOfDay = DateTime(today.year, today.month, today.day);
    
    final List<Map<String, dynamic>> result = await db.rawQuery('''
      SELECT SUM(duration_seconds) as total
      FROM activity_sessions
      WHERE date(start_time) = date(?)
    ''', [startOfDay.toIso8601String()]);
    
    if (result.isNotEmpty && result.first['total'] != null) {
      return result.first['total'] as int;
    }
    return 0;
  }

  // Export database
  Future<String> exportDatabase() async {
    final Directory appDocDir = await getApplicationDocumentsDirectory();
    final String dbPath = join(appDocDir.path, 'activity.db');
    return dbPath;
  }

  // Close database
  Future<void> close() async {
    final db = await database;
    await db.close();
  }
}
