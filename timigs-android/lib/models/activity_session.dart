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
      'start_time': startTime.toIso8601String(),
      'end_time': endTime?.toIso8601String(),
      'duration_seconds': durationSeconds,
    };
  }

  factory ActivitySession.fromMap(Map<String, dynamic> map) {
    return ActivitySession(
      id: map['id'] as int?,
      appName: map['app_name'] as String,
      windowTitle: map['window_title'] as String,
      exePath: map['exe_path'] as String,
      startTime: DateTime.parse(map['start_time'] as String),
      endTime: map['end_time'] != null 
          ? DateTime.parse(map['end_time'] as String) 
          : null,
      durationSeconds: map['duration_seconds'] as int,
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
