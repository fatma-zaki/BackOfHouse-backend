import 'package:flutter/painting.dart';

import 'app_colors.dart';

/// Elevation per mode.
///
/// Light follows the Stitch depth archetypes: ultra-diffused, purple-tinted
/// ambient shadows (`rgba(20,16,45,…)`). In dark mode shadows vanish into the
/// ground, so elevation reads as hairline borders and purple glow instead.
abstract final class AppShadows {
  /// level-1 — resting cards: `0 4px 20px -2px rgba(20,16,45,.05)`.
  static List<BoxShadow> card(AppColors c) => c.isDark
      ? const []
      : [
          BoxShadow(
            color: c.shadow.withValues(alpha: 0.05),
            blurRadius: 20,
            spreadRadius: -2,
            offset: const Offset(0, 4),
          ),
        ];

  /// level-2 — raised surfaces, pressed cards, menus.
  static List<BoxShadow> raised(AppColors c) => c.isDark
      ? const []
      : [
          BoxShadow(
            color: c.shadow.withValues(alpha: 0.08),
            blurRadius: 28,
            spreadRadius: -4,
            offset: const Offset(0, 10),
          ),
        ];

  /// Under the primary CTA: `0 4px 16px rgba(88,50,230,.35)` in light,
  /// a wider stage-light glow in dark.
  static List<BoxShadow> primaryGlow(AppColors c) => [
    BoxShadow(
      color: c.primary.withValues(alpha: c.isDark ? 0.28 : 0.28),
      blurRadius: c.isDark ? 24 : 16,
      offset: Offset(0, c.isDark ? 8 : 4),
    ),
  ];

  /// Small selected elements (active chip, raised nav disc).
  static List<BoxShadow> accentGlow(AppColors c) => [
    BoxShadow(
      color: c.primary.withValues(alpha: c.isDark ? 0.45 : 0.35),
      blurRadius: c.isDark ? 18 : 16,
      offset: c.isDark ? Offset.zero : const Offset(0, 4),
    ),
  ];

  /// Focus halo for inputs: `0 0 0 3px rgba(88,50,230,.1)`.
  static List<BoxShadow> focus(AppColors c) => [
    BoxShadow(
      color: c.primary.withValues(alpha: c.isDark ? 0.18 : 0.10),
      spreadRadius: 3,
    ),
  ];

  /// level-3 — the floating navigation dock: `0 -8px 32px -4px`.
  static List<BoxShadow> floating(AppColors c) => [
    BoxShadow(
      color: c.shadow.withValues(alpha: c.isDark ? 0.6 : 0.08),
      blurRadius: 32,
      spreadRadius: -4,
      offset: Offset(0, c.isDark ? 12 : -8),
    ),
  ];
}
