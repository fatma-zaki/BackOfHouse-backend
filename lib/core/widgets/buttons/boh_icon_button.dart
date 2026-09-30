import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_motion.dart';
import '../../../app/theme/app_shadows.dart';
import '../../../app/theme/app_spacing.dart';
import '../../extensions/context_extensions.dart';
import '../motion/boh_pressable.dart';

enum BOHIconButtonVariant {
  /// Bare icon — header search, bell, share.
  plain,

  /// Surface circle with a hairline — back, close, share, small card
  /// actions (icon in violet when [BOHIconButton.color] says so).
  outlined,

  /// Violet circle with a glow — "+" on tab headers.
  filled,

  /// Same as [outlined]; kept for back buttons in headers.
  tonal,

  /// Soft violet circle — clear search, small toolbar actions.
  soft,

  /// Dark translucent circle over photography, white icon.
  photo,
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
    this.visualSize,
    this.iconSize = AppSizes.iconMedium,
    this.color,
    this.showBadge = false,
    this.active = false,
  }) : assert(size >= AppSizes.minTouchTarget, 'Below minimum touch target');

  final IconData icon;
  final String semanticLabel;
  final VoidCallback? onPressed;
  final BOHIconButtonVariant variant;

  /// Hit area.
  final double size;

  /// Drawn circle when smaller than the hit area (40 on cards, 36 clear).
  final double? visualSize;
  final double iconSize;

  /// Overrides the icon colour.
  final Color? color;

  /// Small dot for unread state. Paired with the label in semantics, so it
  /// is never the only signal.
  final bool showBadge;

  /// Selected state for [BOHIconButtonVariant.photo] (e.g. saved): violet
  /// fill, no border.
  final bool active;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final enabled = onPressed != null;

    return BOHPressable(
      onTap: onPressed,
      semanticLabel: semanticLabel,
      selected: variant == BOHIconButtonVariant.photo ? active : null,
      builder: (context, state) {
        final pressed = state.pressed;
        final (
          Color background,
          Color foreground,
          Color? border,
        ) = switch (variant) {
          BOHIconButtonVariant.plain => (
            pressed ? c.pressedOverlay : AppColors.transparent,
            color ?? c.textPrimary,
            null,
          ),
          BOHIconButtonVariant.outlined || BOHIconButtonVariant.tonal => (
            pressed ? c.primaryWash : c.surface,
            color ?? c.textPrimary,
            c.border,
          ),
          BOHIconButtonVariant.filled => (
            pressed ? c.primaryPressed : c.primary,
            c.onPrimary,
            null,
          ),
          BOHIconButtonVariant.soft => (
            pressed ? c.border : c.primaryTint,
            color ?? c.primaryText,
            null,
          ),
          BOHIconButtonVariant.photo => (
            active
                ? c.primary
                : AppColors.photoInk.withValues(alpha: pressed ? 0.6 : 0.45),
            AppColors.onPhoto,
            active ? null : AppColors.onPhoto.withValues(alpha: 0.25),
          ),
        };

        final circle = visualSize ?? size;

        return SizedBox.square(
          dimension: size,
          child: Stack(
            alignment: Alignment.center,
            children: [
              AnimatedContainer(
                duration: AppMotion.fast,
                curve: AppMotion.standard,
                width: circle,
                height: circle,
                decoration: BoxDecoration(
                  color: enabled ? background : c.backgroundSecondary,
                  shape: BoxShape.circle,
                  border: border == null ? null : Border.all(color: border),
                  boxShadow: variant == BOHIconButtonVariant.filled && enabled
                      ? AppShadows.accentGlow(c)
                      : null,
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
                  top: 10,
                  end: 11,
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: c.primary,
                      shape: BoxShape.circle,
                      border: Border.all(color: c.background, width: 2),
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
