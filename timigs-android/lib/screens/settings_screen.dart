import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/database_service.dart';
import '../services/tracker_service.dart';
import '../main.dart';
import '../models/settings.dart';
import 'google_drive_screen.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _isTracking = false;
  bool _batteryOptimizationDisabled = false;

  String _getLanguageName(String code) {
    switch (code) {
      case 'en': return 'English';
      case 'uk': return 'Українська';
      case 'de': return 'Deutsch';
      case 'fr': return 'Français';
      case 'es': return 'Español';
      default: return 'English';
    }
  }

  @override
  void initState() {
    super.initState();
    _isTracking = TrackerService.instance.isTracking;
    _checkBatteryOptimization();
  }

  Future<void> _checkBatteryOptimization() async {
    final disabled =
        await TrackerService.instance.isBatteryOptimizationDisabled();
    if (mounted) {
      setState(() {
        _batteryOptimizationDisabled = disabled;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final settingsNotifier = Provider.of<SettingsNotifier>(context);
    final settings = settingsNotifier.settings;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Settings'),
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Appearance Section
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Appearance',
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Language
                  ListTile(
                    leading: const Icon(Icons.language),
                    title: const Text('Language'),
                    subtitle: Text(_getLanguageName(settings.language)),
                    trailing: DropdownButton<String>(
                      value: settings.language,
                      underline: const SizedBox(),
                      items: const [
                        DropdownMenuItem(value: 'en', child: Text('English')),
                        DropdownMenuItem(value: 'uk', child: Text('Українська')),
                        DropdownMenuItem(value: 'de', child: Text('Deutsch')),
                        DropdownMenuItem(value: 'fr', child: Text('Français')),
                        DropdownMenuItem(value: 'es', child: Text('Español')),
                      ],
                      onChanged: (value) {
                        if (value != null) {
                          settingsNotifier.updateSettings(
                            settings.copyWith(language: value),
                          );
                        }
                      },
                    ),
                  ),

                  const Divider(),

                  // Theme
                  ListTile(
                    leading: const Icon(Icons.palette),
                    title: const Text('Theme'),
                    subtitle: Text(settings.theme == 'dark' ? 'Dark' : 'Light'),
                    trailing: DropdownButton<String>(
                      value: settings.theme,
                      underline: const SizedBox(),
                      items: const [
                        DropdownMenuItem(value: 'dark', child: Text('Dark')),
                        DropdownMenuItem(value: 'light', child: Text('Light')),
                      ],
                      onChanged: (value) {
                        if (value != null) {
                          settingsNotifier.updateSettings(
                            settings.copyWith(theme: value),
                          );
                        }
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),

          // Tracking Section
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Tracking',
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),

                  ListTile(
                    leading: Icon(
                      _isTracking ? Icons.play_circle : Icons.pause_circle,
                      color: _isTracking ? Colors.green : Colors.orange,
                    ),
                    title: Text(
                        _isTracking ? 'Tracking Active' : 'Tracking Paused'),
                    subtitle: Text(
                      _isTracking
                          ? 'Activity is being tracked'
                          : 'Activity tracking is paused',
                    ),
                    trailing: Switch(
                      value: _isTracking,
                      onChanged: (value) async {
                        if (value) {
                          await TrackerService.instance.startTracking();
                        } else {
                          await TrackerService.instance.stopTracking();
                        }
                        setState(() {
                          _isTracking = value;
                        });
                      },
                    ),
                  ),

                  const Divider(),

                  ListTile(
                    leading: const Icon(Icons.security),
                    title: const Text('Usage Stats Permission'),
                    subtitle: const Text('Required for activity tracking'),
                    trailing: ElevatedButton(
                      onPressed: () async {
                        await TrackerService.instance.requestPermission();
                      },
                      child: const Text('Grant'),
                    ),
                  ),

                  const Divider(),

                  // Battery optimization
                  ListTile(
                    leading: Icon(
                      Icons.battery_saver,
                      color: _batteryOptimizationDisabled
                          ? Colors.green
                          : Colors.orange,
                    ),
                    title: const Text('Battery Optimization'),
                    subtitle: Text(
                      _batteryOptimizationDisabled
                          ? 'Disabled (background tracking works)'
                          : 'Enabled (may stop background tracking)',
                    ),
                    trailing: _batteryOptimizationDisabled
                        ? const Icon(Icons.check_circle, color: Colors.green)
                        : ElevatedButton(
                            onPressed: () async {
                              await TrackerService.instance
                                  .requestBatteryOptimization();
                              // Re-check after a short delay
                              await Future.delayed(const Duration(seconds: 2));
                              _checkBatteryOptimization();
                            },
                            child: const Text('Disable'),
                          ),
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),

          // Data Management Section
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Data Management',
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  ListTile(
                    leading: const Icon(Icons.cloud_upload),
                    title: const Text('Google Drive Sync'),
                    subtitle: const Text('Backup and restore data'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => const GoogleDriveScreen(),
                        ),
                      );
                    },
                  ),
                  const Divider(),
                  ListTile(
                    leading: const Icon(Icons.download),
                    title: const Text('Export Data'),
                    subtitle: const Text('Export database to file'),
                    trailing: const Icon(Icons.chevron_right),
                    onTap: () async {
                      final path =
                          await DatabaseService.instance.exportDatabase();
                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Database exported to: $path'),
                            duration: const Duration(seconds: 3),
                          ),
                        );
                      }
                    },
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 16),

          // About Section
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'About',
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 16),
                  ListTile(
                    leading: const Icon(Icons.info),
                    title: const Text('Version'),
                    subtitle: const Text('1.0.0'),
                  ),
                  const Divider(),
                  ListTile(
                    leading: const Icon(Icons.code),
                    title: const Text('TimiGS Android'),
                    subtitle: const Text('Activity Tracker for Android'),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
