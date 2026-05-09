class UserModel {
  final int id;
  final String fullName;
  final String email;
  final String department;
  final String userType; // 'faculty' | 'student'
  final bool isPasswordReset;

  UserModel({
    required this.id,
    required this.fullName,
    required this.email,
    required this.department,
    required this.userType,
    this.isPasswordReset = true,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) => UserModel(
        id: json['id'],
        fullName: json['fullName'] ?? '',
        email: json['email'] ?? '',
        department: json['department'] ?? '',
        userType: json['userType'] ?? '',
        isPasswordReset: json['isPasswordReset'] ?? true,
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'fullName': fullName,
        'email': email,
        'department': department,
        'userType': userType,
        'isPasswordReset': isPasswordReset,
      };

  bool get isFaculty => userType == 'faculty';
  bool get isStudent => userType == 'student';
}
