import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:file_picker/file_picker.dart';
import 'package:intl/intl.dart';
import 'dart:io';
import '../../core/theme/app_theme.dart';
import '../../core/utils/date_utils.dart';
import '../../models/assignment_model.dart';
import '../../services/api_service.dart';
import '../../widgets/empty_state_widget.dart';
import '../../widgets/error_widget.dart';
import '../../widgets/loading_widget.dart';

class AssignmentsScreen extends StatefulWidget {
  final int userId;
  final String userType;
  const AssignmentsScreen(
      {super.key, required this.userId, required this.userType});

  @override
  State<AssignmentsScreen> createState() => _AssignmentsScreenState();
}

class _AssignmentsScreenState extends State<AssignmentsScreen> {
  List<AssignmentModel> _assignments = [];
  bool _loading = true;
  String? _error;

  bool get _isFaculty => widget.userType == 'faculty';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final ep = _isFaculty
          ? '/assignments/faculty/${widget.userId}'
          : '/student/assignments/${widget.userId}';
      final data = await apiService.get(ep) as List;
      setState(() {
        _assignments = data.map((e) => AssignmentModel.fromJson(e)).toList();
        _loading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  // ── Stats ─────────────────────────────────────────────
  int get _total => _assignments.length;
  int get _active => _assignments
      .where((a) => !AppDateUtils.isOverdue(a.deadline)).length;
  int get _overdue => _assignments
      .where((a) => AppDateUtils.isOverdue(a.deadline)).length;
  int get _totalSubmissions => _assignments
      .fold(0, (s, a) => s + (a.submittedCount ?? 0));

  // ── Create / Edit Dialog ──────────────────────────────
  void _showDialog({AssignmentModel? editing}) async {
    // ── Load assigned subjects from backend ──
    List<Map<String, dynamic>> allAssignments = [];
    try {
      final data = await apiService.get(
          '/faculty-subject-assignment/faculty/${widget.userId}/assignments') as List;
      allAssignments = data.cast<Map<String, dynamic>>();
    } catch (_) {}

    // Build unique class list: { class_id, class_name, semester }
    final Map<String, Map<String, dynamic>> classMap = {};
    for (final row in allAssignments) {
      final cid = row['class_id']?.toString() ?? '';
      if (cid.isNotEmpty && !classMap.containsKey(cid)) {
        classMap[cid] = {
          'class_id': cid,
          'class_name': row['class_name'] ?? '',
          'semester': row['semester'] ?? '',
        };
      }
    }
    final classes = classMap.values.toList();

    if (!mounted) return;

    String? selectedClassId;
    String? selectedSubject = editing?.course;
    final titleCtrl = TextEditingController(text: editing?.title ?? '');
    final descCtrl = TextEditingController(text: editing?.description ?? '');
    DateTime? deadline =
        editing != null ? DateTime.tryParse(editing.deadline) : null;
    File? pickedFile;
    String? pickedFileName;
    String? existingFileUrl = editing?.fileUrl;
    bool uploading = false;

    // Pre-select class if editing
    if (editing != null) {
      for (final row in allAssignments) {
        if (row['subject_name'] == editing.course) {
          selectedClassId = row['class_id']?.toString();
          break;
        }
      }
    }

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) {
          // Subjects for selected class
          final filteredSubjects = allAssignments
              .where((r) =>
                  selectedClassId == null ||
                  r['class_id']?.toString() == selectedClassId)
              .map((r) => r['subject_name']?.toString() ?? '')
              .where((s) => s.isNotEmpty)
              .toSet()
              .toList()
            ..sort();

          // Selected class info for display
          final selClass = selectedClassId != null
              ? classMap[selectedClassId]
              : null;

          return AlertDialog(
            title: Row(
              children: [
                Icon(editing == null ? Icons.add_circle : Icons.edit,
                    color: AppTheme.primary, size: 20),
                const SizedBox(width: 8),
                Text(
                    editing == null
                        ? 'Create Assignment'
                        : 'Edit Assignment',
                    style: const TextStyle(
                        fontSize: 16, fontWeight: FontWeight.bold)),
              ],
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // ── Select Class ──
                  _lbl('Select Class *'),
                  DropdownButtonFormField<String>(
                    value: selectedClassId,
                    decoration: _dec('Choose class...'),
                    items: classes
                        .map((c) => DropdownMenuItem<String>(
                              value: c['class_id'] as String,
                              child: Text(
                                  '${c['class_name']}  •  ${c['semester']}',
                                  style: const TextStyle(fontSize: 13)),
                            ))
                        .toList(),
                    onChanged: (v) => setS(() {
                      selectedClassId = v;
                      selectedSubject = null; // reset subject
                    }),
                  ),
                  // Show semester hint
                  if (selClass != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text('Semester: ${selClass['semester']}',
                          style: const TextStyle(
                              fontSize: 11, color: Colors.grey)),
                    ),
                  const SizedBox(height: 12),

                  // ── Subject / Course ──
                  _lbl('Subject / Course *'),
                  DropdownButtonFormField<String>(
                    value: filteredSubjects.contains(selectedSubject)
                        ? selectedSubject
                        : null,
                    decoration: _dec(selectedClassId == null
                        ? 'Select class first...'
                        : 'Select subject...'),
                    items: filteredSubjects
                        .map((s) => DropdownMenuItem<String>(
                              value: s,
                              child: Text(s,
                                  style: const TextStyle(fontSize: 13)),
                            ))
                        .toList(),
                    onChanged: selectedClassId == null
                        ? null
                        : (v) => setS(() => selectedSubject = v),
                  ),
                  const SizedBox(height: 12),

                  // ── Title ──
                  _lbl('Assignment Title *'),
                  TextFormField(
                    controller: titleCtrl,
                    decoration:
                        _dec('e.g. Chapter 4 - Quadratic Equations'),
                  ),
                  const SizedBox(height: 12),

                  // ── Description ──
                  _lbl('Description'),
                  TextFormField(
                    controller: descCtrl,
                    maxLines: 3,
                    decoration: _dec(
                        'Provide assignment details and instructions...'),
                  ),
                  const SizedBox(height: 12),

                  // ── File picker ──
                  _lbl('Assignment File (PDF)'),
                  if (pickedFileName != null)
                    Container(
                      padding: const EdgeInsets.all(8),
                      margin: const EdgeInsets.only(bottom: 8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE8F5E9),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.green.shade300),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.picture_as_pdf,
                              color: Colors.red, size: 18),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(pickedFileName!,
                                style: const TextStyle(fontSize: 12),
                                overflow: TextOverflow.ellipsis),
                          ),
                          GestureDetector(
                            onTap: () => setS(() {
                              pickedFile = null;
                              pickedFileName = null;
                            }),
                            child: const Icon(Icons.close,
                                size: 16, color: Colors.grey),
                          ),
                        ],
                      ),
                    )
                  else if (existingFileUrl != null)
                    Container(
                      padding: const EdgeInsets.all(8),
                      margin: const EdgeInsets.only(bottom: 8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFE3F2FD),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.blue.shade200),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.attach_file,
                              color: AppTheme.primary, size: 18),
                          SizedBox(width: 8),
                          Text('Existing file attached',
                              style: TextStyle(fontSize: 12)),
                        ],
                      ),
                    ),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () async {
                        final result =
                            await FilePicker.platform.pickFiles(
                          type: FileType.custom,
                          allowedExtensions: ['pdf'],
                        );
                        if (result != null &&
                            result.files.single.path != null) {
                          setS(() {
                            pickedFile =
                                File(result.files.single.path!);
                            pickedFileName = result.files.single.name;
                          });
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1A2340),
                        foregroundColor: Colors.white,
                        padding:
                            const EdgeInsets.symmetric(vertical: 12),
                      ),
                      icon: const Icon(Icons.upload_file, size: 16),
                      label: const Text('Add PDF',
                          style: TextStyle(fontSize: 13)),
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text('Select a PDF file (max 10MB)',
                      style:
                          TextStyle(fontSize: 10, color: Colors.grey)),
                  const SizedBox(height: 12),

                  // ── Deadline ──
                  _lbl('Deadline *'),
                  GestureDetector(
                    onTap: () async {
                      final d = await showDatePicker(
                        context: ctx,
                        initialDate: deadline ??
                            DateTime.now()
                                .add(const Duration(days: 7)),
                        firstDate: DateTime.now(),
                        lastDate: DateTime.now()
                            .add(const Duration(days: 365)),
                      );
                      if (d != null) setS(() => deadline = d);
                    },
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 12),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF5F5F5),
                        borderRadius: BorderRadius.circular(8),
                        border: Border.all(color: Colors.grey.shade300),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              deadline == null
                                  ? 'dd-mm-yyyy'
                                  : DateFormat('dd-MM-yyyy')
                                      .format(deadline!),
                              style: TextStyle(
                                  fontSize: 13,
                                  color: deadline == null
                                      ? Colors.grey
                                      : Colors.black87),
                            ),
                          ),
                          const Icon(Icons.calendar_today,
                              size: 16, color: Colors.grey),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            actions: [
              TextButton(
                  onPressed: () => Navigator.pop(ctx),
                  child: const Text('Cancel')),
              ElevatedButton(
                style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primary),
                onPressed: uploading
                    ? null
                    : () async {
                        if (selectedSubject == null ||
                            titleCtrl.text.trim().isEmpty ||
                            deadline == null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                                content: Text(
                                    'Please fill Subject, Title and Deadline')),
                          );
                          return;
                        }
                        setS(() => uploading = true);
                        try {
                          String? fileUrl = existingFileUrl;

                          // Upload file first (separate try so we get specific error)
                          if (pickedFile != null) {
                            try {
                              final res = await apiService.uploadFile(
                                '/assignments/upload',
                                pickedFile!,
                                'file',
                              );
                              fileUrl = res['fileUrl']?.toString();
                            } catch (uploadErr) {
                              if (mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(
                                    content: Text(
                                        'File upload failed: $uploadErr'),
                                    backgroundColor: Colors.orange,
                                  ),
                                );
                              }
                              // Continue without file
                              fileUrl = null;
                            }
                          }

                          final dl = deadline!;
                          final deadlineStr =
                              '${dl.year.toString().padLeft(4, '0')}-'
                              '${dl.month.toString().padLeft(2, '0')}-'
                              '${dl.day.toString().padLeft(2, '0')} 23:59:00';

                          final body = <String, dynamic>{
                            'course': selectedSubject,
                            'title': titleCtrl.text.trim(),
                            'description': descCtrl.text.trim(),
                            'deadline': deadlineStr,
                          };
                          if (fileUrl != null) body['fileUrl'] = fileUrl;

                          if (editing == null) {
                            await apiService.post('/assignments', body);
                          } else {
                            await apiService.put(
                                '/assignments/${editing.assignmentId}',
                                body);
                          }
                          if (mounted) {
                            Navigator.pop(ctx);
                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(
                                content: Text('Assignment saved successfully'),
                                backgroundColor: Colors.green,
                              ),
                            );
                          }
                          _load();
                        } catch (e) {
                          debugPrint('Assignment error: $e');
                          if (mounted) {
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Error: $e'),
                                backgroundColor: Colors.red,
                                duration: const Duration(seconds: 5),
                              ),
                            );
                          }
                        } finally {
                          setS(() => uploading = false);
                        }
                      },
                child: uploading
                    ? const SizedBox(
                        width: 18,
                        height: 18,
                        child: CircularProgressIndicator(
                            color: Colors.white, strokeWidth: 2))
                    : Text(
                        editing == null
                            ? 'Create Assignment'
                            : 'Save Changes',
                        style:
                            const TextStyle(color: Colors.white)),
              ),
            ],
          );
        },
      ),
    );
  }

  // ── Delete ────────────────────────────────────────────
  Future<void> _delete(AssignmentModel a) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete Assignment'),
        content: Text('Delete "${a.title}"?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel')),
          ElevatedButton(
            style:
                ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete',
                style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (ok == true) {
      await apiService.delete('/assignments/${a.assignmentId}');
      _load();
    }
  }

  // ── Submit (student) ──────────────────────────────────
  Future<void> _submit(AssignmentModel a) async {
    final result = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'doc', 'docx', 'txt', 'zip'],
    );
    if (result == null || result.files.single.path == null) return;
    try {
      await apiService.uploadFile(
        '/student/submit-assignment',
        File(result.files.single.path!),
        'submissionFile',
        fields: {
          'assignmentId': a.assignmentId.toString(),
          'studentId': widget.userId.toString(),
        },
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Submitted successfully'),
            backgroundColor: AppTheme.success));
      }
      _load();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(e.toString())));
      }
    }
  }

  Color _statusColor(String? s) {
    switch (s) {
      case 'submitted': return AppTheme.success;
      case 'overdue': return AppTheme.error;
      default: return AppTheme.warning;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      floatingActionButton: _isFaculty
          ? FloatingActionButton.extended(
              onPressed: () => _showDialog(),
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.white,
              icon: const Icon(Icons.add),
              label: const Text('Create Assignment',
                  style: TextStyle(fontWeight: FontWeight.w600)),
            )
          : null,
      body: _loading
          ? const LoadingWidget()
          : _error != null
              ? AppErrorWidget(message: _error!, onRetry: _load)
              : RefreshIndicator(
                  onRefresh: _load,
                  child: CustomScrollView(
                    physics: const AlwaysScrollableScrollPhysics(),
                    slivers: [
                      // ── Header ──
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  const Text('📋',
                                      style: TextStyle(fontSize: 18)),
                                  const SizedBox(width: 8),
                                  const Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text('Assignments Management',
                                            style: TextStyle(
                                                fontSize: 17,
                                                fontWeight:
                                                    FontWeight.bold)),
                                        Text(
                                            'Upload assignments, set deadlines, and track submissions',
                                            style: TextStyle(
                                                fontSize: 11,
                                                color: Colors.grey)),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 14),
                              // Stat cards
                              if (_isFaculty)
                                GridView.count(
                                  crossAxisCount: 2,
                                  shrinkWrap: true,
                                  physics:
                                      const NeverScrollableScrollPhysics(),
                                  crossAxisSpacing: 10,
                                  mainAxisSpacing: 10,
                                  childAspectRatio: 2.4,
                                  children: [
                                    _StatCard(
                                        label: 'TOTAL ASSIGNMENTS',
                                        value: '$_total',
                                        icon: Icons.assignment,
                                        color: const Color(0xFF1976D2),
                                        borderColor:
                                            const Color(0xFF90CAF9)),
                                    _StatCard(
                                        label: 'ACTIVE',
                                        value: '$_active',
                                        icon: Icons.check_circle,
                                        color: AppTheme.success,
                                        borderColor:
                                            const Color(0xFFA5D6A7)),
                                    _StatCard(
                                        label: 'OVERDUE',
                                        value: '$_overdue',
                                        icon: Icons.alarm,
                                        color: AppTheme.warning,
                                        borderColor:
                                            const Color(0xFFFFCC80)),
                                    _StatCard(
                                        label: 'TOTAL SUBMISSIONS',
                                        value: '$_totalSubmissions',
                                        icon: Icons.bar_chart,
                                        color: AppTheme.error,
                                        borderColor:
                                            const Color(0xFFEF9A9A)),
                                  ],
                                ),
                              const SizedBox(height: 14),
                            ],
                          ),
                        ),
                      ),

                      // ── List ──
                      _assignments.isEmpty
                          ? const SliverFillRemaining(
                              child: EmptyStateWidget(
                                  message: 'No assignments yet',
                                  icon: Icons.assignment_outlined))
                          : SliverPadding(
                              padding: const EdgeInsets.fromLTRB(
                                  16, 0, 16, 100),
                              sliver: SliverList(
                                delegate: SliverChildBuilderDelegate(
                                  (_, i) => _AssignmentCard(
                                    assignment: _assignments[i],
                                    isFaculty: _isFaculty,
                                    onEdit: _isFaculty
                                        ? () => _showDialog(
                                            editing: _assignments[i])
                                        : null,
                                    onDelete: _isFaculty
                                        ? () => _delete(_assignments[i])
                                        : null,
                                    onSubmit: !_isFaculty &&
                                            _assignments[i].status ==
                                                'pending'
                                        ? () => _submit(_assignments[i])
                                        : null,
                                    statusColor: _statusColor(
                                        _assignments[i].status),
                                  ),
                                  childCount: _assignments.length,
                                ),
                              ),
                            ),
                    ],
                  ),
                ),
    );
  }
}

// ── Assignment Card ────────────────────────────────────
class _AssignmentCard extends StatelessWidget {
  final AssignmentModel assignment;
  final bool isFaculty;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;
  final VoidCallback? onSubmit;
  final Color statusColor;

  const _AssignmentCard({
    required this.assignment,
    required this.isFaculty,
    required this.statusColor,
    this.onEdit,
    this.onDelete,
    this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    final a = assignment;
    final overdue = AppDateUtils.isOverdue(a.deadline);
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withValues(alpha: 0.05),
              blurRadius: 6,
              offset: const Offset(0, 2))
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Title row
            Row(
              children: [
                Expanded(
                  child: Text(a.title,
                      style: const TextStyle(
                          fontWeight: FontWeight.bold, fontSize: 15)),
                ),
                if (a.status != null)
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: statusColor.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(a.status!.toUpperCase(),
                        style: TextStyle(
                            fontSize: 10,
                            color: statusColor,
                            fontWeight: FontWeight.bold)),
                  ),
              ],
            ),
            const SizedBox(height: 4),
            // Course badge
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: AppTheme.primary.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(a.course,
                  style: const TextStyle(
                      color: AppTheme.primary,
                      fontSize: 11,
                      fontWeight: FontWeight.w600)),
            ),
            if (a.description != null && a.description!.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(a.description!,
                  style:
                      const TextStyle(color: Colors.grey, fontSize: 12),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis),
            ],
            const SizedBox(height: 8),
            // Created / Due
            Row(
              children: [
                const Icon(Icons.calendar_today,
                    size: 12, color: Colors.grey),
                const SizedBox(width: 4),
                Text(
                    'Created: ${AppDateUtils.formatDate(a.createdAt ?? '')}',
                    style: const TextStyle(
                        fontSize: 11, color: Colors.grey)),
              ],
            ),
            const SizedBox(height: 4),
            Row(
              children: [
                Icon(Icons.schedule,
                    size: 12,
                    color: overdue ? AppTheme.error : Colors.grey),
                const SizedBox(width: 4),
                Text('Due: ${AppDateUtils.formatDate(a.deadline)}',
                    style: TextStyle(
                        fontSize: 11,
                        color: overdue ? AppTheme.error : Colors.grey,
                        fontWeight: overdue
                            ? FontWeight.bold
                            : FontWeight.normal)),
              ],
            ),
            // Faculty: submission status
            if (isFaculty) ...[
              const SizedBox(height: 10),
              Row(
                children: [
                  const Text('Submission Status',
                      style: TextStyle(
                          fontSize: 11, fontWeight: FontWeight.w600)),
                  const Spacer(),
                  Text('${a.submittedCount ?? 0}%',
                      style: const TextStyle(
                          fontSize: 11, fontWeight: FontWeight.bold)),
                ],
              ),
              const SizedBox(height: 6),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _SubStat('Submitted', a.submittedCount ?? 0,
                      Colors.green),
                  _SubStat('Pending',
                      (a.totalSubmissions ?? 0) - (a.submittedCount ?? 0),
                      Colors.orange),
                  _SubStat('Late', 0, Colors.red),
                ],
              ),
              const SizedBox(height: 10),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  // Edit
                  _ActionBtn(
                      icon: Icons.edit,
                      color: const Color(0xFFE65100),
                      onTap: onEdit!),
                  const SizedBox(width: 8),
                  // Delete
                  _ActionBtn(
                      icon: Icons.delete_outline,
                      color: Colors.grey,
                      onTap: onDelete!),
                ],
              ),
            ],
            // Student: submit button
            if (!isFaculty && onSubmit != null) ...[
              const SizedBox(height: 10),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: onSubmit,
                  icon: const Icon(Icons.upload_file, size: 16),
                  label: const Text('Submit Assignment'),
                  style: ElevatedButton.styleFrom(
                      padding:
                          const EdgeInsets.symmetric(vertical: 10)),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _SubStat extends StatelessWidget {
  final String label;
  final int count;
  final Color color;
  const _SubStat(this.label, this.count, this.color);

  @override
  Widget build(BuildContext context) => Column(
        children: [
          Container(
              width: 8,
              height: 8,
              decoration:
                  BoxDecoration(color: color, shape: BoxShape.circle)),
          const SizedBox(height: 2),
          Text(label,
              style: const TextStyle(fontSize: 9, color: Colors.grey)),
          Text('$count',
              style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  color: color)),
        ],
      );
}

class _ActionBtn extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  const _ActionBtn(
      {required this.icon, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(6),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(6),
            border: Border.all(color: Colors.grey.shade300),
            boxShadow: [
              BoxShadow(
                  color: Colors.black.withValues(alpha: 0.05),
                  blurRadius: 3)
            ],
          ),
          child: Icon(icon, size: 16, color: color),
        ),
      );
}

// ── Stat Card ──────────────────────────────────────────
class _StatCard extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  final Color color;
  final Color borderColor;
  const _StatCard(
      {required this.label,
      required this.value,
      required this.icon,
      required this.color,
      required this.borderColor});

  @override
  Widget build(BuildContext context) => Container(
        padding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: borderColor.withValues(alpha: 0.6)),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withValues(alpha: 0.04),
                blurRadius: 4,
                offset: const Offset(0, 2))
          ],
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8)),
              child: Icon(icon, color: color, size: 18),
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
                  Text(value,
                      style: TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: color)),
                ],
              ),
            ),
          ],
        ),
      );
}

// ── Helpers ────────────────────────────────────────────
Widget _lbl(String t) => Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Text(t,
          style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Colors.black87)),
    );

InputDecoration _dec(String hint) => InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: Colors.grey, fontSize: 13),
      filled: true,
      fillColor: const Color(0xFFF5F5F5),
      isDense: true,
      contentPadding:
          const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide.none),
      enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.grey.shade300)),
      focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: AppTheme.primary)),
    );
