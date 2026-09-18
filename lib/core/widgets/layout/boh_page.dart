import 'package:flutter/material.dart';

import '../../../app/theme/app_spacing.dart';
import '../../extensions/context_extensions.dart';

/// Page title block of tab roots and directories:
///
///     • ECOSYSTEM DIRECTORY
///     Discover                         ( ● Live Feed )
///     Supporting line…
class BOHPageHeader extends StatelessWidget {
  const BOHPageHeader({
    super.key,
    required this.title,
    this.eyebrow,
    this.subtitle,
    this.trailing,
  });

  final String title;

  /// Small primary overline with a leading dot.
  final String? eyebrow;
  final String? subtitle;

  /// Usually a [BOHTag] or status chip, aligned with the title.
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final arabic = context.isArabic;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (eyebrow != null) ...[
          Row(
            children: [
              Container(
                width: 6,
                height: 6,
                decoration: BoxDecoration(
                  color: c.primary,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: AppSpacing.s8),
              Flexible(
                child: Text(
                  arabic ? eyebrow! : eyebrow!.toUpperCase(),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: context.text.eyebrow.copyWith(
                    color: c.primaryText,
                    letterSpacing: arabic ? 0 : null,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.s4),
        ],
        Row(
          children: [
            Expanded(
              child: Semantics(
                header: true,
                child: Text(title, style: context.text.h1),
              ),
            ),
            if (trailing != null) ...[
              const SizedBox(width: AppSpacing.s12),
              trailing!,
            ],
          ],
        ),
        if (subtitle != null) ...[
          const SizedBox(height: AppSpacing.s4),
          Text(subtitle!, style: context.text.body),
        ],
      ],
    );
  }
}

/// Pull-to-refresh in brand colours.
class BOHRefresh extends StatelessWidget {
  const BOHRefresh({super.key, required this.onRefresh, required this.child});

  final Future<void> Function() onRefresh;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: onRefresh,
      color: context.colors.primary,
      backgroundColor: context.colors.surface,
      child: child,
    );
  }
}

/// Screen-edge padding for slivers.
class BOHSliverPadding extends StatelessWidget {
  const BOHSliverPadding({super.key, required this.sliver, this.top = 0});

  final Widget sliver;
  final double top;

  @override
  Widget build(BuildContext context) {
    return SliverPadding(
      padding: EdgeInsetsDirectional.only(
        start: AppSpacing.screenHorizontal,
        end: AppSpacing.screenHorizontal,
        top: top,
      ),
      sliver: sliver,
    );
  }
}

/// Clears the floating navigation and the home indicator at the end of a
/// scroll view.
class BOHSliverBottomSpacer extends StatelessWidget {
  const BOHSliverBottomSpacer({super.key});

  @override
  Widget build(BuildContext context) {
    return SliverToBoxAdapter(
      child: SizedBox(
        height: MediaQuery.paddingOf(context).bottom + AppSpacing.s24,
      ),
    );
  }
}

/// Opens a modal sheet with the design system's shape and padding.
Future<T?> showBOHSheet<T>(
  BuildContext context, {
  required WidgetBuilder builder,
}) {
  return showModalBottomSheet<T>(
    context: context,
    isScrollControlled: true,
    useSafeArea: true,
    builder: (context) => Padding(
      padding: EdgeInsetsDirectional.only(
        start: AppSpacing.screenHorizontal,
        end: AppSpacing.screenHorizontal,
        bottom: MediaQuery.viewInsetsOf(context).bottom + AppSpacing.s24,
      ),
      child: builder(context),
    ),
  );
}
