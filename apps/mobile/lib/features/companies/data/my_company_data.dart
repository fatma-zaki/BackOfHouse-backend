import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../auth/presentation/controllers/auth_controller.dart';
import '../domain/company.dart';
import '../domain/company_membership.dart';
import '../domain/company_project.dart';
import 'company_workspace_mock.dart';

abstract interface class MyCompanyDataSource {
  Future<Company> getMyCompany();
  Future<CompanyStats> getStats();
  Future<Company> updateProfile(CompanyProfileDraft draft);
  Future<List<CompanyProject>> getMyProjects();
  Future<CompanyProject> addProject(CompanyProjectDraft draft);
  Future<CompanyProject> updateProject(String id, CompanyProjectDraft draft);
  Future<void> deleteProject(String id);
}

class MyCompanyRepositoryImpl implements MyCompanyRepository {
  const MyCompanyRepositoryImpl(this._source);

  final MyCompanyDataSource _source;

  @override
  Future<Company> getMyCompany() => _source.getMyCompany();

  @override
  Future<CompanyStats> getStats() => _source.getStats();

  @override
  Future<Company> updateProfile(CompanyProfileDraft draft) =>
      _source.updateProfile(draft);

  @override
  Future<List<CompanyProject>> getMyProjects() => _source.getMyProjects();

  @override
  Future<CompanyProject> addProject(CompanyProjectDraft draft) =>
      _source.addProject(draft);

  @override
  Future<CompanyProject> updateProject(String id, CompanyProjectDraft draft) =>
      _source.updateProject(id, draft);

  @override
  Future<void> deleteProject(String id) => _source.deleteProject(id);
}

/// The signed-in account's company membership; `null` for individuals.
final companyMembershipProvider = Provider<CompanyMembership?>(
  (ref) => ref.watch(authControllerProvider.select((s) => s.value?.membership)),
);

/// TODO(api): select a `MyCompanyRemoteDataSource` when
/// `AppConfig.useMockData` is false.
final myCompanyDataSourceProvider = Provider<MyCompanyDataSource>(
  (ref) => ref.watch(companyWorkspaceMockProvider),
);

final myCompanyRepositoryProvider = Provider<MyCompanyRepository>(
  (ref) => MyCompanyRepositoryImpl(ref.watch(myCompanyDataSourceProvider)),
);
