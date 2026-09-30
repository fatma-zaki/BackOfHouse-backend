import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_radii.dart';
import '../../../../app/theme/app_shadows.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/l10n_messages.dart';
import '../../../../core/utils/date_formats.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../discover/presentation/controllers/discover_providers.dart';
import '../../../events/presentation/controllers/events_providers.dart';
import '../../../events/presentation/widgets/event_widgets.dart';
import '../../../notifications/presentation/controllers/notifications_providers.dart';
import '../../../opportunities/presentation/widgets/opportunity_widgets.dart';
import '../../../profile/data/profile_data.dart';
import '../../../profile/domain/profile.dart';
import '../../../rewards/domain/rewards_models.dart';
import '../../../rewards/presentation/controllers/rewards_providers.dart';

/// The member's day: a greeting, their points, the flagship event and
/// opportunities that fit.
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  Future<void> _refresh(WidgetRef ref) async {
    ref
      ..invalidate(myProfileProvider)
      ..invalidate(pointsSummaryProvider)
      ..invalidate(upcomingEventsProvider)
      ..invalidate(recommendedOpportunitiesProvider);
    await ref.read(myProfileProvider.future);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final profile = ref.watch(myProfileProvider).value;
    final unread = ref.watch(unreadNotificationsProvider);

    return BOHScaffold(
      appBar: BOHAppBar.brand(
        actions: [
          BOHIconButton(
            icon: AppIcons.search,
            iconSize: AppSizes.iconLarge,
            semanticLabel: l10n.actionSearch,
            onPressed: () => context.go(AppRoutes.discover),
          ),
          BOHIconButton(
            icon: AppIcons.notifications,
            iconSize: AppSizes.iconLarge,
            semanticLabel: unread > 0
                ? l10n.notificationsUnreadCount(unread)
                : l10n.notificationsLabel,
            showBadge: unread > 0,
            onPressed: () => context.push(AppRoutes.notifications),
          ),
          if (profile != null)
            Padding(
              padding: const EdgeInsetsDirectional.only(end: 2),
              child: BOHAvatar(
                name: profile.name,
                image: profile.avatar,
                dimension: 34,
                ring: true,
                semanticLabel: l10n.profileAvatarLabel,
                onTap: () => context.go(AppRoutes.profile),
              ),
            ),
        ],
      ),
      body: BOHRefresh(
        onRefresh: () => _refresh(ref),
        child: ListView(
          padding: EdgeInsets.fromLTRB(
            AppSpacing.screenHorizontal,
            AppSpacing.s8,
            AppSpacing.screenHorizontal,
            MediaQuery.paddingOf(context).bottom + AppSpacing.s24,
          ),
          children: [
            if (profile == null)
              const BOHShimmer(child: BOHSkeleton(height: 52))
            else
              _Greeting(profile: profile),
            const SizedBox(height: AppSpacing.s16),
            const _PointsCard(),
            const SizedBox(height: AppSpacing.s16),
            BOHSectionHeader(
              title: l10n.homeFlagshipEvent,
              onAction: () => context.push(AppRoutes.events),
            ),
            const SizedBox(height: AppSpacing.gridGap),
            const _FlagshipEvent(),
            const SizedBox(height: AppSpacing.s16),
            BOHSectionHeader(
              title: l10n.homeOpportunitiesForYou,
              leadingIcon: AppIcons.listings,
              onAction: () => context.push(AppRoutes.opportunities),
            ),
            const SizedBox(height: AppSpacing.gridGap),
            const _Opportunities(),
          ],
        ),
      ),
    );
  }
}

class _Greeting extends StatelessWidget {
  const _Greeting({required this.profile});

  final Profile profile;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    final now = DateTime.now();
    final greeting = switch (now.hour) {
      < 12 => l10n.homeGreetingMorning,
      < 17 => l10n.homeGreetingAfternoon,
      _ => l10n.homeGreetingEvening,
    };
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s4),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            AppDateFormats.weekdayDayMonth(context).format(now),
            style: context.text.body.copyWith(
              height: 18 / 13,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 2),
          Semantics(
            header: true,
            child: Text.rich(
              TextSpan(
                text: greeting,
                children: [
                  TextSpan(
                    text: profile.firstName,
                    style: TextStyle(color: c.headlineAccent),
                  ),
                ],
              ),
              style: context.text.h1,
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}

/// Points balance, progress through the current points level and a way
/// into Rewards. Points levels are a rewards concept, never verification.
class _PointsCard extends ConsumerWidget {
  const _PointsCard();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summary = ref.watch(pointsSummaryProvider).value;
    if (summary == null) {
      return const BOHShimmer(
        child: BOHSkeleton(height: 94, borderRadius: AppRadii.largeAll),
      );
    }
    return BOHPointsSummaryCard(
      summary: summary,
      onTap: () => context.go(AppRoutes.rewards),
    );
  }
}

/// Compact points card — Home. Tapping anywhere opens Rewards.
class BOHPointsSummaryCard extends StatelessWidget {
  const BOHPointsSummaryCard({
    super.key,
    required this.summary,
    required this.onTap,
  });

  final PointsSummary summary;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    final text = context.text;
    final next = summary.level.next;

    return BOHCard(
      onTap: onTap,
      semanticLabel: l10n.actionOpenRewards,
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.s16,
        vertical: AppSpacing.s14,
      ),
      child: Row(
        children: [
          Container(
            width: 44,
            height: 44,
            decoration: BoxDecoration(
              color: c.primary,
              shape: BoxShape.circle,
              boxShadow: AppShadows.violet(c, blur: 18, dy: 6),
            ),
            alignment: Alignment.center,
            child: BOHGlyph(BOHGlyphType.star, size: 22, color: c.onPrimary),
          ),
          const SizedBox(width: AppSpacing.s14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text(
                      l10n.formatCount(summary.balance),
                      style: text.number(22, lineHeight: 26),
                    ),
                    const SizedBox(width: AppSpacing.s6),
                    Text(
                      l10n.pointsUnit,
                      style: text.label.copyWith(
                        color: c.textSecondary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.s6),
                BOHProgressBar(value: summary.levelProgress),
                const SizedBox(height: AppSpacing.s6),
                Text.rich(
                  TextSpan(
                    children: [
                      TextSpan(
                        text: l10n.pointsLevel(summary.level.number),
                        style: TextStyle(
                          color: c.textPrimary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                      TextSpan(
                        text: next == null
                            ? ' · ${l10n.pointsTopLevel}'
                            : ' · ${l10n.pointsToLevel(summary.pointsToNextLevel, next.number)}',
                      ),
                    ],
                  ),
                  style: text.bodySmall,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.s8),
          ExcludeSemantics(
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: c.border),
              ),
              child: Icon(
                AppIcons.arrowForward,
                size: 18,
                color: c.primaryText,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _FlagshipEvent extends ConsumerWidget {
  const _FlagshipEvent();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final events = ref.watch(upcomingEventsProvider);
    return switch (events) {
      AsyncData(value: [final event, ...]) => BOHFadeSlide(
        child: EventFeatureCard(
          event: event,
          onTap: () => context.push(AppRoutes.event(event.id)),
        ),
      ),
      AsyncError(:final error) => SizedBox(
        height: 196,
        child: BOHErrorState(
          error: error,
          onRetry: () => ref.invalidate(upcomingEventsProvider),
        ),
      ),
      AsyncData() => const SizedBox.shrink(),
      _ => const BOHShimmer(
        child: BOHSkeleton(height: 196, borderRadius: AppRadii.largeAll),
      ),
    };
  }
}

class _Opportunities extends ConsumerWidget {
  const _Opportunities();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final opportunities = ref.watch(recommendedOpportunitiesProvider);
    return switch (opportunities) {
      AsyncData(:final value) => Column(
        children: [
          for (final o in value.take(2))
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.gridGap),
              child: OpportunityRowCard(
                opportunity: o,
                onTap: () => context.push(AppRoutes.opportunity(o.id)),
              ),
            ),
        ],
      ),
      AsyncError(:final error) => SizedBox(
        height: 200,
        child: BOHErrorState(
          error: error,
          onRetry: () => ref.invalidate(recommendedOpportunitiesProvider),
        ),
      ),
      _ => const OpportunityListSkeleton(count: 2, height: 74),
    };
  }
}
