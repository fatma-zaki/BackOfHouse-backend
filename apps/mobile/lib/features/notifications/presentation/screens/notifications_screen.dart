import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_radii.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/generated/app_localizations.dart';
import '../../../../core/l10n/l10n_messages.dart';
import '../../../../core/widgets/widgets.dart';
import '../../domain/app_notification.dart';
import '../controllers/notifications_providers.dart';

extension on NotificationCategory {
  String label(AppLocalizations l10n) => switch (this) {
    NotificationCategory.opportunities =>
      l10n.notificationCategoryOpportunities,
    NotificationCategory.events => l10n.notificationCategoryEvents,
    NotificationCategory.credentials => l10n.notificationCategoryCredentials,
    NotificationCategory.news => l10n.notificationCategoryNews,
  };

  IconData get icon => switch (this) {
    NotificationCategory.opportunities => AppIcons.job,
    NotificationCategory.events => AppIcons.calendar,
    NotificationCategory.credentials => AppIcons.identity,
    NotificationCategory.news => AppIcons.news,
  };

  BOHIconCircleTone get tone => switch (this) {
    NotificationCategory.opportunities => BOHIconCircleTone.success,
    NotificationCategory.events => BOHIconCircleTone.brand,
    NotificationCategory.credentials => BOHIconCircleTone.gold,
    NotificationCategory.news => BOHIconCircleTone.info,
  };
}

extension on AppNotification {
  String get route => switch (targetType) {
    NotificationTargetType.opportunity when targetId != null =>
      AppRoutes.opportunity(targetId!),
    NotificationTargetType.opportunity => AppRoutes.opportunities,
    NotificationTargetType.event when targetId != null => AppRoutes.event(
      targetId!,
    ),
    NotificationTargetType.event => AppRoutes.events,
    NotificationTargetType.reward => AppRoutes.myPoints,
    NotificationTargetType.article when targetId != null => AppRoutes.article(
      targetId!,
    ),
    NotificationTargetType.article => AppRoutes.news,
    NotificationTargetType.profile => AppRoutes.profile,
  };
}

class NotificationsScreen extends ConsumerStatefulWidget {
  const NotificationsScreen({super.key});

  @override
  ConsumerState<NotificationsScreen> createState() =>
      _NotificationsScreenState();
}

class _NotificationsScreenState extends ConsumerState<NotificationsScreen> {
  NotificationCategory? _category;

  void _open(AppNotification n) {
    ref.read(notificationsProvider.notifier).markRead(n.id);
    context.push(n.route);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final notifications = ref.watch(notificationsProvider);

    return BOHScaffold(
      appBar: BOHAppBar(
        title: l10n.notificationsLabel,
        actions: [
          if (notifications.value?.any((n) => !n.read) ?? false)
            BOHLinkButton(
              label: l10n.notificationsMarkAllRead,
              arrow: false,
              fontSize: 12,
              onTap: () =>
                  ref.read(notificationsProvider.notifier).markAllRead(),
            ),
        ],
      ),
      body: switch (notifications) {
        AsyncData(:final value) when value.isEmpty => BOHEmptyState(
          icon: AppIcons.notifications,
          title: l10n.notificationsEmptyTitle,
          message: l10n.notificationsEmptyMessage,
        ),
        AsyncData(:final value) => BOHRefresh(
          onRefresh: () => ref.refresh(notificationsProvider.future),
          child: _Inbox(
            all: value,
            category: _category,
            onCategory: (c) => setState(() => _category = c),
            onOpen: _open,
          ),
        ),
        AsyncError(:final error) => BOHErrorState(
          error: error,
          onRetry: () => ref.invalidate(notificationsProvider),
        ),
        _ => const BOHLoadingState(),
      },
    );
  }
}

class _Inbox extends ConsumerWidget {
  const _Inbox({
    required this.all,
    required this.category,
    required this.onCategory,
    required this.onOpen,
  });

  final List<AppNotification> all;
  final NotificationCategory? category;
  final ValueChanged<NotificationCategory?> onCategory;
  final ValueChanged<AppNotification> onOpen;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final unread = all.where((n) => !n.read).length;
    final visible = [
      for (final n in all)
        if (category == null || n.category == category) n,
    ];
    final now = DateTime.now();
    final today = [
      for (final n in visible)
        if (now.difference(n.createdAt).inHours < 24) n,
    ];
    final earlier = [
      for (final n in visible)
        if (now.difference(n.createdAt).inHours >= 24) n,
    ];

    return CustomScrollView(
      slivers: [
        SliverToBoxAdapter(
          child: BOHFilterChips<NotificationCategory?>(
            options: [null, ...NotificationCategory.values],
            selected: category,
            label: (o) => o?.label(l10n) ?? l10n.filterAll,
            count: (o) => o == null && unread > 0 ? unread : null,
            style: BOHChipStyle.violet,
            padding: const EdgeInsetsDirectional.fromSTEB(
              AppSpacing.screenHorizontal,
              AppSpacing.s4,
              AppSpacing.screenHorizontal,
              AppSpacing.s8,
            ),
            onSelected: onCategory,
          ),
        ),
        if (visible.isEmpty)
          SliverFillRemaining(
            hasScrollBody: false,
            child: BOHEmptyState(
              icon: AppIcons.notifications,
              title: l10n.notificationsCategoryEmptyTitle,
              message: l10n.notificationsCategoryEmptyMessage,
            ),
          )
        else
          BOHSliverPadding(
            sliver: SliverList.list(
              children: [
                if (today.isNotEmpty) ...[
                  _GroupHeader(title: l10n.notificationsToday),
                  for (final (i, n) in today.indexed)
                    BOHFadeSlide(
                      delay: BOHFadeSlide.stagger(i),
                      child: _NotificationCard(
                        notification: n,
                        onTap: () => onOpen(n),
                      ),
                    ),
                ],
                if (earlier.isNotEmpty) ...[
                  _GroupHeader(title: l10n.notificationsEarlier),
                  for (final n in earlier)
                    _NotificationCard(notification: n, onTap: () => onOpen(n)),
                ],
                const SizedBox(height: AppSpacing.s4),
                Text(
                  l10n.notificationsFooter,
                  style: context.text.caption,
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        const BOHSliverBottomSpacer(),
      ],
    );
  }
}

class _GroupHeader extends StatelessWidget {
  const _GroupHeader({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsetsDirectional.only(
        top: AppSpacing.s8,
        bottom: AppSpacing.s8,
        start: AppSpacing.s4,
      ),
      child: BOHEyebrow(title, fontSize: 11),
    );
  }
}

/// Icon tile by category, title with its time, the message and an unread
/// dot. Unread cards carry the accent border.
class _NotificationCard extends StatelessWidget {
  const _NotificationCard({required this.notification, required this.onTap});

  final AppNotification notification;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    final n = notification;
    final time = l10n.relativeTime(n.createdAt);
    final category = n.category.label(l10n);
    final update = n.applicationUpdate;
    final title = update == null
        ? n.title
        : l10n.notificationApplicationTitle(update.status.wireValue);
    final body = update == null
        ? n.body
        : l10n.notificationApplicationBody(
            update.status.wireValue,
            update.opportunityTitle,
          );

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.gridGap),
      child: BOHCard(
        onTap: onTap,
        unread: !n.read,
        borderRadius: AppRadii.listCardAll,
        padding: const EdgeInsets.all(AppSpacing.s12),
        semanticLabel: [
          if (!n.read) l10n.notificationUnread,
          category,
          title,
          body,
          time,
        ].join('. '),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            BOHIconCircle(
              icon: n.category.icon,
              size: 42,
              rounded: true,
              tone: n.category.tone,
            ),
            const SizedBox(width: AppSpacing.s12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Text(
                          title,
                          style: context.text.label,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.s8),
                      Text(time, style: context.text.caption),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    body,
                    style: context.text.bodySmall.copyWith(height: 17 / 12),
                  ),
                  if (n.pointsDelta != null) ...[
                    const SizedBox(height: AppSpacing.s6),
                    BOHStatusBadge(
                      l10n.notificationPointsLogged(n.pointsDelta!),
                      tone: BOHStatusTone.warning,
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(width: AppSpacing.s8),
            Container(
              width: 8,
              height: 8,
              margin: const EdgeInsets.only(top: AppSpacing.s4),
              decoration: BoxDecoration(
                color: n.read ? null : c.primary,
                shape: BoxShape.circle,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
