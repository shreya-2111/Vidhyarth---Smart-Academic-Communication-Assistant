import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import '../core/constants/app_constants.dart';

class ApiService {
  final String _baseUrl = AppConstants.baseUrl;
  String? _token;

  void setToken(String token) => _token = token;
  void clearToken() => _token = null;

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        'X-Platform': 'mobile',
        'Bypass-Tunnel-Reminder': 'true',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  Future<dynamic> get(String endpoint) async {
    final response = await http
        .get(Uri.parse('$_baseUrl$endpoint'), headers: _headers)
        .timeout(const Duration(seconds: 30));
    return _handleResponse(response);
  }

  Future<dynamic> post(String endpoint, Map<String, dynamic> body) async {
    final response = await http
        .post(Uri.parse('$_baseUrl$endpoint'),
            headers: _headers, body: jsonEncode(body))
        .timeout(const Duration(seconds: 30));
    return _handleResponse(response);
  }

  Future<dynamic> put(String endpoint, Map<String, dynamic> body) async {
    final response = await http
        .put(Uri.parse('$_baseUrl$endpoint'),
            headers: _headers, body: jsonEncode(body))
        .timeout(const Duration(seconds: 30));
    return _handleResponse(response);
  }

  Future<dynamic> delete(String endpoint) async {
    final response = await http
        .delete(Uri.parse('$_baseUrl$endpoint'), headers: _headers)
        .timeout(const Duration(seconds: 30));
    return _handleResponse(response);
  }

  /// Multipart file upload
  Future<dynamic> uploadFile(String endpoint, File file, String fieldName,
      {Map<String, String>? fields}) async {
    final request =
        http.MultipartRequest('POST', Uri.parse('$_baseUrl$endpoint'));
    request.headers['Bypass-Tunnel-Reminder'] = 'true';
    if (_token != null) {
      request.headers['Authorization'] = 'Bearer $_token';
    }
    request.files.add(await http.MultipartFile.fromPath(fieldName, file.path));
    if (fields != null) request.fields.addAll(fields);

    final streamed = await request.send().timeout(const Duration(seconds: 60));
    final bodyBytes = await streamed.stream.toBytes();
    final bodyStr = String.fromCharCodes(bodyBytes);

    dynamic body;
    try {
      body = jsonDecode(bodyStr);
    } catch (_) {
      body = {'error': bodyStr};
    }

    if (streamed.statusCode >= 200 && streamed.statusCode < 300) {
      return body;
    }
    final msg = (body is Map)
        ? (body['error'] ?? body['message'] ?? 'Upload failed')
        : 'Upload failed (${streamed.statusCode})';
    throw ApiException(msg.toString(), streamed.statusCode);
  }

  dynamic _handleResponse(http.Response response) {
    dynamic body;
    try {
      body = jsonDecode(response.body);
    } catch (_) {
      body = {'error': response.body};
    }
    if (response.statusCode >= 200 && response.statusCode < 300) {
      return body;
    }
    // Extract the most useful error message
    String msg = 'Request failed (${response.statusCode})';
    if (body is Map) {
      msg = body['error'] ??
          body['message'] ??
          body['details'] ??
          msg;
      // If details is a Map, stringify it
      if (msg is Map) msg = msg.toString();
    }
    throw ApiException(msg.toString(), response.statusCode);
  }
}

class ApiException implements Exception {
  final String message;
  final int statusCode;
  ApiException(this.message, this.statusCode);

  @override
  String toString() => message;
}

// Singleton instance
final apiService = ApiService();
