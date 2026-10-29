import { Module } from '@nestjs/common';
import { IdentityModule } from '../identity';
import { CompaniesService } from './services/companies.service';

/** Companies (ADR-030). Depends on identity (module-dependency-map.md). */
@Module({
  imports: [IdentityModule],
  providers: [CompaniesService],
  exports: [CompaniesService],
})
export class CompaniesModule {}
