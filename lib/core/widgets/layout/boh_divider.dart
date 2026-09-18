import 'package:flutter/widgets.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../extensions/context_extensions.dart';

/// Hairline rule. With a [label] it becomes "——— or ———".
/// With [fade] the ends dissolve, for editorial breaks between sections.
class BOHDivider extends StatelessWidget {
  const BOHDivider({
    super.key,
    this.label,
    this.fade = false,
    this.color,
    this.verticalSpacing = 0,
  });

  final String? label;
  final bool fade;

  /// Defaults to the theme's border colour.
  final Color? color;
  final double verticalSpacing;

  @override
  Widget build(BuildContext context) {
    final line = color ?? context.colors.border;

    Widget rule({bool fadeStart = false, bool fadeEnd = false}) => Container(
      height: AppSizes.hairline,
      decoration: BoxDecoration(
        color: fade ? null : line,
        gradient: fade
            ? LinearGradient(
                begin: AlignmentDirectional.centerStart,
                end: AlignmentDirectional.centerEnd,
                colors: [
                  fadeStart ? AppColors.transparent : line,
                  line,
                  fadeEnd ? AppColors.transparent : line,
                ],
              )
            : null,
      ),
    );

    final Widget child = label == null
        ? rule(fadeStart: true, fadeEnd: true)
        : Row(
            children: [
              Expanded(child: rule(fadeStart: true)),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s16),
                child: Text(label!, style: context.text.body),
              ),
              Expanded(child: rule(fadeEnd: true)),
            ],
          );

    return Padding(
      padding: EdgeInsets.symmetric(vertical: verticalSpacing),
      child: child,
    );
  }
}
