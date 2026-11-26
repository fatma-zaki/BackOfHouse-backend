import 'package:flutter/foundation.dart';

import '../../applications/domain/application.dart';

/// Inbox filter categories.
enum NotificationCategory { opportunities, events, credentials, news }

/// What a notification opens when tapped.
enum NotificationTargetType { opportunity, event, reward, article, profile }

/// An official status change on one of the member's applications.
@immutable
class ApplicationStatusUpdate {
  const ApplicationStatusUpdate({
    required this.applicationId,
    required this.opportunityTitle,
    required this.status,
  });

  final String applicationId;
  final String opportunityTitle;
  final ApplicationStatus status;
}

@immutable
class AppNotification {
  const AppNotification({
    required this.id,
    required this.category,
    required this.title,
    required this.body,
    required this.createdAt,
    required this.targetType,
    required this.source,
    this.targetId,
    this.pointsDelta,
    this.applicationUpdate,
    this.read = false,
  });

  final String id;
  final NotificationCategory category;
  final String title;
  final String body;
  final DateTime createdAt;
  final NotificationTargetType targetType;

  /// Where it came from, e.g. "Midan Hub", "KAFD Riyadh".
  final String source;
  final String? targetId;

  /// Points credited by this event, when relevant.
  final int? pointsDelta;

  /// Set for application status notifications; the app words the title
  /// and body from it in the member's language.
  final ApplicationStatusUpdate? applicationUpdate;
  final bool read;

  AppNotification markedRead() => AppNotification(
    id: id,
    category: category,
    title: title,
    body: body,
    createdAt: createdAt,
    targetType: targetType,
    source: source,
    targetId: targetId,
    pointsDelta: pointsDelta,
    applicationUpdate: applicationUpdate,
    read: true,
  );
}

abstract interface class NotificationsRepository {
  Future<List<AppNotification>> getNotifications();
  Future<void> markRead(String id);
  Future<void> markAllRead();
}
