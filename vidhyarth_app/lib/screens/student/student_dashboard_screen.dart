import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../../core/theme/app_theme.dart';
import '../../providers/auth_provider.dart';
import '../../routes/app_routes.dart';
import '../../services/api_service.dart';
import '../../widgets/loading_widget.dart';
import '../../widgets/error_widget.dart';
import '../../widgets/student_sidebar.dart';
import '../shared/timetable_screen.dart';
import '../shared/messages_screen.dart';
import '../shared/documents_screen.dart';
import '../shared/notifications_screen.dart';
import '../shared/ai_chat_screen.dart';
import '../shared/profile_screen.dart';
import 'student_assignments_screen.dart';
import 'student_attendance_screen.dart';
import 'student_performance_screen.dart';

class StudentDashboardScreen extends StatefulWidget {
  const StudentDashboardScreen({super.key});

  @override
  State<StudentDashboardScreen> createState() => _StudentDashboardScreenState();
}

class _StudentDashboardScreenState extends State<StudentDashboardScreen> {
  int _selectedIndex = 0;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  Map<String, dynamic>? _dashboardData;
  List<dynamic> _timetable = [];
  List<dynamic> _announcements = [];
  List<dynamic> _subjectProgress = [];
  bool _loading = true;
  String? _error;

  // Screen titles
  static const _titles = [
    'Dashboard', 'Timetable', 'Assignments', 'Attendance',
    'Messages', 'Documents', 'Notifications', 'Performance', 'AI Assistant', 'Profile',
  ];

  @override
  void initState() {
    super.initState();
    _loadDashboardData();
  }

  Future<void> _loadDashboardData() async {
    setState(() { _loading = true; _error = null; });
    final user = context.read<AuthProvider>().user!;
    
    try {
      final results = await Future.wait([
        apiService.get('/student/dashboard/${user.id}'),
        apiService.get('/student/timetable/${user.id}'),
        apiService.get('/student/announcements/${user.id}'),
        apiService.get('/student/subject-progress'),
      ]);
      
      setState(() {
        _dashboardData = results[0] as Map<String, dynamic>;
        _timetable = results[1] as List<dynamic>;
        _announcements = results[2] as List<dynamic>;
        _subjectProgress = results[3] as List<dynamic>;
        _loading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  String _fmt12(String time) {
    try {
      final parts = time.split(':');
      int h = int.parse(parts[0]);
      final m = parts[1].padLeft(2, '0');
      final suffix = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      if (h == 0) h = 12;
      return '$h:$m $suffix';
    } catch (_) {
      return time;
    }
  }

  Widget _buildHome() {
    final user = context.read<AuthProvider>().user!;
    
    if (_loading) return const LoadingWidget();
    if (_error != null) return AppErrorWidget(message: _error!, onRetry: _loadDashboardData);
    
    return RefreshIndicator(
      onRefresh: _loadDashboardData,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Welcome Header
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF0EA5E9), Color(0xFF6366F1)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Good Morning, ${user.fullName.split(' ').first}!',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Welcome back to Vidhyarth',
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.8),
                      fontSize: 14,
                    ),
                  ),
                ],
              ),
            ),
            
            const SizedBox(height: 24),
            
            // Stats Cards Row
            Row(
              children: [
                Expanded(child: _buildStatCard(
                  'ATTENDANCE',
                  '${int.tryParse(_dashboardData?['attendancePercentage']?.toString() ?? '0') ?? 0}%',
                  Icons.bar_chart,
                  const Color(0xFF10B981),
                )),
                const SizedBox(width: 12),
                Expanded(child: _buildStatCard(
                  'PENDING ASSIGNMENTS',
                  '${int.tryParse(_dashboardData?['pendingAssignments']?.toString() ?? '0') ?? 0}',
                  Icons.assignment_late,
                  const Color(0xFFF59E0B),
                )),
              ],
            ),
            
            const SizedBox(height: 12),
            
            Row(
              children: [
                Expanded(child: _buildStatCard(
                  'UPCOMING DEADLINES',
                  '${int.tryParse(_dashboardData?['upcomingDeadlines']?.toString() ?? '0') ?? 0}',
                  Icons.schedule,
                  const Color(0xFFEF4444),
                )),
                const SizedBox(width: 12),
                Expanded(child: _buildStatCard(
                  "TODAY'S CLASSES",
                  '${int.tryParse(_dashboardData?['todayClasses']?.toString() ?? '0') ?? 0}',
                  Icons.class_,
                  const Color(0xFF8B5CF6),
                )),
              ],
            ),
            
            const SizedBox(height: 24),
            
            // Today's Timetable
            _buildTodayTimetable(),
            
            const SizedBox(height: 24),
            
            // Recent Announcements
            _buildRecentAnnouncements(),
            
            const SizedBox(height: 24),
            
            // Performance Summary
            _buildPerformanceSummary(),
          ],
        ),
      ),
    );
  }

  Widget _buildStatCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withOpacity(0.2)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 20),
              const Spacer(),
              Text(
                value,
                style: TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            title,
            style: const TextStyle(
              fontSize: 11,
              color: Colors.grey,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  int _parseTimeValue(String t) {
    try {
      final p = t.split(':');
      int h = int.parse(p[0]);
      int m = int.parse(p[1]);
      if (h >= 1 && h <= 6) h += 12;
      return h * 60 + m;
    } catch (_) {
      return 0;
    }
  }

  Widget _buildTodayTimetable() {
    final today = DateFormat('EEEE').format(DateTime.now());
    final todayClasses = _timetable.where((t) => t['day'] == today).toList();
    todayClasses.sort((a, b) => _parseTimeValue(a['start_time'].toString()).compareTo(_parseTimeValue(b['start_time'].toString())));
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.schedule, color: AppTheme.primary, size: 20),
            const SizedBox(width: 8),
            const Text(
              'Today\'s Schedule',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const Spacer(),
            if (todayClasses.isNotEmpty)
              TextButton(
                onPressed: () => setState(() => _selectedIndex = 1),
                child: const Text('View All', style: TextStyle(fontSize: 12)),
              ),
          ],
        ),
        const SizedBox(height: 12),
        
        if (todayClasses.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: const Column(
              children: [
                Icon(Icons.free_breakfast, color: Colors.grey, size: 32),
                SizedBox(height: 8),
                Text('No classes today!', style: TextStyle(color: Colors.grey)),
              ],
            ),
          )
        else
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Column(
              children: [
                // Weekday headers
                Container(
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  decoration: BoxDecoration(
                    color: AppTheme.primary.withOpacity(0.1),
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                  ),
                  child: Row(
                    children: ['Time', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
                        .map((day) => Expanded(
                              child: Text(
                                day,
                                textAlign: TextAlign.center,
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.primary,
                                ),
                              ),
                            ))
                        .toList(),
                  ),
                ),
                
                // Time slots
                ...todayClasses.map((cls) => Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    border: Border(bottom: BorderSide(color: Colors.grey.shade100)),
                  ),
                  child: Row(
                    children: [
                      // Time
                      Expanded(
                        child: Text(
                          '${_fmt12(cls['start_time'].toString())} - ${_fmt12(cls['end_time'].toString())}',
                          style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w500),
                        ),
                      ),
                      
                      // Subject for today
                      Expanded(
                        flex: 6,
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(6),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                cls['subject'] ?? '',
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                  color: AppTheme.primary,
                                ),
                              ),
                              if (cls['faculty_name'] != null)
                                Text(
                                  cls['faculty_name'],
                                  style: const TextStyle(fontSize: 9, color: Colors.grey),
                                ),
                              if (cls['room_no'] != null)
                                Text(
                                  'Room: ${cls['room_no']}',
                                  style: const TextStyle(fontSize: 9, color: Colors.grey),
                                ),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                )),
              ],
            ),
          ),
      ],
    );
  }

  Widget _buildQuickActions() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.dashboard, color: AppTheme.primary, size: 20),
            const SizedBox(width: 8),
            const Text(
              'Quick Actions',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        const SizedBox(height: 12),
        
        GridView.count(
          crossAxisCount: 3,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          crossAxisSpacing: 12,
          mainAxisSpacing: 12,
          childAspectRatio: 1,
          children: [
            _buildActionCard('My Assignments', Icons.assignment, 2),
            _buildActionCard('Attendance', Icons.bar_chart, 3),
            _buildActionCard('Messages', Icons.message, 4),
            _buildActionCard('Documents', Icons.folder, 5),
            _buildActionCard('Notifications', Icons.notifications, 6),
            _buildActionCard('Performance', Icons.trending_up, 7),
            _buildActionCard('AI Assistant', Icons.auto_awesome, 8),
          ],
        ),
      ],
    );
  }

  Widget _buildActionCard(String label, IconData icon, int index) {
    return InkWell(
      onTap: () => setState(() => _selectedIndex = index),
      borderRadius: BorderRadius.circular(12),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.grey.shade200),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: AppTheme.primary, size: 28),
            const SizedBox(height: 8),
            Text(
              label,
              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w500),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentAnnouncements() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.campaign, color: AppTheme.primary, size: 20),
            const SizedBox(width: 8),
            const Text(
              'Recent Announcements',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const Spacer(),
            if (_announcements.isNotEmpty)
              TextButton(
                onPressed: () => setState(() => _selectedIndex = 6),
                child: const Text('View All', style: TextStyle(fontSize: 12)),
              ),
          ],
        ),
        const SizedBox(height: 12),
        
        if (_announcements.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: const Column(
              children: [
                Icon(Icons.announcement, color: Colors.grey, size: 32),
                SizedBox(height: 8),
                Text('No recent announcements', style: TextStyle(color: Colors.grey)),
              ],
            ),
          )
        else
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Column(
              children: _announcements.take(3).map((announcement) => Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  border: Border(bottom: BorderSide(color: Colors.grey.shade100)),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: AppTheme.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(Icons.announcement, color: AppTheme.primary, size: 16),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            announcement['title'] ?? '',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            announcement['message'] ?? '',
                            style: const TextStyle(fontSize: 12, color: Colors.grey),
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                          ),
                          const SizedBox(height: 4),
                          Text(
                            DateFormat('MMM dd, yyyy').format(
                              DateTime.parse(announcement['created_at']),
                            ),
                            style: const TextStyle(fontSize: 10, color: Colors.grey),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              )).toList(),
            ),
          ),
      ],
    );
  }

  Widget _buildPerformanceSummary() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Icon(Icons.trending_up, color: AppTheme.primary, size: 20),
            const SizedBox(width: 8),
            const Text(
              'Performance Summary',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
          ],
        ),
        const SizedBox(height: 12),
        
        if (_subjectProgress.isEmpty)
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Column(
              children: [
                SvgPicture.asset(
                  'assets/images/logo.svg',
                  width: 32,
                  height: 32,
                ),
                const SizedBox(height: 8),
                Text('No performance data available', style: TextStyle(color: Colors.grey)),
              ],
            ),
          )
        else
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.grey.shade200),
            ),
            child: Column(
              children: _subjectProgress.map((subject) => Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  border: Border(bottom: BorderSide(color: Colors.grey.shade100)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      subject['subject_name'] ?? '',
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Attendance', style: TextStyle(fontSize: 11, color: Colors.grey)),
                              const SizedBox(height: 4),
                              LinearProgressIndicator(
                                value: (int.tryParse(subject['attendance']?.toString() ?? '0') ?? 0) / 100,
                                backgroundColor: Colors.grey.shade200,
                                valueColor: AlwaysStoppedAnimation<Color>(
                                  (int.tryParse(subject['attendance']?.toString() ?? '0') ?? 0) >= 75 ? Colors.green : Colors.red,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text('${int.tryParse(subject['attendance']?.toString() ?? '0') ?? 0}%', style: const TextStyle(fontSize: 10)),
                            ],
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text('Marks', style: TextStyle(fontSize: 11, color: Colors.grey)),
                              const SizedBox(height: 4),
                              LinearProgressIndicator(
                                value: (int.tryParse(subject['marks']?.toString() ?? '0') ?? 0) / 100,
                                backgroundColor: Colors.grey.shade200,
                                valueColor: const AlwaysStoppedAnimation<Color>(AppTheme.primary),
                              ),
                              const SizedBox(height: 2),
                              Text('${int.tryParse(subject['marks']?.toString() ?? '0') ?? 0}%', style: const TextStyle(fontSize: 10)),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              )).toList(),
            ),
          ),
      ],
    );
  }

  List<Widget> get _screens {
    final user = context.read<AuthProvider>().user!;
    return [
      _buildHome(),
      TimetableScreen(userId: user.id, userType: 'student'),
      StudentAssignmentsScreen(userId: user.id),
      StudentAttendanceScreen(userId: user.id),
      MessagesScreen(userId: user.id, userType: 'student'),
      DocumentsScreen(userId: user.id, userType: 'student'),
      NotificationsScreen(userId: user.id, userType: 'student', showAppBar: false),
      StudentPerformanceScreen(userId: user.id),
      const AiChatScreen(),
      const ProfileScreen(),
    ];
  }

  Future<void> _logout() async {
    await context.read<AuthProvider>().logout();
    if (mounted) Navigator.pushReplacementNamed(context, AppRoutes.login);
  }

  @override
  Widget build(BuildContext context) {
    final user = context.read<AuthProvider>().user!;
    final screens = _screens;
    
    return Scaffold(
      key: _scaffoldKey,
      // ── Drawer (mobile sidebar) ──
      drawer: Drawer(
        width: 220,
        child: StudentSidebar(
          selectedIndex: _selectedIndex,
          studentName: user.fullName,
          department: user.department,
          onLogout: _logout,
          onSelect: (i) {
            setState(() => _selectedIndex = i);
            Navigator.pop(context); // close drawer
          },
        ),
      ),
      appBar: AppBar(
        title: Text(_titles[_selectedIndex]),
        backgroundColor: AppTheme.primary,
        foregroundColor: Colors.white,
        elevation: 0,
        leading: _selectedIndex == 0
            ? IconButton(
                icon: const Icon(Icons.menu),
                onPressed: () => _scaffoldKey.currentState?.openDrawer(),
              )
            : IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => setState(() => _selectedIndex = 0),
              ),
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () => setState(() => _selectedIndex = 6),
          ),
        ],
      ),
      body: Row(
        children: [
          // ── Persistent sidebar on wide screens (tablet/landscape) ──
          if (MediaQuery.of(context).size.width >= 600)
            StudentSidebar(
              selectedIndex: _selectedIndex,
              studentName: user.fullName,
              department: user.department,
              onLogout: _logout,
              onSelect: (i) => setState(() => _selectedIndex = i),
            ),

          // ── Main content ──
          Expanded(
            child: IndexedStack(
              index: _selectedIndex,
              children: screens,
            ),
          ),
        ],
      ),
    );
  }
}