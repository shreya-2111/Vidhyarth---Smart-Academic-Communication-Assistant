import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../core/theme/app_theme.dart';
import '../../services/api_service.dart';
import '../../widgets/loading_widget.dart';
import '../../widgets/error_widget.dart';
import '../../widgets/empty_state_widget.dart';
import 'qr_scanner_screen.dart';

class StudentAttendanceScreen extends StatefulWidget {
  final int userId;
  const StudentAttendanceScreen({super.key, required this.userId});

  @override
  State<StudentAttendanceScreen> createState() => _StudentAttendanceScreenState();
}

class _StudentAttendanceScreenState extends State<StudentAttendanceScreen> {
  Map<String, dynamic>? _attendanceData;
  bool _loading = true;
  String? _error;
  String? _selectedMonth;

  @override
  void initState() {
    super.initState();
    _selectedMonth = DateFormat('yyyy-MM').format(DateTime.now());
    _loadAttendance();
  }

  Future<void> _loadAttendance() async {
    setState(() { _loading = true; _error = null; });
    try {
      final queryParam = _selectedMonth != null ? '?month=$_selectedMonth' : '';
      final data = await apiService.get('/qr-attendance/student-attendance/${widget.userId}$queryParam');
      setState(() {
        _attendanceData = data as Map<String, dynamic>;
        _loading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  List<String> _getMonthOptions() {
    final now = DateTime.now();
    final months = <String>[];
    for (int i = 0; i < 12; i++) {
      final month = DateTime(now.year, now.month - i, 1);
      months.add(DateFormat('yyyy-MM').format(month));
    }
    return months;
  }

  String _formatMonthDisplay(String month) {
    final date = DateTime.parse('$month-01');
    return DateFormat('MMMM yyyy').format(date);
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const LoadingWidget();
    if (_error != null) return AppErrorWidget(message: _error!, onRetry: _loadAttendance);

    final stats = _attendanceData?['stats'] ?? {};
    final records = _attendanceData?['records'] ?? [];
    final lowAttendanceSubjects = stats['lowAttendanceSubjects'] ?? [];

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () async {
          final result = await Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => QRScannerScreen(userId: widget.userId),
            ),
          );
          
          // If attendance was marked successfully, refresh the data
          if (result == true) {
            _loadAttendance();
          }
        },
        backgroundColor: AppTheme.primary,
        foregroundColor: Colors.white,
        icon: const Icon(Icons.qr_code_scanner),
        label: const Text('Scan QR'),
      ),
      body: RefreshIndicator(
        onRefresh: _loadAttendance,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              const Row(
                children: [
                  Icon(Icons.bar_chart, color: AppTheme.primary),
                  SizedBox(width: 8),
                  Text(
                    'My Attendance',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
              
              const SizedBox(height: 16),
              
              // Month Selector
              Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                child: DropdownButtonHideUnderline(
                  child: DropdownButton<String>(
                    value: _selectedMonth,
                    isExpanded: true,
                    items: _getMonthOptions().map((month) {
                      return DropdownMenuItem(
                        value: month,
                        child: Text(_formatMonthDisplay(month)),
                      );
                    }).toList(),
                    onChanged: (value) {
                      setState(() => _selectedMonth = value);
                      _loadAttendance();
                    },
                  ),
                ),
              ),
              
              const SizedBox(height: 20),
              
              // Stats Cards
              Row(
                children: [
                  Expanded(
                    child: _buildStatCard(
                      'Total Classes',
                      '${int.tryParse(stats['totalClasses']?.toString() ?? '0') ?? 0}',
                      Icons.class_,
                      AppTheme.primary,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildStatCard(
                      'Attended',
                      '${int.tryParse(stats['attendedClasses']?.toString() ?? '0') ?? 0}',
                      Icons.check_circle,
                      Colors.green,
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 12),
              
              Row(
                children: [
                  Expanded(
                    child: _buildStatCard(
                      'Attendance %',
                      '${int.tryParse(stats['attendancePercentage']?.toString() ?? '0') ?? 0}%',
                      Icons.trending_up,
                      (int.tryParse(stats['attendancePercentage']?.toString() ?? '0') ?? 0) >= 75 ? Colors.green : Colors.red,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildStatCard(
                      'Absent',
                      '${(int.tryParse(stats['totalClasses']?.toString() ?? '0') ?? 0) - (int.tryParse(stats['attendedClasses']?.toString() ?? '0') ?? 0)}',
                      Icons.cancel,
                      Colors.red,
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 20),
              
              // Low Attendance Warning
              if (lowAttendanceSubjects.isNotEmpty) ...[
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.red.shade50,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.red.shade300),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.warning, color: Colors.red),
                          SizedBox(width: 8),
                          Text(
                            'Low Attendance Alert',
                            style: TextStyle(
                              fontWeight: FontWeight.bold,
                              color: Colors.red,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      const Text(
                        'The following subjects have attendance below 75%:',
                        style: TextStyle(fontSize: 12, color: Colors.red),
                      ),
                      const SizedBox(height: 8),
                      ...lowAttendanceSubjects.map((subject) => Padding(
                        padding: const EdgeInsets.only(bottom: 4),
                        child: Text(
                          '• ${subject['subject']}: ${subject['percentage']}%',
                          style: const TextStyle(fontSize: 12, color: Colors.red),
                        ),
                      )),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
              ],
              
              // Attendance Records
              const Text(
                'Attendance Records',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 12),
              
              if (records.isEmpty)
                const EmptyStateWidget(
                  message: 'No attendance records found for this month',
                  icon: Icons.event_busy,
                )
              else
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.grey.shade200),
                  ),
                  child: Column(
                    children: records.map<Widget>((record) {
                      final isPresent = record['status'] == 'Present';
                      final date = DateTime.parse(record['date']);
                      
                      return Container(
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          border: Border(
                            bottom: BorderSide(color: Colors.grey.shade100),
                          ),
                        ),
                        child: Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: isPresent 
                                    ? Colors.green.shade100 
                                    : Colors.red.shade100,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Icon(
                                isPresent ? Icons.check : Icons.close,
                                color: isPresent ? Colors.green : Colors.red,
                                size: 16,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    DateFormat('EEEE, MMM dd, yyyy').format(date),
                                    style: const TextStyle(
                                      fontWeight: FontWeight.bold,
                                      fontSize: 14,
                                    ),
                                  ),
                                  if (record['subject'] != null)
                                    Text(
                                      'Subject: ${record['subject']}',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Colors.grey,
                                      ),
                                    ),
                                  if (record['remarks'] != null && record['remarks'].isNotEmpty)
                                    Text(
                                      'Remarks: ${record['remarks']}',
                                      style: const TextStyle(
                                        fontSize: 12,
                                        color: Colors.grey,
                                      ),
                                    ),
                                ],
                              ),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: isPresent 
                                    ? Colors.green.shade100 
                                    : Colors.red.shade100,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                record['status'],
                                style: TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: isPresent ? Colors.green.shade700 : Colors.red.shade700,
                                ),
                              ),
                            ),
                          ],
                        ),
                      );
                    }).toList(),
                  ),
                ),
            ],
          ),
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
                  fontSize: 20,
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
}