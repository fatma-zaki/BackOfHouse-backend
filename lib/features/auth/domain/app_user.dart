import '../../../core/media/app_image.dart';
import '../../companies/domain/company.dart';
import '../../companies/domain/company_membership.dart';
import '../../profile/domain/profile_status.dart';
import 'account_type.dart';

/// The signed-in account.
class AppUser {
  const AppUser({
    required this.id,
    required this.fullName,
    required this.email,
    required this.accountType,
    this.profileStatus,
    this.membership,
    this.phone,
    this.avatar,
    this.headline,
    this.isVerified = false,
  }) : assert(
         (accountType == AccountType.company) == (membership != null),
         'Company accounts, and only they, act through a company membership',
       );

  final String id;

  /// The account holder; for a company, its representative.
  final String fullName;
  final String email;
  final AccountType accountType;

  /// Individuals only.
  final ProfileStatus? profileStatus;

  /// Company accounts only: the company this account acts for, and in
  /// what role. The MVP has one owner per company.
  final CompanyMembership? membership;

  CompanySummary? get company => membership?.company;
  final String? phone;
  final AppImage? avatar;

  /// Short professional line shown under the name, e.g. "Stage Manager".
  final String? headline;

  final bool isVerified;

  bool get isIndividual => accountType == AccountType.individual;

  factory AppUser.fromJson(Map<String, dynamic> json) {
    // `member_type` is the pre-2026-09 field name; its values were
    // professional / company / student / other.
    final legacyType = json['member_type'] as String?;
    final accountType = AccountType.fromWire(
      (json['account_type'] ?? legacyType) as String?,
    );
    final isIndividual = accountType == AccountType.individual;
    final company = json['company'];
    final membership = json['membership'];

    return AppUser(
      id: json['id']?.toString() ?? '',
      fullName: (json['full_name'] ?? json['name'] ?? '') as String,
      email: (json['email'] ?? '') as String,
      accountType: accountType,
      profileStatus: isIndividual
          ? ProfileStatus.fromWire(
              (json['profile_status'] ??
                      (legacyType == 'student' ? 'STUDENT' : null))
                  as String?,
            )
          : null,
      membership: isIndividual
          ? null
          : membership is Map<String, dynamic>
          ? CompanyMembership.fromJson(membership)
          : CompanyMembership(
              company: CompanySummary.fromJson(
                company is Map<String, dynamic> ? company : const {},
              ),
              role: CompanyRole.owner,
            ),
      phone: json['phone'] as String?,
      avatar: AppImage.fromUrl(
        (json['avatar_url'] ?? json['avatar']) as String?,
      ),
      headline: json['headline'] as String?,
      isVerified: json['is_verified'] == true,
    );
  }
}
