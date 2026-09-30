import 'package:flutter/painting.dart';

import 'app_colors.dart';

/// Elevation per mode, from the design hand-off. Light uses soft
/// violet-tinted shadows; dark keeps the same geometry in black.
abstract final class AppShadows {
  /// Resting cards: `0 8px 30px rgba(40,20,120,.06)` / `rgba(0,0,0,.35)`.
  static List<BoxShadow> card(AppColors c) => [
    BoxShadow(
      color: c.shadow.withValues(alpha: c.isDark ? 0.35 : 0.06),
      blurRadius: 30,
      offset: const Offset(0, 8),
    ),
  ];

  /// Raised surfaces, pressed cards, menus.
  static List<BoxShadow> raised(AppColors c) => [
    BoxShadow(
      color: c.shadow.withValues(alpha: c.isDark ? 0.45 : 0.10),
      blurRadius: 30,
      offset: const Offset(0, 12),
    ),
  ];

  /// Bottom bar and sticky footers: `0 -10px 30px`.
  static List<BoxShadow> nav(AppColors c) => [
    BoxShadow(
      color: c.shadow.withValues(alpha: c.isDark ? 0.5 : 0.07),
      blurRadius: 30,
      offset: const Offset(0, -10),
    ),
  ];

  /// Violet glow under primary buttons and violet tiles. [strength] picks
  /// the design's steps: small elements .3, buttons .35–.4, heroes .45.
  static List<BoxShadow> violet(
    AppColors c, {
    double strength = 0.35,
    double blur = 26,
    double dy = 10,
  }) => [
    BoxShadow(
      color: c.violetShadow(strength),
      blurRadius: blur,
      offset: Offset(0, dy),
    ),
  ];

  /// Under the primary CTA: `0 10px 26px rgba(100,55,250,.4)`.
  static List<BoxShadow> primaryGlow(AppColors c) => violet(c, strength: 0.4);

  /// Small selected elements (active pill, selected tile).
  static List<BoxShadow> accentGlow(AppColors c) =>
      violet(c, strength: 0.35, blur: 20, dy: 8);

  /// Selected segmented thumb: `0 4px 12px rgba(40,20,120,.10)`.
  static List<BoxShadow> thumb(AppColors c) => [
    BoxShadow(
      color: c.shadow.withValues(alpha: c.isDark ? 0.4 : 0.10),
      blurRadius: 12,
      offset: const Offset(0, 4),
    ),
  ];

  /// Focus halo for inputs.
  static List<BoxShadow> focus(AppColors c) => [
    BoxShadow(
      color: c.primary.withValues(alpha: c.isDark ? 0.18 : 0.10),
      spreadRadius: 3,
    ),
  ];

  /// Floating elements (legacy name for [nav]).
  static List<BoxShadow> floating(AppColors c) => nav(c);
}
