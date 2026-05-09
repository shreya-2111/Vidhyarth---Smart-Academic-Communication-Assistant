import 'dart:async';
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:qr_flutter/qr_flutter.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/date_utils.dart';
import '../../services/api_service.dart';
import '../../widgets/empty_state_widget.dart';
import '../../widgets/error_widget.dart';
import '../../widgets/loading_widget.dart';

class AttendanceScreen extends StatefulWidget {
  final int userId;
  final bool isStudent;
  const AttendanceScreen(
      {super.key, required this.userId, this.isStudent = false});
  @override
  State<AttendanceScreen> createState() => _AttendanceScreenState();
}

class _AttendanceScreenState extends State<AttendanceScreen> {
  // ── Dropdown data ──────────────────────────────────────
  List<Map<String, dynamic>> _classes = [];   // {class_id, class_name, semester}
  List<String> _subjects = [];
  List<String> _divisions = [];

  // ── Selections ─────────────────────────────────────────
  Map<String, dynamic>? _selClass;
  String? _selSubject;
  String? _selDivision;
  String _selDate = DateFormat('yyyy-MM-dd').format(DateTime.now());

  // ── Data ───────────────────────────────────────────────
  List<Map<String, dynamic>> _students = [];
  Map<int, String> _attendance = {};
  List<Map<String, dynamic>> _analytics = [];
  List<Map<String, dynamic>> _absentees = [];
  Map<String, dynamic> _todayStats = {'present': 0, 'absent': 0};

  bool _loading = true;
  bool _loadingStudents = false;
  bool _saving = false;
  String? _error;

  // ── Student view ───────────────────────────────────────
  Map<String, dynamic>? _studentData;

  @override
  void initState() {
    super.initState();
    widget.isStudent ? _loadStudentView() : _initFaculty();
  }

  // ══════════════════════════════════════════════════════
  //  STUDENT
  // ══════════════════════════════════════════════════════
  Future<void> _loadStudentView() async {
    setState(() { _loading = true; _error = null; });
    try {
      final d = await apiService.get('/student/attendance/${widget.userId}');
      setState(() { _studentData = d; _loading = false; });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  // ══════════════════════════════════════════════════════
  //  FACULTY – init
  // ══════════════════════════════════════════════════════
  Future<void> _initFaculty() async {
    setState(() { _loading = true; _error = null; });
    try {
      final raw = await apiService.get('/attendance/faculty/classes') as List;
      // Each entry has unique class_id — no dedup needed
      final classes = raw.cast<Map<String, dynamic>>();
      setState(() { _classes = classes; _loading = false; });
      if (classes.isNotEmpty) await _onClassChanged(classes[0]);
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Future<void> _onClassChanged(Map<String, dynamic> cls) async {
    setState(() {
      _selClass = cls;
      _subjects = [];
      _divisions = [];
      _selSubject = null;
      _selDivision = null;
      _students = [];
      _attendance = {};
    });
    final classId = cls['class_id']?.toString() ?? '';
    final cn = cls['class_name'] as String;
    await Future.wait([
      _loadSubjectsByClassId(classId),
      _loadDivisionsByClassId(classId),
      _loadStats(cn),
    ]);
  }

  Future<void> _loadSubjectsByClassId(String classId) async {
    try {
      final d = await apiService.get('/attendance/faculty/subjects/byid/$classId') as List;
      final subs = d.map((e) => (e['subject_name'] ?? e.toString()) as String).toList();
      setState(() {
        _subjects = subs;
        _selSubject = subs.isNotEmpty ? subs[0] : null;
      });
      await _loadStudents();
    } catch (_) {}
  }

  Future<void> _loadDivisionsByClassId(String classId) async {
    try {
      final d = await apiService.get('/attendance/divisions/byid/$classId') as List;
      setState(() {
        _divisions = d.map((e) => e.toString()).toList();
        _selDivision = null;
      });
    } catch (_) {}
  }

  Future<void> _loadStudents() async {
    if (_selClass == null) return;
    setState(() { _loadingStudents = true; });
    final classId = _selClass!['class_id']?.toString() ?? '';
    final cn = _selClass!['class_name'] as String;
    try {
      String ep = '/attendance/students/byid/$classId';
      if (_selDivision != null) ep += '?division=$_selDivision';
      final raw = await apiService.get(ep) as List;
      final students = raw.cast<Map<String, dynamic>>();

      // Load existing attendance for date
      Map<int, String> existing = {};
      try {
        String dep = '/attendance/date/$_selDate/$cn';
        if (_selDivision != null) dep += '?division=$_selDivision';
        final att = await apiService.get(dep) as List;
        for (final a in att) {
          existing[a['student_id'] as int] = a['status'] as String;
        }
      } catch (_) {}

      setState(() {
        _students = students;
        _attendance = {
          for (final s in students)
            s['student_id'] as int:
                existing[s['student_id'] as int] ?? 'Present'
        };
        _loadingStudents = false;
      });
      await _loadAnalytics(cn);
      await _loadAbsentees(cn);
    } catch (_) {
      setState(() => _loadingStudents = false);
    }
  }

  Future<void> _loadStats(String cn) async {
    try {
      final d = await apiService.get('/attendance/stats/today/$cn');
      setState(() => _todayStats = d);
    } catch (_) {}
  }

  Future<void> _loadAnalytics(String cn) async {
    try {
      final d = await apiService.get('/attendance/analytics/$cn') as List;
      setState(() => _analytics = d.cast<Map<String, dynamic>>());
    } catch (_) {}
  }

  Future<void> _loadAbsentees(String cn) async {
    try {
      final d = await apiService.get('/attendance/absentees/$cn') as List;
      setState(() => _absentees = d.cast<Map<String, dynamic>>());
    } catch (_) {}
  }

  Future<void> _save() async {
    if (_selClass == null || _selSubject == null) return;
    setState(() => _saving = true);
    try {
      await apiService.post('/attendance/save', {
        'date': _selDate,
        'subject': _selSubject,
        'className': _selClass!['class_name'],
        'attendance': _attendance.map((k, v) => MapEntry(k.toString(), v)),
        if (_selDivision != null) 'division': _selDivision,
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Attendance saved'), backgroundColor: AppTheme.success));
      }
      final cn = _selClass!['class_name'] as String;
      await Future.wait([_loadStats(cn), _loadAnalytics(cn), _loadAbsentees(cn)]);
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.toString()), backgroundColor: AppTheme.error));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  void _markAllPresent() => setState(() {
        for (final id in _attendance.keys) _attendance[id] = 'Present';
      });

  void _showQr() {
    if (_selClass == null || _selSubject == null) {
      ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Select class and subject first')));
      return;
    }
    showDialog(
      context: context,
      builder: (_) => _QrDialog(
        className: _selClass!['class_name'] as String,
        subject: _selSubject!,
        date: _selDate,
        facultyId: widget.userId,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (widget.isStudent) return _buildStudentView();
    if (_loading) return const LoadingWidget();
    if (_error != null) return AppErrorWidget(message: _error!, onRetry: _initFaculty);
    return _buildFacultyView();
  }

  // ══════════════════════════════════════════════════════
  //  FACULTY VIEW
  // ══════════════════════════════════════════════════════
  Widget _buildFacultyView() {
    final present = (_todayStats['present'] ?? 0) as num;
    final absent = (_todayStats['absent'] ?? 0) as num;
    final total = present + absent;
    final rate = total > 0 ? (present / total * 100).round() : 0;

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      body: RefreshIndicator(
        onRefresh: _initFaculty,
        child: ListView(
          padding: const EdgeInsets.all(14),
          children: [
            // ── Header ──
            Row(children: [
              const Expanded(child: Text('📋 Attendance Management',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold))),
              _headerBtn('QR', Icons.qr_code, const Color(0xFF7C3AED), _showQr),
              const SizedBox(width: 8),
              _headerBtn('Mark All', Icons.check_circle, AppTheme.success, _markAllPresent),
            ]),
            const SizedBox(height: 12),

            // ── Stats ──
            Row(children: [
              _StatBox('Present Today', '$present', Colors.green, const Color(0xFFE8F5E9)),
              const SizedBox(width: 8),
              _StatBox('Absent Today', '$absent', Colors.red, const Color(0xFFFFEBEE)),
              const SizedBox(width: 8),
              _StatBox('Rate', '$rate%', AppTheme.primary, const Color(0xFFE3F2FD)),
            ]),
            const SizedBox(height: 14),

            // ── Filters ──
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(children: [
                // Row 1: Class + Subject
                Row(children: [
                  Expanded(child: _dropdownField(
                    label: 'Select Class *',
                    value: _selClass?['class_id']?.toString(),
                    items: _classes.map((c) => DropdownMenuItem<String>(
                      value: c['class_id']?.toString(),
                      child: Text('${c['class_name']} - ${c['semester']}',
                          style: const TextStyle(fontSize: 12),
                          overflow: TextOverflow.ellipsis),
                    )).toList(),
                    onChanged: (v) {
                      final cls = _classes.firstWhere((c) => c['class_id']?.toString() == v);
                      _onClassChanged(cls);
                    },
                  )),
                  const SizedBox(width: 10),
                  Expanded(child: _dropdownField(
                    label: 'Select Subject *',
                    value: _subjects.contains(_selSubject) ? _selSubject : null,
                    items: _subjects.map((s) => DropdownMenuItem<String>(
                      value: s,
                      child: Text(s, style: const TextStyle(fontSize: 12),
                          overflow: TextOverflow.ellipsis),
                    )).toList(),
                    onChanged: (v) {
                      setState(() => _selSubject = v);
                      _loadStudents();
                    },
                  )),
                ]),
                const SizedBox(height: 10),
                // Row 2: Date + Division
                Row(children: [
                  Expanded(child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Date', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                      const SizedBox(height: 4),
                      GestureDetector(
                        onTap: () async {
                          final d = await showDatePicker(
                            context: context,
                            initialDate: DateTime.now(),
                            firstDate: DateTime.now().subtract(const Duration(days: 60)),
                            lastDate: DateTime.now(),
                          );
                          if (d != null) {
                            setState(() => _selDate = DateFormat('yyyy-MM-dd').format(d));
                            _loadStudents();
                          }
                        },
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                          decoration: BoxDecoration(
                            color: const Color(0xFFF5F5F5),
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.grey.shade300),
                          ),
                          child: Row(children: [
                            Expanded(child: Text(
                              DateFormat('dd-MM-yyyy').format(DateTime.parse(_selDate)),
                              style: const TextStyle(fontSize: 12),
                            )),
                            const Icon(Icons.calendar_today, size: 14, color: Colors.grey),
                          ]),
                        ),
                      ),
                    ],
                  )),
                  const SizedBox(width: 10),
                  Expanded(child: _dropdownField(
                    label: 'Division',
                    value: _selDivision,
                    items: [
                      const DropdownMenuItem<String>(value: null, child: Text('All', style: TextStyle(fontSize: 12))),
                      ..._divisions.map((d) => DropdownMenuItem<String>(
                        value: d,
                        child: Text('Div $d', style: const TextStyle(fontSize: 12)),
                      )),
                    ],
                    onChanged: (v) {
                      setState(() => _selDivision = v);
                      _loadStudents();
                    },
                  )),
                ]),
              ]),
            ),
            const SizedBox(height: 14),

            // ── Class label ──
            if (_selClass != null)
              Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(children: [
                  Expanded(child: Text(
                    'Class: ${_selClass!['class_name']}'
                    '${_selDivision != null ? ' - Div $_selDivision' : ''}'
                    '${_selSubject != null ? ' - $_selSubject' : ''}',
                    style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                  )),
                  Text('${_students.length} Students',
                      style: const TextStyle(color: Colors.grey, fontSize: 12)),
                ]),
              ),

            // ── Student list ──
            if (_loadingStudents)
              const Center(child: Padding(
                padding: EdgeInsets.all(20),
                child: CircularProgressIndicator(),
              ))
            else if (_students.isEmpty)
              const EmptyStateWidget(message: 'No students found')
            else
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Column(children: [
                  // Header row
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade50,
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(10)),
                      border: Border(bottom: BorderSide(color: Colors.grey.shade200)),
                    ),
                    child: const Row(children: [
                      SizedBox(width: 36),
                      SizedBox(width: 8),
                      Expanded(flex: 3, child: Text('STUDENT', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey))),
                      SizedBox(width: 40, child: Text('ROLL', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey))),
                      SizedBox(width: 110, child: Text('ATTENDANCE', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey))),
                      SizedBox(width: 36, child: Text('OVR', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey))),
                    ]),
                  ),
                  ..._students.map((s) {
                    final id = s['student_id'] as int;
                    final status = _attendance[id] ?? 'Present';
                    final name = s['name'] as String? ?? '';
                    final initials = name.trim().split(' ').take(2)
                        .map((w) => w.isNotEmpty ? w[0] : '').join().toUpperCase();
                    final analytic = _analytics.where((a) => a['student_id'] == id).firstOrNull;
                    final pct = num.tryParse(analytic?['attendance_percentage']?.toString() ?? '0') ?? 0;

                    return Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        border: Border(bottom: BorderSide(color: Colors.grey.shade100)),
                      ),
                      child: Row(children: [
                        CircleAvatar(
                          radius: 16,
                          backgroundColor: _avatarColor(name),
                          child: Text(initials, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
                        ),
                        const SizedBox(width: 8),
                        Expanded(flex: 3, child: Text(name,
                            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
                            overflow: TextOverflow.ellipsis)),
                        SizedBox(width: 40, child: Text('${s['roll_no'] ?? '-'}',
                            style: const TextStyle(fontSize: 11, color: Colors.grey))),
                        SizedBox(width: 110, child: Row(children: [
                          _AttBtn(label: 'P', active: status == 'Present', color: Colors.green,
                              onTap: () => setState(() => _attendance[id] = 'Present')),
                          const SizedBox(width: 4),
                          _AttBtn(label: 'A', active: status == 'Absent', color: Colors.red,
                              onTap: () => setState(() => _attendance[id] = 'Absent')),
                        ])),
                        SizedBox(width: 36, child: Text('$pct%',
                            style: TextStyle(
                                fontSize: 10,
                                color: pct < 75 ? Colors.red : Colors.green,
                                fontWeight: FontWeight.w600))),
                      ]),
                    );
                  }),
                ]),
              ),

            const SizedBox(height: 14),

            // ── Save button ──
            if (_students.isNotEmpty)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _saving ? null : _save,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: _saving
                      ? const SizedBox(width: 20, height: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                      : const Text('Save Attendance',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
                ),
              ),

            const SizedBox(height: 20),

            // ── Frequent Absentees ──
            if (_absentees.isNotEmpty) ...[
              const Text('🔴 Frequent Absentees (Below 80%)',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Column(children: _absentees.map((a) {
                  final name = a['name'] as String? ?? '';
                  final pct = num.tryParse(a['attendance_percentage']?.toString() ?? '0') ?? 0;
                  return ListTile(
                    dense: true,
                    leading: CircleAvatar(radius: 16, backgroundColor: _avatarColor(name),
                        child: Text(name.isNotEmpty ? name[0].toUpperCase() : '?',
                            style: const TextStyle(color: Colors.white, fontSize: 12))),
                    title: Text(name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                    subtitle: Text('Roll: ${a['roll_no'] ?? '-'}', style: const TextStyle(fontSize: 11)),
                    trailing: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(color: Colors.red, borderRadius: BorderRadius.circular(12)),
                      child: Text('$pct%', style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold)),
                    ),
                  );
                }).toList()),
              ),
              const SizedBox(height: 14),
            ],

            // ── Insights ──
            if (_analytics.isNotEmpty) ...[
              const Text('📊 Attendance Insights',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
              const SizedBox(height: 8),
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.grey.shade200),
                ),
                child: Column(children: [
                  _insightRow('Excellent (≥85%)',
                      _analytics.where((a) => (num.tryParse(a['attendance_percentage']?.toString() ?? '0') ?? 0) >= 85).length,
                      Colors.green),
                  _insightRow('Good (75-84%)',
                      _analytics.where((a) { final p = num.tryParse(a['attendance_percentage']?.toString() ?? '0') ?? 0; return p >= 75 && p < 85; }).length,
                      Colors.blue),
                  _insightRow('Needs Attention (<75%)',
                      _analytics.where((a) => (num.tryParse(a['attendance_percentage']?.toString() ?? '0') ?? 0) < 75).length,
                      Colors.red),
                ]),
              ),
              const SizedBox(height: 20),
            ],
          ],
        ),
      ),
    );
  }

  Widget _headerBtn(String label, IconData icon, Color color, VoidCallback onTap) =>
      ElevatedButton.icon(
        onPressed: onTap,
        icon: Icon(icon, size: 14),
        label: Text(label, style: const TextStyle(fontSize: 12)),
        style: ElevatedButton.styleFrom(
          backgroundColor: color, foregroundColor: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
        ),
      );

  Widget _dropdownField<T>({
    required String label,
    required T? value,
    required List<DropdownMenuItem<T>> items,
    required ValueChanged<T?> onChanged,
  }) =>
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
        const SizedBox(height: 4),
        DropdownButtonFormField<T>(
          value: value,
          isExpanded: true,
          decoration: InputDecoration(
            isDense: true,
            contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
            filled: true,
            fillColor: const Color(0xFFF5F5F5),
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey.shade300)),
          ),
          items: items,
          onChanged: onChanged,
        ),
      ]);

  Widget _insightRow(String label, int count, Color color) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 3),
        child: Row(children: [
          Expanded(child: Text(label, style: const TextStyle(fontSize: 12))),
          Text('$count students', style: TextStyle(fontSize: 12, color: color, fontWeight: FontWeight.bold)),
        ]),
      );

  Color _avatarColor(String name) {
    const colors = [Color(0xFF1976D2), Color(0xFF388E3C), Color(0xFF7B1FA2), Color(0xFFF57C00), Color(0xFFD32F2F), Color(0xFF0097A7)];
    return colors[name.hashCode.abs() % colors.length];
  }

  // ══════════════════════════════════════════════════════
  //  STUDENT VIEW
  // ══════════════════════════════════════════════════════
  Widget _buildStudentView() {
    if (_loading) return const LoadingWidget();
    if (_error != null) return AppErrorWidget(message: _error!, onRetry: _loadStudentView);
    final stats = _studentData?['stats'];
    final records = (_studentData?['records'] as List?) ?? [];
    return RefreshIndicator(
      onRefresh: _loadStudentView,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(children: [
          Card(
            color: AppTheme.primary,
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Row(mainAxisAlignment: MainAxisAlignment.spaceAround, children: [
                _statItem('${stats?['attendancePercentage'] ?? 0}%', 'Overall', Colors.white),
                _statItem('${stats?['attendedClasses'] ?? 0}', 'Present', Colors.greenAccent),
                _statItem('${stats?['totalClasses'] ?? 0}', 'Total', Colors.white70),
              ]),
            ),
          ),
          const SizedBox(height: 16),
          if (records.isEmpty)
            const EmptyStateWidget(message: 'No attendance records')
          else
            ...records.map((r) => ListTile(
                  leading: CircleAvatar(
                    backgroundColor: r['status'] == 'Present'
                        ? AppTheme.success.withValues(alpha: 0.1)
                        : AppTheme.error.withValues(alpha: 0.1),
                    child: Icon(r['status'] == 'Present' ? Icons.check : Icons.close,
                        color: r['status'] == 'Present' ? AppTheme.success : AppTheme.error, size: 18),
                  ),
                  title: Text(r['subject'] ?? ''),
                  subtitle: Text(AppDateUtils.formatDate(r['date'])),
                  trailing: Text(r['status'] ?? '',
                      style: TextStyle(
                          color: r['status'] == 'Present' ? AppTheme.success : AppTheme.error,
                          fontWeight: FontWeight.bold)),
                )),
        ]),
      ),
    );
  }

  Widget _statItem(String v, String l, Color c) => Column(children: [
        Text(v, style: TextStyle(color: c, fontSize: 22, fontWeight: FontWeight.bold)),
        Text(l, style: TextStyle(color: c.withValues(alpha: 0.8), fontSize: 12)),
      ]);
}

// ── Attendance Button ──────────────────────────────────
class _AttBtn extends StatelessWidget {
  final String label;
  final bool active;
  final Color color;
  final VoidCallback onTap;
  const _AttBtn({required this.label, required this.active, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(
          width: 50,
          padding: const EdgeInsets.symmetric(vertical: 5),
          decoration: BoxDecoration(
            color: active ? color : Colors.white,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: color),
          ),
          child: Text(label == 'P' ? 'Present' : 'Absent',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 9, color: active ? Colors.white : color, fontWeight: FontWeight.w600)),
        ),
      );
}

// ── Stat Box ───────────────────────────────────────────
class _StatBox extends StatelessWidget {
  final String label;
  final String value;
  final Color color;
  final Color bg;
  const _StatBox(this.label, this.value, this.color, this.bg);

  @override
  Widget build(BuildContext context) => Expanded(
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
          decoration: BoxDecoration(
            color: bg,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: color.withValues(alpha: 0.3)),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(label, style: TextStyle(fontSize: 9, color: color, fontWeight: FontWeight.w600)),
            const SizedBox(height: 2),
            Text(value, style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: color)),
          ]),
        ),
      );
}

// ── QR Dialog ─────────────────────────────────────────
class _QrDialog extends StatefulWidget {
  final String className;
  final String subject;
  final String date;
  final int facultyId;
  const _QrDialog({required this.className, required this.subject, required this.date, required this.facultyId});

  @override
  State<_QrDialog> createState() => _QrDialogState();
}

class _QrDialogState extends State<_QrDialog> {
  late String _qrData;
  late Timer _timer;
  int _secondsLeft = 30;

  @override
  void initState() {
    super.initState();
    _regen();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      setState(() {
        _secondsLeft--;
        if (_secondsLeft <= 0) { _regen(); _secondsLeft = 30; }
      });
    });
  }

  void _regen() {
    final t = DateTime.now().millisecondsSinceEpoch;
    _qrData = '{"f":${widget.facultyId},"c":"${widget.className}","s":"${widget.subject}","d":"${widget.date}","t":$t}';
  }

  @override
  void dispose() { _timer.cancel(); super.dispose(); }

  @override
  Widget build(BuildContext context) => Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20),
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            // Title
            Row(children: [
              const Icon(Icons.qr_code, color: Color(0xFF7C3AED), size: 20),
              const SizedBox(width: 8),
              const Expanded(child: Text('QR Code Attendance',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold))),
              IconButton(icon: const Icon(Icons.close, size: 18),
                  onPressed: () => Navigator.pop(context),
                  padding: EdgeInsets.zero, constraints: const BoxConstraints()),
            ]),
            const SizedBox(height: 12),
            // Info
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(color: const Color(0xFFF3F4F6), borderRadius: BorderRadius.circular(8)),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                _row('Class:', widget.className),
                _row('Subject:', widget.subject),
                _row('Date:', widget.date),
                const SizedBox(height: 4),
                Row(children: [
                  const Icon(Icons.timer, size: 14, color: Colors.red),
                  const SizedBox(width: 4),
                  Text('Refreshes in: $_secondsLeft sec',
                      style: const TextStyle(fontSize: 12, color: Colors.red, fontWeight: FontWeight.w600)),
                ]),
              ]),
            ),
            const SizedBox(height: 14),
            // QR
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: QrImageView(data: _qrData, version: QrVersions.auto, size: 200),
            ),
            const SizedBox(height: 10),
            // Progress
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: _secondsLeft / 30,
                backgroundColor: Colors.grey.shade200,
                valueColor: AlwaysStoppedAnimation(_secondsLeft > 10 ? Colors.green : Colors.red),
                minHeight: 6,
              ),
            ),
            const SizedBox(height: 12),
            // Instructions
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: const Color(0xFFFFF8E1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: const Color(0xFFFFE082)),
              ),
              child: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('📋 Instructions:', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                SizedBox(height: 4),
                Text('1. Students scan this QR with their mobile', style: TextStyle(fontSize: 11)),
                Text('2. They will be marked as Present automatically', style: TextStyle(fontSize: 11)),
                Text('3. QR regenerates every 30 seconds', style: TextStyle(fontSize: 11)),
                Text('4. Each student can scan only once per session', style: TextStyle(fontSize: 11)),
              ]),
            ),
          ]),
        ),
      );

  Widget _row(String l, String v) => Padding(
        padding: const EdgeInsets.only(bottom: 2),
        child: Row(children: [
          Text(l, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
          const SizedBox(width: 6),
          Text(v, style: const TextStyle(fontSize: 12)),
        ]),
      );
}
