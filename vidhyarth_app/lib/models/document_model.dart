class DocumentModel {
  final int documentId;
  final String title;
  final String? description;
  final String fileName;
  final String filePath;
  final int fileSize;
  final String fileType;
  final String? subject;
  final String? category;
  final String? semester;
  final bool isPublic;
  final String? facultyName;
  final int downloadCount;
  final String createdAt;

  DocumentModel({
    required this.documentId,
    required this.title,
    this.description,
    required this.fileName,
    required this.filePath,
    required this.fileSize,
    required this.fileType,
    this.subject,
    this.category,
    this.semester,
    required this.isPublic,
    this.facultyName,
    required this.downloadCount,
    required this.createdAt,
  });

  factory DocumentModel.fromJson(Map<String, dynamic> json) => DocumentModel(
        documentId: json['document_id'] ?? 0,
        title: json['title'] ?? '',
        description: json['description'],
        fileName: json['file_name'] ?? '',
        filePath: json['file_path'] ?? '',
        fileSize: json['file_size'] ?? 0,
        fileType: json['file_type'] ?? '',
        subject: json['subject'],
        category: json['category'],
        semester: json['semester'],
        isPublic: json['is_public'] == true || json['is_public'] == 1,
        facultyName: json['faculty_name'],
        downloadCount: json['download_count'] ?? 0,
        createdAt: json['created_at'] ?? '',
      );

  String get fileSizeFormatted {
    if (fileSize < 1024) return '$fileSize B';
    if (fileSize < 1024 * 1024) return '${(fileSize / 1024).toStringAsFixed(1)} KB';
    return '${(fileSize / (1024 * 1024)).toStringAsFixed(1)} MB';
  }
}
