import 'package:flutter/material.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/reset_password_screen.dart';
import '../screens/faculty/faculty_dashboard_screen.dart';
import '../screens/student/student_dashboard_screen.dart';

class AppRoutes {
  static const String login = '/login';
  static const String resetPassword = '/reset-password';
  static const String facultyDashboard = '/faculty/dashboard';
  static const String studentDashboard = '/student/dashboard';

  static Map<String, WidgetBuilder> get routes => {
        login: (_) => const LoginScreen(),
        resetPassword: (_) => const ResetPasswordScreen(),
        facultyDashboard: (_) => const FacultyDashboardScreen(),
        studentDashboard: (_) => const StudentDashboardScreen(),
      };
}
