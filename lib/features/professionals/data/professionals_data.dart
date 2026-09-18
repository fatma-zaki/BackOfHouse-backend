import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_assets.dart';
import '../../../core/data/mock_support.dart';
import '../../../core/l10n/content_language.dart';
import '../../../core/media/app_image.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/utils/paginated.dart';
import '../domain/professional.dart';

abstract interface class ProfessionalsDataSource {
  Future<Paginated<Professional>> getProfessionals(PageRequest request);
  Future<Professional> setConnected(String id, {required bool connected});
  Future<int> countVerified();
}

class ProfessionalsRepositoryImpl implements ProfessionalsRepository {
  const ProfessionalsRepositoryImpl(this._source);

  final ProfessionalsDataSource _source;

  @override
  Future<Paginated<Professional>> getProfessionals(PageRequest request) =>
      _source.getProfessionals(request);

  @override
  Future<Professional> setConnected(String id, {required bool connected}) =>
      _source.setConnected(id, connected: connected);

  @override
  Future<int> countVerified() => _source.countVerified();
}

class ProfessionalsMockDataSource implements ProfessionalsDataSource {
  ProfessionalsMockDataSource({required this.language, required this.latency});

  final String Function() language;
  final Duration latency;

  final Set<String> _connected = {};

  Professional _build(_Mock m) {
    final lang = language();
    return Professional(
      id: m.id,
      name: m.name.of(lang),
      role: m.role.of(lang),
      company: m.company.of(lang),
      city: m.city.of(lang),
      yearsExperience: m.years,
      skills: [for (final s in m.skills) s.of(lang)],
      matchScore: m.match,
      availability: m.availability,
      avatar: m.photo == null ? null : AppImage.asset(m.photo!),
      verified: true,
      connected: _connected.contains(m.id),
    );
  }

  @override
  Future<Paginated<Professional>> getProfessionals(PageRequest request) async {
    await Future<void>.delayed(latency);
    return Paginated.slice([for (final m in _mock) _build(m)], request);
  }

  @override
  Future<Professional> setConnected(
    String id, {
    required bool connected,
  }) async {
    await Future<void>.delayed(latency);
    final match = _mock.where((m) => m.id == id);
    if (match.isEmpty) {
      throw const ApiException(type: ApiErrorType.notFound, statusCode: 404);
    }
    connected ? _connected.add(id) : _connected.remove(id);
    return _build(match.first);
  }

  @override
  Future<int> countVerified() async => 4200;
}

/// TODO(api): select a `ProfessionalsRemoteDataSource` when
/// `AppConfig.useMockData` is false.
final professionalsDataSourceProvider = Provider<ProfessionalsDataSource>(
  (ref) => ProfessionalsMockDataSource(
    language: () => ref.read(contentLanguageProvider),
    latency: ref.watch(mockLatencyProvider),
  ),
);

final professionalsRepositoryProvider = Provider<ProfessionalsRepository>(
  (ref) =>
      ProfessionalsRepositoryImpl(ref.watch(professionalsDataSourceProvider)),
);

class _Mock {
  const _Mock(
    this.id,
    this.name,
    this.role,
    this.company,
    this.city,
    this.years,
    this.skills,
    this.match,
    this.availability, [
    this.photo,
  ]);

  final String id;
  final MockText name;
  final MockText role;
  final MockText company;
  final MockText city;
  final int years;
  final List<MockText> skills;
  final int match;
  final Availability availability;
  final String? photo;
}

const _mock = [
  _Mock(
    'ziyad',
    MockText('Ziyad Al-Ghamdi', 'زياد الغامدي'),
    MockText(
      'Senior Scenographer & Lighting Designer',
      'مصمم مشاهد وإضاءة أول',
    ),
    MockText('Freelance', 'مستقل'),
    MockText('Riyadh', 'الرياض'),
    8,
    [
      MockText('Riyadh Season Alum', 'خبرة موسم الرياض'),
      MockText('GrandMA3 Master', 'خبير GrandMA3'),
    ],
    94,
    Availability.available,
  ),
  _Mock(
    'noura',
    MockText('Noura Al-Harbi', 'نورة الحربي'),
    MockText('Senior Event Producer', 'منتجة فعاليات أولى'),
    MockText('Riyadh Season Mega Projects', 'مشاريع موسم الرياض'),
    MockText('Riyadh', 'الرياض'),
    8,
    [
      MockText('Mega-Event Staging', 'مسارح الفعاليات الكبرى'),
      MockText('Civil Defense Code 104', 'كود الدفاع المدني 104'),
    ],
    91,
    Availability.available,
    AppAssets.headshotDirector,
  ),
  _Mock(
    'faisal',
    MockText('Faisal Al-Qahtani', 'فيصل القحطاني'),
    MockText('Technical Production Lead', 'قائد الإنتاج التقني'),
    MockText('Midan Events', 'ميدان للفعاليات'),
    MockText('Diriyah', 'الدرعية'),
    11,
    [
      MockText('IP65 Rigging Automation', 'أتمتة التعليق IP65'),
      MockText('Truss Telemetry', 'قياس الجمالونات'),
    ],
    88,
    Availability.inProduction,
  ),
  _Mock(
    'lama',
    MockText('Lama Al-Otaibi', 'لمى العتيبي'),
    MockText('Head of Guest Experience', 'رئيسة تجربة الضيوف'),
    MockText('Sela Experience', 'سيلا'),
    MockText('Jeddah', 'جدة'),
    10,
    [
      MockText('Diplomatic Protocol', 'البروتوكول الدبلوماسي'),
      MockText('Crowd Flow Architecture', 'تصميم حركة الحشود'),
    ],
    83,
    Availability.fullyBooked,
  ),
];
