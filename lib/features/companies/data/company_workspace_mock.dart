import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_assets.dart';
import '../../../core/data/mock_support.dart';
import '../../../core/l10n/content_language.dart';
import '../../../core/media/app_image.dart';
import '../../../core/network/api_exception.dart';
import '../../applications/data/applicants_data.dart';
import '../../applications/domain/application.dart';
import '../../auth/presentation/controllers/auth_controller.dart';
import '../../notifications/data/notifications_data.dart';
import '../../opportunities/data/company_opportunities_data.dart';
import '../../opportunities/domain/opportunity.dart';
import '../../profile/domain/profile.dart';
import '../../profile/domain/profile_status.dart';
import '../../supplier_responses/data/supplier_requests_data.dart';
import '../../supplier_responses/domain/supplier_response.dart';
import '../domain/company.dart';
import '../domain/company_capability.dart';
import '../domain/company_membership.dart';
import '../domain/company_project.dart';
import '../domain/company_type.dart';
import 'my_company_data.dart';

/// In-memory backend for the signed-in company: profile, portfolio,
/// opportunities, applicants and supplier responses. It enforces the same
/// domain rules the API must enforce — permissions, [OpportunityLifecycle],
/// [ApplicationRules], [ApplicantPrivacy] and [SupplierResponseRules] — so
/// screens behave as they will against the real backend.
///
/// Seeded with sample activity so every company workflow can be tried.
class CompanyWorkspaceMock
    implements
        MyCompanyDataSource,
        CompanyOpportunitiesDataSource,
        ApplicantsDataSource,
        SupplierRequestsDataSource {
  CompanyWorkspaceMock({
    required this.membership,
    required this.language,
    required this.latency,
    this.onApplicantStatusChanged,
  }) {
    _seed();
  }

  final CompanyMembership? Function() membership;
  final String Function() language;
  final Duration latency;

  /// Stands in for the backend notifying the applicant. Delivery is the
  /// API's responsibility; the app never sends notifications itself.
  final void Function(ApplicationStatus from, ApplicantView applicant)?
  onApplicantStatusChanged;

  var _profile = const CompanyProfileDraft();
  final List<_Project> _projects = [];
  final List<_Listing> _listings = [];
  final List<_Applicant> _applicants = [];
  final List<_Response> _responses = [];
  var _nextId = 1;

  String _id(String prefix) => '$prefix-${_nextId++}';

  Future<void> _wait() => Future<void>.delayed(latency);

  static const _forbidden = ApiException(
    type: ApiErrorType.forbidden,
    statusCode: 403,
  );
  static const _notFound = ApiException(
    type: ApiErrorType.notFound,
    statusCode: 404,
  );
  static const _invalid = ApiException(
    type: ApiErrorType.validation,
    statusCode: 422,
  );

  CompanySummary _own(CompanyPermission permission) {
    final m = membership();
    if (m == null || !m.can(permission)) throw _forbidden;
    return m.company;
  }

  String get _lang => language();

  // ── Profile & portfolio ────────────────────────────────────────────────

  @override
  Future<Company> getMyCompany() async {
    await _wait();
    final m = membership();
    if (m == null) throw _forbidden;
    return _company(m.company);
  }

  Company _company(CompanySummary c) {
    String? orNull(String s) => s.trim().isEmpty ? null : s.trim();
    return Company(
      id: c.id,
      name: c.name,
      type: c.type,
      verified: c.verified,
      capabilities: c.capabilities,
      specialization: _profile.specialization,
      city: _profile.city,
      description: _profile.description,
      services: _profile.services,
      industries: _profile.industries,
      contactEmail: orNull(_profile.contactEmail),
      contactPhone: orNull(_profile.contactPhone),
      website: orNull(_profile.website),
      openOpportunities: _listings
          .where((l) => l.own && l.status == OpportunityStatus.published)
          .length,
      completedProjects: _projects.length,
    );
  }

  @override
  Future<Company> updateProfile(CompanyProfileDraft draft) async {
    await _wait();
    final company = _own(CompanyPermission.editProfile);
    if (draft.validate().isNotEmpty) throw _invalid;
    _profile = CompanyProfileDraft(
      specialization: draft.specialization.trim(),
      city: draft.city.trim(),
      description: draft.description.trim(),
      services: _clean(draft.services),
      industries: _clean(draft.industries),
      contactEmail: draft.contactEmail.trim(),
      contactPhone: draft.contactPhone.trim(),
      website: draft.website.trim(),
    );
    return _company(company);
  }

  @override
  Future<List<CompanyProject>> getMyProjects() async {
    await _wait();
    final company = _own(CompanyPermission.manageProjects);
    return [for (final p in _projects) p.build(company.id, _lang)];
  }

  @override
  Future<CompanyProject> addProject(CompanyProjectDraft draft) async {
    await _wait();
    final company = _own(CompanyPermission.manageProjects);
    if (draft.validate().isNotEmpty) throw _invalid;
    final project = _Project.fromDraft(_id('project'), draft);
    _projects.insert(0, project);
    return project.build(company.id, _lang);
  }

  @override
  Future<CompanyProject> updateProject(
    String id,
    CompanyProjectDraft draft,
  ) async {
    await _wait();
    final company = _own(CompanyPermission.manageProjects);
    final index = _projects.indexWhere((p) => p.id == id);
    if (index < 0) throw _notFound;
    if (draft.validate().isNotEmpty) throw _invalid;
    _projects[index] = _Project.fromDraft(
      id,
      draft,
      image: _projects[index].image,
    );
    return _projects[index].build(company.id, _lang);
  }

  @override
  Future<void> deleteProject(String id) async {
    await _wait();
    _own(CompanyPermission.manageProjects);
    final before = _projects.length;
    _projects.removeWhere((p) => p.id == id);
    if (_projects.length == before) throw _notFound;
  }

  // ── Own opportunities ──────────────────────────────────────────────────

  Opportunity _opportunity(_Listing l, CompanySummary own) {
    final lang = _lang;
    return Opportunity(
      id: l.id,
      type: l.type,
      status: l.status,
      title: l.title.of(lang),
      company: l.buyer ?? own,
      city: l.city.of(lang),
      summary: l.summary.of(lang),
      description: l.description.of(lang),
      postedAt: l.updatedAt,
      closesAt: l.closesAt,
      applicants: l.type == OpportunityType.supplierRequest
          ? _responses.where((r) => r.requestId == l.id).length
          : _applicants.where((a) => a.opportunityId == l.id).length,
      employment: l.employment,
      compensation: l.compensation?.of(lang),
      duration: l.duration?.of(lang),
      responsibilities: [for (final t in l.responsibilities) t.of(lang)],
      requirements: [for (final t in l.requirements) t.of(lang)],
      skills: [for (final t in l.skills) t.of(lang)],
      supplierTypes: l.supplierTypes,
      reviewerNote: l.reviewerNote,
      revision: l.revisionDraft == null
          ? null
          : OpportunityRevision(
              status: l.revisionStatus,
              draft: l.revisionDraft!,
              reviewerNote: l.revisionNote,
            ),
    );
  }

  _Listing _ownListing(String id) {
    final match = _listings.where((l) => l.own && l.id == id);
    if (match.isEmpty) throw _notFound;
    return match.first;
  }

  @override
  Future<List<Opportunity>> getMyOpportunities() async {
    await _wait();
    final own = _own(CompanyPermission.manageOpportunities);
    final mine = _listings.where((l) => l.own).toList()
      ..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
    return [for (final l in mine) _opportunity(l, own)];
  }

  @override
  Future<Opportunity> getMyOpportunity(String id) async {
    await _wait();
    final own = _own(CompanyPermission.manageOpportunities);
    return _opportunity(_ownListing(id), own);
  }

  @override
  Future<Opportunity> createDraft(OpportunityDraft draft) async {
    await _wait();
    final own = _own(CompanyPermission.manageOpportunities);
    if (draft.validate(own).isNotEmpty) throw _invalid;
    final listing = _Listing.fromDraft(_id('opportunity'), draft)
      ..status = OpportunityLifecycle.initial;
    _listings.add(listing);
    return _opportunity(listing, own);
  }

  @override
  Future<Opportunity> updateDraft(String id, OpportunityDraft draft) async {
    await _wait();
    final own = _own(CompanyPermission.manageOpportunities);
    final listing = _ownListing(id);
    if (!OpportunityLifecycle.isEditable(listing.status) ||
        draft.validate(own).isNotEmpty) {
      throw _invalid;
    }
    listing
      ..apply(draft)
      ..reviewerNote = null;
    return _opportunity(listing, own);
  }

  Opportunity _move(
    String id,
    OpportunityStatus to,
    OpportunityActor actor,
    CompanySummary own,
  ) {
    final listing = _ownListing(id);
    if (!OpportunityLifecycle.canTransition(listing.status, to, actor)) {
      throw _invalid;
    }
    listing
      ..status = to
      ..updatedAt = DateTime.now();
    return _opportunity(listing, own);
  }

  @override
  Future<Opportunity> submitForReview(String id) async {
    await _wait();
    final own = _own(CompanyPermission.manageOpportunities);
    if (_ownListing(id).toDraft().validate(own).isNotEmpty) throw _invalid;
    return _move(id, OpportunityStatus.inReview, OpportunityActor.company, own);
  }

  @override
  Future<Opportunity> returnToDraft(String id) async {
    await _wait();
    final own = _own(CompanyPermission.manageOpportunities);
    return _move(id, OpportunityStatus.draft, OpportunityActor.company, own);
  }

  @override
  Future<Opportunity> close(String id) async {
    await _wait();
    final own = _own(CompanyPermission.manageOpportunities);
    // Closing is final: no transition leaves closed.
    return _move(id, OpportunityStatus.closed, OpportunityActor.company, own);
  }

  @override
  Future<Opportunity> startRevision(String id) async {
    await _wait();
    final own = _own(CompanyPermission.manageOpportunities);
    final listing = _ownListing(id);
    if (!OpportunityLifecycle.canStartRevision(_opportunity(listing, own))) {
      throw _invalid;
    }
    // A copy of the live content; the published version stays up.
    listing
      ..revisionDraft = listing.toDraft()
      ..revisionStatus = OpportunityStatus.draft
      ..revisionNote = null;
    return _opportunity(listing, own);
  }

  @override
  Future<Opportunity> updateRevision(String id, OpportunityDraft draft) async {
    await _wait();
    final own = _own(CompanyPermission.manageOpportunities);
    final listing = _ownListing(id);
    if (listing.revisionDraft == null ||
        !OpportunityLifecycle.isEditable(listing.revisionStatus) ||
        draft.validate(own).isNotEmpty) {
      throw _invalid;
    }
    listing
      ..revisionDraft = draft
      ..revisionNote = null;
    return _opportunity(listing, own);
  }

  @override
  Future<Opportunity> submitRevisionForReview(String id) async {
    await _wait();
    final own = _own(CompanyPermission.manageOpportunities);
    final listing = _ownListing(id);
    final draft = listing.revisionDraft;
    if (draft == null ||
        !OpportunityLifecycle.canTransition(
          listing.revisionStatus,
          OpportunityStatus.inReview,
          OpportunityActor.company,
        ) ||
        draft.validate(own).isNotEmpty) {
      throw _invalid;
    }
    listing.revisionStatus = OpportunityStatus.inReview;
    return _opportunity(listing, own);
  }

  /// Stands in for Back Of House's listing review (development only).
  ///
  /// A review that does not pass moves to changes-requested with a note;
  /// it never drops the listing back to draft. Approving a revision
  /// replaces the live content — until then the published version stands.
  Future<Opportunity> completeReview(
    String id, {
    required bool approve,
    String? note,
  }) async {
    await _wait();
    final own = _own(CompanyPermission.manageOpportunities);
    final listing = _ownListing(id);

    if (listing.revisionStatus == OpportunityStatus.inReview &&
        listing.revisionDraft != null) {
      if (approve) {
        listing
          ..apply(listing.revisionDraft!)
          ..status = OpportunityStatus.published
          ..revisionDraft = null
          ..revisionStatus = OpportunityStatus.draft
          ..revisionNote = null;
      } else {
        listing
          ..revisionStatus = OpportunityStatus.changesRequested
          ..revisionNote = note;
      }
      return _opportunity(listing, own);
    }

    final to = approve
        ? OpportunityStatus.published
        : OpportunityStatus.changesRequested;
    _move(id, to, OpportunityActor.backOfHouse, own);
    listing.reviewerNote = approve ? null : note;
    return _opportunity(listing, own);
  }

  // ── Applicants ─────────────────────────────────────────────────────────

  ApplicantView _view(_Applicant a) {
    final lang = _lang;
    final listing = _listings.firstWhere((l) => l.id == a.opportunityId);
    return ApplicantView(
      applicationId: a.id,
      reference: a.reference,
      opportunityId: a.opportunityId,
      opportunityTitle: listing.title.of(lang),
      status: a.status,
      submittedAt: a.submittedAt,
      updatedAt: a.updatedAt,
      applicant: ApplicantSnapshot(
        name: a.name,
        headline: a.headline.of(lang),
        city: a.city.of(lang),
        skills: [for (final s in a.skills) s.of(lang)],
        profileStatus: a.profileStatus,
        verificationLevel: a.verificationLevel,
        verified: a.verificationLevel > 0,
      ),
      experience: [
        for (final e in a.experience)
          Experience(
            id: e.id,
            role: e.role.of(lang),
            company: e.company.of(lang),
            start: e.start,
            end: e.end,
          ),
      ],
      projects: [
        for (final p in a.projects)
          ProfileProject(
            id: p.id,
            year: p.year,
            category: p.category.of(lang),
            title: p.title.of(lang),
            role: p.role.of(lang),
          ),
      ],
      statement: a.statement?.of(lang),
      // Redacted here, as the backend must: nothing private before the
      // contact stage, and only what the applicant chose to share.
      contact: ApplicantPrivacy.visibleContact(
        status: a.status,
        contact: a.contact,
        privacy: a.privacy,
      ),
    );
  }

  _Applicant _ownApplicant(String applicationId) {
    final match = _applicants.where((a) => a.id == applicationId);
    if (match.isEmpty) throw _notFound;
    _ownListing(match.first.opportunityId);
    return match.first;
  }

  @override
  Future<List<ApplicantView>> getApplicants(String opportunityId) async {
    await _wait();
    _own(CompanyPermission.reviewApplicants);
    final listing = _ownListing(opportunityId);
    if (listing.type == OpportunityType.supplierRequest) throw _notFound;
    final list =
        _applicants.where((a) => a.opportunityId == opportunityId).toList()
          ..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
    return [for (final a in list) _view(a)];
  }

  @override
  Future<ApplicantView> getApplicant(String applicationId) async {
    await _wait();
    _own(CompanyPermission.reviewApplicants);
    return _view(_ownApplicant(applicationId));
  }

  @override
  Future<ApplicantView> updateStatus(
    String applicationId,
    ApplicationStatus to,
  ) async {
    await _wait();
    _own(CompanyPermission.reviewApplicants);
    final a = _ownApplicant(applicationId);
    if (!ApplicationRules.canTransition(
      a.status,
      to,
      ApplicationActor.company,
    )) {
      throw _invalid;
    }
    final from = a.status;
    a
      ..status = to
      ..updatedAt = DateTime.now();
    final view = _view(a);
    // The backend notifies the applicant; the mock only records it.
    onApplicantStatusChanged?.call(from, view);
    return view;
  }

  // ── Supplier requests & responses ──────────────────────────────────────

  SupplierResponse _response(_Response r, CompanySummary own) {
    final lang = _lang;
    final request = _listings.firstWhere((l) => l.id == r.requestId);
    return SupplierResponse(
      id: r.id,
      requestId: r.requestId,
      requestTitle: request.title.of(lang),
      buyer: request.buyer ?? own,
      responder: r.responder ?? own,
      message: r.message.of(lang),
      proposedPrice: r.price?.of(lang),
      projects: [
        for (final p in r.projects) p.build((r.responder ?? own).id, lang),
      ],
      status: r.status,
      submittedAt: r.submittedAt,
      updatedAt: r.updatedAt,
    );
  }

  bool _responded(String requestId) =>
      _responses.any((r) => r.requestId == requestId && r.responder == null);

  @override
  Future<List<Opportunity>> getInvitedRequests() async {
    await _wait();
    final own = _own(CompanyPermission.respondToSupplierRequests);
    final invited = [
      for (final l in _listings)
        if (!l.own)
          if (SupplierResponseRules.eligibility(
                request: _opportunity(l, own),
                responder: own,
                alreadyResponded: _responded(l.id),
              )
              case SupplierResponseEligibility.eligible ||
                  SupplierResponseEligibility.alreadyResponded)
            l,
    ]..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
    return [for (final l in invited) _opportunity(l, own)];
  }

  @override
  Future<Opportunity> getRequest(String id) async {
    await _wait();
    final own = _own(CompanyPermission.respondToSupplierRequests);
    final match = _listings.where(
      (l) => l.id == id && l.type == OpportunityType.supplierRequest,
    );
    if (match.isEmpty) throw _notFound;
    final l = match.first;
    // Other companies' requests are visible only to invited types.
    if (!l.own && !l.supplierTypes.contains(own.type)) throw _notFound;
    return _opportunity(l, own);
  }

  @override
  Future<List<SupplierResponse>> getMyResponses() async {
    await _wait();
    final own = _own(CompanyPermission.respondToSupplierRequests);
    final mine = _responses.where((r) => r.responder == null).toList()
      ..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
    return [for (final r in mine) _response(r, own)];
  }

  @override
  Future<SupplierResponse> submitResponse(SupplierResponseDraft draft) async {
    await _wait();
    final own = _own(CompanyPermission.respondToSupplierRequests);
    final match = _listings.where((l) => l.id == draft.requestId);
    if (match.isEmpty) throw _notFound;
    final eligibility = SupplierResponseRules.eligibility(
      request: _opportunity(match.first, own),
      responder: own,
      alreadyResponded: _responded(draft.requestId),
    );
    if (!eligibility.isEligible) throw _forbidden;
    final projects = [
      for (final p in _projects)
        if (draft.projectIds.contains(p.id)) p,
    ];
    if (draft.validate().isNotEmpty ||
        projects.length != draft.projectIds.toSet().length) {
      throw _invalid;
    }
    final price = draft.proposedPrice?.trim();
    final now = DateTime.now();
    final response = _Response(
      id: _id('response'),
      requestId: draft.requestId,
      message: _same(draft.message.trim()),
      price: price == null || price.isEmpty ? null : _same(price),
      projects: projects,
      status: SupplierResponseStatus.submitted,
      submittedAt: now,
      updatedAt: now,
    );
    _responses.add(response);
    return _response(response, own);
  }

  @override
  Future<List<SupplierResponse>> getResponsesToMyRequest(
    String requestId,
  ) async {
    await _wait();
    final own = _own(CompanyPermission.manageOpportunities);
    final listing = _ownListing(requestId);
    if (listing.type != OpportunityType.supplierRequest) throw _notFound;
    final list = _responses.where((r) => r.requestId == requestId).toList()
      ..sort((a, b) => b.updatedAt.compareTo(a.updatedAt));
    return [for (final r in list) _response(r, own)];
  }

  @override
  Future<SupplierResponse> getResponse(String id) async {
    await _wait();
    final own = membership()?.company;
    if (own == null) throw _forbidden;
    final match = _responses.where((r) => r.id == id);
    if (match.isEmpty) throw _notFound;
    final r = match.first;
    final toMyRequest = _listings.any((l) => l.own && l.id == r.requestId);
    if (r.responder != null && !toMyRequest) throw _notFound;
    return _response(r, own);
  }

  @override
  Future<SupplierResponse> updateResponseStatus(
    String id,
    SupplierResponseStatus to,
  ) async {
    await _wait();
    final own = _own(CompanyPermission.manageOpportunities);
    final match = _responses.where((r) => r.id == id);
    if (match.isEmpty) throw _notFound;
    final r = match.first;
    // Only the buyer who owns the request manages its responses.
    _ownListing(r.requestId);
    if (!SupplierResponseRules.canTransition(r.status, to)) throw _invalid;
    final now = DateTime.now();
    r
      ..status = to
      ..updatedAt = now;
    if (SupplierResponseRules.selectionSettlesRequest(to)) {
      // Selecting one supplier settles the request: every other open
      // response is rejected and the request closes. Final in the MVP.
      for (final other in _responses) {
        if (other.requestId == r.requestId &&
            other.id != r.id &&
            !other.status.isFinal) {
          other
            ..status = SupplierResponseStatus.rejected
            ..updatedAt = now;
        }
      }
      final request = _ownListing(r.requestId);
      if (request.status == OpportunityStatus.published) {
        request
          ..status = OpportunityStatus.closed
          ..updatedAt = now;
      }
    }
    return _response(r, own);
  }

  // ── Seed data ──────────────────────────────────────────────────────────

  void _seed() {
    final company = membership()?.company;
    if (company == null) return;
    final now = DateTime.now();

    _projects.addAll(_seedProjects);

    final job = _Listing(
      id: 'my-stage-manager',
      type: OpportunityType.job,
      title: const MockText('Stage Manager', 'مدير مسرح'),
      city: const MockText('Riyadh', 'الرياض'),
      summary: const MockText(
        'Run show calls and backstage crews for a winter concert series.',
        'إدارة نداءات العرض وفرق الكواليس لسلسلة حفلات شتوية.',
      ),
      description: const MockText(
        'We are hiring a stage manager to run rehearsals, show calls and backstage crews across a twelve-night concert series.',
        'نبحث عن مدير مسرح لإدارة البروفات ونداءات العرض وفرق الكواليس في سلسلة حفلات من اثنتي عشرة ليلة.',
      ),
      employment: EmploymentType.contract,
      compensation: const MockText('SAR 16k / mo', '16 ألف ريال / شهريًا'),
      duration: const MockText('3 months', '3 أشهر'),
      responsibilities: const [
        MockText(
          'Call cues during live shows.',
          'إعطاء الإشارات أثناء العروض الحية.',
        ),
        MockText('Coordinate backstage crews.', 'تنسيق فرق الكواليس.'),
      ],
      requirements: const [
        MockText(
          '3+ years stage managing live events.',
          'خبرة 3 سنوات أو أكثر في إدارة المسرح.',
        ),
      ],
      skills: const [MockText('Show Calling', 'نداء العروض')],
      status: OpportunityStatus.published,
      updatedAt: now.subtract(const Duration(days: 3)),
      closesAt: now.add(const Duration(days: 18)),
    );
    _listings.addAll([
      job,
      _Listing(
        id: 'my-coop',
        type: OpportunityType.coOp,
        title: const MockText(
          'Production Co-op Program',
          'برنامج التدريب التعاوني في الإنتاج',
        ),
        city: const MockText('Riyadh', 'الرياض'),
        summary: const MockText(
          'Six months across production, logistics and show operations.',
          'ستة أشهر بين الإنتاج واللوجستيات وتشغيل العروض.',
        ),
        description: const MockText(
          'A structured placement for students enrolled in events or technical programs.',
          'تدريب منظم للطلاب الملتحقين ببرامج الفعاليات أو البرامج التقنية.',
        ),
        duration: const MockText('6 months', '6 أشهر'),
        status: OpportunityStatus.inReview,
        updatedAt: now.subtract(const Duration(hours: 5)),
      ),
      _Listing(
        id: 'my-volunteers',
        type: OpportunityType.volunteering,
        title: const MockText('Festival Volunteers', 'متطوعو المهرجان'),
        city: const MockText('Jeddah', 'جدة'),
        summary: const MockText(
          'Guest services during a weekend festival.',
          'خدمات الضيوف خلال مهرجان نهاية الأسبوع.',
        ),
        description: const MockText('', ''),
        duration: const MockText('1 weekend', 'عطلة نهاية أسبوع'),
        status: OpportunityStatus.draft,
        updatedAt: now.subtract(const Duration(days: 1)),
      ),
      _Listing(
        id: 'my-lighting-tech',
        type: OpportunityType.job,
        title: const MockText('Lighting Technician', 'فني إضاءة'),
        city: const MockText('Riyadh', 'الرياض'),
        summary: const MockText(
          'Lighting crew for a touring show.',
          'فريق إضاءة لعرض متنقل.',
        ),
        description: const MockText(
          'Rig and operate lighting for a touring production.',
          'تركيب وتشغيل الإضاءة لإنتاج متنقل.',
        ),
        employment: EmploymentType.freelance,
        status: OpportunityStatus.closed,
        updatedAt: now.subtract(const Duration(days: 40)),
      ),
    ]);

    _applicants.addAll([
      _Applicant(
        id: 'applicant-noura',
        reference: 'SM-2041',
        opportunityId: job.id,
        name: 'Noura Al-Harbi',
        headline: const MockText('Assistant Stage Manager', 'مساعدة مدير مسرح'),
        city: const MockText('Riyadh', 'الرياض'),
        skills: const [
          MockText('Show Calling', 'نداء العروض'),
          MockText('Crew Coordination', 'تنسيق الفرق'),
        ],
        verificationLevel: 1,
        status: ApplicationStatus.submitted,
        submittedAt: now.subtract(const Duration(hours: 9)),
        experience: [
          _Experience(
            'exp-n1',
            const MockText('Assistant Stage Manager', 'مساعدة مدير مسرح'),
            const MockText('Riyadh Season', 'موسم الرياض'),
            DateTime(2023, 9),
          ),
        ],
        projects: const [
          _PersonalProject(
            'proj-n1',
            2025,
            MockText('Concerts', 'حفلات'),
            MockText('Winter Concert Series', 'سلسلة حفلات الشتاء'),
            MockText('Assistant SM', 'مساعدة مدير المسرح'),
          ),
        ],
        statement: const MockText(
          'I called cues for 40 shows last season and would love to lead the backstage team.',
          'أعطيت الإشارات لأربعين عرضًا في الموسم الماضي وأتطلع لقيادة فريق الكواليس.',
        ),
        contact: const ApplicantContact(
          email: 'noura.h@example.sa',
          phone: '+966 50 111 2041',
        ),
        // Shares nothing: the privacy-first default.
      ),
      _Applicant(
        id: 'applicant-faisal',
        reference: 'SM-2037',
        opportunityId: job.id,
        name: 'Faisal Al-Otaibi',
        headline: const MockText('Production Coordinator', 'منسق إنتاج'),
        city: const MockText('Jeddah', 'جدة'),
        skills: const [MockText('Scheduling', 'الجدولة')],
        verificationLevel: 2,
        status: ApplicationStatus.shortlisted,
        submittedAt: now.subtract(const Duration(days: 2)),
        experience: [
          _Experience(
            'exp-f1',
            const MockText('Production Coordinator', 'منسق إنتاج'),
            const MockText('Jeddah Events', 'فعاليات جدة'),
            DateTime(2021, 2),
          ),
        ],
        contact: const ApplicantContact(
          email: 'faisal.o@example.sa',
          phone: '+966 55 222 2037',
        ),
        privacy: const ContactPrivacy(shareEmail: true, sharePhone: true),
      ),
      _Applicant(
        id: 'applicant-reem',
        reference: 'SM-2029',
        opportunityId: job.id,
        name: 'Reem Al-Zahrani',
        headline: const MockText('Stage Manager', 'مديرة مسرح'),
        city: const MockText('Riyadh', 'الرياض'),
        skills: const [
          MockText('Show Calling', 'نداء العروض'),
          MockText('Safety Briefings', 'إحاطات السلامة'),
        ],
        verificationLevel: 2,
        status: ApplicationStatus.contact,
        submittedAt: now.subtract(const Duration(days: 3)),
        experience: [
          _Experience(
            'exp-r1',
            const MockText('Stage Manager', 'مديرة مسرح'),
            const MockText('Boulevard City', 'بوليفارد سيتي'),
            DateTime(2020, 5),
          ),
        ],
        projects: const [
          _PersonalProject(
            'proj-r1',
            2024,
            MockText('Theatre', 'مسرح'),
            MockText('Boulevard Theatre Season', 'موسم مسرح البوليفارد'),
            MockText('Stage Manager', 'مديرة المسرح'),
          ),
        ],
        statement: const MockText(
          'Available from next month.',
          'متاحة من الشهر القادم.',
        ),
        contact: const ApplicantContact(
          email: 'reem.z@example.sa',
          phone: '+966 54 333 2029',
        ),
        // Shares email only.
        privacy: const ContactPrivacy(shareEmail: true),
      ),
      _Applicant(
        id: 'applicant-majed',
        reference: 'SM-2012',
        opportunityId: job.id,
        name: 'Majed Al-Qahtani',
        headline: const MockText('Event Crew Lead', 'قائد فريق فعاليات'),
        city: const MockText('Dammam', 'الدمام'),
        verificationLevel: 0,
        status: ApplicationStatus.rejected,
        submittedAt: now.subtract(const Duration(days: 5)),
        contact: const ApplicantContact(email: 'majed.q@example.sa'),
      ),
    ]);

    // Supplier requests from other buyers; each invites some company types.
    _listings.addAll([
      _Listing(
        id: 'request-led-wall',
        type: OpportunityType.supplierRequest,
        buyer: const CompanySummary(
          id: 'saudi-conventions',
          name: 'Saudi Conventions & Exhibitions',
          type: CompanyType.venue,
          verified: true,
        ),
        title: const MockText(
          'LED & Large Format Video Supply',
          'توريد شاشات LED وعرض بصري كبير',
        ),
        city: const MockText('Riyadh', 'الرياض'),
        summary: const MockText(
          'Supply and install a 600 m² IP65 LED wall with ground rigging.',
          'توريد وتركيب شاشة LED بمساحة 600 م² بتصنيف IP65 مع التعليق الأرضي.',
        ),
        description: const MockText(
          'Supply, install and operate an outdoor LED wall for a three-day expo. Include power distribution and a technician on site.',
          'توريد وتركيب وتشغيل شاشة LED خارجية لمعرض مدته ثلاثة أيام، مع توزيع الطاقة وفني في الموقع.',
        ),
        supplierTypes: const [CompanyType.supplier, CompanyType.production],
        status: OpportunityStatus.published,
        updatedAt: now.subtract(const Duration(days: 2)),
        closesAt: now.add(const Duration(days: 14)),
      ),
      _Listing(
        id: 'request-stage-lighting',
        type: OpportunityType.supplierRequest,
        buyer: const CompanySummary(
          id: 'midan',
          name: 'Midan Events',
          type: CompanyType.eventOrganizer,
          verified: true,
        ),
        title: const MockText('Stage Lighting Rental', 'تأجير إضاءة مسرحية'),
        city: const MockText('Diriyah', 'الدرعية'),
        summary: const MockText(
          '48 moving heads and a lighting console for two weeks.',
          '48 وحدة إضاءة متحركة ولوحة تحكم لمدة أسبوعين.',
        ),
        description: const MockText(
          'Rental of IP65 moving heads, console and cabling for an outdoor season opening.',
          'تأجير وحدات إضاءة متحركة بتصنيف IP65 ولوحة تحكم وكابلات لافتتاح موسم خارجي.',
        ),
        supplierTypes: const [CompanyType.supplier],
        status: OpportunityStatus.published,
        updatedAt: now.subtract(const Duration(days: 1)),
        closesAt: now.add(const Duration(days: 9)),
      ),
      _Listing(
        id: 'request-crew-services',
        type: OpportunityType.supplierRequest,
        buyer: const CompanySummary(
          id: 'sela',
          name: 'Sela Experience',
          type: CompanyType.venue,
          verified: true,
        ),
        title: const MockText('Crew Catering & Welfare', 'إعاشة ورعاية الفرق'),
        city: const MockText('AlUla', 'العلا'),
        summary: const MockText(
          'Meals and rest areas for 200 crew over ten days.',
          'وجبات ومناطق راحة لـ 200 من أفراد الفرق لمدة عشرة أيام.',
        ),
        description: const MockText(
          'Daily catering and welfare tents for build and show crews.',
          'إعاشة يومية وخيام راحة لفرق التجهيز والعروض.',
        ),
        supplierTypes: const [CompanyType.serviceProvider],
        status: OpportunityStatus.published,
        updatedAt: now.subtract(const Duration(days: 4)),
        closesAt: now.add(const Duration(days: 6)),
      ),
    ]);

    // Buyers also get one supplier request of their own, with responses.
    if (company.can(CompanyCapability.createSupplierRequest)) {
      final request = _Listing(
        id: 'my-sound-request',
        type: OpportunityType.supplierRequest,
        title: const MockText('Line Array Sound System', 'نظام صوت خطي'),
        city: const MockText('Riyadh', 'الرياض'),
        summary: const MockText(
          'Main PA and delay towers for a 15,000-capacity arena.',
          'نظام صوت رئيسي وأبراج تأخير لساحة تتسع لـ 15,000 شخص.',
        ),
        description: const MockText(
          'Supply, rig and operate the main PA with delay towers for four show nights.',
          'توريد وتعليق وتشغيل نظام الصوت الرئيسي مع أبراج التأخير لأربع ليالي عروض.',
        ),
        supplierTypes: const [CompanyType.supplier, CompanyType.production],
        status: OpportunityStatus.published,
        updatedAt: now.subtract(const Duration(days: 2)),
        closesAt: now.add(const Duration(days: 10)),
      );
      _listings.add(request);
      _responses.addAll([
        _Response(
          id: 'response-benchmark',
          requestId: request.id,
          responder: const CompanySummary(
            id: 'benchmark',
            name: 'Benchmark Arts & Production',
            type: CompanyType.supplier,
          ),
          message: const MockText(
            'We can supply a full line array with two delay towers, rigging and two system engineers.',
            'يمكننا توريد نظام صوت خطي كامل مع برجي تأخير والتعليق ومهندسَي نظام.',
          ),
          price: const MockText('SAR 180,000 all-in', '180,000 ريال شاملة'),
          projects: [_seedProjects.last],
          status: SupplierResponseStatus.reviewed,
          submittedAt: now.subtract(const Duration(days: 1)),
          updatedAt: now.subtract(const Duration(hours: 20)),
        ),
        _Response(
          id: 'response-noor',
          requestId: request.id,
          responder: const CompanySummary(
            id: 'noor-labs',
            name: 'Noor Production Labs',
            type: CompanyType.production,
            verified: true,
          ),
          message: const MockText(
            'Immersive audio design with a certified system tech on every show night.',
            'تصميم صوت غامر مع فني نظام معتمد في كل ليلة عرض.',
          ),
          status: SupplierResponseStatus.submitted,
          submittedAt: now.subtract(const Duration(hours: 7)),
          updatedAt: now.subtract(const Duration(hours: 7)),
        ),
      ]);
    }
  }
}

List<String> _clean(List<String> items) => [
  for (final i in items)
    if (i.trim().isNotEmpty) i.trim(),
];

MockText _same(String text) => MockText(text, text);

final _seedProjects = [
  _Project(
    id: 'project-winter-series',
    title: const MockText('Winter Concert Series', 'سلسلة حفلات الشتاء'),
    description: const MockText(
      'Full production for twelve outdoor concerts.',
      'إنتاج متكامل لاثني عشر حفلًا خارجيًا.',
    ),
    location: const MockText('Riyadh', 'الرياض'),
    category: const MockText('Live Production', 'الإنتاج الحي'),
    startedAt: DateTime(2025, 12),
    endedAt: DateTime(2026, 2),
    services: const [
      MockText('Staging', 'المسارح'),
      MockText('Show Management', 'إدارة العروض'),
    ],
    clientName: const MockText(
      'General Entertainment Authority',
      'الهيئة العامة للترفيه',
    ),
    image: AppAssets.concertStage,
  ),
  // Confidential client: no name.
  _Project(
    id: 'project-corporate-summit',
    title: const MockText(
      'Corporate Leadership Summit',
      'قمة القيادات المؤسسية',
    ),
    description: const MockText(
      'Stage, AV and delegate flow for 1,800 attendees.',
      'المسرح والصوت والصورة وتنظيم تدفق 1,800 مشارك.',
    ),
    location: const MockText('Jeddah', 'جدة'),
    category: const MockText('Corporate Events', 'فعاليات الشركات'),
    startedAt: DateTime(2025, 4, 14),
    services: const [MockText('Audio Visual', 'الصوت والصورة')],
    image: AppAssets.conventionHall,
  ),
];

class _Project {
  _Project({
    required this.id,
    required this.title,
    required this.description,
    required this.location,
    required this.category,
    required this.startedAt,
    this.endedAt,
    this.services = const [],
    this.clientName,
    this.image,
  });

  factory _Project.fromDraft(
    String id,
    CompanyProjectDraft d, {
    String? image,
  }) {
    final client = d.clientName?.trim();
    return _Project(
      id: id,
      title: _same(d.title.trim()),
      description: _same(d.description.trim()),
      location: _same(d.location.trim()),
      category: _same(d.category.trim()),
      startedAt: d.startedAt,
      endedAt: d.endedAt,
      services: [for (final s in _clean(d.services)) _same(s)],
      clientName: client == null || client.isEmpty ? null : _same(client),
      image: image,
    );
  }

  final String id;
  final MockText title;
  final MockText description;
  final MockText location;
  final MockText category;
  final DateTime startedAt;
  final DateTime? endedAt;
  final List<MockText> services;
  final MockText? clientName;
  final String? image;

  CompanyProject build(String companyId, String lang) => CompanyProject(
    id: id,
    companyId: companyId,
    title: title.of(lang),
    description: description.of(lang),
    location: location.of(lang),
    category: category.of(lang),
    startedAt: startedAt,
    endedAt: endedAt,
    services: [for (final s in services) s.of(lang)],
    images: [if (image != null) AppImage.asset(image!)],
    clientName: clientName?.of(lang),
  );
}

class _Listing {
  _Listing({
    required this.id,
    required this.type,
    required this.title,
    required this.city,
    required this.summary,
    required this.description,
    required this.status,
    required this.updatedAt,
    this.buyer,
    this.employment,
    this.compensation,
    this.duration,
    this.closesAt,
    this.responsibilities = const [],
    this.requirements = const [],
    this.skills = const [],
    this.supplierTypes = const [],
  });

  factory _Listing.fromDraft(String id, OpportunityDraft d) => _Listing(
    id: id,
    type: d.type,
    title: const MockText('', ''),
    city: const MockText('', ''),
    summary: const MockText('', ''),
    description: const MockText('', ''),
    status: OpportunityLifecycle.initial,
    updatedAt: DateTime.now(),
  )..apply(d);

  final String id;

  /// `null` for the signed-in company's own listings.
  final CompanySummary? buyer;
  OpportunityType type;
  MockText title;
  MockText city;
  MockText summary;
  MockText description;
  OpportunityStatus status;
  DateTime updatedAt;
  EmploymentType? employment;
  MockText? compensation;
  MockText? duration;
  DateTime? closesAt;
  List<MockText> responsibilities;
  List<MockText> requirements;
  List<MockText> skills;
  List<CompanyType> supplierTypes;

  /// What Back Of House asked to change on the listing itself.
  String? reviewerNote;

  /// Pending update to a published listing, reviewed on its own.
  OpportunityDraft? revisionDraft;
  OpportunityStatus revisionStatus = OpportunityStatus.draft;
  String? revisionNote;

  bool get own => buyer == null;

  void apply(OpportunityDraft d) {
    MockText? optional(String s) => s.trim().isEmpty ? null : _same(s.trim());
    type = d.type;
    title = _same(d.title.trim());
    city = _same(d.city.trim());
    summary = _same(d.summary.trim());
    description = _same(d.description.trim());
    employment = d.type == OpportunityType.job ? d.employment : null;
    compensation = optional(d.compensation);
    duration = optional(d.duration);
    responsibilities = [for (final s in _clean(d.responsibilities)) _same(s)];
    requirements = [for (final s in _clean(d.requirements)) _same(s)];
    skills = [for (final s in _clean(d.skills)) _same(s)];
    supplierTypes = d.type == OpportunityType.supplierRequest
        ? d.supplierTypes
        : const [];
    updatedAt = DateTime.now();
  }

  OpportunityDraft toDraft() => OpportunityDraft(
    type: type,
    title: title.en,
    city: city.en,
    summary: summary.en,
    description: description.en,
    employment: employment,
    compensation: compensation?.en ?? '',
    duration: duration?.en ?? '',
    supplierTypes: supplierTypes,
  );
}

class _Experience {
  const _Experience(this.id, this.role, this.company, this.start);

  final String id;
  final MockText role;
  final MockText company;
  final DateTime start;
  DateTime? get end => null;
}

class _PersonalProject {
  const _PersonalProject(
    this.id,
    this.year,
    this.category,
    this.title,
    this.role,
  );

  final String id;
  final int year;
  final MockText category;
  final MockText title;
  final MockText role;
}

class _Applicant {
  _Applicant({
    required this.id,
    required this.reference,
    required this.opportunityId,
    required this.name,
    required this.headline,
    required this.city,
    required this.verificationLevel,
    required this.status,
    required this.submittedAt,
    required this.contact,
    this.skills = const [],
    this.experience = const [],
    this.projects = const [],
    this.statement,
    this.privacy = const ContactPrivacy(),
  }) : updatedAt = submittedAt;

  final String id;
  final String reference;
  final String opportunityId;
  final String name;
  final MockText headline;
  final MockText city;
  final int verificationLevel;
  final List<MockText> skills;
  final List<_Experience> experience;
  final List<_PersonalProject> projects;
  final MockText? statement;
  final ApplicantContact contact;
  final ContactPrivacy privacy;
  final DateTime submittedAt;
  ApplicationStatus status;
  DateTime updatedAt;

  ProfileStatus get profileStatus => ProfileStatus.professional;
}

class _Response {
  _Response({
    required this.id,
    required this.requestId,
    required this.message,
    required this.status,
    required this.submittedAt,
    required this.updatedAt,
    this.responder,
    this.price,
    this.projects = const [],
  });

  final String id;
  final String requestId;

  /// `null` when the signed-in company responded.
  final CompanySummary? responder;
  final MockText message;
  final MockText? price;

  /// Snapshots of the projects offered as evidence.
  final List<_Project> projects;
  SupplierResponseStatus status;
  final DateTime submittedAt;
  DateTime updatedAt;
}

/// One workspace per signed-in company; signing in as another company
/// starts a fresh one.
final companyWorkspaceMockProvider = Provider<CompanyWorkspaceMock>((ref) {
  ref.watch(
    authControllerProvider.select((s) => s.value?.membership?.company.id),
  );
  final notifications = ref.watch(notificationsMockProvider);
  return CompanyWorkspaceMock(
    membership: () => ref.read(authControllerProvider).value?.membership,
    language: () => ref.read(contentLanguageProvider),
    latency: ref.watch(mockLatencyProvider),
    // Simulation only: the applicant is another account, so this records
    // the event the backend would deliver to them.
    onApplicantStatusChanged: (from, applicant) => notifications
        .recordApplicantStatusChange(from: from, applicant: applicant),
  );
});
