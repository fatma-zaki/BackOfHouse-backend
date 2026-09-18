import 'dart:ui';

import 'package:flutter/widgets.dart';

import '../../../app/theme/app_radii.dart';
import '../../../app/theme/app_spacing.dart';
import '../../extensions/context_extensions.dart';
import '../motion/boh_pressable.dart';

/// Translucent surface for content floating over photography — hero
/// overlays, sticky summaries.
///
/// Use at most one or two per screen. Blur is costly; set [blur] to false
/// when the card sits in a scrolling list.
class BOHGlassCard extends StatelessWidget {
  const BOHGlassCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(AppSpacing.cardPadding),
    this.borderRadius = AppRadii.largeAll,
    this.blur = true,
    this.onTap,
    this.semanticLabel,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final BorderRadius borderRadius;
  final bool blur;
  final VoidCallback? onTap;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final rim = c.isDark ? const Color(0x3DF7F7F8) : const Color(0xB3FFFFFF);

    Widget card = DecoratedBox(
      // Light catches the top-start edge; the rest of the rim stays dim.
      decoration: BoxDecoration(
        borderRadius: borderRadius,
        gradient: LinearGradient(
          begin: AlignmentDirectional.topStart,
          end: AlignmentDirectional.bottomEnd,
          colors: [rim, c.borderSoft, c.borderSoft],
          stops: const [0, 0.4, 1],
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(AppSizes.hairline),
        child: Container(
          padding: padding,
          decoration: BoxDecoration(
            color: c.glass,
            borderRadius:
                borderRadius -
                const BorderRadius.all(Radius.circular(AppSizes.hairline)),
          ),
          child: child,
        ),
      ),
    );

    if (blur) {
      card = ClipRRect(
        borderRadius: borderRadius,
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
          child: card,
        ),
      );
    }

    if (onTap == null) return card;
    return BOHPressable(
      onTap: onTap,
      semanticLabel: semanticLabel,
      child: card,
    );
  }
}
