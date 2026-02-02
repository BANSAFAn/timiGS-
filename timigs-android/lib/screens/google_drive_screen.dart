import 'package:flutter/material.dart';

class GoogleDriveScreen extends StatelessWidget {
  const GoogleDriveScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Google Drive Backup')),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.add_to_drive, size: 64, color: Colors.blue),
            SizedBox(height: 16),
            Text('Google Drive Integration', style: TextStyle(fontSize: 20)),
            SizedBox(height: 8),
            Text('Backup your stats to Google Drive',
                style: TextStyle(color: Colors.grey)),
            SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: null, // Disabled for now
              icon: Icon(Icons.login),
              label: Text('Connect Google Drive'),
            ),
          ],
        ),
      ),
    );
  }
}
