import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../providers/auth_provider.dart';
import '../../routes/app_routes.dart';
import '../../services/api_service.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  late PageController _pageController;
  int _currentTab = 0;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _tabController = TabController(length: 2, vsync: this);

    // Tab → Page
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) return;
      _pageController.animateToPage(
        _tabController.index,
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeInOut,
      );
      setState(() => _currentTab = _tabController.index);
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _pageController.dispose();
    super.dispose();
  }

  void _goToTab(int index) {
    _tabController.animateTo(index);
    _pageController.animateToPage(
      index,
      duration: const Duration(milliseconds: 350),
      curve: Curves.easeInOut,
    );
    setState(() => _currentTab = index);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF2196F3),
      body: Center(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 28, vertical: 40),
          child: Container(
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(16),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.18),
                  blurRadius: 28,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const SizedBox(height: 24),

                // ── Logo ──
                Container(
                  width: 70,
                  height: 70,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    border: Border.all(color: const Color(0xFF1565C0), width: 2.5),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Padding(
                        padding: const EdgeInsets.all(4.0),
                        child: SvgPicture.asset(
                          'assets/images/logo.svg',
                          width: 26,
                          height: 26,
                        ),
                      ),
                      const SizedBox(height: 2),
                      Text('VIDHYARTH',
                          style: TextStyle(
                              fontSize: 6.5,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1565C0),
                              letterSpacing: 0.5)),
                    ],
                  ),
                ),

                const SizedBox(height: 10),
                const Text('Vidhyarth',
                    style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                        color: Colors.black87)),
                const SizedBox(height: 14),

                // ── Tabs ──
                TabBar(
                  controller: _tabController,
                  labelColor: const Color(0xFF1565C0),
                  unselectedLabelColor: Colors.grey,
                  indicatorColor: const Color(0xFF1565C0),
                  indicatorWeight: 2.5,
                  labelStyle: const TextStyle(
                      fontWeight: FontWeight.w600, fontSize: 14),
                  tabs: const [Tab(text: 'Sign In'), Tab(text: 'Sign Up')],
                ),

                // ── Sliding page content ──
                // Use a fixed height that fits the taller form (Sign Up)
                AnimatedContainer(
                  duration: const Duration(milliseconds: 350),
                  curve: Curves.easeInOut,
                  height: _currentTab == 0 ? 230 : 420,
                  clipBehavior: Clip.hardEdge,
                  decoration: const BoxDecoration(),
                  child: PageView(
                    controller: _pageController,
                    physics: const NeverScrollableScrollPhysics(),
                    onPageChanged: (i) {
                      _tabController.animateTo(i);
                      setState(() => _currentTab = i);
                    },
                    children: [
                      _SignInForm(key: const ValueKey('signin')),
                      _SignUpForm(
                        key: const ValueKey('signup'),
                        onSwitchToSignIn: () => _goToTab(0),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════
//  SIGN IN
// ══════════════════════════════════════════
class _SignInForm extends StatefulWidget {
  const _SignInForm({super.key});

  @override
  State<_SignInForm> createState() => _SignInFormState();
}

class _SignInFormState extends State<_SignInForm> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();
  bool _obscure = true;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;
    final auth = context.read<AuthProvider>();
    final ok = await auth.login(_emailCtrl.text.trim(), _passCtrl.text);
    if (!mounted) return;
    if (ok) {
      final user = auth.user!;
      if (user.isStudent && !user.isPasswordReset) {
        Navigator.pushReplacementNamed(context, AppRoutes.resetPassword);
        return;
      }
      Navigator.pushReplacementNamed(
        context,
        user.isFaculty ? AppRoutes.facultyDashboard : AppRoutes.studentDashboard,
      );
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(auth.error ?? 'Login failed'),
            backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final loading = context.watch<AuthProvider>().loading;
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 0),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            _Field(
              controller: _emailCtrl,
              hint: 'xyz@gmail.com',
              keyboardType: TextInputType.emailAddress,
              validator: (v) =>
                  v == null || !v.contains('@') ? 'Enter valid email' : null,
            ),
            const SizedBox(height: 12),
            _Field(
              controller: _passCtrl,
              hint: '••••••••••',
              obscure: _obscure,
              suffixIcon: IconButton(
                icon: Icon(
                    _obscure ? Icons.visibility_off : Icons.visibility,
                    size: 18,
                    color: Colors.grey),
                onPressed: () => setState(() => _obscure = !_obscure),
              ),
              validator: (v) =>
                  v == null || v.isEmpty ? 'Enter password' : null,
            ),
            const SizedBox(height: 20),
            _PrimaryButton(
              label: 'Sign In',
              loading: loading,
              onPressed: _login,
            ),
          ],
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════
//  SIGN UP
// ══════════════════════════════════════════
class _SignUpForm extends StatefulWidget {
  final VoidCallback onSwitchToSignIn;
  const _SignUpForm({super.key, required this.onSwitchToSignIn});

  @override
  State<_SignUpForm> createState() => _SignUpFormState();
}

class _SignUpFormState extends State<_SignUpForm> {
  final _formKey = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _passCtrl = TextEditingController();

  List<Map<String, dynamic>> _classes = [];
  String? _selectedClassId;
  bool _loadingClasses = true;
  bool _submitting = false;
  String? _classError;

  @override
  void initState() {
    super.initState();
    _loadClasses();
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    _passCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadClasses() async {
    try {
      final data = await apiService.get('/public/classes') as List;
      setState(() {
        _classes = data.cast<Map<String, dynamic>>();
        _loadingClasses = false;
        _classError =
            data.isEmpty ? 'No classes available. Contact admin.' : null;
      });
    } catch (_) {
      setState(() {
        _loadingClasses = false;
        _classError = 'No classes available. Contact admin.';
      });
    }
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedClassId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select your class')),
      );
      return;
    }
    setState(() => _submitting = true);
    try {
      final cls = _classes
          .firstWhere((c) => c['class_id'].toString() == _selectedClassId);
      await apiService.post('/auth/register', {
        'fullName': _nameCtrl.text.trim(),
        'email': _emailCtrl.text.trim(),
        'password': _passCtrl.text,
        'class': cls['class_name'],
        'userType': 'student',
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
              content: Text('Account created! Please sign in.'),
              backgroundColor: Colors.green),
        );
        widget.onSwitchToSignIn();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 0),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // ── Banner ──
            Container(
              width: double.infinity,
              padding:
                  const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                    colors: [Color(0xFF7B2FF7), Color(0xFF2196F3)]),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Column(
                children: [
                  Text('Student Registration',
                      style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 14)),
                  SizedBox(height: 2),
                  Text('Faculty accounts are created by Admin',
                      style:
                          TextStyle(color: Colors.white70, fontSize: 10.5)),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // ── Full Name ──
            _Field(
              controller: _nameCtrl,
              hint: 'Full Name',
              validator: (v) => v == null || v.isEmpty ? 'Required' : null,
            ),
            const SizedBox(height: 10),

            // ── Email ──
            _Field(
              controller: _emailCtrl,
              hint: 'Email Address',
              keyboardType: TextInputType.emailAddress,
              validator: (v) =>
                  v == null || !v.contains('@') ? 'Enter valid email' : null,
            ),
            const SizedBox(height: 10),

            // ── Class Dropdown ──
            if (_loadingClasses)
              const SizedBox(
                height: 46,
                child: Center(
                    child: SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(strokeWidth: 2))),
              )
            else
              DropdownButtonFormField<String>(
                value: _selectedClassId,
                isExpanded: true,
                decoration: _dec('Select Your Class *'),
                items: _classes
                    .map((c) => DropdownMenuItem(
                          value: c['class_id'].toString(),
                          child: Text(
                              '${c['class_name']} - ${c['semester']}',
                              style: const TextStyle(fontSize: 13)),
                        ))
                    .toList(),
                onChanged: (v) => setState(() => _selectedClassId = v),
              ),

            if (_classError != null)
              Align(
                alignment: Alignment.centerLeft,
                child: Padding(
                  padding: const EdgeInsets.only(top: 4),
                  child: Text(_classError!,
                      style: const TextStyle(
                          color: Colors.red, fontSize: 11)),
                ),
              ),
            const SizedBox(height: 10),

            // ── Password ──
            _Field(
              controller: _passCtrl,
              hint: 'Password',
              obscure: true,
              validator: (v) =>
                  v == null || v.length < 6 ? 'Min 6 characters' : null,
            ),
            const SizedBox(height: 16),

            // ── Button ──
            _PrimaryButton(
              label: 'Create Student Account',
              loading: _submitting,
              onPressed: _register,
            ),
          ],
        ),
      ),
    );
  }
}

// ══════════════════════════════════════════
//  SHARED WIDGETS
// ══════════════════════════════════════════

class _Field extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final bool obscure;
  final TextInputType? keyboardType;
  final Widget? suffixIcon;
  final String? Function(String?)? validator;

  const _Field({
    required this.controller,
    required this.hint,
    this.obscure = false,
    this.keyboardType,
    this.suffixIcon,
    this.validator,
  });

  @override
  Widget build(BuildContext context) => TextFormField(
        controller: controller,
        obscureText: obscure,
        keyboardType: keyboardType,
        style: const TextStyle(fontSize: 14),
        decoration: _dec(hint).copyWith(suffixIcon: suffixIcon),
        validator: validator,
      );
}

class _PrimaryButton extends StatelessWidget {
  final String label;
  final bool loading;
  final VoidCallback onPressed;

  const _PrimaryButton({
    required this.label,
    required this.loading,
    required this.onPressed,
  });

  @override
  Widget build(BuildContext context) => SizedBox(
        width: double.infinity,
        height: 46,
        child: ElevatedButton(
          onPressed: loading ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF1976D2),
            shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8)),
            elevation: 0,
          ),
          child: loading
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                      color: Colors.white, strokeWidth: 2))
              : Text(label,
                  style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.white)),
        ),
      );
}

InputDecoration _dec(String hint) => InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: Colors.grey, fontSize: 13),
      filled: true,
      fillColor: const Color(0xFFF5F5F5),
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 14, vertical: 13),
      border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide.none),
      enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.grey.shade200)),
      focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Color(0xFF1976D2))),
      errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Colors.red)),
      focusedErrorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Colors.red)),
    );
