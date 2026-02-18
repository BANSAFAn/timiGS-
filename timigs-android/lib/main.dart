import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:provider/provider.dart';
import 'package:workmanager/workmanager.dart';
import 'package:permission_handler/permission_handler.dart';
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

  // Initialize database (SQLite)
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
    _requestPermissions();
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

  /// Request necessary Android permissions at startup
  Future<void> _requestPermissions() async {
    // Request notification permission (Android 13+)
    final notificationStatus = await Permission.notification.status;
    if (!notificationStatus.isGranted) {
      await Permission.notification.request();
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
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      extendBody: true,
      body: Stack(
        children: [
          _screens[_selectedIndex],
          Positioned(
            left: 16,
            right: 16,
            bottom: 16,
            child: Container(
              height: 70,
              decoration: BoxDecoration(
                color: (isDark ? const Color(0xFF1E1E2E) : Colors.white)
                    .withOpacity(0.85),
                borderRadius: BorderRadius.circular(35),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 20,
                    offset: const Offset(0, 5),
                  ),
                ],
                border: Border.all(
                  color:
                      (isDark ? Colors.white : Colors.black).withOpacity(0.1),
                  width: 0.5,
                ),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(35),
                child: SingleChildScrollView(
                  scrollDirection: Axis.horizontal,
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      _buildNavItem(0, 'dashboard.svg',
                          AppLocalizations.of(context)!.dashboard),
                      _buildNavItem(1, 'timeline.svg',
                          AppLocalizations.of(context)!.timeline),
                      _buildNavItem(2, 'analytics.svg',
                          AppLocalizations.of(context)!.analytics),
                      _buildNavItem(3, 'weather.svg', "Weather"),
                      _buildNavItem(4, 'transfer.svg', "Transfer"),
                      _buildNavItem(
                          5, 'tools.svg', AppLocalizations.of(context)!.tools),
                      _buildNavItem(6, 'settings.svg',
                          AppLocalizations.of(context)!.settings),
                    ],
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavItem(int index, String iconPath, String label) {
    final isSelected = _selectedIndex == index;
    final theme = Theme.of(context);
    final color = isSelected
        ? theme.colorScheme.primary
        : theme.colorScheme.onSurfaceVariant.withOpacity(0.6);

    return GestureDetector(
      onTap: () => setState(() => _selectedIndex = index),
      behavior: HitTestBehavior.opaque,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          mainAxisSize: MainAxisSize.min,
          children: [
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isSelected
                    ? theme.colorScheme.primary.withOpacity(0.15)
                    : Colors.transparent,
                shape: BoxShape.circle,
              ),
              child: SvgPicture.asset(
                'assets/icons/$iconPath',
                width: 24,
                height: 24,
                colorFilter: ColorFilter.mode(color, BlendMode.srcIn),
              ),
            ),
            if (isSelected) ...[
              const SizedBox(height: 4),
              Text(
                label,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w600,
                  color: color,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
