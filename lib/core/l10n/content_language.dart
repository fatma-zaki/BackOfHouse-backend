import 'dart:ui';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'generated/app_localizations.dart';
import 'locale_controller.dart';

/// Language code content should be fetched in ("en" or "ar").
///
/// Follows the user's chosen locale, else the device locale when supported.
/// Content providers watch this so switching language refetches content.
final contentLanguageProvider = Provider<String>((ref) {
  final chosen = ref.watch(localeControllerProvider);
  final code =
      chosen?.languageCode ?? PlatformDispatcher.instance.locale.languageCode;
  final supported = AppLocalizations.supportedLocales.map(
    (l) => l.languageCode,
  );
  return supported.contains(code) ? code : 'en';
});
