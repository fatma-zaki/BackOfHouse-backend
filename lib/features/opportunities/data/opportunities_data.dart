import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/data/mock_support.dart';
import '../../../core/l10n/content_language.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/utils/paginated.dart';
import '../../auth/domain/account_type.dart';
import '../../auth/presentation/controllers/auth_controller.dart';
import '../../companies/domain/company.dart';
import '../../companies/domain/company_type.dart';
import '../domain/opportunity.dart';

abstract interface class OpportunitiesDataSource {
  Future<Paginated<Opportunity>> getOpportunities(
    OpportunitiesQuery query,
    PageRequest request,
  );
  Future<Opportunity> getOpportunity(String id);
  Future<List<Opportunity>> getByCompany(String companyId);
  Future<int> countActive();
}

class OpportunitiesRepositoryImpl implements OpportunitiesRepository {
  const OpportunitiesRepositoryImpl(this._source);

  final OpportunitiesDataSource _source;

  @override
  Future<Paginated<Opportunity>> getOpportunities(
    OpportunitiesQuery query,
    PageRequest request,
  ) => _source.getOpportunities(query, request);

  @override
  Future<Opportunity> getOpportunity(String id) => _source.getOpportunity(id);

  @override
  Future<List<Opportunity>> getByCompany(String companyId) =>
      _source.getByCompany(companyId);

  @override
  Future<int> countActive() => _source.countActive();
}

/// Scopes results to the signed-in account the way the API does from the
/// access token.
class OpportunitiesMockDataSource implements OpportunitiesDataSource {
  OpportunitiesMockDataSource({
    required this.language,
    required this.latency,
    required this.audience,
  });

  final String Function() language;
  final Duration latency;
  final OpportunityAudience Function() audience;

  Future<void> _wait() => Future<void>.delayed(latency);

  bool _visible(_Mock m) => m.type.audience == audience();

  Opportunity _build(_Mock m) {
    final lang = language();
    final now = DateTime.now();
    return Opportunity(
      id: m.id,
      type: m.type,
      status: m.status,
      title: m.title.of(lang),
      company: m.company,
      city: m.city.of(lang),
      summary: m.summary.of(lang),
      postedAt: now.subtract(m.age),
      closesAt: m.closesIn == null ? null : now.add(m.closesIn!),
      // Sample data: jobs and co-op run on site, projects are hybrid.
      workSetup: switch (m.type) {
        OpportunityType.job || OpportunityType.coOp => WorkSetup.onSite,
        OpportunityType.project => WorkSetup.hybrid,
        _ => null,
      },
      applicants: m.applicants,
      employment: m.employment,
      compensation: m.compensation?.of(lang),
      duration: m.duration?.of(lang),
      description: m.description.of(lang),
      responsibilities: [for (final t in m.responsibilities) t.of(lang)],
      requirements: [for (final t in m.requirements) t.of(lang)],
      skills: [for (final t in m.skills) t.of(lang)],
      matchScore: m.match,
      matchReasons: [for (final t in m.reasons) t.of(lang)],
    );
  }

  @override
  Future<Paginated<Opportunity>> getOpportunities(
    OpportunitiesQuery query,
    PageRequest request,
  ) async {
    await _wait();
    final lang = language();
    final q = query.query.trim().toLowerCase();
    final matches = [
      for (final m in _mock)
        if (_visible(m) && m.status == OpportunityStatus.published)
          if (query.type == null || m.type == query.type)
            if (q.isEmpty ||
                m.title.of(lang).toLowerCase().contains(q) ||
                m.company.name.toLowerCase().contains(q) ||
                m.city.of(lang).toLowerCase().contains(q))
              m,
    ]..sort((a, b) => (b.match ?? 0).compareTo(a.match ?? 0));
    return Paginated.slice([for (final m in matches) _build(m)], request);
  }

  /// Also returns closed listings, so an applicant can still open one from
  /// their history. Company-facing types are not found for individuals.
  @override
  Future<Opportunity> getOpportunity(String id) async {
    await _wait();
    final match = _mock.where((m) => m.id == id && _visible(m));
    if (match.isEmpty) {
      throw const ApiException(type: ApiErrorType.notFound, statusCode: 404);
    }
    return _build(match.first);
  }

  @override
  Future<List<Opportunity>> getByCompany(String companyId) async {
    await _wait();
    final matches = [
      for (final m in _mock)
        if (_visible(m) &&
            m.status == OpportunityStatus.published &&
            m.company.id == companyId)
          m,
    ]..sort((a, b) => a.age.compareTo(b.age));
    return [for (final m in matches) _build(m)];
  }

  /// The directory is larger than the sample list.
  @override
  Future<int> countActive() async =>
      audience() == OpportunityAudience.individual ? 95 : 12;
}

/// TODO(api): select an `OpportunitiesRemoteDataSource` when
/// `AppConfig.useMockData` is false.
final opportunitiesDataSourceProvider = Provider<OpportunitiesDataSource>(
  (ref) => OpportunitiesMockDataSource(
    language: () => ref.read(contentLanguageProvider),
    latency: ref.watch(mockLatencyProvider),
    audience: () => OpportunityAudience.of(
      ref.read(authControllerProvider).value?.accountType ??
          AccountType.individual,
    ),
  ),
);

final opportunitiesRepositoryProvider = Provider<OpportunitiesRepository>(
  (ref) =>
      OpportunitiesRepositoryImpl(ref.watch(opportunitiesDataSourceProvider)),
);

// ── Mock content ───────────────────────────────────────────────────────────

const _midan = CompanySummary(
  id: 'midan',
  name: 'Midan Events',
  type: CompanyType.eventOrganizer,
  verified: true,
);
const _nexa = CompanySummary(
  id: 'nexa',
  name: 'NEXA Production',
  type: CompanyType.production,
  verified: true,
);
const _sela = CompanySummary(
  id: 'sela',
  name: 'Sela Experience',
  type: CompanyType.venue,
  verified: true,
);
const _soundStage = CompanySummary(
  id: 'sound-stage',
  name: 'Sound & Stage Co',
  type: CompanyType.serviceProvider,
);
const _benchmark = CompanySummary(
  id: 'benchmark',
  name: 'Benchmark Arts & Production',
  type: CompanyType.supplier,
);
const _conventions = CompanySummary(
  id: 'saudi-conventions',
  name: 'Saudi Conventions & Exhibitions',
  type: CompanyType.venue,
  verified: true,
);

const _riyadh = MockText('Riyadh', 'الرياض');

class _Mock {
  const _Mock({
    required this.id,
    required this.type,
    required this.company,
    required this.title,
    required this.city,
    required this.summary,
    required this.description,
    required this.age,
    required this.applicants,
    this.status = OpportunityStatus.published,
    this.employment,
    this.compensation,
    this.duration,
    this.closesIn,
    this.responsibilities = const [],
    this.requirements = const [],
    this.skills = const [],
    this.match,
    this.reasons = const [],
  });

  final String id;
  final OpportunityType type;
  final OpportunityStatus status;
  final CompanySummary company;
  final MockText title;
  final MockText city;
  final MockText summary;
  final MockText description;
  final Duration age;
  final Duration? closesIn;
  final int applicants;
  final EmploymentType? employment;
  final MockText? compensation;
  final MockText? duration;
  final List<MockText> responsibilities;
  final List<MockText> requirements;
  final List<MockText> skills;
  final int? match;
  final List<MockText> reasons;
}

const _mock = [
  _Mock(
    id: 'midan-tech-lead',
    type: OpportunityType.job,
    employment: EmploymentType.fullTime,
    company: _midan,
    title: MockText('Senior Technical Production Lead', 'قائد إنتاج تقني أول'),
    city: _riyadh,
    compensation: MockText('SAR 28k – 34k / mo', '28–34 ألف ريال / شهريًا'),
    summary: MockText(
      'Lead multi-venue staging across Riyadh Season flagship zones.',
      'قيادة التجهيزات المسرحية في عدة مواقع ضمن مناطق موسم الرياض الرئيسية.',
    ),
    description: MockText(
      'Midan Events is hiring a Senior Technical Production Lead to run multi-venue staging across Riyadh Season flagship zones, from structural stage builds and lighting grids to broadcast synchronization.',
      'تبحث ميدان للفعاليات عن قائد إنتاج تقني أول لإدارة التجهيزات المسرحية في عدة مواقع ضمن مناطق موسم الرياض الرئيسية، من بناء المسارح وشبكات الإضاءة إلى تزامن البث.',
    ),
    responsibilities: [
      MockText(
        'Run production schedules, load-in and rigging sequences for three arena-scale venues.',
        'إدارة جداول الإنتاج والتركيب وتسلسل التعليق لثلاثة مواقع بحجم الساحات.',
      ),
      MockText(
        'Lead a crew of 40+ sound, lighting and rigging technicians.',
        'قيادة فريق من أكثر من 40 فنيًا في الصوت والإضاءة والتعليق.',
      ),
      MockText(
        'Work with GEA and Civil Defense inspectors on permits and load tests.',
        'التنسيق مع مفتشي الهيئة العامة للترفيه والدفاع المدني بشأن التصاريح واختبارات الأحمال.',
      ),
    ],
    requirements: [
      MockText(
        '7+ years in live entertainment or large cultural production.',
        'خبرة 7 سنوات أو أكثر في الترفيه الحي أو الإنتاج الثقافي الكبير.',
      ),
      MockText(
        'Working knowledge of Saudi safety codes and GEA requirements.',
        'معرفة عملية بأنظمة السلامة السعودية ومتطلبات الهيئة العامة للترفيه.',
      ),
      MockText('Fluent English and Arabic.', 'إتقان العربية والإنجليزية.'),
    ],
    skills: [
      MockText('Technical Direction', 'الإدارة التقنية'),
      MockText('Arena Rigging', 'تعليق الساحات'),
      MockText('Civil Defense Compliance', 'الامتثال للدفاع المدني'),
      MockText('Crisis Management', 'إدارة الأزمات'),
    ],
    age: Duration(days: 2),
    closesIn: Duration(days: 5),
    applicants: 34,
    match: 98,
    reasons: [
      MockText(
        'Matches your Technical Production skills',
        'يتوافق مع مهاراتك في الإنتاج التقني',
      ),
      MockText('Riyadh-based role', 'وظيفة في الرياض'),
    ],
  ),
  _Mock(
    id: 'nexa-staging-supervisor',
    type: OpportunityType.job,
    employment: EmploymentType.contract,
    company: _nexa,
    title: MockText(
      'Lead Staging & Rigging Supervisor',
      'مشرف رئيسي للمسارح والتعليق',
    ),
    city: MockText('Diriyah', 'الدرعية'),
    compensation: MockText('SAR 18k – 22k / mo', '18–22 ألف ريال / شهريًا'),
    duration: MockText('6 months', '6 أشهر'),
    summary: MockText(
      'Supervise stage builds for the Diriyah season site.',
      'الإشراف على بناء المسارح في موقع موسم الدرعية.',
    ),
    description: MockText(
      'NEXA Production needs a staging and rigging supervisor for a six-month season contract, starting December 2026.',
      'تحتاج NEXA Production إلى مشرف للمسارح والتعليق بعقد موسمي مدته ستة أشهر يبدأ في ديسمبر 2026.',
    ),
    responsibilities: [
      MockText(
        'Supervise daily stage builds and rigging crews.',
        'الإشراف اليومي على بناء المسارح وفرق التعليق.',
      ),
      MockText(
        'Sign off load calculations with the site engineer.',
        'اعتماد حسابات الأحمال مع مهندس الموقع.',
      ),
    ],
    requirements: [
      MockText('Certified rigging qualification.', 'شهادة معتمدة في التعليق.'),
      MockText('Availability for the full season.', 'التفرغ طوال الموسم.'),
    ],
    skills: [
      MockText('Rigging & Trussing', 'التعليق والجمالونات'),
      MockText('Stage Management', 'إدارة المسرح'),
    ],
    age: Duration(days: 1),
    applicants: 18,
    match: 91,
    reasons: [
      MockText(
        'Matches your Stage Management skills',
        'يتوافق مع مهاراتك في إدارة المسرح',
      ),
    ],
  ),
  _Mock(
    id: 'sound-stage-audio',
    type: OpportunityType.job,
    employment: EmploymentType.freelance,
    company: _soundStage,
    title: MockText('Live Audio Systems Engineer', 'مهندس أنظمة صوت حي'),
    city: MockText('Diriyah', 'الدرعية'),
    compensation: MockText('SAR 2,200 / day', '2,200 ريال / يوميًا'),
    summary: MockText(
      'Freelance audio systems work for outdoor concerts.',
      'عمل حر في أنظمة الصوت للحفلات الخارجية.',
    ),
    description: MockText(
      'Freelance engineer to design and run line array systems for a series of outdoor concerts.',
      'مهندس بعمل حر لتصميم وتشغيل أنظمة السماعات لسلسلة من الحفلات الخارجية.',
    ),
    responsibilities: [
      MockText(
        'Design and tune line array coverage.',
        'تصميم تغطية مصفوفات الصوت وضبطها.',
      ),
    ],
    requirements: [
      MockText(
        'Experience with large outdoor systems.',
        'خبرة في الأنظمة الخارجية الكبيرة.',
      ),
    ],
    skills: [MockText('Live Sound', 'الصوت الحي')],
    age: Duration(hours: 2),
    applicants: 9,
    match: 86,
    reasons: [
      MockText(
        'Aligned with your broadcast experience',
        'يتوافق مع خبرتك في البث',
      ),
    ],
  ),
  _Mock(
    id: 'sela-mega-event',
    type: OpportunityType.project,
    company: _sela,
    title: MockText(
      'Technical Producer — AlUla Cultural Season',
      'منتج تقني — موسم العلا الثقافي',
    ),
    city: MockText('AlUla', 'العلا'),
    compensation: MockText('SAR 45,000 fee', 'أتعاب 45,000 ريال'),
    duration: MockText('4 months', '4 أشهر'),
    summary: MockText(
      'Project-based technical production for a multi-stage season.',
      'إنتاج تقني بنظام المشروع لموسم متعدد المسارح.',
    ),
    description: MockText(
      'A fixed-fee project for an independent technical producer to deliver multi-stage sound and laser synchronization.',
      'مشروع بأتعاب ثابتة لمنتج تقني مستقل لتنفيذ تزامن الصوت والليزر على عدة مسارح.',
    ),
    responsibilities: [
      MockText(
        'Plan and deliver show synchronization across stages.',
        'تخطيط تزامن العروض بين المسارح وتنفيذه.',
      ),
    ],
    requirements: [
      MockText(
        'Portfolio of multi-stage productions.',
        'سجل أعمال في الإنتاجات متعددة المسارح.',
      ),
    ],
    skills: [MockText('Show Control', 'التحكم بالعروض')],
    age: Duration(days: 4),
    closesIn: Duration(days: 21),
    applicants: 8,
    match: 82,
    reasons: [
      MockText(
        'Matches your festival operations experience',
        'يتوافق مع خبرتك في عمليات المهرجانات',
      ),
    ],
  ),
  _Mock(
    id: 'conventions-coop',
    type: OpportunityType.coOp,
    company: _conventions,
    title: MockText(
      'Event Operations Co-op Program',
      'برنامج التدريب التعاوني في عمليات الفعاليات',
    ),
    city: _riyadh,
    compensation: MockText(
      'SAR 4,000 / mo stipend',
      'مكافأة 4,000 ريال / شهريًا',
    ),
    duration: MockText('6 months', '6 أشهر'),
    summary: MockText(
      'Rotate through venue operations, production and guest services.',
      'تنقّل بين عمليات الموقع والإنتاج وخدمات الضيوف.',
    ),
    description: MockText(
      'A structured co-op placement across venue operations, technical production and guest services at Riyadh Front.',
      'تدريب تعاوني منظم في عمليات الموقع والإنتاج التقني وخدمات الضيوف في واجهة الرياض.',
    ),
    responsibilities: [
      MockText(
        'Support event build, live operations and breakdown.',
        'المساندة في تجهيز الفعاليات وتشغيلها وتفكيكها.',
      ),
    ],
    requirements: [
      MockText(
        'Enrolled in a university or diploma program.',
        'الالتحاق ببرنامج جامعي أو دبلوم.',
      ),
    ],
    skills: [MockText('Event Operations', 'عمليات الفعاليات')],
    age: Duration(days: 3),
    closesIn: Duration(days: 30),
    applicants: 41,
    // No match score: there is no defined matching rule for co-op.
  ),
  _Mock(
    id: 'diriyah-volunteer',
    type: OpportunityType.volunteering,
    company: _midan,
    title: MockText('Guest Experience Volunteer', 'متطوع تجربة الضيوف'),
    city: MockText('Diriyah', 'الدرعية'),
    duration: MockText('3 weeks', '3 أسابيع'),
    summary: MockText(
      'Welcome and guide visitors during the winter festival.',
      'استقبال الزوار وإرشادهم خلال المهرجان الشتوي.',
    ),
    description: MockText(
      'Volunteer shifts welcoming visitors, managing queues and supporting accessibility services.',
      'مناوبات تطوعية لاستقبال الزوار وتنظيم الطوابير ودعم خدمات ذوي الإعاقة.',
    ),
    responsibilities: [
      MockText(
        'Guide visitors and answer questions.',
        'إرشاد الزوار والإجابة عن أسئلتهم.',
      ),
    ],
    requirements: [
      MockText(
        'Available for at least 8 shifts.',
        'التفرغ لثماني مناوبات على الأقل.',
      ),
    ],
    skills: [MockText('Guest Services', 'خدمات الضيوف')],
    age: Duration(days: 6),
    closesIn: Duration(days: 12),
    applicants: 120,
    // No match score: there is no defined matching rule for volunteering.
  ),
  // Company-facing: never returned to individuals.
  _Mock(
    id: 'conventions-led-supply',
    type: OpportunityType.supplierRequest,
    company: _conventions,
    title: MockText(
      'LED & Large Format Video Supply',
      'توريد شاشات LED وعرض بصري كبير',
    ),
    city: _riyadh,
    summary: MockText(
      'Supply and install a 600 m² IP65 LED wall with ground rigging.',
      'توريد وتركيب شاشة LED بمساحة 600 م² بتصنيف IP65 مع التعليق الأرضي.',
    ),
    description: MockText(
      'Saudi Conventions & Exhibitions invites supplier companies to respond with capability and pricing.',
      'تدعو الشركة السعودية للمؤتمرات والمعارض الشركات الموردة لتقديم قدراتها وأسعارها.',
    ),
    age: Duration(days: 2),
    closesIn: Duration(days: 14),
    applicants: 12,
  ),
  // Closed listings kept for application history.
  _Mock(
    id: 'sela-production-director',
    type: OpportunityType.job,
    status: OpportunityStatus.closed,
    employment: EmploymentType.fullTime,
    company: _sela,
    title: MockText('Production Director', 'مدير إنتاج'),
    city: MockText('Jeddah', 'جدة'),
    compensation: MockText('SAR 40k / mo', '40 ألف ريال / شهريًا'),
    summary: MockText(
      'Direct production for destination experiences.',
      'إدارة الإنتاج لتجارب الوجهات.',
    ),
    description: MockText('This role has been filled.', 'تم شغل هذه الوظيفة.'),
    age: Duration(days: 60),
    applicants: 52,
  ),
  _Mock(
    id: 'benchmark-ops-lead',
    type: OpportunityType.job,
    employment: EmploymentType.contract,
    company: _benchmark,
    title: MockText('Event Operations Lead', 'قائد عمليات الفعاليات'),
    city: _riyadh,
    compensation: MockText('SAR 22k – 26k / mo', '22–26 ألف ريال / شهريًا'),
    duration: MockText('6 months', '6 أشهر'),
    summary: MockText(
      'Lead operations for touring arena productions.',
      'قيادة العمليات لإنتاجات الجولات في الساحات.',
    ),
    description: MockText(
      'Coordinate crews, logistics and schedules for touring arena productions.',
      'تنسيق الفرق والخدمات اللوجستية والجداول لإنتاجات الجولات في الساحات.',
    ),
    responsibilities: [
      MockText(
        'Coordinate load-in and load-out logistics.',
        'تنسيق لوجستيات التركيب والتفكيك.',
      ),
    ],
    requirements: [
      MockText(
        '5+ years in touring operations.',
        'خبرة 5 سنوات أو أكثر في عمليات الجولات.',
      ),
    ],
    skills: [MockText('Logistics', 'الخدمات اللوجستية')],
    age: Duration(days: 3),
    applicants: 26,
    match: 78,
  ),
];
