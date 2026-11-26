import 'package:dio/dio.dart';

/// What kind of failure occurred. The UI turns this into localized copy via
/// `AppLocalizations.error`, so this layer never holds user-facing strings.
enum ApiErrorType {
  timeout,
  noConnection,
  badCertificate,
  cancelled,
  badRequest,
  unauthorized,
  forbidden,
  notFound,
  validation,
  tooManyRequests,
  server,
  invalidCredentials,

  /// A one-time sign-in code was wrong or expired.
  invalidCode,
  insufficientPoints,
  unknown,
}

/// A data-layer failure, normalised from whichever source produced it.
class ApiException implements Exception {
  const ApiException({
    required this.type,
    this.statusCode,
    this.serverMessage,
    this.errors = const {},
  });

  final ApiErrorType type;
  final int? statusCode;

  /// Raw message from the backend, for logging. Not localized — do not show.
  final String? serverMessage;

  /// Field-level validation errors keyed by field name.
  final Map<String, List<String>> errors;

  bool get isUnauthorized => type == ApiErrorType.unauthorized;

  factory ApiException.fromDio(DioException e) {
    final status = e.response?.statusCode;

    final type = switch (e.type) {
      DioExceptionType.connectionTimeout ||
      DioExceptionType.sendTimeout ||
      DioExceptionType.receiveTimeout ||
      DioExceptionType.transformTimeout => ApiErrorType.timeout,
      DioExceptionType.connectionError => ApiErrorType.noConnection,
      DioExceptionType.badCertificate => ApiErrorType.badCertificate,
      DioExceptionType.cancel => ApiErrorType.cancelled,
      DioExceptionType.badResponse => _typeFromStatus(status),
      DioExceptionType.unknown => ApiErrorType.unknown,
    };

    return ApiException(
      type: type,
      statusCode: status,
      serverMessage: _messageFromResponse(e.response),
      errors: _errorsFromResponse(e.response),
    );
  }

  static ApiErrorType _typeFromStatus(int? status) => switch (status ?? 0) {
    400 => ApiErrorType.badRequest,
    401 => ApiErrorType.unauthorized,
    403 => ApiErrorType.forbidden,
    404 => ApiErrorType.notFound,
    422 => ApiErrorType.validation,
    429 => ApiErrorType.tooManyRequests,
    >= 500 => ApiErrorType.server,
    _ => ApiErrorType.unknown,
  };

  static String? _messageFromResponse(Response<dynamic>? response) {
    final data = response?.data;
    if (data is! Map) return null;
    for (final key in const ['message', 'error', 'detail']) {
      final value = data[key];
      if (value is String && value.trim().isNotEmpty) return value;
    }
    return null;
  }

  static Map<String, List<String>> _errorsFromResponse(
    Response<dynamic>? response,
  ) {
    final data = response?.data;
    if (data is! Map) return const {};
    final raw = data['errors'];
    if (raw is! Map) return const {};

    return raw.map(
      (key, value) => MapEntry(key.toString(), switch (value) {
        final List<dynamic> list => list.map((e) => e.toString()).toList(),
        _ => [value.toString()],
      }),
    );
  }

  @override
  String toString() => 'ApiException($type, $statusCode): $serverMessage';
}
