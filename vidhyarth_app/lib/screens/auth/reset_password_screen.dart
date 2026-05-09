import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../routes/app_routes.dart';

class ResetPasswordScreen extends StatelessWidget {
  const ResetPasswordScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.read<AuthProvider>().user;

    return Scaffold(
      backgroundColor: const Color(0xFFF5F7FA),
      body: SafeArea(
        child: Column(
          children: [
            // ── Top bar with back arrow ──
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              child: Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.arrow_back_ios_new_rounded,
                        color: Color(0xFF1E3A5F), size: 20),
                    onPressed: () async {
                      // Logout and go back to login
                      await context.read<AuthProvider>().logout();
                      if (context.mounted) {
                        Navigator.pushReplacementNamed(
                            context, AppRoutes.login);
                      }
                    },
                  ),
                  const Text(
                    'Back to Login',
                    style: TextStyle(
                      color: Color(0xFF1E3A5F),
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),

            // ── Main content ──
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 28),
                child: Column(
                  children: [
                    const SizedBox(height: 32),

                    // Lock icon with circle background
                    Container(
                      width: 100,
                      height: 100,
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: const Color(0xFF1E3A5F).withValues(alpha: 0.08),
                      ),
                      child: const Icon(
                        Icons.lock_outline_rounded,
                        size: 52,
                        color: Color(0xFF1E3A5F),
                      ),
                    ),

                    const SizedBox(height: 28),

                    // Title
                    const Text(
                      'Update Your Password',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: Color(0xFF1E3A5F),
                      ),
                    ),

                    const SizedBox(height: 12),

                    // Subtitle
                    Text(
                      'Hi ${user?.fullName ?? 'Student'},',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF4F46E5),
                      ),
                    ),

                    const SizedBox(height: 16),

                    // Info card
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.all(20),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.06),
                            blurRadius: 16,
                            offset: const Offset(0, 4),
                          ),
                        ],
                      ),
                      child: Column(
                        children: [
                          // Step indicator
                          _StepRow(
                            step: '1',
                            icon: Icons.language_rounded,
                            color: const Color(0xFF4F46E5),
                            text: 'Open Vidhyarth on your web browser',
                          ),
                          const _Divider(),
                          _StepRow(
                            step: '2',
                            icon: Icons.login_rounded,
                            color: const Color(0xFF0EA5E9),
                            text:
                                'Login with your current ID and password',
                          ),
                          const _Divider(),
                          _StepRow(
                            step: '3',
                            icon: Icons.lock_reset_rounded,
                            color: const Color(0xFF10B981),
                            text:
                                'Update your password on the website',
                          ),
                          const _Divider(),
                          _StepRow(
                            step: '4',
                            icon: Icons.phone_android_rounded,
                            color: const Color(0xFFF59E0B),
                            text:
                                'Come back here and login with your new credentials',
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 24),

                    // Warning banner
                    Container(
                      width: double.infinity,
                      padding: const EdgeInsets.symmetric(
                          horizontal: 16, vertical: 14),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFFF7ED),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(
                            color: const Color(0xFFFED7AA), width: 1),
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(Icons.info_outline_rounded,
                              color: Color(0xFFF59E0B), size: 20),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Text(
                              'For security, your password must be updated on the website before you can use the app.',
                              style: TextStyle(
                                fontSize: 13,
                                color: Colors.orange.shade800,
                                height: 1.4,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),

                    const SizedBox(height: 32),

                    // Back to login button
                    SizedBox(
                      width: double.infinity,
                      height: 50,
                      child: ElevatedButton.icon(
                        onPressed: () async {
                          await context.read<AuthProvider>().logout();
                          if (context.mounted) {
                            Navigator.pushReplacementNamed(
                                context, AppRoutes.login);
                          }
                        },
                        icon: const Icon(Icons.arrow_back_rounded, size: 18),
                        label: const Text(
                          'Back to Login',
                          style: TextStyle(
                              fontSize: 15, fontWeight: FontWeight.w600),
                        ),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF1E3A5F),
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12)),
                          elevation: 0,
                        ),
                      ),
                    ),

                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Step row widget ──
class _StepRow extends StatelessWidget {
  final String step;
  final IconData icon;
  final Color color;
  final String text;

  const _StepRow({
    required this.step,
    required this.icon,
    required this.color,
    required this.text,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          // Step number circle
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: color.withValues(alpha: 0.12),
            ),
            child: Center(
              child: Icon(icon, size: 17, color: color),
            ),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 14,
                color: Color(0xFF374151),
                height: 1.4,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Thin divider ──
class _Divider extends StatelessWidget {
  const _Divider();

  @override
  Widget build(BuildContext context) {
    return const Divider(height: 1, color: Color(0xFFF3F4F6));
  }
}
