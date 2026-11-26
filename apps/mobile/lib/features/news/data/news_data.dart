import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/constants/app_assets.dart';
import '../../../core/data/mock_support.dart';
import '../../../core/l10n/content_language.dart';
import '../../../core/media/app_image.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/utils/paginated.dart';
import '../../auth/domain/app_user.dart';
import '../../auth/presentation/controllers/auth_controller.dart';
import '../domain/article.dart';

abstract interface class NewsDataSource {
  Future<Paginated<Article>> getArticles(NewsQuery query, PageRequest request);
  Future<Article> getArticle(String id);
  Future<List<Article>> getRelated(String id);
  Future<Article> setSaved(String id, {required bool saved});
  Future<Article> setLiked(String id, {required bool liked});
  Future<Paginated<ArticleComment>> getComments(
    String articleId,
    PageRequest request,
  );
  Future<ArticleComment> addComment(String articleId, String text);
  Future<void> deleteComment(String articleId, String commentId);
}

class NewsRepositoryImpl implements NewsRepository {
  const NewsRepositoryImpl(this._source);

  final NewsDataSource _source;

  @override
  Future<Paginated<Article>> getArticles(
    NewsQuery query,
    PageRequest request,
  ) => _source.getArticles(query, request);

  @override
  Future<Article> getArticle(String id) => _source.getArticle(id);

  @override
  Future<List<Article>> getRelated(String id) => _source.getRelated(id);

  @override
  Future<Article> setSaved(String id, {required bool saved}) =>
      _source.setSaved(id, saved: saved);

  @override
  Future<Article> setLiked(String id, {required bool liked}) =>
      _source.setLiked(id, liked: liked);

  @override
  Future<Paginated<ArticleComment>> getComments(
    String articleId,
    PageRequest request,
  ) => _source.getComments(articleId, request);

  @override
  Future<ArticleComment> addComment(String articleId, String text) =>
      _source.addComment(articleId, text);

  @override
  Future<void> deleteComment(String articleId, String commentId) =>
      _source.deleteComment(articleId, commentId);
}

/// Enforces the engagement rules the way the API does from the access
/// token: companies read, individuals like and comment.
class NewsMockDataSource implements NewsDataSource {
  NewsMockDataSource({
    required this.language,
    required this.latency,
    required this.user,
  });

  final String Function() language;
  final Duration latency;

  /// The signed-in account, if any.
  final AppUser? Function() user;

  final Set<String> _saved = {};
  final Set<String> _liked = {};

  /// Comments per article, newest first. Seeded on first read.
  final Map<String, List<_MockComment>> _comments = {};
  var _nextCommentId = 0;

  List<_MockComment> _commentsOf(String articleId) => _comments.putIfAbsent(
    articleId,
    () => [
      for (final c in _seedComments)
        if (c.articleId == articleId) c,
    ],
  );

  /// Throws unless the signed-in account may like and comment.
  AppUser _engagingMember() {
    final member = user();
    if (member == null ||
        !ArticleEngagementRules.canEngage(member.accountType)) {
      throw const ApiException(type: ApiErrorType.forbidden, statusCode: 403);
    }
    return member;
  }

  ArticleComment _buildComment(_MockComment c) {
    final lang = language();
    return ArticleComment(
      id: c.id,
      articleId: c.articleId,
      authorName: c.authorName.of(lang),
      authorHeadline: c.authorHeadline?.of(lang),
      authorAvatar: c.authorAvatar,
      text: c.text.of(lang),
      createdAt: c.createdAt,
      mine: c.authorId != null && c.authorId == user()?.id,
    );
  }

  Future<void> _wait() => Future<void>.delayed(latency);

  _Mock _find(String id) {
    final match = _mock.where((m) => m.id == id);
    if (match.isEmpty) {
      throw const ApiException(type: ApiErrorType.notFound, statusCode: 404);
    }
    return match.first;
  }

  Article _build(_Mock m) {
    final lang = language();
    final author = m.author;
    return Article(
      id: m.id,
      topic: m.topic,
      category: m.category.of(lang),
      title: m.title.of(lang),
      summary: m.summary.of(lang),
      source: m.source.of(lang),
      teaser: m.teaser.of(lang),
      readMinutes: m.readMinutes,
      publishedAt: m.publishedAt,
      image: AppImage.asset(m.image),
      imageCaption: m.imageCaption?.of(lang),
      breaking: m.breaking,
      labels: [for (final l in m.labels) l.of(lang)],
      author: author == null
          ? null
          : ArticleAuthor(
              name: author.name.of(lang),
              role: author.role.of(lang),
              verified: true,
            ),
      directives: [for (final d in m.directives) d.of(lang)],
      body: [
        for (final b in m.body)
          switch (b) {
            _Paragraph(:final text) => ArticleParagraph(text.of(lang)),
            _Quote(:final text, :final attribution) => ArticleQuote(
              text: text.of(lang),
              attribution: attribution.of(lang),
            ),
            _Notice(:final title, :final text) => ArticleNotice(
              title: title.of(lang),
              text: text.of(lang),
            ),
          },
      ],
      keywords: m.keywords,
      saved: _saved.contains(m.id),
      likeCount: m.likes + (_liked.contains(m.id) ? 1 : 0),
      liked: _liked.contains(m.id),
      commentCount: _commentsOf(m.id).length,
    );
  }

  @override
  Future<Paginated<Article>> getArticles(
    NewsQuery query,
    PageRequest request,
  ) async {
    await _wait();
    final lang = language();
    final q = query.query.trim().toLowerCase();
    final topic = query.topic;
    final matches = [
      for (final m in _mock)
        if (topic == null || m.topic == topic)
          if (q.isEmpty ||
              m.title.of(lang).toLowerCase().contains(q) ||
              m.summary.of(lang).toLowerCase().contains(q) ||
              m.category.of(lang).toLowerCase().contains(q))
            m,
    ];
    // "For You" leads with the breaking briefing; everything else is newest
    // first.
    matches.sort((a, b) {
      if (query.order == NewsOrder.forYou && a.breaking != b.breaking) {
        return a.breaking ? -1 : 1;
      }
      return b.publishedAt.compareTo(a.publishedAt);
    });
    return Paginated.slice([for (final m in matches) _build(m)], request);
  }

  @override
  Future<Article> getArticle(String id) async {
    await _wait();
    return _build(_find(id));
  }

  @override
  Future<List<Article>> getRelated(String id) async {
    await _wait();
    final current = _find(id);
    final others = _mock.where((m) => m.id != id).toList()
      ..sort((a, b) {
        final sameA = a.topic == current.topic;
        final sameB = b.topic == current.topic;
        if (sameA != sameB) return sameA ? -1 : 1;
        return b.publishedAt.compareTo(a.publishedAt);
      });
    return [for (final m in others.take(2)) _build(m)];
  }

  @override
  Future<Article> setSaved(String id, {required bool saved}) async {
    await _wait();
    final m = _find(id);
    saved ? _saved.add(id) : _saved.remove(id);
    return _build(m);
  }

  @override
  Future<Article> setLiked(String id, {required bool liked}) async {
    await _wait();
    _engagingMember();
    final m = _find(id);
    liked ? _liked.add(id) : _liked.remove(id);
    return _build(m);
  }

  @override
  Future<Paginated<ArticleComment>> getComments(
    String articleId,
    PageRequest request,
  ) async {
    await _wait();
    _find(articleId);
    return Paginated.slice([
      for (final c in _commentsOf(articleId)) _buildComment(c),
    ], request);
  }

  @override
  Future<ArticleComment> addComment(String articleId, String text) async {
    await _wait();
    final member = _engagingMember();
    _find(articleId);
    if (ArticleEngagementRules.validateComment(text) != null) {
      throw const ApiException(type: ApiErrorType.validation, statusCode: 422);
    }
    final body = text.trim();
    final comment = _MockComment(
      id: 'mine-${_nextCommentId++}',
      articleId: articleId,
      authorId: member.id,
      authorName: MockText(member.fullName, member.fullName),
      authorHeadline: member.headline == null
          ? null
          : MockText(member.headline!, member.headline!),
      authorAvatar: member.avatar,
      // Members' words are shown as written, in either language.
      text: MockText(body, body),
      createdAt: DateTime.now(),
    );
    _commentsOf(articleId).insert(0, comment);
    return _buildComment(comment);
  }

  @override
  Future<void> deleteComment(String articleId, String commentId) async {
    await _wait();
    final member = _engagingMember();
    final comments = _commentsOf(articleId);
    final index = comments.indexWhere((c) => c.id == commentId);
    if (index < 0) {
      throw const ApiException(type: ApiErrorType.notFound, statusCode: 404);
    }
    if (comments[index].authorId != member.id) {
      throw const ApiException(type: ApiErrorType.forbidden, statusCode: 403);
    }
    comments.removeAt(index);
  }
}

/// TODO(api): select a `NewsRemoteDataSource` when `AppConfig.useMockData`
/// is false.
final newsDataSourceProvider = Provider<NewsDataSource>(
  (ref) => NewsMockDataSource(
    language: () => ref.read(contentLanguageProvider),
    latency: ref.watch(mockLatencyProvider),
    user: () => ref.read(authControllerProvider).value,
  ),
);

final newsRepositoryProvider = Provider<NewsRepository>(
  (ref) => NewsRepositoryImpl(ref.watch(newsDataSourceProvider)),
);

// ── Mock content ───────────────────────────────────────────────────────────

class _MockAuthor {
  const _MockAuthor(this.name, this.role);

  final MockText name;
  final MockText role;
}

sealed class _Block {
  const _Block();
}

class _Paragraph extends _Block {
  const _Paragraph(this.text);

  final MockText text;
}

class _Quote extends _Block {
  const _Quote(this.text, this.attribution);

  final MockText text;
  final MockText attribution;
}

class _Notice extends _Block {
  const _Notice(this.title, this.text);

  final MockText title;
  final MockText text;
}

class _Mock {
  const _Mock({
    required this.id,
    required this.topic,
    required this.category,
    required this.title,
    required this.summary,
    required this.source,
    required this.teaser,
    required this.readMinutes,
    required this.publishedAt,
    required this.image,
    this.imageCaption,
    this.breaking = false,
    this.labels = const [],
    this.author,
    this.directives = const [],
    this.body = const [],
    this.keywords = const [],
    this.likes = 0,
  });

  final String id;
  final NewsTopic topic;
  final MockText category;
  final MockText title;
  final MockText summary;
  final MockText source;
  final MockText teaser;
  final int readMinutes;
  final DateTime publishedAt;
  final String image;
  final MockText? imageCaption;
  final bool breaking;
  final List<MockText> labels;
  final _MockAuthor? author;
  final List<MockText> directives;
  final List<_Block> body;
  final List<String> keywords;

  /// Likes from other members.
  final int likes;
}

class _MockComment {
  const _MockComment({
    required this.id,
    required this.articleId,
    required this.authorName,
    required this.text,
    required this.createdAt,
    this.authorId,
    this.authorHeadline,
    this.authorAvatar,
  });

  final String id;
  final String articleId;

  /// Set for comments posted this session, so their author can delete them.
  final String? authorId;
  final MockText authorName;
  final MockText? authorHeadline;
  final AppImage? authorAvatar;
  final MockText text;
  final DateTime createdAt;
}

final _mock = [
  _Mock(
    id: 'rigging-mandate-2026',
    likes: 214,
    topic: NewsTopic.regulatory,
    category: const MockText(
      'Technical Mandate · Civil Defense',
      'لائحة تقنية · الدفاع المدني',
    ),
    title: const MockText(
      'Riyadh Season 2026: The New Safety Mandate for Automated Rigging & Truss Telemetry',
      'موسم الرياض 2026: لائحة السلامة الجديدة للتعليق الآلي وقياس الجمالونات عن بُعد',
    ),
    summary: const MockText(
      'A structural dynamics framework ratified by GEA and Civil Defense for temporary mega-stages and suspended loads across capital entertainment zones.',
      'إطار للديناميكا الإنشائية أقرّته الهيئة العامة للترفيه والدفاع المدني للمسارح المؤقتة الضخمة والأحمال المعلّقة في مناطق الترفيه بالعاصمة.',
    ),
    source: const MockText(
      'Editorial & Advisory Board',
      'مجلس التحرير والاستشارات',
    ),
    teaser: const MockText(
      'Compliance guidelines for staging suppliers',
      'إرشادات الامتثال لموردي المسارح',
    ),
    readMinutes: 6,
    publishedAt: DateTime(2026, 9, 14),
    image: AppAssets.auditorium,
    imageCaption: const MockText(
      'KAFD Production Summit · GEA keynote stage',
      'قمة الإنتاج في كافد · منصة الكلمة الرئيسية للهيئة',
    ),
    breaking: true,
    labels: const [
      MockText('Mandate', 'لائحة'),
      MockText('Civil Defense', 'الدفاع المدني'),
    ],
    author: const _MockAuthor(
      MockText('Eng. Tariq Al-Mansoor', 'م. طارق المنصور'),
      MockText(
        'VP Production, NEXA & Advisory Board',
        'نائب رئيس الإنتاج في NEXA وعضو المجلس الاستشاري',
      ),
    ),
    directives: const [
      MockText(
        'Real-time digital load cells are required on every motorized hoist exceeding 1.5 tons across temporary and permanent mega-stages.',
        'تُشترط خلايا حمل رقمية لحظية على كل رافعة آلية يتجاوز حملها 1.5 طن في المسارح الضخمة المؤقتة والدائمة.',
      ),
      MockText(
        'The wind velocity threshold is lowered to 38 km/h for suspended kinetic LED matrices in outdoor and open-air zones.',
        'خُفّض حد سرعة الرياح إلى 38 كم/س لشاشات LED الحركية المعلّقة في المناطق الخارجية والمفتوحة.',
      ),
      MockText(
        'Rigger and technical supervisor credentials must be verified before load-in.',
        'يجب توثيق شهادات فنيي التعليق والمشرفين التقنيين قبل بدء التركيب.',
      ),
    ],
    body: const [
      _Paragraph(
        MockText(
          'As Saudi Arabia accelerates toward hosting some of the world\'s most ambitious cultural, musical and sporting events under Vision 2030, the scale of temporary outdoor infrastructure demands a new technical baseline. The General Entertainment Authority, in coordination with the General Directorate of Civil Defense, has ratified its 2026 Structural Dynamics Framework.',
          'مع تسارع المملكة نحو استضافة بعض أضخم الفعاليات الثقافية والموسيقية والرياضية في العالم ضمن رؤية 2030، يتطلب حجم البنية التحتية الخارجية المؤقتة خط أساس تقنيًا جديدًا. وقد أقرّت الهيئة العامة للترفيه، بالتنسيق مع المديرية العامة للدفاع المدني، إطار الديناميكا الإنشائية لعام 2026.',
        ),
      ),
      _Paragraph(
        MockText(
          'Productions across Riyadh Season zones, Diriyah and AlUla regularly deploy automated hoists carrying kinetic rigs of more than 45 tons. Under changing desert conditions, static engineering calculations are no longer enough: live sensor feeds must now connect directly to show-control fail-safes.',
          'تستخدم الإنتاجات في مناطق موسم الرياض والدرعية والعُلا رافعات آلية تحمل منصات حركية يتجاوز وزنها 45 طنًا. ومع تقلّب الظروف الصحراوية لم تعد الحسابات الهندسية الثابتة كافية، إذ يجب أن ترتبط قراءات الحساسات اللحظية مباشرة بأنظمة الإيقاف الآمن في التحكم بالعرض.',
        ),
      ),
      _Quote(
        MockText(
          'Precision rigging in desert terrain is no longer an art of estimation; it is a telemetry science verified in real time.',
          'لم يعد التعليق الدقيق في البيئة الصحراوية فنًّا قائمًا على التقدير، بل أصبح علم قياس يُتحقَّق منه لحظيًا.',
        ),
        MockText(
          'GEA Safety Compliance Directive',
          'توجيه الامتثال للسلامة – الهيئة العامة للترفيه',
        ),
      ),
      _Paragraph(
        MockText(
          'From Q1 2026, load-in checklists require digital calibration signatures uploaded to the central telemetry bus. The feeds monitor tension spikes, oscillation from sub-bass arrays and thermal expansion on steel cabling.',
          'اعتبارًا من الربع الأول لعام 2026، تتطلب قوائم التحقق عند التركيب توقيعات معايرة رقمية تُرفع إلى ناقل القياس المركزي، لرصد ارتفاعات الشد والاهتزازات الناتجة عن مكبرات الترددات المنخفضة والتمدد الحراري في الكابلات الفولاذية.',
        ),
      ),
      _Notice(
        MockText('On-Site Enforcement Standard', 'معيار التطبيق في الموقع'),
        MockText(
          'Inspections will trigger an automatic show-stop if three consecutive load cells report an uncorrected variance above 12% during operation.',
          'ستُفعّل عمليات التفتيش إيقافًا تلقائيًا للعرض إذا سجّلت ثلاث خلايا حمل متتالية تباينًا غير مصحّح يتجاوز 12% أثناء التشغيل.',
        ),
      ),
      _Paragraph(
        MockText(
          'For technical directors, lead riggers and production managers, readiness starts with credential validation, so that only certified lead riggers can operate automated movement during show hours.',
          'بالنسبة للمديرين التقنيين وكبار فنيي التعليق ومديري الإنتاج، تبدأ الجاهزية بتوثيق الشهادات، حتى لا يشغّل الحركة الآلية أثناء العروض إلا فنيو التعليق المعتمدون.',
        ),
      ),
    ],
    keywords: const [
      '#RiggingCompliance',
      '#RiyadhSeason',
      '#GEASafety',
      '#TechnicalProduction',
    ],
  ),
  _Mock(
    id: 'thermal-tolerances',
    likes: 86,
    topic: NewsTopic.technical,
    category: const MockText('Industry Analysis', 'تحليل القطاع'),
    title: const MockText(
      'Thermal Tolerances for Moving Stage Heads in High-Temperature Desert Venues',
      'تحمّل الحرارة لرؤوس الإضاءة المتحركة في المواقع الصحراوية',
    ),
    summary: const MockText(
      'Field study and technical benchmarks comparing IP65-rated automated luminaires during peak outdoor temperatures across AlUla and Diriyah.',
      'دراسة ميدانية ومقارنات تقنية لأداء وحدات الإضاءة الآلية بتصنيف IP65 في ذروة الحرارة الخارجية بالعُلا والدرعية.',
    ),
    source: const MockText('Technical Desk', 'المكتب التقني'),
    teaser: const MockText(
      'Benchmarks from 12 outdoor venues',
      'نتائج من 12 موقعًا خارجيًا',
    ),
    readMinutes: 5,
    publishedAt: DateTime(2026, 9, 10),
    image: AppAssets.festivalStage,
    body: const [
      _Paragraph(
        MockText(
          'Across twelve outdoor venues, the desk logged fixture temperatures, calibration drift and thermal throttling during summer load-ins.',
          'رصد المكتب في اثني عشر موقعًا خارجيًا درجات حرارة الوحدات وانحراف المعايرة والتخفيض الحراري للأداء خلال أعمال التركيب الصيفية.',
        ),
      ),
      _Paragraph(
        MockText(
          'Fixtures shaded during daytime rigging held calibration up to 40% longer. Scheduling focus and color calibration in the twilight window gave the most stable results.',
          'حافظت الوحدات المظلّلة أثناء التركيب النهاري على معايرتها لمدة أطول بنسبة تصل إلى 40%. وجاءت أكثر النتائج ثباتًا عند جدولة معايرة التركيز والألوان في فترة الغسق.',
        ),
      ),
    ],
  ),
  _Mock(
    id: 'vendor-prequalification',
    likes: 57,
    topic: NewsTopic.regulatory,
    category: const MockText('Procurement & Codes', 'المشتريات والأنظمة'),
    title: const MockText(
      'Unified Vendor Prequalification Protocols Announced for KSA Live Entertainment',
      'إعلان بروتوكولات موحّدة لتأهيل الموردين في قطاع الترفيه الحي',
    ),
    summary: const MockText(
      'New standards for rigging contractors, electrical synchronization, and emergency egress routing across public festival spaces.',
      'معايير جديدة لمقاولي التعليق والتزامن الكهربائي ومسارات الإخلاء في مساحات المهرجانات العامة.',
    ),
    source: const MockText('Regulatory Affairs', 'الشؤون التنظيمية'),
    teaser: const MockText(
      'What changes for suppliers in Q1',
      'ما الذي يتغير للموردين في الربع الأول',
    ),
    readMinutes: 4,
    publishedAt: DateTime(2026, 9, 6),
    image: AppAssets.concertStage,
    body: const [
      _Paragraph(
        MockText(
          'Suppliers bidding on public festival contracts will submit one prequalification file covering safety records, insurance and certified staff.',
          'سيقدّم الموردون المتقدمون لعقود المهرجانات العامة ملف تأهيل واحدًا يشمل سجلات السلامة والتأمين والكوادر المعتمدة.',
        ),
      ),
      _Notice(
        MockText('Deadline', 'الموعد النهائي'),
        MockText(
          'Existing suppliers must complete the new file before their next tender submission.',
          'يجب على الموردين الحاليين استكمال الملف الجديد قبل تقديمهم التالي لأي منافسة.',
        ),
      ),
    ],
  ),
  _Mock(
    id: 'workforce-growth-2026',
    likes: 143,
    topic: NewsTopic.market,
    category: const MockText('Market Report', 'تقرير السوق'),
    title: const MockText(
      'Saudi Live Production Workforce Growth: Trends & Certification Demands 2026',
      'نمو القوى العاملة في الإنتاج الحي بالسعودية: التوجهات ومتطلبات الاعتماد 2026',
    ),
    summary: const MockText(
      'An in-depth look at talent pipelines, technical certification adoption, and cross-border vendor partnerships transforming the regional industry.',
      'نظرة معمّقة على مسارات المواهب واعتماد الشهادات التقنية وشراكات الموردين الدوليين التي تغيّر القطاع في المنطقة.',
    ),
    source: const MockText('BOH Research Group', 'فريق أبحاث باك أوف هاوس'),
    teaser: const MockText(
      'Where hiring is heading next year',
      'إلى أين يتجه التوظيف العام القادم',
    ),
    readMinutes: 8,
    publishedAt: DateTime(2026, 9, 1),
    image: AppAssets.conventionHall,
    body: const [
      _Paragraph(
        MockText(
          'Demand for certified riggers, show-control operators and production managers continues to outpace supply, with contract roles growing fastest.',
          'لا يزال الطلب على فنيي التعليق المعتمدين ومشغّلي التحكم بالعروض ومديري الإنتاج يفوق المعروض، وتنمو الأدوار التعاقدية بأسرع وتيرة.',
        ),
      ),
      _Paragraph(
        MockText(
          'Companies listing verified roles on Back Of House report shorter hiring cycles when applicants hold verified credentials.',
          'تفيد الشركات التي تنشر وظائف موثقة على باك أوف هاوس بقِصر دورة التوظيف عندما يحمل المتقدمون شهادات موثقة.',
        ),
      ),
    ],
  ),
  _Mock(
    id: 'alula-acoustics',
    likes: 98,
    topic: NewsTopic.technical,
    category: const MockText('Acoustic Engineering', 'الهندسة الصوتية'),
    title: const MockText(
      'Desert Acoustic Dispersion in AlUla Canyon Staging',
      'انتشار الصوت في مسارح أودية العُلا',
    ),
    summary: const MockText(
      'How sandstone walls and night-time temperature swings change coverage for outdoor line arrays.',
      'كيف تغيّر الجدران الرملية وتقلبات حرارة الليل تغطية مصفوفات الصوت الخارجية.',
    ),
    source: const MockText('Technical Desk', 'المكتب التقني'),
    teaser: const MockText(
      'Coverage notes from three canyon venues',
      'ملاحظات التغطية من ثلاثة مواقع في الأودية',
    ),
    readMinutes: 4,
    publishedAt: DateTime(2026, 8, 28),
    image: AppAssets.festivalStage,
    body: const [
      _Paragraph(
        MockText(
          'Reflections from canyon walls add late energy that audiences hear as blur. Delay towers and tighter vertical coverage reduced it at all three venues.',
          'تضيف الانعكاسات من جدران الأودية طاقة متأخرة يسمعها الجمهور كتشويش. وقد خفّضتها أبراج التأخير والتغطية الرأسية الأضيق في المواقع الثلاثة.',
        ),
      ),
    ],
  ),
  _Mock(
    id: 'civil-defense-permits',
    likes: 71,
    topic: NewsTopic.regulatory,
    category: const MockText('Permits & Codes', 'التصاريح والأنظمة'),
    title: const MockText(
      'Saudi Civil Defense Event Permit Protocols: 2026 Update',
      'بروتوكولات تصاريح الدفاع المدني للفعاليات: تحديث 2026',
    ),
    summary: const MockText(
      'Revised submission windows, site plan requirements and inspection steps for public events.',
      'مواعيد تقديم معدّلة ومتطلبات مخططات المواقع وخطوات التفتيش للفعاليات العامة.',
    ),
    source: const MockText('Regulatory Affairs', 'الشؤون التنظيمية'),
    teaser: const MockText(
      'New submission windows explained',
      'شرح مواعيد التقديم الجديدة',
    ),
    readMinutes: 8,
    publishedAt: DateTime(2026, 8, 20),
    image: AppAssets.concertStage,
    body: const [
      _Paragraph(
        MockText(
          'Organizers now submit site plans at least 30 days before load-in, with egress calculations signed by a licensed engineer.',
          'يقدّم المنظمون الآن مخططات المواقع قبل 30 يومًا على الأقل من بدء التركيب، مع حسابات الإخلاء موقّعة من مهندس مرخّص.',
        ),
      ),
    ],
  ),
];

final _now = DateTime.now();

final _seedComments = [
  _MockComment(
    id: 'c-rigging-1',
    articleId: 'rigging-mandate-2026',
    authorName: const MockText('Faisal Al-Harbi', 'فيصل الحربي'),
    authorHeadline: const MockText('Head Rigger', 'رئيس فريق التعليق'),
    text: const MockText(
      'The load-cell requirement is overdue. We already log every hang point on arena shows; good to see it become the standard.',
      'اشتراط خلايا قياس الحمل تأخر كثيرًا. نحن نوثّق كل نقطة تعليق في عروض الساحات، وجيد أن يصبح ذلك هو المعيار.',
    ),
    createdAt: _now.subtract(const Duration(hours: 3)),
  ),
  _MockComment(
    id: 'c-rigging-2',
    articleId: 'rigging-mandate-2026',
    authorName: const MockText('Reem Al-Qahtani', 'ريم القحطاني'),
    authorHeadline: const MockText('Production Manager', 'مديرة إنتاج'),
    text: const MockText(
      'Does the certification window apply to crews already on season contracts?',
      'هل تنطبق مهلة الاعتماد على الفرق المتعاقدة حاليًا لموسم كامل؟',
    ),
    createdAt: _now.subtract(const Duration(hours: 9)),
  ),
  _MockComment(
    id: 'c-rigging-3',
    articleId: 'rigging-mandate-2026',
    authorName: const MockText('Omar Haddad', 'عمر حداد'),
    authorHeadline: const MockText('Stage Manager', 'مدير مسرح'),
    text: const MockText(
      'Sharing this with our whole technical team today.',
      'سأشارك هذا مع فريقنا التقني بالكامل اليوم.',
    ),
    createdAt: _now.subtract(const Duration(days: 1)),
  ),
  _MockComment(
    id: 'c-workforce-1',
    articleId: 'workforce-growth-2026',
    authorName: const MockText('Lama Al-Otaibi', 'لمى العتيبي'),
    authorHeadline: const MockText('Event Coordinator', 'منسقة فعاليات'),
    text: const MockText(
      'Encouraging numbers. Training pathways for new crew are what we need next.',
      'أرقام مشجعة. ما نحتاجه الآن هو مسارات تدريب للكوادر الجديدة.',
    ),
    createdAt: _now.subtract(const Duration(hours: 5)),
  ),
  _MockComment(
    id: 'c-thermal-1',
    articleId: 'thermal-tolerances',
    authorName: const MockText('Khalid Al-Shehri', 'خالد الشهري'),
    authorHeadline: const MockText('Lighting Designer', 'مصمم إضاءة'),
    text: const MockText(
      'Summer outdoor rigs need this guidance. Derating tables would be a great follow-up.',
      'منصات الصيف الخارجية تحتاج هذا التوجيه. جداول خفض القدرة ستكون متابعة رائعة.',
    ),
    createdAt: _now.subtract(const Duration(days: 2)),
  ),
];
