class DailyStats {
  final DateTime date;
  final int totalSeconds;
  final int sessionCount;

  DailyStats({
    required this.date,
    required this.totalSeconds,
    required this.sessionCount,
  });

  factory DailyStats.fromMap(Map<String, dynamic> map) {
    return DailyStats(
      date: DateTime.parse(map['date'] as String),
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

  String get formattedDate {
    return '${date.day}.${date.month.toString().padLeft(2, '0')}';
  }
}
