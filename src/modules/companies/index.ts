// Public API of the companies module (nest-module-map.md §2.1 rule 1).
export { CompaniesModule } from './companies.module';
export { CompaniesService, type CompanyMembershipView } from './services/companies.service';
export { CompanyDirectoryService, NAME_COLLATION, type CompanyListQuery } from './services/company-directory.service';
export { CompanyWorkspaceService, type CompanyStatsView } from './services/company-workspace.service';
export type { CompanyView, CompanyProjectView } from './services/company-views';
export { COMPANY_PERMISSIONS, requireCompanyActor, type CompanyPermission } from './policies/company-actor.policy';
export { CompaniesAdminService, type CompanyAdminView, type Kpi } from './services/companies-admin.service';
export { ClaimsService, type ClaimView } from './services/claims.service';
export { requireFeaturePermission } from './policies/featured.policy';
export { companySlug } from './domain/slug';
