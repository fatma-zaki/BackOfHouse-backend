import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../companies/data/company_workspace_mock.dart';
import '../../opportunities/domain/opportunity.dart';
import '../domain/supplier_response.dart';

abstract interface class SupplierRequestsDataSource {
  Future<List<Opportunity>> getInvitedRequests();
  Future<Opportunity> getRequest(String id);
  Future<List<SupplierResponse>> getMyResponses();
  Future<SupplierResponse> submitResponse(SupplierResponseDraft draft);
  Future<List<SupplierResponse>> getResponsesToMyRequest(String requestId);
  Future<SupplierResponse> getResponse(String id);
  Future<SupplierResponse> updateResponseStatus(
    String id,
    SupplierResponseStatus to,
  );
}

class SupplierRequestsRepositoryImpl implements SupplierRequestsRepository {
  const SupplierRequestsRepositoryImpl(this._source);

  final SupplierRequestsDataSource _source;

  @override
  Future<List<Opportunity>> getInvitedRequests() =>
      _source.getInvitedRequests();

  @override
  Future<Opportunity> getRequest(String id) => _source.getRequest(id);

  @override
  Future<List<SupplierResponse>> getMyResponses() => _source.getMyResponses();

  @override
  Future<SupplierResponse> submitResponse(SupplierResponseDraft draft) =>
      _source.submitResponse(draft);

  @override
  Future<List<SupplierResponse>> getResponsesToMyRequest(String requestId) =>
      _source.getResponsesToMyRequest(requestId);

  @override
  Future<SupplierResponse> getResponse(String id) => _source.getResponse(id);

  @override
  Future<SupplierResponse> updateResponseStatus(
    String id,
    SupplierResponseStatus to,
  ) => _source.updateResponseStatus(id, to);
}

/// TODO(api): select a `SupplierRequestsRemoteDataSource` when
/// `AppConfig.useMockData` is false.
final supplierRequestsDataSourceProvider = Provider<SupplierRequestsDataSource>(
  (ref) => ref.watch(companyWorkspaceMockProvider),
);

final supplierRequestsRepositoryProvider = Provider<SupplierRequestsRepository>(
  (ref) => SupplierRequestsRepositoryImpl(
    ref.watch(supplierRequestsDataSourceProvider),
  ),
);
