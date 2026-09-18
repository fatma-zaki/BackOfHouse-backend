import 'package:flutter/material.dart';

import '../../../app/theme/app_spacing.dart';
import '../../constants/app_icons.dart';
import '../../extensions/context_extensions.dart';
import '../motion/boh_pressable.dart';

/// Section title with an optional supporting line and a trailing link —
/// "Companies to Watch •          View All (48) ›".
class BOHSectionHeader extends StatelessWidget {
  const BOHSectionHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.actionLabel,
    this.onAction,
    this.showDot = false,
    this.trailing,
  });

  final String title;
  final String? subtitle;

  /// Defaults to "See all" when [onAction] is set.
  final String? actionLabel;
  final VoidCallback? onAction;

  /// Small primary dot after the title, marking live or featured content.
  final bool showDot;

  /// Replaces the action link, e.g. a count badge.
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final label = actionLabel ?? context.l10n.actionViewAll;

    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Flexible(
                    child: Semantics(
                      header: true,
                      child: Text(
                        title,
                        style: context.text.h3,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ),
                  if (showDot) ...[
                    const SizedBox(width: AppSpacing.s8),
                    Container(
                      width: 6,
                      height: 6,
                      decoration: BoxDecoration(
                        color: c.primary,
                        shape: BoxShape.circle,
                      ),
                    ),
                  ],
                ],
              ),
              if (subtitle != null) ...[
                const SizedBox(height: 2),
                Text(
                  subtitle!,
                  style: context.text.bodySmall.copyWith(color: c.textMuted),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ],
          ),
        ),
        if (trailing != null)
          trailing!
        else if (onAction != null)
          BOHPressable(
            onTap: onAction,
            semanticLabel: '$label, $title',
            child: ConstrainedBox(
              constraints: const BoxConstraints(
                minHeight: AppSizes.minTouchTarget,
                minWidth: AppSizes.minTouchTarget,
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Text(
                    label,
                    style: context.text.labelMedium.copyWith(
                      color: c.primaryText,
                    ),
                  ),
                  Icon(
                    AppIcons.chevronForward,
                    size: AppSizes.iconSmall,
                    color: c.primaryText,
                  ),
                ],
              ),
            ),
          ),
      ],
    );
  }
}
