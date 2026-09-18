import 'package:flutter/foundation.dart';

import '../../../core/media/app_image.dart';
import '../../companies/domain/company.dart';
import '../../opportunities/domain/opportunity.dart';
import '../../profile/domain/profile.dart';
import '../../profile/domain/profile_status.dart';

/// The one application lifecycle:
/// submitted → reviewed → shortlisted → contact → decision, where the
/// decision is accepted, rejected or withdrawn.
///
/// The company reviews and decides; Back Of House only connects the two.
enum ApplicationStatus {
  submitted('SUBMITTED'),
  reviewed('REVIEWED'),
  shortlisted('SHORTLISTED'),
  contact('CONTACT'),
  accepted('ACCEPTED'),
  rejected('REJECTED'),
  withdrawn('WITHDRAWN');

  const ApplicationStatus(this.wireValue);

  final String wireValue;

  /// Still with the company; the applicant may withdraw.
  bool get isActive => stage != ApplicationStage.decision;

  ApplicationStage get stage => switch (this) {
    submitted => ApplicationStage.submitted,
    reviewed => ApplicationStage.reviewed,
    shortlisted => ApplicationStage.shortlisted,
    contact => ApplicationStage.contact,
    accepted || rejected || withdrawn => ApplicationStage.decision,
  };

  static ApplicationStatus fromWire(String? value) => values.firstWhere(
    (s) => s.wireValue == value?.toUpperCase(),
    orElse: () => submitted,
  );
}

/// The five steps of the pipeline, in order.
enum ApplicationStage { submitted, reviewed, shortlisted, contact, decision }

/// Who is changing an application's status.
enum ApplicationActor { applicant, company }

/// Rules about applications, shared by the data layer (which enforces them)
/// and screens (which explain them).
abstract final class ApplicationRules {
  /// Status changes each actor may make:
  /// - the company moves one step at a time — submitted → reviewed →
  ///   shortlisted → contact → accepted — and may reject at any active
  ///   step, but cannot jump ahead (e.g. submitted → accepted);
  /// - the applicant may withdraw while the application is active;
  /// - decisions are final: nothing leaves accepted, rejected or withdrawn.
  static Set<ApplicationStatus> nextStatuses(
    ApplicationStatus from,
    ApplicationActor actor,
  ) {
    if (!from.isActive) return const {};
    return switch (actor) {
      ApplicationActor.applicant => {ApplicationStatus.withdrawn},
      ApplicationActor.company => {
        switch (from) {
          ApplicationStatus.submitted => ApplicationStatus.reviewed,
          ApplicationStatus.reviewed => ApplicationStatus.shortlisted,
          ApplicationStatus.shortlisted => ApplicationStatus.contact,
          _ => ApplicationStatus.accepted,
        },
        ApplicationStatus.rejected,
      },
    };
  }

  static bool canTransition(
    ApplicationStatus from,
    ApplicationStatus to,
    ApplicationActor actor,
  ) => nextStatuses(from, actor).contains(to);

  /// The previous application that stops a new one, if any. Active and
  /// decided applications block; only a withdrawn one does not.
  static Application? blockingApplication(Iterable<Application> previous) {
    for (final a in previous) {
      if (a.status != ApplicationStatus.withdrawn) return a;
    }
    return null;
  }

  static bool canApplyAgain(Iterable<Application> previous) =>
      blockingApplication(previous) == null;

  /// Only a change of official status notifies the applicant; edits to
  /// the listing or the application's other fields do not.
  ///
  /// Delivery is the backend's: every company-side status change raises the
  /// applicant's notification server-side. The app never delivers one; the
  /// mock only records the event.
  static bool isNotifiableTransition(
    ApplicationStatus? from,
    ApplicationStatus to,
  ) => from != to;
}

/// Who applied: public profile information only. Captured at submission
/// so later profile edits do not rewrite a submitted application. Private
/// contact details are never part of it.
@immutable
class ApplicantSnapshot {
  const ApplicantSnapshot({
    required this.name,
    required this.headline,
    required this.profileStatus,
    required this.verificationLevel,
    this.city = '',
    this.skills = const [],
    this.avatar,
    this.verified = false,
  });

  final String name;
  final String headline;
  final ProfileStatus profileStatus;
  final int verificationLevel;
  final String city;
  final List<String> skills;
  final AppImage? avatar;
  final bool verified;

  factory ApplicantSnapshot.of(Profile profile) => ApplicantSnapshot(
    name: profile.name,
    headline: profile.headline,
    profileStatus: profile.status,
    verificationLevel: profile.verificationLevel,
    city: profile.city,
    skills: profile.skills,
    avatar: profile.avatar,
    verified: profile.verified,
  );
}

/// Private contact details of an applicant.
@immutable
class ApplicantContact {
  const ApplicantContact({this.email, this.phone});

  final String? email;
  final String? phone;

  bool get isEmpty => email == null && phone == null;
}

/// The applicant's choice of what to share once a company reaches the
/// contact stage. There is no in-app messaging; contact happens outside.
///
/// Privacy-first: nothing is shared unless the individual turns it on in
/// their own profile settings. A company never changes this.
@immutable
class ContactPrivacy {
  const ContactPrivacy({this.shareEmail = false, this.sharePhone = false});

  final bool shareEmail;
  final bool sharePhone;
}

/// Privacy-first applicant visibility for companies.
abstract final class ApplicantPrivacy {
  /// Contact details can be released from the contact stage on — and for
  /// an application accepted after it. Opening an application never
  /// releases them.
  static bool contactUnlocked(ApplicationStatus status) =>
      status == ApplicationStatus.contact ||
      status == ApplicationStatus.accepted;

  /// What a company may see of [contact], or `null` when nothing.
  static ApplicantContact? visibleContact({
    required ApplicationStatus status,
    required ApplicantContact contact,
    required ContactPrivacy privacy,
  }) {
    if (!contactUnlocked(status)) return null;
    final visible = ApplicantContact(
      email: privacy.shareEmail ? contact.email : null,
      phone: privacy.sharePhone ? contact.phone : null,
    );
    return visible.isEmpty ? null : visible;
  }
}

/// An application as the company that owns the listing sees it: public
/// profile, the chosen experience and projects, the message, and contact
/// details only as [ApplicantPrivacy] allows.
@immutable
class ApplicantView {
  const ApplicantView({
    required this.applicationId,
    required this.reference,
    required this.opportunityId,
    required this.opportunityTitle,
    required this.status,
    required this.submittedAt,
    required this.updatedAt,
    required this.applicant,
    this.experience = const [],
    this.projects = const [],
    this.statement,
    this.contact,
  });

  final String applicationId;
  final String reference;
  final String opportunityId;
  final String opportunityTitle;
  final ApplicationStatus status;
  final DateTime submittedAt;
  final DateTime updatedAt;
  final ApplicantSnapshot applicant;
  final List<Experience> experience;
  final List<ProfileProject> projects;
  final String? statement;

  /// `null` before the contact stage or when the applicant shares nothing.
  final ApplicantContact? contact;
}

/// Applicants to the signed-in company's listings. The backend checks the
/// listing belongs to the company, applies [ApplicationRules] for
/// [ApplicationActor.company], and redacts per [ApplicantPrivacy].
abstract interface class ApplicantsRepository {
  /// Most recently updated first.
  Future<List<ApplicantView>> getApplicants(String opportunityId);

  Future<ApplicantView> getApplicant(String applicationId);

  Future<ApplicantView> updateStatus(
    String applicationId,
    ApplicationStatus to,
  );
}

/// An individual's application to an individual-facing opportunity.
///
/// Carries snapshots of the listing and the applicant so the history stays
/// readable if either is later edited or archived.
@immutable
class Application {
  const Application({
    required this.id,
    required this.reference,
    required this.opportunityId,
    required this.opportunityTitle,
    required this.opportunityType,
    required this.company,
    required this.city,
    required this.status,
    required this.submittedAt,
    required this.updatedAt,
    required this.applicant,
    this.employment,
    this.compensation,
    this.statement,
    this.experience = const [],
    this.projects = const [],
  });

  final String id;

  /// Short code shown to the applicant and the company, e.g. "ME-8841".
  final String reference;
  final String opportunityId;
  final String opportunityTitle;
  final OpportunityType opportunityType;
  final CompanySummary company;
  final String city;
  final ApplicationStatus status;
  final DateTime submittedAt;
  final DateTime updatedAt;
  final ApplicantSnapshot applicant;
  final EmploymentType? employment;
  final String? compensation;

  /// Optional note to the company.
  final String? statement;

  /// Experience entries the applicant chose to include.
  final List<Experience> experience;

  /// Portfolio projects the applicant chose to include.
  final List<ProfileProject> projects;
}

/// What the applicant submits. Experience and projects are chosen from the
/// applicant's own profile by id; either list may be empty.
@immutable
class ApplicationDraft {
  const ApplicationDraft({
    required this.opportunityId,
    this.experienceIds = const [],
    this.projectIds = const [],
    this.statement,
  });

  final String opportunityId;
  final List<String> experienceIds;
  final List<String> projectIds;
  final String? statement;

  static const int statementMaxLength = 500;
}

abstract interface class ApplicationsRepository {
  /// The signed-in individual's applications, most recently updated first.
  Future<List<Application>> getMyApplications();

  /// Rejected when the listing is not eligible for this applicant
  /// ([Opportunity.eligibilityFor]), when [ApplicationRules] blocks a new
  /// application, or when the draft references items not on the profile.
  Future<Application> submit(ApplicationDraft draft);

  /// Moves an active application to [ApplicationStatus.withdrawn].
  Future<Application> withdraw(String applicationId);
}
