import 'package:flutter/foundation.dart';

import '../../../core/media/app_image.dart';
import '../../../core/utils/paginated.dart';

enum Availability { available, inProduction, fullyBooked }

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
  );
}

abstract interface class ProfessionalsRepository {
  Future<Paginated<Professional>> getProfessionals(PageRequest request);

  Future<Professional> setConnected(String id, {required bool connected});

  Future<int> countVerified();
}
