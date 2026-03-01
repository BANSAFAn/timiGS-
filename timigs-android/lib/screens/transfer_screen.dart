import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:file_picker/file_picker.dart';
import 'package:peerdart/peerdart.dart';
import 'package:path_provider/path_provider.dart';
import 'dart:io';
import 'dart:typed_data';
import '../services/p2p_service.dart';

class TransferScreen extends StatefulWidget {
  const TransferScreen({super.key});

  @override
  State<TransferScreen> createState() => _TransferScreenState();
}

class _TransferScreenState extends State<TransferScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Peer State
  Peer? _peer;
  DataConnection? _conn;
  String _myPeerId = '';
  String _targetPeerId = '';
  bool _isConnected = false;
  String _connectionError = '';
  String _transferStatus = '';
  bool _isTransferring = false;
  double _transferProgress = 0;

  // File State
  File? _selectedFile;
  String? _pendingFileName;
  int? _pendingFileSize;
  String? _incomingFileName;
  int? _incomingFileSize;

  // Received data
  final List<Uint8List> _receivedChunks = [];
  int _receivedSize = 0;

  // History
  final List<Map<String, dynamic>> _transferHistory = [];

  // IP Mode
  bool _isIpMode = false;
  final P2PService _p2pService = P2PService();
  String _ipAddress = '';
  String _targetIp = '';
  bool _ipServerRunning = false;
  bool _ipSending = false;
  String _ipStatus = '';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _initPeer();
    _loadIpAddress();
  }

  @override
  void dispose() {
    _peer?.dispose();
    _p2pService.stopServer();
    _tabController.dispose();
    super.dispose();
  }

  void _initPeer() {
    _peer = Peer(
      options: PeerOptions(
        config: {
          'iceServers': [
            {'urls': 'stun:stun.l.google.com:19302'},
            {'urls': 'stun:stun1.l.google.com:19302'},
            {'urls': 'stun:stun2.l.google.com:19302'},
          ],
        },
      ),
    );

    _peer!.on('open').listen((id) {
      if (mounted) setState(() => _myPeerId = id.toString());
    });

    _peer!.on<DataConnection>('connection').listen((conn) {
      _conn = conn;
      _setupReceiverConnection();
    });

    _peer!.on('error').listen((err) {
      if (mounted) {
        setState(() => _connectionError = 'P2P Error: $err');
      }
    });
  }

  Future<void> _loadIpAddress() async {
    final ip = await _p2pService.getIpAddress();
    if (mounted) setState(() => _ipAddress = ip ?? 'Unknown');
  }

  Future<void> _toggleIpServer() async {
    if (_ipServerRunning) {
      _p2pService.stopServer();
      setState(() {
        _ipServerRunning = false;
        _ipStatus = 'Server stopped';
      });
    } else {
      await _p2pService.startServer();
      setState(() {
        _ipServerRunning = true;
        _ipStatus = 'Server running on port 4444';
      });
    }
  }

  Future<void> _sendFileViaIp() async {
    if (_selectedFile == null || _targetIp.isEmpty) return;
    setState(() {
      _ipSending = true;
      _ipStatus = 'Sending...';
    });

    try {
      await _p2pService.sendFile(_targetIp, _selectedFile!);
      setState(() {
        _ipStatus = 'File sent successfully! \u2713';
        _transferHistory.insert(0, {
          'name': _selectedFile!.path.split('/').last,
          'size': _selectedFile!.lengthSync(),
          'type': 'sent',
          'date': DateTime.now(),
          'status': 'completed',
        });
        _selectedFile = null;
      });
    } catch (e) {
      setState(() => _ipStatus = 'Error: $e');
    } finally {
      if (mounted) setState(() => _ipSending = false);
    }
  }

  void _connectToPeer() {
    if (_targetPeerId.isEmpty || _peer == null) return;
    setState(() => _connectionError = '');

    _conn = _peer!.connect(_targetPeerId);

    _conn!.on('open').listen((_) {
      if (mounted) {
        setState(() {
          _isConnected = true;
          _transferStatus = '';
        });
      }
    });

    _conn!.on('data').listen((data) {
      _handleSenderData(data);
    });

    _conn!.on('close').listen((_) {
      if (mounted) {
        setState(() {
          _isConnected = false;
          _transferStatus = 'Connection closed.';
        });
      }
    });

    _conn!.on('error').listen((err) {
      if (mounted) {
        setState(() {
          _connectionError = 'Connection failed: $err';
          _isConnected = false;
        });
      }
    });
  }

  void _setupReceiverConnection() {
    setState(() => _isConnected = true);
    _receivedChunks.clear();
    _receivedSize = 0;

    _conn!.on('data').listen((data) {
      _handleReceiverData(data);
    });

    _conn!.on('close').listen((_) {
      if (mounted) setState(() => _isConnected = false);
    });
  }

  void _handleSenderData(dynamic data) {
    if (data is Map) {
      final type = data['type'];
      if (type == 'accept') {
        _beginChunkTransfer();
      } else if (type == 'reject') {
        if (mounted) {
          setState(() {
            _transferStatus = 'Transfer rejected by peer.';
            _isTransferring = false;
          });
        }
      }
    }
  }

  void _handleReceiverData(dynamic data) {
    if (data is Map) {
      final type = data['type'];

      if (type == 'offer') {
        setState(() {
          _pendingFileName = data['name'];
          _pendingFileSize = data['size'];
        });
      } else if (type == 'chunk') {
        final chunkData = data['data'];
        Uint8List bytes;
        if (chunkData is Uint8List) {
          bytes = chunkData;
        } else if (chunkData is List) {
          bytes = Uint8List.fromList(List<int>.from(chunkData));
        } else {
          return;
        }

        _receivedChunks.add(bytes);
        _receivedSize += bytes.length;

        if (_incomingFileSize != null && _incomingFileSize! > 0) {
          setState(() {
            _transferProgress = (_receivedSize / _incomingFileSize!) * 100;
          });
        }
      } else if (type == 'complete') {
        _saveReceivedFile();
      }
    }
  }

  void _acceptTransfer() {
    if (_pendingFileName == null || _conn == null) return;
    setState(() {
      _incomingFileName = _pendingFileName;
      _incomingFileSize = _pendingFileSize;
      _pendingFileName = null;
      _pendingFileSize = null;
      _receivedChunks.clear();
      _receivedSize = 0;
      _transferProgress = 0;
    });
    _conn!.send({'type': 'accept'});
  }

  void _rejectTransfer() {
    if (_conn == null) return;
    _conn!.send({'type': 'reject'});
    setState(() {
      _pendingFileName = null;
      _pendingFileSize = null;
    });
  }

  Future<void> _pickFile() async {
    try {
      final result = await FilePicker.platform.pickFiles();
      if (result != null && result.files.single.path != null) {
        setState(() {
          _selectedFile = File(result.files.single.path!);
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error picking file: $e')),
        );
      }
    }
  }

  void _startTransfer() {
    if (_conn == null || _selectedFile == null) return;

    final file = _selectedFile!;
    setState(() {
      _isTransferring = true;
      _transferProgress = 0;
      _transferStatus = 'Waiting for acceptance...';
    });

    _conn!.send({
      'type': 'offer',
      'name': file.path.split('/').last,
      'size': file.lengthSync(),
    });
  }

  Future<void> _beginChunkTransfer() async {
    if (_selectedFile == null || _conn == null) return;

    final file = _selectedFile!;
    final fileSize = file.lengthSync();
    const chunkSize = 16384 * 4; // 64KB chunks, same as PC

    setState(() => _transferStatus = 'Sending data...');

    final bytes = await file.readAsBytes();
    int offset = 0;
    int chunkIndex = 0;

    while (offset < fileSize) {
      final end =
          (offset + chunkSize > fileSize) ? fileSize : offset + chunkSize;
      final chunk = bytes.sublist(offset, end);

      _conn!.send({
        'type': 'chunk',
        'index': chunkIndex,
        'data': chunk,
      });

      offset = end;
      chunkIndex++;

      setState(() {
        _transferProgress = (offset / fileSize) * 100;
      });

      // Small delay to prevent overwhelming the connection
      await Future.delayed(const Duration(milliseconds: 5));
    }

    _conn!.send({'type': 'complete', 'totalChunks': chunkIndex});

    setState(() {
      _isTransferring = false;
      _transferStatus = 'Transfer complete! ✓';
      _transferHistory.insert(0, {
        'name': file.path.split('/').last,
        'size': fileSize,
        'type': 'sent',
        'date': DateTime.now(),
        'status': 'completed',
      });
      _selectedFile = null;
    });
  }

  Future<void> _saveReceivedFile() async {
    if (_incomingFileName == null) return;

    setState(() => _transferStatus = 'Saving file...');

    try {
      final dir = await getExternalStorageDirectory() ??
          await getApplicationDocumentsDirectory();
      final downloadDir = Directory('${dir.path}/TimiGS Downloads');
      if (!await downloadDir.exists())
        await downloadDir.create(recursive: true);

      final filePath = '${downloadDir.path}/$_incomingFileName';
      final file = File(filePath);

      final allBytes = BytesBuilder();
      for (final chunk in _receivedChunks) {
        allBytes.add(chunk);
      }
      await file.writeAsBytes(allBytes.toBytes());

      setState(() {
        _transferStatus = 'File saved to: $filePath';
        _transferHistory.insert(0, {
          'name': _incomingFileName!,
          'size': _incomingFileSize ?? 0,
          'type': 'received',
          'date': DateTime.now(),
          'status': 'completed',
        });
        _incomingFileName = null;
        _incomingFileSize = null;
        _receivedChunks.clear();
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('File saved to: $filePath')),
        );
      }
    } catch (e) {
      setState(() => _transferStatus = 'Error saving: $e');
    }
  }

  void _copyToken() {
    if (_myPeerId.isNotEmpty) {
      Clipboard.setData(ClipboardData(text: _myPeerId));
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Token copied!'), duration: Duration(seconds: 1)),
      );
    }
  }

  String _formatFileSize(int bytes) {
    if (bytes < 1024) return '$bytes B';
    if (bytes < 1024 * 1024) return '${(bytes / 1024).toStringAsFixed(1)} KB';
    if (bytes < 1024 * 1024 * 1024) {
      return '${(bytes / 1024 / 1024).toStringAsFixed(2)} MB';
    }
    return '${(bytes / 1024 / 1024 / 1024).toStringAsFixed(2)} GB';
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final primary = theme.colorScheme.primary;

    return Scaffold(
      appBar: AppBar(
        title: Row(
          children: [
            const Text('P2P Transfer'),
            const Spacer(),
            // Mode toggle
            ToggleButtons(
              borderRadius: BorderRadius.circular(20),
              constraints: const BoxConstraints(minHeight: 32, minWidth: 60),
              textStyle:
                  const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
              isSelected: [!_isIpMode, _isIpMode],
              onPressed: (i) => setState(() => _isIpMode = i == 1),
              children: const [
                Padding(
                    padding: EdgeInsets.symmetric(horizontal: 8),
                    child: Text('\ud83d\udd11 Token')),
                Padding(
                    padding: EdgeInsets.symmetric(horizontal: 8),
                    child: Text('\ud83c\udf10 IP')),
              ],
            ),
          ],
        ),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(icon: Icon(Icons.send), text: 'Send'),
            Tab(icon: Icon(Icons.download), text: 'Receive'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _isIpMode ? _buildIpSendTab(primary) : _buildSendTab(primary),
          _isIpMode ? _buildIpReceiveTab(primary) : _buildReceiveTab(primary),
        ],
      ),
    );
  }

  // ── IP Mode: Send Tab ──
  Widget _buildIpSendTab(Color primary) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(children: [
                  Icon(Icons.language, color: primary),
                  const SizedBox(width: 10),
                  Text('Send via IP',
                      style: Theme.of(context)
                          .textTheme
                          .titleMedium
                          ?.copyWith(fontWeight: FontWeight.bold)),
                ]),
                const SizedBox(height: 8),
                Text(
                    'Enter the target device\'s IP address. Both devices must be on the same Wi-Fi network.',
                    style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: 16),
                TextField(
                  onChanged: (v) => _targetIp = v,
                  decoration: InputDecoration(
                    hintText: 'e.g. 192.168.1.42',
                    border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(12)),
                    prefixIcon: const Icon(Icons.computer),
                  ),
                ),
              ],
            ),
          ),
        ),
        const SizedBox(height: 16),

        // File picker
        GestureDetector(
          onTap: _pickFile,
          child: Container(
            height: 150,
            decoration: BoxDecoration(
              border: Border.all(color: primary, width: 2),
              borderRadius: BorderRadius.circular(16),
              color: primary.withOpacity(0.05),
            ),
            child: _selectedFile == null
                ? Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.upload_file, size: 48, color: primary),
                      const SizedBox(height: 12),
                      Text('Tap to select file',
                          style: Theme.of(context).textTheme.titleMedium),
                    ],
                  )
                : Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        Icon(Icons.insert_drive_file, size: 40, color: primary),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(_selectedFile!.path.split('/').last,
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                  style:
                                      Theme.of(context).textTheme.titleSmall),
                              const SizedBox(height: 4),
                              Text(
                                  _formatFileSize(_selectedFile!.lengthSync())),
                            ],
                          ),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () => setState(() => _selectedFile = null),
                        ),
                      ],
                    ),
                  ),
          ),
        ),

        if (_ipSending) ...[
          const SizedBox(height: 16),
          const LinearProgressIndicator(),
        ],

        if (_selectedFile != null && !_ipSending) ...[
          const SizedBox(height: 20),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: _targetIp.isNotEmpty ? _sendFileViaIp : null,
              icon: const Icon(Icons.send),
              label: const Text('Send File'),
              style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16)),
            ),
          ),
        ],

        if (_ipStatus.isNotEmpty) ...[
          const SizedBox(height: 12),
          Text(_ipStatus,
              style: TextStyle(
                color: _ipStatus.contains('\u2713') ? Colors.green : null,
                fontWeight: FontWeight.w500,
              )),
        ],
      ],
    );
  }

  // ── IP Mode: Receive Tab ──
  Widget _buildIpReceiveTab(Color primary) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Row(children: [
                  Icon(Icons.language, color: primary),
                  const SizedBox(width: 10),
                  Text('Receive via IP',
                      style: Theme.of(context)
                          .textTheme
                          .titleMedium
                          ?.copyWith(fontWeight: FontWeight.bold)),
                ]),
                const SizedBox(height: 8),
                Text(
                    'Start the server to receive files from other devices on the same network.',
                    style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(height: 20),

                // IP display
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: primary.withOpacity(0.08),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: primary.withOpacity(0.2)),
                  ),
                  child: Column(
                    children: [
                      Text('YOUR IP ADDRESS',
                          style: TextStyle(
                              fontSize: 10,
                              color: primary,
                              letterSpacing: 1,
                              fontWeight: FontWeight.w600)),
                      const SizedBox(height: 8),
                      GestureDetector(
                        onTap: () {
                          if (_ipAddress.isNotEmpty) {
                            Clipboard.setData(ClipboardData(text: _ipAddress));
                            ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                    content: Text('IP copied!'),
                                    duration: Duration(seconds: 1)));
                          }
                        },
                        child: Text(
                            _ipAddress.isEmpty ? 'Detecting...' : _ipAddress,
                            style: TextStyle(
                                fontSize: 22,
                                fontWeight: FontWeight.bold,
                                fontFamily: 'monospace',
                                color: primary)),
                      ),
                      const SizedBox(height: 4),
                      Text('Port: 4444',
                          style: Theme.of(context).textTheme.bodySmall),
                    ],
                  ),
                ),
                const SizedBox(height: 20),

                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: _toggleIpServer,
                    icon:
                        Icon(_ipServerRunning ? Icons.stop : Icons.play_arrow),
                    label:
                        Text(_ipServerRunning ? 'Stop Server' : 'Start Server'),
                    style: FilledButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      backgroundColor: _ipServerRunning ? Colors.red : null,
                    ),
                  ),
                ),

                if (_ipStatus.isNotEmpty) ...[
                  const SizedBox(height: 12),
                  Text(_ipStatus, style: const TextStyle(fontSize: 13)),
                ],
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSendTab(Color primary) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Connection Section
        if (!_isConnected) ...[
          Card(
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(Icons.link, color: primary),
                      const SizedBox(width: 10),
                      Text('Connect to Receiver',
                          style: Theme.of(context)
                              .textTheme
                              .titleMedium
                              ?.copyWith(fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  TextField(
                    onChanged: (v) => _targetPeerId = v,
                    decoration: InputDecoration(
                      hintText: "Enter receiver's token...",
                      border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12)),
                      suffixIcon: IconButton(
                        icon: Icon(Icons.link, color: primary),
                        onPressed: _connectToPeer,
                      ),
                    ),
                  ),
                  if (_connectionError.isNotEmpty) ...[
                    const SizedBox(height: 8),
                    Text(_connectionError,
                        style:
                            const TextStyle(color: Colors.red, fontSize: 13)),
                  ],
                  const SizedBox(height: 16),
                  SizedBox(
                    width: double.infinity,
                    child: FilledButton.icon(
                      onPressed:
                          _targetPeerId.isNotEmpty ? _connectToPeer : null,
                      icon: const Icon(Icons.link),
                      label: const Text('Connect'),
                      style: FilledButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 14),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ] else ...[
          // Connected badge
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            margin: const EdgeInsets.only(bottom: 16),
            decoration: BoxDecoration(
              color: Colors.green.withOpacity(0.1),
              border: Border.all(color: Colors.green.withOpacity(0.2)),
              borderRadius: BorderRadius.circular(30),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Icon(Icons.check_circle, color: Colors.green, size: 20),
                const SizedBox(width: 8),
                Text(
                    'Connected to ${_targetPeerId.length > 12 ? '${_targetPeerId.substring(0, 12)}...' : _targetPeerId}',
                    style: const TextStyle(
                        color: Colors.green, fontWeight: FontWeight.w600)),
              ],
            ),
          ),

          // File picker
          GestureDetector(
            onTap: _pickFile,
            child: Container(
              height: 200,
              decoration: BoxDecoration(
                border: Border.all(
                    color: primary, width: 2, style: BorderStyle.solid),
                borderRadius: BorderRadius.circular(16),
                color: primary.withOpacity(0.05),
              ),
              child: _selectedFile == null
                  ? Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.upload_file, size: 64, color: primary),
                        const SizedBox(height: 16),
                        Text('Tap to select file',
                            style: Theme.of(context).textTheme.titleMedium),
                        const SizedBox(height: 8),
                        Text('Any file type supported',
                            style: Theme.of(context).textTheme.bodySmall),
                      ],
                    )
                  : Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.insert_drive_file,
                              size: 48, color: primary),
                          const SizedBox(height: 12),
                          Text(
                            _selectedFile!.path.split('/').last,
                            style: Theme.of(context).textTheme.titleMedium,
                            textAlign: TextAlign.center,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 8),
                          Text(_formatFileSize(_selectedFile!.lengthSync()),
                              style: Theme.of(context).textTheme.bodyMedium),
                          const SizedBox(height: 12),
                          TextButton.icon(
                            onPressed: () =>
                                setState(() => _selectedFile = null),
                            icon: const Icon(Icons.close),
                            label: const Text('Remove'),
                          ),
                        ],
                      ),
                    ),
            ),
          ),

          // Transfer progress
          if (_isTransferring) ...[
            const SizedBox(height: 16),
            Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Sending...'),
                    Text('${_transferProgress.toStringAsFixed(0)}%',
                        style: TextStyle(
                            fontWeight: FontWeight.bold, color: primary)),
                  ],
                ),
                const SizedBox(height: 8),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                      value: _transferProgress / 100, minHeight: 6),
                ),
              ],
            ),
          ],

          // Send button
          if (_selectedFile != null && !_isTransferring) ...[
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: _startTransfer,
                icon: const Icon(Icons.send),
                label: const Text('Send File'),
                style: FilledButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16)),
              ),
            ),
          ],

          if (_transferStatus.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(_transferStatus,
                style: TextStyle(
                  color: _transferStatus.contains('complete')
                      ? Colors.green
                      : null,
                  fontWeight: FontWeight.w500,
                )),
          ],
        ],
      ],
    );
  }

  Widget _buildReceiveTab(Color primary) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        // Token card
        Card(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Row(
                  children: [
                    Icon(Icons.confirmation_number, color: primary),
                    const SizedBox(width: 10),
                    Text('Your Token',
                        style: Theme.of(context)
                            .textTheme
                            .titleMedium
                            ?.copyWith(fontWeight: FontWeight.bold)),
                  ],
                ),
                const SizedBox(height: 16),
                GestureDetector(
                  onTap: _copyToken,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 20, vertical: 14),
                    decoration: BoxDecoration(
                      color: primary.withOpacity(0.08),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: primary.withOpacity(0.2)),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Text(
                            _myPeerId.isEmpty ? 'Generating...' : _myPeerId,
                            style: TextStyle(
                              fontFamily: 'monospace',
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: primary,
                            ),
                          ),
                        ),
                        if (_myPeerId.isNotEmpty)
                          Icon(Icons.copy, size: 20, color: primary),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 10),
                Text('Share this token with the sender',
                    style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
        ),

        const SizedBox(height: 16),

        // Connection status
        Card(
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              children: [
                Container(
                  width: 48,
                  height: 48,
                  decoration: BoxDecoration(
                    color: (_isConnected ? Colors.green : Colors.grey)
                        .withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(
                    _isConnected ? Icons.check_circle : Icons.hourglass_bottom,
                    color: _isConnected ? Colors.green : Colors.grey,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        _isConnected
                            ? 'Connection Established'
                            : 'Waiting for connection...',
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _isConnected
                            ? 'Ready to receive files'
                            : 'Sender will connect using your token',
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),

        // Pending file
        if (_pendingFileName != null) ...[
          const SizedBox(height: 16),
          Card(
            color: Colors.amber.withOpacity(0.08),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(16),
              side: BorderSide(color: Colors.amber.withOpacity(0.3)),
            ),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  Row(
                    children: [
                      const Icon(Icons.download, color: Colors.amber),
                      const SizedBox(width: 10),
                      const Text('Incoming File',
                          style: TextStyle(fontWeight: FontWeight.bold)),
                    ],
                  ),
                  const SizedBox(height: 12),
                  Text(_pendingFileName!,
                      style: Theme.of(context).textTheme.titleMedium),
                  if (_pendingFileSize != null)
                    Text(_formatFileSize(_pendingFileSize!),
                        style: Theme.of(context).textTheme.bodySmall),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: _rejectTransfer,
                          child: const Text('Decline'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: FilledButton(
                          onPressed: _acceptTransfer,
                          child: const Text('Accept'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],

        // Receiving progress
        if (_incomingFileName != null) ...[
          const SizedBox(height: 16),
          Card(
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  Row(
                    children: [
                      Icon(Icons.download, color: primary),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(_incomingFileName!,
                                style: const TextStyle(
                                    fontWeight: FontWeight.w600)),
                            if (_incomingFileSize != null)
                              Text(_formatFileSize(_incomingFileSize!),
                                  style: Theme.of(context).textTheme.bodySmall),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                        value: _transferProgress / 100, minHeight: 6),
                  ),
                  const SizedBox(height: 4),
                  Text('${_transferProgress.toStringAsFixed(0)}% received'),
                ],
              ),
            ),
          ),
        ],

        if (_transferStatus.isNotEmpty) ...[
          const SizedBox(height: 12),
          Text(_transferStatus,
              style: TextStyle(
                color: _transferStatus.contains('saved') ? Colors.green : null,
                fontWeight: FontWeight.w500,
              )),
        ],

        // Transfer History
        if (_transferHistory.isNotEmpty) ...[
          const SizedBox(height: 24),
          Text('Recent Transfers',
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 12),
          ...(_transferHistory.map((item) => Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: primary.withOpacity(0.1),
                    child: Icon(
                      item['type'] == 'sent' ? Icons.upload : Icons.download,
                      color: primary,
                    ),
                  ),
                  title: Text(item['name'],
                      maxLines: 1, overflow: TextOverflow.ellipsis),
                  subtitle: Text(
                      '${_formatFileSize(item['size'])} • ${item['status']}'),
                  trailing: Icon(
                    item['status'] == 'completed'
                        ? Icons.check_circle
                        : Icons.error,
                    color: item['status'] == 'completed'
                        ? Colors.green
                        : Colors.red,
                  ),
                ),
              ))),
        ],
      ],
    );
  }
}
