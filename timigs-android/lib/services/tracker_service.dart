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

  // Request usage stats permission
  Future<bool> requestPermission() async {
    try {
      await UsageStats.grantUsagePermission();
      return await UsageStats.checkUsagePermission() ?? false;
    } catch (e) {
      print('Error requesting permission: $e');
      return false;
    }
  }

  // Check if permission is granted
  Future<bool> hasPermission() async {
    try {
      return await UsageStats.checkUsagePermission() ?? false;
    } catch (e) {
      print('Error checking permission: $e');
      return false;
    }
  }

  // Start tracking
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

  // Stop tracking
  Future<void> stopTracking() async {
    if (!_isTracking) return;
    
    _isTracking = false;
    _trackingTimer?.cancel();
    _trackingTimer = null;

    // End current session if exists
    if (_currentSessionId != null) {
      await DatabaseService.instance.endSession(_currentSessionId!);
      _currentSessionId = null;
    }

    await Workmanager().cancelByUniqueName('tracking_task');
  }

  // Track current app
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
      usageStats.sort((a, b) => 
        (b.lastTimeUsed ?? 0).compareTo(a.lastTimeUsed ?? 0)
      );

      final UsageInfo currentUsage = usageStats.first;
      final String appName = currentUsage.packageName ?? 'Unknown';

      // Check if app changed
      if (appName != _currentApp) {
        // End previous session
        if (_currentSessionId != null) {
          await DatabaseService.instance.endSession(_currentSessionId!);
        }

        // Start new session
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

  // Get current active app
  Future<String?> getCurrentApp() async {
    try {
      final DateTime endDate = DateTime.now();
      final DateTime startDate = endDate.subtract(Duration(seconds: 10));

      final List<UsageInfo> usageStats = await UsageStats.queryUsageStats(
        startDate,
        endDate,
      );

      if (usageStats.isEmpty) return null;

      usageStats.sort((a, b) => 
        (b.lastTimeUsed ?? 0).compareTo(a.lastTimeUsed ?? 0)
      );

      return usageStats.first.packageName;
    } catch (e) {
      print('Error getting current app: $e');
      return null;
    }
  }
}

// Background task callback
@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    try {
      // Track current app in background
      final DateTime endDate = DateTime.now();
      final DateTime startDate = endDate.subtract(Duration(minutes: 1));

      final List<UsageInfo> usageStats = await UsageStats.queryUsageStats(
        startDate,
        endDate,
      );

      if (usageStats.isNotEmpty) {
        usageStats.sort((a, b) => 
          (b.lastTimeUsed ?? 0).compareTo(a.lastTimeUsed ?? 0)
        );

        final UsageInfo currentUsage = usageStats.first;
        final String appName = currentUsage.packageName ?? 'Unknown';

        // Save to database
        final sessionId = await DatabaseService.instance.startSession(
          appName: appName,
          windowTitle: appName,
          exePath: currentUsage.packageName ?? '',
        );

        // End session after 1 minute (approximate)
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
