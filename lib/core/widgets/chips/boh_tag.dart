import 'package:flutter/widgets.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_radii.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../constants/app_icons.dart';
import '../../extensions/context_extensions.dart';

enum BOHTagVariant {
  /// Lavender category label — "Conference".
  accent,

  /// Neutral hairline.
  outline,

  /// Solid purple — the one highlighted tag in a group.
  solid,

  /// Premium distinction, e.g. a certification. Gold is rare; one per view
  /// at most. Not for paid placement, which must never look like trust.
  gold,

  /// Verified company or credential: amber tint with a check badge.
  verified,

  /// Skill and role pills: soft grey, secondary ink.
  neutral,

  success,
  warning,
  error,
}

/// Small non-interactive label. Status variants always carry an icon, so
/// meaning never depends on colour alone.
class BOHTag extends StatelessWidget {
  const BOHTag(
    this.label, {
    super.key,
    this.variant = BOHTagVariant.accent,
    this.icon,
    this.uppercase = false,
  });

  final String label;
  final BOHTagVariant variant;
  final IconData? icon;

  /// Editorial caps, for tags set on photography. Ignored for Arabic.
  final bool uppercase;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;

    Color tint(Color color) => color.withValues(alpha: c.isDark ? 0.12 : 0.08);

    final (
      Color fill,
      Color? border,
      Color foreground,
      IconData? statusIcon,
    ) = switch (variant) {
      BOHTagVariant.accent => (
        c.primaryTint,
        c.isDark ? c.primary.withValues(alpha: 0.6) : null,
        c.isDark ? c.textPrimary : c.primaryText,
        null,
      ),
      BOHTagVariant.outline => (
        AppColors.transparent,
        c.border,
        c.textSecondary,
        null,
      ),
      BOHTagVariant.solid => (c.primary, null, c.onPrimary, null),
      BOHTagVariant.gold => (c.goldTint, null, c.gold, AppIcons.star),
      BOHTagVariant.verified => (c.goldTint, null, c.gold, AppIcons.verified),
      BOHTagVariant.neutral => (c.surfaceElevated, null, c.textSecondary, null),
      BOHTagVariant.success => (
        tint(c.success),
        null,
        c.success,
        AppIcons.success,
      ),
      BOHTagVariant.warning => (
        tint(c.warning),
        null,
        c.warning,
        AppIcons.info,
      ),
      BOHTagVariant.error => (tint(c.error), null, c.error, AppIcons.error),
    };

    final arabic = context.isArabic;
    final resolvedIcon = icon ?? statusIcon;

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.s8 + 2,
        vertical: AppSpacing.s4,
      ),
      decoration: BoxDecoration(
        color: fill,
        borderRadius: AppRadii.pillAll,
        border: border == null ? null : Border.all(color: border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (resolvedIcon != null) ...[
            Icon(resolvedIcon, size: 12, color: foreground),
            const SizedBox(width: AppSpacing.s4),
          ],
          Flexible(
            child: Text(
              uppercase && !arabic ? label.toUpperCase() : label,
              style: AppTypography.tag.copyWith(
                color: foreground,
                letterSpacing: arabic ? 0 : (uppercase ? 0.66 : null),
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
