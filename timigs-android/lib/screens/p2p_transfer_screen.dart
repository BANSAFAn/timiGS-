import 'dart:io';
import 'package:flutter/material.dart';
import '../services/p2p_service.dart';
import '../services/database_service.dart';

class P2PTransferScreen extends StatefulWidget {
  const P2PTransferScreen({super.key});

  @override
  State<P2PTransferScreen> createState() => _P2PTransferScreenState();
}

class _P2PTransferScreenState extends State<P2PTransferScreen> {
  final P2PService _p2pService = P2PService();
  final TextEditingController _ipController = TextEditingController();
  String? _myIp;
  bool _isServerRunning = false;
  final List<String> _logs = [];
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _init();
    _p2pService.logs.listen((log) {
      if (mounted) {
        setState(() {
          _logs.add(log);
        });
        Future.delayed(const Duration(milliseconds: 100), () {
          if (_scrollController.hasClients) {
            _scrollController.animateTo(
              _scrollController.position.maxScrollExtent,
              duration: const Duration(milliseconds: 300),
              curve: Curves.easeOut,
            );
          }
        });
      }
    });
  }

  Future<void> _init() async {
    final ip = await _p2pService.getIpAddress();
    setState(() => _myIp = ip);
  }

  @override
  void dispose() {
    _p2pService.stopServer();
    _ipController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  Future<void> _toggleServer() async {
    if (_isServerRunning) {
      await _p2pService.stopServer();
      setState(() => _isServerRunning = false);
    } else {
      await _p2pService.startServer();
      setState(() => _isServerRunning = true);
    }
  }

  Future<void> _sendFile() async {
    final targetIp = _ipController.text.trim();
    if (targetIp.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter target IP')),
      );
      return;
    }

    try {
      final dbPath = await DatabaseService.instance.exportDatabase();
      final file = File(dbPath);
      if (!await file.exists()) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Database not found')),
        );
        return;
      }

      await _p2pService.sendFile(targetIp, file);
    } catch (e) {
      // Log handled by service
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('P2P File Transfer')),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            // Device Info Card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  children: [
                    const Icon(Icons.wifi_tethering,
                        size: 48, color: Colors.blue),
                    const SizedBox(height: 8),
                    Text(
                      'My IP: ${_myIp ?? "Unknown"}',
                      style: const TextStyle(
                          fontSize: 18, fontWeight: FontWeight.bold),
                    ),
                    const SizedBox(height: 8),
                    const Text('Connect to the same Wi-Fi network'),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Server Toggle
            SwitchListTile(
              title: const Text('Receive Mode'),
              subtitle:
                  const Text('Start server to receive files from PC/Mobile'),
              value: _isServerRunning,
              onChanged: (val) => _toggleServer(),
              secondary:
                  Icon(_isServerRunning ? Icons.download_done : Icons.download),
            ),

            const Divider(),

            // Sender Section
            const Text('Send Data',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            TextField(
              controller: _ipController,
              decoration: const InputDecoration(
                labelText: 'Target Device IP',
                border: OutlineInputBorder(),
                prefixIcon: Icon(Icons.computer),
                hintText: 'e.g., 192.168.1.5',
              ),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _sendFile,
              icon: const Icon(Icons.send),
              label: const Text('Send Database to Device'),
            ),

            const Divider(),

            // Logs
            const Align(
              alignment: Alignment.centerLeft,
              child:
                  Text('Logs:', style: TextStyle(fontWeight: FontWeight.bold)),
            ),
            Expanded(
              child: Container(
                margin: const EdgeInsets.only(top: 8),
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.black12,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: ListView.builder(
                  controller: _scrollController,
                  itemCount: _logs.length,
                  itemBuilder: (context, index) => Text(
                    _logs[index],
                    style:
                        const TextStyle(fontFamily: 'monospace', fontSize: 12),
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
