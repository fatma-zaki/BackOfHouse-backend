import '../../../core/network/api_client.dart';
import '../../../core/network/api_endpoints.dart';
import '../domain/account_details.dart';
import '../domain/app_user.dart';
import 'auth_data_source.dart';

/// Auth over the REST API.
class AuthRemoteDataSource implements AuthDataSource {
  const AuthRemoteDataSource(this._api);

  final ApiClient _api;

  @override
  Future<AuthSession> login({
    required String email,
    required String password,
    required bool rememberMe,
  }) async {
    final data = await _api.post<Map<String, dynamic>>(
      ApiEndpoints.login,
      skipAuth: true,
      data: {
        'email': email.trim(),
        'password': password,
        'remember_me': rememberMe,
      },
    );
    return _parseSession(data);
  }

  @override
  Future<AuthSession> register({
    required String fullName,
    required String email,
    required String phone,
    required String password,
    required AccountDetails account,
  }) async {
    final data = await _api.post<Map<String, dynamic>>(
      ApiEndpoints.register,
      skipAuth: true,
      data: {
        'full_name': fullName.trim(),
        'email': email.trim(),
        'phone': phone.trim(),
        'password': password,
        ...account.toJson(),
      },
    );
    return _parseSession(data);
  }

  @override
  Future<AppUser> currentUser() async {
    final data = await _api.get<Map<String, dynamic>>(ApiEndpoints.me);
    return AppUser.fromJson(_unwrapUser(data));
  }

  @override
  Future<void> requestPasswordReset(String email) {
    return _api.post<dynamic>(
      ApiEndpoints.forgotPassword,
      skipAuth: true,
      data: {'email': email.trim()},
    );
  }

  @override
  Future<void> logout() => _api.post<dynamic>(ApiEndpoints.logout);

  AuthSession _parseSession(Map<String, dynamic> data) {
    final payload = data['data'] is Map<String, dynamic>
        ? data['data'] as Map<String, dynamic>
        : data;

    return AuthSession(
      user: AppUser.fromJson(_unwrapUser(payload)),
      accessToken:
          ((payload['access_token'] ?? payload['token']) as String?) ?? '',
      refreshToken: payload['refresh_token'] as String?,
    );
  }

  /// Backends differ on whether the user sits at the root or under `user`/`data`.
  Map<String, dynamic> _unwrapUser(Map<String, dynamic> payload) {
    for (final key in const ['user', 'data']) {
      final nested = payload[key];
      if (nested is Map<String, dynamic>) return nested;
    }
    return payload;
  }
}
