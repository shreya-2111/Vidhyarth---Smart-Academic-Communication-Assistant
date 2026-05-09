class AppConstants {
  // Change this to your machine's IP when testing on a real device
  // For emulator use: http://10.0.2.2:5001/api
  // For real device use: http://<YOUR_LOCAL_IP>:5001/api
  static const String baseUrl = 'https://backend-beryl-pi.vercel.app/api';

  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';

  static const List<String> weekDays = [
    'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
  ];
}
