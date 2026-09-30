import 'package:flutter/material.dart';

import '../../../app/theme/app_spacing.dart';
import '../../constants/app_icons.dart';
import '../../extensions/context_extensions.dart';
import '../motion/boh_pressable.dart';

/// The brand's section motif: a small violet bar skewed −18°. Identical in
/// both themes and never mirrored in Arabic.
class BOHSkewBar extends StatelessWidget {
  const BOHSkewBar({
    super.key,
    this.width = AppSizes.skewBarWidth,
    this.height = AppSizes.skewBarHeight,
  });

  final double width;
  final double height;

  @override
  Widget build(BuildContext context) {
    return Transform(
      alignment: Alignment.center,
      // CSS skewX(-18deg); Matrix4.skewX takes the angle in radians.
      transform: Matrix4.skewX(-18 * 3.141592653589793 / 180),
      child: SizedBox(
        width: width,
        height: height,
        child: ColoredBox(color: context.colors.primary),
      ),
    );
  }
}

enum BOHSectionSize {
  /// 18px — home, discover, news sections.
  normal(18, 24, AppSizes.skewBarHeight),

  /// 17px — profile, dashboard, company profile.
  compact(17, 23, AppSizes.skewBarHeight),

  /// 16px with an 18px bar — sub-sections on detail screens.
  sub(16, 21, 18);

  const BOHSectionSize(this.fontSize, this.lineHeight, this.barHeight);
  final double fontSize;
  final double lineHeight;
  final double barHeight;
}

/// Section title with the skew bar (or a leading icon), an optional
/// supporting line and a trailing link — "Featured event      View All →".
class BOHSectionHeader extends StatelessWidget {
  const BOHSectionHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.actionLabel,
    this.onAction,
    this.actionArrow = true,
    this.leadingIcon,
    this.size = BOHSectionSize.normal,
    this.trailing,
    this.showDot = false,
  });

  final String title;
  final String? subtitle;

  /// Defaults to "View All" when [onAction] is set.
  final String? actionLabel;
  final VoidCallback? onAction;

  /// Trailing arrow after the action label.
  final bool actionArrow;

  /// A violet icon in place of the skew bar ("Opportunities for you").
  final IconData? leadingIcon;
  final BOHSectionSize size;

  /// Replaces the action link, e.g. a segmented control or "+ Add".
  final Widget? trailing;

  /// Kept for source compatibility; the skew bar replaces the dot.
  final bool showDot;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final label = actionLabel ?? context.l10n.actionViewAll;

    final heading = Row(
      children: [
        if (leadingIcon != null)
          Icon(leadingIcon, size: 20, color: c.primary)
        else
          BOHSkewBar(height: size.barHeight),
        const SizedBox(width: AppSpacing.s10),
        Flexible(
          child: Semantics(
            header: true,
            child: Text(
              title,
              style: context.text.h2.copyWith(
                fontSize: size.fontSize,
                height: size.lineHeight / size.fontSize,
              ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ),
      ],
    );

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s4),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                heading,
                if (subtitle != null) ...[
                  const SizedBox(height: AppSpacing.s2),
                  Padding(
                    padding: const EdgeInsetsDirectional.only(start: 14),
                    child: Text(
                      subtitle!,
                      style: context.text.bodySmall,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ],
            ),
          ),
          if (trailing != null)
            trailing!
          else if (onAction != null)
            BOHLinkButton(
              label: label,
              onTap: onAction!,
              semanticLabel: '$label, $title',
              arrow: actionArrow,
            ),
        ],
      ),
    );
  }
}

/// Violet text link with an optional forward arrow — "View All →",
/// "View details →". Mirrors in Arabic; 44px tall hit area.
class BOHLinkButton extends StatelessWidget {
  const BOHLinkButton({
    super.key,
    required this.label,
    required this.onTap,
    this.arrow = true,
    this.icon,
    this.color,
    this.fontSize = 13,
    this.semanticLabel,
  });

  final String label;
  final VoidCallback? onTap;
  final bool arrow;

  /// Leading icon instead of the arrow ("+ Add project", "History").
  final IconData? icon;

  /// Defaults to violet text; pass the danger colour for "Withdraw".
  final Color? color;
  final double fontSize;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final ink = color ?? context.colors.primaryText;
    return BOHPressable(
      onTap: onTap,
      semanticLabel: semanticLabel ?? label,
      child: ConstrainedBox(
        constraints: const BoxConstraints(
          minHeight: AppSizes.minTouchTarget,
          minWidth: AppSizes.minTouchTarget,
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.end,
          children: [
            if (icon != null) ...[
              Icon(icon, size: fontSize + 2, color: ink),
              const SizedBox(width: AppSpacing.s4),
            ],
            Text(
              label,
              style: context.text.label.copyWith(
                fontSize: fontSize,
                color: ink,
              ),
            ),
            if (arrow && icon == null) ...[
              const SizedBox(width: AppSpacing.s6),
              Icon(AppIcons.arrowForward, size: fontSize + 2, color: ink),
            ],
          ],
        ),
      ),
    );
  }
}
