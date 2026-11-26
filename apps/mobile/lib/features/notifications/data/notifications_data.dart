import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/data/mock_support.dart';
import '../../../core/l10n/content_language.dart';
import '../../applications/domain/application.dart';
import '../domain/app_notification.dart';

abstract interface class NotificationsDataSource {
  Future<List<AppNotification>> getNotifications();
  Future<void> markRead(String id);
  Future<void> markAllRead();
}

class NotificationsRepositoryImpl implements NotificationsRepository {
  const NotificationsRepositoryImpl(this._source);

  final NotificationsDataSource _source;

  @override
  Future<List<AppNotification>> getNotifications() =>
      _source.getNotifications();

  @override
  Future<void> markRead(String id) => _source.markRead(id);

  @override
  Future<void> markAllRead() => _source.markAllRead();
}

class NotificationsMockDataSource implements NotificationsDataSource {
  NotificationsMockDataSource({required this.language, required this.latency});

  final String Function() language;
  final Duration latency;

  final Set<String> _read = {'n3', 'n4', 'n5', 'n6', 'n7'};

  /// Status notifications raised this session, newest first.
  final List<AppNotification> _recorded = [];

  /// Status changes a company made to applications on its listings.
  ///
  /// These belong to the applicant's inbox on their own account, so they
  /// are not returned here. The backend delivers them; the mock only
  /// records that the event happened, for tests and demos.
  final List<ApplicationStatusUpdate> applicantEvents = [];

  /// Called when a company moves an application; see [applicantEvents].
  void recordApplicantStatusChange({
    required ApplicationStatus from,
    required ApplicantView applicant,
  }) {
    if (!ApplicationRules.isNotifiableTransition(from, applicant.status)) {
      return;
    }
    applicantEvents.insert(
      0,
      ApplicationStatusUpdate(
        applicationId: applicant.applicationId,
        opportunityTitle: applicant.opportunityTitle,
        status: applicant.status,
      ),
    );
  }

  /// Stands in for the backend raising a notification when an
  /// application's official status changes. Anything else — including
  /// edits to the listing — raises nothing.
  void recordApplicationStatus({
    required ApplicationStatus? from,
    required Application application,
  }) {
    if (!ApplicationRules.isNotifiableTransition(from, application.status)) {
      return;
    }
    _recorded.insert(
      0,
      AppNotification(
        id: 'app-status-${application.id}-${application.status.wireValue}',
        category: NotificationCategory.opportunities,
        title: '',
        body: '',
        createdAt: application.updatedAt,
        targetType: NotificationTargetType.opportunity,
        targetId: application.opportunityId,
        source: application.company.name,
        applicationUpdate: ApplicationStatusUpdate(
          applicationId: application.id,
          opportunityTitle: application.opportunityTitle,
          status: application.status,
        ),
      ),
    );
  }

  @override
  Future<List<AppNotification>> getNotifications() async {
    await Future<void>.delayed(latency);
    final lang = language();
    return [
      for (final n in _recorded) _read.contains(n.id) ? n.markedRead() : n,
      for (final m in _mock)
        AppNotification(
          id: m.id,
          category: m.category,
          title: m.title.of(lang),
          body: m.body.of(lang),
          createdAt: DateTime.now().subtract(m.age),
          targetType: m.targetType,
          targetId: m.targetId,
          source: m.source.of(lang),
          pointsDelta: m.points,
          applicationUpdate: m.application == null
              ? null
              : ApplicationStatusUpdate(
                  applicationId: m.application!.id,
                  opportunityTitle: m.application!.title.of(lang),
                  status: m.application!.status,
                ),
          read: _read.contains(m.id),
        ),
    ];
  }

  @override
  Future<void> markRead(String id) async => _read.add(id);

  @override
  Future<void> markAllRead() async =>
      _read.addAll([..._recorded.map((n) => n.id), ..._mock.map((m) => m.id)]);
}

/// TODO(api): select a `NotificationsRemoteDataSource` (and push delivery)
/// when `AppConfig.useMockData` is false.
final notificationsDataSourceProvider = Provider<NotificationsDataSource>(
  (ref) => ref.watch(notificationsMockProvider),
);

/// The in-memory inbox. Other mock sources raise status notifications
/// through it, as the backend would.
final notificationsMockProvider = Provider<NotificationsMockDataSource>((ref) {
  return NotificationsMockDataSource(
    language: () => ref.read(contentLanguageProvider),
    latency: ref.watch(mockLatencyProvider),
  );
});

final notificationsRepositoryProvider = Provider<NotificationsRepository>(
  (ref) =>
      NotificationsRepositoryImpl(ref.watch(notificationsDataSourceProvider)),
);

class _Mock {
  const _Mock(
    this.id,
    this.category,
    this.title,
    this.body,
    this.age,
    this.targetType,
    this.source, {
    this.targetId,
    this.points,
    this.application,
  });

  final String id;
  final NotificationCategory category;
  final MockText title;
  final MockText body;
  final Duration age;
  final NotificationTargetType targetType;
  final MockText source;
  final String? targetId;
  final int? points;
  final ({String id, MockText title, ApplicationStatus status})? application;
}

const _mock = [
  _Mock(
    'n1',
    NotificationCategory.opportunities,
    MockText('Application Status Updated', 'تحديث حالة الطلب'),
    MockText(
      'Your application for Senior Technical Production Lead at Midan Events moved to Shortlisted.',
      'انتقل طلبك لوظيفة قائد إنتاج تقني أول في ميدان للفعاليات إلى القائمة المختصرة.',
    ),
    Duration(minutes: 12),
    NotificationTargetType.opportunity,
    MockText('Midan Events', 'Midan Events'),
    targetId: 'midan-tech-lead',
    application: (
      id: 'app-midan',
      title: MockText(
        'Senior Technical Production Lead',
        'قائد إنتاج تقني أول',
      ),
      status: ApplicationStatus.shortlisted,
    ),
  ),
  _Mock(
    'n2',
    NotificationCategory.events,
    MockText('Event Starting Tomorrow', 'الفعالية تبدأ غدًا'),
    MockText(
      'Tech & Innovation in Events starts tomorrow. Your delegate pass is ready.',
      'تبدأ فعالية التقنية والابتكار في الفعاليات غدًا. بطاقة الحضور الخاصة بك جاهزة.',
    ),
    Duration(hours: 2),
    NotificationTargetType.event,
    MockText('KAFD Riyadh', 'كافد الرياض'),
    targetId: 'tech-innovation',
  ),
  _Mock(
    'n3',
    NotificationCategory.credentials,
    MockText('Level 2 Verification Approved', 'اعتماد التوثيق من المستوى 2'),
    MockText(
      'The General Entertainment Authority validated your Master Rigging & Production credential.',
      'اعتمدت الهيئة العامة للترفيه شهادتك في التعليق والإنتاج.',
    ),
    Duration(hours: 5),
    NotificationTargetType.profile,
    MockText('Credential verified', 'شهادة موثقة'),
  ),
  _Mock(
    'n4',
    NotificationCategory.events,
    MockText('Official Attendance Confirmed', 'تأكيد الحضور الرسمي'),
    MockText(
      'You logged verified attendance at the Rigging Safety Briefing.',
      'سُجّل حضورك الموثق في جلسة سلامة التعليق.',
    ),
    Duration(days: 2),
    NotificationTargetType.reward,
    MockText('Points ledger', 'سجل النقاط'),
    points: 15,
  ),
  _Mock(
    'n5',
    NotificationCategory.news,
    MockText('New Briefing Published', 'نُشرت إحاطة جديدة'),
    MockText(
      'Riyadh Season 2026: the new safety mandate for automated rigging and truss telemetry.',
      'موسم الرياض 2026: لائحة السلامة الجديدة للتعليق الآلي وقياس الجمالونات عن بُعد.',
    ),
    Duration(days: 3),
    NotificationTargetType.article,
    MockText('Editorial & Advisory Board', 'مجلس التحرير والاستشارات'),
    targetId: 'rigging-mandate-2026',
  ),
  _Mock(
    'n6',
    NotificationCategory.opportunities,
    MockText(
      'New Match: Lead Staging Supervisor',
      'فرصة مطابقة: مشرف مسارح رئيسي',
    ),
    MockText(
      'NEXA Production posted a role that matches 91% of your credentials.',
      'نشرت NEXA Production وظيفة تطابق 91% من مؤهلاتك.',
    ),
    Duration(days: 4),
    NotificationTargetType.opportunity,
    MockText('NEXA Production', 'NEXA Production'),
    targetId: 'nexa-staging-supervisor',
  ),
  _Mock(
    'n7',
    NotificationCategory.events,
    MockText('Registration Confirmed', 'تأكيد التسجيل'),
    MockText(
      'You are registered for the Event Technology Expo in Jeddah.',
      'تم تسجيلك في معرض تقنيات الفعاليات في جدة.',
    ),
    Duration(days: 5),
    NotificationTargetType.event,
    MockText('Jeddah Superdome', 'جدة سوبردوم'),
    targetId: 'tech-expo',
  ),
];
