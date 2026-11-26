import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/l10n/content_language.dart';
import '../../../../core/utils/paginated.dart';
import '../../../companies/data/companies_data.dart';
import '../../../companies/domain/company.dart';
import '../../../events/data/events_data.dart';
import '../../../opportunities/data/opportunities_data.dart';
import '../../../opportunities/domain/opportunity.dart';
import '../../../professionals/data/professionals_data.dart';
import '../../../professionals/domain/professional.dart';

/// Directory sizes shown on the Discover tiles.
typedef DirectoryCounts = ({
  int companies,
  int professionals,
  int events,
  int opportunities,
});

final directoryCountsProvider = FutureProvider.autoDispose<DirectoryCounts>((
  ref,
) async {
  final (companies, professionals, events, opportunities) = await (
    ref.watch(companiesRepositoryProvider).countVerified(),
    ref.watch(professionalsRepositoryProvider).countVerified(),
    ref.watch(eventsRepositoryProvider).countUpcoming(),
    ref.watch(opportunitiesRepositoryProvider).countActive(),
  ).wait;
  return (
    companies: companies,
    professionals: professionals,
    events: events,
    opportunities: opportunities,
  );
});

final recommendedOpportunitiesProvider =
    FutureProvider.autoDispose<List<Opportunity>>((ref) async {
      ref.watch(contentLanguageProvider);
      final page = await ref
          .watch(opportunitiesRepositoryProvider)
          .getOpportunities((
            type: null,
            query: '',
          ), const PageRequest(pageSize: 4));
      return page.items;
    });

/// Companies to watch, with an optimistic follow toggle. Editorial and
/// free: not a paid "Featured" placement.
class CompaniesToWatchController extends AsyncNotifier<List<Company>> {
  @override
  Future<List<Company>> build() async {
    ref.watch(contentLanguageProvider);
    final page = await ref
        .watch(companiesRepositoryProvider)
        .getCompanies(const PageRequest(pageSize: 5));
    return page.items;
  }

  Future<void> toggleFollow(Company company) async {
    final current = state.value;
    if (current == null) return;
    final next = !company.followed;
    _replace(company.copyWith(followed: next));
    try {
      _replace(
        await ref
            .read(companiesRepositoryProvider)
            .setFollowing(company.id, following: next),
      );
    } catch (_) {
      _replace(company);
      rethrow;
    }
  }

  void _replace(Company updated) {
    final current = state.value;
    if (current == null) return;
    state = AsyncData([
      for (final c in current) c.id == updated.id ? updated : c,
    ]);
  }
}

final companiesToWatchProvider =
    AsyncNotifierProvider<CompaniesToWatchController, List<Company>>(
      CompaniesToWatchController.new,
    );

/// Suggested professionals with an optimistic connect toggle.
class SuggestedProfessionalsController
    extends AsyncNotifier<List<Professional>> {
  @override
  Future<List<Professional>> build() async {
    ref.watch(contentLanguageProvider);
    final page = await ref
        .watch(professionalsRepositoryProvider)
        .getProfessionals(const PageRequest(pageSize: 4));
    return page.items;
  }

  Future<void> toggleConnect(Professional person) async {
    final next = !person.connected;
    _replace(person.copyWith(connected: next));
    try {
      _replace(
        await ref
            .read(professionalsRepositoryProvider)
            .setConnected(person.id, connected: next),
      );
    } catch (_) {
      _replace(person);
      rethrow;
    }
  }

  void _replace(Professional updated) {
    final current = state.value;
    if (current == null) return;
    state = AsyncData([
      for (final p in current) p.id == updated.id ? updated : p,
    ]);
  }
}

final suggestedProfessionalsProvider =
    AsyncNotifierProvider<SuggestedProfessionalsController, List<Professional>>(
      SuggestedProfessionalsController.new,
    );
