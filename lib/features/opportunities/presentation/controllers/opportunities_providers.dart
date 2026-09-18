import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/l10n/content_language.dart';
import '../../../../core/utils/paginated.dart';
import '../../../auth/domain/account_type.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
import '../../data/opportunities_data.dart';
import '../../domain/opportunity.dart';

/// Who would apply: the signed-in account's type and profile status.
final applicantProvider = Provider<Applicant>(
  (ref) => ref.watch(
    authControllerProvider.select(
      (s) => (
        accountType: s.value?.accountType ?? AccountType.individual,
        profileStatus: s.value?.profileStatus,
      ),
    ),
  ),
);

/// The signed-in account's type; individual while signed out.
final accountTypeProvider = Provider<AccountType>(
  (ref) => ref.watch(
    authControllerProvider.select(
      (s) => s.value?.accountType ?? AccountType.individual,
    ),
  ),
);

class OpportunitiesController extends PagedNotifier<Opportunity> {
  OpportunitiesController(this.query);

  final OpportunitiesQuery query;

  @override
  void watchDependencies() {
    ref
      ..watch(contentLanguageProvider)
      ..watch(accountTypeProvider);
  }

  @override
  Future<Paginated<Opportunity>> fetchPage(PageRequest request) => ref
      .read(opportunitiesRepositoryProvider)
      .getOpportunities(query, request);
}

final opportunitiesProvider = AsyncNotifierProvider.autoDispose
    .family<
      OpportunitiesController,
      PagedState<Opportunity>,
      OpportunitiesQuery
    >(OpportunitiesController.new);

final opportunityDetailProvider = FutureProvider.autoDispose
    .family<Opportunity, String>((ref, id) {
      ref
        ..watch(contentLanguageProvider)
        ..watch(accountTypeProvider);
      return ref.watch(opportunitiesRepositoryProvider).getOpportunity(id);
    });
