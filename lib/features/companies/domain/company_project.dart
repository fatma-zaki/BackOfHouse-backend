import 'package:flutter/foundation.dart';

import '../../../core/media/app_image.dart';

/// Work a company has delivered, shown on its profile as portfolio and
/// usable as evidence in supplier responses.
///
/// Not an opportunity and not a job: it describes the past, not an opening.
/// Also not an individual's `ProfileProject`, which is a professional's own
/// work.
@immutable
class CompanyProject {
  const CompanyProject({
    required this.id,
    required this.companyId,
    required this.title,
    required this.description,
    required this.location,
    required this.category,
    required this.startedAt,
    this.endedAt,
    this.services = const [],
    this.images = const [],
    this.clientName,
  });

  final String id;
  final String companyId;
  final String title;
  final String description;
  final String location;

  /// e.g. "Technical Production".
  final String category;
  final DateTime startedAt;

  /// `null` for a single-day project or one still running.
  final DateTime? endedAt;
  final List<String> services;
  final List<AppImage> images;

  /// Optional: some clients are confidential.
  final String? clientName;
}

enum CompanyProjectIssue {
  titleRequired,
  descriptionRequired,
  locationRequired,
  categoryRequired,
  endsBeforeStart,
}

/// What a company submits when adding or editing a project.
@immutable
class CompanyProjectDraft {
  const CompanyProjectDraft({
    required this.title,
    required this.description,
    required this.location,
    required this.category,
    required this.startedAt,
    this.endedAt,
    this.services = const [],
    this.clientName,
  });

  factory CompanyProjectDraft.of(CompanyProject p) => CompanyProjectDraft(
    title: p.title,
    description: p.description,
    location: p.location,
    category: p.category,
    startedAt: p.startedAt,
    endedAt: p.endedAt,
    services: p.services,
    clientName: p.clientName,
  );

  final String title;
  final String description;
  final String location;
  final String category;
  final DateTime startedAt;
  final DateTime? endedAt;
  final List<String> services;
  final String? clientName;

  List<CompanyProjectIssue> validate() => [
    if (title.trim().isEmpty) CompanyProjectIssue.titleRequired,
    if (description.trim().isEmpty) CompanyProjectIssue.descriptionRequired,
    if (location.trim().isEmpty) CompanyProjectIssue.locationRequired,
    if (category.trim().isEmpty) CompanyProjectIssue.categoryRequired,
    if (endedAt != null && endedAt!.isBefore(startedAt))
      CompanyProjectIssue.endsBeforeStart,
  ];
}
