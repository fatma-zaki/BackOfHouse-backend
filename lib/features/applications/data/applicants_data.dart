import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../companies/data/company_workspace_mock.dart';
import '../domain/application.dart';

abstract interface class ApplicantsDataSource {
  Future<List<ApplicantView>> getApplicants(String opportunityId);
  Future<ApplicantView> getApplicant(String applicationId);
  Future<ApplicantView> updateStatus(
    String applicationId,
    ApplicationStatus to,
  );
}

class ApplicantsRepositoryImpl implements ApplicantsRepository {
  const ApplicantsRepositoryImpl(this._source);

  final ApplicantsDataSource _source;

  @override
  Future<List<ApplicantView>> getApplicants(String opportunityId) =>
      _source.getApplicants(opportunityId);

  @override
  Future<ApplicantView> getApplicant(String applicationId) =>
      _source.getApplicant(applicationId);

  @override
  Future<ApplicantView> updateStatus(
    String applicationId,
    ApplicationStatus to,
  ) => _source.updateStatus(applicationId, to);
}

/// TODO(api): select an `ApplicantsRemoteDataSource` when
/// `AppConfig.useMockData` is false.
final applicantsDataSourceProvider = Provider<ApplicantsDataSource>(
  (ref) => ref.watch(companyWorkspaceMockProvider),
);

final applicantsRepositoryProvider = Provider<ApplicantsRepository>(
  (ref) => ApplicantsRepositoryImpl(ref.watch(applicantsDataSourceProvider)),
);
