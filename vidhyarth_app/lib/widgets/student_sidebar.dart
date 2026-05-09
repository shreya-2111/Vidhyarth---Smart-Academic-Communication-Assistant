import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

class StudentSidebar extends StatelessWidget {
  final int selectedIndex;
  final ValueChanged<int> onSelect;
  final String studentName;
  final String department;
  final VoidCallback onLogout;

  const StudentSidebar({
    super.key,
    required this.selectedIndex,
    required this.onSelect,
    required this.studentName,
    required this.department,
    required this.onLogout,
  });

  static const _navItems = [
    {'label': 'Dashboard',      'icon': Icons.dashboard_outlined,       'selectedIcon': Icons.dashboard},
    {'label': 'Timetable',      'icon': Icons.calendar_today_outlined,  'selectedIcon': Icons.calendar_today},
    {'label': 'Assignments',    'icon': Icons.assignment_outlined,      'selectedIcon': Icons.assignment},
    {'label': 'Attendance',     'icon': Icons.how_to_reg_outlined,      'selectedIcon': Icons.how_to_reg},
    {'label': 'Messages',       'icon': Icons.message_outlined,         'selectedIcon': Icons.message},
    {'label': 'Documents',      'icon': Icons.folder_outlined,          'selectedIcon': Icons.folder},
    {'label': 'Notifications',  'icon': Icons.notifications_outlined,   'selectedIcon': Icons.notifications},
    {'label': 'Performance',    'icon': Icons.trending_up_outlined,     'selectedIcon': Icons.trending_up},
    {'label': 'AI Assistant',   'icon': Icons.auto_awesome_outlined,    'selectedIcon': Icons.auto_awesome},
    {'label': 'Profile',        'icon': Icons.person_outline,           'selectedIcon': Icons.person},
  ];

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 220,
      color: const Color(0xFF1A2340),
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Brand ──
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 8),
              child: Row(
                children: [
                  Container(
                    width: 34,
                    height: 34,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white54, width: 1.5),
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(6.0),
                      child: SvgPicture.asset(
                        'assets/images/logo.svg',
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  const Text('Vidhyarth',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 17,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 0.3)),
                ],
              ),
            ),

            const Divider(color: Colors.white12, height: 24),

            // ── Nav items ──
            Expanded(
              child: ListView.builder(
                padding: const EdgeInsets.symmetric(vertical: 4),
                itemCount: _navItems.length,
                itemBuilder: (_, i) {
                  final item = _navItems[i];
                  final selected = selectedIndex == i;
                  return _NavTile(
                    label: item['label'] as String,
                    icon: item['icon'] as IconData,
                    selectedIcon: item['selectedIcon'] as IconData,
                    selected: selected,
                    onTap: () => onSelect(i),
                  );
                },
              ),
            ),

            const Divider(color: Colors.white12, height: 1),

            // ── User info + Logout ──
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 18,
                    backgroundColor: const Color(0xFF4F46E5),
                    child: Text(
                      studentName.isNotEmpty
                          ? studentName[0].toUpperCase()
                          : 'S',
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                          fontSize: 14),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          studentName,
                          style: const TextStyle(
                              color: Colors.white,
                              fontSize: 12,
                              fontWeight: FontWeight.w600),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        Text(
                          department,
                          style: const TextStyle(
                              color: Colors.white38, fontSize: 10),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.logout,
                        color: Colors.white54, size: 18),
                    tooltip: 'Logout',
                    onPressed: onLogout,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _NavTile extends StatelessWidget {
  final String label;
  final IconData icon;
  final IconData selectedIcon;
  final bool selected;
  final VoidCallback onTap;

  const _NavTile({
    required this.label,
    required this.icon,
    required this.selectedIcon,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 180),
        margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 11),
        decoration: BoxDecoration(
          color: selected
              ? const Color(0xFF4F46E5).withValues(alpha: 0.25)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(8),
          border: selected
              ? Border.all(
                  color: const Color(0xFF4F46E5).withValues(alpha: 0.4),
                  width: 1)
              : null,
        ),
        child: Row(
          children: [
            Icon(
              selected ? selectedIcon : icon,
              color: selected ? const Color(0xFF818CF8) : Colors.white54,
              size: 18,
            ),
            const SizedBox(width: 12),
            Text(
              label,
              style: TextStyle(
                color: selected ? Colors.white : Colors.white60,
                fontSize: 13,
                fontWeight:
                    selected ? FontWeight.w600 : FontWeight.normal,
              ),
            ),
            if (selected)
              Expanded(
                child: Align(
                  alignment: Alignment.centerRight,
                  child: Container(
                    width: 4,
                    height: 4,
                    decoration: const BoxDecoration(
                      color: Color(0xFF818CF8),
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}