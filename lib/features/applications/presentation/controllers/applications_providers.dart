import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/l10n/content_language.dart';
import '../../../auth/domain/account_type.dart';
import '../../../notifications/presentation/controllers/notifications_providers.dart';
import '../../../opportunities/presentation/controllers/opportunities_providers.dart';
import '../../data/applications_data.dart';
import '../../domain/application.dart';

/// The signed-in individual's applications. Empty for company accounts,
/// which do not apply as individuals.
class MyApplicationsController extends AsyncNotifier<List<Application>> {
  @override
  Future<List<Application>> build() async {
    ref.watch(contentLanguageProvider);
    if (ref.watch(accountTypeProvider) != AccountType.individual) return [];
    return ref.watch(applicationsRepositoryProvider).getMyApplications();
  }

  Future<Application> submit(ApplicationDraft draft) async {
    final created = await ref
        .read(applicationsRepositoryProvider)
        .submit(draft);
    _upsert(created);
    ref.invalidate(notificationsProvider);
    return created;
  }

  Future<void> withdraw(Application application) async {
    _upsert(
      await ref.read(applicationsRepositoryProvider).withdraw(application.id),
    );
    ref.invalidate(notificationsProvider);
  }

  void _upsert(Application updated) {
    final current = state.value ?? const [];
    state = AsyncData([
      updated,
      for (final a in current)
        if (a.id != updated.id) a,
    ]);
  }
}

final myApplicationsProvider =
    AsyncNotifierProvider<MyApplicationsController, List<Application>>(
      MyApplicationsController.new,
    );

/// The applicant's history with one listing, most recently updated first.
final applicationsForOpportunityProvider = Provider.autoDispose
    .family<AsyncValue<List<Application>>, String>((ref, opportunityId) {
      return ref
          .watch(myApplicationsProvider)
          .whenData(
            (apps) => [
              for (final a in apps)
                if (a.opportunityId == opportunityId) a,
            ],
          );
    });
