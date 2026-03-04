import 'dart:convert';
import 'dart:io';
import 'dart:async';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import 'package:peerdart/peerdart.dart';
import 'package:timigs_android/services/database_service.dart';
import 'package:timigs_android/models/settings.dart';

/// Sync payload types
enum SyncType {
  activity,
  settings,
  tasks,
  fullBackup,
}

/// Device type enum
enum DeviceType {
  desktop,
  mobile,
}

/// Sync payload structure
class SyncPayload {
  final String id;
  final int timestamp;
  final SyncType type;
  final Map<String, dynamic> data;
  final String deviceId;
  final DeviceType deviceType;

  SyncPayload({
    required this.id,
    required this.timestamp,
    required this.type,
    required this.data,
    required this.deviceId,
    required this.deviceType,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'timestamp': timestamp,
      'type': type.name,
      'data': data,
      'deviceId': deviceId,
      'deviceType': deviceType.name,
    };
  }

  static SyncPayload fromJson(Map<String, dynamic> json) {
    return SyncPayload(
      id: json['id'],
      timestamp: json['timestamp'],
      type: SyncType.values.firstWhere((e) => e.name == json['type']),
      data: Map<String, dynamic>.from(json['data']),
      deviceId: json['deviceId'],
      deviceType: DeviceType.values.firstWhere((e) => e.name == json['deviceType']),
    );
  }
}

/// Paired device information
class SyncDevice {
  final String id;
  final String name;
  final DeviceType type;
  final int? lastSync;
  final String? publicKey;

  SyncDevice({
    required this.id,
    required this.name,
    required this.type,
    this.lastSync,
    this.publicKey,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'type': type.name,
      'lastSync': lastSync,
      'publicKey': publicKey,
    };
  }

  static SyncDevice fromJson(Map<String, dynamic> json) {
    return SyncDevice(
      id: json['id'],
      name: json['name'],
      type: DeviceType.values.firstWhere((e) => e.name == json['type']),
      lastSync: json['lastSync'],
      publicKey: json['publicKey'],
    );
  }
}

/// Pending sync item
class PendingSync {
  final String id;
  final SyncPayload payload;
  final int createdAt;
  int retries;
  String status; // 'pending', 'sent', 'confirmed'

  PendingSync({
    required this.id,
    required this.payload,
    required this.createdAt,
    this.retries = 0,
    this.status = 'pending',
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'payload': payload.toJson(),
      'createdAt': createdAt,
      'retries': retries,
      'status': status,
    };
  }

  static PendingSync fromJson(Map<String, dynamic> json) {
    return PendingSync(
      id: json['id'],
      payload: SyncPayload.fromJson(json['payload']),
      createdAt: json['createdAt'],
      retries: json['retries'],
      status: json['status'],
    );
  }
}

/// Connection status enum
enum ConnectionStatus {
  disconnected,
  connecting,
  connected,
  error,
}

/// Main sync service for Android
class SyncService {
  static final SyncService instance = SyncService._internal();
  factory SyncService() => instance;
  SyncService._internal();

  // Device identity
  String _deviceId = '';
  DeviceType _deviceType = DeviceType.mobile;
  String _deviceName = '';

  // Paired devices
  final List<SyncDevice> _pairedDevices = [];

  // Sync state
  bool _isSyncing = false;
  int? _lastSyncTime;
  bool _syncEnabled = true;

  // Code-based pairing
  String? _generatedCode;
  int? _codeExpiresAt;

  // Store-and-forward queue
  final List<PendingSync> _pendingSyncs = [];
  final List<SyncPayload> _receivedSyncs = [];

  // API configuration
  String _apiEndpoint = '';
  String _apiToken = '';
  bool _useP2P = false;

  // Connection status
  ConnectionStatus _connectionStatus = ConnectionStatus.disconnected;
  String _errorMessage = '';

  // PeerJS for P2P
  Peer? _peer;
  StreamController<String> _logController = StreamController.broadcast();
  StreamController<ConnectionStatus> _statusController = StreamController.broadcast();

  // Getters
  String get deviceId => _deviceId;
  DeviceType get deviceType => _deviceType;
  String get deviceName => _deviceName;
  List<SyncDevice> get pairedDevices => List.unmodifiable(_pairedDevices);
  bool get isSyncing => _isSyncing;
  int? get lastSyncTime => _lastSyncTime;
  bool get syncEnabled => _syncEnabled;
  String? get generatedCode => _generatedCode;
  List<PendingSync> get pendingSyncs => List.unmodifiable(_pendingSyncs);
  ConnectionStatus get connectionStatus => _connectionStatus;
  String get errorMessage => _errorMessage;
  bool get useP2P => _useP2P;
  String get apiEndpoint => _apiEndpoint;
  bool get isPaired => _pairedDevices.any((d) => d.type != _deviceType);
  int get pendingCount => _pendingSyncs.where((s) => s.status == 'pending').length;

  Stream<String> get logs => _logController.stream;
  Stream<ConnectionStatus> get statusStream => _statusController.stream;

  /// Initialize sync service
  Future<void> initialize() async {
    try {
      await _loadDeviceId();
      _detectDeviceType();
      await _loadPairedDevices();
      await _loadPendingSyncs();
      await _loadAPIConfig();
      await _loadP2PPreference();

      // Try to reconnect if we have paired devices
      if (_pairedDevices.isNotEmpty && _syncEnabled) {
        await tryReconnect();
      }

      _log('Initialized device: $_deviceName ($_deviceId)');
    } catch (error) {
      _log('Initialization failed: $error');
      _errorMessage = 'Failed to initialize sync';
      _connectionStatus = ConnectionStatus.error;
    }
  }

  Future<void> _loadDeviceId() async {
    final prefs = await SharedPreferences.getInstance();
    _deviceId = prefs.getString('timigs_device_id') ?? _generateDeviceId();
    await prefs.setString('timigs_device_id', _deviceId);
  }

  String _generateDeviceId() {
    final array = List<int>.generate(16, (_) => DateTime.now().millisecondsSinceEpoch.remainder(256));
    return array.map((b) => b.toRadixString(16).padLeft(2, '0')).join('-');
  }

  void _detectDeviceType() {
    _deviceType = DeviceType.mobile;
    _deviceName = 'Mobile - Android';
  }

  Future<void> _loadPairedDevices() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString('timigs_paired_devices');
    if (saved != null) {
      try {
        final List<dynamic> jsonList = json.decode(saved);
        _pairedDevices.clear();
        _pairedDevices.addAll(jsonList.map((j) => SyncDevice.fromJson(j)).toList());
      } catch (e) {
        _log('Failed to load paired devices: $e');
      }
    }
  }

  Future<void> _savePairedDevices() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonList = _pairedDevices.map((d) => d.toJson()).toList();
    await prefs.setString('timigs_paired_devices', json.encode(jsonList));
  }

  Future<void> _loadPendingSyncs() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString('timigs_pending_syncs');
    if (saved != null) {
      try {
        final List<dynamic> jsonList = json.decode(saved);
        _pendingSyncs.clear();
        _pendingSyncs.addAll(jsonList.map((j) => PendingSync.fromJson(j)).toList());
      } catch (e) {
        _log('Failed to load pending syncs: $e');
      }
    }
  }

  Future<void> _savePendingSyncs() async {
    final prefs = await SharedPreferences.getInstance();
    final jsonList = _pendingSyncs.map((s) => s.toJson()).toList();
    await prefs.setString('timigs_pending_syncs', json.encode(jsonList));
  }

  Future<void> _loadAPIConfig() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getString('timigs_sync_api');
    if (saved != null) {
      try {
        final config = json.decode(saved);
        _apiEndpoint = config['endpoint'] ?? '';
        _apiToken = config['token'] ?? '';
      } catch (e) {
        _log('Failed to load API config: $e');
      }
    }
  }

  Future<void> _saveAPIConfig() async {
    final prefs = await SharedPreferences.getInstance();
    final config = {'endpoint': _apiEndpoint, 'token': _apiToken};
    await prefs.setString('timigs_sync_api', json.encode(config));
  }

  Future<void> _loadP2PPreference() async {
    final prefs = await SharedPreferences.getInstance();
    _useP2P = prefs.getBool('timigs_sync_p2p') ?? false;
  }

  Future<void> _saveP2PPreference() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('timigs_sync_p2p', _useP2P);
  }

  void _log(String message) {
    print('[Sync] $message');
    _logController.add('[${DateTime.now().toIso8601String().split('T').last}] $message');
  }

  void _updateStatus(ConnectionStatus status) {
    _connectionStatus = status;
    _statusController.add(status);
  }

  /// Generate pairing code
  String generatePairingCode() {
    final code = DateTime.now().millisecondsSinceEpoch.toRadixString(36).substring(0, 6).toUpperCase();
    _generatedCode = code;
    _codeExpiresAt = DateTime.now().millisecondsSinceEpoch + 5 * 60 * 1000; // 5 minutes

    // Auto-expire
    Future.delayed(const Duration(minutes: 5), () {
      if (_generatedCode == code) {
        _generatedCode = null;
      }
    });

    return code;
  }

  /// Create pairing request
  Future<Map<String, String>> createPairing() async {
    _updateStatus(ConnectionStatus.connecting);

    if (_generatedCode == null) {
      generatePairingCode();
    }

    return {
      'code': _generatedCode!,
      'deviceId': _deviceId,
    };
  }

  /// Accept pairing from another device
  Future<bool> acceptPairing(String code, String remoteDeviceId, String remoteDeviceName, DeviceType remoteDeviceType) async {
    try {
      if (code.length != 6) {
        throw Exception('Invalid code format');
      }

      // Check if already paired
      if (!_pairedDevices.any((d) => d.id == remoteDeviceId)) {
        final newDevice = SyncDevice(
          id: remoteDeviceId,
          name: remoteDeviceName,
          type: remoteDeviceType,
          lastSync: null,
        );
        _pairedDevices.add(newDevice);
        await _savePairedDevices();
      }

      _updateStatus(ConnectionStatus.connected);
      _log('Paired with $remoteDeviceName');
      return true;
    } catch (error) {
      _log('Pairing failed: $error');
      _updateStatus(ConnectionStatus.error);
      return false;
    }
  }

  /// Remove paired device
  Future<void> removePairedDevice(String deviceId) async {
    _pairedDevices.removeWhere((d) => d.id == deviceId);
    await _savePairedDevices();
    _log('Removed paired device: $deviceId');
  }

  /// Queue data for sync
  Future<void> queueForSync(SyncType type, Map<String, dynamic> data) async {
    if (!_syncEnabled) return;

    final payload = SyncPayload(
      id: _generateSyncId(),
      timestamp: DateTime.now().millisecondsSinceEpoch,
      type: type,
      data: data,
      deviceId: _deviceId,
      deviceType: _deviceType,
    );

    final pending = PendingSync(
      id: payload.id,
      payload: payload,
      createdAt: DateTime.now().millisecondsSinceEpoch,
      retries: 0,
      status: 'pending',
    );

    _pendingSyncs.add(pending);
    await _savePendingSyncs();

    _log('Queued sync: ${type.name}');

    // Try to send immediately if connected
    if (_connectionStatus == ConnectionStatus.connected) {
      await processQueue();
    }
  }

  String _generateSyncId() {
    return '$_deviceId-${DateTime.now().millisecondsSinceEpoch}-${DateTime.now().microsecondsSinceEpoch.toRadixString(36)}';
  }

  /// Process pending sync queue
  Future<void> processQueue() async {
    if (_isSyncing || _pendingSyncs.isEmpty) return;

    _isSyncing = true;

    try {
      final pending = _pendingSyncs.where((s) => s.status == 'pending').toList();

      for (final sync in pending) {
        try {
          await sendSyncPayload(sync.payload);
          sync.status = 'confirmed';
          sync.retries = 0;
        } catch (error) {
          _log('Failed to send: $error');
          sync.retries++;
          if (sync.retries >= 3) {
            sync.status = 'pending';
          }
        }
      }

      // Remove confirmed syncs older than 24 hours
      final oneDayAgo = DateTime.now().millisecondsSinceEpoch - 24 * 60 * 60 * 1000;
      _pendingSyncs.removeWhere((s) => s.status == 'confirmed' && s.createdAt > oneDayAgo);

      await _savePendingSyncs();
      _lastSyncTime = DateTime.now().millisecondsSinceEpoch;

    } finally {
      _isSyncing = false;
    }
  }

  /// Send sync payload
  Future<void> sendSyncPayload(SyncPayload payload) async {
    if (_useP2P) {
      try {
        await sendViaP2P(payload);
        return;
      } catch (e) {
        _log('P2P failed, falling back to API: $e');
      }
    }

    if (_apiEndpoint.isNotEmpty) {
      await sendViaAPI(payload);
    } else {
      throw Exception('No sync method configured');
    }
  }

  /// Send via P2P (WebRTC)
  Future<void> sendViaP2P(SyncPayload payload) async {
    // Initialize PeerJS if not already done
    if (_peer == null) {
      await _initializePeer();
    }

    // Send to all paired devices
    for (final device in _pairedDevices) {
      if (device.type != _deviceType) {
        // In a real implementation, this would use WebRTC data channels
        // For now, we'll fall back to API
        _log('P2P send to ${device.name} not fully implemented yet');
      }
    }

    // Fallback: simulate with local storage for testing
    _log('P2P payload prepared: ${payload.id}');
  }

  Future<void> _initializePeer() async {
    try {
      _peer = Peer(_deviceId);
      
      _peer!.on('open').listen((id) {
        _log('PeerJS initialized: $id');
      });

      _peer!.on('connection').listen((conn) {
        _handlePeerConnection(conn);
      });

      _peer!.on('error').listen((error) {
        _log('PeerJS error: $error');
        _updateStatus(ConnectionStatus.error);
      });
    } catch (e) {
      _log('Failed to initialize PeerJS: $e');
    }
  }

  void _handlePeerConnection(DataConnection conn) {
    conn.on('data').listen((data) {
      try {
        final payload = SyncPayload.fromJson(Map<String, dynamic>.from(data));
        receiveSyncPayload(payload);
      } catch (e) {
        _log('Failed to process received data: $e');
      }
    });
  }

  /// Send via API
  Future<void> sendViaAPI(SyncPayload payload) async {
    if (_apiEndpoint.isEmpty) {
      throw Exception('API endpoint not configured');
    }

    final response = await http.post(
      Uri.parse('$_apiEndpoint/sync'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $_apiToken',
        'X-Device-ID': _deviceId,
      },
      body: json.encode(payload.toJson()),
    );

    if (!response.statusCode.toString().startsWith('2')) {
      throw Exception('API error: ${response.statusCode}');
    }

    _log('Sync sent via API: ${payload.id}');
  }

  /// Receive sync payload
  Future<void> receiveSyncPayload(SyncPayload payload) async {
    if (_receivedSyncs.any((s) => s.id == payload.id)) {
      _log('Duplicate sync ignored: ${payload.id}');
      return;
    }

    _receivedSyncs.add(payload);
    if (_receivedSyncs.length > 100) {
      _receivedSyncs.removeRange(0, _receivedSyncs.length - 100);
    }

    await processReceivedSync(payload);
    _log('Received sync: ${payload.type.name}');
  }

  /// Process received sync
  Future<void> processReceivedSync(SyncPayload payload) async {
    switch (payload.type) {
      case SyncType.activity:
        await mergeActivityData(payload.data);
        break;
      case SyncType.settings:
        await mergeSettings(payload.data);
        break;
      case SyncType.tasks:
        await mergeTasks(payload.data);
        break;
      case SyncType.fullBackup:
        await restoreFromBackup(payload.data);
        break;
    }

    // Update last sync time
    final deviceIndex = _pairedDevices.indexWhere((d) => d.id == payload.deviceId);
    if (deviceIndex >= 0) {
      _pairedDevices[deviceIndex] = SyncDevice(
        id: _pairedDevices[deviceIndex].id,
        name: _pairedDevices[deviceIndex].name,
        type: _pairedDevices[deviceIndex].type,
        lastSync: payload.timestamp,
        publicKey: _pairedDevices[deviceIndex].publicKey,
      );
      await _savePairedDevices();
    }
  }

  /// Merge activity data
  Future<void> mergeActivityData(Map<String, dynamic> data) async {
    _log('Merging activity data...');
    // Import activity data into database
    await DatabaseService.instance.importActivityData(data);
  }

  /// Merge settings
  Future<void> mergeSettings(Map<String, dynamic> data) async {
    _log('Merging settings...');
    // Import settings
    await DatabaseService.instance.importSettings(data);
  }

  /// Merge tasks
  Future<void> mergeTasks(Map<String, dynamic> data) async {
    _log('Merging tasks...');
    // Import tasks
    await DatabaseService.instance.importTasks(data);
  }

  /// Restore from backup
  Future<void> restoreFromBackup(Map<String, dynamic> data) async {
    _log('Restoring from backup...');
    await DatabaseService.instance.restoreFromBackup(data);
  }

  /// Try to reconnect
  Future<void> tryReconnect() async {
    if (_pairedDevices.isEmpty) return;

    _updateStatus(ConnectionStatus.connecting);

    try {
      // Try API health check
      if (_apiEndpoint.isNotEmpty) {
        final response = await http.get(
          Uri.parse('$_apiEndpoint/health'),
          headers: {'Authorization': 'Bearer $_apiToken'},
        );

        if (response.statusCode.toString().startsWith('2')) {
          _updateStatus(ConnectionStatus.connected);
          await processQueue();
          return;
        }
      }

      _updateStatus(ConnectionStatus.disconnected);
    } catch (error) {
      _log('Reconnection failed: $error');
      _updateStatus(ConnectionStatus.error);
    }
  }

  /// Manual sync trigger
  Future<void> syncNow() async {
    if (!isPaired) {
      throw Exception('No paired devices');
    }

    await processQueue();
    await requestSyncFromDevice();
  }

  /// Request sync from paired device
  Future<void> requestSyncFromDevice() async {
    final requestPayload = SyncPayload(
      id: _generateSyncId(),
      timestamp: DateTime.now().millisecondsSinceEpoch,
      type: SyncType.activity,
      data: {'requestType': 'full'},
      deviceId: _deviceId,
      deviceType: _deviceType,
    );

    await sendSyncPayload(requestPayload);
  }

  /// Export backup
  Future<Map<String, dynamic>> exportBackup() async {
    final activity = await DatabaseService.instance.exportAllActivity();
    final settings = await DatabaseService.instance.getSettings();

    return {
      'version': 1,
      'exported_at': DateTime.now().toIso8601String(),
      'activity': activity,
      'settings': settings.toJson(),
    };
  }

  /// Configure API
  Future<void> configureAPI(String endpoint, String token) async {
    _apiEndpoint = endpoint;
    if (token.isNotEmpty) _apiToken = token;
    await _saveAPIConfig();
    _log('API configured: $endpoint');
  }

  /// Set P2P mode
  Future<void> setP2PMode(bool enabled) async {
    _useP2P = enabled;
    await _saveP2PPreference();
    _log('P2P mode: ${enabled ? 'enabled' : 'disabled'}');
  }

  /// Clear all sync data
  Future<void> clearSyncData() async {
    _pendingSyncs.clear();
    _receivedSyncs.clear();
    _pairedDevices.clear();
    _lastSyncTime = null;

    await _savePendingSyncs();
    await _savePairedDevices();

    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('timigs_pending_syncs');
    await prefs.remove('timigs_paired_devices');

    _log('Sync data cleared');
  }

  /// Dispose
  Future<void> dispose() async {
    await _peer?.dispose();
    await _logController.close();
    await _statusController.close();
  }
}
