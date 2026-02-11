import 'dart:async';
import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';
import '../services/tracker_service.dart';

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
  late Animation<double> _pulseAnimation;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat(reverse: true);
    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.1).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    if (_isActive) {
      // Emergency unlock if user somehow leaves screen while active (shouldn't happen with LockTask)
      TrackerService.instance.stopLockTask();
    }
    _timer?.cancel();
    _pulseController.dispose();
    _appNameController.dispose();
    _passwordController.dispose();
    _cancelPasswordController.dispose();
    super.dispose();
  }

  Future<void> _startFocus() async {
    final totalSecs = _hours * 3600 + _minutes * 60;
    if (_appNameController.text.isEmpty ||
        totalSecs == 0 ||
        _passwordController.text.isEmpty) {
      return;
    }

    // Start App Pinning
    await TrackerService.instance.startLockTask();

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
        _finishFocus();
        return;
      }
      setState(() {
        _remainingSecs--;
      });
    });
  }

  void _finishFocus() {
    _timer?.cancel();
    TrackerService.instance.stopLockTask();
    setState(() {
      _isActive = false;
    });
    // Show completion dialog or snackbar
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        title: const Text('🎉 Session Complete!'),
        content: Text('Great job staying focused on $_focusAppName.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _cancelFocus() {
    if (_cancelPasswordController.text != _password) {
      setState(() => _cancelError =
          AppLocalizations.of(context)?.focusWrongPassword ?? 'Wrong password');
      return;
    }
    _timer?.cancel();
    TrackerService.instance.stopLockTask();
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

    // Colorful background
    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: Text(l10n?.focusTitle ?? 'Focus Mode'),
        backgroundColor: Colors.transparent,
        elevation: 0,
        centerTitle: true,
      ),
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: isDark
                ? [const Color(0xFF1A1A2E), const Color(0xFF16213E)]
                : [const Color(0xFFE0EAFC), const Color(0xFFCFDEF3)],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: _isActive
                ? _buildActiveState(l10n, isDark)
                : _buildSetupState(l10n, isDark),
          ),
        ),
      ),
    );
  }

  Widget _buildSetupState(AppLocalizations? l10n, bool isDark) {
    final purple = Colors.deepPurple;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 20),
        // Header Icon
        Center(
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: purple.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(Icons.psychology, size: 64, color: purple),
          ),
        ),
        const SizedBox(height: 40),

        // App name input
        _buildTextField(
          controller: _appNameController,
          label: l10n?.focusSelectApp ?? 'Focus Activity',
          hint: 'What are you working on?',
          icon: Icons.work_outline,
          isDark: isDark,
        ),
        const SizedBox(height: 20),

        // Duration
        Text(
          l10n?.focusDuration ?? 'Duration',
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white70 : Colors.black54,
          ),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
                child: _buildTimeCard('Hours', _hours, 24,
                    (v) => setState(() => _hours = v), isDark)),
            const SizedBox(width: 16),
            Expanded(
                child: _buildTimeCard('Minutes', _minutes, 59,
                    (v) => setState(() => _minutes = v), isDark)),
          ],
        ),
        const SizedBox(height: 20),

        // Password
        _buildTextField(
          controller: _passwordController,
          label: l10n?.focusPassword ?? 'Lock Password',
          hint: 'Set a password to unlock',
          icon: Icons.lock_outline,
          isObscure: true,
          isDark: isDark,
        ),
        const SizedBox(height: 40),

        // Start button
        ScaleTransition(
          scale: _pulseAnimation,
          child: ElevatedButton(
            onPressed: _startFocus,
            style: ElevatedButton.styleFrom(
              backgroundColor: purple,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: 20),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20)),
              elevation: 8,
              shadowColor: purple.withOpacity(0.4),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.rocket_launch),
                const SizedBox(width: 12),
                Text(
                  l10n?.focusStart ?? "Start Focus Mode",
                  style: const TextStyle(
                      fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ],
            ),
          ),
        ),

        const SizedBox(height: 20),
        Center(
            child: Text(
          'This will pin the app to prevent distractions.',
          style: TextStyle(
              color: isDark ? Colors.white38 : Colors.black38, fontSize: 12),
        ))
      ],
    );
  }

  Widget _buildActiveState(AppLocalizations? l10n, bool isDark) {
    final purple = Colors.deepPurple;
    return Column(
      children: [
        const SizedBox(height: 40),
        // Active Pulse
        ScaleTransition(
          scale: _pulseAnimation,
          child: Container(
            width: 260,
            height: 260,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                    color: purple.withOpacity(0.2),
                    blurRadius: 40,
                    spreadRadius: 10),
              ],
            ),
            child: Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 260,
                  height: 260,
                  child: CircularProgressIndicator(
                    value: _progress,
                    strokeWidth: 20,
                    strokeCap: StrokeCap.round,
                    backgroundColor: isDark ? Colors.white10 : Colors.black12,
                    valueColor: AlwaysStoppedAnimation<Color>(purple),
                  ),
                ),
                Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      _formatTime(_remainingSecs),
                      style: TextStyle(
                        fontSize: 48,
                        fontWeight: FontWeight.bold,
                        color: isDark ? Colors.white : Colors.black,
                        letterSpacing: 2,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      _focusAppName,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w500,
                        color: purple.shade200,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 60),

        // Cancel Input
        Text(
          l10n?.focusMessage ?? 'Stay focused!',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.w500,
            color: isDark ? Colors.white70 : Colors.black87,
          ),
        ),
        const SizedBox(height: 30),

        _buildTextField(
          controller: _cancelPasswordController,
          label: 'Unlock',
          hint: 'Password...',
          icon: Icons.key,
          isObscure: true,
          isDark: isDark,
          errorText: _cancelError,
        ),
        const SizedBox(height: 16),

        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: _cancelFocus,
            icon: const Icon(Icons.lock_open),
            label: Text(l10n?.focusCancel ?? 'Unlock & Cancel'),
            style: OutlinedButton.styleFrom(
              foregroundColor: Colors.red.shade300,
              side: BorderSide(color: Colors.red.shade300.withOpacity(0.5)),
              padding: const EdgeInsets.symmetric(vertical: 18),
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    bool isObscure = false,
    required bool isDark,
    String? errorText,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white70 : Colors.black54,
          ),
        ),
        const SizedBox(height: 8),
        TextField(
          controller: controller,
          obscureText: isObscure,
          style: TextStyle(color: isDark ? Colors.white : Colors.black),
          decoration: InputDecoration(
            prefixIcon:
                Icon(icon, color: isDark ? Colors.white38 : Colors.black38),
            hintText: hint,
            hintStyle:
                TextStyle(color: isDark ? Colors.white24 : Colors.black24),
            filled: true,
            fillColor: isDark
                ? Colors.white.withOpacity(0.05)
                : Colors.black.withOpacity(0.05),
            border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(16),
                borderSide: BorderSide.none),
            errorText: errorText,
          ),
        ),
      ],
    );
  }

  Widget _buildTimeCard(
      String label, int value, int max, Function(int) onChanged, bool isDark) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withOpacity(0.05) : Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: isDark ? Colors.white10 : Colors.black12),
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              IconButton(
                icon: const Icon(Icons.remove),
                color: isDark ? Colors.white54 : Colors.black54,
                onPressed: value > 0 ? () => onChanged(value - 1) : null,
              ),
              Text(
                value.toString().padLeft(2, '0'),
                style:
                    const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
              ),
              IconButton(
                icon: const Icon(Icons.add),
                color: isDark ? Colors.white54 : Colors.black54,
                onPressed: value < max ? () => onChanged(value + 1) : null,
              ),
            ],
          ),
          Text(label,
              style: TextStyle(
                  color: isDark ? Colors.white38 : Colors.black38,
                  fontSize: 12)),
        ],
      ),
    );
  }
}
