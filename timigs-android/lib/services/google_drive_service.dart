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

  Future<GoogleSignInAccount?> signIn() async {
    try {
      _currentUser = await _googleSignIn.signIn();
      if (_currentUser != null) {
        final authHeaders = await _currentUser!.authHeaders;
        final authenticateClient = GoogleAuthClient(authHeaders);
        _driveApi = drive.DriveApi(authenticateClient);
      }
      return _currentUser;
    } catch (e) {
      print('Google Sign In Error: $e');
      return null;
    }
  }

  Future<void> signOut() async {
    await _googleSignIn.disconnect();
    _currentUser = null;
    _driveApi = null;
  }

  GoogleSignInAccount? get currentUser => _currentUser;

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
    if (_driveApi == null) return;

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
    if (_driveApi == null) return;

    final drive.Media file = await _driveApi!.files.get(
      fileId,
      downloadOptions: drive.DownloadOptions.fullMedia,
    ) as drive.Media;

    final saveFile = File(savePath);
    final List<int> dataStore = [];

    await file.stream.listen((data) {
      dataStore.addAll(data);
    }, onDone: () async {
      await saveFile.writeAsBytes(dataStore);
    }, onError: (error) {
      print('Download Error: $error');
    }).asFuture();
  }
}
