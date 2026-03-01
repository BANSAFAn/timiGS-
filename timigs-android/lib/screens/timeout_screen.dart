import 'dart:async';
import 'package:flutter/material.dart';
import '../l10n/app_localizations.dart';
import '../services/tracker_service.dart';

/// Time OUT screen for Android.
/// Provides break reminders with a visual timer.
/// Due to Android restrictions, cannot enforce app blocking.
class TimeoutScreen extends StatefulWidget {
  const TimeoutScreen({super.key});

  @override
  State<TimeoutScreen> createState() => _TimeoutScreenState();
}

class _TimeoutScreenState extends State<TimeoutScreen>
    with TickerProviderStateMixin {
  final TextEditingController _passwordController = TextEditingController();
  final TextEditingController _cancelPasswordController =
      TextEditingController();

  int _intervalMinutes = 45;
  int _breakMinutes = 10;
  bool _isActive = false;
  bool _isOnBreak = false;
  int _nextBreakIn = 0;
  int _breakRemaining = 0;
  String _password = '';
  String? _cancelError;
  Timer? _timer;
  late AnimationController _bounceController;

  @override
  void initState() {
    super.initState();
    _bounceController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
  }

  @override
  void dispose() {
    if (_isOnBreak) {
      TrackerService.instance.stopLockTask();
    }
    _timer?.cancel();
    _bounceController.dispose();
    _passwordController.dispose();
    _cancelPasswordController.dispose();
    super.dispose();
  }

  void _startTimeout() {
    if (_intervalMinutes <= 0 ||
        _breakMinutes <= 0 ||
        _passwordController.text.isEmpty) return;

    setState(() {
      _isActive = true;
      _isOnBreak = false;
      _nextBreakIn = _intervalMinutes * 60;
      _password = _passwordController.text;
      _passwordController.clear();
    });

    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!_isActive) {
        timer.cancel();
        return;
      }

      if (_isOnBreak) {
        if (_breakRemaining <= 0) {
          // Break over, back to work
          TrackerService.instance.stopLockTask(); // UNLOCK
          setState(() {
            _isOnBreak = false;
            _nextBreakIn = _intervalMinutes * 60;
          });
          _bounceController.stop();
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Break over! Back to work 💪')),
          );
        } else {
          setState(() => _breakRemaining--);
        }
      } else {
        if (_nextBreakIn <= 0) {
          // Time for a break!
          TrackerService.instance.startLockTask(); // LOCK
          setState(() {
            _isOnBreak = true;
            _breakRemaining = _breakMinutes * 60;
          });
          _bounceController.repeat(reverse: true);
        } else {
          setState(() => _nextBreakIn--);
        }
      }
    });
  }

  void _cancelTimeout() {
    if (_cancelPasswordController.text != _password) {
      setState(() => _cancelError = 'Wrong password');
      return;
    }
    _timer?.cancel();
    _bounceController.stop();
    TrackerService.instance.stopLockTask(); // UNLOCK
    setState(() {
      _isActive = false;
      _isOnBreak = false;
      _cancelError = null;
      _cancelPasswordController.clear();
    });
  }

  String _formatTime(int totalSeconds) {
    final m = totalSeconds ~/ 60;
    final s = totalSeconds % 60;
    return '${m.toString().padLeft(2, '0')}:${s.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final l10n = AppLocalizations.of(context);
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Text(l10n?.timeoutTitle ?? 'Time OUT'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: _isOnBreak
          ? _buildBreakOverlay(l10n, isDark)
          : SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: _isActive
                  ? _buildWorkingState(l10n, isDark)
                  : _buildSetupState(l10n, isDark),
            ),
    );
  }

  Widget _buildSetupState(AppLocalizations? l10n, bool isDark) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        _buildSection(
          icon: '💼',
          label: l10n?.timeoutWorkInterval ?? 'Work Interval (minutes)',
          child: _buildSlider(_intervalMinutes, 5, 240,
              (v) => setState(() => _intervalMinutes = v.round())),
        ),
        const SizedBox(height: 20),
        _buildSection(
          icon: '☕',
          label: l10n?.timeoutBreakDuration ?? 'Break Duration (minutes)',
          child: _buildSlider(_breakMinutes, 1, 60,
              (v) => setState(() => _breakMinutes = v.round())),
        ),
        const SizedBox(height: 20),
        _buildSection(
          icon: '🔒',
          label: l10n?.timeoutPassword ?? 'Lock Password',
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
                  ? Colors.white.withOpacity(0.05)
                  : Colors.black.withOpacity(0.05),
              border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(14),
                  borderSide: BorderSide.none),
            ),
          ),
        ),
        const SizedBox(height: 30),
        ElevatedButton(
          onPressed: _startTimeout,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.teal,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            elevation: 4,
          ),
          child: Text(
            '☕ ${l10n?.timeoutStart ?? "Activate Time OUT"}',
            style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
          ),
        ),
        const SizedBox(height: 20),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.teal.withOpacity(0.1),
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: Colors.teal.withOpacity(0.3)),
          ),
          child: Row(
            children: [
              const Text('ℹ️', style: TextStyle(fontSize: 20)),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'On Android, Time OUT provides visual break reminders. Apps cannot be blocked.',
                  style: TextStyle(
                    color: isDark ? Colors.teal.shade200 : Colors.teal.shade800,
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

  Widget _buildWorkingState(AppLocalizations? l10n, bool isDark) {
    return Column(
      children: [
        // Status badge
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 10),
          decoration: BoxDecoration(
            color: Colors.teal.withOpacity(0.15),
            borderRadius: BorderRadius.circular(24),
            border: Border.all(color: Colors.teal.withOpacity(0.3)),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 8,
                height: 8,
                decoration:
                    BoxDecoration(color: Colors.teal, shape: BoxShape.circle),
              ),
              const SizedBox(width: 8),
              Text(
                l10n?.timeoutWorking ?? 'Working',
                style:
                    TextStyle(color: Colors.teal, fontWeight: FontWeight.w600),
              ),
            ],
          ),
        ),
        const SizedBox(height: 40),

        // Next break countdown
        Text(
          l10n?.timeoutNextBreak ?? 'Next break in',
          style: TextStyle(
              color: isDark ? Colors.white54 : Colors.black54, fontSize: 14),
        ),
        const SizedBox(height: 8),
        Text(
          _formatTime(_nextBreakIn),
          style: TextStyle(
            fontSize: 56,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white : Colors.black,
            letterSpacing: 2,
          ),
        ),
        const SizedBox(height: 24),

        // Schedule info
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            _buildScheduleChip('💼', 'Work: ${_intervalMinutes}m'),
            const SizedBox(width: 16),
            _buildScheduleChip('☕', 'Break: ${_breakMinutes}m'),
          ],
        ),
        const SizedBox(height: 40),

        // Cancel
        TextField(
          controller: _cancelPasswordController,
          obscureText: true,
          style: TextStyle(color: isDark ? Colors.white : Colors.black),
          decoration: InputDecoration(
            hintText: 'Password to cancel...',
            hintStyle:
                TextStyle(color: isDark ? Colors.white38 : Colors.black38),
            filled: true,
            fillColor: isDark
                ? Colors.white.withOpacity(0.05)
                : Colors.black.withOpacity(0.05),
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
          onPressed: _cancelTimeout,
          icon: const Text('✋'),
          label: Text(l10n?.timeoutCancel ?? 'Cancel Time OUT'),
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

  Widget _buildBreakOverlay(AppLocalizations? l10n, bool isDark) {
    final progress = _breakMinutes * 60 > 0
        ? (_breakMinutes * 60 - _breakRemaining) / (_breakMinutes * 60)
        : 0.0;

    return Container(
      width: double.infinity,
      height: double.infinity,
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.amber.shade900.withOpacity(0.3),
            Colors.black.withOpacity(0.95),
          ],
        ),
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          AnimatedBuilder(
            animation: _bounceController,
            builder: (context, child) {
              return Transform.translate(
                offset: Offset(0, -10 * _bounceController.value),
                child: child,
              );
            },
            child: const Text('☕', style: TextStyle(fontSize: 80)),
          ),
          const SizedBox(height: 24),
          Text(
            l10n?.timeoutBreakTitle ?? 'Time to relax!',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
              color: Colors.amber.shade300,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            l10n?.timeoutBreakMessage ??
                'Take a break, drink some tea, stretch!',
            style: TextStyle(color: Colors.white70, fontSize: 16),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 40),

          SizedBox(
            width: 180,
            height: 180,
            child: Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 180,
                  height: 180,
                  child: CircularProgressIndicator(
                    value: progress,
                    strokeWidth: 10,
                    backgroundColor: Colors.white12,
                    valueColor:
                        AlwaysStoppedAnimation<Color>(Colors.amber.shade400),
                  ),
                ),
                Text(
                  _formatTime(_breakRemaining),
                  style: const TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 40),

          // Cancel
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 40),
            child: TextField(
              controller: _cancelPasswordController,
              obscureText: true,
              style: const TextStyle(color: Colors.white),
              textAlign: TextAlign.center,
              decoration: InputDecoration(
                hintText: 'Password to cancel...',
                hintStyle: TextStyle(color: Colors.white38),
                filled: true,
                fillColor: Colors.white.withOpacity(0.1),
                border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: BorderSide.none),
              ),
            ),
          ),
          const SizedBox(height: 12),
          if (_cancelError != null)
            Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: Text(_cancelError!,
                  style: const TextStyle(color: Colors.red)),
            ),
          TextButton(
            onPressed: _cancelTimeout,
            child: Text(
              l10n?.timeoutCancel ?? 'Cancel',
              style: TextStyle(color: Colors.red.shade300),
            ),
          ),
        ],
      ),
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

  Widget _buildSlider(int value, int min, int max, Function(double) onChanged) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      children: [
        Text(
          '$value min',
          style: TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: isDark ? Colors.white : Colors.black,
          ),
        ),
        Slider(
          value: value.toDouble(),
          min: min.toDouble(),
          max: max.toDouble(),
          divisions: max - min,
          activeColor: Colors.teal,
          onChanged: onChanged,
        ),
      ],
    );
  }

  Widget _buildScheduleChip(String icon, String label) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
      decoration: BoxDecoration(
        color: isDark
            ? Colors.white.withOpacity(0.05)
            : Colors.black.withOpacity(0.05),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          Text(icon),
          const SizedBox(width: 6),
          Text(label,
              style: TextStyle(
                  color: isDark ? Colors.white70 : Colors.black54,
                  fontSize: 13)),
        ],
      ),
    );
  }
}
