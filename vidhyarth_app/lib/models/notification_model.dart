class NotificationModel {
  final int notificationId;
  final String title;
  final String message;
  final String type;
  final String priority;
  final bool isRead;
  final String createdAt;

  NotificationModel({
    required this.notificationId,
    required this.title,
    required this.message,
    required this.type,
    required this.priority,
    required this.isRead,
    required this.createdAt,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) => NotificationModel(
        notificationId: json['notification_id'] ?? 0,
        title: json['title'] ?? '',
        message: json['message'] ?? '',
        type: json['type'] ?? 'general',
        priority: json['priority'] ?? 'medium',
        isRead: json['is_read'] == true || json['is_read'] == 1,
        createdAt: json['created_at'] ?? '',
      );
}
