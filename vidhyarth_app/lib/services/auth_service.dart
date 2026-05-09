import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants/app_constants.dart';
import '../models/user_model.dart';
import 'api_service.dart';

class AuthService {
  UserModel? _currentUser;
  String? _token;

  UserModel? get currentUser => _currentUser;
  String? get token => _token;
  bool get isLoggedIn => _token != null && _currentUser != null;

  /// Login and persist token + user
  Future<UserModel> login(String email, String password) async {
    final data = await apiService.post('/auth/login', {
      'email': email,
      'password': password,
    });

    _token = data['token'];
    _currentUser = UserModel.fromJson(data['user']);
    apiService.setToken(_token!);

    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(AppConstants.tokenKey, _token!);
    await prefs.setString(
        AppConstants.userKey, jsonEncode(_currentUser!.toJson()));

    return _currentUser!;
  }

  /// Auto-login from stored token
  Future<UserModel?> tryAutoLogin() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString(AppConstants.tokenKey);
    final userJson = prefs.getString(AppConstants.userKey);

    if (_token == null || userJson == null) return null;

    _currentUser = UserModel.fromJson(jsonDecode(userJson));
    apiService.setToken(_token!);
    return _currentUser;
  }

  /// Reset password (student first-login)
  Future<void> resetPassword(
      String email, String currentPassword, String newPassword) async {
    await apiService.post('/auth/reset-password', {
      'email': email,
      'currentPassword': currentPassword,
      'newPassword': newPassword,
    });
  }

  /// Logout
  Future<void> logout() async {
    _token = null;
    _currentUser = null;
    apiService.clearToken();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(AppConstants.tokenKey);
    await prefs.remove(AppConstants.userKey);
  }
}

// Singleton
final authService = AuthService();
