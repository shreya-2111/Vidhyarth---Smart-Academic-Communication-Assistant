import 'package:flutter_test/flutter_test.dart';
import 'package:vidhyarth_app/main.dart';

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const VidhyarthApp());
    expect(find.byType(VidhyarthApp), findsOneWidget);
  });
}
