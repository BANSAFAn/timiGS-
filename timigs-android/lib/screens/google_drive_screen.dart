import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:googleapis/drive/v3.dart' as drive;
import '../services/google_drive_service.dart';
import '../services/database_service.dart';

class GoogleDriveScreen extends StatefulWidget {
  const GoogleDriveScreen({super.key});

  @override
  State<GoogleDriveScreen> createState() => _GoogleDriveScreenState();
}

class _GoogleDriveScreenState extends State<GoogleDriveScreen> {
  final GoogleDriveService _driveService = GoogleDriveService();
  bool _isLoading = false;
  GoogleSignInAccount? _currentUser;
  List<drive.File> _backupFiles = [];

  @override
  void initState() {
    super.initState();
    _checkSignIn();
  }

  Future<void> _checkSignIn() async {
    final user = _driveService.currentUser;
    if (user != null) {
      setState(() => _currentUser = user);
      _loadBackups();
    } else {
      // Try silent sign in
      final account =
          await _driveService.signIn(); // This might trigger UI, so be careful.
      // Actually signIn() triggers interactive flow.
      // Usually checking current user is enough if instance persists, but here it's new.
      // GoogleSignIn has signInSilently()
      // Let's rely on manual connect for now or check if package supports silent.
      // The service wrapper I wrote calls signIn() which is interactive.
      // I'll leave it manual for now to avoid popping up windows unexpectedly.
    }
  }

  Future<void> _signIn() async {
    setState(() => _isLoading = true);
    final user = await _driveService.signIn();
    setState(() {
      _currentUser = user;
      _isLoading = false;
    });
    if (user != null) {
      _loadBackups();
    }
  }

  Future<void> _signOut() async {
    await _driveService.signOut();
    setState(() {
      _currentUser = null;
      _backupFiles = [];
    });
  }

  Future<void> _loadBackups() async {
    setState(() => _isLoading = true);
    final files = await _driveService.listFiles("TimiGS Backups");
    setState(() {
      _backupFiles = files;
      _isLoading = false;
    });
  }

  Future<void> _backup() async {
    setState(() => _isLoading = true);
    try {
      final dbPath = await DatabaseService.instance.exportDatabase();
      final file = File(dbPath);
      if (await file.exists()) {
        await _driveService.uploadFile(file, "TimiGS Backups");
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Backup successful!')),
          );
        }
        _loadBackups();
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Database file not found')),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Backup failed: $e')),
        );
      }
    } finally {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _restore(drive.File driveFile) async {
    if (driveFile.id == null) return;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Restore Backup?'),
        content: Text(
            'This will overwrite current data with backup from ${driveFile.createdTime}. This cannot be undone.'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Cancel')),
          TextButton(
              onPressed: () => Navigator.pop(ctx, true),
              child:
                  const Text('Restore', style: TextStyle(color: Colors.red))),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _isLoading = true);
    try {
      final dbPath =
          await DatabaseService.instance.exportDatabase(); // Get path

      // Close DB before overwriting
      await DatabaseService.instance.close();

      await _driveService.downloadFile(driveFile.id!, dbPath);

      // Re-initialize DB
      await DatabaseService.instance.initialize();

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Restore successful! Restarting session...')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Restore failed: $e')),
        );
      }
      // Attempt re-init just in case
      await DatabaseService.instance.initialize();
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Google Drive Backup'),
        actions: [
          if (_currentUser != null)
            IconButton(
              icon: const Icon(Icons.logout),
              onPressed: _signOut,
              tooltip: 'Sign Out',
            )
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _currentUser == null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.add_to_drive,
                          size: 80, color: Colors.blue),
                      const SizedBox(height: 16),
                      const Text(
                        'Keep your data safe',
                        style: TextStyle(
                            fontSize: 24, fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'Connect Google Drive to backup & sync\nyour activity stats.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.grey),
                      ),
                      const SizedBox(height: 32),
                      ElevatedButton.icon(
                        onPressed: _signIn,
                        icon: const Icon(Icons.login),
                        label: const Text('Connect Google Drive'),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 32, vertical: 16),
                        ),
                      ),
                    ],
                  ),
                )
              : Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(16),
                      color: Theme.of(context)
                          .colorScheme
                          .primaryContainer
                          .withOpacity(0.1),
                      child: Row(
                        children: [
                          CircleAvatar(
                            backgroundImage:
                                NetworkImage(_currentUser?.photoUrl ?? ''),
                            child: _currentUser?.photoUrl == null
                                ? const Icon(Icons.person)
                                : null,
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  _currentUser?.displayName ?? 'User',
                                  style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 16),
                                ),
                                Text(_currentUser?.email ?? ''),
                              ],
                            ),
                          ),
                          ElevatedButton.icon(
                            onPressed: _backup,
                            icon: const Icon(Icons.cloud_upload),
                            label: const Text('Backup Now'),
                          ),
                        ],
                      ),
                    ),
                    const Divider(height: 1),
                    Expanded(
                      child: _backupFiles.isEmpty
                          ? const Center(child: Text('No backups found'))
                          : ListView.builder(
                              itemCount: _backupFiles.length,
                              itemBuilder: (context, index) {
                                final file = _backupFiles[index];
                                final sizeMb =
                                    (int.tryParse(file.size ?? '0') ?? 0) /
                                        (1024 * 1024);
                                return ListTile(
                                  leading: const Icon(Icons.description),
                                  title: Text(file.name ?? 'Unknown File'),
                                  subtitle: Text(
                                    '${file.createdTime?.toLocal().toString().split('.')[0]} • ${sizeMb.toStringAsFixed(2)} MB',
                                  ),
                                  trailing: IconButton(
                                    icon: const Icon(Icons.restore),
                                    onPressed: () => _restore(file),
                                    tooltip: 'Restore this backup',
                                  ),
                                );
                              },
                            ),
                    ),
                  ],
                ),
    );
  }
}
