import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/auth_provider.dart';
import '../../routes/app_routes.dart';
import '../../widgets/faculty_sidebar.dart';
import '../shared/timetable_screen.dart';
import '../shared/assignments_screen.dart';
import '../shared/attendance_screen.dart';
import '../shared/messages_screen.dart';
import '../shared/documents_screen.dart';
import '../shared/notifications_screen.dart';
import '../shared/ai_chat_screen.dart';
import '../shared/profile_screen.dart';
import 'my_subjects_screen.dart';
import 'faculty_home_screen.dart';
import 'reports_screen.dart';

class FacultyDashboardScreen extends StatefulWidget {
  const FacultyDashboardScreen({super.key});

  @override
  State<FacultyDashboardScreen> createState() => _FacultyDashboardScreenState();
}

class _FacultyDashboardScreenState extends State<FacultyDashboardScreen> {
  int _selectedIndex = 0;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  // Sidebar indices:
  // 0=Dashboard 1=My Subjects 2=Timetable 3=Assignments
  // 4=Attendance 5=Messages 6=Reports 7=Documents 8=Notifications 9=AI Assistant 10=Profile

  // ── Screen titles ──────────────────────────────────────
  static const _titles = [
    'Dashboard', 'My Subjects', 'Timetable', 'Assignments',
    'Attendance', 'Messages', 'Reports', 'Documents', 'Notifications', 'AI Assistant', 'Profile',
  ];

  // ── Screens ────────────────────────────────────────────
  List<Widget> _buildScreens(int userId) => [
    FacultyHomeScreen(
      facultyId: userId,
      facultyName: context.read<AuthProvider>().user!.fullName,
      onCreateAssignment: () => setState(() => _selectedIndex = 3),
      onViewTimetable: () => setState(() => _selectedIndex = 2),
    ),
    MySubjectsScreen(facultyId: userId),
    TimetableScreen(userId: userId, userType: 'faculty'),
    AssignmentsScreen(userId: userId, userType: 'faculty'),
    AttendanceScreen(userId: userId),
    MessagesScreen(userId: userId, userType: 'faculty'),
    ReportsScreen(facultyId: userId, facultyName: context.read<AuthProvider>().user!.fullName),
    DocumentsScreen(userId: userId, userType: 'faculty'),
    NotificationsScreen(userId: userId, userType: 'faculty', showAppBar: false),
    const AiChatScreen(),
    const ProfileScreen(),
  ];

  Future<void> _logout() async {
    await context.read<AuthProvider>().logout();
    if (mounted) Navigator.pushReplacementNamed(context, AppRoutes.login);
  }

  @override
  Widget build(BuildContext context) {
    final user = context.read<AuthProvider>().user!;
    final screens = _buildScreens(user.id);

    return Scaffold(
      key: _scaffoldKey,
      // ── Drawer (mobile sidebar) ──
      drawer: Drawer(
        width: 220,
        child: FacultySidebar(
          selectedIndex: _selectedIndex,
          facultyName: user.fullName,
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
            onPressed: () => setState(() => _selectedIndex = 8),
          ),
        ],
      ),
      body: Row(
        children: [
          // ── Persistent sidebar on wide screens (tablet/landscape) ──
          if (MediaQuery.of(context).size.width >= 600)
            FacultySidebar(
              selectedIndex: _selectedIndex,
              facultyName: user.fullName,
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

// ── Placeholder for Reports ────────────────────────────
class _PlaceholderScreen extends StatelessWidget {
  final String label;
  final IconData icon;
  const _PlaceholderScreen({required this.label, required this.icon});

  @override
  Widget build(BuildContext context) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 64, color: Colors.grey.shade300),
            const SizedBox(height: 12),
            Text(label,
                style: TextStyle(
                    color: Colors.grey.shade400, fontSize: 16)),
          ],
        ),
      );
}
