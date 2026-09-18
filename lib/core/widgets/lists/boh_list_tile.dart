import 'package:flutter/material.dart';

import '../../../app/theme/app_radii.dart';
import '../../../app/theme/app_spacing.dart';
import '../../constants/app_icons.dart';
import '../../extensions/context_extensions.dart';
import '../motion/boh_pressable.dart';

enum BOHIconCircleTone { brand, neutral, gold, success, error, onHero }

/// Icon centred in a tinted disc or rounded tile — the leading visual of
/// list rows and feature cards.
class BOHIconCircle extends StatelessWidget {
  const BOHIconCircle({
    super.key,
    required this.icon,
    this.size = 44,
    this.tone = BOHIconCircleTone.brand,
    this.rounded = false,
  });

  final IconData icon;
  final double size;
  final BOHIconCircleTone tone;

  /// Rounded square (Stitch icon tile) instead of a circle.
  final bool rounded;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final (background, foreground) = switch (tone) {
      BOHIconCircleTone.brand => (c.primaryTint, c.primaryText),
      BOHIconCircleTone.neutral => (c.surfaceElevated, c.textSecondary),
      BOHIconCircleTone.gold => (c.goldTint, c.gold),
      BOHIconCircleTone.success => (
        c.success.withValues(alpha: 0.1),
        c.success,
      ),
      BOHIconCircleTone.error => (c.error.withValues(alpha: 0.08), c.error),
      BOHIconCircleTone.onHero => (
        const Color(0x29FFFFFF),
        const Color(0xFFFFFFFF),
      ),
    };
    return ExcludeSemantics(
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          color: background,
          shape: rounded ? BoxShape.rectangle : BoxShape.circle,
          borderRadius: rounded ? AppRadii.smallAll : null,
        ),
        alignment: Alignment.center,
        child: Icon(icon, size: size * 0.5, color: foreground),
      ),
    );
  }
}

/// Row with a leading visual, title, optional subtitle lines and a trailing
/// widget (value, chevron, action). Used for history, notifications,
/// settings and summary rows.
class BOHListTile extends StatelessWidget {
  const BOHListTile({
    super.key,
    required this.title,
    this.leading,
    this.subtitle,
    this.caption,
    this.trailing,
    this.onTap,
    this.showChevron = false,
    this.highlighted = false,
    this.padding = const EdgeInsets.symmetric(
      horizontal: AppSpacing.s16,
      vertical: AppSpacing.s12,
    ),
  });

  final String title;
  final Widget? leading;
  final String? subtitle;

  /// Small print under the subtitle, e.g. a date.
  final String? caption;
  final Widget? trailing;
  final VoidCallback? onTap;
  final bool showChevron;

  /// Tints the row, e.g. an unread notification. Pair with a textual cue.
  final bool highlighted;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;

    Widget row(bool pressed) => AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: padding,
      decoration: BoxDecoration(
        color: pressed
            ? c.pressedOverlay
            : highlighted
            ? c.primaryWash
            : Colors.transparent,
        borderRadius: AppRadii.mediumAll,
      ),
      child: Row(
        children: [
          if (leading != null) ...[
            leading!,
            const SizedBox(width: AppSpacing.s16),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: context.text.label.copyWith(
                    fontWeight: highlighted ? FontWeight.w600 : FontWeight.w500,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                if (subtitle != null) ...[
                  const SizedBox(height: 2),
                  Text(
                    subtitle!,
                    style: context.text.bodySmall.copyWith(
                      color: c.textSecondary,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
                if (caption != null) ...[
                  const SizedBox(height: 2),
                  Text(caption!, style: context.text.caption),
                ],
              ],
            ),
          ),
          if (trailing != null) ...[
            const SizedBox(width: AppSpacing.s12),
            trailing!,
          ],
          if (showChevron) ...[
            const SizedBox(width: AppSpacing.s8),
            Icon(
              AppIcons.chevronForward,
              size: AppSizes.iconMedium,
              color: c.textMuted,
            ),
          ],
        ],
      ),
    );

    if (onTap == null) return MergeSemantics(child: row(false));

    return MergeSemantics(
      child: BOHPressable(
        onTap: onTap,
        scaleOnPress: false,
        builder: (context, state) => row(state.pressed),
      ),
    );
  }
}
