import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../events/domain/event.dart';
import '../../../events/presentation/controllers/events_providers.dart';
import '../../../events/presentation/widgets/event_widgets.dart';
import '../../../notifications/presentation/controllers/notifications_providers.dart';

/// Discover (individuals only): search, the directory sections, event
/// categories and the upcoming events list. Typing or picking a category
/// filters the list in place.
class DiscoverScreen extends ConsumerStatefulWidget {
  const DiscoverScreen({super.key});

  @override
  ConsumerState<DiscoverScreen> createState() => _DiscoverScreenState();
}

enum _Section { events, opportunities, companies, professionals, courses }

class _DiscoverScreenState extends ConsumerState<DiscoverScreen> {
  final _search = TextEditingController();
  String _query = '';
  EventType? _type;

  @override
  void dispose() {
    _search.dispose();
    super.dispose();
  }

  void _setQuery(String q) {
    _search.text = q;
    setState(() => _query = q);
  }

  void _clearFilters() {
    _search.clear();
    setState(() {
      _query = '';
      _type = null;
    });
  }

  void _openSection(_Section section) {
    final route = switch (section) {
      _Section.events => null,
      _Section.opportunities => AppRoutes.opportunities,
      _Section.companies => AppRoutes.companies,
      _Section.professionals => AppRoutes.professionals,
      _Section.courses => AppRoutes.courses,
    };
    if (route != null) context.push(route);
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final unread = ref.watch(unreadNotificationsProvider);
    final EventsQuery key = (type: _type, query: _query.trim());
    final filtered = key.query.isNotEmpty || _type != null;

    String sectionLabel(_Section s) => switch (s) {
      _Section.events => l10n.eventsTitle,
      _Section.opportunities => l10n.directoryOpportunities,
      _Section.companies => l10n.routeCompanies,
      _Section.professionals => l10n.directoryProfessionals,
      _Section.courses => l10n.routeCourses,
    };

    return BOHScaffold(
      appBar: BOHAppBar.tab(
        title: l10n.navDiscover,
        actions: [
          BOHIconButton(
            icon: AppIcons.notifications,
            iconSize: AppSizes.iconLarge,
            semanticLabel: unread > 0
                ? l10n.notificationsUnreadCount(unread)
                : l10n.notificationsLabel,
            showBadge: unread > 0,
            onPressed: () => context.push(AppRoutes.notifications),
          ),
        ],
      ),
      body: BOHRefresh(
        onRefresh: () async => ref.invalidate(eventsProvider(key)),
        child: CustomScrollView(
          slivers: [
            BOHSliverPadding(
              top: AppSpacing.s8,
              sliver: SliverList.list(
                children: [
                  BOHSearchField(
                    controller: _search,
                    hint: l10n.discoverSearchHint,
                    onChanged: (q) => setState(() => _query = q),
                    onFilter: () => context.push(AppRoutes.events),
                    filterLabel: l10n.actionFilters,
                  ),
                  const SizedBox(height: AppSpacing.s6),
                ],
              ),
            ),
            SliverToBoxAdapter(
              child: Semantics(
                label: l10n.discoverSections,
                child: BOHFilterChips<_Section>(
                  options: _Section.values,
                  selected: _Section.events,
                  label: sectionLabel,
                  large: true,
                  padding: BOHScaffold.screenPadding,
                  onSelected: _openSection,
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: BOHFilterChips<EventType?>(
                options: [null, ...EventType.values],
                selected: _type,
                label: (t) => t?.filterLabel(l10n) ?? l10n.filterAll,
                icon: (t) => t?.icon ?? AppIcons.categoryAll,
                padding: const EdgeInsetsDirectional.fromSTEB(
                  AppSpacing.screenHorizontal,
                  AppSpacing.s8,
                  AppSpacing.screenHorizontal,
                  AppSpacing.s16,
                ),
                onSelected: (t) => setState(() => _type = t),
              ),
            ),
            BOHSliverPadding(
              sliver: SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.gridGap),
                  child: BOHSectionHeader(
                    title: l10n.discoverUpcomingEvents,
                    actionLabel: l10n.discoverCalendar,
                    onAction: () => context.push(AppRoutes.events),
                  ),
                ),
              ),
            ),
            BOHSliverPadding(
              sliver: BOHPagedSliverList<Event>(
                state: ref.watch(eventsProvider(key)),
                spacing: AppSpacing.gridGap,
                skeleton: const EventListSkeleton(),
                empty: _NoResults(
                  activeType: _type,
                  onRemoveType: () => setState(() => _type = null),
                  onSuggestion: _setQuery,
                  onClear: filtered ? _clearFilters : null,
                ),
                onLoadMore: () =>
                    ref.read(eventsProvider(key).notifier).loadMore(),
                onRetry: () => ref.invalidate(eventsProvider(key)),
                itemBuilder: (context, event, i) => EventListItem(
                  event: event,
                  onTap: () => context.push(AppRoutes.event(event.id)),
                ),
              ),
            ),
            const BOHSliverBottomSpacer(),
          ],
        ),
      ),
    );
  }
}

/// "No events match your search" with the active filter, popular searches
/// and a way to clear everything.
class _NoResults extends StatelessWidget {
  const _NoResults({
    required this.activeType,
    required this.onRemoveType,
    required this.onSuggestion,
    required this.onClear,
  });

  final EventType? activeType;
  final VoidCallback onRemoveType;
  final ValueChanged<String> onSuggestion;
  final VoidCallback? onClear;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final suggestions = [
      l10n.searchSuggestionLightShows,
      l10n.searchSuggestionConcerts,
      l10n.searchSuggestionRiyadh,
    ];
    final type = activeType;
    return BOHEmptyState(
      title: l10n.eventsEmptyTitle,
      message: l10n.eventsEmptyMessage,
      actionLabel: onClear == null ? null : l10n.actionClearFilters,
      onAction: onClear,
      extra: Column(
        children: [
          if (type != null) ...[
            BOHRemovableChip(
              label: type.filterLabel(l10n),
              removeLabel: l10n.actionRemoveFilter(type.filterLabel(l10n)),
              onRemove: onRemoveType,
            ),
            const SizedBox(height: AppSpacing.s4),
          ],
          Wrap(
            alignment: WrapAlignment.center,
            spacing: AppSpacing.s8,
            children: [
              for (final s in suggestions)
                BOHCategoryChip(
                  label: s,
                  selected: false,
                  onSelected: () => onSuggestion(s),
                ),
            ],
          ),
        ],
      ),
    );
  }
}
