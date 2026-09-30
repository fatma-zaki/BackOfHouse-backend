import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../discover/presentation/controllers/discover_providers.dart';
import '../../domain/event.dart';
import '../controllers/events_providers.dart';
import '../widgets/event_widgets.dart';

/// Industry calendar: the flagship gathering first, then everything
/// scheduled, filterable by format.
class EventsScreen extends ConsumerStatefulWidget {
  const EventsScreen({super.key});

  @override
  ConsumerState<EventsScreen> createState() => _EventsScreenState();
}

class _EventsScreenState extends ConsumerState<EventsScreen> {
  EventType? _type;
  String _query = '';

  EventsQuery get _key => (type: _type, query: _query);

  bool get _filtering => _type != null || _query.trim().isNotEmpty;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    final events = ref.watch(eventsProvider(_key));
    final scheduled = ref.watch(directoryCountsProvider).value?.events;

    return BOHScaffold(
      appBar: BOHAppBar(title: l10n.eventsTitle),
      body: BOHRefresh(
        onRefresh: () => ref.read(eventsProvider(_key).notifier).refresh(),
        child: CustomScrollView(
          slivers: [
            BOHSliverPadding(
              top: AppSpacing.s8,
              sliver: SliverToBoxAdapter(
                child: BOHSearchField(
                  hint: l10n.eventsSearchHint,
                  onChanged: (q) => setState(() => _query = q),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: BOHFilterChips<EventType?>(
                options: [null, ...EventType.values],
                selected: _type,
                label: (t) => t?.filterLabel(l10n) ?? l10n.filterAll,
                onSelected: (t) => setState(() => _type = t),
              ),
            ),
            BOHSliverPadding(
              top: AppSpacing.s4,
              sliver: BOHPagedSliverList<Event>(
                state: events,
                skeleton: const EventListSkeleton(),
                emptyIcon: AppIcons.events,
                emptyTitle: l10n.eventsEmptyTitle,
                emptyMessage: l10n.eventsEmptyMessage,
                onLoadMore: () =>
                    ref.read(eventsProvider(_key).notifier).loadMore(),
                onRetry: () => ref.invalidate(eventsProvider(_key)),
                itemBuilder: (context, event, i) {
                  void open() => context.push(AppRoutes.event(event.id));
                  if (i == 0 && !_filtering) {
                    return BOHFadeSlide(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          EventFeatureCard(
                            event: event,
                            eyebrow: l10n.eventsFeatured,
                            onTap: open,
                          ),
                          const SizedBox(height: AppSpacing.sectionSpacing),
                          BOHSectionHeader(
                            title: l10n.upcomingEvents,
                            trailing: scheduled == null
                                ? null
                                : Text(
                                    l10n.eventsScheduled(scheduled),
                                    style: context.text.labelMedium.copyWith(
                                      color: c.textSecondary,
                                    ),
                                  ),
                          ),
                        ],
                      ),
                    );
                  }
                  return BOHFadeSlide(
                    delay: BOHFadeSlide.stagger(i),
                    child: EventListItem(event: event, onTap: open),
                  );
                },
              ),
            ),
            const BOHSliverBottomSpacer(),
          ],
        ),
      ),
    );
  }
}
