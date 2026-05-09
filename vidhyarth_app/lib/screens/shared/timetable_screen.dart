import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../../core/theme/app_theme.dart';
import '../../core/utils/date_utils.dart';
import '../../models/timetable_model.dart';
import '../../services/api_service.dart';
import '../../widgets/empty_state_widget.dart';
import '../../widgets/error_widget.dart';
import '../../widgets/loading_widget.dart';

class TimetableScreen extends StatefulWidget {
  final int userId;
  final String userType;
  const TimetableScreen(
      {super.key, required this.userId, required this.userType});

  @override
  State<TimetableScreen> createState() => _TimetableScreenState();
}

class _TimetableScreenState extends State<TimetableScreen> {
  List<TimetableModel> _entries = [];
  List<String> _assignedSubjects = []; // only for faculty add-class dialog
  bool _loading = true;
  String? _error;

  static const _days = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];

  @override
  void initState() {
    super.initState();
    _load();
  }

  // ── Load timetable + assigned subjects ────────────────
  Future<void> _load() async {
    setState(() { _loading = true; _error = null; });
    try {
      final endpoint = widget.userType == 'faculty'
          ? '/timetable/faculty/${widget.userId}'
          : '/student/timetable/${widget.userId}';
      final data = await apiService.get(endpoint) as List;
      setState(() {
        _entries = data.map((e) => TimetableModel.fromJson(e)).toList();
        _loading = false;
      });
      // Load assigned subjects for add-class dialog (faculty only)
      if (widget.userType == 'faculty') {
        _loadAssignedSubjects();
      }
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Future<void> _loadAssignedSubjects() async {
    try {
      final data = await apiService.get(
          '/faculty-subject-assignment/faculty/${widget.userId}/assignments') as List;
      final subjects = data
          .map((e) => e['subject_name']?.toString() ?? '')
          .where((s) => s.isNotEmpty)
          .toSet()
          .toList()
        ..sort();
      if (mounted) setState(() => _assignedSubjects = subjects);
    } catch (_) {}
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

  // ── Group by time slot ────────────────────────────────
  List<String> get _timeSlots {
    final times = _entries.map((e) => e.startTime).toSet().toList()
      ..sort((a, b) => _parseTimeValue(a).compareTo(_parseTimeValue(b)));
    return times;
  }

  List<TimetableModel> _forDayTime(String day, String time) =>
      _entries.where((e) => e.day == day && e.startTime == time).toList();

  String _to12hr(TimeOfDay t) {
    int h = t.hour;
    // Apply heuristic for parsing 24-hr values back to AM/PM string correctly
    if (h >= 1 && h <= 6 && t.period == DayPeriod.am) {
      h += 12;
    }
    final suffix = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h == 0) h = 12;
    final m = t.minute.toString().padLeft(2, '0');
    return '$h:$m $suffix';
  }

  // Store 24hr for API, display 12hr in field
  String _to24hr(TimeOfDay t) =>
      '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';

  // ── Add Class Dialog ──────────────────────────────────
  void _showAddDialog() {
    String? selectedSubject;
    String selectedDay = 'Monday';
    final startCtrl = TextEditingController();
    final endCtrl = TextEditingController();
    final roomCtrl = TextEditingController();
    String startTime24 = '';
    String endTime24 = '';

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) => AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.add_circle, color: AppTheme.primary, size: 20),
              SizedBox(width: 8),
              Text('Add New Class',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Subject
                _label('Subject *'),
                DropdownButtonFormField<String>(
                  value: selectedSubject,
                  decoration: _dec('Select Subject'),
                  items: _assignedSubjects
                      .map((s) => DropdownMenuItem(value: s, child: Text(s)))
                      .toList(),
                  onChanged: (v) => setS(() => selectedSubject = v),
                ),
                const SizedBox(height: 12),
                // Day
                _label('Day *'),
                DropdownButtonFormField<String>(
                  value: selectedDay,
                  decoration: _dec('Select Day'),
                  items: _days
                      .map((d) => DropdownMenuItem(value: d, child: Text(d)))
                      .toList(),
                  onChanged: (v) => setS(() => selectedDay = v!),
                ),
                const SizedBox(height: 12),
                // Start / End time
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Start Time *'),
                          TextFormField(
                            controller: startCtrl,
                            decoration: _dec('e.g. 9:00 AM'),
                            readOnly: true,
                            onTap: () async {
                              final t = await showTimePicker(
                                  context: ctx,
                                  initialTime: TimeOfDay.now());
                              if (t != null) {
                                startTime24 = _to24hr(t);
                                setS(() => startCtrl.text = _to12hr(t));
                              }
                            },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('End Time *'),
                          TextFormField(
                            controller: endCtrl,
                            decoration: _dec('e.g. 10:00 AM'),
                            readOnly: true,
                            onTap: () async {
                              final t = await showTimePicker(
                                  context: ctx,
                                  initialTime: TimeOfDay.now());
                              if (t != null) {
                                endTime24 = _to24hr(t);
                                setS(() => endCtrl.text = _to12hr(t));
                              }
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                // Room
                _label('Room No'),
                TextFormField(
                  controller: roomCtrl,
                  decoration: _dec('e.g. 401'),
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
              onPressed: () async {
                if (selectedSubject == null ||
                    startTime24.isEmpty ||
                    endTime24.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
                      content: Text('Fill all required fields')));
                  return;
                }
                try {
                  await apiService.post('/timetable', {
                    'facultyId': widget.userId,
                    'subject': selectedSubject,
                    'day': selectedDay,
                    'startTime': '$startTime24:00',
                    'endTime': '$endTime24:00',
                    'roomNo': roomCtrl.text.isEmpty ? null : roomCtrl.text,
                  });
                  if (mounted) Navigator.pop(ctx);
                  _load();
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(e.toString())));
                }
              },
              child: const Text('Add Class',
                  style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  // ── Edit Class Dialog ─────────────────────────────────
  void _showEditDialog(TimetableModel entry) {
    String? selectedSubject = entry.subject;
    String selectedDay = entry.day;
    // Parse existing 24hr times for display
    TimeOfDay _parseTime(String t) {
      final p = t.split(':');
      return TimeOfDay(hour: int.parse(p[0]), minute: int.parse(p[1]));
    }
    final initStart = _parseTime(entry.startTime);
    final initEnd = _parseTime(entry.endTime);
    final startCtrl = TextEditingController(text: _to12hr(initStart));
    final endCtrl = TextEditingController(text: _to12hr(initEnd));
    final roomCtrl = TextEditingController(text: entry.roomNo ?? '');
    String startTime24 = _to24hr(initStart);
    String endTime24 = _to24hr(initEnd);

    final subjects = _assignedSubjects.contains(entry.subject)
        ? _assignedSubjects
        : [entry.subject, ..._assignedSubjects];

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) => AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.edit, color: Color(0xFFE65100), size: 20),
              SizedBox(width: 8),
              Text('Edit Class',
                  style: TextStyle(
                      fontSize: 16, fontWeight: FontWeight.bold)),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _label('Subject *'),
                DropdownButtonFormField<String>(
                  value: selectedSubject,
                  decoration: _dec('Select Subject'),
                  items: subjects
                      .map((s) =>
                          DropdownMenuItem(value: s, child: Text(s)))
                      .toList(),
                  onChanged: (v) => setS(() => selectedSubject = v),
                ),
                const SizedBox(height: 12),
                _label('Day *'),
                DropdownButtonFormField<String>(
                  value: selectedDay,
                  decoration: _dec('Select Day'),
                  items: _days
                      .map((d) =>
                          DropdownMenuItem(value: d, child: Text(d)))
                      .toList(),
                  onChanged: (v) => setS(() => selectedDay = v!),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('Start Time *'),
                          TextFormField(
                            controller: startCtrl,
                            decoration: _dec('e.g. 9:00 AM'),
                            readOnly: true,
                            onTap: () async {
                              final t = await showTimePicker(
                                  context: ctx,
                                  initialTime: _parseTime(entry.startTime));
                              if (t != null) {
                                startTime24 = _to24hr(t);
                                setS(() => startCtrl.text = _to12hr(t));
                              }
                            },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          _label('End Time *'),
                          TextFormField(
                            controller: endCtrl,
                            decoration: _dec('e.g. 10:00 AM'),
                            readOnly: true,
                            onTap: () async {
                              final t = await showTimePicker(
                                  context: ctx,
                                  initialTime: _parseTime(entry.endTime));
                              if (t != null) {
                                endTime24 = _to24hr(t);
                                setS(() => endCtrl.text = _to12hr(t));
                              }
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                _label('Room No'),
                TextFormField(
                  controller: roomCtrl,
                  decoration: _dec('e.g. 401'),
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
              onPressed: () async {
                if (selectedSubject == null ||
                    startTime24.isEmpty ||
                    endTime24.isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                          content: Text('Fill all required fields')));
                  return;
                }
                try {
                  await apiService.put(
                      '/timetable/${entry.timetableId}', {
                    'facultyId': widget.userId,
                    'subject': selectedSubject,
                    'day': selectedDay,
                    'startTime': '$startTime24:00',
                    'endTime': '$endTime24:00',
                    'roomNo': roomCtrl.text.isEmpty
                        ? null
                        : roomCtrl.text,
                  });
                  if (mounted) Navigator.pop(ctx);
                  _load();
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text(e.toString())));
                }
              },
              child: const Text('Save Changes',
                  style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }


  Future<void> _delete(TimetableModel entry) async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('Delete Class'),
        content: Text('Remove "${entry.subject}" on ${entry.day}?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('Cancel')),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Delete',
                style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
    if (ok == true) {
      await apiService.delete('/timetable/${entry.timetableId}');
      _load();
    }
  }

  // ── Export PDF ────────────────────────────────────────
  String _fmt12(String time) {
    try {
      final parts = time.split(':');
      int h = int.parse(parts[0]);
      final m = parts[1].padLeft(2, '0');
      if (h >= 1 && h <= 6) h += 12; // Heuristic: 1-6 is PM
      final suffix = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      if (h == 0) h = 12;
      return '$h:$m $suffix';
    } catch (_) {
      return time;
    }
  }

  Future<void> _exportPdf() async {
    final pdf = pw.Document();
    final facultyName = _entries.isNotEmpty
        ? (_entries.first.facultyName ?? 'Faculty')
        : 'Faculty';
    final generatedOn =
        DateFormat('EEEE, MMMM d, yyyy').format(DateTime.now());
    final timeNow = DateFormat('M/d/yy, h:mm a').format(DateTime.now());

    // Unique subjects
    final subjects =
        _entries.map((e) => e.subject).toSet().toList()..sort();

    // Build grid data
    final timeSlots = _timeSlots;

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4.landscape,
        margin: const pw.EdgeInsets.all(24),
        build: (ctx) => pw.Column(
          crossAxisAlignment: pw.CrossAxisAlignment.start,
          children: [
            // Header
            pw.Row(
              mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
              children: [
                pw.Text(timeNow,
                    style: const pw.TextStyle(fontSize: 8)),
                pw.Text('Faculty Timetable - $facultyName',
                    style: const pw.TextStyle(fontSize: 8)),
              ],
            ),
            pw.SizedBox(height: 8),
            pw.Center(
              child: pw.Text('Faculty Timetable',
                  style: pw.TextStyle(
                      fontSize: 20, fontWeight: pw.FontWeight.bold)),
            ),
            pw.Center(
              child: pw.Text('Faculty: $facultyName',
                  style: pw.TextStyle(
                      fontSize: 12, fontWeight: pw.FontWeight.bold)),
            ),
            pw.Center(
              child: pw.Text('Generated on: $generatedOn',
                  style: const pw.TextStyle(fontSize: 10)),
            ),
            pw.SizedBox(height: 12),
            pw.Divider(),
            pw.SizedBox(height: 8),

            // Table
            pw.Table(
              border: pw.TableBorder.all(
                  color: PdfColors.grey400, width: 0.5),
              columnWidths: {
                0: const pw.FixedColumnWidth(50),
                1: const pw.FlexColumnWidth(),
                2: const pw.FlexColumnWidth(),
                3: const pw.FlexColumnWidth(),
                4: const pw.FlexColumnWidth(),
                5: const pw.FlexColumnWidth(),
                6: const pw.FlexColumnWidth(),
              },
              children: [
                // Header row
                pw.TableRow(
                  decoration:
                      const pw.BoxDecoration(color: PdfColors.blue700),
                  children: [
                    'Time', 'Monday', 'Tuesday', 'Wednesday',
                    'Thursday', 'Friday', 'Saturday'
                  ]
                      .map((h) => pw.Padding(
                            padding: const pw.EdgeInsets.all(6),
                            child: pw.Text(h,
                                style: pw.TextStyle(
                                    color: PdfColors.white,
                                    fontWeight: pw.FontWeight.bold,
                                    fontSize: 9),
                                textAlign: pw.TextAlign.center),
                          ))
                      .toList(),
                ),
                // Data rows
                ...timeSlots.map((time) {
                  return pw.TableRow(
                    children: [
                      // Time cell
                      pw.Padding(
                        padding: const pw.EdgeInsets.all(6),
                        child: pw.Text(
                            _fmt12(time),
                            style: pw.TextStyle(
                                fontWeight: pw.FontWeight.bold,
                                fontSize: 9),
                            textAlign: pw.TextAlign.center),
                      ),
                      // Day cells
                      ..._days.map((day) {
                        final cells = _forDayTime(day, time);
                        if (cells.isEmpty) {
                          return pw.Padding(
                            padding: const pw.EdgeInsets.all(6),
                            child: pw.Text('-',
                                textAlign: pw.TextAlign.center,
                                style: const pw.TextStyle(fontSize: 8)),
                          );
                        }
                        final e = cells.first;
                        return pw.Container(
                          color: PdfColors.blue50,
                          padding: const pw.EdgeInsets.all(4),
                          child: pw.Column(
                            crossAxisAlignment:
                                pw.CrossAxisAlignment.center,
                            children: [
                              pw.Text(e.subject,
                                  style: pw.TextStyle(
                                      fontWeight: pw.FontWeight.bold,
                                      fontSize: 8,
                                      color: PdfColors.blue800),
                                  textAlign: pw.TextAlign.center),
                              pw.Text(
                                  '${_fmt12(e.startTime)} - ${_fmt12(e.endTime)}',
                                  style: const pw.TextStyle(fontSize: 7)),
                              if (e.roomNo != null)
                                pw.Text('Room: ${e.roomNo}',
                                    style:
                                        const pw.TextStyle(fontSize: 7)),
                            ],
                          ),
                        );
                      }),
                    ],
                  );
                }),
              ],
            ),

            pw.SizedBox(height: 16),
            // Subjects list
            pw.Text('Subjects:',
                style: pw.TextStyle(
                    fontWeight: pw.FontWeight.bold,
                    fontSize: 11,
                    color: PdfColors.blue800)),
            pw.SizedBox(height: 4),
            pw.Wrap(
              spacing: 16,
              children: subjects
                  .map((s) => pw.Text(s,
                      style: const pw.TextStyle(fontSize: 10)))
                  .toList(),
            ),
          ],
        ),
      ),
    );

    await Printing.layoutPdf(
      onLayout: (_) async => pdf.save(),
      name: 'Faculty_Timetable_$facultyName.pdf',
    );
  }

  // ── Build ─────────────────────────────────────────────
  @override
  Widget build(BuildContext context) {
    final isFaculty = widget.userType == 'faculty';
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      // ── FABs ──
      floatingActionButton: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          // Export PDF FAB
          FloatingActionButton.extended(
            heroTag: 'pdf',
            onPressed: _entries.isEmpty ? null : _exportPdf,
            backgroundColor:
                _entries.isEmpty ? Colors.grey : Colors.white,
            foregroundColor: AppTheme.primary,
            elevation: 3,
            icon: const Icon(Icons.picture_as_pdf, size: 18),
            label: const Text('Export PDF',
                style: TextStyle(
                    fontSize: 12, fontWeight: FontWeight.w600)),
          ),
          if (isFaculty) ...[
            const SizedBox(height: 12),
            // Add Class FAB
            FloatingActionButton.extended(
              heroTag: 'add',
              onPressed: _showAddDialog,
              backgroundColor: AppTheme.primary,
              foregroundColor: Colors.white,
              elevation: 3,
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Add Class',
                  style: TextStyle(
                      fontSize: 12, fontWeight: FontWeight.w600)),
            ),
          ],
        ],
      ),
      body: _loading
          ? const LoadingWidget()
          : _error != null
              ? AppErrorWidget(message: _error!, onRetry: _load)
              : Column(
                  children: [
                    // ── Top bar (title only) ──
                    Container(
                      color: Colors.white,
                      padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
                      child: const Row(
                        children: [
                          Icon(Icons.calendar_month,
                              color: AppTheme.primary, size: 20),
                          SizedBox(width: 8),
                          Text('Timetable Management',
                              style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.bold)),
                        ],
                      ),
                    ),
                    const Divider(height: 1),

                    // ── Grid ──
                    Expanded(
                      child: _entries.isEmpty
                          ? const EmptyStateWidget(
                              message: 'No classes scheduled yet',
                              icon: Icons.event_busy)
                          : _buildGrid(),
                    ),
                  ],
                ),
    );
  }

  // ── Timetable Grid ────────────────────────────────────
  Widget _buildGrid() {
    final timeSlots = _timeSlots;
    final isFaculty = widget.userType == 'faculty';
    const colWidth = 110.0;
    const timeColWidth = 60.0;
    const rowHeight = 110.0;
    const headerHeight = 40.0;

    return SingleChildScrollView(
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Header row ──
            Row(
              children: [
                // Time header
                Container(
                  width: timeColWidth,
                  height: headerHeight,
                  decoration: const BoxDecoration(
                    color: Color(0xFF1A2340),
                    border: Border(
                        right: BorderSide(color: Colors.white24),
                        bottom: BorderSide(color: Colors.white24)),
                  ),
                  alignment: Alignment.center,
                  child: const Text('Time',
                      style: TextStyle(
                          color: Colors.white,
                          fontSize: 11,
                          fontWeight: FontWeight.bold)),
                ),
                // Day headers
                ..._days.map((day) {
                  final isToday = day ==
                      DateFormat('EEEE').format(DateTime.now());
                  return Container(
                    width: colWidth,
                    height: headerHeight,
                    decoration: BoxDecoration(
                      color: isToday
                          ? const Color(0xFF1976D2)
                          : const Color(0xFF1A2340),
                      border: const Border(
                          right: BorderSide(color: Colors.white24),
                          bottom: BorderSide(color: Colors.white24)),
                    ),
                    alignment: Alignment.center,
                    child: Text(day.substring(0, 3),
                        style: const TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.bold)),
                  );
                }),
              ],
            ),

            // ── Time rows ──
            ...timeSlots.map((time) {
              return Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Time label
                  Container(
                    width: timeColWidth,
                    height: rowHeight,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border.all(
                          color: Colors.grey.shade200, width: 0.5),
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      _fmt12(time),
                      style: const TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: Colors.black54),
                    ),
                  ),
                  // Day cells
                  ..._days.map((day) {
                    final cells = _forDayTime(day, time);
                    return Container(
                      width: colWidth,
                      height: rowHeight,
                      decoration: BoxDecoration(
                        color: Colors.white,
                        border: Border.all(
                            color: Colors.grey.shade200, width: 0.5),
                      ),
                      padding: const EdgeInsets.all(4),
                      child: cells.isEmpty
                          ? const SizedBox()
                          : _GridCell(
                              entry: cells.first,
                              isFaculty: isFaculty,
                              onDelete: () => _delete(cells.first),
                              onEdit: () => _showEditDialog(cells.first),
                            ),
                    );
                  }),
                ],
              );
            }),
          ],
        ),
      ),
    );
  }
}

// ── Grid Cell ──────────────────────────────────────────
class _GridCell extends StatelessWidget {
  final TimetableModel entry;
  final bool isFaculty;
  final VoidCallback onDelete;
  final VoidCallback onEdit;

  const _GridCell({
    required this.entry,
    required this.isFaculty,
    required this.onDelete,
    required this.onEdit,
  });

  String _fmt12(String time) {
    try {
      final parts = time.split(':');
      int h = int.parse(parts[0]);
      final m = parts[1].padLeft(2, '0');
      if (h >= 1 && h <= 6) h += 12; // Heuristic: 1-6 is PM
      final suffix = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      if (h == 0) h = 12;
      return '$h:$m $suffix';
    } catch (_) {
      return time;
    }
  }

  @override
  Widget build(BuildContext context) => Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: const Color(0xFF90CAF9), width: 1.2),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.06),
              blurRadius: 6,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Subject name
            Text(
              entry.subject,
              style: const TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.bold,
                color: Color(0xFF1A2340),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 3),
            // Time in orange
            Text(
              '${_fmt12(entry.startTime)} - ${_fmt12(entry.endTime)}',
              style: const TextStyle(
                fontSize: 9,
                color: Color(0xFFE65100),
                fontWeight: FontWeight.w500,
              ),
              textAlign: TextAlign.center,
            ),
            // Room
            if (entry.roomNo != null) ...[
              const SizedBox(height: 2),
              Text(
                'Room: ${entry.roomNo}',
                style: const TextStyle(
                    fontSize: 9, color: Colors.grey),
                textAlign: TextAlign.center,
              ),
            ],
            // Edit + Delete buttons (faculty only)
            if (isFaculty) ...[
              const SizedBox(height: 5),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  _IconBtn(
                    icon: Icons.edit,
                    color: const Color(0xFFE65100),
                    onTap: onEdit,
                  ),
                  const SizedBox(width: 6),
                  _IconBtn(
                    icon: Icons.delete_outline,
                    color: Colors.grey,
                    onTap: onDelete,
                  ),
                ],
              ),
            ],
          ],
        ),
      );
}

class _IconBtn extends StatelessWidget {
  final IconData icon;
  final Color color;
  final VoidCallback onTap;
  const _IconBtn(
      {required this.icon, required this.color, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(
          width: 26,
          height: 26,
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
          child: Icon(icon, size: 14, color: color),
        ),
      );
}

// ── Helpers ────────────────────────────────────────────
Widget _label(String text) => Padding(
      padding: const EdgeInsets.only(bottom: 4),
      child: Text(text,
          style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Colors.black87)),
    );

InputDecoration _dec(String hint) => InputDecoration(
      hintText: hint,
      hintStyle: const TextStyle(fontSize: 13, color: Colors.grey),
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
          borderSide:
              const BorderSide(color: AppTheme.primary)),
    );
