class Task {
  final int id;
  final String appName;
  final String? description;
  final int goalSeconds;
  final DateTime createdAt;
  final String status; // 'active', 'completed', 'paused'
  final String? titleFilter;

  Task({
    required this.id,
    required this.appName,
    this.description,
    required this.goalSeconds,
    required this.createdAt,
    required this.status,
    this.titleFilter,
  });

  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'app_name': appName,
      'description': description,
      'goal_seconds': goalSeconds,
      'created_at': createdAt.toIso8601String(),
      'status': status,
      'title_filter': titleFilter,
    };
  }

  factory Task.fromMap(Map<String, dynamic> map) {
    return Task(
      id: map['id'] as int,
      appName: map['app_name'] as String,
      description: map['description'] as String?,
      goalSeconds: map['goal_seconds'] as int,
      createdAt: DateTime.parse(map['created_at'] as String),
      status: map['status'] as String,
      titleFilter: map['title_filter'] as String?,
    );
  }

  String get formattedGoal {
    final hours = goalSeconds ~/ 3600;
    final minutes = (goalSeconds % 3600) ~/ 60;
    
    if (hours > 0) {
      return '${hours}h ${minutes}m';
    } else {
      return '${minutes}m';
    }
  }
}
