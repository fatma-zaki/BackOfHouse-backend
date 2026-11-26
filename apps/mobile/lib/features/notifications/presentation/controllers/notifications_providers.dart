import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/l10n/content_language.dart';
import '../../data/notifications_data.dart';
import '../../domain/app_notification.dart';

/// Kept alive so the unread badge is available app-wide.
class NotificationsController extends AsyncNotifier<List<AppNotification>> {
  @override
  Future<List<AppNotification>> build() {
    ref.watch(contentLanguageProvider);
    return ref.watch(notificationsRepositoryProvider).getNotifications();
  }

  Future<void> markRead(String id) async {
    final current = state.value;
    if (current == null) return;
    state = AsyncData([
      for (final n in current) n.id == id ? n.markedRead() : n,
    ]);
    await ref.read(notificationsRepositoryProvider).markRead(id);
  }

  Future<void> markAllRead() async {
    final current = state.value;
    if (current == null) return;
    state = AsyncData([for (final n in current) n.markedRead()]);
    await ref.read(notificationsRepositoryProvider).markAllRead();
  }
}

final notificationsProvider =
    AsyncNotifierProvider<NotificationsController, List<AppNotification>>(
      NotificationsController.new,
    );

final unreadNotificationsProvider = Provider<int>((ref) {
  final items = ref.watch(notificationsProvider).value ?? const [];
  return items.where((n) => !n.read).length;
});
