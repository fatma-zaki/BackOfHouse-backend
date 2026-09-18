import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'generated/app_localizations.dart';

/// Resolved in `main()` before the first frame and injected with an override,
/// so reading preferences never forces an async gap into the widget tree.
final sharedPreferencesProvider = Provider<SharedPreferences>(
  (ref) => throw UnimplementedError(
    'sharedPreferencesProvider must be overridden in main()',
  ),
);

/// The user's chosen locale, or `null` to follow the device.
class LocaleController extends Notifier<Locale?> {
  static const _key = 'boh.locale';

  @override
  Locale? build() {
    final code = ref.watch(sharedPreferencesProvider).getString(_key);
    if (code == null) return null;
    final locale = Locale(code);
    return AppLocalizations.supportedLocales.contains(locale) ? locale : null;
  }

  Future<void> setLocale(Locale? locale) async {
    state = locale;
    final prefs = ref.read(sharedPreferencesProvider);
    if (locale == null) {
      await prefs.remove(_key);
    } else {
      await prefs.setString(_key, locale.languageCode);
    }
  }
}

final localeControllerProvider = NotifierProvider<LocaleController, Locale?>(
  LocaleController.new,
);
