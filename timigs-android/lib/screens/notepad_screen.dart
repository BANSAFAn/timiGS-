import 'package:flutter/material.dart';

class NotepadScreen extends StatelessWidget {
  const NotepadScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Notepad')),
      body: const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.note_alt_outlined, size: 64, color: Colors.orange),
            SizedBox(height: 16),
            Text('Notepad Feature Incoming', style: TextStyle(fontSize: 20)),
            SizedBox(height: 8),
            Text('This feature will be synchronized with PC version',
                style: TextStyle(color: Colors.grey)),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {},
        child: const Icon(Icons.add),
      ),
    );
  }
}
