import 'package:flutter/foundation.dart';

import '../../companies/domain/company_type.dart';
import '../../profile/domain/profile_status.dart';
import 'account_type.dart';

/// The account-specific part of sign up. Each account type carries only
/// the fields that apply to it.
@immutable
sealed class AccountDetails {
  const AccountDetails();

  AccountType get accountType;

  Map<String, Object?> toJson();
}

final class IndividualAccountDetails extends AccountDetails {
  const IndividualAccountDetails({
    this.profileStatus = ProfileStatus.professional,
  });

  final ProfileStatus profileStatus;

  @override
  AccountType get accountType => AccountType.individual;

  @override
  Map<String, Object?> toJson() => {
    'account_type': accountType.wireValue,
    'profile_status': profileStatus.wireValue,
  };
}

final class CompanyAccountDetails extends AccountDetails {
  const CompanyAccountDetails({
    required this.companyName,
    required this.companyType,
  });

  final String companyName;
  final CompanyType companyType;

  @override
  AccountType get accountType => AccountType.company;

  @override
  Map<String, Object?> toJson() => {
    'account_type': accountType.wireValue,
    'company': {
      'name': companyName.trim(),
      'company_type': companyType.wireValue,
    },
  };
}
