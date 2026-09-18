import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_spacing.dart';
import '../../constants/app_constants.dart';
import '../../extensions/context_extensions.dart';
import '../../utils/paginated.dart';
import '../buttons/boh_button.dart';
import '../feedback/boh_state_views.dart';

/// Lazily built infinite list for a [PagedNotifier]'s state.
///
/// Handles first load (skeleton), errors, empty results, fetching the next
/// page as the user nears the end, and a retry footer if that fails.
class BOHPagedSliverList<T> extends StatelessWidget {
  const BOHPagedSliverList({
    super.key,
    required this.state,
    required this.itemBuilder,
    required this.onLoadMore,
    required this.onRetry,
    this.skeleton,
    this.emptyIcon,
    this.emptyTitle,
    this.emptyMessage,
    this.spacing = AppSpacing.s12,
  });

  final AsyncValue<PagedState<T>> state;
  final Widget Function(BuildContext context, T item, int index) itemBuilder;
  final VoidCallback onLoadMore;
  final VoidCallback onRetry;

  /// Shown while the first page loads; defaults to a spinner.
  final Widget? skeleton;
  final IconData? emptyIcon;
  final String? emptyTitle;
  final String? emptyMessage;
  final double spacing;

  @override
  Widget build(BuildContext context) {
    final data = state.value;

    if (data == null) {
      if (state.hasError) {
        return SliverFillRemaining(
          hasScrollBody: false,
          child: BOHErrorState(error: state.error, onRetry: onRetry),
        );
      }
      return SliverToBoxAdapter(
        child:
            skeleton ?? const SizedBox(height: 240, child: BOHLoadingState()),
      );
    }

    if (data.items.isEmpty) {
      return SliverFillRemaining(
        hasScrollBody: false,
        child: emptyIcon == null
            ? BOHEmptyState(title: emptyTitle, message: emptyMessage)
            : BOHEmptyState(
                icon: emptyIcon!,
                title: emptyTitle,
                message: emptyMessage,
              ),
      );
    }

    final count = data.items.length;
    return SliverList.builder(
      itemCount: count + 1,
      itemBuilder: (context, index) {
        if (index == count) return _Footer(state: data, onLoadMore: onLoadMore);

        final nearEnd = index >= count - AppConstants.loadMoreThreshold;
        if (nearEnd &&
            data.hasMore &&
            !data.isLoadingMore &&
            data.loadMoreError == null) {
          WidgetsBinding.instance.addPostFrameCallback((_) => onLoadMore());
        }
        return Padding(
          padding: EdgeInsets.only(bottom: spacing),
          child: itemBuilder(context, data.items[index], index),
        );
      },
    );
  }
}

class _Footer<T> extends StatelessWidget {
  const _Footer({required this.state, required this.onLoadMore});

  final PagedState<T> state;
  final VoidCallback onLoadMore;

  @override
  Widget build(BuildContext context) {
    if (state.loadMoreError != null) {
      return Center(
        child: BOHButton(
          label: context.l10n.actionRetry,
          variant: BOHButtonVariant.text,
          onPressed: onLoadMore,
        ),
      );
    }
    if (state.isLoadingMore) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: AppSpacing.s16),
        child: Center(
          child: SizedBox.square(
            dimension: 22,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: context.colors.primary,
              semanticsLabel: context.l10n.stateLoading,
            ),
          ),
        ),
      );
    }
    return const SizedBox.shrink();
  }
}
