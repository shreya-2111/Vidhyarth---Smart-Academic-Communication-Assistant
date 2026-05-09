import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import 'package:intl/intl.dart';
import 'dart:io';
import 'package:url_launcher/url_launcher.dart';
import 'package:http/http.dart' as http;
import '../../core/theme/app_theme.dart';
import '../../core/constants/app_constants.dart';
import '../../services/api_service.dart';
import '../../widgets/loading_widget.dart';

class StudentAssignmentsScreen extends StatefulWidget {
  final int userId;
  const StudentAssignmentsScreen({super.key, required this.userId});

  @override
  State<StudentAssignmentsScreen> createState() => _StudentAssignmentsScreenState();
}

class _StudentAssignmentsScreenState extends State<StudentAssignmentsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  List<dynamic> _assignments = [];
  bool _loading = true;
  String? _error;
  String _selectedStatus = 'all';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadAssignments();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadAssignments([String? status]) async {
    setState(() { _loading = true; _error = null; });
    try {
      final queryParam = status != null && status != 'all' ? '?status=$status' : '';
      final data = await apiService.get('/student/assignments/${widget.userId}$queryParam');
      setState(() {
        _assignments = data as List<dynamic>;
        _selectedStatus = status ?? 'all';
        _loading = false;
      });
    } catch (e) {
      setState(() { _error = e.toString(); _loading = false; });
    }
  }

  String _formatDeadline(String deadline) {
    try {
      final date = DateTime.parse(deadline);
      return DateFormat('MMM dd, yyyy HH:mm').format(date);
    } catch (e) {
      return deadline;
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'submitted':
        return Colors.green;
      case 'overdue':
        return Colors.red;
      case 'pending':
      default:
        return Colors.orange;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status.toLowerCase()) {
      case 'submitted':
        return Icons.check_circle;
      case 'overdue':
        return Icons.warning;
      case 'pending':
      default:
        return Icons.schedule;
    }
  }

  Future<void> _submitAssignment(Map<String, dynamic> assignment) async {
    File? selectedFile;
    String submissionText = '';
    bool uploading = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setS) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          title: Row(
            children: [
              Icon(Icons.upload_file, color: AppTheme.primary, size: 24),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Submit Assignment',
                  style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.blue.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.blue.shade200),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        assignment['title'] ?? 'Assignment',
                        style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Course: ${assignment['course'] ?? 'N/A'}',
                        style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                      ),
                      Text(
                        'Due: ${assignment['deadline'] != null ? _formatDeadline(assignment['deadline']) : 'No deadline'}',
                        style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Submission Text (Optional):',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  maxLines: 3,
                  decoration: InputDecoration(
                    hintText: 'Enter your submission notes...',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                    filled: true,
                    fillColor: Colors.grey.shade50,
                  ),
                  onChanged: (v) => submissionText = v,
                ),
                const SizedBox(height: 16),
                const Text(
                  'Upload File (Optional):',
                  style: TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                ),
                const SizedBox(height: 8),
                if (selectedFile != null)
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.green.shade50,
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.green.shade300),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.attach_file, color: Colors.green.shade700),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            selectedFile!.path.split('/').last,
                            style: const TextStyle(fontSize: 12),
                          ),
                        ),
                        IconButton(
                          onPressed: () => setS(() => selectedFile = null),
                          icon: const Icon(Icons.close, size: 16),
                        ),
                      ],
                    ),
                  )
                else
                  Container(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      onPressed: () async {
                        final result = await FilePicker.platform.pickFiles(
                          type: FileType.custom,
                          allowedExtensions: ['pdf', 'doc', 'docx', 'txt', 'zip', 'rar'],
                        );
                        if (result != null && result.files.single.path != null) {
                          setS(() => selectedFile = File(result.files.single.path!));
                        }
                      },
                      icon: const Icon(Icons.attach_file),
                      label: const Text('Choose File'),
                      style: OutlinedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                    ),
                  ),
                const SizedBox(height: 8),
                Text(
                  'Allowed: PDF, DOC, DOCX, TXT, ZIP, RAR (Max 10MB)',
                  style: TextStyle(fontSize: 11, color: Colors.grey.shade600),
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: uploading ? null : () async {
                if (submissionText.isEmpty && selectedFile == null) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Please provide submission text or file'),
                      backgroundColor: Colors.orange,
                    ),
                  );
                  return;
                }
                
                setS(() => uploading = true);
                try {
                  if (selectedFile != null) {
                    await apiService.uploadFile(
                      '/student/submit-assignment',
                      selectedFile!,
                      'submissionFile',
                      fields: {
                        'assignmentId': assignment['assignment_id'].toString(),
                        'studentId': widget.userId.toString(),
                        'submissionText': submissionText,
                      },
                    );
                  } else {
                    await apiService.post('/student/submit-assignment', {
                      'assignmentId': assignment['assignment_id'],
                      'studentId': widget.userId,
                      'submissionText': submissionText,
                    });
                  }
                  
                  if (mounted) {
                    Navigator.pop(ctx);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Assignment submitted successfully!'),
                        backgroundColor: Colors.green,
                      ),
                    );
                    _loadAssignments(_selectedStatus);
                  }
                } catch (e) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Error: $e'),
                      backgroundColor: Colors.red,
                    ),
                  );
                } finally {
                  setS(() => uploading = false);
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppTheme.primary,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
              ),
              child: uploading
                  ? const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Submit'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const LoadingWidget();
    
    if (_error != null) {
      return Scaffold(
        backgroundColor: const Color(0xFFF8F9FA),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.error_outline, size: 64, color: Colors.red.shade400),
              const SizedBox(height: 16),
              const Text(
                'Error loading assignments', 
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)
              ),
              const SizedBox(height: 8),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 32),
                child: Text(
                  _error!, 
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.grey.shade600)
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: () => _loadAssignments(),
                icon: const Icon(Icons.refresh),
                label: const Text('Retry'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF8F9FA),
      body: Column(
        children: [
          // Header Section
          Container(
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: SafeArea(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: [
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: AppTheme.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(Icons.assignment, color: AppTheme.primary, size: 24),
                        ),
                        const SizedBox(width: 12),
                        const Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'My Assignments',
                                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                              ),
                              Text(
                                'Track and submit your assignments',
                                style: TextStyle(fontSize: 14, color: Colors.grey),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Tab Bar
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: TabBar(
                        controller: _tabController,
                        labelColor: Colors.white,
                        unselectedLabelColor: Colors.grey.shade600,
                        indicator: BoxDecoration(
                          color: AppTheme.primary,
                          borderRadius: BorderRadius.circular(12),
                        ),
                        indicatorSize: TabBarIndicatorSize.tab,
                        dividerColor: Colors.transparent,
                        onTap: (index) {
                          final statuses = ['all', 'pending', 'submitted', 'overdue'];
                          _loadAssignments(statuses[index]);
                        },
                        tabs: const [
                          Tab(text: 'All'),
                          Tab(text: 'Pending'),
                          Tab(text: 'Submitted'),
                          Tab(text: 'Overdue'),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          
          // Content Section
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => _loadAssignments(_selectedStatus),
              child: _assignments.isEmpty
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            Icons.assignment_outlined,
                            size: 80,
                            color: Colors.grey.shade400,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            _selectedStatus == 'all' 
                                ? 'No assignments found'
                                : 'No ${_selectedStatus} assignments',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.w600,
                              color: Colors.grey.shade600,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Pull down to refresh',
                            style: TextStyle(
                              fontSize: 14,
                              color: Colors.grey.shade500,
                            ),
                          ),
                        ],
                      ),
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _assignments.length,
                      itemBuilder: (context, index) {
                        final assignment = _assignments[index];
                        final status = assignment['status'] ?? 'pending';
                        final statusColor = _getStatusColor(status);
                        final statusIcon = _getStatusIcon(status);
                        final isSubmitted = status == 'submitted';
                        
                        return Container(
                          margin: const EdgeInsets.only(bottom: 16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.08),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Padding(
                            padding: const EdgeInsets.all(20),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                // Header Row
                                Row(
                                  children: [
                                    Expanded(
                                      child: Text(
                                        assignment['title'] ?? 'Untitled Assignment',
                                        style: const TextStyle(
                                          fontSize: 18,
                                          fontWeight: FontWeight.bold,
                                          color: Colors.black87,
                                        ),
                                      ),
                                    ),
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: statusColor.withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(20),
                                        border: Border.all(color: statusColor.withOpacity(0.3)),
                                      ),
                                      child: Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(statusIcon, size: 14, color: statusColor),
                                          const SizedBox(width: 4),
                                          Text(
                                            status.toUpperCase(),
                                            style: TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.bold,
                                              color: statusColor,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                                
                                const SizedBox(height: 12),
                                
                                // Course Badge
                                if (assignment['course'] != null)
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                                    decoration: BoxDecoration(
                                      color: AppTheme.primary.withOpacity(0.1),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Text(
                                      assignment['course'],
                                      style: TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: AppTheme.primary,
                                      ),
                                    ),
                                  ),
                                
                                // Description
                                if (assignment['description'] != null && assignment['description'].toString().isNotEmpty) ...[
                                  const SizedBox(height: 12),
                                  Text(
                                    assignment['description'],
                                    style: TextStyle(
                                      fontSize: 14,
                                      color: Colors.grey.shade700,
                                      height: 1.4,
                                    ),
                                  ),
                                ],
                                
                                // Question File attachment display
                                if (assignment['file_url'] != null && assignment['file_url'].toString().isNotEmpty) ...[
                                  const SizedBox(height: 12),
                                  Container(
                                    padding: const EdgeInsets.all(12),
                                    decoration: BoxDecoration(
                                      color: Colors.blue.shade50,
                                      borderRadius: BorderRadius.circular(8),
                                      border: Border.all(color: Colors.blue.shade200),
                                    ),
                                    child: Row(
                                      children: [
                                        Icon(Icons.picture_as_pdf, color: Colors.blue.shade700, size: 20),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Text(
                                            assignment['file_url'].split('/').last,
                                            style: TextStyle(
                                              fontSize: 13,
                                              color: Colors.blue.shade900,
                                              fontWeight: FontWeight.w500,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                                
                                const SizedBox(height: 16),
                                
                                // Info Row
                                Row(
                                  children: [
                                    Icon(Icons.person_outline, size: 16, color: Colors.grey.shade600),
                                    const SizedBox(width: 6),
                                    Text(
                                      assignment['faculty_name'] ?? 'Unknown Faculty',
                                      style: TextStyle(fontSize: 13, color: Colors.grey.shade600),
                                    ),
                                    const Spacer(),
                                    Icon(Icons.schedule, size: 16, color: Colors.grey.shade600),
                                    const SizedBox(width: 6),
                                    Text(
                                      assignment['deadline'] != null
                                          ? _formatDeadline(assignment['deadline'])
                                          : 'No deadline',
                                      style: TextStyle(
                                        fontSize: 13,
                                        color: status == 'overdue' ? Colors.red : Colors.grey.shade600,
                                        fontWeight: status == 'overdue' ? FontWeight.w600 : FontWeight.normal,
                                      ),
                                    ),
                                  ],
                                ),
                                
                                // Submission Details (if submitted)
                                if (isSubmitted) ...[
                                  const SizedBox(height: 16),
                                  Container(
                                    padding: const EdgeInsets.all(16),
                                    decoration: BoxDecoration(
                                      color: Colors.green.shade50,
                                      borderRadius: BorderRadius.circular(12),
                                      border: Border.all(color: Colors.green.shade200),
                                    ),
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Row(
                                          children: [
                                            Icon(Icons.check_circle, color: Colors.green.shade700, size: 18),
                                            const SizedBox(width: 8),
                                            Text(
                                              'Submission Details',
                                              style: TextStyle(
                                                fontSize: 14,
                                                fontWeight: FontWeight.bold,
                                                color: Colors.green.shade700,
                                              ),
                                            ),
                                          ],
                                        ),
                                        const SizedBox(height: 8),
                                        if (assignment['submitted_at'] != null)
                                          Text(
                                            'Submitted: ${_formatDeadline(assignment['submitted_at'])}',
                                            style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                                          ),
                                        if (assignment['marks_obtained'] != null)
                                          Text(
                                            'Marks: ${assignment['marks_obtained']}',
                                            style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                                          ),
                                        if (assignment['feedback'] != null && assignment['feedback'].toString().isNotEmpty)
                                          Text(
                                            'Feedback: ${assignment['feedback']}',
                                            style: TextStyle(fontSize: 12, color: Colors.grey.shade700),
                                          ),
                                      ],
                                    ),
                                  ),
                                ],
                                
                                // Action Buttons (Download Question and/or Submit)
                                if ((assignment['file_url'] != null && assignment['file_url'].toString().isNotEmpty) || !isSubmitted) ...[
                                  const SizedBox(height: 16),
                                  Row(
                                    children: [
                                      // Download Button
                                      if (assignment['file_url'] != null && assignment['file_url'].toString().isNotEmpty)
                                        Expanded(
                                          child: OutlinedButton.icon(
                                            onPressed: () async {
                                              final url = (AppConstants.baseUrl.replaceAll('/api', '') + assignment['file_url']).trim();
                                              final originalFileName = assignment['file_url'].split('/').last.trim();
                                              
                                              // Generate a unique filename to avoid PathExistsException (OS Error 17)
                                              final timestamp = DateTime.now().millisecondsSinceEpoch;
                                              final nameWithoutExt = originalFileName.split('.').first;
                                              final ext = originalFileName.contains('.') ? '.${originalFileName.split('.').last}' : '';
                                              final fileName = '${nameWithoutExt}_$timestamp$ext';
                                              
                                              ScaffoldMessenger.of(context).showSnackBar(
                                                SnackBar(content: Text('Downloading...')),
                                              );
                                              
                                              try {
                                                final uri = Uri.parse(url);
                                                final response = await http.get(uri);
                                                
                                                if (response.statusCode == 200) {
                                                  final file = File('/storage/emulated/0/Download/$fileName');
                                                  await file.writeAsBytes(response.bodyBytes);
                                                  
                                                  if (mounted) {
                                                    ScaffoldMessenger.of(context).showSnackBar(
                                                      SnackBar(
                                                        content: Text('Downloaded to Downloads/$fileName'),
                                                        backgroundColor: Colors.green,
                                                      ),
                                                    );
                                                  }
                                                } else {
                                                  if (mounted) {
                                                    ScaffoldMessenger.of(context).showSnackBar(
                                                      SnackBar(
                                                        content: Text('Failed to download: Server returned ${response.statusCode}'),
                                                        backgroundColor: Colors.red,
                                                      ),
                                                    );
                                                  }
                                                }
                                              } catch (e) {
                                                if (mounted) {
                                                  ScaffoldMessenger.of(context).showSnackBar(
                                                    SnackBar(
                                                      content: Text('Download failed: $e'),
                                                      backgroundColor: Colors.red,
                                                    ),
                                                  );
                                                }
                                              }
                                            },
                                            icon: const Icon(Icons.download, size: 18),
                                            label: Text(!isSubmitted ? 'Download' : 'Download Question PDF'),
                                            style: OutlinedButton.styleFrom(
                                              padding: const EdgeInsets.symmetric(vertical: 14),
                                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                              side: const BorderSide(color: AppTheme.primary),
                                              foregroundColor: AppTheme.primary,
                                            ),
                                          ),
                                        ),
                                      
                                      // Spacing between buttons
                                      if (assignment['file_url'] != null && assignment['file_url'].toString().isNotEmpty && !isSubmitted)
                                        const SizedBox(width: 12),
                                      
                                      // Submit Button
                                      if (!isSubmitted)
                                        Expanded(
                                          child: ElevatedButton.icon(
                                            onPressed: () => _submitAssignment(assignment),
                                            icon: const Icon(Icons.upload_file, size: 18),
                                            label: const Text('Submit'),
                                            style: ElevatedButton.styleFrom(
                                              backgroundColor: AppTheme.primary,
                                              foregroundColor: Colors.white,
                                              padding: const EdgeInsets.symmetric(vertical: 14),
                                              shape: RoundedRectangleBorder(
                                                borderRadius: BorderRadius.circular(12),
                                              ),
                                              elevation: 0,
                                            ),
                                          ),
                                        ),
                                    ],
                                  ),
                                ],
                              ],
                            ),
                          ),
                        );
                      },
                    ),
            ),
          ),
        ],
      ),
    );
  }
}