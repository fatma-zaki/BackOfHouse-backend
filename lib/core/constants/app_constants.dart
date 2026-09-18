abstract final class AppConstants {
  /// Items requested per page for every paginated list.
  static const int pageSize = 20;

  /// Start fetching the next page when this many items remain below the fold.
  static const int loadMoreThreshold = 5;
}
