/// Tracker service for Android activity tracking
///
/// This service uses Android's UsageStats API to track app usage.
/// The data is then sent to the Rust backend for storage.
///
/// Note: UsageStats is Android-specific and must remain in Dart.
/// Only the data storage is handled by Rust.

import 'package:usage_stats/usage_stats.dart';
import 'package:workmanager/workmanager.dart';
import 'dart:async';
import 'database_service.dart';

class TrackerService {
  static final TrackerService instance = TrackerService._init();

  TrackerService._init();

  bool _isTracking = false;
  Timer? _trackingTimer;
  String? _currentApp;
  int? _currentSessionId;

  bool get isTracking => _isTracking;

  /// Request usage stats permission (Android-specific)
  Future<bool> requestPermission() async {
    try {
      await UsageStats.grantUsagePermission();
      return await UsageStats.checkUsagePermission() ?? false;
    } catch (e) {
      print('Error requesting permission: $e');
      return false;
    }
  }

  /// Check if permission is granted
  Future<bool> hasPermission() async {
    try {
      return await UsageStats.checkUsagePermission() ?? false;
    } catch (e) {
      print('Error checking permission: $e');
      return false;
    }
  }

  /// Start tracking
  Future<void> startTracking() async {
    if (_isTracking) return;

    final hasPermission = await this.hasPermission();
    if (!hasPermission) {
      print('Usage stats permission not granted');
      return;
    }

    _isTracking = true;

    // Start periodic tracking (every 5 seconds)
    _trackingTimer = Timer.periodic(Duration(seconds: 5), (timer) async {
      await _trackCurrentApp();
    });

    // Initial track
    await _trackCurrentApp();

    // Register background work
    await Workmanager().registerPeriodicTask(
      'tracking_task',
      'trackingTask',
      frequency: Duration(minutes: 15),
    );
  }

  /// Stop tracking
  Future<void> stopTracking() async {
    if (!_isTracking) return;

    _isTracking = false;
    _trackingTimer?.cancel();
    _trackingTimer = null;

    // End current session if exists (calls Rust backend)
    if (_currentSessionId != null) {
      await DatabaseService.instance.endSession(_currentSessionId!);
      _currentSessionId = null;
    }

    await Workmanager().cancelByUniqueName('tracking_task');
  }

  /// Track current app (Android-specific, stores via Rust)
  Future<void> _trackCurrentApp() async {
    try {
      final DateTime endDate = DateTime.now();
      final DateTime startDate = endDate.subtract(Duration(seconds: 10));

      final List<UsageInfo> usageStats = await UsageStats.queryUsageStats(
        startDate,
        endDate,
      );

      if (usageStats.isEmpty) return;

      // Get the most recent app
      usageStats.sort((a, b) => ((b.lastTimeUsed ?? 0) as int)
          .compareTo((a.lastTimeUsed ?? 0) as int));

      final UsageInfo currentUsage = usageStats.first;
      final String appName = currentUsage.packageName ?? 'Unknown';

      // Check if app changed
      if (appName != _currentApp) {
        // End previous session (via Rust)
        if (_currentSessionId != null) {
          await DatabaseService.instance.endSession(_currentSessionId!);
        }

        // Start new session (via Rust backend)
        _currentApp = appName;
        _currentSessionId = await DatabaseService.instance.startSession(
          appName: appName,
          windowTitle: appName, // Android doesn't have window titles
          exePath: currentUsage.packageName ?? '',
        );
      }
    } catch (e) {
      print('Error tracking app: $e');
    }
  }

  /// Get current active app
  Future<String?> getCurrentApp() async {
    try {
      final DateTime endDate = DateTime.now();
      final DateTime startDate = endDate.subtract(Duration(seconds: 10));

      final List<UsageInfo> usageStats = await UsageStats.queryUsageStats(
        startDate,
        endDate,
      );

      if (usageStats.isEmpty) return null;

      usageStats.sort((a, b) => ((b.lastTimeUsed ?? 0) as int)
          .compareTo((a.lastTimeUsed ?? 0) as int));

      return usageStats.first.packageName;
    } catch (e) {
      print('Error getting current app: $e');
      return null;
    }
  }
}

/// Background task callback
///
/// This runs periodically in the background to track app usage.
/// Data is stored via the Rust backend.
@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    try {
      // Initialize database service for background context
      await DatabaseService.instance.initialize();

      // Track current app in background
      final DateTime endDate = DateTime.now();
      final DateTime startDate = endDate.subtract(Duration(minutes: 1));

      final List<UsageInfo> usageStats = await UsageStats.queryUsageStats(
        startDate,
        endDate,
      );

      if (usageStats.isNotEmpty) {
        usageStats.sort((a, b) => ((b.lastTimeUsed ?? 0) as int)
            .compareTo((a.lastTimeUsed ?? 0) as int));

        final UsageInfo currentUsage = usageStats.first;
        final String appName = currentUsage.packageName ?? 'Unknown';

        // Save to Rust backend
        final sessionId = await DatabaseService.instance.startSession(
          appName: appName,
          windowTitle: appName,
          exePath: currentUsage.packageName ?? '',
        );

        // End session after brief delay
        await Future.delayed(Duration(seconds: 5));
        await DatabaseService.instance.endSession(sessionId);
      }

      return Future.value(true);
    } catch (e) {
      print('Background task error: $e');
      return Future.value(false);
    }
  });
}
