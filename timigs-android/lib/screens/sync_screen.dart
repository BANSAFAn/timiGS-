import 'dart:async';
import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:share_plus/share_plus.dart';
import 'package:file_picker/file_picker.dart';
import 'package:timigs_android/services/sync_service.dart';
import 'package:timigs_android/services/database_service.dart';
import 'package:path_provider/path_provider.dart';

class SyncScreen extends StatefulWidget {
  const SyncScreen({super.key});

  @override
  State<SyncScreen> createState() => _SyncScreenState();
}

class _SyncScreenState extends State<SyncScreen> {
  final SyncService _syncService = SyncService();
  final TextEditingController _enteredCodeController = TextEditingController();
  final TextEditingController _apiEndpointController = TextEditingController();
  final TextEditingController _apiTokenController = TextEditingController();

  String? _pairingCode;
  int _expiresIn = 0;
  Timer? _countdownTimer;
  bool _isGeneratingCode = false;
  bool _isAcceptingCode = false;
  bool _useP2P = false;
  bool _syncEnabled = true;
  bool _autoSync = true;
  StreamSubscription<String>? _logSubscription;
  final List<String> _logs = [];

  @override
  void initState() {
    super.initState();
    _initializeSync();
    _loadConfig();
  }

  Future<void> _initializeSync() async {
    await _syncService.initialize();
    setState(() {
      _useP2P = _syncService.useP2P;
      _syncEnabled = _syncService.syncEnabled;
      _apiEndpointController.text = _syncService.apiEndpoint;
    });

    // Listen to logs
    _logSubscription = _syncService.logs.listen((log) {
      if (mounted) {
        setState(() {
          _logs.add(log);
          if (_logs.length > 50) _logs.removeAt(0);
        });
      }
    });
  }

  Future<void> _loadConfig() async {
    // Load saved API token if any
    // This is handled by sync service initialization
  }

  @override
  void dispose() {
    _enteredCodeController.dispose();
    _apiEndpointController.dispose();
    _apiTokenController.dispose();
    _countdownTimer?.cancel();
    _logSubscription?.cancel();
    super.dispose();
  }

  Future<void> _generatePairingCode() async {
    setState(() => _isGeneratingCode = true);
    try {
      final result = await _syncService.createPairing();
      setState(() {
        _pairingCode = result['code'];
        _expiresIn = 300;
      });

      // Start countdown
      _countdownTimer?.cancel();
      _countdownTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
        setState(() {
          _expiresIn--;
        });
        if (_expiresIn <= 0) {
          timer.cancel();
          setState(() => _pairingCode = null);
        }
      });
    } catch (e) {
      _showError('Failed to generate code: $e');
    } finally {
      setState(() => _isGeneratingCode = false);
    }
  }

  Future<void> _acceptPairingCode() async {
    final code = _enteredCodeController.text.trim().toUpperCase();
    if (code.isEmpty) {
      _showError('Please enter a code');
      return;
    }

    setState(() => _isAcceptingCode = true);
    try {
      // In a real implementation, this would connect to the remote device
      // For now, simulate successful pairing
      final success = await _syncService.acceptPairing(
        code,
        'remote-device-${DateTime.now().millisecondsSinceEpoch}',
        'Remote Device',
        DeviceType.desktop,
      );

      if (success && mounted) {
        _enteredCodeController.clear();
        _showSuccess('Successfully paired!');
      } else if (mounted) {
        _showError('Failed to pair. Check the code and try again.');
      }
    } catch (e) {
      _showError('Pairing failed: $e');
    } finally {
      setState(() => _isAcceptingCode = false);
    }
  }

  Future<void> _removePairedDevice(SyncDevice device) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Remove Device'),
        content: Text('Are you sure you want to remove ${device.name}?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Remove', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      await _syncService.removePairedDevice(device.id);
      setState(() {});
      _showSuccess('Device removed');
    }
  }

  Future<void> _syncNow() async {
    try {
      await _syncService.syncNow();
      _showSuccess('Sync completed!');
    } catch (e) {
      _showError('Sync failed: $e');
    }
  }

  Future<void> _saveAPIConfig() async {
    final endpoint = _apiEndpointController.text.trim();
    final token = _apiTokenController.text.trim();

    if (endpoint.isEmpty) {
      _showError('Please enter an API endpoint');
      return;
    }

    await _syncService.configureAPI(endpoint, token);
    _showSuccess('API configuration saved');
  }

  Future<void> _toggleP2P(bool value) async {
    setState(() => _useP2P = value);
    await _syncService.setP2PMode(value);
  }

  Future<void> _exportBackup() async {
    try {
      final backup = await _syncService.exportBackup();
      final json = JsonEncoder.withIndent('  ').convert(backup);
      
      final tempDir = await getTemporaryDirectory();
      final timestamp = DateTime.now().toIso8601String().replaceAll(':', '-');
      final file = File('${tempDir.path}/timiGS-backup-$timestamp.json');
      await file.writeAsString(json);

      await Share.shareXFiles([XFile(file.path)]);
      _showSuccess('Backup exported and shared');
    } catch (e) {
      _showError('Export failed: $e');
    }
  }

  Future<void> _importBackup() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['json'],
      );

      if (result == null || result.files.isEmpty) return;

      final file = File(result.files.first.path!);
      final content = await file.readAsString();
      final backup = json.decode(content) as Map<String, dynamic>;

      await _syncService.receiveSyncPayload(SyncPayload(
        id: 'import-${DateTime.now().millisecondsSinceEpoch}',
        timestamp: DateTime.now().millisecondsSinceEpoch,
        type: SyncType.fullBackup,
        data: backup,
        deviceId: _syncService.deviceId,
        deviceType: _syncService.deviceType,
      ));

      _showSuccess('Backup imported successfully!');
    } catch (e) {
      _showError('Import failed: $e');
    }
  }

  Future<void> _clearSyncData() async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear Sync Data'),
        content: const Text(
          'This will remove all paired devices and pending syncs. Are you sure?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Clear', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (confirm == true && mounted) {
      await _syncService.clearSyncData();
      setState(() {});
      _showSuccess('Sync data cleared');
    }
  }

  void _showError(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
        duration: const Duration(seconds: 3),
      ),
    );
  }

  void _showSuccess(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.green,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  String _formatLastSync(int? timestamp) {
    if (timestamp == null) return 'Never synced';
    
    final diff = DateTime.now().millisecondsSinceEpoch - timestamp;
    final minutes = diff ~/ 60000;
    final hours = diff ~/ 3600000;
    final days = diff ~/ 86400000;

    if (minutes < 60) return '$minutes min ago';
    if (hours < 24) return '$hours hours ago';
    return '$days days ago';
  }

  String _formatTime(int timestamp) {
    final date = DateTime.fromMillisecondsSinceEpoch(timestamp);
    return '${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isDark = theme.brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Sync'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _syncNow,
            tooltip: 'Sync Now',
          ),
        ],
      ),
      body: StreamBuilder<ConnectionStatus>(
        stream: _syncService.statusStream,
        initialData: _syncService.connectionStatus,
        builder: (context, snapshot) {
          final status = snapshot.data ?? ConnectionStatus.disconnected;
          
          return ListView(
            padding: const EdgeInsets.all(16),
            children: [
              // Device Info Card
              _buildDeviceInfoCard(theme, isDark, status),
              
              const SizedBox(height: 16),

              // Pairing Section
              _buildPairingSection(theme, isDark),
              
              const SizedBox(height: 16),

              // Sync Methods
              _buildSyncMethodsCard(theme, isDark),
              
              const SizedBox(height: 16),

              // Sync Queue
              if (_syncService.pendingCount > 0)
                _buildSyncQueueCard(theme, isDark),
              
              const SizedBox(height: 16),

              // Export/Import
              _buildExportImportCard(theme, isDark),
              
              const SizedBox(height: 16),

              // Sync Settings
              _buildSyncSettingsCard(theme, isDark),
              
              const SizedBox(height: 16),

              // Logs
              if (_logs.isNotEmpty)
                _buildLogsCard(theme, isDark),
            ],
          );
        },
      ),
    );
  }

  Widget _buildDeviceInfoCard(
    ThemeData theme,
    bool isDark,
    ConnectionStatus status,
  ) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.devices, size: 48, color: Colors.blue),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _syncService.deviceName,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _syncService.deviceId,
                        style: theme.textTheme.bodySmall?.copyWith(
                          fontFamily: 'monospace',
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                      const SizedBox(height: 8),
                      _buildStatusChip(status),
                    ],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusChip(ConnectionStatus status) {
    Color color;
    String label;

    switch (status) {
      case ConnectionStatus.connected:
        color = Colors.green;
        label = 'Connected';
        break;
      case ConnectionStatus.connecting:
        color = Colors.orange;
        label = 'Connecting';
        break;
      case ConnectionStatus.error:
        color = Colors.red;
        label = 'Error';
        break;
      case ConnectionStatus.disconnected:
        color = Colors.grey;
        label = 'Disconnected';
        break;
    }

    return Chip(
      avatar: CircleAvatar(
        backgroundColor: color,
        radius: 4,
      ),
      label: Text(label, style: const TextStyle(fontSize: 12)),
      backgroundColor: color.withOpacity(0.1),
      padding: EdgeInsets.zero,
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
    );
  }

  Widget _buildPairingSection(ThemeData theme, bool isDark) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Pair Devices',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),

            if (!_syncService.isPaired) ...[
              // Generate Code
              _buildGenerateCodeSection(theme),
              
              const Divider(height: 32),

              // Enter Code
              _buildEnterCodeSection(theme),
            ] else ...[
              // Paired Devices
              _buildPairedDevicesList(theme),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildGenerateCodeSection(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Generate Pairing Code',
          style: theme.textTheme.titleMedium,
        ),
        const SizedBox(height: 8),
        Text(
          'Show this code on your desktop to pair devices',
          style: theme.textTheme.bodySmall,
        ),
        const SizedBox(height: 16),

        if (_pairingCode != null) ...[
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primaryContainer,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              children: [
                Text(
                  _pairingCode!,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                    fontFamily: 'monospace',
                    letterSpacing: 4,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Expires in: $_expiresIn s',
                  style: theme.textTheme.bodySmall,
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
        ],

        ElevatedButton.icon(
          onPressed: _isGeneratingCode ? null : _generatePairingCode,
          icon: _isGeneratingCode
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.qr_code),
          label: Text(_isGeneratingCode ? 'Generating...' : 'Generate Code'),
        ),
      ],
    );
  }

  Widget _buildEnterCodeSection(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Enter Pairing Code',
          style: theme.textTheme.titleMedium,
        ),
        const SizedBox(height: 8),
        Text(
          'Enter the code shown on your desktop',
          style: theme.textTheme.bodySmall,
        ),
        const SizedBox(height: 16),

        TextField(
          controller: _enteredCodeController,
          decoration: const InputDecoration(
            labelText: '6-digit code',
            border: OutlineInputBorder(),
            prefixIcon: Icon(Icons.password),
          ),
          maxLength: 6,
          textCapitalization: TextCapitalization.characters,
          style: const TextStyle(
            fontFamily: 'monospace',
            letterSpacing: 4,
            fontSize: 18,
          ),
        ),
        const SizedBox(height: 16),

        ElevatedButton.icon(
          onPressed: _isAcceptingCode || _enteredCodeController.text.isEmpty
              ? null
              : _acceptPairingCode,
          icon: _isAcceptingCode
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.link),
          label: Text(_isAcceptingCode ? 'Connecting...' : 'Connect'),
        ),
      ],
    );
  }

  Widget _buildPairedDevicesList(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Paired Devices',
          style: theme.textTheme.titleMedium,
        ),
        const SizedBox(height: 16),

        ..._syncService.pairedDevices.map((device) => ListTile(
          leading: Icon(
            device.type == DeviceType.desktop ? Icons.desktop_windows : Icons.phone_android,
            size: 32,
          ),
          title: Text(device.name),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                device.id,
                style: theme.textTheme.bodySmall?.copyWith(
                  fontFamily: 'monospace',
                ),
              ),
              Text(
                _formatLastSync(device.lastSync),
                style: theme.textTheme.bodySmall,
              ),
            ],
          ),
          trailing: IconButton(
            icon: const Icon(Icons.delete_outline),
            onPressed: () => _removePairedDevice(device),
          ),
        )),
      ],
    );
  }

  Widget _buildSyncMethodsCard(ThemeData theme, bool isDark) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Sync Methods',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),

            // P2P Toggle
            SwitchListTile(
              title: const Text('P2P Mode'),
              subtitle: const Text('Direct device-to-device sync via WebRTC'),
              value: _useP2P,
              onChanged: _toggleP2P,
              secondary: const Icon(Icons.usb),
            ),

            const Divider(),

            // API Configuration
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text('API (Store-and-Forward)'),
                const SizedBox(height: 8),
                TextField(
                  controller: _apiEndpointController,
                  decoration: const InputDecoration(
                    labelText: 'API Endpoint',
                    hintText: 'https://your-api.com',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.cloud),
                  ),
                  keyboardType: TextInputType.url,
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _apiTokenController,
                  decoration: const InputDecoration(
                    labelText: 'API Token (optional)',
                    border: OutlineInputBorder(),
                    prefixIcon: Icon(Icons.vpn_key),
                  ),
                  obscureText: true,
                ),
                const SizedBox(height: 8),
                ElevatedButton(
                  onPressed: _saveAPIConfig,
                  child: const Text('Save API Configuration'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSyncQueueCard(ThemeData theme, bool isDark) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(
                  'Pending Syncs',
                  style: theme.textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                Chip(
                  label: Text('${_syncService.pendingCount}'),
                  backgroundColor: theme.colorScheme.primary,
                  labelStyle: const TextStyle(color: Colors.white),
                ),
              ],
            ),
            const SizedBox(height: 16),

            ..._syncService.pendingSyncs
                .where((s) => s.status == 'pending')
                .take(5)
                .map((sync) => ListTile(
                  dense: true,
                  title: Text(sync.payload.type.name),
                  subtitle: Text(_formatTime(sync.createdAt)),
                  trailing: Chip(
                    label: Text(
                      sync.status,
                      style: const TextStyle(fontSize: 10, color: Colors.white),
                    ),
                    backgroundColor: _getStatusColor(sync.status),
                    padding: EdgeInsets.zero,
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                )),

            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _syncNow,
                icon: const Icon(Icons.sync),
                label: const Text('Sync Now'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.orange;
      case 'sent':
        return Colors.blue;
      case 'confirmed':
        return Colors.green;
      default:
        return Colors.grey;
    }
  }

  Widget _buildExportImportCard(ThemeData theme, bool isDark) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Backup & Restore',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),

            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _exportBackup,
                    icon: const Icon(Icons.file_download),
                    label: const Text('Export'),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _importBackup,
                    icon: const Icon(Icons.file_upload),
                    label: const Text('Import'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSyncSettingsCard(ThemeData theme, bool isDark) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Sync Settings',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),

            SwitchListTile(
              title: const Text('Enable Sync'),
              subtitle: const Text('Allow data synchronization'),
              value: _syncEnabled,
              onChanged: (value) {
                setState(() => _syncEnabled = value);
              },
              secondary: const Icon(Icons.sync),
            ),

            SwitchListTile(
              title: const Text('Auto Sync'),
              subtitle: const Text('Automatically sync every 5 minutes'),
              value: _autoSync,
              onChanged: (value) {
                setState(() => _autoSync = value);
              },
              secondary: const Icon(Icons.autorenew),
            ),

            const Divider(),

            ListTile(
              title: const Text(
                'Clear Sync Data',
                style: TextStyle(color: Colors.red),
              ),
              subtitle: const Text('Remove all paired devices and pending syncs'),
              leading: const Icon(Icons.delete_forever, color: Colors.red),
              onTap: _clearSyncData,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLogsCard(ThemeData theme, bool isDark) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Sync Logs',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            Container(
              constraints: const BoxConstraints(maxHeight: 200),
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isDark ? Colors.black26 : Colors.grey[200],
                borderRadius: BorderRadius.circular(4),
              ),
              child: ListView.builder(
                shrinkWrap: true,
                itemCount: _logs.length,
                itemBuilder: (context, index) => Text(
                  _logs[index],
                  style: TextStyle(
                    fontFamily: 'monospace',
                    fontSize: 11,
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
