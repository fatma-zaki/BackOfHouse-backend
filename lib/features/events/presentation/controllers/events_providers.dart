import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/l10n/content_language.dart';
import '../../../../core/utils/paginated.dart';
import '../../data/events_data.dart';
import '../../domain/event.dart';

class EventsController extends PagedNotifier<Event> {
  EventsController(this.query);

  final EventsQuery query;

  @override
  void watchDependencies() => ref.watch(contentLanguageProvider);

  @override
  Future<Paginated<Event>> fetchPage(PageRequest request) =>
      ref.read(eventsRepositoryProvider).getEvents(query, request);
}

final eventsProvider = AsyncNotifierProvider.autoDispose
    .family<EventsController, PagedState<Event>, EventsQuery>(
      EventsController.new,
    );

/// First few upcoming events, for Home and Discover.
final upcomingEventsProvider = FutureProvider.autoDispose<List<Event>>((
  ref,
) async {
  ref.watch(contentLanguageProvider);
  final page = await ref.watch(eventsRepositoryProvider).getEvents((
    type: null,
    query: '',
  ), const PageRequest(pageSize: 3));
  return page.items;
});

class EventDetailController extends AsyncNotifier<Event> {
  EventDetailController(this.id);

  final String id;

  @override
  Future<Event> build() {
    ref.watch(contentLanguageProvider);
    return ref.watch(eventsRepositoryProvider).getEvent(id);
  }

  /// Optimistic toggle; rolls back if the call fails.
  Future<void> toggleRegistration() async {
    final current = state.value;
    if (current == null) return;
    final next = !current.isRegistered;
    state = AsyncData(
      current.copyWith(
        isRegistered: next,
        attendees: current.attendees + (next ? 1 : -1),
      ),
    );
    try {
      final updated = await ref
          .read(eventsRepositoryProvider)
          .setRegistration(id, registered: next);
      state = AsyncData(updated);
      ref.invalidate(upcomingEventsProvider);
    } catch (error, stack) {
      state = AsyncData(current);
      Error.throwWithStackTrace(error, stack);
    }
  }
}

final eventDetailProvider = AsyncNotifierProvider.autoDispose
    .family<EventDetailController, Event, String>(EventDetailController.new);
