import { Module } from '@nestjs/common';
import { AccessModule } from '../access';
import { CompaniesModule } from '../companies';
import { IdentityModule } from '../identity';
import { VerificationModule } from '../verification';
import { BulkUserActionsHandler } from './handlers/bulk-user-actions.handler';
import { NotesService } from './services/notes.service';
import { UsersAdminService } from './services/users-admin.service';

/**
 * Back office (module-dependency-map.md `admin`): staff read models and records that span
 * modules, such as the users table and internal notes. A leaf: business modules never
 * import it.
 */
@Module({
  imports: [AccessModule, IdentityModule, CompaniesModule, VerificationModule],
  providers: [UsersAdminService, NotesService, BulkUserActionsHandler],
  exports: [UsersAdminService, NotesService],
})
export class BackofficeModule {}
