import { Module } from '@nestjs/common';
import { ScanningModule } from '../../platform/scanning';
import { StorageModule } from '../../platform/storage';
import { VerificationService } from './services/verification.service';

/**
 * Verification (nest-module-map.md). Phase 3b: an individual's request and documents.
 * Depends on audit and the storage and scanning ports; reviewers' decisions are Phase 4.
 */
@Module({
  imports: [StorageModule, ScanningModule],
  providers: [VerificationService],
  exports: [VerificationService],
})
export class VerificationModule {}
