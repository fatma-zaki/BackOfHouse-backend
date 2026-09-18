import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/app_config.dart';
import '../storage/token_storage.dart';
import 'api_exception.dart';
import 'auth_interceptor.dart';

/// Ticks every time the backend rejects our token, so the router can redirect.
class SessionExpiredNotifier extends Notifier<int> {
  @override
  int build() => 0;

  void signal() => state++;
}

final sessionExpiredProvider = NotifierProvider<SessionExpiredNotifier, int>(
  SessionExpiredNotifier.new,
);

final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: AppConfig.connectTimeout,
      receiveTimeout: AppConfig.receiveTimeout,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      // Let the interceptors decide what counts as an error.
      validateStatus: (status) => status != null && status < 400,
    ),
  );

  dio.interceptors.add(
    AuthInterceptor(
      tokenStorage: ref.watch(tokenStorageProvider),
      onUnauthorized: () async {
        ref.read(sessionExpiredProvider.notifier).signal();
      },
    ),
  );

  if (AppConfig.enableNetworkLogging) {
    dio.interceptors.add(
      LogInterceptor(
        requestBody: true,
        responseBody: true,
        requestHeader: false,
        responseHeader: false,
      ),
    );
  }

  ref.onDispose(dio.close);
  return dio;
});

/// Thin wrapper over [Dio] that normalises every failure into [ApiException].
class ApiClient {
  const ApiClient(this._dio);

  final Dio _dio;

  Future<T> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    bool skipAuth = false,
  }) {
    return _send<T>(
      () => _dio.get<T>(
        path,
        queryParameters: queryParameters,
        options: Options(extra: {'skipAuth': skipAuth}),
      ),
    );
  }

  Future<T> post<T>(
    String path, {
    Object? data,
    Map<String, dynamic>? queryParameters,
    bool skipAuth = false,
  }) {
    return _send<T>(
      () => _dio.post<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: Options(extra: {'skipAuth': skipAuth}),
      ),
    );
  }

  Future<T> put<T>(String path, {Object? data}) {
    return _send<T>(() => _dio.put<T>(path, data: data));
  }

  Future<T> patch<T>(String path, {Object? data}) {
    return _send<T>(() => _dio.patch<T>(path, data: data));
  }

  Future<T> delete<T>(String path, {Object? data}) {
    return _send<T>(() => _dio.delete<T>(path, data: data));
  }

  Future<T> _send<T>(Future<Response<T>> Function() request) async {
    try {
      final response = await request();
      return response.data as T;
    } on DioException catch (e) {
      throw ApiException.fromDio(e);
    }
  }
}

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient(ref.watch(dioProvider));
});
