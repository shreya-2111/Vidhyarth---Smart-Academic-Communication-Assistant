import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'core/theme/app_theme.dart';
import 'providers/auth_provider.dart';
import 'routes/app_routes.dart';
import 'screens/auth/login_screen.dart';
import 'screens/faculty/faculty_dashboard_screen.dart';
import 'screens/student/student_dashboard_screen.dart';

void main() {
  runApp(
    ChangeNotifierProvider(
      create: (_) => AuthProvider(),
      child: const VidhyarthApp(),
    ),
  );
}

class VidhyarthApp extends StatelessWidget {
  const VidhyarthApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Vidhyarth',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      routes: AppRoutes.routes,
      home: const _SplashRouter(),
    );
  }
}

/// Handles auto-login on app start
class _SplashRouter extends StatefulWidget {
  const _SplashRouter();

  @override
  State<_SplashRouter> createState() => _SplashRouterState();
}

class _SplashRouterState extends State<_SplashRouter> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }

  Future<void> _checkAuth() async {
    final auth = context.read<AuthProvider>();
    try {
      await auth.tryAutoLogin();
      if (!mounted) return;
      
      if (auth.isLoggedIn) {
        final user = auth.user!;
        // If student hasn't reset password, clear cache and force fresh login
        if (user.isStudent && !user.isPasswordReset) {
          await auth.logout();
          if (mounted) {
            Navigator.pushReplacement(
              context,
              MaterialPageRoute(builder: (_) => const LoginScreen()),
            );
          }
          return;
        }
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => user.isFaculty
                ? const FacultyDashboardScreen()
                : const StudentDashboardScreen(),
          ),
        );
      } else {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const LoginScreen()),
        );
      }
    } catch (e) {
      print('Auto-login failed: $e');
      await auth.logout(); // Clear the corrupted data
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(builder: (_) => const LoginScreen()),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        body: Center(
          child: SvgPicture.asset(
            'assets/images/logo.svg',
            width: 150,
            height: 150,
          ),
        ),
      );
}
