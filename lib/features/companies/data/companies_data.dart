import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_assets.dart';
import '../../../core/data/mock_support.dart';
import '../../../core/l10n/content_language.dart';
import '../../../core/media/app_image.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/utils/paginated.dart';
import '../domain/company.dart';
import '../domain/company_project.dart';
import '../domain/company_type.dart';

abstract interface class CompaniesDataSource {
  Future<Paginated<Company>> getCompanies(PageRequest request);
  Future<Company> getCompany(String id);
  Future<Company> setFollowing(String id, {required bool following});
  Future<int> countVerified();
  Future<List<CompanyProject>> getProjects(String companyId);
}

class CompaniesRepositoryImpl implements CompaniesRepository {
  const CompaniesRepositoryImpl(this._source);

  final CompaniesDataSource _source;

  @override
  Future<Paginated<Company>> getCompanies(PageRequest request) =>
      _source.getCompanies(request);

  @override
  Future<Company> getCompany(String id) => _source.getCompany(id);

  @override
  Future<Company> setFollowing(String id, {required bool following}) =>
      _source.setFollowing(id, following: following);

  @override
  Future<int> countVerified() => _source.countVerified();

  @override
  Future<List<CompanyProject>> getProjects(String companyId) =>
      _source.getProjects(companyId);
}

class CompaniesMockDataSource implements CompaniesDataSource {
  CompaniesMockDataSource({required this.language, required this.latency});

  final String Function() language;
  final Duration latency;

  final Set<String> _followed = {};

  Company _build(_Mock m) {
    final lang = language();
    return Company(
      id: m.id,
      name: m.name,
      type: m.type,
      specialization: m.specialization.of(lang),
      city: m.city.of(lang),
      description: m.description.of(lang),
      services: [for (final c in m.services) c.of(lang)],
      openOpportunities: m.openOpportunities,
      completedProjects: m.completedProjects,
      verified: m.verified,
      followed: _followed.contains(m.id),
    );
  }

  @override
  Future<Paginated<Company>> getCompanies(PageRequest request) async {
    await Future<void>.delayed(latency);
    return Paginated.slice([for (final m in _mock) _build(m)], request);
  }

  _Mock _find(String id) {
    final match = _mock.where((m) => m.id == id);
    if (match.isEmpty) {
      throw const ApiException(type: ApiErrorType.notFound, statusCode: 404);
    }
    return match.first;
  }

  @override
  Future<Company> getCompany(String id) async {
    await Future<void>.delayed(latency);
    return _build(_find(id));
  }

  @override
  Future<Company> setFollowing(String id, {required bool following}) async {
    await Future<void>.delayed(latency);
    final m = _find(id);
    following ? _followed.add(id) : _followed.remove(id);
    return _build(m);
  }

  /// The directory is larger than the sample list.
  @override
  Future<int> countVerified() async => 840;

  @override
  Future<List<CompanyProject>> getProjects(String companyId) async {
    await Future<void>.delayed(latency);
    final lang = language();
    return [
      for (final p in _mockProjects)
        if (p.companyId == companyId)
          CompanyProject(
            id: p.id,
            companyId: p.companyId,
            title: p.title.of(lang),
            description: p.description.of(lang),
            location: p.location.of(lang),
            category: p.category.of(lang),
            startedAt: p.startedAt,
            endedAt: p.endedAt,
            services: [for (final s in p.services) s.of(lang)],
            images: [AppImage.asset(p.image)],
            clientName: p.clientName?.of(lang),
          ),
    ];
  }
}

/// TODO(api): select a `CompaniesRemoteDataSource` when
/// `AppConfig.useMockData` is false.
final companiesDataSourceProvider = Provider<CompaniesDataSource>(
  (ref) => CompaniesMockDataSource(
    language: () => ref.read(contentLanguageProvider),
    latency: ref.watch(mockLatencyProvider),
  ),
);

final companiesRepositoryProvider = Provider<CompaniesRepository>(
  (ref) => CompaniesRepositoryImpl(ref.watch(companiesDataSourceProvider)),
);

class _Mock {
  const _Mock(
    this.id,
    this.name,
    this.type,
    this.specialization,
    this.city,
    this.description,
    this.services,
    this.openOpportunities,
    this.completedProjects, {
    this.verified = true,
  });

  final String id;
  final String name;
  final CompanyType type;
  final MockText specialization;
  final MockText city;
  final MockText description;
  final List<MockText> services;
  final int openOpportunities;
  final int completedProjects;
  final bool verified;
}

const _riyadh = MockText('Riyadh', 'الرياض');
const _jeddah = MockText('Jeddah', 'جدة');

const _mock = [
  _Mock(
    'nexa',
    'NEXA Production',
    CompanyType.production,
    MockText('Staging & Rigging', 'المسارح والتعليق'),
    _riyadh,
    MockText(
      'Integrated staging, heavy rigging and broadcast infrastructure for Saudi mega-events.',
      'مسارح متكاملة وتعليق ثقيل وبنية بث للفعاليات الكبرى في السعودية.',
    ),
    [
      MockText('Turnkey Staging', 'مسارح متكاملة'),
      MockText('Rigging & Trussing', 'التعليق والجمالونات'),
      MockText('LED Systems', 'أنظمة LED'),
    ],
    3,
    140,
  ),
  _Mock(
    'midan',
    'Midan Events',
    CompanyType.eventOrganizer,
    MockText('Live Entertainment', 'الترفيه الحي'),
    _riyadh,
    MockText(
      'Production management partner delivering multi-venue arena events.',
      'شريك إدارة إنتاج لتنفيذ الفعاليات متعددة المواقع.',
    ),
    [
      MockText('Technical Direction', 'الإدارة التقنية'),
      MockText('Stage Management', 'إدارة المسرح'),
    ],
    5,
    148,
  ),
  _Mock(
    'sela',
    'Sela Experience',
    CompanyType.venue,
    MockText('Mega-Events & Venues', 'الفعاليات الكبرى والمواقع'),
    _jeddah,
    MockText(
      'Destination experiences, temporary structures and world-class live attractions.',
      'تجارب وجهات ومنشآت مؤقتة وعروض حية عالمية.',
    ),
    [
      MockText('Experiential Staging', 'مسارح تفاعلية'),
      MockText('Architectural Lighting', 'إضاءة معمارية'),
    ],
    2,
    42,
  ),
  _Mock(
    'benchmark',
    'Benchmark Arts & Production',
    CompanyType.supplier,
    MockText('Live Sound & Video', 'الصوت والصورة الحية'),
    _jeddah,
    MockText(
      'Live sound, trussing and large format video for international arena tours.',
      'صوت حي وجمالونات وشاشات عرض كبيرة للجولات الدولية.',
    ),
    [
      MockText('LED Wall Mapping', 'إسقاط شاشات LED'),
      MockText('Line Array Systems', 'أنظمة السماعات'),
    ],
    1,
    38,
    verified: false,
  ),
  _Mock(
    'noor-labs',
    'Noor Production Labs',
    CompanyType.serviceProvider,
    MockText('Technical Staging & Audio', 'المسارح التقنية والصوت'),
    _riyadh,
    MockText(
      'Technical staging and immersive audio for cultural premieres.',
      'مسارح تقنية وصوت غامر للعروض الثقافية الأولى.',
    ),
    [MockText('Immersive Audio', 'صوت غامر')],
    4,
    29,
  ),
  _Mock(
    'sound-stage',
    'Sound & Stage Co',
    CompanyType.serviceProvider,
    MockText('Audio & Backline', 'الصوت والمعدات الموسيقية'),
    _riyadh,
    MockText(
      'Audio crews, backline and stage technicians for concerts and corporate shows.',
      'فرق صوت ومعدات موسيقية وفنيو مسرح للحفلات والفعاليات المؤسسية.',
    ),
    [
      MockText('Live Audio Crews', 'فرق الصوت الحي'),
      MockText('Backline Rental', 'تأجير المعدات الموسيقية'),
    ],
    2,
    17,
    verified: false,
  ),
  _Mock(
    'saudi-conventions',
    'Saudi Conventions & Exhibitions',
    CompanyType.venue,
    MockText('Conventions & Exhibitions', 'المؤتمرات والمعارض'),
    _riyadh,
    MockText(
      "Convention halls and exhibition floors hosting the Kingdom's largest trade shows.",
      'قاعات مؤتمرات وأرضيات معارض تستضيف أكبر المعارض التجارية في المملكة.',
    ),
    [
      MockText('Exhibition Halls', 'قاعات المعارض'),
      MockText('Conference Production', 'إنتاج المؤتمرات'),
    ],
    3,
    64,
  ),
];

class _MockProject {
  const _MockProject({
    required this.id,
    required this.companyId,
    required this.title,
    required this.description,
    required this.location,
    required this.category,
    required this.startedAt,
    required this.image,
    this.endedAt,
    this.services = const [],
    this.clientName,
  });

  final String id;
  final String companyId;
  final MockText title;
  final MockText description;
  final MockText location;
  final MockText category;
  final DateTime startedAt;
  final DateTime? endedAt;
  final String image;
  final List<MockText> services;
  final MockText? clientName;
}

final _mockProjects = [
  _MockProject(
    id: 'nexa-noor-riyadh',
    companyId: 'nexa',
    title: const MockText(
      'Noor Riyadh Pavilion Staging',
      'مسرح جناح نور الرياض',
    ),
    description: const MockText(
      'Turnkey staging and rigging for a 45,000-capacity light art pavilion, delivered in 18 days.',
      'مسرح وتعليق متكاملان لجناح فنون ضوئية يتسع لـ 45,000 زائر، نُفّذ خلال 18 يومًا.',
    ),
    location: const MockText('Riyadh', 'الرياض'),
    category: const MockText('Technical Production', 'الإنتاج التقني'),
    startedAt: DateTime(2024, 11, 1),
    endedAt: DateTime(2024, 11, 18),
    image: AppAssets.festivalStage,
    services: const [
      MockText('Turnkey Staging', 'مسارح متكاملة'),
      MockText('Rigging & Trussing', 'التعليق والجمالونات'),
    ],
    clientName: const MockText(
      'Royal Commission for Riyadh City',
      'الهيئة الملكية لمدينة الرياض',
    ),
  ),
  // Confidential client: no name is published.
  _MockProject(
    id: 'nexa-arena-tour',
    companyId: 'nexa',
    title: const MockText(
      'Arena Tour Main Stage',
      'المسرح الرئيسي لجولة الساحات',
    ),
    description: const MockText(
      'Main stage, LED wall and flown audio for a six-city arena tour.',
      'المسرح الرئيسي وشاشة LED والصوت المعلّق لجولة في ست مدن.',
    ),
    location: const MockText('Riyadh & Jeddah', 'الرياض وجدة'),
    category: const MockText('Touring', 'الجولات'),
    startedAt: DateTime(2023, 10, 5),
    endedAt: DateTime(2023, 12, 20),
    image: AppAssets.concertStage,
    services: const [MockText('LED Systems', 'أنظمة LED')],
  ),
  _MockProject(
    id: 'midan-season-zone',
    companyId: 'midan',
    title: const MockText(
      'Riyadh Season Zone Operations',
      'تشغيل منطقة في موسم الرياض',
    ),
    description: const MockText(
      'Production management across three venues for a full season.',
      'إدارة الإنتاج في ثلاثة مواقع طوال الموسم.',
    ),
    location: const MockText('Riyadh', 'الرياض'),
    category: const MockText('Event Management', 'إدارة الفعاليات'),
    startedAt: DateTime(2025, 10, 10),
    endedAt: DateTime(2026, 3, 15),
    image: AppAssets.conventionHall,
    services: const [MockText('Technical Direction', 'الإدارة التقنية')],
  ),
];
