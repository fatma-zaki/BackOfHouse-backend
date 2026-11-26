import 'package:flutter/material.dart';

/// A background / foreground pair for tinted labels, badges and banners.
@immutable
class AppTone {
  const AppTone(this.background, this.foreground);

  final Color background;
  final Color foreground;
}

/// Back Of House colour roles, resolved per theme mode.
///
/// Components read colours through `context.colors`, never a hex literal,
/// so every screen works in both modes. Values come from the design
/// hand-off (`docs/design/design-tokens.json`): electric violet on a
/// lavender-white ground in light, on midnight in dark.
@immutable
class AppColors extends ThemeExtension<AppColors> {
  const AppColors({
    required this.brightness,
    required this.background,
    required this.backgroundSecondary,
    required this.surface,
    required this.surfaceElevated,
    required this.unreadSurface,
    required this.primary,
    required this.primaryPressed,
    required this.primaryText,
    required this.primaryTint,
    required this.primaryWash,
    required this.onPrimary,
    required this.headlineAccent,
    required this.gold,
    required this.goldTint,
    required this.textPrimary,
    required this.textSecondary,
    required this.textMuted,
    required this.textDisabled,
    required this.articleSecondary,
    required this.inverse,
    required this.onInverse,
    required this.border,
    required this.borderSoft,
    required this.borderAccent,
    required this.borderStrong,
    required this.switchTrackOff,
    required this.success,
    required this.warning,
    required this.error,
    required this.glass,
    required this.pressedOverlay,
    required this.shadow,
    required this.heroStart,
    required this.heroEnd,
    required this.heroAccent,
    required this.tagViolet,
    required this.tagGreen,
    required this.tagAmber,
    required this.tagBlue,
    required this.statusSuccess,
    required this.statusWarning,
    required this.statusInfo,
    required this.statusNeutral,
    required this.statusViolet,
    required this.alertWarning,
    required this.alertWarningBorder,
  });

  final Brightness brightness;

  // ── Grounds ──────────────────────────────────────────────────────────────
  /// Page ground.
  final Color background;

  /// Neutral soft fill (draft badges, disabled buttons).
  final Color backgroundSecondary;

  /// Cards, sheets, the bottom bar.
  final Color surface;

  /// Wells set inside a card (field tiles) — the page ground colour.
  final Color surfaceElevated;

  /// Unread notification card fill.
  final Color unreadSurface;

  // ── Brand ────────────────────────────────────────────────────────────────
  /// Electric violet: primary buttons, active tab, progress, skew bars.
  final Color primary;
  final Color primaryPressed;

  /// Violet safe for small text on [surface] and [background] (≥ 4.5:1).
  final Color primaryText;

  /// "violetSoft": selected chips, icon tiles, progress tracks.
  final Color primaryTint;

  /// Pressed and focused washes.
  final Color primaryWash;
  final Color onPrimary;

  /// Highlighted word in large headlines.
  final Color headlineAccent;

  /// Amber accent (highlight, warning star). Never a trust signal.
  final Color gold;
  final Color goldTint;

  // ── Text ─────────────────────────────────────────────────────────────────
  final Color textPrimary;
  final Color textSecondary;
  final Color textMuted;
  final Color textDisabled;

  /// Secondary paragraphs in long-form articles.
  final Color articleSecondary;

  /// Selected filter pill: ink ground with [onInverse] text.
  final Color inverse;
  final Color onInverse;

  // ── Lines ────────────────────────────────────────────────────────────────
  final Color border;
  final Color borderSoft;

  /// Highlighted cards (featured, unread, selected summary).
  final Color borderAccent;

  /// Neutral outline buttons and dashed notes.
  final Color borderStrong;

  /// Switch track when off.
  final Color switchTrackOff;

  // ── Status ───────────────────────────────────────────────────────────────
  final Color success;
  final Color warning;
  final Color error;

  // ── Effects ──────────────────────────────────────────────────────────────
  final Color glass;
  final Color pressedOverlay;

  /// Base colour for drop shadows.
  final Color shadow;

  // ── Hero surfaces ────────────────────────────────────────────────────────
  /// Violet feature cards (points balance, stat strips). Text on them is
  /// [onPrimary].
  final Color heroStart;
  final Color heroEnd;

  /// Progress fill on hero surfaces.
  final Color heroAccent;

  // ── Tones ────────────────────────────────────────────────────────────────
  /// Category tags (conference, workshop, networking, exhibition…).
  final AppTone tagViolet;
  final AppTone tagGreen;
  final AppTone tagAmber;
  final AppTone tagBlue;

  /// Status badges and banners.
  final AppTone statusSuccess;
  final AppTone statusWarning;
  final AppTone statusInfo;
  final AppTone statusNeutral;
  final AppTone statusViolet;

  /// Attention card (e.g. changes requested): fill + [alertWarningBorder];
  /// icon and link use [statusWarning] foreground.
  final Color alertWarning;
  final Color alertWarningBorder;

  bool get isDark => brightness == Brightness.dark;

  /// Violet at [alpha] for the design's coloured button and tile shadows.
  Color violetShadow(double alpha) => primary.withValues(alpha: alpha);

  // ── Photography ──────────────────────────────────────────────────────────
  // Text set on photos is always light on a dark scrim, in either mode.

  static const Color photoInk = Color(0xFF05050D);
  static const Color onPhoto = Color(0xFFFFFFFF);
  static const Color transparent = Color(0x00000000);

  /// Initials avatars rotate through these grounds (white text), both modes.
  static const List<Color> avatarGrounds = [
    Color(0xFF6437FA),
    Color(0xFF0D6446),
    Color(0xFF1C4AAB),
    Color(0xFF80520A),
  ];

  static const AppColors light = AppColors(
    brightness: Brightness.light,
    background: Color(0xFFF6F4FC),
    backgroundSecondary: Color(0xFFEEECF4),
    surface: Color(0xFFFFFFFF),
    surfaceElevated: Color(0xFFF6F4FC),
    unreadSurface: Color(0xFFFFFFFF),
    primary: Color(0xFF6437FA),
    primaryPressed: Color(0xFF5424E0),
    primaryText: Color(0xFF5424E0),
    primaryTint: Color(0xFFEFEAFE),
    primaryWash: Color(0xFFF4F0FF),
    onPrimary: Color(0xFFFFFFFF),
    headlineAccent: Color(0xFF5424E0),
    gold: Color(0xFF80520A),
    goldTint: Color(0xFFFCEFD6),
    textPrimary: Color(0xFF15122E),
    textSecondary: Color(0xFF5E5A78),
    textMuted: Color(0xFF5E5A78),
    textDisabled: Color(0xFFA9A5BD),
    articleSecondary: Color(0xFF2C2848),
    inverse: Color(0xFF15122E),
    onInverse: Color(0xFFF6F4FC),
    border: Color(0xFFE4DFF3),
    borderSoft: Color(0xFFECE8F6),
    borderAccent: Color(0xFFCBBDFB),
    borderStrong: Color(0xFFCBBDFB),
    switchTrackOff: Color(0xFFC9C4DC),
    success: Color(0xFF0D6446),
    warning: Color(0xFF80520A),
    error: Color(0xFFB42318),
    glass: Color(0xE6F6F4FC),
    pressedOverlay: Color(0x0A15122E),
    shadow: Color(0xFF281478),
    heroStart: Color(0xFF6437FA),
    heroEnd: Color(0xFF6437FA),
    heroAccent: Color(0xFFFFFFFF),
    tagViolet: AppTone(Color(0xFFECE6FF), Color(0xFF4A22C9)),
    tagGreen: AppTone(Color(0xFFDCF4EA), Color(0xFF0D6446)),
    tagAmber: AppTone(Color(0xFFFCEFD6), Color(0xFF80520A)),
    tagBlue: AppTone(Color(0xFFE0EBFF), Color(0xFF1C4AAB)),
    statusSuccess: AppTone(Color(0xFFDCF4EA), Color(0xFF0D6446)),
    statusWarning: AppTone(Color(0xFFFCEFD6), Color(0xFF80520A)),
    statusInfo: AppTone(Color(0xFFE0EBFF), Color(0xFF1C4AAB)),
    statusNeutral: AppTone(Color(0xFFEEECF4), Color(0xFF5E5A78)),
    statusViolet: AppTone(Color(0xFFECE6FF), Color(0xFF4A22C9)),
    alertWarning: Color(0xFFFDF6E7),
    alertWarningBorder: Color(0xFFF3DFB2),
  );

  static const AppColors dark = AppColors(
    brightness: Brightness.dark,
    background: Color(0xFF05050D),
    backgroundSecondary: Color(0xFF1A1A2A),
    surface: Color(0xFF0B0C1D),
    surfaceElevated: Color(0xFF05050D),
    unreadSurface: Color(0xFF10112A),
    primary: Color(0xFF6437FA),
    primaryPressed: Color(0xFF5424E0),
    primaryText: Color(0xFFA78BFA),
    primaryTint: Color(0xFF141233),
    primaryWash: Color(0xFF10112A),
    onPrimary: Color(0xFFFFFFFF),
    headlineAccent: Color(0xFFA78BFA),
    gold: Color(0xFFFBBF24),
    goldTint: Color(0xFF33260A),
    textPrimary: Color(0xFFF4F3FF),
    textSecondary: Color(0xFFA9A8C3),
    textMuted: Color(0xFFA9A8C3),
    textDisabled: Color(0xFF4B4A66),
    articleSecondary: Color(0xFFD9D8EC),
    inverse: Color(0xFFF4F3FF),
    onInverse: Color(0xFF05050D),
    border: Color(0xFF1D1F3D),
    borderSoft: Color(0xFF16182F),
    borderAccent: Color(0xFF3A2D8F),
    borderStrong: Color(0xFF2A2C4D),
    switchTrackOff: Color(0xFF3A3858),
    success: Color(0xFF4ADE80),
    warning: Color(0xFFFBBF24),
    error: Color(0xFFF87171),
    glass: Color(0xB80B0C1D),
    pressedOverlay: Color(0x0FF4F3FF),
    shadow: Color(0xFF000000),
    heroStart: Color(0xFF6437FA),
    heroEnd: Color(0xFF6437FA),
    heroAccent: Color(0xFFFFFFFF),
    tagViolet: AppTone(Color(0xFF3A1FA8), Color(0xFFFFFFFF)),
    tagGreen: AppTone(Color(0xFF0F5A45), Color(0xFFFFFFFF)),
    tagAmber: AppTone(Color(0xFF6B4A12), Color(0xFFFFFFFF)),
    tagBlue: AppTone(Color(0xFF123F8F), Color(0xFFFFFFFF)),
    statusSuccess: AppTone(Color(0xFF0C2E24), Color(0xFF4ADE80)),
    statusWarning: AppTone(Color(0xFF33260A), Color(0xFFFBBF24)),
    statusInfo: AppTone(Color(0xFF0F2350), Color(0xFF7FB0FF)),
    statusNeutral: AppTone(Color(0xFF1A1A2A), Color(0xFFA9A8C3)),
    statusViolet: AppTone(Color(0xFF1F1650), Color(0xFFA78BFA)),
    alertWarning: Color(0xFF1C1608),
    alertWarningBorder: Color(0xFF4A3A12),
  );

  @override
  AppColors copyWith() => this;

  /// Modes switch instantly; there is no meaningful midpoint between palettes.
  @override
  AppColors lerp(AppColors? other, double t) =>
      other == null || t < 0.5 ? this : other;
}
