import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/data/mock_support.dart';
import '../../../core/network/api_exception.dart';
import '../domain/verification.dart';

/// In-memory verification request. Files are not kept — only their names —
/// and nothing here ever marks the member verified.
///
/// TODO(api): upload documents to the verification service.
class VerificationMockRepository implements VerificationRepository {
  VerificationMockRepository({required this.latency});

  final Duration latency;
  VerificationRequest _request = const VerificationRequest();

  static const _invalid = ApiException(
    type: ApiErrorType.validation,
    statusCode: 422,
  );

  @override
  Future<VerificationRequest> getMyRequest() async {
    await Future<void>.delayed(latency);
    return _request;
  }

  @override
  Future<VerificationRequest> upload(
    VerificationDocument document, {
    required String fileName,
    required List<int> bytes,
  }) async {
    await Future<void>.delayed(latency);
    if (_request.status != VerificationRequestStatus.draft) throw _invalid;
    _request = VerificationRequest(
      status: _request.status,
      files: {..._request.files, document: fileName},
    );
    return _request;
  }

  @override
  Future<VerificationRequest> submit() async {
    await Future<void>.delayed(latency);
    if (!_request.canSubmit) throw _invalid;
    _request = VerificationRequest(
      status: VerificationRequestStatus.inReview,
      files: _request.files,
    );
    return _request;
  }
}

final verificationRepositoryProvider = Provider<VerificationRepository>(
  (ref) => VerificationMockRepository(latency: ref.watch(mockLatencyProvider)),
);

final myVerificationRequestProvider =
    FutureProvider.autoDispose<VerificationRequest>(
      (ref) => ref.watch(verificationRepositoryProvider).getMyRequest(),
    );
