import 'package:flutter/material.dart';

class EmptyStateWidget extends StatelessWidget {
  final String message;
  final IconData icon;
  const EmptyStateWidget(
      {super.key,
      required this.message,
      this.icon = Icons.inbox_outlined});

  @override
  Widget build(BuildContext context) => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 64, color: Colors.grey.shade300),
            const SizedBox(height: 12),
            Text(message,
                style: TextStyle(color: Colors.grey.shade500, fontSize: 15)),
          ],
        ),
      );
}
