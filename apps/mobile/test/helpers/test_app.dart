import 'package:backofhouse/app/theme/app_theme.dart';
import 'package:backofhouse/core/data/mock_support.dart';
import 'package:backofhouse/core/l10n/generated/app_localizations.dart';
import 'package:backofhouse/core/l10n/locale_controller.dart';
import 'package:backofhouse/core/storage/token_storage.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_riverpod/misc.dart' show Override;
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Keychain stand-in: tests never touch platform channels.
class MemoryTokenStorage implements TokenStorage {
  String? _access;
  String? _refresh;

  @override
  Future<String?> readAccessToken() async => _access;

  @override
  Future<String?> readRefreshToken() async => _refresh;

  @override
  Future<void> saveTokens({
    required String accessToken,
    String? refreshToken,
  }) async {
    _access = accessToken;
    _refresh = refreshToken;
  }

  @override
  Future<void> clear() async => _access = _refresh = null;
}

Future<List<Override>> baseOverrides() async {
  SharedPreferences.setMockInitialValues({});
  final prefs = await SharedPreferences.getInstance();
  return [
    sharedPreferencesProvider.overrideWithValue(prefs),
    tokenStorageProvider.overrideWithValue(MemoryTokenStorage()),
    mockLatencyProvider.overrideWithValue(Duration.zero),
  ];
}

/// Pumps [child] inside the BOH theme and localizations.
Future<void> pumpBoh(
  WidgetTester tester,
  Widget child, {
  Locale locale = const Locale('en'),
  double textScale = 1,
  Size size = const Size(393, 852),
  Brightness brightness = Brightness.light,
}) async {
  tester.view
    ..physicalSize = size * 3
    ..devicePixelRatio = 3;
  addTearDown(tester.view.reset);

  await tester.pumpWidget(
    ProviderScope(
      overrides: await baseOverrides(),
      child: MaterialApp(
        theme: brightness == Brightness.dark ? AppTheme.dark : AppTheme.light,
        locale: locale,
        supportedLocales: AppLocalizations.supportedLocales,
        localizationsDelegates: AppLocalizations.localizationsDelegates,
        home: MediaQuery.withClampedTextScaling(
          minScaleFactor: textScale,
          maxScaleFactor: textScale,
          child: Scaffold(body: child),
        ),
      ),
    ),
  );
}
