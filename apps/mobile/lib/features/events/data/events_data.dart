import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_assets.dart';
import '../../../core/data/mock_support.dart';
import '../../../core/l10n/content_language.dart';
import '../../../core/media/app_image.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/utils/paginated.dart';
import '../domain/event.dart';

/// Transport for events: the API client or the in-memory mock.
abstract interface class EventsDataSource {
  Future<Paginated<Event>> getEvents(EventsQuery query, PageRequest request);
  Future<Event> getEvent(String id);
  Future<Event> setRegistration(String id, {required bool registered});
  Future<int> countUpcoming();
}

class EventsRepositoryImpl implements EventsRepository {
  const EventsRepositoryImpl(this._source);

  final EventsDataSource _source;

  @override
  Future<Paginated<Event>> getEvents(EventsQuery query, PageRequest request) =>
      _source.getEvents(query, request);

  @override
  Future<Event> getEvent(String id) => _source.getEvent(id);

  @override
  Future<Event> setRegistration(String id, {required bool registered}) =>
      _source.setRegistration(id, registered: registered);

  @override
  Future<int> countUpcoming() => _source.countUpcoming();
}

class EventsMockDataSource implements EventsDataSource {
  EventsMockDataSource({required this.language, required this.latency});

  final String Function() language;
  final Duration latency;

  final Set<String> _registered = {};

  Future<void> _wait() => Future<void>.delayed(latency);

  Event _build(_MockEvent m) {
    final lang = language();
    final registered = _registered.contains(m.id);
    final extra = _extras[m.id];
    final index = _mockEvents.indexOf(m);
    return Event(
      id: m.id,
      title: m.title.of(lang),
      type: m.type,
      startsAt: m.startsAt,
      endsAt: m.startsAt.add(Duration(days: (extra?.days ?? 1) - 1, hours: 8)),
      city: m.city.of(lang),
      venue: m.venue.of(lang),
      organizer: m.organizer.of(lang),
      description: m.description.of(lang),
      topics: [for (final t in m.topics) t.of(lang)],
      attendees: m.attendees + (registered ? 1 : 0),
      image: AppImage.asset(_photos[index % _photos.length]),
      isRegistered: registered,
      passCode: registered ? 'RUH-26-${9400 + index * 37}' : null,
      networkPeers: 6 + (m.attendees ~/ 40) % 14,
      matchScore: (extra?.accredited ?? false)
          ? 98 - index
          : 74 + (index * 7) % 18,
      organizerVerified: true,
      accredited: extra?.accredited ?? false,
      pointsReward: extra?.points ?? 10,
      speakers: [
        for (final sp in extra?.speakers ?? const <_MockSpeaker>[])
          EventSpeaker(
            name: sp.name.of(lang),
            role: sp.role.of(lang),
            organization: sp.org.of(lang),
            photo: sp.photo == null ? null : AppImage.asset(sp.photo!),
            host: sp.host,
          ),
      ],
      agenda: [
        for (final a in extra?.agenda ?? const <_MockAgenda>[])
          AgendaItem(
            day: a.day,
            startsAt: m.startsAt.add(
              Duration(days: a.day - 1, minutes: a.startMinutes - 600),
            ),
            endsAt: m.startsAt.add(
              Duration(days: a.day - 1, minutes: a.endMinutes - 600),
            ),
            title: a.title.of(lang),
            description: a.description.of(lang),
            format: a.format?.of(lang),
            keynote: a.keynote,
          ),
      ],
    );
  }

  @override
  Future<int> countUpcoming() async => 120;

  @override
  Future<Paginated<Event>> getEvents(
    EventsQuery query,
    PageRequest request,
  ) async {
    await _wait();
    final q = query.query.trim().toLowerCase();
    final lang = language();
    final matches = [
      for (final m in _mockEvents)
        if (query.type == null || m.type == query.type)
          if (q.isEmpty ||
              m.title.of(lang).toLowerCase().contains(q) ||
              m.city.of(lang).toLowerCase().contains(q))
            _build(m),
    ];
    return Paginated.slice(matches, request);
  }

  @override
  Future<Event> getEvent(String id) async {
    await _wait();
    final match = _mockEvents.where((m) => m.id == id);
    if (match.isEmpty) {
      throw const ApiException(type: ApiErrorType.notFound, statusCode: 404);
    }
    return _build(match.first);
  }

  @override
  Future<Event> setRegistration(String id, {required bool registered}) async {
    await _wait();
    registered ? _registered.add(id) : _registered.remove(id);
    return getEvent(id);
  }
}

/// TODO(api): select an `EventsRemoteDataSource` when
/// `AppConfig.useMockData` is false.
final eventsDataSourceProvider = Provider<EventsDataSource>((ref) {
  return EventsMockDataSource(
    language: () => ref.read(contentLanguageProvider),
    latency: ref.watch(mockLatencyProvider),
  );
});

final eventsRepositoryProvider = Provider<EventsRepository>(
  (ref) => EventsRepositoryImpl(ref.watch(eventsDataSourceProvider)),
);

class _MockEvent {
  const _MockEvent(
    this.id,
    this.type,
    this.startsAt,
    this.title,
    this.city,
    this.venue,
    this.organizer,
    this.description,
    this.topics,
    this.attendees,
  );

  final String id;
  final EventType type;
  final DateTime startsAt;
  final MockText title;
  final MockText city;
  final MockText venue;
  final MockText organizer;
  final MockText description;
  final List<MockText> topics;
  final int attendees;
}

const _riyadh = MockText('Riyadh, Saudi Arabia', 'الرياض، السعودية');
const _jeddah = MockText('Jeddah, Saudi Arabia', 'جدة، السعودية');
const _conference = MockText('Conference', 'مؤتمر');
const _networking = MockText('Networking', 'تواصل');
const _tech = MockText('Tech', 'تقنية');
const _production = MockText('Production', 'إنتاج');
const _community = MockText('Community', 'مجتمع');

final _mockEvents = [
  _MockEvent(
    'tech-innovation',
    EventType.conference,
    DateTime(2026, 9, 28, 10),
    const MockText(
      'Tech & Innovation in Events',
      'التقنية والابتكار في الفعاليات',
    ),
    _riyadh,
    const MockText('Riyadh Front Exhibition Centre', 'مركز معارض واجهة الرياض'),
    const MockText('Back of House', 'باك أوف هاوس'),
    const MockText(
      'A full day on the tools changing live production: real-time analytics, AI-assisted show control and sustainable staging.',
      'يوم كامل عن الأدوات التي تغيّر الإنتاج الحي: التحليلات اللحظية، والتحكم بالعروض بمساعدة الذكاء الاصطناعي، والمسارح المستدامة.',
    ),
    const [_conference, _tech],
    320,
  ),
  _MockEvent(
    'summit-2025',
    EventType.conference,
    DateTime(2026, 10, 24, 9),
    const MockText('Saudi Events Summit 2026', 'قمة الفعاليات السعودية 2026'),
    _riyadh,
    const MockText(
      'King Abdulaziz International Conference Center',
      'مركز الملك عبدالعزيز الدولي للمؤتمرات',
    ),
    const MockText('Saudi Events Association', 'جمعية الفعاليات السعودية'),
    const MockText(
      "The Kingdom's largest gathering of event organisers, producers and venue operators.",
      'أكبر تجمع لمنظمي الفعاليات والمنتجين ومشغلي المواقع في المملكة.',
    ),
    const [_conference, _networking],
    1250,
  ),
  _MockEvent(
    'tech-expo',
    EventType.expo,
    DateTime(2026, 11, 12, 11),
    const MockText('Event Technology Expo', 'معرض تقنيات الفعاليات'),
    _jeddah,
    const MockText('Jeddah Superdome', 'جدة سوبردوم'),
    const MockText('Stagecraft Arabia', 'ستيجكرافت العربية'),
    const MockText(
      'Hands-on demos of LED walls, rigging systems and ticketing platforms from 80 exhibitors.',
      'عروض عملية لشاشات LED وأنظمة التعليق ومنصات التذاكر من 80 عارضًا.',
    ),
    const [_tech, _production],
    180,
  ),
  _MockEvent(
    'production-forum',
    EventType.workshop,
    DateTime(2026, 11, 28, 16),
    const MockText(
      'Live Events Production Forum',
      'ملتقى إنتاج الفعاليات الحية',
    ),
    _riyadh,
    const MockText('Boulevard Riyadh City', 'بوليفارد رياض سيتي'),
    const MockText('Back of House', 'باك أوف هاوس'),
    const MockText(
      'Small-group workshops on show calling, crew safety and running a production office.',
      'ورش في مجموعات صغيرة عن إدارة العروض وسلامة الفرق وتشغيل مكتب الإنتاج.',
    ),
    const [_production, _community],
    120,
  ),
  _MockEvent(
    'mena-meetup',
    EventType.networking,
    DateTime(2026, 12, 15, 19),
    const MockText(
      'MENA Event Professionals Meetup',
      'لقاء محترفي الفعاليات في المنطقة',
    ),
    _jeddah,
    const MockText('Hayy Jameel', 'حي جميل'),
    const MockText('Back of House Community', 'مجتمع باك أوف هاوس'),
    const MockText(
      'An evening to meet crews, freelancers and agencies working across the region.',
      'أمسية للتعرف على الفرق والمستقلين والوكالات العاملين في المنطقة.',
    ),
    const [_networking, _community],
    95,
  ),
  _MockEvent(
    'lighting-workshop',
    EventType.workshop,
    DateTime(2027, 1, 9, 14),
    const MockText('Stage Lighting Masterclass', 'ورشة احترافية لإضاءة المسرح'),
    _riyadh,
    const MockText('Misk Art Institute', 'معهد مسك للفنون'),
    const MockText('Lumen Studio', 'استوديو لومن'),
    const MockText(
      'Programme a full rig with a senior lighting designer, from focus to cue stack.',
      'برمج منظومة إضاءة كاملة مع مصمم إضاءة خبير، من الضبط حتى تسلسل الإشارات.',
    ),
    const [_production, _tech],
    40,
  ),
  _MockEvent(
    'riyadh-season-crew',
    EventType.networking,
    DateTime(2027, 2, 3, 20),
    const MockText('Riyadh Season Crew Night', 'ليلة فرق موسم الرياض'),
    _riyadh,
    const MockText('Via Riyadh', 'فيا رياض'),
    const MockText('General Entertainment Authority', 'الهيئة العامة للترفيه'),
    const MockText(
      'Celebrating the people behind the season, with recruiters for 2027 productions.',
      'احتفاء بالعاملين خلف الموسم، مع جهات توظيف لإنتاجات 2027.',
    ),
    const [_community, _networking],
    410,
  ),
  _MockEvent(
    'expo-venues',
    EventType.expo,
    DateTime(2027, 3, 18, 10),
    const MockText('Venues & Hospitality Expo', 'معرض المواقع والضيافة'),
    _jeddah,
    const MockText(
      'Jeddah Center for Forums & Events',
      'مركز جدة للمنتديات والفعاليات',
    ),
    const MockText('Venue Arabia', 'فينيو العربية'),
    const MockText(
      'Meet venue operators and catering partners for your next production.',
      'تعرّف على مشغلي المواقع وشركاء الضيافة لإنتاجك القادم.',
    ),
    const [_production],
    260,
  ),
];

const _photos = [
  AppAssets.conventionHall,
  AppAssets.auditorium,
  AppAssets.concertStage,
  AppAssets.festivalStage,
];

class _MockSpeaker {
  const _MockSpeaker(
    this.name,
    this.role,
    this.org, {
    this.photo,
    this.host = false,
  });

  final MockText name;
  final MockText role;
  final MockText org;
  final String? photo;
  final bool host;
}

class _MockAgenda {
  const _MockAgenda(
    this.day,
    this.startMinutes,
    this.endMinutes,
    this.title,
    this.description, {
    this.format,
    this.keynote = false,
  });

  final int day;

  /// Minutes after midnight.
  final int startMinutes;
  final int endMinutes;
  final MockText title;
  final MockText description;
  final MockText? format;
  final bool keynote;
}

class _MockExtra {
  const _MockExtra({
    this.days = 1,
    this.accredited = false,
    this.points = 10,
    this.speakers = const [],
    this.agenda = const [],
  });

  final int days;
  final bool accredited;
  final int points;
  final List<_MockSpeaker> speakers;
  final List<_MockAgenda> agenda;
}

const _flagshipAgenda = [
  _MockAgenda(
    1,
    540,
    600,
    MockText(
      'Delegate Credential Issuance & Executive Networking',
      'إصدار اعتمادات المندوبين والتواصل التنفيذي',
    ),
    MockText(
      'Private breakfast showcase in the VIP Pavilion. On-site technical identity checks.',
      'فطور خاص في جناح كبار الزوار مع التحقق من الهوية التقنية.',
    ),
    format: MockText('Registration', 'التسجيل'),
  ),
  _MockAgenda(
    1,
    600,
    675,
    MockText(
      'Scaling Saudi Staging Infrastructure: The 2030 Horizon',
      'توسيع بنية المسارح السعودية: أفق 2030',
    ),
    MockText(
      'Analyzing 400-ton ground load limits and unified safety codes across desert sites.',
      'تحليل حدود الأحمال الأرضية وأكواد السلامة الموحدة في المواقع الصحراوية.',
    ),
    keynote: true,
  ),
  _MockAgenda(
    1,
    690,
    765,
    MockText(
      'Dynamic Crowd Flow & High-Volume Egress Mechanics',
      'حركة الحشود الديناميكية وآليات الإخلاء',
    ),
    MockText(
      'Case study on handling 120,000 attendees during weather anomalies.',
      'دراسة حالة لإدارة 120,000 زائر أثناء التقلبات الجوية.',
    ),
    format: MockText('Technical Panel', 'جلسة تقنية'),
  ),
  _MockAgenda(
    1,
    870,
    960,
    MockText(
      'Automated Trussing & Pyrotechnic Sync Protocols',
      'بروتوكولات الجمالونات الآلية وتزامن الألعاب النارية',
    ),
    MockText(
      'Live hardware demonstration of precision hoists and compliance overrides.',
      'عرض حي للرافعات الدقيقة وأنظمة الامتثال.',
    ),
    format: MockText('Workshop', 'ورشة عمل'),
  ),
  _MockAgenda(
    2,
    570,
    660,
    MockText(
      'Broadcast Hubs for Stadium Events',
      'مراكز البث لفعاليات الملاعب',
    ),
    MockText(
      'Redundant power and fibre topologies for live broadcast.',
      'مصادر طاقة احتياطية وشبكات ألياف للبث المباشر.',
    ),
    format: MockText('Technical Panel', 'جلسة تقنية'),
  ),
];

const _flagshipSpeakers = [
  _MockSpeaker(
    MockText('Eng. Fahad Al-Saud', 'م. فهد آل سعود'),
    MockText('Director of Safe Execution', 'مدير التنفيذ الآمن'),
    MockText('GEA Executive Board', 'المجلس التنفيذي للهيئة'),
    host: true,
  ),
  _MockSpeaker(
    MockText('Fatma Al-Husseini', 'فاطمة الحسيني'),
    MockText('Lead Event Director', 'مديرة فعاليات رئيسية'),
    MockText('Riyadh Season Mega Projects', 'مشاريع موسم الرياض'),
    photo: AppAssets.headshotDirector,
  ),
];

const _extras = <String, _MockExtra>{
  'tech-innovation': _MockExtra(
    days: 3,
    accredited: true,
    points: 15,
    speakers: _flagshipSpeakers,
    agenda: _flagshipAgenda,
  ),
  'summit-2025': _MockExtra(
    days: 3,
    accredited: true,
    points: 15,
    speakers: _flagshipSpeakers,
    agenda: _flagshipAgenda,
  ),
  'tech-expo': _MockExtra(days: 3, points: 10),
  'production-forum': _MockExtra(points: 15, accredited: true),
};
