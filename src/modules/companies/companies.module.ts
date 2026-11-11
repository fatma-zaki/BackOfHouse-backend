import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity';
import { ModerationRemovalHandler } from './handlers/moderation-removal.handler';
import { ClaimsService } from './services/claims.service';
import { CompaniesAdminService } from './services/companies-admin.service';
import { CompaniesService } from './services/companies.service';
import { CompanyDirectoryService } from './services/company-directory.service';
import { CompanyWorkspaceService } from './services/company-workspace.service';

/**
 * Companies (ADR-030): registration, the public directory with follows and portfolio, and
 * the Company Account's workspace. Depends on identity (module-dependency-map.md).
 */
@Module({
  imports: [IdentityModule],
  providers: [
    CompaniesService,
    CompanyDirectoryService,
    CompanyWorkspaceService,
    CompaniesAdminService,
    ClaimsService,
    ModerationRemovalHandler,
  ],
  exports: [CompaniesService, CompanyDirectoryService, CompanyWorkspaceService, CompaniesAdminService, ClaimsService],
})
export class CompaniesModule {}
