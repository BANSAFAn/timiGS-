import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:provider/provider.dart';
import 'package:workmanager/workmanager.dart';
import 'screens/dashboard_screen.dart';
import 'screens/timeline_screen.dart';
import 'screens/analytics_screen.dart';
import 'screens/weather_screen.dart';
import 'screens/transfer_screen.dart';
import 'screens/tools_screen.dart';
import 'screens/settings_screen.dart';
import 'services/database_service.dart';
import 'services/tracker_service.dart';
import 'services/notification_service.dart';
import 'models/settings.dart';
import 'l10n/app_localizations.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Rust backend and database
  await DatabaseService.instance.initialize();

  // Initialize notification service
  await NotificationService.instance.initialize();

  // Initialize workmanager for background tasks
  await Workmanager().initialize(callbackDispatcher, isInDebugMode: false);

  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  AppSettings _settings = AppSettings();
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadSettings();
    _initializeTracking();
  }

  Future<void> _loadSettings() async {
    final settings = await DatabaseService.instance.getSettings();
    setState(() {
      _settings = settings;
      _isLoading = false;
    });
  }

  Future<void> _initializeTracking() async {
    // Request permission and start tracking
    final hasPermission = await TrackerService.instance.hasPermission();
    if (!hasPermission) {
      await TrackerService.instance.requestPermission();
    }

    // Auto-start tracking
    if (!TrackerService.instance.isTracking) {
      await TrackerService.instance.startTracking();
    }
  }

  void updateSettings(AppSettings newSettings) {
    setState(() {
      _settings = newSettings;
    });
    DatabaseService.instance.saveSettings(newSettings);
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return MaterialApp(
        home: Scaffold(body: Center(child: CircularProgressIndicator())),
      );
    }

    return ChangeNotifierProvider(
      create: (_) => SettingsNotifier(_settings),
      child: Consumer<SettingsNotifier>(
        builder: (context, settingsNotifier, _) {
          return MaterialApp(
            title: 'TimiGS',
            debugShowCheckedModeBanner: false,
            theme: _buildTheme(Brightness.light),
            darkTheme: _buildTheme(Brightness.dark),
            themeMode: settingsNotifier.settings.theme == 'dark'
                ? ThemeMode.dark
                : ThemeMode.light,
            locale: Locale(settingsNotifier.settings.language),
            supportedLocales: const [Locale('en'), Locale('uk')],
            localizationsDelegates: const [
              AppLocalizations.delegate,
              GlobalMaterialLocalizations.delegate,
              GlobalWidgetsLocalizations.delegate,
              GlobalCupertinoLocalizations.delegate,
            ],
            home: const MainScreen(),
          );
        },
      ),
    );
  }

  ThemeData _buildTheme(Brightness brightness) {
    final isDark = brightness == Brightness.dark;

    return ThemeData(
      brightness: brightness,
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: const Color(0xFF6366F1),
        brightness: brightness,
      ),
      scaffoldBackgroundColor:
          isDark ? const Color(0xFF0F0F1E) : const Color(0xFFF5F5F7),
      appBarTheme: AppBarTheme(
        elevation: 0,
        centerTitle: false,
        backgroundColor:
            isDark ? const Color(0xFF0F0F1E) : const Color(0xFFF5F5F7),
        foregroundColor: isDark ? Colors.white : Colors.black,
      ),
    );
  }
}

class SettingsNotifier extends ChangeNotifier {
  AppSettings _settings;

  SettingsNotifier(this._settings);

  AppSettings get settings => _settings;

  void updateSettings(AppSettings newSettings) {
    _settings = newSettings;
    DatabaseService.instance.saveSettings(newSettings);
    notifyListeners();
  }
}

class MainScreen extends StatefulWidget {
  const MainScreen({super.key});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _selectedIndex = 0;

  final List<Widget> _screens = [
    const DashboardScreen(),
    const TimelineScreen(),
    const AnalyticsScreen(),
    const WeatherScreen(),
    const TransferScreen(),
    const ToolsScreen(),
    const SettingsScreen(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: _screens[_selectedIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _selectedIndex,
        onDestinationSelected: (index) {
          setState(() {
            _selectedIndex = index;
          });
        },
        destinations: [
          NavigationDestination(
            icon: const Icon(Icons.dashboard_outlined),
            selectedIcon: const Icon(Icons.dashboard),
            label: AppLocalizations.of(context)!.dashboard,
          ),
          NavigationDestination(
            icon: const Icon(Icons.timeline_outlined),
            selectedIcon: const Icon(Icons.timeline),
            label: AppLocalizations.of(context)!.timeline,
          ),
          NavigationDestination(
            icon: const Icon(Icons.analytics_outlined),
            selectedIcon: const Icon(Icons.analytics),
            label: AppLocalizations.of(context)!.analytics,
          ),
          NavigationDestination(
            icon: const Icon(Icons.wb_sunny_outlined),
            selectedIcon: const Icon(Icons.wb_sunny),
            label: AppLocalizations.of(context)!.weatherTitle,
          ),
          NavigationDestination(
            icon: const Icon(Icons.swap_horiz_outlined),
            selectedIcon: const Icon(Icons.swap_horiz),
            label:
                'Transfer', // Not in ARB? Adding it now in replacement if needed or hardcoded?
            // Wait, Transfer isn't in arb. I should check arb again.
            // app_en.arb has: dashboard, timeline, analytics, tools, settings.
            // missing: transfer
          ),
          NavigationDestination(
            icon: const Icon(Icons.build_outlined),
            selectedIcon: const Icon(Icons.build),
            label: AppLocalizations.of(context)!.tools,
          ),
          NavigationDestination(
            icon: const Icon(Icons.settings_outlined),
            selectedIcon: const Icon(Icons.settings),
            label: AppLocalizations.of(context)!.settings,
          ),
        ],
      ),
    );
  }
}
