import 'package:flutter_local_notifications/flutter_local_notifications.dart';

/// Service for managing persistent notifications during tracking
class NotificationService {
  static final NotificationService instance = NotificationService._init();

  NotificationService._init();

  final FlutterLocalNotificationsPlugin _notifications =
      FlutterLocalNotificationsPlugin();

  static const int _trackingNotificationId = 1;
  static const String _channelId = 'tracking_channel';
  static const String _channelName = 'Activity Tracking';
  static const String _channelDescription =
      'Shows when TimiGS is tracking your activity';

  bool _isInitialized = false;

  /// Initialize the notification service
  Future<void> initialize() async {
    if (_isInitialized) return;

    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const initSettings = InitializationSettings(android: androidSettings);

    await _notifications.initialize(initSettings);

    // Create notification channel for Android 8.0+
    const androidChannel = AndroidNotificationChannel(
      _channelId,
      _channelName,
      description: _channelDescription,
      importance: Importance.low, // Low importance for persistent notification
      playSound: false,
      enableVibration: false,
    );

    await _notifications
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(androidChannel);

    _isInitialized = true;
  }

  /// Show persistent tracking notification
  Future<void> showTrackingNotification() async {
    if (!_isInitialized) await initialize();

    const androidDetails = AndroidNotificationDetails(
      _channelId,
      _channelName,
      channelDescription: _channelDescription,
      importance: Importance.low,
      priority: Priority.low,
      ongoing: true, // Cannot be swiped away
      autoCancel: false,
      showWhen: false,
      icon: '@mipmap/ic_launcher',
      category: AndroidNotificationCategory.service,
    );

    const notificationDetails = NotificationDetails(android: androidDetails);

    await _notifications.show(
      _trackingNotificationId,
      'TimiGS',
      '🟢 Recording your activity',
      notificationDetails,
    );
  }

  /// Hide tracking notification
  Future<void> hideTrackingNotification() async {
    await _notifications.cancel(_trackingNotificationId);
  }
}
