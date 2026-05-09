class TimetableModel {
  final int timetableId;
  final String subject;
  final String day;
  final String startTime;
  final String endTime;
  final String? roomNo;
  final String? facultyName;

  TimetableModel({
    required this.timetableId,
    required this.subject,
    required this.day,
    required this.startTime,
    required this.endTime,
    this.roomNo,
    this.facultyName,
  });

  factory TimetableModel.fromJson(Map<String, dynamic> json) => TimetableModel(
        timetableId: json['timetable_id'] ?? 0,
        subject: json['subject'] ?? '',
        day: json['day'] ?? '',
        startTime: json['start_time'] ?? '',
        endTime: json['end_time'] ?? '',
        roomNo: json['room_no'],
        facultyName: json['faculty_name'],
      );
}
