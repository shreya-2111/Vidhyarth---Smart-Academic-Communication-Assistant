import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../widgets/loading_widget.dart';
import '../../widgets/error_widget.dart';
import '../../widgets/empty_state_widget.dart';

// ── Model ──────────────────────────────────────────────
class _SubjectItem {
  final int id;
  final String className;
  final String semester;
  final String subjectName;
  final String subjectCode;
  final int credits;

  _SubjectItem({
    required this.id,
    required this.className,
    required this.semester,
    required this.subjectName,
    required this.subjectCode,
    required this.credits,
  });

  factory _SubjectItem.fromJson(Map<String, dynamic> j) => _SubjectItem(
        id: j['assignment_id'] ?? 0,
        className: j['class_name'] ?? '',
        semester: j['semester'] ?? '',
        subjectName: j['subject_name'] ?? '',
        subjectCode: j['subject_code'] ?? '',
        credits: j['credits'] ?? 0,
      );
}

// ── Screen ─────────────────────────────────────────────
class MySubjectsScreen extends StatefulWidget {
  final int facultyId;
  const MySubjectsScreen({super.key, required this.facultyId});

  @override
  State<MySubjectsScreen> createState() => _MySubjectsScreenState();
}

class _MySubjectsScreenState extends State<MySubjectsScreen> {
  List<_SubjectItem> _subjects = [];
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final data = await apiService.get(
          '/faculty-subject-assignment/faculty/${widget.facultyId}/assignments') as List;
      setState(() {
        _subjects = data.map((e) => _SubjectItem.fromJson(e)).toList();
        _loading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  // Group subjects by class
  Map<String, List<_SubjectItem>> get _grouped {
    final map = <String, List<_SubjectItem>>{};
    for (final s in _subjects) {
      final key = '${s.className}||${s.semester}';
      map.putIfAbsent(key, () => []).add(s);
    }
    return map;
  }

  int get _totalClasses => _grouped.keys.length;
  int get _totalSubjects => _subjects.length;

  @override
  Widget build(BuildContext context) {
    if (_loading) return const LoadingWidget();
    if (_error != null) return AppErrorWidget(message: _error!, onRetry: _load);

    final grouped = _grouped;

    return RefreshIndicator(
      onRefresh: _load,
      child: CustomScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        slivers: [
          // ── Header ──
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 20, 16, 12),
              child: Row(
                children: [
                  const Expanded(
                    child: Text('My Assigned Subjects',
                        style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.black87)),
                  ),
                  // Classes badge
                  _Badge(
                      label: '$_totalClasses Class${_totalClasses != 1 ? 'es' : ''}',
                      color: const Color(0xFF7C3AED)),
                  const SizedBox(width: 8),
                  // Subjects badge
                  _Badge(
                      label: '$_totalSubjects Subject${_totalSubjects != 1 ? 's' : ''}',
                      color: const Color(0xFF7C3AED)),
                ],
              ),
            ),
          ),

          // ── Empty state ──
          if (_subjects.isEmpty)
            const SliverFillRemaining(
              child: EmptyStateWidget(
                  message: 'No subjects assigned yet',
                  icon: Icons.menu_book_outlined),
            )
          else ...[
            // ── Class cards ──
            SliverPadding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              sliver: SliverGrid(
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount:
                      MediaQuery.of(context).size.width > 600 ? 2 : 1,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: _cardAspectRatio(grouped),
                ),
                delegate: SliverChildBuilderDelegate(
                  (ctx, i) {
                    final key = grouped.keys.elementAt(i);
                    final parts = key.split('||');
                    final className = parts[0];
                    final semester = parts[1];
                    final items = grouped[key]!;
                    return _ClassCard(
                      className: className,
                      semester: semester,
                      subjects: items,
                    );
                  },
                  childCount: grouped.length,
                ),
              ),
            ),

            // ── Tip banner ──
            SliverToBoxAdapter(
              child: Container(
                margin: const EdgeInsets.all(16),
                padding: const EdgeInsets.symmetric(
                    horizontal: 16, vertical: 12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFFFBEB),
                  border: Border.all(color: const Color(0xFFFDE68A)),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: const Row(
                  children: [
                    Icon(Icons.lightbulb_outline,
                        color: Color(0xFFD97706), size: 18),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Tip: You can mark attendance for any of these subjects from the Attendance page.',
                        style: TextStyle(
                            fontSize: 12, color: Color(0xFF92400E)),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }

  // Estimate aspect ratio based on max subjects in any class
  double _cardAspectRatio(Map<String, List<_SubjectItem>> grouped) {
    if (grouped.isEmpty) return 1.2;
    final maxItems =
        grouped.values.map((v) => v.length).reduce((a, b) => a > b ? a : b);
    // header ~100px + each subject row ~60px + padding ~24px
    final estimatedHeight = 100.0 + (maxItems * 64.0) + 24.0;
    final cardWidth =
        (MediaQuery.of(context).size.width - 32 - 12) /
            (MediaQuery.of(context).size.width > 600 ? 2 : 1);
    return cardWidth / estimatedHeight;
  }
}

// ── Class Card ─────────────────────────────────────────
class _ClassCard extends StatelessWidget {
  final String className;
  final String semester;
  final List<_SubjectItem> subjects;

  const _ClassCard({
    required this.className,
    required this.semester,
    required this.subjects,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.06),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          // ── Card header ──
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
            decoration: const BoxDecoration(
              color: Color(0xFF1E3A5F),
              borderRadius: BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
            ),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(className,
                          style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 15)),
                      const SizedBox(height: 2),
                      Text(semester,
                          style: TextStyle(
                              color: Colors.white.withValues(alpha: 0.75),
                              fontSize: 12)),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(
                      horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF7C3AED),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    '${subjects.length} Subject${subjects.length != 1 ? 's' : ''}',
                    style: const TextStyle(
                        color: Colors.white,
                        fontSize: 11,
                        fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),

          // ── Subject rows ──
          ...subjects.map((s) => _SubjectRow(subject: s)),
        ],
      ),
    );
  }
}

// ── Subject Row ────────────────────────────────────────
class _SubjectRow extends StatelessWidget {
  final _SubjectItem subject;
  const _SubjectRow({super.key, required this.subject});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        border: Border(
            bottom: BorderSide(color: Colors.grey.shade100)),
      ),
      child: Row(
        children: [
          // Icon
          Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Icon(Icons.menu_book,
                color: Color(0xFF3B82F6), size: 18),
          ),
          const SizedBox(width: 12),
          // Name + code
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(subject.subjectName,
                    style: const TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                        color: Colors.black87)),
                const SizedBox(height: 2),
                Text(subject.subjectCode,
                    style: TextStyle(
                        fontSize: 11, color: Colors.grey.shade500)),
              ],
            ),
          ),
          // Credits badge
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
            decoration: BoxDecoration(
              color: const Color(0xFFEFF6FF),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFBFDBFE)),
            ),
            child: Text(
              '${subject.credits} Credits',
              style: const TextStyle(
                  fontSize: 10,
                  color: Color(0xFF1D4ED8),
                  fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Badge ──────────────────────────────────────────────
class _Badge extends StatelessWidget {
  final String label;
  final Color color;
  const _Badge({required this.label, required this.color});

  @override
  Widget build(BuildContext context) => Container(
        padding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
        decoration: BoxDecoration(
          color: color,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(label,
            style: const TextStyle(
                color: Colors.white,
                fontSize: 12,
                fontWeight: FontWeight.w600)),
      );
}
