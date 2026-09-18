import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/router/auth_guard.dart';
import '../../../../core/network/api_exception.dart';
import '../../data/auth_repository_impl.dart';
import '../../domain/account_details.dart';
import '../../domain/account_type.dart';
import '../../domain/app_user.dart';

/// Owns the session. `null` data means "signed out".
class AuthController extends AsyncNotifier<AppUser?> {
  @override
  Future<AppUser?> build() async {
    // Failing to restore (offline, expired token) must not wedge the app in
    // an error state — the user simply starts signed out.
    try {
      return await ref.watch(authRepositoryProvider).restoreSession();
    } on ApiException catch (e) {
      debugPrint('Session restore failed: $e');
      return null;
    }
  }

  Future<void> login({
    required String email,
    required String password,
    bool rememberMe = true,
  }) async {
    // Riverpod carries the previous value into the loading state, so the
    // router sees a submit in flight rather than a session restore.
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref
          .read(authRepositoryProvider)
          .login(email: email, password: password, rememberMe: rememberMe),
    );
  }

  Future<void> register({
    required String fullName,
    required String email,
    required String phone,
    required String password,
    required AccountDetails account,
  }) async {
    // Riverpod carries the previous value into the loading state, so the
    // router sees a submit in flight rather than a session restore.
    state = const AsyncLoading();
    state = await AsyncValue.guard(
      () => ref
          .read(authRepositoryProvider)
          .register(
            fullName: fullName,
            email: email,
            phone: phone,
            password: password,
            account: account,
          ),
    );
  }

  Future<void> logout() async {
    await ref.read(authRepositoryProvider).logout();
    state = const AsyncData(null);
  }
}

final authControllerProvider = AsyncNotifierProvider<AuthController, AppUser?>(
  AuthController.new,
);

/// Session state reduced to what the router needs. Rebuilds only when the
/// status actually changes, not on every loading tick of a form submit.
/// The signed-in account's type, for routing. Individual while signed out.
final sessionAccountTypeProvider = Provider<AccountType>(
  (ref) => ref.watch(
    authControllerProvider.select(
      (s) => s.value?.accountType ?? AccountType.individual,
    ),
  ),
);

final sessionStatusProvider = Provider<SessionStatus>((ref) {
  final auth = ref.watch(authControllerProvider);
  if (!auth.hasValue && auth.isLoading) return SessionStatus.restoring;
  return auth.value != null
      ? SessionStatus.authenticated
      : SessionStatus.unauthenticated;
});
