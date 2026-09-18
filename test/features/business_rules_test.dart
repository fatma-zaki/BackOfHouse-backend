import 'package:backofhouse/core/network/api_exception.dart';
import 'package:backofhouse/core/utils/paginated.dart';
import 'package:backofhouse/features/applications/data/applications_data.dart';
import 'package:backofhouse/features/applications/domain/application.dart';
import 'package:backofhouse/features/auth/domain/account_details.dart';
import 'package:backofhouse/features/auth/domain/account_type.dart';
import 'package:backofhouse/features/auth/domain/app_user.dart';
import 'package:backofhouse/features/companies/domain/company.dart';
import 'package:backofhouse/features/companies/domain/company_type.dart';
import 'package:backofhouse/features/notifications/data/notifications_data.dart';
import 'package:backofhouse/features/opportunities/data/opportunities_data.dart';
import 'package:backofhouse/features/opportunities/domain/opportunity.dart';
import 'package:backofhouse/features/profile/domain/profile.dart';
import 'package:backofhouse/features/profile/domain/profile_status.dart';
import 'package:flutter_test/flutter_test.dart';

const Applicant _professional = (
  accountType: AccountType.individual,
  profileStatus: ProfileStatus.professional,
);
const Applicant _student = (
  accountType: AccountType.individual,
  profileStatus: ProfileStatus.student,
);
const Applicant _company = (
  accountType: AccountType.company,
  profileStatus: null,
);

const _companyRef = CompanySummary(
  id: 'c1',
  name: 'Co',
  type: CompanyType.production,
);

Opportunity _opportunity({
  OpportunityType type = OpportunityType.job,
  OpportunityStatus status = OpportunityStatus.published,
  DateTime? closesAt,
}) => Opportunity(
  id: 'o1',
  type: type,
  status: status,
  title: 'Role',
  company: _companyRef,
  city: 'Riyadh',
  summary: '',
  postedAt: DateTime(2026),
  applicants: 0,
  closesAt: closesAt,
);

Application _application(ApplicationStatus status) => Application(
  id: 'a-${status.name}',
  reference: 'CO-1',
  opportunityId: 'o1',
  opportunityTitle: 'Role',
  opportunityType: OpportunityType.job,
  company: _companyRef,
  city: 'Riyadh',
  status: status,
  submittedAt: DateTime(2026),
  updatedAt: DateTime(2026),
  applicant: const ApplicantSnapshot(
    name: 'Sara',
    headline: 'Producer',
    profileStatus: ProfileStatus.professional,
    verificationLevel: 1,
  ),
);

final _profile = Profile(
  name: 'Sara Al-Qahtani',
  headline: 'Production Manager',
  company: 'Midan',
  city: 'Riyadh',
  industry: 'Events',
  about: '',
  experience: [
    Experience(
      id: 'exp-1',
      role: 'Producer',
      company: 'Midan',
      start: DateTime(2022),
    ),
  ],
  skills: const [],
  visibilityScore: 80,
  verificationLevel: 2,
  availability: '',
  projects: const [
    ProfileProject(
      id: 'proj-1',
      year: 2024,
      category: 'Staging',
      title: 'Pavilion',
      role: 'Lead',
    ),
    ProfileProject(
      id: 'proj-2',
      year: 2023,
      category: 'Gala',
      title: 'Opening',
      role: 'Technical lead',
    ),
  ],
  badges: const [],
  yearsExperience: 5,
  attendancePoints: 0,
  eventsAttended: 0,
);

OpportunitiesMockDataSource _opportunities(AccountType account) =>
    OpportunitiesMockDataSource(
      language: () => 'en',
      latency: Duration.zero,
      audience: () => OpportunityAudience.of(account),
    );

({ApplicationsMockDataSource source, NotificationsMockDataSource inbox})
_applications([Applicant applicant = _professional]) {
  final inbox = NotificationsMockDataSource(
    language: () => 'en',
    latency: Duration.zero,
  );
  final source = ApplicationsMockDataSource(
    latency: Duration.zero,
    applicant: () => applicant,
    findOpportunity: _opportunities(applicant.accountType).getOpportunity,
    profile: () async => _profile,
    onStatusChanged: (from, application) =>
        inbox.recordApplicationStatus(from: from, application: application),
  );
  return (source: source, inbox: inbox);
}

Matcher _apiError(ApiErrorType type) =>
    throwsA(isA<ApiException>().having((e) => e.type, 'type', type));

void main() {
  group('account types', () {
    test('only individual and company exist', () {
      expect(AccountType.values, [AccountType.individual, AccountType.company]);
    });

    test('legacy member types parse as individuals', () {
      for (final legacy in ['professional', 'student', 'other', null]) {
        expect(AccountType.fromWire(legacy), AccountType.individual);
      }
      expect(AccountType.fromWire('company'), AccountType.company);
      expect(AccountType.fromWire('COMPANY'), AccountType.company);
    });

    test('a legacy student becomes an individual with student status', () {
      final user = AppUser.fromJson({
        'id': 1,
        'email': 'a@b.sa',
        'member_type': 'student',
      });
      expect(user.accountType, AccountType.individual);
      expect(user.profileStatus, ProfileStatus.student);
      expect(user.company, isNull);
    });

    test('company accounts carry their company and no profile status', () {
      final user = AppUser.fromJson({
        'id': 2,
        'email': 'ops@co.sa',
        'account_type': 'COMPANY',
        'profile_status': 'STUDENT',
        'company': {'id': 'c9', 'name': 'Co', 'company_type': 'SUPPLIER'},
      });
      expect(user.accountType, AccountType.company);
      expect(user.profileStatus, isNull);
      expect(user.company?.type, CompanyType.supplier);
      expect(user.company?.verified, isFalse);
    });

    test('sign-up payloads carry only the fields for their type', () {
      expect(
        const IndividualAccountDetails(profileStatus: ProfileStatus.student)
            .toJson(),
        {'account_type': 'INDIVIDUAL', 'profile_status': 'STUDENT'},
      );
      expect(
        const CompanyAccountDetails(
          companyName: ' Midan ',
          companyType: CompanyType.eventOrganizer,
        ).toJson(),
        {
          'account_type': 'COMPANY',
          'company': {'name': 'Midan', 'company_type': 'EVENT_ORGANIZER'},
        },
      );
    });
  });

  group('opportunity eligibility', () {
    test('supplier requests are the only company-facing type', () {
      expect(OpportunityType.visibleTo(OpportunityAudience.company), [
        OpportunityType.supplierRequest,
      ]);
    });

    test('individuals may apply to open individual-facing types', () {
      for (final type in [
        OpportunityType.job,
        OpportunityType.project,
        OpportunityType.volunteering,
      ]) {
        expect(
          _opportunity(type: type).eligibilityFor(_professional),
          ApplicationEligibility.eligible,
          reason: type.name,
        );
      }
    });

    test('supplier requests never accept individual applications', () {
      for (final applicant in [_professional, _student, _company]) {
        expect(
          _opportunity(type: OpportunityType.supplierRequest)
              .eligibilityFor(applicant),
          ApplicationEligibility.companyFacing,
        );
      }
    });

    test('companies never apply as individuals', () {
      for (final type in OpportunityType.visibleTo(
        OpportunityAudience.individual,
      )) {
        expect(
          _opportunity(type: type).eligibilityFor(_company),
          ApplicationEligibility.individualsOnly,
        );
      }
    });

    test('co-op training is for individuals with student status', () {
      final coOp = _opportunity(type: OpportunityType.coOp);
      expect(coOp.eligibilityFor(_student), ApplicationEligibility.eligible);
      expect(
        coOp.eligibilityFor(_professional),
        ApplicationEligibility.studentsOnly,
      );
      expect(
        coOp.eligibilityFor((
          accountType: AccountType.individual,
          profileStatus: null,
        )),
        ApplicationEligibility.studentsOnly,
      );
      expect(
        coOp.eligibilityFor(_company),
        ApplicationEligibility.individualsOnly,
      );
    });

    test('closed or expired listings do not accept applications', () {
      expect(
        _opportunity(status: OpportunityStatus.closed)
            .eligibilityFor(_professional),
        ApplicationEligibility.closed,
      );
      expect(
        _opportunity(closesAt: DateTime(2026, 1, 1))
            .eligibilityFor(_professional, now: DateTime(2026, 1, 2)),
        ApplicationEligibility.closed,
      );
    });

    test('individuals never receive supplier requests', () async {
      final source = _opportunities(AccountType.individual);
      for (final type in <OpportunityType?>[null, ...OpportunityType.values]) {
        final page = await source.getOpportunities((
          type: type,
          query: '',
        ), const PageRequest());
        expect(
          page.items.map((o) => o.type),
          isNot(contains(OpportunityType.supplierRequest)),
        );
      }
      await expectLater(
        source.getOpportunity('conventions-led-supply'),
        _apiError(ApiErrorType.notFound),
      );
    });

    test('companies see supplier requests', () async {
      final page = await _opportunities(AccountType.company)
          .getOpportunities((type: null, query: ''), const PageRequest());
      expect(page.items, isNotEmpty);
      expect(
        page.items.every((o) => o.type == OpportunityType.supplierRequest),
        isTrue,
      );
    });

    test('match scores only where a matching rule exists', () async {
      final page = await _opportunities(AccountType.individual)
          .getOpportunities((type: null, query: ''), const PageRequest());
      for (final o in page.items) {
        if (o.type == OpportunityType.coOp ||
            o.type == OpportunityType.volunteering) {
          expect(o.matchScore, isNull, reason: o.id);
        }
      }
    });
  });

  group('application lifecycle', () {
    test('one pipeline: submitted → reviewed → shortlisted → contact → '
        'decision', () {
      expect(ApplicationStage.values, [
        ApplicationStage.submitted,
        ApplicationStage.reviewed,
        ApplicationStage.shortlisted,
        ApplicationStage.contact,
        ApplicationStage.decision,
      ]);
      for (final outcome in [
        ApplicationStatus.accepted,
        ApplicationStatus.rejected,
        ApplicationStatus.withdrawn,
      ]) {
        expect(outcome.stage, ApplicationStage.decision);
        expect(outcome.isActive, isFalse);
      }
      expect(ApplicationStatus.contact.isActive, isTrue);
    });

    test('applying again: only a withdrawn application allows it', () {
      expect(ApplicationRules.canApplyAgain(const []), isTrue);
      expect(
        ApplicationRules.canApplyAgain([
          _application(ApplicationStatus.withdrawn),
        ]),
        isTrue,
      );
      for (final status in ApplicationStatus.values.where(
        (s) => s != ApplicationStatus.withdrawn,
      )) {
        expect(
          ApplicationRules.canApplyAgain([
            _application(ApplicationStatus.withdrawn),
            _application(status),
          ]),
          isFalse,
          reason: status.name,
        );
      }
    });

    test('an application carries the applicant, chosen experience, chosen '
        'projects, message and listing', () async {
      final (:source, inbox: _) = _applications();
      final created = await source.submit(
        const ApplicationDraft(
          opportunityId: 'sound-stage-audio',
          experienceIds: ['exp-1'],
          projectIds: ['proj-2'],
          statement: '  Ready for load-in.  ',
        ),
      );
      expect(created.status, ApplicationStatus.submitted);
      expect(created.applicant.name, 'Sara Al-Qahtani');
      expect(created.experience.map((e) => e.id), ['exp-1']);
      expect(created.projects.map((p) => p.id), ['proj-2']);
      expect(created.statement, 'Ready for load-in.');
      expect(created.opportunityTitle, 'Live Audio Systems Engineer');
      expect(created.company.name, 'Sound & Stage Co');
    });

    test('experience and projects must come from the applicant profile', () {
      final (:source, inbox: _) = _applications();
      expect(
        source.submit(
          const ApplicationDraft(
            opportunityId: 'sound-stage-audio',
            projectIds: ['someone-elses-project'],
          ),
        ),
        _apiError(ApiErrorType.validation),
      );
    });

    test(
      'no duplicate active applications; withdraw then apply again',
      () async {
        final (:source, inbox: _) = _applications();
        const draft = ApplicationDraft(opportunityId: 'sound-stage-audio');
        final created = await source.submit(draft);
        await expectLater(
          source.submit(draft),
          _apiError(ApiErrorType.validation),
        );

        final withdrawn = await source.withdraw(created.id);
        expect(withdrawn.status, ApplicationStatus.withdrawn);
        await expectLater(
          source.withdraw(created.id),
          _apiError(ApiErrorType.validation),
        );
        expect(
          (await source.submit(draft)).status,
          ApplicationStatus.submitted,
        );
      },
    );

    test('co-op: students may apply, other individuals may not', () async {
      const draft = ApplicationDraft(opportunityId: 'conventions-coop');
      await expectLater(
        _applications().source.submit(draft),
        _apiError(ApiErrorType.forbidden),
      );
      final created = await _applications(_student).source.submit(draft);
      expect(created.opportunityType, OpportunityType.coOp);
    });

    test('supplier requests cannot receive individual applications', () {
      expect(
        _applications().source.submit(
          const ApplicationDraft(opportunityId: 'conventions-led-supply'),
        ),
        _apiError(ApiErrorType.notFound),
      );
    });

    test('closed listings reject applications', () {
      expect(
        _applications().source.submit(
          const ApplicationDraft(opportunityId: 'sela-production-director'),
        ),
        _apiError(ApiErrorType.forbidden),
      );
    });

    test('company accounts cannot apply or list applications', () async {
      final (:source, inbox: _) = _applications(_company);
      await expectLater(
        source.getMyApplications(),
        _apiError(ApiErrorType.forbidden),
      );
      await expectLater(
        source.submit(const ApplicationDraft(opportunityId: 'midan-tech-lead')),
        _apiError(ApiErrorType.forbidden),
      );
    });
  });

  group('status notifications', () {
    test('only an actual status change notifies', () {
      expect(
        ApplicationRules.isNotifiableTransition(
          null,
          ApplicationStatus.submitted,
        ),
        isTrue,
      );
      expect(
        ApplicationRules.isNotifiableTransition(
          ApplicationStatus.reviewed,
          ApplicationStatus.shortlisted,
        ),
        isTrue,
      );
      expect(
        ApplicationRules.isNotifiableTransition(
          ApplicationStatus.reviewed,
          ApplicationStatus.reviewed,
        ),
        isFalse,
      );
    });

    test(
      'submitting and withdrawing each notify with listing and status',
      () async {
        final (:source, :inbox) = _applications();
        final before = (await inbox.getNotifications()).length;

        final created = await source.submit(
          const ApplicationDraft(opportunityId: 'sound-stage-audio'),
        );
        await source.withdraw(created.id);

        final all = await inbox.getNotifications();
        expect(all.length, before + 2);
        final updates = [for (final n in all.take(2)) n.applicationUpdate!];
        expect(updates.map((u) => u.status), [
          ApplicationStatus.withdrawn,
          ApplicationStatus.submitted,
        ]);
        expect(
          updates.every(
            (u) => u.opportunityTitle == 'Live Audio Systems Engineer',
          ),
          isTrue,
        );
      },
    );

    test('recording the same status twice raises nothing new', () async {
      final inbox = NotificationsMockDataSource(
        language: () => 'en',
        latency: Duration.zero,
      );
      final before = (await inbox.getNotifications()).length;
      inbox.recordApplicationStatus(
        from: ApplicationStatus.reviewed,
        application: _application(ApplicationStatus.reviewed),
      );
      expect((await inbox.getNotifications()).length, before);
    });
  });
}
