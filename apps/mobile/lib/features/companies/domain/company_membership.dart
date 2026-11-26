import 'package:flutter/foundation.dart';

import 'company.dart';

/// A person's role within a company. The MVP has one owner per company;
/// members with delegated permissions come later as new roles here.
enum CompanyRole {
  owner('OWNER');

  const CompanyRole(this.wireValue);

  final String wireValue;

  static CompanyRole fromWire(String? value) => values.firstWhere(
    (r) => r.wireValue == value?.toUpperCase(),
    orElse: () => owner,
  );

  Set<CompanyPermission> get permissions => switch (this) {
    owner => CompanyPermission.values.toSet(),
  };
}

/// What a member may do for their company. Screens and data sources ask
/// for a permission, never for a role, so adding members later does not
/// touch them.
enum CompanyPermission {
  editProfile,
  manageProjects,
  manageOpportunities,
  reviewApplicants,
  respondToSupplierRequests,
}

/// The link between a signed-in account and the company it acts for.
@immutable
class CompanyMembership {
  const CompanyMembership({required this.company, required this.role});

  final CompanySummary company;
  final CompanyRole role;

  bool can(CompanyPermission permission) =>
      role.permissions.contains(permission);

  factory CompanyMembership.fromJson(Map<String, dynamic> json) {
    final company = json['company'];
    return CompanyMembership(
      company: CompanySummary.fromJson(
        company is Map<String, dynamic> ? company : json,
      ),
      role: CompanyRole.fromWire(json['role'] as String?),
    );
  }
}
