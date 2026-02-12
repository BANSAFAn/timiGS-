class AppUsageSummary {
  final String appName;
  final String exePath;
  final int totalSeconds;
  final int sessionCount;

  AppUsageSummary({
    required this.appName,
    required this.exePath,
    required this.totalSeconds,
    required this.sessionCount,
  });

  Map<String, dynamic> toMap() {
    return {
      'app_name': appName,
      'exe_path': exePath,
      'total_seconds': totalSeconds,
      'session_count': sessionCount,
    };
  }

  /// Create from SQLite aggregation query row
  factory AppUsageSummary.fromMap(Map<String, dynamic> map) {
    return AppUsageSummary(
      appName: map['app_name'] as String,
      exePath: map['exe_path'] as String? ?? '',
      totalSeconds: (map['total_seconds'] as int?) ?? 0,
      sessionCount: (map['session_count'] as int?) ?? 0,
    );
  }

  String get formattedDuration {
    final hours = totalSeconds ~/ 3600;
    final minutes = (totalSeconds % 3600) ~/ 60;

    if (hours > 0) {
      return '${hours}h ${minutes}m';
    } else {
      return '${minutes}m';
    }
  }

  double get percentage {
    // This will be calculated by the caller with total context
    return 0.0;
  }
}
