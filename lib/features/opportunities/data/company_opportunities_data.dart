import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../companies/data/company_workspace_mock.dart';
import '../domain/opportunity.dart';

abstract interface class CompanyOpportunitiesDataSource {
  Future<List<Opportunity>> getMyOpportunities();
  Future<Opportunity> getMyOpportunity(String id);
  Future<Opportunity> createDraft(OpportunityDraft draft);
  Future<Opportunity> updateDraft(String id, OpportunityDraft draft);
  Future<Opportunity> submitForReview(String id);
  Future<Opportunity> returnToDraft(String id);
  Future<Opportunity> close(String id);
  Future<Opportunity> startRevision(String id);
  Future<Opportunity> updateRevision(String id, OpportunityDraft draft);
  Future<Opportunity> submitRevisionForReview(String id);
}

class CompanyOpportunitiesRepositoryImpl
    implements CompanyOpportunitiesRepository {
  const CompanyOpportunitiesRepositoryImpl(this._source);

  final CompanyOpportunitiesDataSource _source;

  @override
  Future<List<Opportunity>> getMyOpportunities() =>
      _source.getMyOpportunities();

  @override
  Future<Opportunity> getMyOpportunity(String id) =>
      _source.getMyOpportunity(id);

  @override
  Future<Opportunity> createDraft(OpportunityDraft draft) =>
      _source.createDraft(draft);

  @override
  Future<Opportunity> updateDraft(String id, OpportunityDraft draft) =>
      _source.updateDraft(id, draft);

  @override
  Future<Opportunity> submitForReview(String id) => _source.submitForReview(id);

  @override
  Future<Opportunity> returnToDraft(String id) => _source.returnToDraft(id);

  @override
  Future<Opportunity> close(String id) => _source.close(id);

  @override
  Future<Opportunity> startRevision(String id) => _source.startRevision(id);

  @override
  Future<Opportunity> updateRevision(String id, OpportunityDraft draft) =>
      _source.updateRevision(id, draft);

  @override
  Future<Opportunity> submitRevisionForReview(String id) =>
      _source.submitRevisionForReview(id);
}

/// TODO(api): select a `CompanyOpportunitiesRemoteDataSource` when
/// `AppConfig.useMockData` is false.
final companyOpportunitiesDataSourceProvider =
    Provider<CompanyOpportunitiesDataSource>(
      (ref) => ref.watch(companyWorkspaceMockProvider),
    );

final companyOpportunitiesRepositoryProvider =
    Provider<CompanyOpportunitiesRepository>(
      (ref) => CompanyOpportunitiesRepositoryImpl(
        ref.watch(companyOpportunitiesDataSourceProvider),
      ),
    );
