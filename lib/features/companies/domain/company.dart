import 'package:flutter/foundation.dart';

import '../../../core/utils/paginated.dart';
import 'company_capability.dart';
import 'company_project.dart';
import 'company_type.dart';

/// The few company fields shown wherever a company is referenced — on an
/// opportunity, an application, a supplier response or a membership.
@immutable
class CompanySummary {
  const CompanySummary({
    required this.id,
    required this.name,
    required this.type,
    this.verified = false,
    this.capabilities = const {},
  });

  final String id;
  final String name;
  final CompanyType type;

  /// Verification state only. Never implied by type, activity or payment,
  /// and never a prerequisite for the MVP company features.
  final bool verified;
  final Set<CompanyCapability> capabilities;

  bool can(CompanyCapability capability) => capabilities.contains(capability);

  String get initials => companyInitials(name);

  factory CompanySummary.fromJson(Map<String, dynamic> json) {
    final type = CompanyType.fromWire(json['company_type'] as String?);
    final wire = json['capabilities'];
    return CompanySummary(
      id: json['id']?.toString() ?? '',
      name: (json['name'] ?? '') as String,
      type: type,
      verified: json['is_verified'] == true,
      capabilities: wire is List
          ? {for (final c in wire) ?CompanyCapability.fromWire(c as String?)}
          : CompanyCapability.defaultsFor(type),
    );
  }
}

String companyInitials(String name) {
  final words = name.split(RegExp(r'\s+')).where((w) => w.isNotEmpty);
  return words.take(2).map((w) => w.substring(0, 1)).join().toUpperCase();
}

/// A company's public profile — its business identity. Sections evolve
/// independently; portfolio projects are loaded separately.
@immutable
class Company {
  const Company({
    required this.id,
    required this.name,
    required this.type,
    required this.specialization,
    required this.city,
    required this.description,
    required this.services,
    required this.openOpportunities,
    required this.completedProjects,
    this.industries = const [],
    this.contactEmail,
    this.contactPhone,
    this.website,
    this.verified = false,
    this.capabilities = const {},
    this.followed = false,
  });

  final String id;
  final String name;
  final CompanyType type;

  /// e.g. "Staging & Rigging".
  final String specialization;
  final String city;
  final String description;
  final List<String> services;
  final List<String> industries;
  final String? contactEmail;
  final String? contactPhone;
  final String? website;
  final int openOpportunities;

  /// Portfolio size; the projects come from [CompaniesRepository.getProjects].
  final int completedProjects;

  /// Verification state only. Never implied by type, activity or payment.
  final bool verified;
  final Set<CompanyCapability> capabilities;
  final bool followed;

  String get initials => companyInitials(name);

  CompanySummary get summary => CompanySummary(
    id: id,
    name: name,
    type: type,
    verified: verified,
    capabilities: capabilities,
  );

  Company copyWith({bool? followed}) => Company(
    id: id,
    name: name,
    type: type,
    specialization: specialization,
    city: city,
    description: description,
    services: services,
    industries: industries,
    contactEmail: contactEmail,
    contactPhone: contactPhone,
    website: website,
    openOpportunities: openOpportunities,
    completedProjects: completedProjects,
    verified: verified,
    capabilities: capabilities,
    followed: followed ?? this.followed,
  );
}

/// Editable profile fields. Name and type are the company's registered
/// identity and are not edited here.
@immutable
class CompanyProfileDraft {
  const CompanyProfileDraft({
    this.specialization = '',
    this.city = '',
    this.description = '',
    this.services = const [],
    this.industries = const [],
    this.contactEmail = '',
    this.contactPhone = '',
    this.website = '',
  });

  factory CompanyProfileDraft.of(Company c) => CompanyProfileDraft(
    specialization: c.specialization,
    city: c.city,
    description: c.description,
    services: c.services,
    industries: c.industries,
    contactEmail: c.contactEmail ?? '',
    contactPhone: c.contactPhone ?? '',
    website: c.website ?? '',
  );

  final String specialization;
  final String city;
  final String description;
  final List<String> services;
  final List<String> industries;
  final String contactEmail;
  final String contactPhone;
  final String website;

  static const int descriptionMaxLength = 1000;

  List<CompanyProfileIssue> validate() => [
    if (description.trim().length > descriptionMaxLength)
      CompanyProfileIssue.descriptionTooLong,
    if (contactEmail.trim().isNotEmpty &&
        !RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(contactEmail.trim()))
      CompanyProfileIssue.invalidEmail,
  ];
}

enum CompanyProfileIssue { descriptionTooLong, invalidEmail }

/// The public company directory.
abstract interface class CompaniesRepository {
  Future<Paginated<Company>> getCompanies(PageRequest request);

  /// One company's public profile.
  Future<Company> getCompany(String id);

  Future<Company> setFollowing(String id, {required bool following});

  /// Total verified companies, for directory counts.
  Future<int> countVerified();

  /// A company's portfolio, newest first.
  Future<List<CompanyProject>> getProjects(String companyId);
}

/// The signed-in company's own workspace. Every call acts for the company
/// of the current membership and needs the matching permission.
abstract interface class MyCompanyRepository {
  Future<Company> getMyCompany();

  Future<Company> updateProfile(CompanyProfileDraft draft);

  /// Newest first.
  Future<List<CompanyProject>> getMyProjects();

  Future<CompanyProject> addProject(CompanyProjectDraft draft);

  Future<CompanyProject> updateProject(String id, CompanyProjectDraft draft);

  Future<void> deleteProject(String id);
}
