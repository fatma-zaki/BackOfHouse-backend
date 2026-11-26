import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../constants/app_constants.dart';

/// Page request passed from a controller down to a repository.
@immutable
class PageRequest {
  const PageRequest({this.page = 1, this.pageSize = AppConstants.pageSize});

  /// 1-based page index.
  final int page;
  final int pageSize;

  PageRequest get next => PageRequest(page: page + 1, pageSize: pageSize);
}

/// One page of results as returned by a repository.
@immutable
class Paginated<T> {
  const Paginated({
    required this.items,
    required this.page,
    required this.hasMore,
  });

  const Paginated.empty() : items = const [], page = 0, hasMore = false;

  final List<T> items;
  final int page;
  final bool hasMore;

  /// Slices [all] into the page described by [request]. Used by mocks.
  factory Paginated.slice(List<T> all, PageRequest request) {
    final start = (request.page - 1) * request.pageSize;
    final end = (start + request.pageSize).clamp(0, all.length);
    return Paginated(
      items: start >= all.length ? const [] : all.sublist(start, end),
      page: request.page,
      hasMore: end < all.length,
    );
  }
}

/// What an infinite list renders: the items so far plus footer state.
@immutable
class PagedState<T> {
  const PagedState({
    required this.items,
    required this.page,
    required this.hasMore,
    this.isLoadingMore = false,
    this.loadMoreError,
  });

  factory PagedState.fromPage(Paginated<T> page) =>
      PagedState(items: page.items, page: page.page, hasMore: page.hasMore);

  final List<T> items;
  final int page;
  final bool hasMore;
  final bool isLoadingMore;

  /// Failure of the latest "load more"; the loaded items stay visible.
  final Object? loadMoreError;

  PagedState<T> copyWith({
    List<T>? items,
    bool? isLoadingMore,
    Object? loadMoreError,
    bool clearError = false,
  }) => PagedState(
    items: items ?? this.items,
    page: page,
    hasMore: hasMore,
    isLoadingMore: isLoadingMore ?? this.isLoadingMore,
    loadMoreError: clearError ? null : (loadMoreError ?? this.loadMoreError),
  );
}

/// Base controller for infinite lists: first page on build, [loadMore] for
/// the rest, [refresh] for pull-to-refresh.
///
/// Subclasses implement [fetchPage] and watch their dependencies in
/// [watchDependencies] so a change (e.g. content language) reloads page 1.
abstract class PagedNotifier<T> extends AsyncNotifier<PagedState<T>> {
  Future<Paginated<T>> fetchPage(PageRequest request);

  /// Called at the start of every build. Watch providers here.
  void watchDependencies() {}

  @override
  Future<PagedState<T>> build() async {
    watchDependencies();
    return PagedState.fromPage(await fetchPage(const PageRequest()));
  }

  Future<void> loadMore() async {
    final current = state.value;
    if (current == null ||
        state.isLoading ||
        !current.hasMore ||
        current.isLoadingMore) {
      return;
    }

    state = AsyncData(current.copyWith(isLoadingMore: true, clearError: true));
    try {
      final next = await fetchPage(PageRequest(page: current.page + 1));
      state = AsyncData(
        PagedState(
          items: [...current.items, ...next.items],
          page: next.page,
          hasMore: next.hasMore,
        ),
      );
    } catch (error) {
      state = AsyncData(
        current.copyWith(isLoadingMore: false, loadMoreError: error),
      );
    }
  }

  Future<void> refresh() async {
    ref.invalidateSelf();
    await future;
  }

  /// Replaces matching items in place — for optimistic updates such as likes.
  void updateWhere(bool Function(T item) test, T Function(T item) update) {
    final current = state.value;
    if (current == null) return;
    state = AsyncData(
      current.copyWith(
        items: [
          for (final item in current.items) test(item) ? update(item) : item,
        ],
      ),
    );
  }
}
