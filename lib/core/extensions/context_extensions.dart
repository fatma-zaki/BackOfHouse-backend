import 'package:flutter/material.dart';

import '../../app/theme/app_colors.dart';
import '../../app/theme/app_typography.dart';
import '../l10n/generated/app_localizations.dart';

extension BOHContext on BuildContext {
  AppLocalizations get l10n => AppLocalizations.of(this);

  /// Colour roles for the active theme mode.
  AppColors get colors => Theme.of(this).extension<AppColors>()!;

  /// The type scale, coloured for the active theme mode.
  AppTextStyles get text => AppTextStyles(colors);

  bool get isDark => colors.isDark;

  bool get isRtl => Directionality.of(this) == TextDirection.rtl;

  /// True for scripts where letter-spacing and uppercasing must be skipped.
  bool get isArabic => Localizations.localeOf(this).languageCode == 'ar';

  /// Honour the OS "reduce motion" setting in every animated component.
  bool get reduceMotion => MediaQuery.disableAnimationsOf(this);
}
