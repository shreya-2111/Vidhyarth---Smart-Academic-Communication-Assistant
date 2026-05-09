class AssignmentModel {
  final int assignmentId;
  final String course;
  final String title;
  final String? description;
  final String? fileUrl;
  final String deadline;
  final String? createdAt;
  // Faculty view
  final int? totalSubmissions;
  final int? submittedCount;
  // Student view
  final String? facultyName;
  final String? status; // pending | submitted | overdue
  final String? submissionUrl;
  final String? submittedAt;
  final double? marksObtained;
  final String? feedback;

  AssignmentModel({
    required this.assignmentId,
    required this.course,
    required this.title,
    this.description,
    this.fileUrl,
    required this.deadline,
    this.createdAt,
    this.totalSubmissions,
    this.submittedCount,
    this.facultyName,
    this.status,
    this.submissionUrl,
    this.submittedAt,
    this.marksObtained,
    this.feedback,
  });

  factory AssignmentModel.fromJson(Map<String, dynamic> json) => AssignmentModel(
        assignmentId: json['assignment_id'] ?? 0,
        course: json['course'] ?? '',
        title: json['title'] ?? '',
        description: json['description'],
        fileUrl: json['file_url'],
        deadline: json['deadline'] ?? '',
        createdAt: json['created_at'],
        totalSubmissions: json['total_submissions'],
        submittedCount: json['submitted_count'],
        facultyName: json['faculty_name'],
        status: json['status'],
        submissionUrl: json['submission_url'],
        submittedAt: json['submitted_at'],
        marksObtained: json['marks_obtained'] != null
            ? double.tryParse(json['marks_obtained'].toString())
            : null,
        feedback: json['feedback'],
      );
}
