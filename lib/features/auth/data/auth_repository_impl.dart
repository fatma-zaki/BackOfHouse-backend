import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/config/app_config.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/token_storage.dart';
import '../domain/account_details.dart';
import '../domain/app_user.dart';
import '../domain/auth_repository.dart';
import 'auth_data_source.dart';
import 'auth_mock_data_source.dart';
import 'auth_remote_data_source.dart';

/// Owns token persistence; delegates transport to an [AuthDataSource].
class AuthRepositoryImpl implements AuthRepository {
  const AuthRepositoryImpl(this._source, this._tokens);

  final AuthDataSource _source;
  final TokenStorage _tokens;

  @override
  Future<AppUser?> restoreSession() async {
    final token = await _tokens.readAccessToken();
    if (token == null || token.isEmpty) return null;
    return _source.currentUser();
  }

  @override
  Future<AppUser> login({
    required String email,
    required String password,
    bool rememberMe = true,
  }) async {
    final session = await _source.login(
      email: email,
      password: password,
      rememberMe: rememberMe,
    );
    return _persist(session);
  }

  @override
  Future<AppUser> register({
    required String fullName,
    required String email,
    required String phone,
    required String password,
    required AccountDetails account,
  }) async {
    final session = await _source.register(
      fullName: fullName,
      email: email,
      phone: phone,
      password: password,
      account: account,
    );
    return _persist(session);
  }

  @override
  Future<void> requestPasswordReset(String email) =>
      _source.requestPasswordReset(email);

  @override
  Future<void> requestPhoneCode(String phone) =>
      _source.requestPhoneCode(phone);

  @override
  Future<AppUser> verifyPhoneCode({
    required String phone,
    required String code,
  }) async {
    final session = await _source.verifyPhoneCode(phone: phone, code: code);
    return _persist(session);
  }

  @override
  Future<void> logout() async {
    try {
      await _source.logout();
    } finally {
      // Local sign-out must succeed even if the server call fails.
      await _tokens.clear();
    }
  }

  Future<AppUser> _persist(AuthSession session) async {
    if (session.accessToken.isNotEmpty) {
      await _tokens.saveTokens(
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      );
    }
    return session.user;
  }
}

final authDataSourceProvider = Provider<AuthDataSource>((ref) {
  if (AppConfig.useMockData) return AuthMockDataSource();
  return AuthRemoteDataSource(ref.watch(apiClientProvider));
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepositoryImpl(
    ref.watch(authDataSourceProvider),
    ref.watch(tokenStorageProvider),
  );
});
