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
  /// Filled violet with a violet glow. One per view.
  primary,

  /// Violet 1.5px outline, violet label — "Save draft", "Get verified".
  secondary,

  /// Neutral outline on the surface — "Sign in", "Continue with Google".
  ghost,

  /// Danger outline — "Not selected", destructive choices.
  danger,

  /// White pill set on a photo — "Read more". Same in both modes.
  overlay,

  /// Borderless inline link — "Forgot password?", "View all".
  text,
}

/// Heights and label sizes from the design. Every button is a pill.
enum BOHButtonSize {
  /// 54 — Welcome, sign-in and sign-up actions.
  auth(AppSizes.buttonHeightAuth, AppSpacing.s24, 15, 18),

  /// 52 — screen and footer actions.
  large(AppSizes.buttonHeightLarge, AppSpacing.s24, 15, 18),

  /// 44 — card actions ("Respond", "Redeem").
  medium(AppSizes.buttonHeightMedium, AppSpacing.s20, 13, 16),

  /// 40 — compact card actions ("Shortlist", "New listing").
  small(AppSizes.buttonHeightSmall, AppSpacing.s14, 12, 14),

  /// 34 — inline pills ("Follow", "Connect", "Upload"), in a 44 target.
  compact(AppSizes.buttonHeightCompact, AppSpacing.s14, 12, 14);

  const BOHButtonSize(
    this.height,
    this.horizontalPadding,
    this.fontSize,
    this.iconSize,
  );
  final double height;
  final double horizontalPadding;
  final double fontSize;
  final double iconSize;
}

/// Call to action. Arrow icons are directional and mirror in Arabic.
class BOHButton extends StatelessWidget {
  const BOHButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.variant = BOHButtonVariant.primary,
    this.size = BOHButtonSize.large,
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
    final isText = variant == BOHButtonVariant.text;

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
        final textStyle = AppTypography.label.copyWith(
          fontSize: isText ? 13 : size.fontSize,
          height: 1.25,
          color: style.foreground,
          letterSpacing: 0,
        );
        final iconSize = size.iconSize;

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
                    SizedBox.square(dimension: iconSize + 2, child: leading),
                    const SizedBox(width: AppSpacing.s10),
                  ] else if (leadingIcon != null) ...[
                    Icon(leadingIcon, size: iconSize, color: style.foreground),
                    const SizedBox(width: AppSpacing.s8),
                  ],
                  // Narrow slots (a paired footer) shrink the label a little
                  // rather than cut a short action word.
                  Flexible(
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      child: Text(label, style: textStyle, maxLines: 1),
                    ),
                  ),
                  // Inline links stay label-only; arrowed links live in
                  // `BOHSectionHeader` and `BOHLinkButton`.
                  if (trailingIcon != null && !isText) ...[
                    const SizedBox(width: AppSpacing.s10),
                    Icon(trailingIcon, size: iconSize, color: style.foreground),
                  ],
                ],
        );

        final visual = AnimatedContainer(
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
            borderRadius: AppRadii.pillAll,
            border: style.border == null
                ? null
                : Border.all(color: style.border!, width: AppSizes.outline),
            boxShadow: style.glow
                ? AppShadows.violet(
                    c,
                    strength: size.height >= AppSizes.buttonHeightLarge
                        ? 0.4
                        : 0.35,
                    blur: size.height >= AppSizes.buttonHeightLarge ? 26 : 20,
                    dy: size.height >= AppSizes.buttonHeightLarge ? 10 : 8,
                  )
                : null,
          ),
          child: content,
        );

        // Compact pills keep a 44 hit area around a 34 visual.
        if (size == BOHButtonSize.compact && !isText) {
          return ConstrainedBox(
            constraints: const BoxConstraints(
              minHeight: AppSizes.minTouchTarget,
            ),
            child: Center(widthFactor: 1, heightFactor: 1, child: visual),
          );
        }
        return visual;
      },
    );
  }
}

/// Outlined violet button — shorthand for [BOHButtonVariant.secondary].
class BOHSecondaryButton extends StatelessWidget {
  const BOHSecondaryButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.size = BOHButtonSize.large,
    this.leadingIcon,
    this.trailingIcon = AppIcons.arrowForward,
    this.isLoading = false,
    this.expand = true,
  });

  final String label;
  final VoidCallback? onPressed;
  final BOHButtonSize size;
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
          background: c.border,
          foreground: c.textSecondary,
        ),
        BOHButtonVariant.text => _BOHButtonStyle(
          background: AppColors.transparent,
          foreground: c.textDisabled,
        ),
        _ => _BOHButtonStyle(
          background: AppColors.transparent,
          foreground: c.textDisabled,
          border: c.border,
        ),
      };
    }

    return switch (variant) {
      BOHButtonVariant.primary => _BOHButtonStyle(
        background: pressed ? c.primaryPressed : c.primary,
        foreground: c.onPrimary,
        glow: !pressed,
      ),
      BOHButtonVariant.secondary => _BOHButtonStyle(
        background: pressed ? c.primaryTint : AppColors.transparent,
        foreground: c.primaryText,
        border: c.primary,
      ),
      BOHButtonVariant.ghost => _BOHButtonStyle(
        background: pressed ? c.primaryWash : c.surface,
        foreground: c.textPrimary,
        border: c.borderStrong,
      ),
      BOHButtonVariant.danger => _BOHButtonStyle(
        background: pressed
            ? c.error.withValues(alpha: 0.08)
            : AppColors.transparent,
        foreground: c.error,
        border: c.error,
      ),
      BOHButtonVariant.overlay => const _BOHButtonStyle(
        background: AppColors.onPhoto,
        foreground: AppColors.photoInk,
      ),
      BOHButtonVariant.text => _BOHButtonStyle(
        background: AppColors.transparent,
        foreground: pressed ? c.primaryPressed : c.primaryText,
      ),
    };
  }
}
