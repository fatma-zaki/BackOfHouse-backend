/// Spacing scale. Every gap, inset and offset in the app comes from here.
abstract final class AppSpacing {
  static const double s2 = 2;
  static const double s4 = 4;
  static const double s6 = 6;
  static const double s8 = 8;
  static const double s10 = 10;
  static const double s12 = 12;
  static const double s14 = 14;
  static const double s16 = 16;
  static const double s20 = 20;
  static const double s24 = 24;
  static const double s32 = 32;
  static const double s40 = 40;
  static const double s48 = 48;
  static const double s64 = 64;

  /// Horizontal inset on every screen edge.
  static const double screenHorizontal = s16;

  /// Horizontal inset of forms and auth screens.
  static const double formHorizontal = s20;

  /// Inner padding of cards.
  static const double cardPadding = s14;

  /// Vertical gap between page sections.
  static const double sectionSpacing = s16;

  /// Gap between a section heading and its content, and between grid cells.
  static const double gridGap = s10;
}

/// Fixed component dimensions that are not spacing.
abstract final class AppSizes {
  /// Minimum interactive size (accessibility guideline).
  static const double minTouchTarget = 44;

  /// Auth screens' primary and outline buttons.
  static const double buttonHeightAuth = 54;
  static const double buttonHeightLarge = 52;
  static const double buttonHeightMedium = 44;
  static const double buttonHeightSmall = 40;

  /// Follow / Connect / Upload pills (inside a 44 touch target).
  static const double buttonHeightCompact = 34;

  static const double inputHeight = 48;
  static const double inputHeightAuth = 52;
  static const double searchHeight = 48;

  static const double iconSmall = 16;
  static const double iconMedium = 20;
  static const double iconLarge = 22;

  static const double iconTile = 38;

  /// Bottom bar height, excluding the device inset.
  static const double bottomNavHeight = 62;

  static const double appBarHeight = 56;

  /// Filter pills and chips.
  static const double chipHeight = 34;

  /// Section heading skew bar.
  static const double skewBarWidth = 4;
  static const double skewBarHeight = 20;

  /// Hairline width for borders and decorative lines.
  static const double hairline = 1;

  /// Emphasised outline (outline buttons, selected cards).
  static const double outline = 1.5;
}
