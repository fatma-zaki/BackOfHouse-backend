import 'package:flutter/widgets.dart';

import '../../../app/theme/app_motion.dart';
import '../../../app/theme/app_radii.dart';
import '../../extensions/context_extensions.dart';

/// Thin rounded progress track. The fill eases in when [value] changes.
class BOHProgressBar extends StatelessWidget {
  const BOHProgressBar({
    super.key,
    required this.value,
    this.height = 6,
    this.color,
    this.trackColor,
    this.semanticLabel,
    this.onViolet = false,
  });

  /// 0–1.
  final double value;
  final double height;
  final Color? color;
  final Color? trackColor;

  /// Announced with the percentage, e.g. "320 of 500 points".
  final String? semanticLabel;

  /// White fill on a translucent track, for violet hero cards.
  final bool onViolet;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final clamped = value.clamp(0.0, 1.0);

    return Semantics(
      label: semanticLabel,
      value: '${(clamped * 100).round()}%',
      child: ClipRRect(
        borderRadius: AppRadii.pillAll,
        child: SizedBox(
          height: height,
          child: Stack(
            children: [
              Positioned.fill(
                child: ColoredBox(
                  color:
                      trackColor ??
                      (onViolet
                          ? c.onPrimary.withValues(alpha: 0.25)
                          : c.primaryTint),
                ),
              ),
              TweenAnimationBuilder<double>(
                tween: Tween(end: clamped),
                duration: context.reduceMotion ? Duration.zero : AppMotion.slow,
                curve: AppMotion.emphasized,
                builder: (context, v, _) => FractionallySizedBox(
                  alignment: AlignmentDirectional.centerStart,
                  widthFactor: v,
                  heightFactor: 1,
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      color: color ?? (onViolet ? c.onPrimary : c.primary),
                      borderRadius: AppRadii.pillAll,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
