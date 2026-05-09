import 'package:flutter/material.dart';
import 'package:mobile_scanner/mobile_scanner.dart';
import '../../core/theme/app_theme.dart';
import '../../services/api_service.dart';

class QRScannerScreen extends StatefulWidget {
  final int userId;
  const QRScannerScreen({super.key, required this.userId});

  @override
  State<QRScannerScreen> createState() => _QRScannerScreenState();
}

class _QRScannerScreenState extends State<QRScannerScreen> {
  MobileScannerController cameraController = MobileScannerController();
  bool _isProcessing = false;
  String? _result;

  @override
  void dispose() {
    cameraController.dispose();
    super.dispose();
  }

  Future<void> _markAttendance(String qrData) async {
    if (_isProcessing) return;
    
    setState(() {
      _isProcessing = true;
    });

    try {
      final response = await apiService.post('/qr-attendance/mark-attendance', {
        'qrData': qrData,
      });

      if (mounted) {
        setState(() {
          _result = 'Attendance marked successfully!';
        });
        
        // Show success dialog
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (ctx) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: Row(
              children: [
                Icon(Icons.check_circle, color: Colors.green, size: 28),
                const SizedBox(width: 12),
                const Text('Success!'),
              ],
            ),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Attendance marked successfully!'),
                const SizedBox(height: 8),
                if (response['subject'] != null)
                  Text('Subject: ${response['subject']}', 
                    style: TextStyle(color: Colors.grey.shade600)),
                if (response['className'] != null)
                  Text('Class: ${response['className']}', 
                    style: TextStyle(color: Colors.grey.shade600)),
                if (response['date'] != null)
                  Text('Date: ${response['date']}', 
                    style: TextStyle(color: Colors.grey.shade600)),
                if (response['time'] != null)
                  Text('Time: ${response['time']}', 
                    style: TextStyle(color: Colors.grey.shade600)),
              ],
            ),
            actions: [
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  Navigator.pop(context, true); // Return to previous screen with success
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.green,
                  foregroundColor: Colors.white,
                ),
                child: const Text('OK'),
              ),
            ],
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _result = 'Error: $e';
        });
        
        // Show error dialog
        showDialog(
          context: context,
          builder: (ctx) => AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            title: Row(
              children: [
                Icon(Icons.error, color: Colors.red, size: 28),
                const SizedBox(width: 12),
                const Text('Error'),
              ],
            ),
            content: Text(e.toString()),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(ctx),
                child: const Text('OK'),
              ),
              ElevatedButton(
                onPressed: () {
                  Navigator.pop(ctx);
                  setState(() {
                    _isProcessing = false;
                    _result = null;
                  });
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppTheme.primary,
                  foregroundColor: Colors.white,
                ),
                child: const Text('Try Again'),
              ),
            ],
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        title: const Text('Scan QR Code', style: TextStyle(color: Colors.white)),
        backgroundColor: Colors.black,
        iconTheme: const IconThemeData(color: Colors.white),
        elevation: 0,
      ),
      body: Stack(
        children: [
          // Camera view
          MobileScanner(
            controller: cameraController,
            onDetect: (capture) {
              final List<Barcode> barcodes = capture.barcodes;
              if (barcodes.isNotEmpty && !_isProcessing) {
                final String? qrData = barcodes.first.rawValue;
                if (qrData != null) {
                  _markAttendance(qrData);
                }
              }
            },
          ),
          
          // Overlay with scanning frame
          Container(
            decoration: ShapeDecoration(
              shape: QRScannerOverlayShape(
                borderColor: AppTheme.primary,
                borderRadius: 16,
                borderLength: 30,
                borderWidth: 8,
                cutOutSize: 250,
              ),
            ),
          ),
          
          // Instructions
          Positioned(
            bottom: 100,
            left: 0,
            right: 0,
            child: Container(
              margin: const EdgeInsets.symmetric(horizontal: 32),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.black.withOpacity(0.7),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.qr_code_scanner,
                    color: Colors.white,
                    size: 32,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Position the QR code within the frame',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Your attendance will be marked automatically',
                    style: TextStyle(
                      color: Colors.white70,
                      fontSize: 14,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
          
          // Processing indicator
          if (_isProcessing)
            Container(
              color: Colors.black.withOpacity(0.5),
              child: const Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircularProgressIndicator(color: AppTheme.primary),
                    SizedBox(height: 16),
                    Text(
                      'Marking attendance...',
                      style: TextStyle(color: Colors.white, fontSize: 16),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}

// Custom overlay shape for QR scanner
class QRScannerOverlayShape extends ShapeBorder {
  final Color borderColor;
  final double borderWidth;
  final Color overlayColor;
  final double borderRadius;
  final double borderLength;
  final double cutOutSize;

  const QRScannerOverlayShape({
    this.borderColor = Colors.white,
    this.borderWidth = 3.0,
    this.overlayColor = const Color.fromRGBO(0, 0, 0, 80),
    this.borderRadius = 0,
    this.borderLength = 40,
    this.cutOutSize = 250,
  });

  @override
  EdgeInsetsGeometry get dimensions => const EdgeInsets.all(10);

  @override
  Path getInnerPath(Rect rect, {TextDirection? textDirection}) {
    return Path()
      ..fillType = PathFillType.evenOdd
      ..addPath(getOuterPath(rect), Offset.zero);
  }

  @override
  Path getOuterPath(Rect rect, {TextDirection? textDirection}) {
    Path _getLeftTopPath(Rect rect) {
      return Path()
        ..moveTo(rect.left, rect.bottom)
        ..lineTo(rect.left, rect.top + borderRadius)
        ..quadraticBezierTo(rect.left, rect.top, rect.left + borderRadius, rect.top)
        ..lineTo(rect.right, rect.top);
    }

    return _getLeftTopPath(rect)
      ..lineTo(rect.right, rect.bottom)
      ..lineTo(rect.left, rect.bottom)
      ..lineTo(rect.left, rect.top);
  }

  @override
  void paint(Canvas canvas, Rect rect, {TextDirection? textDirection}) {
    final width = rect.width;
    final borderWidthSize = width / 2;
    final height = rect.height;
    final borderHeightSize = height / 2;
    final cutOutWidth = cutOutSize;
    final cutOutHeight = cutOutSize;

    final backgroundPaint = Paint()
      ..color = overlayColor
      ..style = PaintingStyle.fill;

    final boxPaint = Paint()
      ..color = borderColor
      ..style = PaintingStyle.stroke
      ..strokeWidth = borderWidth;

    final cutOutRect = Rect.fromLTWH(
      rect.left + (width - cutOutWidth) / 2 + borderWidth,
      rect.top + (height - cutOutHeight) / 2 + borderWidth,
      cutOutWidth - borderWidth * 2,
      cutOutHeight - borderWidth * 2,
    );

    canvas
      ..saveLayer(
        rect,
        backgroundPaint,
      )
      ..drawRect(rect, backgroundPaint)
      ..drawRRect(
        RRect.fromRectAndRadius(
          cutOutRect,
          Radius.circular(borderRadius),
        ),
        backgroundPaint..blendMode = BlendMode.clear,
      )
      ..restore();

    // Draw corner borders
    final borderOffset = borderWidth / 2;
    final _cutOutRect = Rect.fromLTWH(
      cutOutRect.left - borderOffset,
      cutOutRect.top - borderOffset,
      cutOutRect.width + borderWidth,
      cutOutRect.height + borderWidth,
    );

    _drawCornerBorders(canvas, _cutOutRect, boxPaint);
  }

  void _drawCornerBorders(Canvas canvas, Rect rect, Paint paint) {
    final borderLength = this.borderLength;
    final borderRadius = this.borderRadius;

    // Top left corner
    canvas.drawPath(
      Path()
        ..moveTo(rect.left, rect.top + borderRadius + borderLength)
        ..lineTo(rect.left, rect.top + borderRadius)
        ..quadraticBezierTo(rect.left, rect.top, rect.left + borderRadius, rect.top)
        ..lineTo(rect.left + borderRadius + borderLength, rect.top),
      paint,
    );

    // Top right corner
    canvas.drawPath(
      Path()
        ..moveTo(rect.right - borderRadius - borderLength, rect.top)
        ..lineTo(rect.right - borderRadius, rect.top)
        ..quadraticBezierTo(rect.right, rect.top, rect.right, rect.top + borderRadius)
        ..lineTo(rect.right, rect.top + borderRadius + borderLength),
      paint,
    );

    // Bottom left corner
    canvas.drawPath(
      Path()
        ..moveTo(rect.left, rect.bottom - borderRadius - borderLength)
        ..lineTo(rect.left, rect.bottom - borderRadius)
        ..quadraticBezierTo(rect.left, rect.bottom, rect.left + borderRadius, rect.bottom)
        ..lineTo(rect.left + borderRadius + borderLength, rect.bottom),
      paint,
    );

    // Bottom right corner
    canvas.drawPath(
      Path()
        ..moveTo(rect.right - borderRadius - borderLength, rect.bottom)
        ..lineTo(rect.right - borderRadius, rect.bottom)
        ..quadraticBezierTo(rect.right, rect.bottom, rect.right, rect.bottom - borderRadius)
        ..lineTo(rect.right, rect.bottom - borderRadius - borderLength),
      paint,
    );
  }

  @override
  ShapeBorder scale(double t) {
    return QRScannerOverlayShape(
      borderColor: borderColor,
      borderWidth: borderWidth,
      overlayColor: overlayColor,
    );
  }
}