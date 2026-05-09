import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../../core/theme/app_theme.dart';
import '../../services/api_service.dart';
import '../../widgets/loading_widget.dart';
import '../../widgets/error_widget.dart';
import '../../widgets/empty_state_widget.dart';

class ReportsScreen extends StatefulWidget {
  final int facultyId;
  final String facultyName;
  const ReportsScreen(
      {super.key, required this.facultyId, required this.facultyName});

  @override
  State<ReportsScreen> createState() => _ReportsScreenState();
}

class _ReportsScreenState extends State<ReportsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  // Data
  Map<String, dynamic>? _overview;
  List<Map<String, dynamic>> _performance = [];
  List<Map<String, dynamic>> _weakStudents = [];
  Map<String, dynamic>? _charts;
  List<Map<String, dynamic>> _students = [];
  List<String> _subjects = [];

  // Filters
  String? _filterSubject;
  String? _filterSemester;

  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadAll();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadAll() async {
    setState(() { _loading = true; _error = null; });
    try {
      final id = widget.facultyId;
      final results = await Future.wait([
        apiService.get('/reports/dashboard/$id'),
        apiService.get('/reports/student-performance/$id') as Future,
        apiService.get('/reports/weak-students/$id') as Future,
        apiService.get('/reports/charts/$id'),
        apiService.get('/messages/students') as Future,
        apiService.get('/reports/filters'),
      ]);
      setState(() {
        _overview = results[0] as Map<String, dynamic>;
        _performance = (results[1] as List).cast<Map<String, dynamic>>();
        _weakStudents = (results[2] as List).cast<Map<String, dynamic>>();
        _charts = results[3] as Map<String, dynamic>;
        _students = (results[4] as List).cast<Map<String, dynamic>>();
        final filters = results[5] as Map<String, dynamic>;
        _subjects = (filters['subjects'] as List? ?? []).cast<String>();
        _loading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  List<Map<String, dynamic>> get _filteredPerformance {
    return _performance.where((p) {
      if (_filterSubject != null && p['subject'] != _filterSubject) return false;
      return true;
    }).toList();
  }

  // ── Add Grade Dialog ──────────────────────────────────
  void _showAddGrade() {
    Map<String, dynamic>? selStudent;
    String? selSubject;
    String selExamType = 'Quiz';
    DateTime selDate = DateTime.now();
    final marksCtrl = TextEditingController();
    final totalCtrl = TextEditingController();
    String? selGrade;
    bool saving = false;

    final examTypes = ['Quiz', 'Mid-Term', 'Final', 'Assignment', 'Practical'];
    final grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D', 'F'];

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) => AlertDialog(
          title: const Row(children: [
            Icon(Icons.add, color: AppTheme.primary, size: 18),
            SizedBox(width: 8),
            Text('Add Student Grade',
                style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
            Spacer(),
          ]),
          content: SingleChildScrollView(
            child: Column(mainAxisSize: MainAxisSize.min, children: [
              Row(children: [
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  _lbl('Student *'),
                  DropdownButtonFormField<Map<String, dynamic>>(
                    value: selStudent,
                    isExpanded: true,
                    decoration: _dec('Select Student'),
                    items: _students.map((s) => DropdownMenuItem(
                      value: s,
                      child: Text(s['name'] ?? '', style: const TextStyle(fontSize: 12),
                          overflow: TextOverflow.ellipsis),
                    )).toList(),
                    onChanged: (v) => setS(() => selStudent = v),
                  ),
                ])),
                const SizedBox(width: 10),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  _lbl('Subject *'),
                  DropdownButtonFormField<String>(
                    value: selSubject,
                    isExpanded: true,
                    decoration: _dec('Select Subject'),
                    items: _subjects.map((s) => DropdownMenuItem(
                      value: s,
                      child: Text(s, style: const TextStyle(fontSize: 12),
                          overflow: TextOverflow.ellipsis),
                    )).toList(),
                    onChanged: (v) => setS(() => selSubject = v),
                  ),
                ])),
              ]),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  _lbl('Exam Type *'),
                  DropdownButtonFormField<String>(
                    value: selExamType,
                    decoration: _dec(''),
                    items: examTypes.map((e) => DropdownMenuItem(
                        value: e, child: Text(e, style: const TextStyle(fontSize: 12)))).toList(),
                    onChanged: (v) => setS(() => selExamType = v!),
                  ),
                ])),
                const SizedBox(width: 10),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  _lbl('Exam Date *'),
                  GestureDetector(
                    onTap: () async {
                      final d = await showDatePicker(
                        context: ctx,
                        initialDate: selDate,
                        firstDate: DateTime(2020),
                        lastDate: DateTime.now(),
                      );
                      if (d != null) setS(() => selDate = d);
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
                          DateFormat('dd-MM-yyyy').format(selDate),
                          style: const TextStyle(fontSize: 12),
                        )),
                        const Icon(Icons.calendar_today, size: 14, color: Colors.grey),
                      ]),
                    ),
                  ),
                ])),
              ]),
              const SizedBox(height: 12),
              Row(children: [
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  _lbl('Marks Obtained *'),
                  TextFormField(controller: marksCtrl,
                      keyboardType: TextInputType.number,
                      decoration: _dec('e.g. 85')),
                ])),
                const SizedBox(width: 10),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  _lbl('Total Marks *'),
                  TextFormField(controller: totalCtrl,
                      keyboardType: TextInputType.number,
                      decoration: _dec('e.g. 100')),
                ])),
              ]),
              const SizedBox(height: 12),
              _lbl('Grade Letter *'),
              DropdownButtonFormField<String>(
                value: selGrade,
                decoration: _dec('Select Grade'),
                items: grades.map((g) => DropdownMenuItem(
                    value: g, child: Text(g, style: const TextStyle(fontSize: 12)))).toList(),
                onChanged: (v) => setS(() => selGrade = v),
              ),
            ]),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Cancel')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
              onPressed: saving ? null : () async {
                if (selStudent == null || selSubject == null ||
                    marksCtrl.text.isEmpty || totalCtrl.text.isEmpty || selGrade == null) {
                  ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Fill all required fields')));
                  return;
                }
                setS(() => saving = true);
                try {
                  await apiService.post('/reports/add-grade', {
                    'studentId': selStudent!['student_id'],
                    'facultyId': widget.facultyId,
                    'subject': selSubject,
                    'examType': selExamType,
                    'marksObtained': double.parse(marksCtrl.text),
                    'totalMarks': double.parse(totalCtrl.text),
                    'gradeLetter': selGrade,
                    'examDate': DateFormat('yyyy-MM-dd').format(selDate),
                  });
                  if (mounted) {
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                        content: Text('Grade added'), backgroundColor: AppTheme.success));
                  }
                  _loadAll();
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(e.toString()), backgroundColor: Colors.red));
                } finally {
                  setS(() => saving = false);
                }
              },
              child: saving
                  ? const SizedBox(width: 18, height: 18,
                      child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                  : const Text('Add Grade', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  // ── Coming Soon Dialog ────────────────────────────────
  void _showComingSoon(String feature) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: Row(children: [
          Icon(feature.contains('PDF') ? Icons.picture_as_pdf : Icons.table_chart,
              color: AppTheme.primary, size: 22),
          const SizedBox(width: 8),
          Text(feature, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
        ]),
        content: Column(mainAxisSize: MainAxisSize.min, children: [
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFF3F4F6),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Column(children: [
              Icon(Icons.construction, size: 48, color: Colors.grey.shade400),
              const SizedBox(height: 12),
              Text('Downloading ${feature.contains('PDF') ? 'PDF' : 'Excel'} report...',
                  style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600)),
              const SizedBox(height: 6),
              const Text('(Feature to be implemented with PDF/Excel library)',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12, color: Colors.grey)),
            ]),
          ),
        ]),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.primary),
            onPressed: () => Navigator.pop(context),
            child: const Text('OK', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }


  Future<void> _downloadPdf() async {
    final pdf = pw.Document();
    final date = DateFormat('MMMM d, yyyy').format(DateTime.now());
    pdf.addPage(pw.MultiPage(
      pageFormat: PdfPageFormat.a4,
      margin: const pw.EdgeInsets.all(28),
      build: (ctx) => [
        pw.Text('Performance Report', style: pw.TextStyle(fontSize: 20, fontWeight: pw.FontWeight.bold)),
        pw.Text('Faculty: ${widget.facultyName}  |  Generated: $date', style: const pw.TextStyle(fontSize: 10)),
        pw.SizedBox(height: 12),
        pw.Divider(),
        pw.SizedBox(height: 8),
        // Overview
        pw.Text('Overview', style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold)),
        pw.SizedBox(height: 6),
        pw.Row(children: [
          _pdfStat('Total Students', '${_overview?['totalStudents'] ?? 0}'),
          pw.SizedBox(width: 20),
          _pdfStat('Subjects Taught', '${_overview?['totalSubjects'] ?? 0}'),
          pw.SizedBox(width: 20),
          _pdfStat('Avg Performance', '${_overview?['averagePerformance'] ?? 0}%'),
          pw.SizedBox(width: 20),
          _pdfStat('Avg Attendance', '${_overview?['averageAttendance'] ?? 0}%'),
        ]),
        pw.SizedBox(height: 16),
        // Student Performance Table
        pw.Text('Student Performance', style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold)),
        pw.SizedBox(height: 6),
        pw.Table(
          border: pw.TableBorder.all(color: PdfColors.grey300, width: 0.5),
          columnWidths: {
            0: const pw.FlexColumnWidth(2),
            1: const pw.FlexColumnWidth(2),
            2: const pw.FlexColumnWidth(1),
            3: const pw.FlexColumnWidth(1),
            4: const pw.FlexColumnWidth(1),
            5: const pw.FlexColumnWidth(1),
          },
          children: [
            pw.TableRow(
              decoration: const pw.BoxDecoration(color: PdfColors.blue700),
              children: ['Student', 'Subject', 'Percentage', 'Grade', 'Attendance', 'Status']
                  .map((h) => pw.Padding(
                        padding: const pw.EdgeInsets.all(6),
                        child: pw.Text(h, style: pw.TextStyle(color: PdfColors.white, fontWeight: pw.FontWeight.bold, fontSize: 9)),
                      ))
                  .toList(),
            ),
            ..._performance.map((p) => pw.TableRow(children: [
              _pdfCell(p['name'] ?? ''),
              _pdfCell(p['subject'] ?? ''),
              _pdfCell('${p['percentage'] ?? 0}%'),
              _pdfCell(p['grade_letter'] ?? '-'),
              _pdfCell('${p['attendance_percentage'] ?? 0}%'),
              _pdfCell(p['status'] ?? '-'),
            ])),
          ],
        ),
        pw.SizedBox(height: 16),
        // At Risk
        if (_weakStudents.isNotEmpty) ...[
          pw.Text('Students Needing Attention', style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold, color: PdfColors.red)),
          pw.SizedBox(height: 6),
          ..._weakStudents.map((s) => pw.Container(
            margin: const pw.EdgeInsets.only(bottom: 4),
            padding: const pw.EdgeInsets.all(8),
            decoration: const pw.BoxDecoration(color: PdfColors.red50),
            child: pw.Row(children: [
              pw.Expanded(child: pw.Text(s['name'] ?? '', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10))),
              pw.Text('${s['subject'] ?? ''} | ${s['percentage'] ?? 0}% | ${s['concern_level'] ?? ''}', style: const pw.TextStyle(fontSize: 9)),
            ]),
          )),
        ],
      ],
    ));
    await Printing.layoutPdf(
      onLayout: (_) async => pdf.save(),
      name: 'Performance_Report_${widget.facultyName}.pdf',
    );
  }

  pw.Widget _pdfStat(String label, String value) => pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text(value, style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold)),
          pw.Text(label, style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey600)),
        ],
      );

  pw.Widget _pdfCell(String text) => pw.Padding(
        padding: const pw.EdgeInsets.all(5),
        child: pw.Text(text, style: const pw.TextStyle(fontSize: 9)),
      );

  // ── Download Excel (CSV) ──────────────────────────────
  Future<void> _downloadExcel() async {
    // Build CSV content
    final lines = <String>['Student,Email,Subject,Percentage,Grade,Attendance,Status'];
    for (final p in _performance) {
      lines.add('"${p['name'] ?? ''}","${p['email'] ?? ''}","${p['subject'] ?? ''}","${p['percentage'] ?? 0}","${p['grade_letter'] ?? ''}","${p['attendance_percentage'] ?? 0}","${p['status'] ?? ''}"');
    }
    final csv = lines.join('\n');
    // Use PDF printing to show a preview dialog with the data
    final pdf = pw.Document();
    pdf.addPage(pw.Page(
      build: (ctx) => pw.Column(
        crossAxisAlignment: pw.CrossAxisAlignment.start,
        children: [
          pw.Text('Performance Data Export', style: pw.TextStyle(fontSize: 16, fontWeight: pw.FontWeight.bold)),
          pw.SizedBox(height: 8),
          pw.Text('CSV Format - Copy the data below:', style: const pw.TextStyle(fontSize: 10)),
          pw.SizedBox(height: 8),
          pw.Container(
            padding: const pw.EdgeInsets.all(8),
            decoration: const pw.BoxDecoration(color: PdfColors.grey100),
            child: pw.Text(csv, style: const pw.TextStyle(fontSize: 8)),
          ),
        ],
      ),
    ));
    await Printing.layoutPdf(
      onLayout: (_) async => pdf.save(),
      name: 'Performance_Export_${widget.facultyName}.pdf',
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const LoadingWidget();
    if (_error != null) return AppErrorWidget(message: _error!, onRetry: _loadAll);

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      // ── FABs ──
      floatingActionButton: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          FloatingActionButton.extended(
            heroTag: 'excel',
            onPressed: () => _showComingSoon('Download Excel'),
            backgroundColor: Colors.white,
            foregroundColor: Colors.grey.shade700,
            elevation: 2,
            icon: const Icon(Icons.table_chart, size: 18),
            label: const Text('Download Excel',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
          ),
          const SizedBox(height: 10),
          FloatingActionButton.extended(
            heroTag: 'pdf',
            onPressed: () => _showComingSoon('Download PDF'),
            backgroundColor: Colors.white,
            foregroundColor: Colors.grey.shade700,
            elevation: 2,
            icon: const Icon(Icons.picture_as_pdf, size: 18),
            label: const Text('Download PDF',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
          ),
          const SizedBox(height: 10),
          FloatingActionButton.extended(
            heroTag: 'grade',
            onPressed: _showAddGrade,
            backgroundColor: const Color(0xFF7C3AED),
            foregroundColor: Colors.white,
            elevation: 2,
            icon: const Icon(Icons.add, size: 18),
            label: const Text('Add Grade',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600)),
          ),
        ],
      ),
      body: Column(children: [
        // ── Header (title + tabs only) ──
        Container(
          color: Colors.white,
          padding: const EdgeInsets.fromLTRB(16, 14, 16, 0),
          child: Column(children: [
            const Align(
              alignment: Alignment.centerLeft,
              child: Text('📊 Performance Dashboard',
                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.bold)),
            ),
            const SizedBox(height: 10),
            TabBar(
              controller: _tabController,
              labelColor: AppTheme.primary,
              unselectedLabelColor: Colors.grey,
              indicatorColor: AppTheme.primary,
              isScrollable: true,
              tabs: const [
                Tab(text: '📋 Overview'),
                Tab(text: '👤 Student Performance'),
                Tab(text: '📈 Analytics'),
                Tab(text: '⚠️ At Risk Students'),
              ],
            ),
          ]),
        ),
        // ── Tab content ──
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildOverview(),
              _buildStudentPerformance(),
              _buildAnalytics(),
              _buildAtRisk(),
            ],
          ),
        ),
      ]),
    );
  }

  // ── Overview Tab ──────────────────────────────────────
  Widget _buildOverview() => RefreshIndicator(
        onRefresh: _loadAll,
        child: ListView(
          padding: const EdgeInsets.all(14),
          children: [
            // Stat cards
            GridView.count(
              crossAxisCount: 2,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 10,
              mainAxisSpacing: 10,
              childAspectRatio: 2.2,
              children: [
                _StatCard('Total Students', '${_overview?['totalStudents'] ?? 0}',
                    Icons.people, const Color(0xFF7C3AED), const Color(0xFFEDE9FE)),
                _StatCard('Subjects Taught', '${_overview?['totalSubjects'] ?? 0}',
                    Icons.menu_book, const Color(0xFF1976D2), const Color(0xFFE3F2FD)),
                _StatCard('Avg Performance', '${_overview?['averagePerformance'] ?? 0}%',
                    Icons.assessment, const Color(0xFFF57C00), const Color(0xFFFFF3E0)),
                _StatCard('Avg Attendance', '${_overview?['averageAttendance'] ?? 0}%',
                    Icons.check_circle, const Color(0xFF388E3C), const Color(0xFFE8F5E9)),
              ],
            ),
            const SizedBox(height: 16),
            // Quick Insights
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: Colors.grey.shade200),
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('🔍 Quick Insights',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                const SizedBox(height: 12),
                Row(children: [
                  Expanded(child: _InsightCard(
                    title: 'Performance Trend',
                    desc: (_overview?['averagePerformance'] ?? 0) >= 75
                        ? 'Overall class performance is Good'
                        : 'Overall class performance Needs Improvement',
                    color: (_overview?['averagePerformance'] ?? 0) >= 75
                        ? Colors.green : Colors.orange,
                  )),
                  const SizedBox(width: 10),
                  Expanded(child: _InsightCard(
                    title: 'Attendance Status',
                    desc: (_overview?['averageAttendance'] ?? 0) >= 75
                        ? 'Class attendance is Satisfactory'
                        : 'Class attendance Needs Attention',
                    color: (_overview?['averageAttendance'] ?? 0) >= 75
                        ? Colors.green : Colors.red,
                  )),
                ]),
              ]),
            ),
          ],
        ),
      );

  // ── Student Performance Tab ───────────────────────────
  Widget _buildStudentPerformance() => Column(children: [
        // Filters
        Container(
          color: Colors.white,
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          child: Row(children: [
            Expanded(child: DropdownButtonFormField<String>(
              value: _filterSubject,
              decoration: _dec('All Subjects'),
              items: [
                const DropdownMenuItem<String>(value: null, child: Text('All Subjects', style: TextStyle(fontSize: 12))),
                ..._subjects.map((s) => DropdownMenuItem<String>(
                    value: s, child: Text(s, style: const TextStyle(fontSize: 12)))),
              ],
              onChanged: (v) => setState(() => _filterSubject = v),
            )),
            const SizedBox(width: 10),
            Expanded(child: DropdownButtonFormField<String>(
              value: _filterSemester,
              decoration: _dec('All Semesters'),
              items: const [
                DropdownMenuItem<String>(value: null, child: Text('All Semesters', style: TextStyle(fontSize: 12))),
                DropdownMenuItem<String>(value: 'Semester - 1', child: Text('Semester - 1', style: TextStyle(fontSize: 12))),
                DropdownMenuItem<String>(value: 'Semester - 2', child: Text('Semester - 2', style: TextStyle(fontSize: 12))),
              ],
              onChanged: (v) => setState(() => _filterSemester = v),
            )),
          ]),
        ),
        // Table
        Expanded(
          child: _filteredPerformance.isEmpty
              ? const EmptyStateWidget(message: 'No performance data yet')
              : ListView(
                  padding: const EdgeInsets.all(14),
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(10),
                        border: Border.all(color: Colors.grey.shade200),
                      ),
                      child: Column(children: [
                        // Header
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
                            Expanded(child: Text('STUDENT', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey))),
                            SizedBox(width: 4),
                            SizedBox(width: 55, child: Text('SUBJECT', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey))),
                            SizedBox(width: 4),
                            SizedBox(width: 40, child: Text('PERF%', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey))),
                            SizedBox(width: 4),
                            SizedBox(width: 32, child: Text('GRD', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey))),
                            SizedBox(width: 4),
                            SizedBox(width: 40, child: Text('ATT%', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey))),
                            SizedBox(width: 4),
                            Text('STATUS', style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold, color: Colors.grey)),
                          ]),
                        ),
                        ..._filteredPerformance.map((p) {
                          final name = p['name'] as String? ?? '';
                          final initials = name.trim().split(' ').take(2)
                              .map((w) => w.isNotEmpty ? w[0] : '').join().toUpperCase();
                          final pct = num.tryParse(p['percentage']?.toString() ?? '0') ?? 0;
                          final att = num.tryParse(p['attendance_percentage']?.toString() ?? '0') ?? 0;
                          final status = p['status'] as String? ?? '';
                          return Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(
                                border: Border(bottom: BorderSide(color: Colors.grey.shade100))),
                            child: Row(children: [
                              CircleAvatar(radius: 16, backgroundColor: _avatarColor(name),
                                  child: Text(initials, style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold))),
                              const SizedBox(width: 8),
                              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Text(name, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600), overflow: TextOverflow.ellipsis),
                                Text(p['email'] ?? '', style: const TextStyle(fontSize: 9, color: Colors.grey), overflow: TextOverflow.ellipsis),
                              ])),
                              const SizedBox(width: 4),
                              SizedBox(width: 55, child: Text(p['subject'] ?? '', style: const TextStyle(fontSize: 10), overflow: TextOverflow.ellipsis)),
                              const SizedBox(width: 4),
                              SizedBox(width: 40, child: Text('$pct%', style: TextStyle(fontSize: 10, color: pct >= 75 ? Colors.green : Colors.red, fontWeight: FontWeight.w600))),
                              const SizedBox(width: 4),
                              Container(
                                width: 32,
                                padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
                                decoration: BoxDecoration(color: AppTheme.primary, borderRadius: BorderRadius.circular(4)),
                                child: Text(p['grade_letter'] ?? '-', style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold), textAlign: TextAlign.center),
                              ),
                              const SizedBox(width: 4),
                              SizedBox(width: 40, child: Text('$att%', style: TextStyle(fontSize: 10, color: att >= 75 ? Colors.green : Colors.red))),
                              const SizedBox(width: 4),
                              _StatusBadge(status),
                            ]),
                          );
                        }),
                      ]),
                    ),
                  ],
                ),
        ),
      ]);

  // ── Analytics Tab ─────────────────────────────────────
  Widget _buildAnalytics() {
    final gradeData = (_charts?['gradeDistribution'] as List? ?? []).cast<Map<String, dynamic>>();
    return ListView(
      padding: const EdgeInsets.all(14),
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: Colors.grey.shade200),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('📊 Grade Distribution',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            if (gradeData.isEmpty)
              const EmptyStateWidget(message: 'No grade data yet')
            else
              SizedBox(
                height: 200,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: gradeData.map((g) {
                    final count = (g['count'] as num? ?? 0).toInt();
                    final maxCount = gradeData.map((x) => (x['count'] as num? ?? 0).toInt()).reduce((a, b) => a > b ? a : b);
                    final barH = maxCount > 0 ? (count / maxCount * 150.0) : 10.0;
                    return Column(
                      mainAxisAlignment: MainAxisAlignment.end,
                      children: [
                        Text('$count', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 4),
                        Container(
                          width: 40,
                          height: barH,
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [Color(0xFF7C3AED), Color(0xFF4F46E5)],
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                            ),
                            borderRadius: BorderRadius.circular(4),
                          ),
                        ),
                        const SizedBox(height: 6),
                        Text(g['grade_letter'] ?? '', style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600)),
                      ],
                    );
                  }).toList(),
                ),
              ),
          ]),
        ),
      ],
    );
  }

  // ── At Risk Tab ───────────────────────────────────────
  Widget _buildAtRisk() => _weakStudents.isEmpty
      ? const EmptyStateWidget(message: 'No at-risk students', icon: Icons.check_circle_outline)
      : ListView(
          padding: const EdgeInsets.all(14),
          children: [
            const Text('⚠️ Students Needing Attention',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
            const SizedBox(height: 10),
            ..._weakStudents.map((s) {
              final name = s['name'] as String? ?? '';
              final initials = name.trim().split(' ').take(2)
                  .map((w) => w.isNotEmpty ? w[0] : '').join().toUpperCase();
              final concern = s['concern_level'] as String? ?? '';
              return Container(
                margin: const EdgeInsets.only(bottom: 10),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.red.shade100),
                  boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.04), blurRadius: 4)],
                ),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    CircleAvatar(radius: 18, backgroundColor: _avatarColor(name),
                        child: Text(initials, style: const TextStyle(color: Colors.white, fontSize: 11, fontWeight: FontWeight.bold))),
                    const SizedBox(width: 10),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(name, style: const TextStyle(fontSize: 13, fontWeight: FontWeight.bold)),
                      Text(s['department'] ?? 'Msc.IT', style: const TextStyle(fontSize: 11, color: Colors.grey)),
                    ])),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: concern == 'Critical' ? Colors.red.shade50 : Colors.orange.shade50,
                        borderRadius: BorderRadius.circular(6),
                        border: Border.all(color: concern == 'Critical' ? Colors.red.shade200 : Colors.orange.shade200),
                      ),
                      child: Text(concern.toUpperCase(),
                          style: TextStyle(fontSize: 9, fontWeight: FontWeight.bold,
                              color: concern == 'Critical' ? Colors.red : Colors.orange)),
                    ),
                  ]),
                  const SizedBox(height: 10),
                  _atRiskRow('Subject:', s['subject'] ?? '-', Colors.black87),
                  _atRiskRow('Performance:', '${s['percentage'] ?? 0}%', Colors.red),
                  _atRiskRow('Attendance:', '${s['attendance_percentage'] ?? 0}%', Colors.orange),
                  Row(children: [
                    const Text('Status:', style: TextStyle(fontSize: 12, color: Colors.grey)),
                    const SizedBox(width: 8),
                    _StatusBadge(s['status'] ?? ''),
                  ]),
                ]),
              );
            }),
          ],
        );

  Widget _atRiskRow(String label, String value, Color valueColor) => Padding(
        padding: const EdgeInsets.only(bottom: 4),
        child: Row(children: [
          Text(label, style: const TextStyle(fontSize: 12, color: Colors.grey)),
          const SizedBox(width: 8),
          Text(value, style: TextStyle(fontSize: 12, color: valueColor, fontWeight: FontWeight.w600)),
        ]),
      );

  Color _avatarColor(String name) {
    const colors = [Color(0xFF1976D2), Color(0xFF388E3C), Color(0xFF7B1FA2),
      Color(0xFFF57C00), Color(0xFFD32F2F), Color(0xFF0097A7)];
    return colors[name.hashCode.abs() % colors.length];
  }
}

// ── Reusable widgets ───────────────────────────────────
class _StatCard extends StatelessWidget {
  final String label, value;
  final IconData icon;
  final Color color, bg;
  const _StatCard(this.label, this.value, this.icon, this.color, this.bg);

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Row(children: [
          Container(padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(8)),
              child: Icon(icon, color: color, size: 18)),
          const SizedBox(width: 10),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center, children: [
            Text(label, style: const TextStyle(fontSize: 9, color: Colors.grey, fontWeight: FontWeight.w600)),
            Text(value, style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
          ])),
        ]),
      );
}

class _InsightCard extends StatelessWidget {
  final String title, desc;
  final Color color;
  const _InsightCard({required this.title, required this.desc, required this.color});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.05),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withValues(alpha: 0.2)),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title, style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: color)),
          const SizedBox(height: 4),
          Text(desc, style: const TextStyle(fontSize: 11, color: Colors.grey)),
        ]),
      );
}

class _StatusBadge extends StatelessWidget {
  final String status;
  const _StatusBadge(this.status);

  @override
  Widget build(BuildContext context) {
    Color color;
    switch (status.toLowerCase()) {
      case 'excellent': color = Colors.green; break;
      case 'good': color = Colors.blue; break;
      case 'average': color = Colors.orange; break;
      case 'poor': color = Colors.red; break;
      default: color = Colors.grey;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(12)),
      child: Text(status.toUpperCase(),
          style: const TextStyle(color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold)),
    );
  }
}

Widget _lbl(String t) => Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Text(t, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: Colors.black87)),
    );

InputDecoration _dec(String hint) => InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(color: Colors.grey, fontSize: 12),
      filled: true,
      fillColor: const Color(0xFFF5F5F5),
      isDense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide.none),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: BorderSide(color: Colors.grey.shade300)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(8), borderSide: const BorderSide(color: AppTheme.primary)),
    );
