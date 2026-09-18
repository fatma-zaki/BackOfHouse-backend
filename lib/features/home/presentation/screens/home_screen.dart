import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_radii.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../discover/presentation/controllers/discover_providers.dart';
import '../../../discover/presentation/widgets/ecosystem_cards.dart';
import '../../../events/presentation/controllers/events_providers.dart';
import '../../../events/presentation/widgets/event_widgets.dart';
import '../../../notifications/presentation/controllers/notifications_providers.dart';
import '../../../opportunities/presentation/widgets/opportunity_widgets.dart';
import '../../../profile/data/profile_data.dart';
import '../../../profile/domain/profile.dart';
import '../../../profile/domain/profile_status.dart';

/// Professional dashboard: standing, the lead briefing, companies to watch,
/// what's on the calendar and roles that fit.
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  Future<void> _refresh(WidgetRef ref) async {
    ref
      ..invalidate(myProfileProvider)
      ..invalidate(latestArticlesProvider)
      ..invalidate(companiesToWatchProvider)
      ..invalidate(upcomingEventsProvider)
      ..invalidate(recommendedOpportunitiesProvider);
    await ref.read(myProfileProvider.future);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final profile = ref.watch(myProfileProvider).value;
    final unread = ref.watch(unreadNotificationsProvider);
    final companyCount = ref.watch(directoryCountsProvider).value?.companies;

    Widget pad(Widget child) =>
        Padding(padding: BOHScaffold.screenPadding, child: child);

    return BOHScaffold(
      appBar: BOHAppBar.brand(
        title: l10n.navHome,
        actions: [
          BOHIconButton(
            icon: AppIcons.notifications,
            semanticLabel: unread > 0
                ? l10n.notificationsUnreadCount(unread)
                : l10n.notificationsLabel,
            showBadge: unread > 0,
            onPressed: () => context.push(AppRoutes.notifications),
          ),
          if (profile != null)
            BOHAvatar(
              name: profile.name,
              image: profile.avatar,
              size: BOHAvatarSize.small,
              semanticLabel: l10n.profileAvatarLabel,
              onTap: () => context.go(AppRoutes.profile),
            ),
        ],
      ),
      body: BOHRefresh(
        onRefresh: () => _refresh(ref),
        child: ListView(
          padding: EdgeInsets.only(
            top: AppSpacing.s12,
            bottom: MediaQuery.paddingOf(context).bottom + AppSpacing.s24,
          ),
          children: [
            pad(
              profile == null
                  ? const BOHShimmer(child: BOHSkeleton(height: 52))
                  : _WelcomeRow(profile: profile),
            ),
            const SizedBox(height: AppSpacing.s16),
            pad(const _BriefingHero()),
            const SizedBox(height: AppSpacing.sectionSpacing),
            pad(
              BOHSectionHeader(
                title: l10n.homeCompaniesToWatch,
                showDot: true,
                actionLabel: companyCount == null
                    ? l10n.actionViewAll
                    : l10n.actionViewAllCount(companyCount),
                onAction: () => context.push(AppRoutes.companies),
              ),
            ),
            const SizedBox(height: AppSpacing.s8),
            const _CompaniesCarousel(),
            const SizedBox(height: AppSpacing.sectionSpacing),
            pad(
              BOHSectionHeader(
                title: l10n.homeUpcomingIndustryEvents,
                actionLabel: l10n.actionViewCalendar,
                onAction: () => context.push(AppRoutes.events),
              ),
            ),
            const SizedBox(height: AppSpacing.s8),
            pad(const _EventsPreview()),
            const SizedBox(height: AppSpacing.s12),
            pad(
              BOHSectionHeader(
                title: l10n.homeRelevantOpportunities,
                actionLabel: l10n.actionBrowseAll,
                onAction: () => context.push(AppRoutes.opportunities),
              ),
            ),
            const SizedBox(height: AppSpacing.s8),
            pad(const _OpportunitiesPreview()),
            const SizedBox(height: AppSpacing.s12),
            if (profile != null) pad(_StandingCard(profile: profile)),
          ],
        ),
      ),
    );
  }
}

class _WelcomeRow extends StatelessWidget {
  const _WelcomeRow({required this.profile});

  final Profile profile;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;

    return Row(
      children: [
        BOHAvatar(
          name: profile.name,
          image: profile.avatar,
          size: BOHAvatarSize.medium,
          statusColor: c.success,
        ),
        const SizedBox(width: AppSpacing.s12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Semantics(
                header: true,
                child: Row(
                  children: [
                    Flexible(
                      child: Text(
                        l10n.homeWelcome(profile.firstName),
                        style: context.text.h2,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    if (profile.verified) ...[
                      const SizedBox(width: AppSpacing.s4),
                      Icon(
                        AppIcons.verified,
                        size: AppSizes.iconMedium,
                        color: c.gold,
                        semanticLabel: l10n.verifiedLabel,
                      ),
                    ],
                  ],
                ),
              ),
              Text(
                profile.headline,
                style: context.text.bodySmall,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        if (profile.status == ProfileStatus.student) ...[
          const SizedBox(width: AppSpacing.s8),
          BOHTag(
            l10n.profileStatusStudent,
            variant: BOHTagVariant.outline,
            icon: AppIcons.courses,
          ),
        ],
      ],
    );
  }
}

class _BriefingHero extends ConsumerWidget {
  const _BriefingHero();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final articles = ref.watch(latestArticlesProvider);
    return switch (articles) {
      // "For You" already leads with the breaking briefing.
      AsyncData(value: [final lead, ...]) => BOHFadeSlide(
        child: ArticleHeroCard(
          article: lead,
          onTap: () => context.push(AppRoutes.article(lead.id)),
        ),
      ),
      AsyncLoading() => const BOHShimmer(
        child: BOHSkeleton(height: 260, borderRadius: AppRadii.mediumAll),
      ),
      _ => const SizedBox.shrink(),
    };
  }
}

class _CompaniesCarousel extends ConsumerWidget {
  const _CompaniesCarousel();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final companies = ref.watch(companiesToWatchProvider);
    return switch (companies) {
      AsyncData(:final value) => BOHCarousel(
        children: [
          for (final company in value)
            CompanyCarouselCard(
              company: company,
              onTap: () => context.push(AppRoutes.company(company.id)),
            ),
        ],
      ),
      AsyncError(:final error) => SizedBox(
        height: 200,
        child: BOHErrorState(
          error: error,
          onRetry: () => ref.invalidate(companiesToWatchProvider),
        ),
      ),
      _ => const BOHCarousel(
        children: [
          BOHShimmer(child: BOHSkeleton(height: 150)),
          BOHShimmer(child: BOHSkeleton(height: 150)),
        ],
      ),
    };
  }
}

class _EventsPreview extends ConsumerWidget {
  const _EventsPreview();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final events = ref.watch(upcomingEventsProvider);
    return switch (events) {
      AsyncData(:final value) => Column(
        children: [
          for (final event in value.take(2))
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.s12),
              child: EventListItem(
                event: event,
                onTap: () => context.push(AppRoutes.event(event.id)),
              ),
            ),
        ],
      ),
      AsyncError(:final error) => SizedBox(
        height: 240,
        child: BOHErrorState(
          error: error,
          onRetry: () => ref.invalidate(upcomingEventsProvider),
        ),
      ),
      _ => const EventListSkeleton(count: 2),
    };
  }
}

class _OpportunitiesPreview extends ConsumerWidget {
  const _OpportunitiesPreview();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final opportunities = ref.watch(recommendedOpportunitiesProvider);
    return switch (opportunities) {
      AsyncData(:final value) => Column(
        children: [
          for (final o in value.take(2))
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.s12),
              child: OpportunityCard(
                opportunity: o,
                onTap: () => context.push(AppRoutes.opportunity(o.id)),
              ),
            ),
        ],
      ),
      AsyncError(:final error) => SizedBox(
        height: 240,
        child: BOHErrorState(
          error: error,
          onRetry: () => ref.invalidate(recommendedOpportunitiesProvider),
        ),
      ),
      _ => const BOHShimmer(
        child: Column(
          children: [
            BOHSkeleton(height: 140, borderRadius: AppRadii.mediumAll),
            SizedBox(height: AppSpacing.s12),
            BOHSkeleton(height: 140, borderRadius: AppRadii.mediumAll),
          ],
        ),
      ),
    };
  }
}

class _StandingCard extends StatelessWidget {
  const _StandingCard({required this.profile});

  final Profile profile;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;

    return BOHCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const BOHIconCircle(
                icon: AppIcons.identity,
                size: 40,
                rounded: true,
              ),
              const SizedBox(width: AppSpacing.s12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Semantics(
                      header: true,
                      child: Text(
                        l10n.standingTitle,
                        style: context.text.cardTitle,
                      ),
                    ),
                    const SizedBox(height: 2),
                    BOHStatusLabel(
                      label: l10n.standingActive,
                      color: c.success,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.s16),
          Container(
            padding: const EdgeInsets.all(AppSpacing.s12),
            decoration: BoxDecoration(
              color: c.backgroundSecondary,
              borderRadius: AppRadii.smallAll,
            ),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _Stat(
                  label: l10n.standingCredential,
                  value: l10n.verificationLevel(profile.verificationLevel),
                  note: l10n.geaVerified,
                  noteColor: c.gold,
                ),
                _Stat(
                  label: l10n.standingVisibility,
                  value: l10n.scoreOutOf100(profile.visibilityScore),
                  note: l10n.standingStrongSearch,
                  noteColor: c.success,
                ),
                _Stat(
                  label: l10n.standingAttendance,
                  value: l10n.pointsShort(profile.attendancePoints),
                  note: l10n.eventsCount(profile.eventsAttended),
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.s12),
          Text(l10n.standingNote, style: context.text.bodySmall),
          const SizedBox(height: AppSpacing.s12),
          BOHButton(
            label: l10n.standingAction,
            variant: BOHButtonVariant.secondary,
            size: BOHButtonSize.small,
            onPressed: () => context.push(AppRoutes.myPoints),
          ),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({
    required this.label,
    required this.value,
    required this.note,
    this.noteColor,
  });

  final String label;
  final String value;
  final String note;
  final Color? noteColor;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Expanded(
      child: MergeSemantics(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: context.text.caption),
            const SizedBox(height: 2),
            Text(value, style: context.text.label),
            Text(
              note,
              style: context.text.caption.copyWith(
                color: noteColor ?? c.textSecondary,
              ),
              maxLines: 2,
            ),
          ],
        ),
      ),
    );
  }
}
