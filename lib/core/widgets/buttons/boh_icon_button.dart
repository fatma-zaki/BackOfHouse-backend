import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_motion.dart';
import '../../../app/theme/app_radii.dart';
import '../../../app/theme/app_spacing.dart';
import '../../extensions/context_extensions.dart';
import '../motion/boh_pressable.dart';

enum BOHIconButtonVariant {
  /// Bare icon — app bar actions, password eye.
  plain,

  /// Circle with a hairline — the arrow on a content card.
  outlined,

  /// Rounded purple square — compact primary action.
  filled,

  /// Soft grey circle — back and toolbar actions in headers.
  tonal,
}

/// Icon-only control. Always 44×44 or larger, always labelled for
/// screen readers.
class BOHIconButton extends StatelessWidget {
  const BOHIconButton({
    super.key,
    required this.icon,
    required this.semanticLabel,
    required this.onPressed,
    this.variant = BOHIconButtonVariant.plain,
    this.size = AppSizes.minTouchTarget,
    this.iconSize = AppSizes.iconMedium,
    this.color,
    this.showBadge = false,
  }) : assert(size >= AppSizes.minTouchTarget, 'Below minimum touch target');

  final IconData icon;
  final String semanticLabel;
  final VoidCallback? onPressed;
  final BOHIconButtonVariant variant;
  final double size;
  final double iconSize;

  /// Overrides the icon colour for [BOHIconButtonVariant.plain].
  final Color? color;

  /// Small dot for unread state. Paired with the label in semantics, so it
  /// is never the only signal.
  final bool showBadge;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final enabled = onPressed != null;

    return BOHPressable(
      onTap: onPressed,
      semanticLabel: semanticLabel,
      builder: (context, state) {
        final (background, foreground, border) = switch (variant) {
          BOHIconButtonVariant.plain => (
            state.pressed ? c.pressedOverlay : AppColors.transparent,
            color ?? c.textPrimary,
            null,
          ),
          BOHIconButtonVariant.outlined => (
            state.pressed ? c.primaryTint : c.surface,
            c.textPrimary,
            state.pressed ? c.primary : c.border,
          ),
          BOHIconButtonVariant.filled => (
            state.pressed ? c.primaryPressed : c.primary,
            c.onPrimary,
            null,
          ),
          BOHIconButtonVariant.tonal => (
            state.pressed ? c.border : c.surfaceElevated,
            color ?? c.textPrimary,
            null,
          ),
        };

        final shape = variant == BOHIconButtonVariant.filled
            ? const RoundedRectangleBorder(borderRadius: AppRadii.smallAll)
            : const CircleBorder();

        return SizedBox.square(
          dimension: size,
          child: Stack(
            alignment: Alignment.center,
            children: [
              AnimatedContainer(
                duration: AppMotion.fast,
                curve: AppMotion.standard,
                decoration: ShapeDecoration(
                  color: enabled ? background : c.surfaceElevated,
                  shape: border == null
                      ? shape
                      : shape.copyWith(side: BorderSide(color: border)),
                ),
                alignment: Alignment.center,
                child: Icon(
                  icon,
                  size: iconSize,
                  color: enabled ? foreground : c.textDisabled,
                ),
              ),
              if (showBadge)
                PositionedDirectional(
                  top: size * 0.24,
                  end: size * 0.26,
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: c.primary,
                      shape: BoxShape.circle,
                      border: Border.all(color: c.background, width: 1.5),
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }
}
