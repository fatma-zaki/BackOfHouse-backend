import { Global, Module } from '@nestjs/common';
import { AuditLogger } from './audit-logger';

/**
 * L0 module (module-dependency-map.md): every mutating module depends on it.
 * The staff read endpoint `/admin/audit-logs` arrives with the access module
 * (Stage 6), because it requires AUDITOR / SYSTEM_ADMIN roles and MFA.
 */
@Global()
@Module({
  providers: [AuditLogger],
  exports: [AuditLogger],
})
export class AuditModule {}
