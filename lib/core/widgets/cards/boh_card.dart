import 'package:flutter/widgets.dart';

import '../../../app/theme/app_motion.dart';
import '../../../app/theme/app_radii.dart';
import '../../../app/theme/app_shadows.dart';
import '../../../app/theme/app_spacing.dart';
import '../../extensions/context_extensions.dart';
import '../motion/boh_pressable.dart';

/// Content surface: white with a hairline and soft lift in light mode, a
/// bordered panel in dark mode.
class BOHCard extends StatelessWidget {
  const BOHCard({
    super.key,
    required this.child,
    this.padding = const EdgeInsets.all(AppSpacing.cardPadding),
    this.borderRadius = AppRadii.mediumAll,
    this.color,
    this.onTap,
    this.semanticLabel,
  });

  final Widget child;
  final EdgeInsetsGeometry padding;
  final BorderRadius borderRadius;

  /// Defaults to the theme surface.
  final Color? color;
  final VoidCallback? onTap;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;

    Widget surface(bool pressed) => AnimatedContainer(
      duration: AppMotion.fast,
      curve: AppMotion.standard,
      padding: padding,
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: pressed ? c.surfaceElevated : (color ?? c.surface),
        borderRadius: borderRadius,
        border: Border.all(color: pressed ? c.border : c.borderSoft),
        boxShadow: AppShadows.card(c),
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
