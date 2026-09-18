import 'package:flutter/widgets.dart';

import '../../../app/theme/app_spacing.dart';

/// Horizontal row of equal-height cards.
///
/// Height comes from the tallest card rather than a fixed value, so larger
/// text or longer translations grow the row instead of clipping it. Meant
/// for short, curated rows (a handful of items), not infinite lists.
class BOHCarousel extends StatelessWidget {
  const BOHCarousel({
    super.key,
    required this.children,
    this.itemWidthFactor = 0.66,
    this.maxItemWidth = 260,
    this.padding = const EdgeInsets.symmetric(
      horizontal: AppSpacing.screenHorizontal,
    ),
  });

  final List<Widget> children;

  /// Card width as a fraction of the screen, so the next card peeks in.
  final double itemWidthFactor;
  final double maxItemWidth;
  final EdgeInsetsGeometry padding;

  @override
  Widget build(BuildContext context) {
    final screen = MediaQuery.sizeOf(context).width;
    final width = (screen * itemWidthFactor).clamp(0.0, maxItemWidth);

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      padding: padding,
      clipBehavior: Clip.none,
      child: IntrinsicHeight(
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            for (final (i, child) in children.indexed) ...[
              if (i > 0) const SizedBox(width: AppSpacing.s12),
              SizedBox(width: width, child: child),
            ],
          ],
        ),
      ),
    );
  }
}
