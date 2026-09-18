import 'package:flutter/widgets.dart';

import '../../extensions/context_extensions.dart';

/// Headline with one highlighted phrase: "Back of House **Community.**"
///
/// Pass the sentence in up to three localized parts so translators control
/// where the accent falls — word order differs between English and Arabic.
class BOHAccentText extends StatelessWidget {
  const BOHAccentText({
    super.key,
    this.lead = '',
    required this.accent,
    this.trail = '',
    this.style,
    this.maxLines,
    this.textAlign,
  });

  final String lead;
  final String accent;
  final String trail;

  /// Defaults to Display. Use at H2 or larger: the accent colour is tuned
  /// for headline sizes.
  final TextStyle? style;
  final int? maxLines;
  final TextAlign? textAlign;

  @override
  Widget build(BuildContext context) {
    return Text.rich(
      TextSpan(
        style: style ?? context.text.display,
        children: [
          if (lead.isNotEmpty) TextSpan(text: lead),
          TextSpan(
            text: accent,
            style: TextStyle(color: context.colors.headlineAccent),
          ),
          if (trail.isNotEmpty) TextSpan(text: trail),
        ],
      ),
      maxLines: maxLines,
      overflow: maxLines == null ? null : TextOverflow.ellipsis,
      textAlign: textAlign,
    );
  }
}
