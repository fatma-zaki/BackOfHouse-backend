// Public API of the verification module (nest-module-map.md §2.1 rule 1).
export { VerificationModule } from './verification.module';
export {
  VerificationService,
  VERIFICATION_DOCUMENTS,
  type UploadedDocument,
  type VerificationDocumentType,
  type VerificationRequestView,
} from './services/verification.service';
export { MAX_DOCUMENT_BYTES } from './domain/document-file';
export {
  VerificationReviewService,
  type ReviewRequestView,
  type UserVerificationStatus,
} from './services/verification-review.service';
