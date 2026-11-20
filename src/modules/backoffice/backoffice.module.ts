import { Module } from '@nestjs/common';
import { AccessModule } from '../access';
import { CompaniesModule } from '../companies';
import { ContentModule } from '../content';
import { IdentityModule } from '../identity';
import { VerificationModule } from '../verification';
import { BulkUserActionsHandler } from './handlers/bulk-user-actions.handler';
import { ArticleChecksService } from './services/article-checks.service';
import { NotesService } from './services/notes.service';
import { UsersAdminService } from './services/users-admin.service';

/**
 * Back office (module-dependency-map.md `admin`): staff read models and records that span
 * modules, such as the users table and internal notes. A leaf: business modules never
 * import it.
 */
@Module({
  imports: [AccessModule, IdentityModule, CompaniesModule, VerificationModule, ContentModule],
  providers: [UsersAdminService, NotesService, ArticleChecksService, BulkUserActionsHandler],
  exports: [UsersAdminService, NotesService, ArticleChecksService],
})
export class BackofficeModule {}
