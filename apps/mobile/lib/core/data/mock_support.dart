import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Artificial delay applied by every mock data source, so loading states are
/// exercised during development. Tests override it with [Duration.zero].
final mockLatencyProvider = Provider<Duration>(
  (ref) => const Duration(milliseconds: 450),
);

/// Bilingual copy for mock content. A real API returns content already in
/// the requested language; mocks pick the matching side.
@immutable
class MockText {
  const MockText(this.en, this.ar);

  final String en;
  final String ar;

  String of(String language) => language == 'ar' ? ar : en;
}
