import 'package:flutter/material.dart';

import '../../../app/theme/app_spacing.dart';
import '../../extensions/context_extensions.dart';

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
