class ActivitySession {
  final int? id;
  final String appName;
  final String windowTitle;
  final String exePath;
  final DateTime startTime;
  final DateTime? endTime;
  final int durationSeconds;

  ActivitySession({
    this.id,
    required this.appName,
    required this.windowTitle,
    required this.exePath,
    required this.startTime,
    this.endTime,
    required this.durationSeconds,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'app_name': appName,
      'window_title': windowTitle,
      'exe_path': exePath,
      'start_time': startTime.millisecondsSinceEpoch,
      'end_time': endTime?.millisecondsSinceEpoch,
      'duration_seconds': durationSeconds,
    };
  }

  /// Create from SQLite row (timestamps stored as milliseconds)
  factory ActivitySession.fromMap(Map<String, dynamic> map) {
    final startMs = map['start_time'] as int;
    final endMs = map['end_time'] as int?;
    final start = DateTime.fromMillisecondsSinceEpoch(startMs);
    final end =
        endMs != null ? DateTime.fromMillisecondsSinceEpoch(endMs) : null;
    final duration = end != null
        ? end.difference(start).inSeconds
        : DateTime.now().difference(start).inSeconds;

    return ActivitySession(
      id: map['id'] as int?,
      appName: map['app_name'] as String,
      windowTitle: map['window_title'] as String,
      exePath: map['exe_path'] as String,
      startTime: start,
      endTime: end,
      durationSeconds: duration,
    );
  }

  String get formattedDuration {
    final hours = durationSeconds ~/ 3600;
    final minutes = (durationSeconds % 3600) ~/ 60;
    final seconds = durationSeconds % 60;

    if (hours > 0) {
      return '${hours}h ${minutes}m ${seconds}s';
    } else if (minutes > 0) {
      return '${minutes}m ${seconds}s';
    } else {
      return '${seconds}s';
    }
  }
}
