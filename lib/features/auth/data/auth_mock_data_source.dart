import '../../../core/network/api_exception.dart';
import '../../companies/domain/company.dart';
import '../../companies/domain/company_capability.dart';
import '../../companies/domain/company_membership.dart';
import '../../profile/domain/profile_status.dart';
import '../domain/account_details.dart';
import '../domain/account_type.dart';
import '../domain/app_user.dart';
import 'auth_data_source.dart';

/// In-memory auth for building and demoing the app before the backend exists.
///
/// Any well-formed email signs in; the password `wrongpass1` is rejected so
/// the error path can be exercised.
class AuthMockDataSource implements AuthDataSource {
  AuthMockDataSource({this.latency = const Duration(milliseconds: 600)});

  final Duration latency;

  static const rejectedPassword = 'wrongpass1';

  AppUser? _user;

  @override
  Future<AuthSession> login({
    required String email,
    required String password,
    required bool rememberMe,
  }) async {
    await Future<void>.delayed(latency);
    if (password == rejectedPassword) {
      throw const ApiException(
        type: ApiErrorType.invalidCredentials,
        statusCode: 401,
      );
    }
    return _session(
      _user ??
          AppUser(
            id: 'mock-1',
            fullName: 'Sara Al-Qahtani',
            email: email.trim(),
            accountType: AccountType.individual,
            profileStatus: ProfileStatus.professional,
            headline: 'Production Manager',
            isVerified: true,
          ),
    );
  }

  @override
  Future<AuthSession> register({
    required String fullName,
    required String email,
    required String phone,
    required String password,
    required AccountDetails account,
  }) async {
    await Future<void>.delayed(latency);
    return _session(
      AppUser(
        id: 'mock-${email.hashCode}',
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        accountType: account.accountType,
        profileStatus: switch (account) {
          IndividualAccountDetails(:final profileStatus) => profileStatus,
          CompanyAccountDetails() => null,
        },
        membership: switch (account) {
          IndividualAccountDetails() => null,
          // The registering account owns the new company. It starts
          // unverified; verification is a separate review, never granted at
          // sign up and not required to use company features.
          CompanyAccountDetails(:final companyName, :final companyType) =>
            CompanyMembership(
              company: CompanySummary(
                id: 'mock-company-${email.hashCode}',
                name: companyName.trim(),
                type: companyType,
                capabilities: CompanyCapability.defaultsFor(companyType),
              ),
              role: CompanyRole.owner,
            ),
        },
      ),
    );
  }

  @override
  Future<AppUser> currentUser() async {
    await Future<void>.delayed(latency ~/ 2);
    return _user ??
        const AppUser(
          id: 'mock-1',
          fullName: 'Sara Al-Qahtani',
          email: 'sara@backofhouse.space',
          accountType: AccountType.individual,
          profileStatus: ProfileStatus.professional,
          headline: 'Production Manager',
          isVerified: true,
        );
  }

  @override
  Future<void> requestPasswordReset(String email) =>
      Future<void>.delayed(latency);

  @override
  Future<void> logout() async {
    _user = null;
  }

  AuthSession _session(AppUser user) {
    _user = user;
    return AuthSession(user: user, accessToken: 'mock-token-${user.id}');
  }
}
