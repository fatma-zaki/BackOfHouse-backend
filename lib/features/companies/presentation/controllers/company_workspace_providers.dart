import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/l10n/content_language.dart';
import '../../../applications/data/applicants_data.dart';
import '../../../applications/domain/application.dart';
import '../../../opportunities/data/company_opportunities_data.dart';
import '../../../opportunities/domain/opportunity.dart';
import '../../../supplier_responses/data/supplier_requests_data.dart';
import '../../../supplier_responses/domain/supplier_response.dart';
import '../../data/my_company_data.dart';
import '../../domain/company.dart';
import '../../domain/company_project.dart';

// The signed-in company's workspace. Every provider reloads when the
// content language changes; mutations invalidate what they affect.

final myCompanyProvider = FutureProvider.autoDispose<Company>((ref) {
  ref.watch(contentLanguageProvider);
  return ref.watch(myCompanyRepositoryProvider).getMyCompany();
});

final myCompanyProjectsProvider =
    FutureProvider.autoDispose<List<CompanyProject>>((ref) {
      ref.watch(contentLanguageProvider);
      return ref.watch(myCompanyRepositoryProvider).getMyProjects();
    });

final myCompanyOpportunitiesProvider =
    FutureProvider.autoDispose<List<Opportunity>>((ref) {
      ref.watch(contentLanguageProvider);
      return ref
          .watch(companyOpportunitiesRepositoryProvider)
          .getMyOpportunities();
    });

final myCompanyOpportunityProvider = FutureProvider.autoDispose
    .family<Opportunity, String>((ref, id) {
      ref.watch(contentLanguageProvider);
      return ref
          .watch(companyOpportunitiesRepositoryProvider)
          .getMyOpportunity(id);
    });

final applicantsProvider = FutureProvider.autoDispose
    .family<List<ApplicantView>, String>((ref, opportunityId) {
      ref.watch(contentLanguageProvider);
      return ref
          .watch(applicantsRepositoryProvider)
          .getApplicants(opportunityId);
    });

final applicantProvider = FutureProvider.autoDispose
    .family<ApplicantView, String>((ref, applicationId) {
      ref.watch(contentLanguageProvider);
      return ref
          .watch(applicantsRepositoryProvider)
          .getApplicant(applicationId);
    });

final invitedSupplierRequestsProvider =
    FutureProvider.autoDispose<List<Opportunity>>((ref) {
      ref.watch(contentLanguageProvider);
      return ref.watch(supplierRequestsRepositoryProvider).getInvitedRequests();
    });

final mySupplierResponsesProvider =
    FutureProvider.autoDispose<List<SupplierResponse>>((ref) {
      ref.watch(contentLanguageProvider);
      return ref.watch(supplierRequestsRepositoryProvider).getMyResponses();
    });

/// A supplier request as the signed-in company may see it: invited, or its
/// own.
final supplierRequestProvider = FutureProvider.autoDispose
    .family<Opportunity, String>((ref, id) {
      ref.watch(contentLanguageProvider);
      return ref.watch(supplierRequestsRepositoryProvider).getRequest(id);
    });

final responsesToMyRequestProvider = FutureProvider.autoDispose
    .family<List<SupplierResponse>, String>((ref, requestId) {
      ref.watch(contentLanguageProvider);
      return ref
          .watch(supplierRequestsRepositoryProvider)
          .getResponsesToMyRequest(requestId);
    });

final supplierResponseProvider = FutureProvider.autoDispose
    .family<SupplierResponse, String>((ref, id) {
      ref.watch(contentLanguageProvider);
      return ref.watch(supplierRequestsRepositoryProvider).getResponse(id);
    });
