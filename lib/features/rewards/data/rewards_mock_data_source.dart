import 'dart:math';

import '../../../core/data/mock_support.dart';
import '../../../core/media/app_image.dart';
import '../../../core/network/api_exception.dart';
import '../../../core/utils/paginated.dart';
import '../domain/rewards_models.dart';
import 'rewards_data_source.dart';

/// In-memory points ledger and reward catalogue.
///
/// The balance and redemptions live for the app session, so redeeming on
/// one screen is reflected everywhere. Content follows [language].
class RewardsMockDataSource implements RewardsDataSource {
  RewardsMockDataSource({required this.language, required this.latency});

  final String Function() language;
  final Duration latency;

  int _balance = 320;
  final List<_Entry> _ledger = [..._seedLedger];
  final _random = Random(7);

  Future<void> _wait() => Future<void>.delayed(latency);
  String get _lang => language();

  @override
  Future<PointsSummary> getSummary() async {
    await _wait();
    final (level, target) = switch (_balance) {
      < 100 => (MemberLevel.newcomer, 100),
      < 500 => (MemberLevel.active, 500),
      < 1500 => (MemberLevel.contributor, 1500),
      _ => (MemberLevel.leader, _balance),
    };
    final nextBenefit = _catalogue
        .where((r) => r.available && r.cost > _balance)
        .map((r) => r.cost)
        .fold<int?>(null, (a, b) => a == null || b < a ? b : a);

    return PointsSummary(
      balance: _balance,
      earnedThisMonth: 45,
      level: level,
      levelTarget: target,
      nextBenefitAt: nextBenefit ?? _balance,
    );
  }

  @override
  Future<Paginated<PointsTransaction>> getTransactions(
    PointsFilter filter,
    PageRequest request,
  ) async {
    await _wait();
    final all = [
      for (final e in _ledger)
        if (filter == PointsFilter.all ||
            (filter == PointsFilter.earned && e.points > 0) ||
            (filter == PointsFilter.redeemed && e.points < 0))
          PointsTransaction(
            id: e.id,
            activity: e.activity,
            detail: e.detail.of(_lang),
            date: e.date,
            points: e.points,
          ),
    ];
    return Paginated.slice(all, request);
  }

  @override
  Future<List<Reward>> getRewards({
    RewardCategory? category,
    String query = '',
  }) async {
    await _wait();
    final q = query.trim().toLowerCase();
    return [
      for (final r in _catalogue)
        if (category == null || r.category == category)
          if (q.isEmpty || r.title.of(_lang).toLowerCase().contains(q))
            r.toReward(_lang),
    ];
  }

  @override
  Future<Reward> getReward(String id) async {
    await _wait();
    final match = _catalogue.where((r) => r.id == id);
    if (match.isEmpty) {
      throw const ApiException(type: ApiErrorType.notFound, statusCode: 404);
    }
    return match.first.toReward(_lang);
  }

  @override
  Future<Redemption> redeem(String rewardId) async {
    final reward = await getReward(rewardId);
    if (!reward.available || reward.cost > _balance) {
      throw const ApiException(
        type: ApiErrorType.insufficientPoints,
        statusCode: 409,
      );
    }
    _balance -= reward.cost;
    _ledger.insert(
      0,
      _Entry(
        'r${_ledger.length}',
        PointsActivity.redeemedReward,
        MockText(reward.title, reward.title),
        DateTime.now(),
        -reward.cost,
      ),
    );
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    final code = List.generate(8, (_) => chars[_random.nextInt(chars.length)]);
    return Redemption(
      reward: reward,
      code: 'BOH-${code.join()}',
      remainingBalance: _balance,
    );
  }
}

class _Entry {
  const _Entry(this.id, this.activity, this.detail, this.date, this.points);

  final String id;
  final PointsActivity activity;
  final MockText detail;
  final DateTime date;
  final int points;
}

class _MockReward {
  const _MockReward({
    required this.id,
    required this.category,
    required this.kind,
    required this.title,
    required this.description,
    required this.cost,
    required this.benefits,
    required this.steps,
    required this.note,
    this.available = true,
  });

  final String id;
  final RewardCategory category;
  final RewardKind kind;
  final MockText title;
  final MockText description;
  final int cost;
  final List<MockText> benefits;
  final List<MockText> steps;
  final MockText note;
  final bool available;

  Reward toReward(String lang) => Reward(
    id: id,
    category: category,
    kind: kind,
    title: title.of(lang),
    description: description.of(lang),
    cost: cost,
    benefits: [for (final b in benefits) b.of(lang)],
    steps: [for (final s in steps) s.of(lang)],
    note: note.of(lang),
    image: AppImage.placeholder,
    available: available,
  );
}

final _seedLedger = [
  _Entry(
    't1',
    PointsActivity.attendedWorkshop,
    const MockText(
      'Tech & Innovation in Events',
      'التقنية والابتكار في الفعاليات',
    ),
    DateTime(2026, 9, 12),
    15,
  ),
  _Entry(
    't2',
    PointsActivity.profileCompletion,
    const MockText('Completed 80% of your profile', 'أكملت 80% من ملفك الشخصي'),
    DateTime(2026, 9, 10),
    20,
  ),
  _Entry(
    't3',
    PointsActivity.verifiedIdentity,
    const MockText('Identity verification approved', 'تم توثيق هويتك'),
    DateTime(2026, 9, 8),
    20,
  ),
  _Entry(
    't4',
    PointsActivity.profileCompletion,
    const MockText('Added your certifications', 'أضفت شهاداتك'),
    DateTime(2026, 9, 5),
    8,
  ),
  _Entry(
    't5',
    PointsActivity.joinedEvent,
    const MockText('Industry Networking Event', 'لقاء التواصل المهني'),
    DateTime(2026, 8, 28),
    10,
  ),
  _Entry(
    't6',
    PointsActivity.followedCompany,
    const MockText('Followed 5 companies', 'تابعت 5 شركات'),
    DateTime(2026, 8, 25),
    5,
  ),
  _Entry(
    't7',
    PointsActivity.attendedWorkshop,
    const MockText('Stage Lighting Fundamentals', 'أساسيات إضاءة المسرح'),
    DateTime(2026, 8, 20),
    15,
  ),
  _Entry(
    't8',
    PointsActivity.joinedEvent,
    const MockText('Rigging Safety Briefing', 'جلسة سلامة التعليق'),
    DateTime(2026, 8, 16),
    8,
  ),
  _Entry(
    't9',
    PointsActivity.joinedEvent,
    const MockText('Riyadh Season Crew Meetup', 'لقاء فريق موسم الرياض'),
    DateTime(2026, 8, 9),
    10,
  ),
  _Entry(
    't10',
    PointsActivity.profileCompletion,
    const MockText('Added your experience', 'أضفت خبراتك'),
    DateTime(2026, 8, 2),
    20,
  ),
  for (var i = 0; i < 24; i++)
    _Entry(
      'h$i',
      PointsActivity.values[i % 5],
      const MockText('Platform activity', 'نشاط على المنصة'),
      DateTime(2026, 7, 28).subtract(Duration(days: i * 3)),
      5 + i % 3 * 5,
    ),
];

const _courseSteps = [
  MockText('Spend the points', 'استبدل النقاط'),
  MockText('Receive your discount code', 'استلم رمز الخصم'),
  MockText('Use it during checkout', 'استخدمه عند الدفع'),
];

const _catalogue = [
  _MockReward(
    id: 'course-10',
    category: RewardCategory.learn,
    kind: RewardKind.course,
    title: MockText(
      '10% Off on Professional Courses',
      'خصم 10% على الدورات الاحترافية',
    ),
    description: MockText(
      'Get 10% discount on eligible professional courses and enhance your skills with top industry experts.',
      'احصل على خصم 10% على الدورات الاحترافية المؤهلة وطوّر مهاراتك مع نخبة خبراء القطاع.',
    ),
    cost: 100,
    benefits: [
      MockText(
        '10% discount on all eligible courses',
        'خصم 10% على جميع الدورات المؤهلة',
      ),
      MockText(
        'Valid for 3 months from redemption',
        'صالح لمدة 3 أشهر من تاريخ الاستبدال',
      ),
      MockText('Can be used once per account', 'يُستخدم مرة واحدة لكل حساب'),
    ],
    steps: _courseSteps,
    note: MockText(
      'This reward is valid for selected courses only. Check the details before redeeming.',
      'هذه المكافأة صالحة لدورات مختارة فقط. راجع التفاصيل قبل الاستبدال.',
    ),
  ),
  _MockReward(
    id: 'event-ticket',
    category: RewardCategory.attend,
    kind: RewardKind.ticket,
    title: MockText('Free Event Ticket', 'تذكرة فعالية مجانية'),
    description: MockText(
      'Attend a partner industry event of your choice, on us.',
      'احضر فعالية من فعاليات شركائنا تختارها أنت، على حسابنا.',
    ),
    cost: 250,
    benefits: [
      MockText(
        'One standard ticket to a partner event',
        'تذكرة عادية واحدة لفعالية شريكة',
      ),
      MockText(
        'Valid for events in the next 6 months',
        'صالحة للفعاليات خلال الأشهر الستة القادمة',
      ),
    ],
    steps: [
      MockText('Spend the points', 'استبدل النقاط'),
      MockText('Pick an eligible event', 'اختر فعالية مؤهلة'),
      MockText('Show your code at the entrance', 'اعرض الرمز عند الدخول'),
    ],
    note: MockText(
      'Subject to availability. Tickets are non-transferable.',
      'حسب التوفر. التذاكر غير قابلة للتحويل.',
    ),
  ),
  _MockReward(
    id: 'profile-highlight',
    category: RewardCategory.career,
    kind: RewardKind.highlight,
    title: MockText(
      'Profile Highlight (7 days)',
      'إبراز الملف الشخصي (7 أيام)',
    ),
    description: MockText(
      'Stand out to companies searching for talent, using the points you have earned.',
      'اجعل ملفك أوضح للشركات التي تبحث عن الكفاءات باستخدام النقاط التي جمعتها.',
    ),
    cost: 300,
    benefits: [
      MockText(
        'Higher placement in talent search for 7 days',
        'ظهور أعلى في البحث عن الكفاءات لمدة 7 أيام',
      ),
      MockText(
        'A "Highlighted" label on your profile while it runs',
        'وسم «مُبرز» على ملفك طوال المدة',
      ),
    ],
    steps: [
      MockText('Spend the points', 'استبدل النقاط'),
      MockText('Your highlight starts immediately', 'يبدأ الإبراز فورًا'),
    ],
    note: MockText(
      'A highlight cannot be paused once started. It does not change your verification status.',
      'لا يمكن إيقاف الإبراز بعد بدئه، ولا يغيّر حالة التوثيق في ملفك.',
    ),
  ),
  _MockReward(
    id: 'industry-report',
    category: RewardCategory.learn,
    kind: RewardKind.report,
    title: MockText('Industry Report', 'تقرير القطاع'),
    description: MockText(
      "The latest data on Saudi Arabia's events market: growth, segments and investment.",
      'أحدث بيانات سوق الفعاليات في السعودية: النمو والقطاعات والاستثمار.',
    ),
    cost: 500,
    benefits: [
      MockText('Full PDF report download', 'تنزيل التقرير الكامل بصيغة PDF'),
      MockText('Quarterly data updates', 'تحديثات ربع سنوية للبيانات'),
    ],
    steps: [
      MockText('Spend the points', 'استبدل النقاط'),
      MockText('Download from your email', 'نزّله من بريدك الإلكتروني'),
    ],
    note: MockText(
      'For personal professional use only.',
      'للاستخدام المهني الشخصي فقط.',
    ),
  ),
  _MockReward(
    id: 'community-access',
    category: RewardCategory.community,
    kind: RewardKind.community,
    title: MockText('Exclusive Networking Access', 'وصول حصري للقاءات المهنية'),
    description: MockText(
      'Attend private meetups hosted by senior production professionals.',
      'احضر لقاءات خاصة يستضيفها كبار محترفي الإنتاج.',
    ),
    cost: 400,
    benefits: [
      MockText(
        'Invitations to private industry meetups',
        'دعوات إلى لقاءات خاصة في القطاع',
      ),
    ],
    steps: [MockText('Available soon', 'متاح قريبًا')],
    note: MockText('Launching later this year.', 'يُطلق لاحقًا هذا العام.'),
    available: false,
  ),
];
