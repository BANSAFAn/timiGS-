import 'dart:io';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:googleapis/drive/v3.dart' as drive;
import 'package:http/http.dart' as http;
import 'package:path/path.dart' as path;

class GoogleAuthClient extends http.BaseClient {
  final Map<String, String> _headers;
  final http.Client _client = http.Client();

  GoogleAuthClient(this._headers);

  @override
  Future<http.StreamedResponse> send(http.BaseRequest request) {
    request.headers.addAll(_headers);
    return _client.send(request);
  }
}

class GoogleDriveService {
  final GoogleSignIn _googleSignIn = GoogleSignIn(
    scopes: [
      drive.DriveApi.driveFileScope,
      drive.DriveApi.driveAppdataScope,
    ],
  );

  GoogleSignInAccount? _currentUser;
  drive.DriveApi? _driveApi;
  String? _lastError;

  GoogleSignInAccount? get currentUser => _currentUser;
  String? get lastError => _lastError;

  /// Try silent sign-in (no UI popup)
  Future<GoogleSignInAccount?> signInSilently() async {
    try {
      _lastError = null;
      _currentUser = await _googleSignIn.signInSilently();
      if (_currentUser != null) {
        await _initDriveApi();
      }
      return _currentUser;
    } catch (e) {
      print('Silent sign-in failed: $e');
      _lastError = e.toString();
      return null;
    }
  }

  /// Interactive sign-in
  Future<GoogleSignInAccount?> signIn() async {
    try {
      _lastError = null;
      _currentUser = await _googleSignIn.signIn();
      if (_currentUser != null) {
        await _initDriveApi();
      }
      return _currentUser;
    } catch (e) {
      print('Google Sign In Error: $e');
      _lastError = _parseError(e.toString());
      return null;
    }
  }

  /// Initialize Drive API with auth headers
  Future<void> _initDriveApi() async {
    if (_currentUser == null) return;
    try {
      final authHeaders = await _currentUser!.authHeaders;
      final authenticateClient = GoogleAuthClient(authHeaders);
      _driveApi = drive.DriveApi(authenticateClient);
    } catch (e) {
      print('Error initializing Drive API: $e');
      _lastError = 'Failed to initialize Drive API: $e';
    }
  }

  /// Parse error messages into user-friendly text
  String _parseError(String error) {
    if (error.contains('sign_in_canceled')) {
      return 'Sign-in was cancelled';
    } else if (error.contains('network_error')) {
      return 'Network error. Check your internet connection.';
    } else if (error.contains('sign_in_failed')) {
      return 'Sign-in failed. Check if google-services.json is missing or invalid.';
    } else if (error.contains('ApiException: 10')) {
      // Common error when SHA-1 is wrong or google-services.json is missing
      return 'Configuration error (Code 10). verify google-services.json and SHA-1 fingerprints in Firebase.';
    } else if (error.contains('ApiException: 12500')) {
      return 'Google Play Services needs to be updated.';
    } else if (error.contains('ApiException: 7')) {
      return 'Network error. Check your internet connection.';
    }
    return 'Sign-in error: $error';
  }

  Future<void> signOut() async {
    try {
      await _googleSignIn.disconnect();
    } catch (e) {
      print('Error disconnecting: $e');
    }
    _currentUser = null;
    _driveApi = null;
    _lastError = null;
  }

  /// Check if signed in
  bool get isSignedIn => _currentUser != null && _driveApi != null;

  Future<String?> _getFolderName(String folderName) async {
    if (_driveApi == null) return null;
    final q =
        "mimeType = 'application/vnd.google-apps.folder' and name = '$folderName' and trashed = false";
    final fileList = await _driveApi!.files.list(q: q);
    if (fileList.files?.isNotEmpty == true) {
      return fileList.files!.first.id;
    }
    return null;
  }

  Future<String?> _createFolder(String folderName) async {
    if (_driveApi == null) return null;
    final folder = drive.File()
      ..name = folderName
      ..mimeType = 'application/vnd.google-apps.folder';
    final getFolder = await _driveApi!.files.create(folder);
    return getFolder.id;
  }

  Future<void> uploadFile(File file, String folderName) async {
    if (_driveApi == null) {
      throw Exception('Not signed in to Google Drive');
    }

    String? folderId = await _getFolderName(folderName);
    folderId ??= await _createFolder(folderName);

    if (folderId != null) {
      final fileName = path.basename(file.path);
      final fileToUpload = drive.File()
        ..name = fileName
        ..parents = [folderId];

      await _driveApi!.files.create(
        fileToUpload,
        uploadMedia: drive.Media(file.openRead(), file.lengthSync()),
      );
    }
  }

  Future<List<drive.File>> listFiles(String folderName) async {
    if (_driveApi == null) return [];

    String? folderId = await _getFolderName(folderName);
    if (folderId == null) return [];

    final q = "'$folderId' in parents and trashed = false";
    final fileList = await _driveApi!.files
        .list(q: q, $fields: 'files(id, name, createdTime, size)');
    return fileList.files ?? [];
  }

  Future<void> downloadFile(String fileId, String savePath) async {
    if (_driveApi == null) {
      throw Exception('Not signed in to Google Drive');
    }

    final drive.Media file = await _driveApi!.files.get(
      fileId,
      downloadOptions: drive.DownloadOptions.fullMedia,
    ) as drive.Media;

    final saveFile = File(savePath);
    final List<int> dataStore = [];

    await for (final data in file.stream) {
      dataStore.addAll(data);
    }

    await saveFile.writeAsBytes(dataStore);
  }
}
