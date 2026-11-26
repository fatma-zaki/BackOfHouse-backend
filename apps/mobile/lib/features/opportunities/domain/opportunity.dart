import 'package:flutter/foundation.dart';

import '../../../core/utils/paginated.dart';
import '../../auth/domain/account_type.dart';
import '../../companies/domain/company.dart';
import '../../companies/domain/company_capability.dart';
import '../../companies/domain/company_type.dart';
import '../../profile/domain/profile_status.dart';

/// Who is asking to apply: the account type, and for individuals their
/// profile status.
typedef Applicant = ({AccountType accountType, ProfileStatus? profileStatus});

/// Why an applicant may or may not apply to a listing, most fundamental
/// reason first. Screens show a message per reason; they never re-derive it.
enum ApplicationEligibility {
  eligible,

  /// Company-facing type such as a supplier request.
  companyFacing,

  /// The applicant is a company account.
  individualsOnly,

  /// Not published, or past its closing date.
  closed,

  /// Co-op training is for individuals with student status.
  studentsOnly;

  bool get isEligible => this == eligible;
}

/// Who an opportunity is published for.
enum OpportunityAudience {
  individual,
  company;

  static OpportunityAudience of(AccountType account) => switch (account) {
    AccountType.individual => individual,
    AccountType.company => company,
  };
}

/// One model for every kind of opening; content and actions vary by type.
enum OpportunityType {
  job('JOB', OpportunityAudience.individual),
  project('PROJECT', OpportunityAudience.individual),
  coOp('CO_OP', OpportunityAudience.individual),
  volunteering('VOLUNTEERING', OpportunityAudience.individual),

  /// B2B: a buyer company asks supplier companies to respond. Never shown
  /// to individuals and never answered with an individual application.
  supplierRequest('SUPPLIER_REQUEST', OpportunityAudience.company);

  const OpportunityType(this.wireValue, this.audience);

  final String wireValue;
  final OpportunityAudience audience;

  /// Types an account of [audience] can browse, in display order.
  static List<OpportunityType> visibleTo(OpportunityAudience audience) =>
      values.where((t) => t.audience == audience).toList();

  static OpportunityType fromWire(String? value) => values.firstWhere(
    (t) => t.wireValue == value?.toUpperCase(),
    orElse: () => job,
  );
}

/// Contract terms of a [OpportunityType.job].
enum EmploymentType {
  fullTime('FULL_TIME'),
  partTime('PART_TIME'),
  contract('CONTRACT'),
  freelance('FREELANCE');

  const EmploymentType(this.wireValue);

  final String wireValue;

  static EmploymentType? fromWire(String? value) {
    for (final t in values) {
      if (t.wireValue == value?.toUpperCase()) return t;
    }
    return null;
  }
}

/// Publishing lifecycle. See [OpportunityLifecycle] for who may move it.
enum OpportunityStatus {
  draft('DRAFT'),
  inReview('IN_REVIEW'),

  /// Back Of House reviewed it and asked for changes; see
  /// [Opportunity.reviewerNote].
  changesRequested('CHANGES_REQUESTED'),
  published('PUBLISHED'),
  paused('PAUSED'),
  closed('CLOSED'),
  archived('ARCHIVED');

  const OpportunityStatus(this.wireValue);

  final String wireValue;

  static OpportunityStatus fromWire(String? value) => values.firstWhere(
    (s) => s.wireValue == value?.toUpperCase(),
    orElse: () => closed,
  );
}

/// Where the work happens (approved 2026-09-28).
enum WorkSetup {
  onSite('ON_SITE'),
  hybrid('HYBRID'),
  remote('REMOTE');

  const WorkSetup(this.wireValue);
  final String wireValue;

  static WorkSetup? fromWire(String? value) =>
      values.where((w) => w.wireValue == value).firstOrNull;
}

@immutable
class Opportunity {
  const Opportunity({
    required this.id,
    required this.type,
    required this.status,
    required this.title,
    required this.company,
    required this.city,
    required this.summary,
    required this.postedAt,
    required this.applicants,
    this.employment,
    this.compensation,
    this.duration,
    this.closesAt,
    this.workSetup,
    this.description = '',
    this.responsibilities = const [],
    this.requirements = const [],
    this.skills = const [],
    this.matchScore,
    this.matchReasons = const [],
    this.supplierTypes = const [],
    this.reviewerNote,
    this.revision,
  });

  final String id;
  final OpportunityType type;
  final OpportunityStatus status;
  final String title;
  final CompanySummary company;
  final String city;

  /// One line for cards.
  final String summary;
  final DateTime postedAt;

  /// Applications (individual types) or responses (supplier requests).
  final int applicants;

  /// Jobs only.
  final EmploymentType? employment;

  /// Display string from the API, e.g. "SAR 28k – 34k / mo". Volunteering
  /// and some co-op programmes have none.
  final String? compensation;

  /// e.g. "4 months". Projects, co-op and volunteering.
  final String? duration;

  /// Applications close at the end of this day, when set.
  final DateTime? closesAt;

  /// On-site, hybrid or remote, when the company says.
  final WorkSetup? workSetup;
  final String description;
  final List<String> responsibilities;
  final List<String> requirements;
  final List<String> skills;

  /// Fit with the signed-in individual's profile, 0–100, computed by the
  /// backend. `null` when no matching rule applies; the app never invents
  /// one.
  final int? matchScore;
  final List<String> matchReasons;

  /// Supplier requests only: the company types invited to respond.
  final List<CompanyType> supplierTypes;

  /// What Back Of House asked the company to change, when the status is
  /// [OpportunityStatus.changesRequested].
  final String? reviewerNote;

  /// A pending update to this published listing, if any.
  final OpportunityRevision? revision;

  bool isOpenAt(DateTime now) =>
      status == OpportunityStatus.published &&
      (closesAt == null || closesAt!.isAfter(now));

  /// The single eligibility rule for individual applications:
  /// - supplier requests never accept one;
  /// - companies never apply as individuals;
  /// - the listing must be open;
  /// - co-op training requires student status.
  ///
  /// Previous applications to the same listing are checked separately by
  /// `ApplicationRules`.
  ApplicationEligibility eligibilityFor(Applicant applicant, {DateTime? now}) {
    if (type.audience != OpportunityAudience.individual) {
      return ApplicationEligibility.companyFacing;
    }
    if (applicant.accountType != AccountType.individual) {
      return ApplicationEligibility.individualsOnly;
    }
    if (!isOpenAt(now ?? DateTime.now())) return ApplicationEligibility.closed;
    if (type == OpportunityType.coOp &&
        applicant.profileStatus != ProfileStatus.student) {
      return ApplicationEligibility.studentsOnly;
    }
    return ApplicationEligibility.eligible;
  }
}

/// Who is changing an opportunity's status.
enum OpportunityActor { company, backOfHouse }

/// Every company-created opportunity starts as a draft and is reviewed by
/// Back Of House before it is published — whether or not the company is
/// verified. Verification and listing review are separate.
///
/// A review that does not pass moves the listing to
/// [OpportunityStatus.changesRequested] with a note; it never drops back to
/// draft on its own. Published listings are never edited in place: the
/// company proposes a revision, the live content stays up, and the revision
/// goes through the same review (see [OpportunityRevision]).
abstract final class OpportunityLifecycle {
  static const OpportunityStatus initial = OpportunityStatus.draft;

  static const _transitions = {
    OpportunityActor.company: {
      OpportunityStatus.draft: {OpportunityStatus.inReview},
      OpportunityStatus.changesRequested: {OpportunityStatus.inReview},
      // Pull a submission back out of review to change it.
      OpportunityStatus.inReview: {OpportunityStatus.draft},
      OpportunityStatus.published: {OpportunityStatus.closed},
    },
    OpportunityActor.backOfHouse: {
      OpportunityStatus.inReview: {
        OpportunityStatus.published,
        OpportunityStatus.changesRequested,
      },
    },
  };

  static bool canTransition(
    OpportunityStatus from,
    OpportunityStatus to,
    OpportunityActor actor,
  ) => _transitions[actor]?[from]?.contains(to) ?? false;

  /// Content is edited only before it is public: a draft, or a listing the
  /// reviewer sent back. Published content changes through a revision.
  static bool isEditable(OpportunityStatus status) =>
      status == OpportunityStatus.draft ||
      status == OpportunityStatus.changesRequested;

  /// Closed is final in the MVP: there is no reopening.
  static bool isFinal(OpportunityStatus status) =>
      status == OpportunityStatus.closed ||
      status == OpportunityStatus.archived;

  /// Whether a published listing may start a revision.
  static bool canStartRevision(Opportunity o) =>
      o.status == OpportunityStatus.published && o.revision == null;
}

/// A proposed update to a published listing, in review of its own. The
/// published content stays live until Back Of House approves it.
@immutable
class OpportunityRevision {
  const OpportunityRevision({
    required this.status,
    required this.draft,
    this.reviewerNote,
  });

  /// [OpportunityStatus.draft], [OpportunityStatus.inReview] or
  /// [OpportunityStatus.changesRequested].
  final OpportunityStatus status;
  final OpportunityDraft draft;
  final String? reviewerNote;
}

enum OpportunityDraftIssue {
  typeNotAllowed,
  titleRequired,
  cityRequired,
  summaryRequired,
  descriptionRequired,

  /// A closing date must be in the future.
  closesInPast,
  employmentRequired,
  supplierTypesRequired,
}

/// What a company writes when creating or editing an opportunity.
@immutable
class OpportunityDraft {
  const OpportunityDraft({
    required this.type,
    this.title = '',
    this.city = '',
    this.summary = '',
    this.description = '',
    this.employment,
    this.compensation = '',
    this.duration = '',
    this.responsibilities = const [],
    this.requirements = const [],
    this.skills = const [],
    this.supplierTypes = const [],
    this.closesAt,
    this.workSetup,
  });

  factory OpportunityDraft.of(Opportunity o) => OpportunityDraft(
    type: o.type,
    title: o.title,
    city: o.city,
    summary: o.summary,
    description: o.description,
    employment: o.employment,
    compensation: o.compensation ?? '',
    duration: o.duration ?? '',
    responsibilities: o.responsibilities,
    requirements: o.requirements,
    skills: o.skills,
    supplierTypes: o.supplierTypes,
    closesAt: o.closesAt,
    workSetup: o.workSetup,
  );

  final OpportunityType type;
  final String title;
  final String city;
  final String summary;
  final String description;
  final EmploymentType? employment;
  final String compensation;
  final String duration;
  final List<String> responsibilities;
  final List<String> requirements;
  final List<String> skills;
  final List<CompanyType> supplierTypes;

  /// Optional closing date (applications or responses stop after it).
  final DateTime? closesAt;

  /// Optional work setup; not used by supplier requests.
  final WorkSetup? workSetup;

  /// Types [company] may create: every individual-facing type, plus
  /// supplier requests with the capability.
  static List<OpportunityType> typesFor(CompanySummary company) => [
    for (final t in OpportunityType.values)
      if (t != OpportunityType.supplierRequest ||
          company.can(CompanyCapability.createSupplierRequest))
        t,
  ];

  List<OpportunityDraftIssue> validate(
    CompanySummary company, {
    DateTime? now,
  }) => [
    if (!typesFor(company).contains(type)) OpportunityDraftIssue.typeNotAllowed,
    if (title.trim().isEmpty) OpportunityDraftIssue.titleRequired,
    if (city.trim().isEmpty) OpportunityDraftIssue.cityRequired,
    if (summary.trim().isEmpty) OpportunityDraftIssue.summaryRequired,
    if (description.trim().isEmpty) OpportunityDraftIssue.descriptionRequired,
    if (type == OpportunityType.job && employment == null)
      OpportunityDraftIssue.employmentRequired,
    if (type == OpportunityType.supplierRequest && supplierTypes.isEmpty)
      OpportunityDraftIssue.supplierTypesRequired,
    if (closesAt != null && !closesAt!.isAfter(now ?? DateTime.now()))
      OpportunityDraftIssue.closesInPast,
  ];
}

typedef OpportunitiesQuery = ({OpportunityType? type, String query});

/// Results are scoped to the signed-in account: individuals never receive
/// company-facing types, whatever the query asks for.
abstract interface class OpportunitiesRepository {
  /// Best match first.
  Future<Paginated<Opportunity>> getOpportunities(
    OpportunitiesQuery query,
    PageRequest request,
  );

  Future<Opportunity> getOpportunity(String id);

  /// One company's published listings visible to the signed-in account,
  /// newest first — for its public profile.
  Future<List<Opportunity>> getByCompany(String companyId);

  /// Open opportunities visible to the signed-in account.
  Future<int> countActive();
}

/// The signed-in company's own listings, in every status. The backend
/// applies [OpportunityLifecycle] and [OpportunityDraft.validate].
abstract interface class CompanyOpportunitiesRepository {
  /// Most recently updated first.
  Future<List<Opportunity>> getMyOpportunities();

  Future<Opportunity> getMyOpportunity(String id);

  /// Creates a [OpportunityLifecycle.initial] draft.
  Future<Opportunity> createDraft(OpportunityDraft draft);

  /// Drafts only.
  Future<Opportunity> updateDraft(String id, OpportunityDraft draft);

  /// Draft or changes-requested → in review.
  Future<Opportunity> submitForReview(String id);

  /// In review → draft.
  Future<Opportunity> returnToDraft(String id);

  /// Published → closed. Closing is final.
  Future<Opportunity> close(String id);

  /// Starts a revision of a published listing, copied from the live
  /// content. The published version stays live.
  Future<Opportunity> startRevision(String id);

  Future<Opportunity> updateRevision(String id, OpportunityDraft draft);

  /// Sends the revision for review; the live content is untouched until it
  /// is approved.
  Future<Opportunity> submitRevisionForReview(String id);
}
