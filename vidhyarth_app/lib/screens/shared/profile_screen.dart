import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabs;
  Map<String, dynamic> _stats = {};
  bool _loading = true;

  // Edit / password form
  final _editKey = GlobalKey<FormState>();
  final _passKey = GlobalKey<FormState>();
  final _phoneCtrl = TextEditingController();
  final _curPassCtrl = TextEditingController();
  final _newPassCtrl = TextEditingController();
  final _conPassCtrl = TextEditingController();
  bool _savingEdit = false;
  bool _savingPass = false;
  bool _showCur = false, _showNew = false, _showCon = false;

  @override
  void initState() {
    super.initState();
    _tabs = TabController(length: 3, vsync: this);
    _fetchStats();
  }

  @override
  void dispose() {
    _tabs.dispose();
    _phoneCtrl.dispose();
    _curPassCtrl.dispose();
    _newPassCtrl.dispose();
    _conPassCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchStats() async {
    final user = context.read<AuthProvider>().user!;
    try {
      final endpoint = user.isFaculty
          ? '/faculty/profile-stats'
          : '/student/profile-stats';
      final data = await apiService.get(endpoint);
      setState(() {
        _stats = Map<String, dynamic>.from(data);
        _loading = false;
      });
    } catch (_) {
      setState(() => _loading = false);
    }
  }

  Future<void> _saveProfile() async {
    if (!_editKey.currentState!.validate()) return;
    setState(() => _savingEdit = true);
    try {
      await apiService.put('/faculty/profile', {'phone': _phoneCtrl.text.trim()});
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile updated'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _savingEdit = false);
    }
  }

  Future<void> _changePassword() async {
    if (!_passKey.currentState!.validate()) return;
    setState(() => _savingPass = true);
    final user = context.read<AuthProvider>().user!;
    try {
      await apiService.post('/auth/reset-password', {
        'email': user.email,
        'currentPassword': _curPassCtrl.text,
        'newPassword': _newPassCtrl.text,
      });
      _curPassCtrl.clear();
      _newPassCtrl.clear();
      _conPassCtrl.clear();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Password changed successfully'), backgroundColor: Colors.green),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.toString()), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _savingPass = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = context.read<AuthProvider>().user!;
    final initials = user.fullName.isNotEmpty
        ? user.fullName.trim().split(' ').map((w) => w[0]).take(2).join().toUpperCase()
        : '?';

    return Column(
      children: [
        // ── Header gradient ──
        Container(
          width: double.infinity,
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 0),
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              colors: [Color(0xFF1E3A5F), Color(0xFF4F46E5)],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: Column(
            children: [
              // Avatar
              CircleAvatar(
                radius: 40,
                backgroundColor: Colors.white.withValues(alpha: 0.2),
                child: Text(
                  initials,
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Text(
                user.fullName,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                user.email,
                style: TextStyle(
                  color: Colors.white.withValues(alpha: 0.8),
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  user.isFaculty ? 'Faculty' : 'Student',
                  style: const TextStyle(color: Colors.white, fontSize: 12),
                ),
              ),
              const SizedBox(height: 16),

              // Tabs
              TabBar(
                controller: _tabs,
                indicatorColor: Colors.white,
                labelColor: Colors.white,
                unselectedLabelColor: Colors.white54,
                labelStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                tabs: const [
                  Tab(text: 'Overview'),
                  Tab(text: 'Edit Profile'),
                  Tab(text: 'Security'),
                ],
              ),
            ],
          ),
        ),

        // ── Tab content ──
        Expanded(
          child: TabBarView(
            controller: _tabs,
            children: [
              _OverviewTab(user: user, stats: _stats, loading: _loading),
              _EditTab(
                formKey: _editKey,
                phoneCtrl: _phoneCtrl,
                saving: _savingEdit,
                onSave: _saveProfile,
                user: user,
              ),
              _SecurityTab(
                formKey: _passKey,
                curCtrl: _curPassCtrl,
                newCtrl: _newPassCtrl,
                conCtrl: _conPassCtrl,
                showCur: _showCur,
                showNew: _showNew,
                showCon: _showCon,
                onToggleCur: () => setState(() => _showCur = !_showCur),
                onToggleNew: () => setState(() => _showNew = !_showNew),
                onToggleCon: () => setState(() => _showCon = !_showCon),
                saving: _savingPass,
                onSave: _changePassword,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// ── Overview Tab ──────────────────────────────────────────
class _OverviewTab extends StatelessWidget {
  final dynamic user;
  final Map<String, dynamic> stats;
  final bool loading;

  const _OverviewTab({required this.user, required this.stats, required this.loading});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Info cards
          _SectionTitle('Personal Information'),
          const SizedBox(height: 10),
          _InfoGrid(items: [
            _InfoItem('Full Name', user.fullName),
            _InfoItem(user.isFaculty ? 'Employee ID' : 'Student ID', '${user.id}'),
            _InfoItem('Email', user.email),
            _InfoItem('Department', user.department.isNotEmpty ? user.department : 'Msc.IT'),
            _InfoItem('Role', user.isFaculty ? 'Faculty' : 'Student'),
            _InfoItem('Phone', 'Not provided'),
          ]),

          const SizedBox(height: 20),
          _SectionTitle(user.isFaculty ? 'Academic Stats' : 'Performance Stats'),
          const SizedBox(height: 10),

          if (loading)
            const Center(child: CircularProgressIndicator())
          else
            user.isFaculty
                ? _FacultyStats(stats: stats)
                : _StudentStats(stats: stats),
        ],
      ),
    );
  }
}

class _FacultyStats extends StatelessWidget {
  final Map<String, dynamic> stats;
  const _FacultyStats({required this.stats});

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.6,
      children: [
        _StatCard('Subjects', '${stats['subjectsAssigned'] ?? 0}', Icons.menu_book, const Color(0xFF4F46E5)),
        _StatCard('Students', '${stats['totalStudents'] ?? 0}', Icons.people, const Color(0xFF0EA5E9)),
        _StatCard('Assignments', '${stats['assignmentsCreated'] ?? 0}', Icons.assignment, const Color(0xFFF59E0B)),
        _StatCard('Attendance Sessions', '${stats['attendanceSessions'] ?? 0}', Icons.how_to_reg, const Color(0xFF10B981)),
      ],
    );
  }
}

class _StudentStats extends StatelessWidget {
  final Map<String, dynamic> stats;
  const _StudentStats({required this.stats});

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 12,
      mainAxisSpacing: 12,
      childAspectRatio: 1.6,
      children: [
        _StatCard('Attendance', '${stats['overallAttendance'] ?? 0}%', Icons.bar_chart, const Color(0xFF10B981)),
        _StatCard('Assignments', '${stats['totalAssignments'] ?? 0}', Icons.assignment, const Color(0xFF4F46E5)),
        _StatCard('Submitted', '${stats['submittedAssignments'] ?? 0}', Icons.check_circle, const Color(0xFF0EA5E9)),
        _StatCard('Avg Marks', '${stats['averageMarks'] ?? 0}%', Icons.trending_up, const Color(0xFFF59E0B)),
      ],
    );
  }
}

// ── Edit Profile Tab ──────────────────────────────────────
class _EditTab extends StatelessWidget {
  final GlobalKey<FormState> formKey;
  final TextEditingController phoneCtrl;
  final bool saving;
  final VoidCallback onSave;
  final dynamic user;

  const _EditTab({
    required this.formKey,
    required this.phoneCtrl,
    required this.saving,
    required this.onSave,
    required this.user,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Form(
        key: formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _SectionTitle('Edit Profile'),
            const SizedBox(height: 16),
            _ReadOnlyField('Full Name', user.fullName),
            const SizedBox(height: 12),
            _ReadOnlyField('Email', user.email),
            const SizedBox(height: 12),
            _ReadOnlyField('Department', user.department.isNotEmpty ? user.department : 'Msc.IT'),
            const SizedBox(height: 12),
            TextFormField(
              controller: phoneCtrl,
              keyboardType: TextInputType.phone,
              decoration: _inputDec('Phone Number', Icons.phone),
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: saving ? null : onSave,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF1E3A5F),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: saving
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Save Changes', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Security Tab ──────────────────────────────────────────
class _SecurityTab extends StatelessWidget {
  final GlobalKey<FormState> formKey;
  final TextEditingController curCtrl, newCtrl, conCtrl;
  final bool showCur, showNew, showCon;
  final VoidCallback onToggleCur, onToggleNew, onToggleCon;
  final bool saving;
  final VoidCallback onSave;

  const _SecurityTab({
    required this.formKey,
    required this.curCtrl,
    required this.newCtrl,
    required this.conCtrl,
    required this.showCur,
    required this.showNew,
    required this.showCon,
    required this.onToggleCur,
    required this.onToggleNew,
    required this.onToggleCon,
    required this.saving,
    required this.onSave,
  });

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Form(
        key: formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _SectionTitle('Change Password'),
            const SizedBox(height: 16),
            _PassField('Current Password', curCtrl, showCur, onToggleCur,
                validator: (v) => v!.isEmpty ? 'Required' : null),
            const SizedBox(height: 12),
            _PassField('New Password', newCtrl, showNew, onToggleNew,
                validator: (v) => v!.length < 6 ? 'Min 6 characters' : null),
            const SizedBox(height: 12),
            _PassField('Confirm Password', conCtrl, showCon, onToggleCon,
                validator: (v) => v != newCtrl.text ? 'Passwords do not match' : null),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 48,
              child: ElevatedButton(
                onPressed: saving ? null : onSave,
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF4F46E5),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                child: saving
                    ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : const Text('Update Password', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Shared small widgets ──────────────────────────────────

class _SectionTitle extends StatelessWidget {
  final String text;
  const _SectionTitle(this.text);

  @override
  Widget build(BuildContext context) => Text(
        text,
        style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Color(0xFF1E3A5F)),
      );
}

class _InfoGrid extends StatelessWidget {
  final List<_InfoItem> items;
  const _InfoGrid({required this.items});

  @override
  Widget build(BuildContext context) {
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      childAspectRatio: 2.2,
      children: items.map((item) => Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.grey.shade200),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 4)],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(item.label, style: const TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.w500)),
            const SizedBox(height: 3),
            Text(item.value, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: Color(0xFF1E3A5F)),
                maxLines: 1, overflow: TextOverflow.ellipsis),
          ],
        ),
      )).toList(),
    );
  }
}

class _InfoItem {
  final String label, value;
  const _InfoItem(this.label, this.value);
}

class _StatCard extends StatelessWidget {
  final String label, value;
  final IconData icon;
  final Color color;
  const _StatCard(this.label, this.value, this.icon, this.color);

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: color.withValues(alpha: 0.2)),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 4)],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: color.withValues(alpha: 0.1), shape: BoxShape.circle),
              child: Icon(icon, color: color, size: 18),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
                  Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey), maxLines: 1, overflow: TextOverflow.ellipsis),
                ],
              ),
            ),
          ],
        ),
      );
}

Widget _ReadOnlyField(String label, String value) => TextFormField(
      initialValue: value,
      readOnly: true,
      decoration: _inputDec(label, null).copyWith(
        filled: true,
        fillColor: const Color(0xFFF5F5F5),
      ),
      style: const TextStyle(color: Colors.grey),
    );

Widget _PassField(String label, TextEditingController ctrl, bool show, VoidCallback toggle,
    {String? Function(String?)? validator}) =>
    TextFormField(
      controller: ctrl,
      obscureText: !show,
      validator: validator,
      decoration: _inputDec(label, Icons.lock_outline).copyWith(
        suffixIcon: IconButton(
          icon: Icon(show ? Icons.visibility_off : Icons.visibility, size: 18, color: Colors.grey),
          onPressed: toggle,
        ),
      ),
    );

InputDecoration _inputDec(String label, IconData? icon) => InputDecoration(
      labelText: label,
      prefixIcon: icon != null ? Icon(icon, size: 18, color: Colors.grey) : null,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
      enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: BorderSide(color: Colors.grey.shade300)),
      focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(10),
          borderSide: const BorderSide(color: Color(0xFF4F46E5))),
      contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
    );
