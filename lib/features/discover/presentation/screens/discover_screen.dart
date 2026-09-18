import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart' show NumberFormat;

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_radii.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/l10n_messages.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../auth/domain/account_type.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
import '../../../companies/presentation/controllers/company_workspace_providers.dart';
import '../../../events/domain/event.dart';
import '../../../events/presentation/controllers/events_providers.dart';
import '../../../events/presentation/widgets/event_widgets.dart';
import '../../../notifications/presentation/controllers/notifications_providers.dart';
import '../../../opportunities/domain/opportunity.dart';
import '../../../opportunities/presentation/widgets/opportunity_widgets.dart';
import '../../../profile/data/profile_data.dart';
import '../controllers/discover_providers.dart';
import '../widgets/ecosystem_cards.dart';

/// Ecosystem directory: the four directories, then recommendations drawn
/// from each — a company, a professional, a gathering and an open gig.
class DiscoverScreen extends ConsumerStatefulWidget {
  const DiscoverScreen({super.key});

  @override
  ConsumerState<DiscoverScreen> createState() => _DiscoverScreenState();
}

class _DiscoverScreenState extends ConsumerState<DiscoverScreen> {
  String _query = '';

  Future<void> _guard(Future<void> Function() action) async {
    try {
      await action();
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text(context.l10n.error(error))));
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    final searching = _query.trim().isNotEmpty;
    final profile = ref.watch(myProfileProvider).value;
    final unread = ref.watch(unreadNotificationsProvider);
    final individual =
        ref.watch(sessionAccountTypeProvider) == AccountType.individual;

    return BOHScaffold(
      appBar: BOHAppBar.brand(
        // Notifications and the member avatar are the individual's; a
        // company reaches its profile from the bottom bar.
        actions: [
          if (individual) ...[
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
        ],
      ),
      body: BOHRefresh(
        onRefresh: () async {
          ref
            ..invalidate(directoryCountsProvider)
            ..invalidate(companiesToWatchProvider)
            ..invalidate(suggestedProfessionalsProvider)
            ..invalidate(upcomingEventsProvider)
            ..invalidate(recommendedOpportunitiesProvider);
          await ref.read(directoryCountsProvider.future);
        },
        child: CustomScrollView(
          slivers: [
            BOHSliverPadding(
              top: AppSpacing.s8,
              sliver: SliverList.list(
                children: [
                  BOHPageHeader(
                    eyebrow: l10n.discoverEyebrow,
                    title: l10n.discoverTitle,
                    trailing: BOHStatusLabel(
                      label: l10n.discoverLiveFeed,
                      color: c.success,
                      filled: true,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.s16),
                  Row(
                    children: [
                      Expanded(
                        child: BOHSearchField(
                          hint: l10n.discoverSearchHint,
                          onChanged: (q) => setState(() => _query = q),
                        ),
                      ),
                      const SizedBox(width: AppSpacing.s8),
                      BOHIconButton(
                        icon: AppIcons.filter,
                        semanticLabel: l10n.actionFilters,
                        variant: BOHIconButtonVariant.tonal,
                        size: AppSizes.inputHeight,
                        onPressed: () => context.push(AppRoutes.events),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.s20),
                ],
              ),
            ),
            if (searching)
              _SearchResults(query: _query)
            else ...[
              const BOHSliverPadding(
                sliver: SliverToBoxAdapter(child: _DirectoryGrid()),
              ),
              BOHSliverPadding(
                top: AppSpacing.sectionSpacing,
                sliver: SliverList.list(
                  children: [
                    BOHSectionHeader(
                      title: l10n.discoverRecommended,
                      subtitle: l10n.discoverRecommendedSubtitle,
                      onAction: () => context.push(AppRoutes.companies),
                    ),
                    const SizedBox(height: AppSpacing.s12),
                    ..._recommendations(),
                  ],
                ),
              ),
            ],
            const BOHSliverBottomSpacer(),
          ],
        ),
      ),
    );
  }

  List<Widget> _recommendations() {
    final company = ref.watch(companiesToWatchProvider).value?.firstOrNull;
    final person = ref.watch(suggestedProfessionalsProvider).value?.firstOrNull;
    final events = ref.watch(upcomingEventsProvider).value;
    final gathering = events == null || events.isEmpty
        ? null
        : events.firstWhere((e) => e.accredited, orElse: () => events.first);
    // Open gigs are for individuals; companies find supplier requests in
    // their workspace.
    final individual =
        ref.watch(sessionAccountTypeProvider) == AccountType.individual;
    final gig = !individual
        ? null
        : ref
              .watch(recommendedOpportunitiesProvider)
              .value
              ?.where((o) => o.employment == EmploymentType.freelance)
              .firstOrNull;

    final loading = company == null && person == null && gathering == null;
    if (loading) {
      return const [
        BOHShimmer(
          child: Column(
            children: [
              BOHSkeleton(height: 140, borderRadius: AppRadii.mediumAll),
              SizedBox(height: AppSpacing.s12),
              BOHSkeleton(height: 140, borderRadius: AppRadii.mediumAll),
            ],
          ),
        ),
      ];
    }

    Widget spaced(Widget child) => Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.s12),
      child: child,
    );

    return [
      if (company != null)
        spaced(
          CompanyRecommendationCard(
            company: company,
            onTap: () => context.push(AppRoutes.company(company.id)),
            onFollow: () => _guard(
              () => ref
                  .read(companiesToWatchProvider.notifier)
                  .toggleFollow(company),
            ),
          ),
        ),
      if (person != null)
        spaced(
          ProfessionalCard(
            professional: person,
            onConnect: () => _guard(
              () => ref
                  .read(suggestedProfessionalsProvider.notifier)
                  .toggleConnect(person),
            ),
          ),
        ),
      if (gathering != null)
        spaced(
          EventFeatureCard(
            event: gathering,
            compact: true,
            eyebrow: context.l10n.discoverRecommendedGathering,
            onTap: () => context.push(AppRoutes.event(gathering.id)),
          ),
        ),
      if (gig != null)
        spaced(
          OpportunityCard(
            opportunity: gig,
            onTap: () => context.push(AppRoutes.opportunity(gig.id)),
          ),
        ),
    ];
  }
}

class _DirectoryGrid extends ConsumerWidget {
  const _DirectoryGrid();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final counts = ref.watch(directoryCountsProvider).value;
    final account = ref.watch(sessionAccountTypeProvider);
    final invited = account == AccountType.company
        ? ref.watch(invitedSupplierRequestsProvider).value
        : null;
    final compact = NumberFormat.compact(locale: 'en');
    String count(int? value) =>
        value == null ? '—' : compact.format(value).toLowerCase();

    final tiles = [
      BOHFeatureTile(
        icon: AppIcons.companies,
        title: l10n.routeCompanies,
        subtitle: l10n.directoryCompaniesCount(count(counts?.companies)),
        onTap: () => context.push(AppRoutes.companies),
      ),
      BOHFeatureTile(
        icon: AppIcons.professionals,
        tone: BOHIconCircleTone.gold,
        title: l10n.directoryProfessionals,
        subtitle: l10n.directoryProfessionalsCount(
          count(counts?.professionals),
        ),
        onTap: () => context.push(AppRoutes.professionals),
      ),
      BOHFeatureTile(
        icon: AppIcons.sectorVenues,
        tone: BOHIconCircleTone.error,
        title: l10n.eventsTitle,
        subtitle: l10n.directoryEventsCount(count(counts?.events)),
        onTap: () => context.push(AppRoutes.events),
      ),
      // Opportunities are individual-facing; a company's counterpart is
      // the supplier requests open to its type.
      if (account == AccountType.individual)
        BOHFeatureTile(
          icon: AppIcons.opportunities,
          title: l10n.directoryOpportunities,
          subtitle: l10n.directoryOpportunitiesCount(
            count(counts?.opportunities),
          ),
          onTap: () => context.push(AppRoutes.opportunities),
        )
      else
        BOHFeatureTile(
          icon: AppIcons.supplierRequests,
          title: l10n.companyNavSupplierRequests,
          subtitle: invited == null
              ? l10n.supplierRequestsSubtitle
              : l10n.supplierInvitedCount(invited.length),
          onTap: () => context.push(AppRoutes.companySupplierRequests),
        ),
    ];

    return Column(
      children: [
        for (var row = 0; row < tiles.length; row += 2) ...[
          if (row > 0) const SizedBox(height: AppSpacing.s12),
          IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(child: tiles[row]),
                const SizedBox(width: AppSpacing.s12),
                Expanded(child: tiles[row + 1]),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

/// While typing: matching events, newest first.
class _SearchResults extends ConsumerWidget {
  const _SearchResults({required this.query});

  final String query;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final EventsQuery key = (type: null, query: query);
    return BOHSliverPadding(
      sliver: BOHPagedSliverList<Event>(
        state: ref.watch(eventsProvider(key)),
        skeleton: const EventListSkeleton(),
        emptyIcon: AppIcons.search,
        emptyTitle: l10n.eventsEmptyTitle,
        emptyMessage: l10n.eventsEmptyMessage,
        onLoadMore: () => ref.read(eventsProvider(key).notifier).loadMore(),
        onRetry: () => ref.invalidate(eventsProvider(key)),
        itemBuilder: (context, event, i) => EventListItem(
          event: event,
          onTap: () => context.push(AppRoutes.event(event.id)),
        ),
      ),
    );
  }
}
