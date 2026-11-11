import { Module } from '@nestjs/common';
import { ScanningModule } from '../../platform/scanning';
import { StorageModule } from '../../platform/storage';
import { IdentityModule } from '../identity';
import { VerificationReviewService } from './services/verification-review.service';
import { VerificationService } from './services/verification.service';

/**
 * Verification (nest-module-map.md): an individual's request and documents (Phase 3b).
 * Reviewers decide in Phase 4 (VerificationReviewService). Depends on identity (member
 * names), audit, and the storage and scanning ports.
 */
@Module({
  imports: [StorageModule, ScanningModule, IdentityModule],
  providers: [VerificationService, VerificationReviewService],
  exports: [VerificationService, VerificationReviewService],
})
export class VerificationModule {}
