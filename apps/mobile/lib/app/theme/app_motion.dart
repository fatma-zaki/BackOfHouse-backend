import 'package:flutter/animation.dart';

/// Motion tokens. Movement should feel like lights coming up on a stage:
/// short, eased, never bouncy.
abstract final class AppMotion {
  static const Duration fast = Duration(milliseconds: 200);
  static const Duration base = Duration(milliseconds: 280);
  static const Duration slow = Duration(milliseconds: 350);

  /// One full sweep of a loading skeleton. Longer than [slow] on purpose —
  /// it is ambient, not a transition.
  static const Duration shimmer = Duration(milliseconds: 1400);

  /// Default ease for entrances and state changes.
  static const Curve standard = Curves.easeOutCubic;

  /// Decelerating curve for elements arriving on screen.
  static const Curve emphasized = Cubic(0.2, 0, 0, 1);

  /// Scale applied to a pressed surface (spec: 0.98 → 1).
  static const double pressedScale = 0.98;

  /// Distance, as a fraction of the child's size, used by fade-slide entrances.
  static const double entranceOffset = 0.04;
}
