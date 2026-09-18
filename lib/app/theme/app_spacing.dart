/// Spacing scale. Every gap, inset and offset in the app comes from here.
abstract final class AppSpacing {
  static const double s4 = 4;
  static const double s8 = 8;
  static const double s12 = 12;
  static const double s16 = 16;
  static const double s20 = 20;
  static const double s24 = 24;
  static const double s32 = 32;
  static const double s40 = 40;
  static const double s48 = 48;
  static const double s64 = 64;

  /// Horizontal inset on every screen edge (Stitch mobile margin).
  static const double screenHorizontal = s16;

  /// Inner padding of cards.
  static const double cardPadding = 14;

  /// Vertical gap between page sections.
  static const double sectionSpacing = s20;
}

/// Fixed component dimensions that are not spacing.
abstract final class AppSizes {
  /// Minimum interactive size (accessibility guideline).
  static const double minTouchTarget = 44;

  static const double buttonHeightLarge = 46;
  static const double buttonHeightMedium = 46;
  static const double buttonHeightSmall = 44;

  static const double inputHeight = 46;

  static const double iconSmall = 16;
  static const double iconMedium = 20;
  static const double iconLarge = 24;

  static const double bottomNavHeight = 64;

  static const double appBarHeight = 64;

  /// Hairline width for borders and decorative lines.
  static const double hairline = 1;
}
