import 'package:flutter/widgets.dart';

import '../../../app/theme/app_spacing.dart';
import '../../extensions/context_extensions.dart';

/// Editorial overline — "WELCOME TO".
///
/// Latin text is uppercased and tracked out; Arabic is left untracked
/// because letter-spacing breaks the joins between Arabic letters.
class BOHEyebrow extends StatelessWidget {
  const BOHEyebrow(
    this.text, {
    super.key,
    this.color,
    this.showRule = false,
    this.ruleLength = AppSpacing.s48,
  });

  final String text;

  /// Defaults to the secondary ink.
  final Color? color;
  final bool showRule;
  final double ruleLength;

  @override
  Widget build(BuildContext context) {
    final arabic = context.isArabic;
    final ink = color ?? context.colors.textSecondary;
    final style = context.text.eyebrow.copyWith(
      color: ink,
      letterSpacing: arabic ? 0 : null,
    );

    final label = Text(
      arabic ? text : text.toUpperCase(),
      style: style,
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
    );

    if (!showRule) return label;

    return Row(
      children: [
        Flexible(child: label),
        const SizedBox(width: AppSpacing.s12),
        Container(
          width: ruleLength,
          height: AppSizes.hairline,
          color: ink.withValues(alpha: 0.6),
        ),
      ],
    );
  }
}
