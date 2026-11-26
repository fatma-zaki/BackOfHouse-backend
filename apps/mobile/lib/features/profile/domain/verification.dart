import 'package:flutter/foundation.dart';

/// Documents an individual submits for verification (approved 2026-09-28).
enum VerificationDocument {
  /// National ID or Iqama.
  identity,

  /// A certificate, contract or reference letter.
  experience,
}

enum VerificationRequestStatus {
  /// Collecting documents.
  draft,

  /// Submitted; Back Of House is reviewing.
  inReview,
}

/// An individual's request to be verified. Submitting only asks for a
/// review: verification is granted by Back Of House after checking the
/// documents — never by points, payments or activity, and never
/// automatically.
@immutable
class VerificationRequest {
  const VerificationRequest({
    this.status = VerificationRequestStatus.draft,
    this.files = const {},
  });

  final VerificationRequestStatus status;

  /// Uploaded file name per document.
  final Map<VerificationDocument, String> files;

  bool has(VerificationDocument d) => files.containsKey(d);

  bool get canSubmit =>
      status == VerificationRequestStatus.draft &&
      VerificationDocument.values.every(has);

  /// The document to upload next, or `null` when all are in.
  VerificationDocument? get nextDocument =>
      VerificationDocument.values.where((d) => !has(d)).firstOrNull;
}

abstract interface class VerificationRepository {
  Future<VerificationRequest> getMyRequest();

  /// Attaches a document. Only while the request is a draft.
  Future<VerificationRequest> upload(
    VerificationDocument document, {
    required String fileName,
    required List<int> bytes,
  });

  /// Sends the request for review. Grants nothing by itself.
  Future<VerificationRequest> submit();
}
