import 'dart:io';
import 'dart:async';
import 'package:http/http.dart' as http;
import 'package:path/path.dart' as path;
import 'package:timigs_android/services/database_service.dart';

class P2PService {
  HttpServer? _server;
  final int _port = 4444; // Custom port for TimiGS
  StreamController<String> _logController = StreamController.broadcast();

  Stream<String> get logs => _logController.stream;

  Future<void> log(String message) async {
    print('[P2P] $message');
    _logController.add(message);
  }

  // === Server Side (Receiver) ===

  Future<String?> getIpAddress() async {
    try {
      for (var interface in await NetworkInterface.list()) {
        for (var addr in interface.addresses) {
          // Filter for IPv4 and local regular addresses (192.168.x.x, 10.x.x.x, etc)
          if (addr.type == InternetAddressType.IPv4 && !addr.isLoopback) {
            return addr.address;
          }
        }
      }
    } catch (e) {
      log('Error getting IP: $e');
    }
    return null;
  }

  Future<void> startServer() async {
    if (_server != null) return;

    try {
      _server = await HttpServer.bind(InternetAddress.anyIPv4, _port);
      log('Server running on port $_port');

      _server!.listen((HttpRequest request) async {
        try {
          if (request.method == 'POST' && request.uri.path == '/upload') {
            await _handleUpload(request);
          } else {
            request.response
              ..statusCode = HttpStatus.notFound
              ..write('Not Found')
              ..close();
          }
        } catch (e) {
          log('Server Error: $e');
          request.response.statusCode = HttpStatus.internalServerError;
          request.response.close();
        }
      });
    } catch (e) {
      log('Failed to start server: $e');
    }
  }

  Future<void> _handleUpload(HttpRequest request) async {
    log('Receiving file upload...');
    final contentType = request.headers.contentType;

    if (contentType?.mimeType == 'multipart/form-data') {
      final boundary = contentType?.parameters['boundary'];
      if (boundary == null) {
        request.response.statusCode = HttpStatus.badRequest;
        request.response.close();
        return;
      }

      // Simple multipart parser for this specific use case
      // In production, use the 'mime' package or similar.
      // For now, assuming raw body if standard transfer, or minimal parsing.
      // Actually, sending raw bytes is easier for our custom P2P.
    }

    // Simpler approach: Client sends raw bytes.
    // Or we use a simpler protocol:
    // Header: X-Filename
    // Body: File Content

    final filename = request.headers.value('x-filename') ??
        'transfer_${DateTime.now().millisecondsSinceEpoch}.db';

    final dbPath = await DatabaseService.instance.exportDatabase();
    // Save to temp or overwrite?
    // Let's save to a "received" path first.
    final saveDir = File(dbPath).parent;
    final savePath = path.join(saveDir.path, filename);

    final file = File(savePath);
    final sink = file.openWrite();

    await request.listen((data) {
      sink.add(data);
    }).asFuture();

    await sink.close();
    log('File saved to $savePath');

    request.response
      ..statusCode = HttpStatus.ok
      ..write('File received')
      ..close();

    // Notify readiness to restore?
  }

  Future<void> stopServer() async {
    await _server?.close();
    _server = null;
    log('Server stopped');
  }

  // === Client Side (Sender) ===

  Future<void> sendFile(String targetIp, File file) async {
    log('Sending ${path.basename(file.path)} to $targetIp...');

    final url = Uri.parse('http://$targetIp:$_port/upload');
    final filename = path.basename(file.path);

    // Simple Stream Upload
    final request = http.StreamedRequest('POST', url);
    request.headers['x-filename'] = filename;
    request.contentLength = await file.length();

    final stream = file.openRead();
    stream.listen((chunk) {
      request.sink.add(chunk);
    }, onDone: () {
      request.sink.close();
    }, onError: (e) {
      request.sink.addError(e);
      request.sink.close();
    });

    try {
      final response = await request.send();
      if (response.statusCode == 200) {
        log('Transfer successful');
      } else {
        log('Transfer failed: ${response.statusCode}');
      }
    } catch (e) {
      log('Connection failed: $e');
      rethrow;
    }
  }
}
