import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/config/app_config.dart';
import '../core/l10n/generated/app_localizations.dart';
import '../core/l10n/locale_controller.dart';
import 'router/app_router.dart';
import 'theme/app_theme.dart';
import 'theme/theme_mode_controller.dart';

class BackOfHouseApp extends ConsumerWidget {
  const BackOfHouseApp({super.key});

  /// Text scales with the OS setting up to this factor; beyond it editorial
  /// layouts break down faster than readability improves.
  static const double maxTextScale = 2.0;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    final locale = ref.watch(localeControllerProvider);
    final themeMode = ref.watch(themeModeControllerProvider);

    return MaterialApp.router(
      title: AppConfig.appTitle,
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      themeMode: themeMode,
      // The two palettes have no meaningful midpoint (see AppColors.lerp),
      // and a running theme animation makes freshly built screens paint in
      // the old palette for a moment. Switch in one frame instead.
      themeAnimationDuration: Duration.zero,
      routerConfig: router,
      locale: locale,
      supportedLocales: AppLocalizations.supportedLocales,
      localizationsDelegates: AppLocalizations.localizationsDelegates,
      builder: (context, child) => MediaQuery.withClampedTextScaling(
        maxScaleFactor: maxTextScale,
        child: child!,
      ),
    );
  }
}
