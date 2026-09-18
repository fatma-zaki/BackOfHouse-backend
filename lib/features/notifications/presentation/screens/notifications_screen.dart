import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
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
    NotificationCategory.events => AppIcons.registered,
    NotificationCategory.credentials => AppIcons.identity,
    NotificationCategory.news => AppIcons.news,
  };
}

extension on AppNotification {
  String actionLabel(AppLocalizations l10n) => switch (targetType) {
    NotificationTargetType.opportunity => l10n.notificationActionApplication,
    NotificationTargetType.event => l10n.notificationActionEvent,
    NotificationTargetType.profile => l10n.notificationActionCredential,
    NotificationTargetType.reward => l10n.notificationActionLedger,
    NotificationTargetType.article => l10n.actionReadBriefing,
  };

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
      appBar: BOHAppBar(title: l10n.notificationsLabel),
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
    final c = context.colors;
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
        BOHSliverPadding(
          top: AppSpacing.s8,
          sliver: SliverToBoxAdapter(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Semantics(
                        header: true,
                        child: Text(
                          l10n.notificationsInbox,
                          style: context.text.h1,
                        ),
                      ),
                      Semantics(
                        liveRegion: true,
                        child: Text(
                          l10n.notificationsUnread(unread),
                          style: context.text.body.copyWith(
                            color: c.primaryText,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                if (unread > 0)
                  BOHButton(
                    label: l10n.notificationsMarkAllRead,
                    variant: BOHButtonVariant.text,
                    trailingIcon: null,
                    leadingIcon: AppIcons.check,
                    expand: false,
                    onPressed: () =>
                        ref.read(notificationsProvider.notifier).markAllRead(),
                  ),
              ],
            ),
          ),
        ),
        SliverToBoxAdapter(
          child: SizedBox(
            height: 64,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: BOHScaffold.screenPadding.add(
                const EdgeInsets.symmetric(vertical: AppSpacing.s12),
              ),
              children: [
                for (final option in <NotificationCategory?>[
                  null,
                  ...NotificationCategory.values,
                ])
                  Padding(
                    padding: const EdgeInsetsDirectional.only(
                      end: AppSpacing.s8,
                    ),
                    child: BOHCategoryChip(
                      label:
                          option?.label(l10n) ??
                          l10n.notificationsAllCount(all.length),
                      selected: category == option,
                      onSelected: () => onCategory(option),
                    ),
                  ),
              ],
            ),
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
                  _GroupHeader(
                    title: l10n.notificationsToday,
                    trailing: l10n.notificationsTimezone,
                  ),
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
                const SizedBox(height: AppSpacing.s8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      AppIcons.verified,
                      size: AppSizes.iconSmall,
                      color: c.textMuted,
                    ),
                    const SizedBox(width: AppSpacing.s4),
                    Flexible(
                      child: Text(
                        l10n.notificationsFooter,
                        style: context.text.caption,
                        textAlign: TextAlign.center,
                      ),
                    ),
                  ],
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
  const _GroupHeader({required this.title, this.trailing});

  final String title;
  final String? trailing;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(
        top: AppSpacing.s8,
        bottom: AppSpacing.s12,
      ),
      child: Row(
        children: [
          Expanded(child: BOHEyebrow(title, color: context.colors.textPrimary)),
          if (trailing != null) Text(trailing!, style: context.text.caption),
        ],
      ),
    );
  }
}

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
      padding: const EdgeInsets.only(bottom: AppSpacing.s12),
      child: BOHCard(
        onTap: onTap,
        color: n.read ? null : c.primaryWash,
        semanticLabel: [
          if (!n.read) l10n.notificationUnread,
          category,
          title,
          body,
          time,
        ].join('. '),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                BOHIconCircle(
                  icon: n.category.icon,
                  size: 40,
                  rounded: true,
                  tone: n.read
                      ? BOHIconCircleTone.neutral
                      : BOHIconCircleTone.brand,
                ),
                const SizedBox(width: AppSpacing.s12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              context.isArabic
                                  ? category
                                  : category.toUpperCase(),
                              style: context.text.caption.copyWith(
                                color: c.primaryText,
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: AppSpacing.s8),
                          Text(time, style: context.text.caption),
                          const Spacer(),
                          if (!n.read)
                            Container(
                              width: 8,
                              height: 8,
                              decoration: BoxDecoration(
                                color: c.primary,
                                shape: BoxShape.circle,
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: AppSpacing.s4),
                      Text(
                        title,
                        style: context.text.cardTitle.copyWith(
                          fontWeight: n.read
                              ? FontWeight.w600
                              : FontWeight.w700,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.s4),
                      Text(body, style: context.text.body),
                      if (n.pointsDelta != null) ...[
                        const SizedBox(height: AppSpacing.s8),
                        BOHTag(
                          l10n.notificationPointsLogged(n.pointsDelta!),
                          variant: BOHTagVariant.gold,
                          icon: AppIcons.points,
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.s12),
            Divider(height: 1, color: c.borderSoft),
            const SizedBox(height: AppSpacing.s8),
            Row(
              children: [
                Expanded(
                  child: Text(
                    n.actionLabel(l10n),
                    style: context.text.labelMedium.copyWith(
                      color: c.primaryText,
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: AppSpacing.s4),
                Icon(
                  AppIcons.arrowForward,
                  size: AppSizes.iconSmall,
                  color: c.primaryText,
                ),
                const SizedBox(width: AppSpacing.s8),
                ConstrainedBox(
                  constraints: const BoxConstraints(maxWidth: 132),
                  child: BOHTag(n.source, variant: BOHTagVariant.neutral),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
