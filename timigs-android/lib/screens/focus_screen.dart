import 'dart:async';
import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';

/// Focus Mode screen for Android.
/// Since Android cannot enforce app blocking without accessibility/device admin
/// permissions, this provides a visual timer and reminders.
class FocusScreen extends StatefulWidget {
  const FocusScreen({super.key});

  @override
  State<FocusScreen> createState() => _FocusScreenState();
}

class _FocusScreenState extends State<FocusScreen>
    with TickerProviderStateMixin {
  final TextEditingController _appNameController = TextEditingController();
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _cancelPasswordController =
      TextEditingController();

  int _hours = 0;
  int _minutes = 30;
  bool _isActive = false;
  int _remainingSecs = 0;
  int _totalSecs = 0;
  String _focusAppName = '';
  String _password = '';
  String? _cancelError;
  Timer? _timer;
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pulseController.dispose();
    _appNameController.dispose();
    _passwordController.dispose();
    _cancelPasswordController.dispose();
    super.dispose();
  }

  void _startFocus() {
    final totalSecs = _hours * 3600 + _minutes * 60;
    if (_appNameController.text.isEmpty ||
        totalSecs == 0 ||
        _passwordController.text.isEmpty) {
      return;
    }
    setState(() {
      _isActive = true;
      _totalSecs = totalSecs;
      _remainingSecs = totalSecs;
      _focusAppName = _appNameController.text;
      _password = _passwordController.text;
      _passwordController.clear();
    });

    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_remainingSecs <= 0) {
        timer.cancel();
        setState(() {
          _isActive = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Focus session completed! 🎉')),
        );
        return;
      }
      setState(() {
        _remainingSecs--;
      });
    });
  }

  void _cancelFocus() {
    if (_cancelPasswordController.text != _password) {
      setState(() => _cancelError =
          AppLocalizations.of(context)?.focusWrongPassword ?? 'Wrong password');
      return;
    }
    _timer?.cancel();
    setState(() {
      _isActive = false;
      _cancelError = null;
      _cancelPasswordController.clear();
    });
  }

  String _formatTime(int totalSeconds) {
    final h = totalSeconds ~/ 3600;
    final m = (totalSeconds % 3600) ~/ 60;
    final s = totalSeconds % 60;
    return '${h.toString().padLeft(2, '0')}:${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  double get _progress {
    if (_totalSecs == 0) return 0;
    return (_totalSecs - _remainingSecs) / _totalSecs;
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n?.focusTitle ?? 'Focus Mode'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: _isActive
            ? _buildActiveState(l10n, isDark)
            : _buildSetupState(l10n, isDark),
      ),
    );
  }

  Widget _buildSetupState(AppLocalizations? l10n, bool isDark) {
    final purple = Colors.deepPurple;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // App name input
        _buildSection(
          icon: '🎯',
          label: l10n?.focusSelectApp ?? 'Select Application',
          child: TextField(
            controller: _appNameController,
            style: TextStyle(color: isDark ? Colors.white : Colors.black),
            decoration: InputDecoration(
              hintText: 'e.g. Chrome, VSCode, Notes...',
              hintStyle:
                  TextStyle(color: isDark ? Colors.white38 : Colors.black38),
              filled: true,
              fillColor: isDark
                  ? Colors.white.withValues(alpha: 0.05)
                  : Colors.black.withValues(alpha: 0.05),
              border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide.none),
            ),
          ),
        ),
        const SizedBox(height: 20),

        // Duration
        _buildSection(
          icon: '⏱️',
          label: l10n?.focusDuration ?? 'Duration',
          child: Row(
            children: [
              Expanded(
                child: _buildNumberPicker(
                    'Hours', _hours, 0, 24, (v) => setState(() => _hours = v)),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: _buildNumberPicker('Minutes', _minutes, 0, 59,
                    (v) => setState(() => _minutes = v)),
              ),
            ],
          ),
        ),
        const SizedBox(height: 20),

        // Password
        _buildSection(
          icon: '🔒',
          label: l10n?.focusPassword ?? 'Lock Password',
          child: TextField(
            controller: _passwordController,
            obscureText: true,
            style: TextStyle(color: isDark ? Colors.white : Colors.black),
            decoration: InputDecoration(
              hintText: 'Enter password...',
              hintStyle:
                  TextStyle(color: isDark ? Colors.white38 : Colors.black38),
              filled: true,
              fillColor: isDark
                  ? Colors.white.withValues(alpha: 0.05)
                  : Colors.black.withValues(alpha: 0.05),
              border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide.none),
            ),
          ),
        ),
        const SizedBox(height: 30),

        // Start button
        ElevatedButton(
          onPressed: _startFocus,
          style: ElevatedButton.styleFrom(
            backgroundColor: purple,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            elevation: 4,
          ),
          child: Text(
            '🚀 ${l10n?.focusStart ?? "Start Focus Mode"}',
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
        ),

        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.amber.withValues(alpha: 0.1),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.amber.withValues(alpha: 0.3)),
          ),
          child: Row(
            children: [
              const Text('⚠️', style: TextStyle(fontSize: 20)),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'On Android, Focus Mode provides visual reminders. It cannot block other apps.',
                  style: TextStyle(
                    color:
                        isDark ? Colors.amber.shade200 : Colors.amber.shade800,
                    fontSize: 13,
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildActiveState(AppLocalizations? l10n, bool isDark) {
    return Column(
      children: [
        // Target app badge
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                Colors.deepPurple.withValues(alpha: 0.15),
                Colors.deepPurple.withValues(alpha: 0.05)
              ],
            ),
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: Colors.deepPurple.withValues(alpha: 0.3)),
          ),
          child: Row(
            children: [
              const Text('🎯', style: TextStyle(fontSize: 32)),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      _focusAppName,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: Colors.deepPurple.shade200,
                      ),
                    ),
                    Text(
                      l10n?.focusActive ?? 'Focus Active',
                      style: TextStyle(
                          color: isDark ? Colors.white54 : Colors.black54,
                          fontSize: 13),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 40),

        // Circular progress
        SizedBox(
          width: 200,
          height: 200,
          child: Stack(
            alignment: Alignment.center,
            children: [
              SizedBox(
                width: 200,
                height: 200,
                child: CircularProgressIndicator(
                  value: _progress,
                  strokeWidth: 10,
                  backgroundColor: isDark ? Colors.white12 : Colors.black12,
                  valueColor:
                      const AlwaysStoppedAnimation<Color>(Colors.deepPurple),
                ),
              ),
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    _formatTime(_remainingSecs),
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: isDark ? Colors.white : Colors.black,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    l10n?.focusMessage ?? 'Stay focused!',
                    style: TextStyle(
                        color: isDark ? Colors.white54 : Colors.black54,
                        fontSize: 12),
                  ),
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: 40),

        // Cancel section
        TextField(
          controller: _cancelPasswordController,
          obscureText: true,
          style: TextStyle(color: isDark ? Colors.white : Colors.black),
          decoration: InputDecoration(
            hintText: 'Enter password to cancel...',
            hintStyle:
                TextStyle(color: isDark ? Colors.white38 : Colors.black38),
            filled: true,
            fillColor: isDark
                ? Colors.white.withValues(alpha: 0.05)
                : Colors.black.withValues(alpha: 0.05),
            border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
                borderSide: BorderSide.none),
          ),
        ),
        const SizedBox(height: 12),
        if (_cancelError != null)
          Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child:
                Text(_cancelError!, style: const TextStyle(color: Colors.red)),
          ),
        OutlinedButton.icon(
          onPressed: _cancelFocus,
          icon: const Text('✋'),
          label: Text(l10n?.focusCancel ?? 'Cancel Focus'),
          style: OutlinedButton.styleFrom(
            foregroundColor: Colors.red,
            side: const BorderSide(color: Colors.red),
            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 24),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          ),
        ),
      ],
    );
  }

  Widget _buildSection(
      {required String icon, required String label, required Widget child}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(icon, style: const TextStyle(fontSize: 18)),
            const SizedBox(width: 8),
            Text(label,
                style:
                    const TextStyle(fontWeight: FontWeight.w600, fontSize: 15)),
          ],
        ),
        const SizedBox(height: 10),
        child,
      ],
    );
  }

  Widget _buildNumberPicker(
      String label, int value, int min, int max, Function(int) onChanged) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      decoration: BoxDecoration(
        color: isDark
            ? Colors.white.withValues(alpha: 0.05)
            : Colors.black.withValues(alpha: 0.05),
        borderRadius: BorderRadius.circular(14),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Column(
        children: [
          Text(label,
              style: TextStyle(
                  fontSize: 12,
                  color: isDark ? Colors.white54 : Colors.black54)),
          const SizedBox(height: 4),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.remove_circle_outline, size: 20),
                onPressed: value > min ? () => onChanged(value - 1) : null,
              ),
              Text(
                value.toString().padLeft(2, '0'),
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: isDark ? Colors.white : Colors.black,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.add_circle_outline, size: 20),
                onPressed: value < max ? () => onChanged(value + 1) : null,
              ),
            ],
          ),
        ],
      ),
    );
  }
}
