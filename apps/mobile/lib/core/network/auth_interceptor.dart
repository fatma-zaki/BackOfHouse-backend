import 'package:dio/dio.dart';

import '../storage/token_storage.dart';

/// Attaches the bearer token to outgoing requests and signals the app when the
/// backend rejects it, so the router can bounce the user back to sign in.
class AuthInterceptor extends Interceptor {
  AuthInterceptor({required this.tokenStorage, required this.onUnauthorized});

  final TokenStorage tokenStorage;

  /// Invoked on a 401 so the caller can clear session state.
  final Future<void> Function() onUnauthorized;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    // Endpoints that mint tokens must not carry a stale one.
    final skipAuth = options.extra['skipAuth'] == true;
    if (!skipAuth) {
      final token = await tokenStorage.readAccessToken();
      if (token != null && token.isNotEmpty) {
        options.headers['Authorization'] = 'Bearer $token';
      }
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    if (err.response?.statusCode == 401) {
      await tokenStorage.clear();
      await onUnauthorized();
    }
    handler.next(err);
  }
}
