class AppSettings {
  final String language;
  final String theme;
  final bool autostart;
  final bool minimizeToTray;
  final String? googleClientId;
  final String? googleClientSecret;

  AppSettings({
    this.language = 'en',
    this.theme = 'dark',
    this.autostart = true,
    this.minimizeToTray = true,
    this.googleClientId,
    this.googleClientSecret,
  });

  Map<String, dynamic> toMap() {
    return {
      'language': language,
      'theme': theme,
      'autostart': autostart ? 'true' : 'false',
      'minimize_to_tray': minimizeToTray ? 'true' : 'false',
      'google_client_id': googleClientId,
      'google_client_secret': googleClientSecret,
    };
  }

  factory AppSettings.fromMap(Map<String, dynamic> map) {
    return AppSettings(
      language: map['language'] as String? ?? 'en',
      theme: map['theme'] as String? ?? 'dark',
      autostart: (map['autostart'] as String?) == 'true',
      minimizeToTray: (map['minimize_to_tray'] as String?) == 'true',
      googleClientId: map['google_client_id'] as String?,
      googleClientSecret: map['google_client_secret'] as String?,
    );
  }

  AppSettings copyWith({
    String? language,
    String? theme,
    bool? autostart,
    bool? minimizeToTray,
    String? googleClientId,
    String? googleClientSecret,
  }) {
    return AppSettings(
      language: language ?? this.language,
      theme: theme ?? this.theme,
      autostart: autostart ?? this.autostart,
      minimizeToTray: minimizeToTray ?? this.minimizeToTray,
      googleClientId: googleClientId ?? this.googleClientId,
      googleClientSecret: googleClientSecret ?? this.googleClientSecret,
    );
  }
}
