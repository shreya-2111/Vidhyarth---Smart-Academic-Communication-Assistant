import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_theme.dart';
import '../../services/api_service.dart';
import '../../core/utils/date_utils.dart';

class FacultyHomeScreen extends StatefulWidget {
  final int facultyId;
  final String facultyName;
  final VoidCallback onCreateAssignment;
  final VoidCallback onViewTimetable;

  const FacultyHomeScreen({
    super.key,
    required this.facultyId,
    required this.facultyName,
    required this.onCreateAssignment,
    required this.onViewTimetable,
  });

  @override
  State<FacultyHomeScreen> createState() => _FacultyHomeScreenState();
}

class _FacultyHomeScreenState extends State<FacultyHomeScreen> {
  // Data
  Map<String, dynamic>? _assignmentStats;
  Map<String, dynamic>? _reportStats;
  Map<String, dynamic>? _attendanceStats;
  List<dynamic> _todayClasses = [];
  List<dynamic> _timetable = [];
  List<dynamic> _recentAssignments = [];
  List<dynamic> _recentMessages = [];
  List<dynamic> _performanceStudents = [];
  List<dynamic> _announcements = [];

  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _loadAll();
  }

  Future<void> _loadAll() async {
    setState(() => _loading = true);
    final id = widget.facultyId;
    await Future.wait([
      _fetch('/assignments/stats/$id', (d) => _assignmentStats = d),
      _fetch('/reports/dashboard/$id', (d) => _reportStats = d),
      _fetch('/attendance/stats/today/all', (d) => _attendanceStats = d),
      _fetchList('/timetable/today/$id', (d) => _todayClasses = d),
      _fetchList('/timetable/faculty/$id', (d) => _timetable = d),
      _fetchList('/assignments/faculty/$id', (d) => _recentAssignments = d),
      _fetchList('/messages/inbox/$id/faculty', (d) => _recentMessages = d),
      _fetchList('/reports/student-performance/$id', (d) => _performanceStudents = d),
      _fetchList('/messages/announcements/$id', (d) => _announcements = d),
    ]);
    if (mounted) setState(() => _loading = false);
  }

  Future<void> _fetch(String url, void Function(Map<String, dynamic>) setter) async {
    try {
      final d = await apiService.get(url);
      if (mounted) setState(() => setter(d));
    } catch (_) {}
  }

  Future<void> _fetchList(String url, void Function(List<dynamic>) setter) async {
    try {
      final d = await apiService.get(url) as List;
      if (mounted) setState(() => setter(d));
    } catch (_) {}
  }

  String get _greeting {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  }

  String get _todayDate =>
      DateFormat('EEEE, MMMM d, yyyy').format(DateTime.now());

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      body: RefreshIndicator(
        onRefresh: _loadAll,
        child: _loading
            ? const Center(child: CircularProgressIndicator())
            : ListView(
                padding: const EdgeInsets.all(14),
                children: [
                  _buildGreeting(),
                  const SizedBox(height: 14),
                  _buildStatCards(),
                  const SizedBox(height: 14),
                  _buildSmartTimetable(),
                  const SizedBox(height: 14),
                  _buildAttendanceOverview(),
                  const SizedBox(height: 14),
                  _buildAssignmentTracker(),
                  const SizedBox(height: 14),
                  _buildStudentQueries(),
                  const SizedBox(height: 14),
                  _buildPerformanceDashboard(),
                  const SizedBox(height: 14),
                  _buildAnnouncements(),
                  const SizedBox(height: 20),
                ],
              ),
      ),
    );
  }

  // ── Greeting Banner ──────────────────────────────────
  Widget _buildGreeting() => Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
              colors: [Color(0xFF1976D2), Color(0xFF42A5F5)]),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('$_greeting, ${widget.facultyName}',
                style: const TextStyle(
                    color: Colors.white,
                    fontSize: 18,
                    fontWeight: FontWeight.bold)),
            const SizedBox(height: 4),
            Text(_todayDate,
                style: TextStyle(
                    color: Colors.white.withValues(alpha: 0.8),
                    fontSize: 12)),
          ],
        ),
      );

  // ── 4 Stat Cards (2×2 grid) ──────────────────────────
  Widget _buildStatCards() {
    final cards = [
      _StatCard(
        label: "TODAY'S CLASSES",
        value: '${_todayClasses.length}',
        icon: Icons.class_,
        iconBg: const Color(0xFFE3F2FD),
        iconColor: const Color(0xFF1976D2),
        borderColor: const Color(0xFF90CAF9),
      ),
      _StatCard(
        label: 'TOTAL ASSIGNMENTS',
        value: '${_assignmentStats?['total'] ?? 0}',
        icon: Icons.assignment,
        iconBg: const Color(0xFFFFF3E0),
        iconColor: const Color(0xFFF57C00),
        borderColor: const Color(0xFFFFCC80),
      ),
      _StatCard(
        label: 'TOTAL STUDENTS',
        value: '${_reportStats?['totalStudents'] ?? 0}',
        icon: Icons.people,
        iconBg: const Color(0xFFF3E5F5),
        iconColor: const Color(0xFF7B1FA2),
        borderColor: const Color(0xFFCE93D8),
      ),
      _StatCard(
        label: 'PRESENT TODAY',
        value: '${_attendanceStats?['present'] ?? 0}',
        icon: Icons.check_circle,
        iconBg: const Color(0xFFE8F5E9),
        iconColor: const Color(0xFF388E3C),
        borderColor: const Color(0xFFA5D6A7),
      ),
    ];
    return GridView.count(
      crossAxisCount: 2,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisSpacing: 10,
      mainAxisSpacing: 10,
      childAspectRatio: 2.4,
      children: cards,
    );
  }

  // ── Smart Timetable ───────────────────────────────────
  Widget _buildSmartTimetable() {
    final days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    final fullDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    final todayName = DateFormat('EEEE').format(DateTime.now());

    // Group timetable by time slot
    final Map<String, Map<String, String>> grid = {};
    for (final e in _timetable) {
      final time = e['start_time']?.toString().substring(0, 5) ?? '';
      final day = e['day']?.toString() ?? '';
      grid.putIfAbsent(time, () => {});
      grid[time]![day] = '${e['subject']}\n${e['room_no'] ?? ''}';
    }
    final times = grid.keys.toList()..sort();

    return _SectionCard(
      title: '📅 Smart Timetable',
      action: 'View ›',
      onAction: widget.onViewTimetable,
      child: times.isEmpty
          ? const _EmptyState(message: 'No timetable entries')
          : SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Table(
                defaultColumnWidth: const FixedColumnWidth(72),
                border: TableBorder.all(
                    color: Colors.grey.shade200, width: 0.5),
                children: [
                  // Header row
                  TableRow(
                    decoration:
                        const BoxDecoration(color: Color(0xFFF5F5F5)),
                    children: [
                      _tCell('Time', bold: true, small: true),
                      ...days.asMap().entries.map((e) {
                        final isToday =
                            fullDays[e.key] == todayName;
                        return _tCell(e.value,
                            bold: true,
                            small: true,
                            highlight: isToday);
                      }),
                    ],
                  ),
                  // Time rows
                  ...times.map((t) => TableRow(
                        children: [
                          _tCell(t, small: true),
                          ...fullDays.map((day) {
                            final cell = grid[t]?[day];
                            return cell != null
                                ? _tCellSubject(cell)
                                : _tCell('');
                          }),
                        ],
                      )),
                ],
              ),
            ),
    );
  }

  // ── Attendance Overview ───────────────────────────────
  Widget _buildAttendanceOverview() {
    final present = (_attendanceStats?['present'] ?? 0) as num;
    final absent = (_attendanceStats?['absent'] ?? 0) as num;
    final total = present + absent;
    final pct = total > 0 ? (present / total * 100).round() : 0;

    return _SectionCard(
      title: '📊 Attendance Overview',
      child: Column(
        children: [
          const SizedBox(height: 8),
          Row(
            children: [
              // Circle indicator
              SizedBox(
                width: 80,
                height: 80,
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    CircularProgressIndicator(
                      value: total > 0 ? present / total : 0,
                      strokeWidth: 8,
                      backgroundColor: Colors.grey.shade200,
                      valueColor: const AlwaysStoppedAnimation(
                          Color(0xFF1976D2)),
                    ),
                    Text('$pct%',
                        style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 14)),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('$pct%',
                      style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87)),
                  const Text('Attendance Rate',
                      style:
                          TextStyle(color: Colors.grey, fontSize: 11)),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF3E0),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text('$absent Absent Today',
                        style: const TextStyle(
                            fontSize: 11,
                            color: Color(0xFFF57C00),
                            fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  // ── Assignment Tracker ────────────────────────────────
  Widget _buildAssignmentTracker() {
    final recent = _recentAssignments.take(3).toList();
    return _SectionCard(
      title: '📋 Assignment Tracker',
      action: 'View ›',
      onAction: widget.onCreateAssignment,
      child: recent.isEmpty
          ? Column(
              children: [
                const _EmptyState(message: 'No assignments yet'),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: widget.onCreateAssignment,
                    style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1A2340),
                        padding:
                            const EdgeInsets.symmetric(vertical: 10)),
                    child: const Text('Create Assignment',
                        style: TextStyle(
                            fontSize: 12, color: Colors.white)),
                  ),
                ),
              ],
            )
          : Column(
              children: recent.map((a) {
                final submitted = a['submitted_count'] ?? 0;
                final total = _reportStats?['totalStudents'] ?? 0;
                return ListTile(
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.assignment,
                      color: AppTheme.primary, size: 20),
                  title: Text(a['title'] ?? '',
                      style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis),
                  subtitle: Text(
                      'Due: ${AppDateUtils.formatDate(a['deadline'])}',
                      style: const TextStyle(fontSize: 10)),
                  trailing: Text('$submitted/$total',
                      style: const TextStyle(
                          fontSize: 11,
                          color: AppTheme.success,
                          fontWeight: FontWeight.bold)),
                );
              }).toList(),
            ),
    );
  }

  // ── Student Queries (Messages) ────────────────────────
  Widget _buildStudentQueries() {
    final recent = _recentMessages.take(3).toList();
    return _SectionCard(
      title: '💬 Student Queries',
      action: 'View ›',
      child: recent.isEmpty
          ? const _EmptyState(message: 'No recent queries.\nStudent messages will appear here')
          : Column(
              children: recent.map((m) => ListTile(
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                    leading: CircleAvatar(
                      radius: 14,
                      backgroundColor: AppTheme.primary.withValues(alpha: 0.1),
                      child: Text(
                        (m['sender_name'] ?? 'S')[0].toUpperCase(),
                        style: const TextStyle(
                            fontSize: 11,
                            color: AppTheme.primary,
                            fontWeight: FontWeight.bold),
                      ),
                    ),
                    title: Text(m['sender_name'] ?? '',
                        style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600)),
                    subtitle: Text(m['message'] ?? '',
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 10)),
                    trailing: Text(
                        AppDateUtils.timeAgo(m['created_at'] ?? ''),
                        style: const TextStyle(
                            fontSize: 10, color: Colors.grey)),
                  )).toList(),
            ),
    );
  }

  // ── Performance Dashboard ─────────────────────────────
  Widget _buildPerformanceDashboard() {
    final students = _performanceStudents.take(3).toList();
    return _SectionCard(
      title: '🏆 Performance Dashboard',
      child: students.isEmpty
          ? const _EmptyState(message: 'No performance data yet')
          : Column(
              children: students.map((s) {
                final att = s['attendance_percentage'] ?? 0;
                final name = s['name'] ?? '';
                final cls = s['department'] ?? '';
                return ListTile(
                  dense: true,
                  contentPadding: EdgeInsets.zero,
                  leading: CircleAvatar(
                    radius: 14,
                    backgroundColor: AppTheme.primary,
                    child: Text(name.isNotEmpty ? name[0] : 'S',
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.bold)),
                  ),
                  title: Text(name,
                      style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600)),
                  subtitle: Text('$cls | $att% Attend',
                      style: const TextStyle(fontSize: 10)),
                  trailing: const Icon(Icons.chevron_right,
                      size: 16, color: Colors.grey),
                );
              }).toList(),
            ),
    );
  }

  // ── Announcements ─────────────────────────────────────
  Widget _buildAnnouncements() {
    return _SectionCard(
      title: '📢 Announcements & Notices',
      action: 'View ›',
      child: _announcements.isEmpty
          ? Column(
              children: [
                const _EmptyState(message: 'No announcements yet'),
                const SizedBox(height: 8),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1976D2),
                        padding:
                            const EdgeInsets.symmetric(vertical: 10)),
                    child: const Text('Send Announcement',
                        style: TextStyle(
                            fontSize: 12, color: Colors.white)),
                  ),
                ),
              ],
            )
          : Column(
              children: _announcements.take(3).map((a) => ListTile(
                    dense: true,
                    contentPadding: EdgeInsets.zero,
                    leading: const Icon(Icons.campaign,
                        color: AppTheme.primary, size: 20),
                    title: Text(a['title'] ?? '',
                        style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis),
                    subtitle: Text(
                        AppDateUtils.timeAgo(a['created_at'] ?? ''),
                        style: const TextStyle(fontSize: 10)),
                  )).toList(),
            ),
    );
  }

}

// ── Reusable Section Card ──────────────────────────────
class _SectionCard extends StatelessWidget {
  final String title;
  final String? action;
  final VoidCallback? onAction;
  final Widget child;

  const _SectionCard({
    required this.title,
    required this.child,
    this.action,
    this.onAction,
  });

  @override
  Widget build(BuildContext context) => Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: Colors.grey.shade200),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 6,
                offset: const Offset(0, 2)),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Padding(
              padding:
                  const EdgeInsets.fromLTRB(12, 12, 12, 8),
              child: Row(
                children: [
                  Expanded(
                    child: Text(title,
                        style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Colors.black87)),
                  ),
                  if (action != null)
                    GestureDetector(
                      onTap: onAction,
                      child: Text(action!,
                          style: const TextStyle(
                              fontSize: 11,
                              color: AppTheme.primary,
                              fontWeight: FontWeight.w600)),
                    ),
                ],
              ),
            ),
            const Divider(height: 1),
            Padding(
              padding: const EdgeInsets.all(12),
              child: child,
            ),
          ],
        ),
      );
}

// ── Stat Card ──────────────────────────────────────────
class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color iconBg;
  final Color iconColor;
  final Color borderColor;

  const _StatCard({
    required this.label,
    required this.value,
    required this.icon,
    required this.iconBg,
    required this.iconColor,
    required this.borderColor,
  });

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: borderColor.withValues(alpha: 0.5)),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 4,
                offset: const Offset(0, 2)),
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                  color: iconBg, borderRadius: BorderRadius.circular(8)),
              child: Icon(icon, color: iconColor, size: 18),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(label,
                      style: const TextStyle(
                          fontSize: 9,
                          color: Colors.grey,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 0.3)),
                  const SizedBox(height: 2),
                  Text(value,
                      style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Colors.black87)),
                ],
              ),
            ),
          ],
        ),
      );
}

// ── Empty State ────────────────────────────────────────
class _EmptyState extends StatelessWidget {
  final String message;
  const _EmptyState({required this.message});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Center(
          child: Text(message,
              textAlign: TextAlign.center,
              style: const TextStyle(
                  color: Colors.grey, fontSize: 11)),
        ),
      );
}

// ── Table cell helpers ─────────────────────────────────
Widget _tCell(String text,
    {bool bold = false, bool small = false, bool highlight = false}) =>
    Container(
      color: highlight ? const Color(0xFF1976D2) : null,
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
      child: Text(text,
          textAlign: TextAlign.center,
          style: TextStyle(
              fontSize: small ? 9 : 10,
              fontWeight: bold ? FontWeight.bold : FontWeight.normal,
              color: highlight ? Colors.white : Colors.black87)),
    );

Widget _tCellSubject(String text) => Container(
      color: const Color(0xFFE3F2FD),
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 6),
      child: Text(text,
          textAlign: TextAlign.center,
          style: const TextStyle(
              fontSize: 9,
              color: Color(0xFF1565C0),
              fontWeight: FontWeight.w600)),
    );
