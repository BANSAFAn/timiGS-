/// Database service using sqflite for local SQLite persistence
///
/// Stores activity sessions, analytics, and settings locally.
/// Can be swapped to Rust backend later when flutter_rust_bridge bindings are generated.

import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart' as p;
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:io';
import '../models/activity_session.dart';
import '../models/app_usage_summary.dart';
import '../models/daily_stats.dart';
import '../models/settings.dart';

class DatabaseService {
  static final DatabaseService instance = DatabaseService._init();
  Database? _db;
  bool _initialized = false;

  DatabaseService._init();

  /// Initialize the database
  Future<void> initialize() async {
    if (_initialized) return;

    final dbPath = await getDatabasesPath();
    final path = p.join(dbPath, 'timigs_activity.db');

    _db = await openDatabase(
      path,
      version: 2,
      onCreate: _createDb,
      onUpgrade: _upgradeDb,
    );

    _initialized = true;
    print('DatabaseService initialized with SQLite at: $path');
  }

  Future<void> _createDb(Database db, int version) async {
    await db.execute('''
      CREATE TABLE IF NOT EXISTS sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        app_name TEXT NOT NULL,
        window_title TEXT NOT NULL,
        exe_path TEXT NOT NULL,
        start_time INTEGER NOT NULL,
        end_time INTEGER
      )
    ''');

    await db.execute('''
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      )
    ''');

    // Indexes for faster queries
    await db.execute(
        'CREATE INDEX IF NOT EXISTS idx_sessions_start ON sessions(start_time)');
    await db.execute(
        'CREATE INDEX IF NOT EXISTS idx_sessions_app ON sessions(app_name)');
  }

  Future<void> _upgradeDb(Database db, int oldVersion, int newVersion) async {
    if (oldVersion < 2) {
      await db.execute(
          'CREATE INDEX IF NOT EXISTS idx_sessions_start ON sessions(start_time)');
      await db.execute(
          'CREATE INDEX IF NOT EXISTS idx_sessions_app ON sessions(app_name)');
    }
  }

  /// Ensure database is initialized
  void _ensureInitialized() {
    if (!_initialized || _db == null) {
      throw StateError(
          'DatabaseService not initialized. Call initialize() first.');
    }
  }

  // ============ Activity Sessions ============

  /// Start a new activity tracking session
  Future<int> startSession({
    required String appName,
    required String windowTitle,
    required String exePath,
  }) async {
    _ensureInitialized();

    final id = await _db!.insert('sessions', {
      'app_name': appName,
      'window_title': windowTitle,
      'exe_path': exePath,
      'start_time': DateTime.now().millisecondsSinceEpoch,
    });

    return id;
  }

  /// End an activity session
  Future<void> endSession(int id) async {
    _ensureInitialized();

    await _db!.update(
      'sessions',
      {'end_time': DateTime.now().millisecondsSinceEpoch},
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  /// Get sessions for today
  Future<List<ActivitySession>> getTodaySessions() async {
    _ensureInitialized();

    final now = DateTime.now();
    final startOfDay =
        DateTime(now.year, now.month, now.day).millisecondsSinceEpoch;
    final endOfDay = DateTime(now.year, now.month, now.day, 23, 59, 59, 999)
        .millisecondsSinceEpoch;

    final rows = await _db!.query(
      'sessions',
      where: 'start_time >= ? AND start_time <= ?',
      whereArgs: [startOfDay, endOfDay],
      orderBy: 'start_time DESC',
    );

    return rows.map((row) => ActivitySession.fromMap(row)).toList();
  }

  /// Get sessions for a specific date
  Future<List<ActivitySession>> getSessionsForDate(DateTime date) async {
    _ensureInitialized();

    final startOfDay =
        DateTime(date.year, date.month, date.day).millisecondsSinceEpoch;
    final endOfDay = DateTime(date.year, date.month, date.day, 23, 59, 59, 999)
        .millisecondsSinceEpoch;

    final rows = await _db!.query(
      'sessions',
      where: 'start_time >= ? AND start_time <= ?',
      whereArgs: [startOfDay, endOfDay],
      orderBy: 'start_time DESC',
    );

    return rows.map((row) => ActivitySession.fromMap(row)).toList();
  }

  // ============ Analytics ============

  /// Get usage summary for today (grouped by app)
  Future<List<AppUsageSummary>> getTodaySummary() async {
    _ensureInitialized();

    final now = DateTime.now();
    final startOfDay =
        DateTime(now.year, now.month, now.day).millisecondsSinceEpoch;
    final endOfDay = DateTime(now.year, now.month, now.day, 23, 59, 59, 999)
        .millisecondsSinceEpoch;

    final rows = await _db!.rawQuery('''
      SELECT 
        app_name,
        exe_path,
        COUNT(*) as session_count,
        SUM(CASE WHEN end_time IS NOT NULL 
            THEN (end_time - start_time) / 1000 
            ELSE (? - start_time) / 1000 
        END) as total_seconds
      FROM sessions
      WHERE start_time >= ? AND start_time <= ?
      GROUP BY app_name
      ORDER BY total_seconds DESC
    ''', [DateTime.now().millisecondsSinceEpoch, startOfDay, endOfDay]);

    return rows.map((row) => AppUsageSummary.fromMap(row)).toList();
  }

  /// Get weekly statistics
  Future<List<DailyStats>> getWeeklyStats() async {
    _ensureInitialized();

    final now = DateTime.now();
    final weekAgo = now.subtract(const Duration(days: 7));
    final startMs = DateTime(weekAgo.year, weekAgo.month, weekAgo.day)
        .millisecondsSinceEpoch;

    final rows = await _db!.rawQuery('''
      SELECT 
        CAST((start_time / 86400000) AS INTEGER) as day_key,
        COUNT(*) as session_count,
        SUM(CASE WHEN end_time IS NOT NULL 
            THEN (end_time - start_time) / 1000 
            ELSE 0 
        END) as total_seconds
      FROM sessions
      WHERE start_time >= ?
      GROUP BY day_key
      ORDER BY day_key ASC
    ''', [startMs]);

    return rows.map((row) {
      final dayKey = row['day_key'] as int;
      final date =
          DateTime.fromMillisecondsSinceEpoch(dayKey * 86400000, isUtc: true);
      return DailyStats(
        date: date,
        totalSeconds: (row['total_seconds'] as int?) ?? 0,
        sessionCount: (row['session_count'] as int?) ?? 0,
      );
    }).toList();
  }

  /// Get total tracked time for today in seconds
  Future<int> getTotalTimeToday() async {
    _ensureInitialized();

    final now = DateTime.now();
    final startOfDay =
        DateTime(now.year, now.month, now.day).millisecondsSinceEpoch;

    final result = await _db!.rawQuery('''
      SELECT COALESCE(SUM(
        CASE WHEN end_time IS NOT NULL 
          THEN (end_time - start_time) / 1000 
          ELSE (? - start_time) / 1000 
        END
      ), 0) as total
      FROM sessions
      WHERE start_time >= ?
    ''', [DateTime.now().millisecondsSinceEpoch, startOfDay]);

    return (result.first['total'] as int?) ?? 0;
  }

  // ============ Settings ============

  /// Get all settings
  Future<AppSettings> getSettings() async {
    _ensureInitialized();

    final prefs = await SharedPreferences.getInstance();
    return AppSettings(
      language: prefs.getString('language') ?? 'en',
      theme: prefs.getString('theme') ?? 'dark',
      autostart: prefs.getBool('autostart') ?? true,
      minimizeToTray: prefs.getBool('minimize_to_tray') ?? true,
      googleClientId: prefs.getString('google_client_id'),
      googleClientSecret: prefs.getString('google_client_secret'),
    );
  }

  /// Save all settings
  Future<void> saveSettings(AppSettings settings) async {
    _ensureInitialized();

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('language', settings.language);
    await prefs.setString('theme', settings.theme);
    await prefs.setBool('autostart', settings.autostart);
    await prefs.setBool('minimize_to_tray', settings.minimizeToTray);
    if (settings.googleClientId != null) {
      await prefs.setString('google_client_id', settings.googleClientId!);
    }
    if (settings.googleClientSecret != null) {
      await prefs.setString(
          'google_client_secret', settings.googleClientSecret!);
    }
  }

  /// Get a single setting value
  Future<String?> getSetting(String key) async {
    _ensureInitialized();
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(key);
  }

  /// Save a single setting
  Future<void> saveSetting(String key, String value) async {
    _ensureInitialized();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(key, value);
  }

  // ============ Utilities ============

  /// Export database path for backup
  Future<String> exportDatabase() async {
    _ensureInitialized();
    final dbPath = await getDatabasesPath();
    return p.join(dbPath, 'timigs_activity.db');
  }

  /// Close database connection
  Future<void> close() async {
    if (!_initialized || _db == null) return;
    await _db!.close();
    _db = null;
    _initialized = false;
  }
}
