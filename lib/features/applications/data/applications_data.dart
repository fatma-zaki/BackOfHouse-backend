import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/data/mock_support.dart';
import '../../../core/network/api_exception.dart';
import '../../auth/domain/account_type.dart';
import '../../auth/presentation/controllers/auth_controller.dart';
import '../../notifications/data/notifications_data.dart';
import '../../opportunities/data/opportunities_data.dart';
import '../../opportunities/domain/opportunity.dart';
import '../../profile/data/profile_data.dart';
import '../../profile/domain/profile.dart';
import '../domain/application.dart';

abstract interface class ApplicationsDataSource {
  Future<List<Application>> getMyApplications();
  Future<Application> submit(ApplicationDraft draft);
  Future<Application> withdraw(String applicationId);
}

class ApplicationsRepositoryImpl implements ApplicationsRepository {
  const ApplicationsRepositoryImpl(this._source);

  final ApplicationsDataSource _source;

  @override
  Future<List<Application>> getMyApplications() => _source.getMyApplications();

  @override
  Future<Application> submit(ApplicationDraft draft) => _source.submit(draft);

  @override
  Future<Application> withdraw(String applicationId) =>
      _source.withdraw(applicationId);
}

/// Enforces the backend's rules in memory, using the same domain rules the
/// screens use to explain them:
/// - eligibility: [Opportunity.eligibilityFor];
/// - history: [ApplicationRules];
/// - selected experience and projects must be on the applicant's profile.
class ApplicationsMockDataSource implements ApplicationsDataSource {
  ApplicationsMockDataSource({
    required this.latency,
    required this.applicant,
    required this.findOpportunity,
    required this.profile,
    this.onStatusChanged,
  });

  final Duration latency;
  final Applicant Function() applicant;

  /// Resolves a listing as the signed-in account sees it.
  final Future<Opportunity> Function(String id) findOpportunity;

  /// The signed-in individual's profile.
  final Future<Profile> Function() profile;

  /// Raised on every official status change, as the backend would notify.
  final void Function(ApplicationStatus? from, Application application)?
  onStatusChanged;

  List<_Record>? _records;

  Future<void> _wait() => Future<void>.delayed(latency);

  void _requireIndividual() {
    if (applicant().accountType != AccountType.individual) {
      throw const ApiException(type: ApiErrorType.forbidden, statusCode: 403);
    }
  }

  Future<List<_Record>> _all() async {
    if (_records case final records?) return records;
    final p = await profile();
    final snapshot = ApplicantSnapshot.of(p);
    return _records = [
      for (final seed in _seeds)
        _Record(
          id: seed.id,
          reference: seed.reference,
          opportunityId: seed.opportunityId,
          status: seed.status,
          submittedAt: DateTime.now().subtract(seed.submittedAgo),
          updatedAt: DateTime.now().subtract(seed.updatedAgo),
          applicant: snapshot,
          experience: p.experience.take(1).toList(),
          projects: p.projects.take(1).toList(),
        ),
    ];
  }

  Future<Application> _build(_Record r) async {
    final o = await findOpportunity(r.opportunityId);
    return Application(
      id: r.id,
      reference: r.reference,
      opportunityId: o.id,
      opportunityTitle: o.title,
      opportunityType: o.type,
      company: o.company,
      city: o.city,
      employment: o.employment,
      compensation: o.compensation,
      status: r.status,
      submittedAt: r.submittedAt,
      updatedAt: r.updatedAt,
      applicant: r.applicant,
      statement: r.statement,
      experience: r.experience,
      projects: r.projects,
    );
  }

  @override
  Future<List<Application>> getMyApplications() async {
    await _wait();
    _requireIndividual();
    final sorted = [...await _all()]
      ..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
    return [for (final r in sorted) await _build(r)];
  }

  @override
  Future<Application> submit(ApplicationDraft draft) async {
    await _wait();
    _requireIndividual();
    // Not found for company-facing types such as supplier requests.
    final opportunity = await findOpportunity(draft.opportunityId);
    if (!opportunity.eligibilityFor(applicant()).isEligible) {
      throw const ApiException(type: ApiErrorType.forbidden, statusCode: 403);
    }

    final records = await _all();
    final previous = [
      for (final r in records)
        if (r.opportunityId == draft.opportunityId) await _build(r),
    ];
    final p = await profile();
    final experience = _pick(p.experience, (e) => e.id, draft.experienceIds);
    final projects = _pick(p.projects, (e) => e.id, draft.projectIds);
    final statement = draft.statement?.trim();
    if (!ApplicationRules.canApplyAgain(previous) ||
        experience == null ||
        projects == null ||
        (statement?.length ?? 0) > ApplicationDraft.statementMaxLength) {
      throw const ApiException(type: ApiErrorType.validation, statusCode: 422);
    }

    final now = DateTime.now();
    final record = _Record(
      id: 'app-${now.microsecondsSinceEpoch}',
      reference:
          '${opportunity.company.initials}-${1000 + now.millisecondsSinceEpoch % 9000}',
      opportunityId: opportunity.id,
      status: ApplicationStatus.submitted,
      submittedAt: now,
      updatedAt: now,
      applicant: ApplicantSnapshot.of(p),
      statement: statement == null || statement.isEmpty ? null : statement,
      experience: experience,
      projects: projects,
    );
    records.add(record);
    final created = await _build(record);
    onStatusChanged?.call(null, created);
    return created;
  }

  @override
  Future<Application> withdraw(String applicationId) async {
    await _wait();
    _requireIndividual();
    final match = (await _all()).where((r) => r.id == applicationId);
    if (match.isEmpty) {
      throw const ApiException(type: ApiErrorType.notFound, statusCode: 404);
    }
    final record = match.first;
    final from = record.status;
    if (!ApplicationRules.canTransition(
      from,
      ApplicationStatus.withdrawn,
      ApplicationActor.applicant,
    )) {
      throw const ApiException(type: ApiErrorType.validation, statusCode: 422);
    }
    record
      ..status = ApplicationStatus.withdrawn
      ..updatedAt = DateTime.now();
    final updated = await _build(record);
    onStatusChanged?.call(from, updated);
    return updated;
  }

  /// The profile items named by [ids], in profile order; `null` if any id
  /// is not on the profile.
  static List<T>? _pick<T>(
    List<T> items,
    String Function(T) idOf,
    List<String> ids,
  ) {
    final known = {for (final i in items) idOf(i)};
    if (!ids.every(known.contains)) return null;
    return [
      for (final i in items)
        if (ids.contains(idOf(i))) i,
    ];
  }
}

/// TODO(api): select an `ApplicationsRemoteDataSource` when
/// `AppConfig.useMockData` is false.
final applicationsDataSourceProvider = Provider<ApplicationsDataSource>((ref) {
  final notifications = ref.watch(notificationsMockProvider);
  return ApplicationsMockDataSource(
    latency: ref.watch(mockLatencyProvider),
    applicant: () {
      final user = ref.read(authControllerProvider).value;
      return (
        accountType: user?.accountType ?? AccountType.individual,
        profileStatus: user?.profileStatus,
      );
    },
    findOpportunity: (id) =>
        ref.read(opportunitiesRepositoryProvider).getOpportunity(id),
    profile: () => ref.read(myProfileProvider.future),
    onStatusChanged: (from, application) => notifications
        .recordApplicationStatus(from: from, application: application),
  );
});

final applicationsRepositoryProvider = Provider<ApplicationsRepository>(
  (ref) =>
      ApplicationsRepositoryImpl(ref.watch(applicationsDataSourceProvider)),
);

class _Record {
  _Record({
    required this.id,
    required this.reference,
    required this.opportunityId,
    required this.status,
    required this.submittedAt,
    required this.updatedAt,
    required this.applicant,
    this.statement,
    this.experience = const [],
    this.projects = const [],
  });

  final String id;
  final String reference;
  final String opportunityId;
  ApplicationStatus status;
  final DateTime submittedAt;
  DateTime updatedAt;
  final ApplicantSnapshot applicant;
  final String? statement;
  final List<Experience> experience;
  final List<ProfileProject> projects;
}

class _Seed {
  const _Seed(
    this.id,
    this.reference,
    this.opportunityId,
    this.status,
    this.submittedAgo,
    this.updatedAgo,
  );

  final String id;
  final String reference;
  final String opportunityId;
  final ApplicationStatus status;
  final Duration submittedAgo;
  final Duration updatedAgo;
}

const _seeds = [
  _Seed(
    'app-midan',
    'ME-8841',
    'midan-tech-lead',
    ApplicationStatus.shortlisted,
    Duration(days: 1, hours: 20),
    Duration(minutes: 12),
  ),
  _Seed(
    'app-nexa',
    'NP-4092',
    'nexa-staging-supervisor',
    ApplicationStatus.reviewed,
    Duration(hours: 20),
    Duration(hours: 6),
  ),
  _Seed(
    'app-sela',
    'SE-2210',
    'sela-production-director',
    ApplicationStatus.rejected,
    Duration(days: 50),
    Duration(days: 20),
  ),
  _Seed(
    'app-benchmark',
    'BA-3318',
    'benchmark-ops-lead',
    ApplicationStatus.withdrawn,
    Duration(days: 2, hours: 12),
    Duration(days: 1),
  ),
];
