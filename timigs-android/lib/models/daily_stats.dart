class DailyStats {
  final String date;
  final int totalSeconds;
  final int appCount;

  DailyStats({
    required this.date,
    required this.totalSeconds,
    required this.appCount,
  });

  factory DailyStats.fromMap(Map<String, dynamic> map) {
    return DailyStats(
      date: map['date'] as String,
      totalSeconds: map['total_seconds'] as int,
      appCount: map['app_count'] as int,
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
}
