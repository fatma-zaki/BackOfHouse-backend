import 'package:flutter/widgets.dart';

import '../../extensions/context_extensions.dart';
import '../layout/boh_section_header.dart';

enum BOHEyebrowLead {
  /// Text only — group labels ("TODAY"), field labels ("DATE").
  none,

  /// A 28×2 violet rule before the text — Welcome ("SAUDI EVENTS…").
  rule,

  /// A small skew bar before the text — "LATEST NEWS".
  skewBar,
}

/// Overline: extra-bold tracked caps in Latin; Arabic is left untracked and
/// in its own case, because both break the joins between Arabic letters.
class BOHEyebrow extends StatelessWidget {
  const BOHEyebrow(
    this.text, {
    super.key,
    this.color,
    this.lead = BOHEyebrowLead.none,
    this.fontSize = 10,
    this.tracking = 1,
    this.showRule = false,
  });

  final String text;

  /// Defaults to muted ink, or violet when there is a [lead].
  final Color? color;
  final BOHEyebrowLead lead;
  final double fontSize;

  /// Latin letter-spacing (the design uses 1, 2 or 3).
  final double tracking;

  /// Legacy alias for [BOHEyebrowLead.rule].
  final bool showRule;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final arabic = context.isArabic;
    final effectiveLead = showRule ? BOHEyebrowLead.rule : lead;
    final ink =
        color ??
        (effectiveLead == BOHEyebrowLead.none
            ? c.textSecondary
            : c.primaryText);

    final label = Text(
      arabic ? text : text.toUpperCase(),
      style: context.text.eyebrow.copyWith(
        color: ink,
        fontSize: fontSize,
        height: 1.4,
        letterSpacing: arabic ? 0 : tracking,
      ),
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
    );

    return switch (effectiveLead) {
      BOHEyebrowLead.none => label,
      BOHEyebrowLead.rule => Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(width: 28, height: 2, color: c.primary),
          const SizedBox(width: 10),
          Flexible(child: label),
        ],
      ),
      BOHEyebrowLead.skewBar => Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          const BOHSkewBar(width: 3, height: 14),
          const SizedBox(width: 8),
          Flexible(child: label),
        ],
      ),
    };
  }
}
