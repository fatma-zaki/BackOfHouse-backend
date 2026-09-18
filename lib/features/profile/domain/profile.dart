import 'package:flutter/foundation.dart';

import '../../../core/media/app_image.dart';
import 'profile_status.dart';

@immutable
class Experience {
  const Experience({
    required this.id,
    required this.role,
    required this.company,
    required this.start,
    this.end,
  });

  final String id;
  final String role;
  final String company;
  final DateTime start;

  /// `null` while the role is current.
  final DateTime? end;

  bool get isCurrent => end == null;
}

@immutable
/// A project on an individual's portfolio. (Company portfolios use
/// `CompanyProject`.)
class ProfileProject {
  const ProfileProject({
    required this.id,
    required this.year,
    required this.category,
    required this.title,
    required this.role,
    this.image,
  });

  final String id;
  final int year;
  final String category;
  final String title;

  /// e.g. "Lead Producer · 120k attendees".
  final String role;
  final AppImage? image;
}

@immutable
class ProfileBadge {
  const ProfileBadge({
    required this.title,
    required this.issuer,
    this.premium = false,
  });

  final String title;
  final String issuer;

  /// Gold treatment — formal certifications and honours.
  final bool premium;
}

@immutable
class Profile {
  const Profile({
    required this.name,
    required this.headline,
    required this.company,
    required this.city,
    required this.industry,
    required this.about,
    required this.experience,
    required this.skills,
    required this.visibilityScore,
    required this.verificationLevel,
    required this.availability,
    required this.projects,
    required this.badges,
    required this.yearsExperience,
    required this.attendancePoints,
    required this.eventsAttended,
    this.status = ProfileStatus.professional,
    this.avatar,
    this.verified = false,
  });

  final String name;
  final String headline;
  final String company;
  final String city;
  final String industry;
  final String about;
  final List<Experience> experience;
  final List<String> skills;

  /// Profile completeness and engagement, 0–100.
  final int visibilityScore;

  /// Verification state only; points and paid visibility never change it.
  final int verificationLevel;
  final ProfileStatus status;

  /// e.g. "Available for Q3/Q4 cultural projects".
  final String availability;
  final List<ProfileProject> projects;
  final List<ProfileBadge> badges;
  final int yearsExperience;

  /// Points from verified check-ins at accredited events.
  final int attendancePoints;
  final int eventsAttended;
  final AppImage? avatar;
  final bool verified;

  /// First name, for greetings.
  String get firstName => name.trim().split(RegExp(r'\s+')).first;
}

abstract interface class ProfileRepository {
  Future<Profile> getMyProfile();
}
