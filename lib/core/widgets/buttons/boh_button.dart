import 'package:flutter/material.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_motion.dart';
import '../../../app/theme/app_radii.dart';
import '../../../app/theme/app_shadows.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../constants/app_icons.dart';
import '../../extensions/context_extensions.dart';
import '../motion/boh_pressable.dart';

enum BOHButtonVariant {
  /// Filled purple. One per view.
  primary,

  /// Purple outline.
  secondary,

  /// Neutral outline on a surface fill — "Continue with Google".
  ghost,

  /// Borderless inline link — "Forgot password?".
  text,
}

enum BOHButtonSize {
  large(AppSizes.buttonHeightLarge, AppSpacing.s24),
  medium(AppSizes.buttonHeightMedium, AppSpacing.s20),
  small(AppSizes.buttonHeightSmall, AppSpacing.s16);

  const BOHButtonSize(this.height, this.horizontalPadding);
  final double height;
  final double horizontalPadding;
}

enum BOHButtonShape {
  /// Small-radius rectangle — form actions.
  rounded,

  /// Full pill — hero calls to action.
  pill,
}

/// Call to action. Arrow icons are directional and mirror in Arabic.
class BOHButton extends StatelessWidget {
  const BOHButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = BOHButtonVariant.primary,
    this.size = BOHButtonSize.large,
    this.shape = BOHButtonShape.rounded,
    this.leading,
    this.leadingIcon,
    this.trailingIcon = AppIcons.arrowForward,
    this.isLoading = false,
    this.expand = true,
  });

  final String label;

  /// `null` renders the disabled state.
  final VoidCallback? onPressed;
  final BOHButtonVariant variant;
  final BOHButtonSize size;
  final BOHButtonShape shape;

  /// Custom leading visual, e.g. a provider logo. Wins over [leadingIcon].
  final Widget? leading;
  final IconData? leadingIcon;

  /// Defaults to the forward arrow; pass `null` for a label-only button.
  final IconData? trailingIcon;
  final bool isLoading;

  /// Fill the available width. Text buttons never expand.
  final bool expand;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final enabled = onPressed != null && !isLoading;

    return BOHPressable(
      onTap: enabled ? onPressed : null,
      semanticLabel: label,
      builder: (context, state) {
        final style = _BOHButtonStyle.resolve(
          c,
          variant,
          enabled: enabled || isLoading,
          pressed: state.pressed,
        );
        final textStyle =
            // Inline links sit in running text, so they match its size.
            (size == BOHButtonSize.small || variant == BOHButtonVariant.text
                    ? AppTypography.label
                    : AppTypography.cardTitle)
                .copyWith(color: style.foreground);
        final iconSize = size == BOHButtonSize.small
            ? AppSizes.iconSmall
            : AppSizes.iconMedium;
        final isText = variant == BOHButtonVariant.text;

        // A Row (not Container.alignment) centres the label: it honours the
        // min height without forcing the button to fill loose constraints.
        final content = Row(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          children: isLoading
              ? [
                  SizedBox.square(
                    dimension: iconSize,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      color: style.foreground,
                    ),
                  ),
                ]
              : [
                  if (leading != null) ...[
                    SizedBox.square(dimension: iconSize, child: leading),
                    const SizedBox(width: AppSpacing.s12),
                  ] else if (leadingIcon != null) ...[
                    Icon(leadingIcon, size: iconSize, color: style.foreground),
                    const SizedBox(width: AppSpacing.s8),
                  ],
                  Flexible(
                    child: Text(
                      label,
                      style: textStyle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (trailingIcon != null && !isText) ...[
                    const SizedBox(width: AppSpacing.s12),
                    Icon(trailingIcon, size: iconSize, color: style.foreground),
                  ],
                ],
        );

        return AnimatedContainer(
          duration: AppMotion.fast,
          curve: AppMotion.standard,
          constraints: BoxConstraints(
            minHeight: isText ? AppSizes.minTouchTarget : size.height,
            minWidth: AppSizes.minTouchTarget,
          ),
          width: expand && !isText ? double.infinity : null,
          padding: EdgeInsets.symmetric(
            horizontal: isText ? AppSpacing.s4 : size.horizontalPadding,
          ),
          decoration: BoxDecoration(
            color: style.background,
            borderRadius: shape == BOHButtonShape.pill
                ? AppRadii.pillAll
                : AppRadii.smallAll,
            border: style.border == null
                ? null
                : Border.all(color: style.border!),
            boxShadow: style.glow ? AppShadows.primaryGlow(c) : null,
          ),
          child: content,
        );
      },
    );
  }
}

/// Outlined purple button — shorthand for [BOHButtonVariant.secondary].
class BOHSecondaryButton extends StatelessWidget {
  const BOHSecondaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.size = BOHButtonSize.large,
    this.shape = BOHButtonShape.rounded,
    this.leadingIcon,
    this.trailingIcon = AppIcons.arrowForward,
    this.isLoading = false,
    this.expand = true,
  });

  final String label;
  final VoidCallback? onPressed;
  final BOHButtonSize size;
  final BOHButtonShape shape;
  final IconData? leadingIcon;
  final IconData? trailingIcon;
  final bool isLoading;
  final bool expand;

  @override
  Widget build(BuildContext context) {
    return BOHButton(
      label: label,
      onPressed: onPressed,
      variant: BOHButtonVariant.secondary,
      size: size,
      shape: shape,
      leadingIcon: leadingIcon,
      trailingIcon: trailingIcon,
      isLoading: isLoading,
      expand: expand,
    );
  }
}

@immutable
class _BOHButtonStyle {
  const _BOHButtonStyle({
    required this.background,
    required this.foreground,
    this.border,
    this.glow = false,
  });

  final Color background;
  final Color foreground;
  final Color? border;
  final bool glow;

  static _BOHButtonStyle resolve(
    AppColors c,
    BOHButtonVariant variant, {
    required bool enabled,
    required bool pressed,
  }) {
    if (!enabled) {
      return switch (variant) {
        BOHButtonVariant.primary => _BOHButtonStyle(
          background: c.surfaceElevated,
          foreground: c.textDisabled,
        ),
        BOHButtonVariant.text => _BOHButtonStyle(
          background: AppColors.transparent,
          foreground: c.textDisabled,
        ),
        _ => _BOHButtonStyle(
          background: AppColors.transparent,
          foreground: c.textDisabled,
          border: c.borderSoft,
        ),
      };
    }

    return switch (variant) {
      BOHButtonVariant.primary => _BOHButtonStyle(
        background: pressed ? c.primaryPressed : c.primary,
        foreground: c.onPrimary,
        glow: !pressed,
      ),
      // Stitch secondary: lavender wash, purple label, tinted hairline.
      BOHButtonVariant.secondary => _BOHButtonStyle(
        background: pressed ? c.primaryTint : c.primaryWash,
        foreground: c.primaryText,
        border: c.primaryTint,
      ),
      BOHButtonVariant.ghost => _BOHButtonStyle(
        background: pressed ? c.surfaceElevated : c.surface,
        foreground: c.textPrimary,
        border: c.border,
      ),
      BOHButtonVariant.text => _BOHButtonStyle(
        background: AppColors.transparent,
        foreground: pressed ? c.primaryPressed : c.primaryText,
      ),
    };
  }
}
