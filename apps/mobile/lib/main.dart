import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'app/app.dart';
import 'app/theme/app_theme.dart';
import 'core/l10n/locale_controller.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final (prefs, _) = await (
    SharedPreferences.getInstance(),
    SystemChrome.setPreferredOrientations([DeviceOrientation.portraitUp]),
  ).wait;

  // Screens refine this per theme through BOHScaffold's AnnotatedRegion.
  SystemChrome.setSystemUIOverlayStyle(AppTheme.overlayFor(Brightness.light));

  runApp(
    ProviderScope(
      overrides: [sharedPreferencesProvider.overrideWithValue(prefs)],
      child: const BackOfHouseApp(),
    ),
  );
}
