class MessageModel {
  final int messageId;
  final int senderId;
  final String senderType;
  final int receiverId;
  final String receiverType;
  final String message;
  final bool isRead;
  final String createdAt;
  final String? senderName;
  final String? receiverName;

  MessageModel({
    required this.messageId,
    required this.senderId,
    required this.senderType,
    required this.receiverId,
    required this.receiverType,
    required this.message,
    required this.isRead,
    required this.createdAt,
    this.senderName,
    this.receiverName,
  });

  factory MessageModel.fromJson(Map<String, dynamic> json) => MessageModel(
        messageId: json['message_id'] ?? 0,
        senderId: json['sender_id'] ?? 0,
        senderType: json['sender_type'] ?? '',
        receiverId: json['receiver_id'] ?? 0,
        receiverType: json['receiver_type'] ?? '',
        message: json['message'] ?? '',
        isRead: (json['is_read'] ?? 0) == 1,
        createdAt: json['created_at'] ?? '',
        senderName: json['sender_name'],
        receiverName: json['receiver_name'],
      );
}
