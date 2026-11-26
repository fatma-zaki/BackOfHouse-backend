import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/l10n/content_language.dart';
import '../../../../core/utils/paginated.dart';
import '../../../opportunities/data/opportunities_data.dart';
import '../../../opportunities/domain/opportunity.dart';
import '../../data/companies_data.dart';
import '../../domain/company.dart';
import '../../domain/company_project.dart';

/// A company's public profile, as members see it, with an optimistic follow
/// toggle.
class CompanyDetailController extends AsyncNotifier<Company> {
  CompanyDetailController(this.companyId);

  final String companyId;

  @override
  Future<Company> build() {
    ref.watch(contentLanguageProvider);
    return ref.watch(companiesRepositoryProvider).getCompany(companyId);
  }

  /// Rolls back and rethrows if the call fails.
  Future<void> toggleFollow() async {
    final current = state.value;
    if (current == null) return;
    final next = !current.followed;
    state = AsyncData(current.copyWith(followed: next));
    try {
      state = AsyncData(
        await ref
            .read(companiesRepositoryProvider)
            .setFollowing(companyId, following: next),
      );
    } catch (error, stack) {
      state = AsyncData(current);
      Error.throwWithStackTrace(error, stack);
    }
  }
}

final companyDetailProvider = AsyncNotifierProvider.autoDispose
    .family<CompanyDetailController, Company, String>(
      CompanyDetailController.new,
    );

/// A company's public portfolio, newest first.
final companyProjectsProvider = FutureProvider.autoDispose
    .family<List<CompanyProject>, String>((ref, companyId) {
      ref.watch(contentLanguageProvider);
      return ref.watch(companiesRepositoryProvider).getProjects(companyId);
    });

/// A company's published listings visible to the signed-in account.
final companyOpenOpportunitiesProvider = FutureProvider.autoDispose
    .family<List<Opportunity>, String>((ref, companyId) {
      ref.watch(contentLanguageProvider);
      return ref.watch(opportunitiesRepositoryProvider).getByCompany(companyId);
    });

/// The companies directory, with an optimistic follow toggle.
class CompaniesDirectoryController extends PagedNotifier<Company> {
  CompaniesDirectoryController(this.query);

  final CompaniesQuery query;

  @override
  void watchDependencies() => ref.watch(contentLanguageProvider);

  @override
  Future<Paginated<Company>> fetchPage(PageRequest request) =>
      ref.read(companiesRepositoryProvider).getCompanies(request, query: query);

  /// Rolls back and rethrows if the call fails.
  Future<void> toggleFollow(Company company) async {
    final next = !company.followed;
    updateWhere((c) => c.id == company.id, (c) => c.copyWith(followed: next));
    try {
      final saved = await ref
          .read(companiesRepositoryProvider)
          .setFollowing(company.id, following: next);
      updateWhere((c) => c.id == saved.id, (_) => saved);
    } catch (error, stack) {
      updateWhere((c) => c.id == company.id, (_) => company);
      Error.throwWithStackTrace(error, stack);
    }
  }
}

final companiesDirectoryProvider = AsyncNotifierProvider.autoDispose
    .family<CompaniesDirectoryController, PagedState<Company>, CompaniesQuery>(
      CompaniesDirectoryController.new,
    );
