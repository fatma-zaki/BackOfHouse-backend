import 'package:flutter/foundation.dart';

import '../../../core/media/app_image.dart';
import '../../../core/utils/paginated.dart';

enum Availability { available, inProduction, fullyBooked }

/// The broad field a professional works in, for directory filters.
enum ProfessionalField { production, design, technical, other }

/// Directory filter chips: a field, or students.
enum ProfessionalFilter { producers, designers, technical, students }

typedef ProfessionalsQuery = ({ProfessionalFilter? filter, String query});

@immutable
class Professional {
  const Professional({
    required this.id,
    required this.name,
    required this.role,
    required this.company,
    required this.city,
    required this.yearsExperience,
    required this.skills,
    required this.matchScore,
    required this.availability,
    this.avatar,
    this.verified = false,
    this.connected = false,
    this.field = ProfessionalField.other,
    this.student = false,
    this.highlighted = false,
  });

  final String id;
  final String name;
  final String role;
  final String company;
  final String city;
  final int yearsExperience;
  final List<String> skills;

  /// Fit with the signed-in member's credentials, 0–100.
  final int matchScore;
  final Availability availability;
  final AppImage? avatar;
  final bool verified;

  /// Connection request sent or accepted.
  final bool connected;

  final ProfessionalField field;

  /// An individual with student status (not an account type).
  final bool student;

  /// A Profile Highlight bought with points is active. A rewards benefit:
  /// never verification, never paid placement.
  final bool highlighted;

  Professional copyWith({bool? connected}) => Professional(
    id: id,
    name: name,
    role: role,
    company: company,
    city: city,
    yearsExperience: yearsExperience,
    skills: skills,
    matchScore: matchScore,
    availability: availability,
    avatar: avatar,
    verified: verified,
    connected: connected ?? this.connected,
    field: field,
    student: student,
    highlighted: highlighted,
  );
}

abstract interface class ProfessionalsRepository {
  /// Highlighted members first (a points reward), then the rest.
  Future<Paginated<Professional>> getProfessionals(
    PageRequest request, {
    ProfessionalsQuery query = (filter: null, query: ''),
  });

  Future<Professional> setConnected(String id, {required bool connected});

  Future<int> countVerified();
}
