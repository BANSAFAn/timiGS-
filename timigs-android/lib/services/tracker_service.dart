import 'package:flutter/services.dart';
import 'package:app_usage/app_usage.dart';
import 'package:workmanager/workmanager.dart';
import 'dart:async';
import 'database_service.dart';

class TrackerService {
  static final TrackerService instance = TrackerService._init();
  static const platform =
      MethodChannel('com.timigs.timigs_android/app_control');

  TrackerService._init();

  bool _isTracking = false;
  Timer? _trackingTimer;
  String? _currentApp;
  int? _currentSessionId;

  bool get isTracking => _isTracking;

  /// Request usage stats permission (Android-specific)
  Future<bool> requestPermission() async {
    try {
      // Open usage stats settings directly via native code
      await platform.invokeMethod('openUsageAccessSettings');
      // Wait a moment then check
      await Future.delayed(const Duration(seconds: 2));
      return await hasPermission();
    } catch (e) {
      print('Error requesting permission: $e');
      // Fallback: try via app_usage plugin
      try {
        final DateTime endDate = DateTime.now();
        final DateTime startDate = endDate.subtract(Duration(hours: 1));
        await AppUsage().getAppUsage(startDate, endDate);
        return true;
      } catch (_) {
        return false;
      }
    }
  }

  /// Check if permission is granted
  Future<bool> hasPermission() async {
    try {
      final DateTime endDate = DateTime.now();
      final DateTime startDate = endDate.subtract(Duration(hours: 1));

      // Try to get usage - if it fails, permission is not granted
      await AppUsage().getAppUsage(startDate, endDate);
      return true;
    } catch (e) {
      print('Permission not granted: $e');
      return false;
    }
  }

  /// Request battery optimization exemption
  Future<void> requestBatteryOptimization() async {
    try {
      await platform.invokeMethod('requestBatteryOptimization');
    } catch (e) {
      print('Error requesting battery optimization: $e');
    }
  }

  /// Check if battery optimization is disabled for this app
  Future<bool> isBatteryOptimizationDisabled() async {
    try {
      final result =
          await platform.invokeMethod<bool>('isBatteryOptimizationDisabled');
      return result ?? false;
    } catch (e) {
      print('Error checking battery optimization: $e');
      return false;
    }
  }

  /// Start the native foreground service
  Future<void> _startForegroundService() async {
    try {
      await platform.invokeMethod('startForegroundService');
    } catch (e) {
      print('Error starting foreground service: $e');
    }
  }

  /// Stop the native foreground service
  Future<void> _stopForegroundService() async {
    try {
      await platform.invokeMethod('stopForegroundService');
    } catch (e) {
      print('Error stopping foreground service: $e');
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

    // Start native foreground service (keeps app alive in background)
    await _startForegroundService();

    // Request battery optimization exemption
    await requestBatteryOptimization();

    // Start periodic tracking (every 5 seconds)
    _trackingTimer = Timer.periodic(Duration(seconds: 5), (timer) async {
      await _trackCurrentApp();
    });

    // Initial track
    await _trackCurrentApp();

    // Register background work as backup (in case foreground service is killed)
    await Workmanager().registerPeriodicTask(
      'tracking_task',
      'trackingTask',
      frequency: Duration(minutes: 15),
      constraints: Constraints(
        networkType: NetworkType.not_required,
      ),
    );
  }

  /// Stop tracking
  Future<void> stopTracking() async {
    if (!_isTracking) return;

    _isTracking = false;
    _trackingTimer?.cancel();
    _trackingTimer = null;

    // Stop native foreground service
    await _stopForegroundService();

    // End current session if exists
    if (_currentSessionId != null) {
      await DatabaseService.instance.endSession(_currentSessionId!);
      _currentSessionId = null;
    }

    await Workmanager().cancelByUniqueName('tracking_task');
  }

  /// Track current app (Android-specific, stores via SQLite)
  Future<void> _trackCurrentApp() async {
    try {
      final DateTime endDate = DateTime.now();
      final DateTime startDate = endDate.subtract(Duration(seconds: 10));

      final List<AppUsageInfo> usageStats = await AppUsage().getAppUsage(
        startDate,
        endDate,
      );

      if (usageStats.isEmpty) return;

      // Get the most recently used app (by usage time)
      usageStats.sort((a, b) => b.usage.inSeconds.compareTo(a.usage.inSeconds));

      final AppUsageInfo currentUsage = usageStats.first;
      final String appName = currentUsage.packageName;

      // Check if app changed
      if (appName != _currentApp) {
        // End previous session
        if (_currentSessionId != null) {
          await DatabaseService.instance.endSession(_currentSessionId!);
        }

        // Start new session
        _currentApp = appName;
        _currentSessionId = await DatabaseService.instance.startSession(
          appName: currentUsage.appName,
          windowTitle:
              currentUsage.appName, // Android doesn't have window titles
          exePath: currentUsage.packageName,
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

      final List<AppUsageInfo> usageStats = await AppUsage().getAppUsage(
        startDate,
        endDate,
      );

      if (usageStats.isEmpty) return null;

      usageStats.sort((a, b) => b.usage.inSeconds.compareTo(a.usage.inSeconds));

      return usageStats.first.packageName;
    } catch (e) {
      print('Error getting current app: $e');
      return null;
    }
  }

  /// Lock the app (App Pinning)
  Future<void> startLockTask() async {
    try {
      await platform.invokeMethod('startLockTask');
    } catch (e) {
      print('Error locking task: $e');
    }
  }

  /// Unlock the app
  Future<void> stopLockTask() async {
    try {
      await platform.invokeMethod('stopLockTask');
    } catch (e) {
      print('Error unlocking task: $e');
    }
  }

  /// Minimize the app
  Future<void> minimizeApp() async {
    try {
      await platform.invokeMethod('minimizeApp');
    } catch (e) {
      print('Error minimizing app: $e');
    }
  }
}

/// Background task callback
///
/// This runs periodically in the background to track app usage.
/// Data is stored via SQLite.
@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    try {
      // Initialize database service for background context
      await DatabaseService.instance.initialize();

      // Track current app in background
      final DateTime endDate = DateTime.now();
      final DateTime startDate = endDate.subtract(Duration(minutes: 1));

      final List<AppUsageInfo> usageStats = await AppUsage().getAppUsage(
        startDate,
        endDate,
      );

      if (usageStats.isNotEmpty) {
        usageStats
            .sort((a, b) => b.usage.inSeconds.compareTo(a.usage.inSeconds));

        final AppUsageInfo currentUsage = usageStats.first;

        // Save to SQLite
        final sessionId = await DatabaseService.instance.startSession(
          appName: currentUsage.appName,
          windowTitle: currentUsage.appName,
          exePath: currentUsage.packageName,
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
