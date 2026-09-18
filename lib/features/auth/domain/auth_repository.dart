import 'account_details.dart';
import 'app_user.dart';

/// Session operations as the app sees them. Implementations decide where the
/// data comes from; callers cannot tell a mock from the API.
abstract interface class AuthRepository {
  /// The current user, or `null` when there is no usable session.
  Future<AppUser?> restoreSession();

  Future<AppUser> login({
    required String email,
    required String password,
    bool rememberMe = true,
  });

  Future<AppUser> register({
    required String fullName,
    required String email,
    required String phone,
    required String password,
    required AccountDetails account,
  });

  Future<void> requestPasswordReset(String email);

  Future<void> logout();
}
