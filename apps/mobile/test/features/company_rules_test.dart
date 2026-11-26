import 'package:backofhouse/core/network/api_exception.dart';
import 'package:backofhouse/features/applications/domain/application.dart';
import 'package:backofhouse/features/auth/domain/app_user.dart';
import 'package:backofhouse/features/companies/data/company_workspace_mock.dart';
import 'package:backofhouse/features/companies/domain/company.dart';
import 'package:backofhouse/features/companies/domain/company_capability.dart';
import 'package:backofhouse/features/companies/domain/company_membership.dart';
import 'package:backofhouse/features/companies/domain/company_project.dart';
import 'package:backofhouse/features/companies/domain/company_type.dart';
import 'package:backofhouse/features/notifications/data/notifications_data.dart';
import 'package:backofhouse/features/opportunities/domain/opportunity.dart';
import 'package:backofhouse/features/supplier_responses/domain/supplier_response.dart';
import 'package:flutter_test/flutter_test.dart';

CompanySummary _company(CompanyType type, {bool verified = false}) =>
    CompanySummary(
      id: 'own-${type.name}',
      name: 'Own Co',
      type: type,
      verified: verified,
      capabilities: CompanyCapability.defaultsFor(type),
    );

CompanyWorkspaceMock _workspace(
  CompanyType type, {
  bool verified = false,
  bool signedIn = true,
  NotificationsMockDataSource? inbox,
}) => CompanyWorkspaceMock(
  membership: () => signedIn
      ? CompanyMembership(
          company: _company(type, verified: verified),
          role: CompanyRole.owner,
        )
      : null,
  language: () => 'en',
  latency: Duration.zero,
  onApplicantStatusChanged: (from, applicant) =>
      inbox?.recordApplicantStatusChange(from: from, applicant: applicant),
);

Opportunity _request({
  List<CompanyType> invites = const [CompanyType.supplier],
  String buyerId = 'buyer',
  OpportunityStatus status = OpportunityStatus.published,
}) => Opportunity(
  id: 'r1',
  type: OpportunityType.supplierRequest,
  status: status,
  title: 'Lighting',
  company: CompanySummary(
    id: buyerId,
    name: 'Buyer',
    type: CompanyType.eventOrganizer,
  ),
  city: 'Riyadh',
  summary: '',
  postedAt: DateTime(2026),
  applicants: 0,
  supplierTypes: invites,
);

const _jobDraft = OpportunityDraft(
  type: OpportunityType.job,
  title: 'Rigger',
  city: 'Riyadh',
  summary: 'Rig a stage',
  description: 'Rig and derig for four shows.',
  employment: EmploymentType.contract,
);

Matcher _apiError(ApiErrorType type) =>
    throwsA(isA<ApiException>().having((e) => e.type, 'type', type));

void main() {
  group('company membership', () {
    test('the owner holds every MVP permission', () {
      const membership = CompanyMembership(
        company: CompanySummary(id: 'c', name: 'C', type: CompanyType.other),
        role: CompanyRole.owner,
      );
      for (final p in CompanyPermission.values) {
        expect(membership.can(p), isTrue, reason: p.name);
      }
    });

    test('a company account parses into an owner membership', () {
      final user = AppUser.fromJson({
        'id': 1,
        'email': 'ops@co.sa',
        'account_type': 'COMPANY',
        'company': {'id': 'c9', 'name': 'Co', 'company_type': 'SUPPLIER'},
      });
      expect(user.membership?.role, CompanyRole.owner);
      expect(user.company?.id, 'c9');
    });

    test('company features need a membership', () {
      final ws = _workspace(CompanyType.supplier, signedIn: false);
      expect(ws.getMyCompany(), _apiError(ApiErrorType.forbidden));
      expect(ws.getMyOpportunities(), _apiError(ApiErrorType.forbidden));
    });
  });

  group('company capabilities', () {
    test('buyer-oriented types may create supplier requests', () {
      for (final type in CompanyType.values) {
        expect(
          CompanyCapability.defaultsFor(type)
              .contains(CompanyCapability.createSupplierRequest),
          {
            CompanyType.eventOrganizer,
            CompanyType.agency,
            CompanyType.venue,
            CompanyType.production,
          }.contains(type),
          reason: type.name,
        );
      }
    });

    test('capabilities from the API override the type defaults', () {
      final summary = CompanySummary.fromJson({
        'id': 's',
        'name': 'S',
        'company_type': 'SUPPLIER',
        'capabilities': ['CREATE_SUPPLIER_REQUEST'],
      });
      expect(summary.can(CompanyCapability.createSupplierRequest), isTrue);
    });

    test('only capable companies may draft supplier requests', () async {
      const draft = OpportunityDraft(
        type: OpportunityType.supplierRequest,
        title: 'LED wall',
        city: 'Riyadh',
        summary: 'LED',
        description: 'Supply an LED wall.',
        supplierTypes: [CompanyType.supplier],
      );
      expect(
        OpportunityDraft.typesFor(_company(CompanyType.supplier)),
        isNot(contains(OpportunityType.supplierRequest)),
      );
      await expectLater(
        _workspace(CompanyType.supplier).createDraft(draft),
        _apiError(ApiErrorType.validation),
      );
      final created = await _workspace(CompanyType.eventOrganizer)
          .createDraft(draft);
      expect(created.type, OpportunityType.supplierRequest);
    });

    test('a supplier request must name who it is for', () {
      const draft = OpportunityDraft(
        type: OpportunityType.supplierRequest,
        title: 'LED wall',
        city: 'Riyadh',
        summary: 'LED',
        description: 'Supply an LED wall.',
      );
      expect(
        draft.validate(_company(CompanyType.venue)),
        contains(OpportunityDraftIssue.supplierTypesRequired),
      );
    });
  });

  group('listing fields', () {
    final now = DateTime(2026, 9, 28);
    OpportunityDraft job({DateTime? closesAt, WorkSetup? workSetup}) =>
        OpportunityDraft(
          type: OpportunityType.job,
          title: 'Stage Manager',
          city: 'Riyadh',
          summary: 'Run the stage',
          description: 'Run stage operations.',
          employment: EmploymentType.fullTime,
          closesAt: closesAt,
          workSetup: workSetup,
        );

    test('a closing date must be in the future', () {
      final company = _company(CompanyType.production);
      expect(
        job(closesAt: now.subtract(const Duration(days: 1)))
            .validate(company, now: now),
        contains(OpportunityDraftIssue.closesInPast),
      );
      expect(
        job(closesAt: now.add(const Duration(days: 30)))
            .validate(company, now: now),
        isNot(contains(OpportunityDraftIssue.closesInPast)),
      );
      expect(job().validate(company, now: now), isEmpty);
    });

    test('work setup and closing date round-trip through a draft', () {
      final draft = job(
        closesAt: now.add(const Duration(days: 30)),
        workSetup: WorkSetup.hybrid,
      );
      expect(draft.workSetup, WorkSetup.hybrid);
      expect(WorkSetup.fromWire('REMOTE'), WorkSetup.remote);
      expect(WorkSetup.fromWire('nope'), isNull);
    });
  });

  group('opportunity publishing', () {
    test('drafts go to review; only Back Of House publishes', () {
      const company = OpportunityActor.company;
      const boh = OpportunityActor.backOfHouse;
      expect(OpportunityLifecycle.initial, OpportunityStatus.draft);
      expect(
        OpportunityLifecycle.canTransition(
          OpportunityStatus.draft,
          OpportunityStatus.inReview,
          company,
        ),
        isTrue,
      );
      for (final from in OpportunityStatus.values) {
        expect(
          OpportunityLifecycle.canTransition(
            from,
            OpportunityStatus.published,
            company,
          ),
          isFalse,
          reason: 'company from ${from.name}',
        );
      }
      expect(
        OpportunityLifecycle.canTransition(
          OpportunityStatus.inReview,
          OpportunityStatus.published,
          boh,
        ),
        isTrue,
      );
      expect(
        OpportunityLifecycle.canTransition(
          OpportunityStatus.draft,
          OpportunityStatus.published,
          boh,
        ),
        isFalse,
      );
    });

    test('verified companies still go through review', () async {
      final ws = _workspace(CompanyType.production, verified: true);
      final draft = await ws.createDraft(_jobDraft);
      expect(draft.status, OpportunityStatus.draft);
      final submitted = await ws.submitForReview(draft.id);
      expect(submitted.status, OpportunityStatus.inReview);
    });

    test('unverified companies can draft and submit for review', () async {
      final ws = _workspace(CompanyType.agency);
      final draft = await ws.createDraft(_jobDraft);
      expect(
        (await ws.submitForReview(draft.id)).status,
        OpportunityStatus.inReview,
      );
      final published = await ws.completeReview(draft.id, approve: true);
      expect(published.status, OpportunityStatus.published);
    });

    test('only drafts can be edited', () async {
      final ws = _workspace(CompanyType.agency);
      final draft = await ws.createDraft(_jobDraft);
      await ws.submitForReview(draft.id);
      await expectLater(
        ws.updateDraft(draft.id, _jobDraft),
        _apiError(ApiErrorType.validation),
      );
      await ws.returnToDraft(draft.id);
      expect(
        (await ws.updateDraft(draft.id, _jobDraft)).status,
        OpportunityStatus.draft,
      );
    });

    test('a failed review asks for changes, never silently drafts', () async {
      final ws = _workspace(CompanyType.agency);
      const boh = OpportunityActor.backOfHouse;
      expect(
        OpportunityLifecycle.canTransition(
          OpportunityStatus.inReview,
          OpportunityStatus.changesRequested,
          boh,
        ),
        isTrue,
      );
      expect(
        OpportunityLifecycle.canTransition(
          OpportunityStatus.inReview,
          OpportunityStatus.draft,
          boh,
        ),
        isFalse,
      );

      final draft = await ws.createDraft(_jobDraft);
      await ws.submitForReview(draft.id);
      final sentBack = await ws.completeReview(
        draft.id,
        approve: false,
        note: 'Add more detail.',
      );
      expect(sentBack.status, OpportunityStatus.changesRequested);
      expect(sentBack.reviewerNote, 'Add more detail.');

      // The company edits and resubmits; the note is cleared.
      final edited = await ws.updateDraft(draft.id, _jobDraft);
      expect(edited.reviewerNote, isNull);
      expect(
        (await ws.submitForReview(draft.id)).status,
        OpportunityStatus.inReview,
      );
    });

    test(
      'a published listing changes only through a reviewed update',
      () async {
        final ws = _workspace(CompanyType.agency);
        final draft = await ws.createDraft(_jobDraft);
        await ws.submitForReview(draft.id);
        final live = await ws.completeReview(draft.id, approve: true);
        expect(live.status, OpportunityStatus.published);

        // No direct edit of published content.
        expect(
          OpportunityLifecycle.isEditable(OpportunityStatus.published),
          isFalse,
        );
        await expectLater(
          ws.updateDraft(live.id, _jobDraft),
          _apiError(ApiErrorType.validation),
        );

        const updated = OpportunityDraft(
          type: OpportunityType.job,
          title: 'Senior Rigger',
          city: 'Riyadh',
          summary: 'Rig a stage',
          description: 'Rig and derig for six shows.',
          employment: EmploymentType.contract,
        );
        await ws.startRevision(live.id);
        await ws.updateRevision(live.id, updated);
        final inReview = await ws.submitRevisionForReview(live.id);
        // The live content is untouched while the update is reviewed.
        expect(inReview.title, 'Rigger');
        expect(inReview.status, OpportunityStatus.published);
        expect(inReview.revision?.status, OpportunityStatus.inReview);

        final sentBack = await ws.completeReview(
          live.id,
          approve: false,
          note: 'Clarify the dates.',
        );
        expect(sentBack.title, 'Rigger');
        expect(sentBack.revision?.status, OpportunityStatus.changesRequested);
        expect(sentBack.revision?.reviewerNote, 'Clarify the dates.');

        await ws.submitRevisionForReview(live.id);
        final approved = await ws.completeReview(live.id, approve: true);
        expect(approved.title, 'Senior Rigger');
        expect(approved.status, OpportunityStatus.published);
        expect(approved.revision, isNull);
      },
    );

    test('closing is final', () async {
      final ws = _workspace(CompanyType.agency);
      final draft = await ws.createDraft(_jobDraft);
      await ws.submitForReview(draft.id);
      await ws.completeReview(draft.id, approve: true);
      expect((await ws.close(draft.id)).status, OpportunityStatus.closed);
      expect(OpportunityLifecycle.isFinal(OpportunityStatus.closed), isTrue);
      for (final actor in OpportunityActor.values) {
        for (final to in OpportunityStatus.values) {
          expect(
            OpportunityLifecycle.canTransition(
              OpportunityStatus.closed,
              to,
              actor,
            ),
            isFalse,
            reason: '\${actor.name} → \${to.name}',
          );
        }
      }
      await expectLater(
        ws.startRevision(draft.id),
        _apiError(ApiErrorType.validation),
      );
    });

    test('incomplete drafts cannot be submitted', () async {
      final ws = _workspace(CompanyType.agency);
      // Seeded draft with no description.
      await expectLater(
        ws.submitForReview('my-volunteers'),
        _apiError(ApiErrorType.validation),
      );
    });
  });

  group('applicant status', () {
    const company = ApplicationActor.company;

    test('the company moves one stage at a time', () {
      expect(
        ApplicationRules.nextStatuses(ApplicationStatus.submitted, company),
        {ApplicationStatus.reviewed, ApplicationStatus.rejected},
      );
      expect(
        ApplicationRules.nextStatuses(ApplicationStatus.contact, company),
        {ApplicationStatus.accepted, ApplicationStatus.rejected},
      );
    });

    test('acceptance only from the contact stage', () {
      for (final from in ApplicationStatus.values) {
        expect(
          ApplicationRules.canTransition(
            from,
            ApplicationStatus.accepted,
            company,
          ),
          from == ApplicationStatus.contact,
          reason: from.name,
        );
      }
    });

    test('rejection at any active stage', () {
      for (final from in [
        ApplicationStatus.submitted,
        ApplicationStatus.reviewed,
        ApplicationStatus.shortlisted,
        ApplicationStatus.contact,
      ]) {
        expect(
          ApplicationRules.canTransition(
            from,
            ApplicationStatus.rejected,
            company,
          ),
          isTrue,
          reason: from.name,
        );
      }
    });

    test('decisions are final', () {
      for (final from in [
        ApplicationStatus.accepted,
        ApplicationStatus.rejected,
        ApplicationStatus.withdrawn,
      ]) {
        for (final actor in ApplicationActor.values) {
          expect(ApplicationRules.nextStatuses(from, actor), isEmpty);
        }
      }
    });

    test('companies cannot withdraw for the applicant', () {
      expect(
        ApplicationRules.canTransition(
          ApplicationStatus.reviewed,
          ApplicationStatus.withdrawn,
          company,
        ),
        isFalse,
      );
    });

    test('the data layer refuses jumps and reversals', () async {
      final ws = _workspace(CompanyType.production);
      await expectLater(
        ws.updateStatus('applicant-noura', ApplicationStatus.accepted),
        _apiError(ApiErrorType.validation),
      );
      await ws.updateStatus('applicant-noura', ApplicationStatus.reviewed);
      await expectLater(
        ws.updateStatus('applicant-majed', ApplicationStatus.reviewed),
        _apiError(ApiErrorType.validation),
      );
    });
  });

  group('applicant privacy', () {
    test('contact is hidden before the contact stage', () {
      const contact = ApplicantContact(email: 'a@b.sa', phone: '+966');
      for (final status in [
        ApplicationStatus.submitted,
        ApplicationStatus.reviewed,
        ApplicationStatus.shortlisted,
        ApplicationStatus.rejected,
        ApplicationStatus.withdrawn,
      ]) {
        expect(
          ApplicantPrivacy.visibleContact(
            status: status,
            contact: contact,
            privacy: const ContactPrivacy(),
          ),
          isNull,
          reason: status.name,
        );
      }
    });

    test('nothing is shared by default', () {
      const privacy = ContactPrivacy();
      expect(privacy.shareEmail, isFalse);
      expect(privacy.sharePhone, isFalse);
      expect(
        ApplicantPrivacy.visibleContact(
          status: ApplicationStatus.contact,
          contact: const ApplicantContact(email: 'a@b.sa', phone: '+966'),
          privacy: privacy,
        ),
        isNull,
      );
    });

    test('from the contact stage, only what the applicant shares', () {
      final visible = ApplicantPrivacy.visibleContact(
        status: ApplicationStatus.contact,
        contact: const ApplicantContact(email: 'a@b.sa', phone: '+966'),
        privacy: const ContactPrivacy(shareEmail: true),
      );
      expect(visible?.email, 'a@b.sa');
      expect(visible?.phone, isNull);
      expect(
        ApplicantPrivacy.visibleContact(
          status: ApplicationStatus.contact,
          contact: const ApplicantContact(email: 'a@b.sa'),
          privacy: const ContactPrivacy(shareEmail: false),
        ),
        isNull,
      );
    });

    test('opening an application never reveals contact', () async {
      final ws = _workspace(CompanyType.production);
      final view = await ws.getApplicant('applicant-noura');
      expect(view.status, ApplicationStatus.submitted);
      expect(view.contact, isNull);

      // Noura shares nothing, so the contact stage releases nothing.
      await ws.updateStatus('applicant-noura', ApplicationStatus.reviewed);
      await ws.updateStatus('applicant-noura', ApplicationStatus.shortlisted);
      final atContact = await ws.updateStatus(
        'applicant-noura',
        ApplicationStatus.contact,
      );
      expect(atContact.contact, isNull);

      // Reem shares email only.
      final reem = await ws.getApplicant('applicant-reem');
      expect(reem.contact?.email, isNotNull);
      expect(reem.contact?.phone, isNull);
    });
  });

  group('company projects', () {
    test('client name is optional; dates must be ordered', () {
      final draft = CompanyProjectDraft(
        title: 'Gala',
        description: 'Stage and AV.',
        location: 'Riyadh',
        category: 'Corporate',
        startedAt: DateTime(2026, 3),
      );
      expect(draft.validate(), isEmpty);
      expect(
        CompanyProjectDraft(
          title: 'Gala',
          description: 'x',
          location: 'Riyadh',
          category: 'Corporate',
          startedAt: DateTime(2026, 3),
          endedAt: DateTime(2026, 2),
        ).validate(),
        [CompanyProjectIssue.endsBeforeStart],
      );
    });

    test('unverified companies manage their portfolio', () async {
      final ws = _workspace(CompanyType.supplier);
      final created = await ws.addProject(
        CompanyProjectDraft(
          title: 'Arena LED',
          description: 'LED wall for an arena tour.',
          location: 'Jeddah',
          category: 'Audio Visual',
          startedAt: DateTime(2026),
          clientName: '  ',
        ),
      );
      expect(created.clientName, isNull);
      expect((await ws.getMyProjects()).first.id, created.id);
      await ws.deleteProject(created.id);
      expect(
        (await ws.getMyProjects()).map((p) => p.id),
        isNot(contains(created.id)),
      );
    });
  });

  group('applicant notifications', () {
    test('a company status change raises the applicant event', () async {
      final inbox = NotificationsMockDataSource(
        language: () => 'en',
        latency: Duration.zero,
      );
      final ws = _workspace(CompanyType.production, inbox: inbox);
      await ws.updateStatus('applicant-noura', ApplicationStatus.reviewed);

      expect(inbox.applicantEvents, hasLength(1));
      expect(inbox.applicantEvents.first.status, ApplicationStatus.reviewed);
      expect(inbox.applicantEvents.first.opportunityTitle, 'Stage Manager');
      // The applicant's inbox lives on their own account, not the company's.
      expect(
        (await inbox.getNotifications()).where(
          (n) => n.applicationUpdate?.applicationId == 'applicant-noura',
        ),
        isEmpty,
      );
    });
  });

  group('supplier responses', () {
    final supplier = _company(CompanyType.supplier);

    test('eligibility follows the invited supplier types', () {
      expect(
        SupplierResponseRules.eligibility(
          request: _request(),
          responder: supplier,
        ),
        SupplierResponseEligibility.eligible,
      );
      expect(
        SupplierResponseRules.eligibility(
          request: _request(),
          responder: _company(CompanyType.venue),
        ),
        SupplierResponseEligibility.notInvited,
      );
      expect(
        SupplierResponseRules.eligibility(
          request: _request(buyerId: supplier.id),
          responder: supplier,
        ),
        SupplierResponseEligibility.ownRequest,
      );
      expect(
        SupplierResponseRules.eligibility(
          request: _request(status: OpportunityStatus.closed),
          responder: supplier,
        ),
        SupplierResponseEligibility.closed,
      );
      expect(
        SupplierResponseRules.eligibility(
          request: _request(),
          responder: supplier,
          alreadyResponded: true,
        ),
        SupplierResponseEligibility.alreadyResponded,
      );
    });

    test('buyer lifecycle ends at selected or rejected', () {
      expect(
        SupplierResponseRules.nextStatuses(SupplierResponseStatus.submitted),
        {SupplierResponseStatus.reviewed, SupplierResponseStatus.rejected},
      );
      expect(
        SupplierResponseRules.canTransition(
          SupplierResponseStatus.submitted,
          SupplierResponseStatus.selected,
        ),
        isFalse,
      );
      expect(
        SupplierResponseRules.canTransition(
          SupplierResponseStatus.shortlisted,
          SupplierResponseStatus.selected,
        ),
        isTrue,
      );
      expect(
        SupplierResponseRules.nextStatuses(SupplierResponseStatus.selected),
        isEmpty,
      );
    });

    test('invited companies respond once, with their own projects', () async {
      final ws = _workspace(CompanyType.supplier);
      final invited = await ws.getInvitedRequests();
      expect(invited.map((r) => r.id), contains('request-stage-lighting'));
      expect(
        invited.map((r) => r.id),
        isNot(contains('request-crew-services')),
      );

      final projects = await ws.getMyProjects();
      final response = await ws.submitResponse(
        SupplierResponseDraft(
          requestId: 'request-stage-lighting',
          message: 'We can supply 48 moving heads.',
          proposedPrice: 'SAR 60,000',
          projectIds: [projects.first.id],
        ),
      );
      expect(response.status, SupplierResponseStatus.submitted);
      expect(response.projects.single.id, projects.first.id);

      await expectLater(
        ws.submitResponse(
          const SupplierResponseDraft(
            requestId: 'request-stage-lighting',
            message: 'Again',
          ),
        ),
        _apiError(ApiErrorType.forbidden),
      );
    });

    test('uninvited companies cannot respond or open the request', () async {
      final ws = _workspace(CompanyType.supplier);
      await expectLater(
        ws.getRequest('request-crew-services'),
        _apiError(ApiErrorType.notFound),
      );
      await expectLater(
        ws.submitResponse(
          const SupplierResponseDraft(
            requestId: 'request-crew-services',
            message: 'Catering',
          ),
        ),
        _apiError(ApiErrorType.forbidden),
      );
    });

    test('evidence must come from the responder portfolio', () {
      final ws = _workspace(CompanyType.supplier);
      expect(
        ws.submitResponse(
          const SupplierResponseDraft(
            requestId: 'request-stage-lighting',
            message: 'Hi',
            projectIds: ['someone-elses'],
          ),
        ),
        _apiError(ApiErrorType.validation),
      );
    });

    test(
      'selecting a supplier rejects the rest and closes the request',
      () async {
        final ws = _workspace(CompanyType.eventOrganizer);
        await ws.updateResponseStatus(
          'response-benchmark',
          SupplierResponseStatus.shortlisted,
        );
        final selected = await ws.updateResponseStatus(
          'response-benchmark',
          SupplierResponseStatus.selected,
        );
        expect(selected.status, SupplierResponseStatus.selected);

        final responses = await ws.getResponsesToMyRequest('my-sound-request');
        expect(
          responses.firstWhere((r) => r.id == 'response-noor').status,
          SupplierResponseStatus.rejected,
        );
        expect(
          (await ws.getMyOpportunity('my-sound-request')).status,
          OpportunityStatus.closed,
        );
        // Final: nothing moves afterwards.
        await expectLater(
          ws.updateResponseStatus(
            'response-noor',
            SupplierResponseStatus.selected,
          ),
          _apiError(ApiErrorType.validation),
        );
      },
    );

    test('the buyer manages responses one step at a time', () async {
      final ws = _workspace(CompanyType.eventOrganizer);
      final responses = await ws.getResponsesToMyRequest('my-sound-request');
      expect(responses, hasLength(2));
      await expectLater(
        ws.updateResponseStatus(
          'response-noor',
          SupplierResponseStatus.selected,
        ),
        _apiError(ApiErrorType.validation),
      );
      final shortlisted = await ws.updateResponseStatus(
        'response-benchmark',
        SupplierResponseStatus.shortlisted,
      );
      expect(shortlisted.status, SupplierResponseStatus.shortlisted);
    });
  });
}
