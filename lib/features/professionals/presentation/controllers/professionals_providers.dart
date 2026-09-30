import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/l10n/content_language.dart';
import '../../../../core/utils/paginated.dart';
import '../../data/professionals_data.dart';
import '../../domain/professional.dart';

/// The professionals directory, with an optimistic connect toggle.
class ProfessionalsDirectoryController extends PagedNotifier<Professional> {
  ProfessionalsDirectoryController(this.query);

  final ProfessionalsQuery query;

  @override
  void watchDependencies() => ref.watch(contentLanguageProvider);

  @override
  Future<Paginated<Professional>> fetchPage(PageRequest request) => ref
      .read(professionalsRepositoryProvider)
      .getProfessionals(request, query: query);

  /// Rolls back and rethrows if the call fails.
  Future<void> toggleConnect(Professional person) async {
    final next = !person.connected;
    updateWhere((p) => p.id == person.id, (p) => p.copyWith(connected: next));
    try {
      final saved = await ref
          .read(professionalsRepositoryProvider)
          .setConnected(person.id, connected: next);
      updateWhere((p) => p.id == saved.id, (_) => saved);
    } catch (error, stack) {
      updateWhere((p) => p.id == person.id, (_) => person);
      Error.throwWithStackTrace(error, stack);
    }
  }
}

final professionalsDirectoryProvider = AsyncNotifierProvider.autoDispose
    .family<
      ProfessionalsDirectoryController,
      PagedState<Professional>,
      ProfessionalsQuery
    >(ProfessionalsDirectoryController.new);
