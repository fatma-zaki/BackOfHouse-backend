import '../domain/account_details.dart';
import '../domain/app_user.dart';

/// Tokens and user returned by a successful sign in or sign up.
class AuthSession {
  const AuthSession({
    required this.user,
    required this.accessToken,
    this.refreshToken,
  });

  final AppUser user;
  final String accessToken;
  final String? refreshToken;
}

/// Raw auth transport. Implemented by the API client and by the mock.
abstract interface class AuthDataSource {
  Future<AuthSession> login({
    required String email,
    required String password,
    required bool rememberMe,
  });

  Future<AuthSession> register({
    required String fullName,
    required String email,
    required String phone,
    required String password,
    required AccountDetails account,
  });

  /// The user owning the current access token.
  Future<AppUser> currentUser();

  Future<void> requestPasswordReset(String email);

  Future<void> logout();
}
