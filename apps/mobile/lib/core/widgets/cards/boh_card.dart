import 'package:flutter/widgets.dart';

import '../../../app/theme/app_motion.dart';
import '../../../app/theme/app_radii.dart';
import '../../../app/theme/app_shadows.dart';
import '../../../app/theme/app_spacing.dart';
import '../../extensions/context_extensions.dart';
import '../motion/boh_pressable.dart';

enum BOHCardTone {
  /// Hairline border and soft shadow.
  normal,

  /// 1.5px accent border — featured, highlighted, selected summaries.
  accent,

  /// 1px accent border — invited, unread (unread also tints the fill).
  accentThin,

  /// Amber border — needs attention (changes requested, highlighted).
  warning,

  /// Hairline border, no shadow — steps, settings groups, balance rows.
  flat,
}

/// Content surface: white (light) or midnight panel (dark) with a hairline
/// and the design's soft shadow.
///
/// Radii by role: [AppRadii.largeAll] (20, default) for standard cards,
/// `listCardAll` (18) for list rows, `mediumAll` (16) for small cards,
/// `heroAll` (22) for hero cards.
class BOHCard extends StatelessWidget {
  const BOHCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(AppSpacing.cardPadding),
    this.borderRadius = AppRadii.largeAll,
    this.tone = BOHCardTone.normal,
    this.unread = false,
    this.color,
    this.onTap,
    this.semanticLabel,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final BorderRadius borderRadius;
  final BOHCardTone tone;

  /// Unread notifications: accent border and, in dark mode, a lifted fill.
  final bool unread;

  /// Defaults to the theme surface.
  final Color? color;
  final VoidCallback? onTap;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final effective = unread ? BOHCardTone.accentThin : tone;

    final (borderColor, borderWidth) = switch (effective) {
      BOHCardTone.normal || BOHCardTone.flat => (c.border, AppSizes.hairline),
      BOHCardTone.accent => (c.borderAccent, AppSizes.outline),
      BOHCardTone.accentThin => (c.borderAccent, AppSizes.hairline),
      BOHCardTone.warning => (c.alertWarningBorder, AppSizes.hairline),
    };

    Widget surface(bool pressed) => AnimatedContainer(
      duration: AppMotion.fast,
      curve: AppMotion.standard,
      padding: padding,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: pressed
            ? c.primaryWash
            : (color ?? (unread ? c.unreadSurface : c.surface)),
        borderRadius: borderRadius,
        border: Border.all(color: borderColor, width: borderWidth),
        boxShadow: effective == BOHCardTone.flat ? null : AppShadows.card(c),
      ),
      child: child,
    );

    if (onTap == null) return surface(false);

    return BOHPressable(
      onTap: onTap,
      semanticLabel: semanticLabel,
      builder: (context, state) => surface(state.pressed),
    );
  }
}

/// Divider row at the bottom of a card: meta on the start, action on the end.
class BOHCardFooter extends StatelessWidget {
  const BOHCardFooter({super.key, required this.leading, this.trailing});

  final Widget leading;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Container(
      padding: const EdgeInsets.only(top: AppSpacing.s10),
      decoration: BoxDecoration(
        border: Border(top: BorderSide(color: c.border)),
      ),
      child: Row(
        children: [
          Expanded(child: leading),
          if (trailing != null) ...[
            const SizedBox(width: AppSpacing.s8),
            trailing!,
          ],
        ],
      ),
    );
  }
}
