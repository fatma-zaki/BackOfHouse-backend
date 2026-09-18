import 'package:flutter/material.dart';

/// Back Of House colour roles, resolved per theme mode.
///
/// Components read colours through `context.colors`, never a hex literal,
/// so every screen works in both modes.
///
/// * [light] is the default: an off-white ground, white surfaces, navy ink
///   and a purple tuned for white backgrounds (sampled from the light
///   reference screens).
/// * [dark] is the backstage palette from the original design system.
@immutable
class AppColors extends ThemeExtension<AppColors> {
  const AppColors({
    required this.brightness,
    required this.background,
    required this.backgroundSecondary,
    required this.surface,
    required this.surfaceElevated,
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
    required this.border,
    required this.borderSoft,
    required this.success,
    required this.warning,
    required this.error,
    required this.glass,
    required this.pressedOverlay,
    required this.shadow,
    required this.heroStart,
    required this.heroEnd,
    required this.heroAccent,
  });

  final Brightness brightness;

  // ── Grounds ──────────────────────────────────────────────────────────────
  final Color background;
  final Color backgroundSecondary;
  final Color surface;
  final Color surfaceElevated;

  // ── Brand ────────────────────────────────────────────────────────────────
  /// Fills, borders and icons of primary actions.
  final Color primary;
  final Color primaryPressed;

  /// Purple safe for small text on [surface] and [background] (≥ 4.5:1).
  final Color primaryText;

  /// Selected chips and tags.
  final Color primaryTint;

  /// Pressed and focused washes.
  final Color primaryWash;
  final Color onPrimary;

  /// Highlighted word in large headlines.
  final Color headlineAccent;

  /// Rare distinction (verified, featured). At most one gold element in view.
  final Color gold;
  final Color goldTint;

  // ── Text ─────────────────────────────────────────────────────────────────
  final Color textPrimary;
  final Color textSecondary;
  final Color textMuted;
  final Color textDisabled;

  // ── Lines ────────────────────────────────────────────────────────────────
  final Color border;
  final Color borderSoft;

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
  /// Deep plum gradient behind feature cards (points balance, promo banners).
  /// Text on it is always [onPhoto].
  final Color heroStart;
  final Color heroEnd;

  /// Progress and highlights on hero surfaces (the gold points bar).
  final Color heroAccent;

  bool get isDark => brightness == Brightness.dark;

  // ── Photography ──────────────────────────────────────────────────────────
  // Text set on photos is always light on a dark scrim, in either mode.

  static const Color photoInk = Color(0xFF04080D);
  static const Color onPhoto = Color(0xFFF7F7F8);
  static const Color transparent = Color(0x00000000);

  /// Stitch "Back Of House" system: lavender-white ground, white cards,
  /// deep purple primary, amber for verification. Tertiary text and the
  /// gold/green accents are darkened from the source values to meet WCAG AA
  /// for small text.
  static const AppColors light = AppColors(
    brightness: Brightness.light,
    background: Color(0xFFFBF8FF),
    backgroundSecondary: Color(0xFFF4F2FD),
    surface: Color(0xFFFFFFFF),
    surfaceElevated: Color(0xFFEEEDF7),
    primary: Color(0xFF5832E6),
    primaryPressed: Color(0xFF4000CC),
    primaryText: Color(0xFF5832E6),
    primaryTint: Color(0xFFEDE9FE),
    primaryWash: Color(0xFFF4F2FD),
    onPrimary: Color(0xFFFFFFFF),
    headlineAccent: Color(0xFF5832E6),
    gold: Color(0xFF795900),
    goldTint: Color(0xFFFEF3D6),
    textPrimary: Color(0xFF1A1B22),
    textSecondary: Color(0xFF484556),
    textMuted: Color(0xFF6F6B7E),
    textDisabled: Color(0xFFB3AFC2),
    border: Color(0xFFE3E1EC),
    borderSoft: Color(0xFFEEEDF7),
    success: Color(0xFF15803D),
    warning: Color(0xFF9A5B06),
    error: Color(0xFFBA1A1A),
    glass: Color(0xE6FBF8FF),
    pressedOverlay: Color(0x0A1A1B22),
    shadow: Color(0xFF14102D),
    heroStart: Color(0xFF4000CC),
    heroEnd: Color(0xFF5832E6),
    heroAccent: Color(0xFFF6BE39),
  );

  static const AppColors dark = AppColors(
    brightness: Brightness.dark,
    background: Color(0xFF04080D),
    backgroundSecondary: Color(0xFF080F17),
    surface: Color(0xFF0B1420),
    surfaceElevated: Color(0xFF101B29),
    primary: Color(0xFF6C35FC),
    primaryPressed: Color(0xFF4319A8),
    primaryText: Color(0xFF9B6BFF),
    primaryTint: Color(0x296C35FC),
    primaryWash: Color(0x146C35FC),
    onPrimary: Color(0xFFF7F7F8),
    headlineAccent: Color(0xFF7B3FFF),
    gold: Color(0xFFD6A84F),
    goldTint: Color(0x1AD6A84F),
    textPrimary: Color(0xFFF7F7F8),
    textSecondary: Color(0xFFB8C0CE),
    textMuted: Color(0xFF707A8C),
    textDisabled: Color(0xFF4B5565),
    border: Color(0xFF26344A),
    borderSoft: Color(0xFF182536),
    success: Color(0xFF35C98A),
    warning: Color(0xFFFFB547),
    error: Color(0xFFFF5C6C),
    glass: Color(0xB8101B29),
    pressedOverlay: Color(0x0FF7F7F8),
    shadow: Color(0xFF000000),
    heroStart: Color(0xFF1C0E45),
    heroEnd: Color(0xFF4319A8),
    heroAccent: Color(0xFFD6A84F),
  );

  @override
  AppColors copyWith() => this;

  /// Modes switch instantly; there is no meaningful midpoint between palettes.
  @override
  AppColors lerp(AppColors? other, double t) =>
      other == null || t < 0.5 ? this : other;
}
