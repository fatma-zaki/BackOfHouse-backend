import '../../features/auth/domain/account_type.dart';
import 'app_routes.dart';

/// Where the session stands, as far as routing is concerned.
enum SessionStatus {
  /// Stored session not yet checked (app start).
  restoring,
  authenticated,
  unauthenticated,
}

/// Pure redirect rules, kept free of Flutter and Riverpod so they can be
/// unit tested exhaustively.
///
/// A signed-out user who opens a deep link (e.g. `/news/42`) is sent to
/// `/auth?from=/news/42` and returned there after signing in.
///
/// Signed in, each account type stays in its own area: individuals never
/// see company screens, and a company sees only its workspace plus the
/// shared Discover and News tabs. A tab root that exists for both accounts
/// (Home, Profile) resolves to the signed-in account's own version.
abstract final class AuthGuard {
  static String? redirect({
    required SessionStatus status,
    required Uri uri,
    AccountType accountType = AccountType.individual,
    bool developerRoutesEnabled = false,
  }) {
    final path = uri.path;
    final from = _safeFrom(uri.queryParameters[AppRoutes.fromParam]);

    if (path == AppRoutes.designSystem) {
      return developerRoutesEnabled ? null : AppRoutes.home;
    }

    switch (status) {
      case SessionStatus.restoring:
        if (path == AppRoutes.splash) return null;
        return _withFrom(AppRoutes.splash, _locationOf(uri));

      case SessionStatus.authenticated:
        final home = AppRoutes.homeFor(accountType);
        if (path == AppRoutes.splash || AppRoutes.public.contains(path)) {
          final target = from == null ? null : Uri.parse(from).path;
          return target != null && AppRoutes.allows(accountType, target)
              ? from
              : home;
        }
        if (!AppRoutes.allows(accountType, path)) {
          return AppRoutes.counterpartFor(accountType, path) ?? home;
        }
        return null;

      case SessionStatus.unauthenticated:
        if (AppRoutes.public.contains(path)) return null;
        if (path == AppRoutes.splash) return _withFrom(AppRoutes.auth, from);
        return _withFrom(AppRoutes.auth, _locationOf(uri));
    }
  }

  static String _locationOf(Uri uri) =>
      uri.hasQuery ? '${uri.path}?${uri.query}' : uri.path;

  static String _withFrom(String path, String? from) {
    final safe = _safeFrom(from);
    if (safe == null) return path;
    return Uri(
      path: path,
      queryParameters: {AppRoutes.fromParam: safe},
    ).toString();
  }

  /// Only in-app, non-gate locations are honoured — never an absolute URL.
  static String? _safeFrom(String? from) {
    if (from == null || from.isEmpty) return null;
    if (!from.startsWith('/') || from.startsWith('//')) return null;
    final path = Uri.tryParse(from)?.path;
    if (path == null ||
        path == AppRoutes.splash ||
        path == AppRoutes.home ||
        path == AppRoutes.companyHome ||
        AppRoutes.public.contains(path)) {
      return null;
    }
    return from;
  }
}
