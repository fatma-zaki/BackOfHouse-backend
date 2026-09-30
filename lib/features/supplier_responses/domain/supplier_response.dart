import 'package:flutter/foundation.dart';

import '../../companies/domain/company.dart';
import '../../companies/domain/company_project.dart';
import '../../opportunities/domain/opportunity.dart';

/// A supplier company's answer to a buyer's supplier request. B2B and
/// entirely separate from individual applications.
enum SupplierResponseStatus {
  submitted('SUBMITTED'),
  reviewed('REVIEWED'),
  shortlisted('SHORTLISTED'),
  selected('SELECTED'),
  rejected('REJECTED');

  const SupplierResponseStatus(this.wireValue);

  final String wireValue;

  bool get isFinal => this == selected || this == rejected;

  static SupplierResponseStatus fromWire(String? value) => values.firstWhere(
    (s) => s.wireValue == value?.toUpperCase(),
    orElse: () => submitted,
  );
}

/// Why a company may or may not respond to a supplier request.
enum SupplierResponseEligibility {
  eligible,

  /// The listing is not a supplier request.
  notSupplierRequest,

  /// Buyers do not respond to their own requests.
  ownRequest,

  /// The request does not invite this company's type.
  notInvited,

  /// Not published, or past its closing date.
  closed,

  /// One response per company per request.
  alreadyResponded;

  bool get isEligible => this == eligible;
}

abstract final class SupplierResponseRules {
  /// The single eligibility rule for responding. The backend enforces it;
  /// the app uses it to decide what to offer and to explain why not.
  static SupplierResponseEligibility eligibility({
    required Opportunity request,
    required CompanySummary responder,
    bool alreadyResponded = false,
    DateTime? now,
  }) {
    if (request.type != OpportunityType.supplierRequest) {
      return SupplierResponseEligibility.notSupplierRequest;
    }
    if (request.company.id == responder.id) {
      return SupplierResponseEligibility.ownRequest;
    }
    if (!request.supplierTypes.contains(responder.type)) {
      return SupplierResponseEligibility.notInvited;
    }
    if (!request.isOpenAt(now ?? DateTime.now())) {
      return SupplierResponseEligibility.closed;
    }
    if (alreadyResponded) return SupplierResponseEligibility.alreadyResponded;
    return SupplierResponseEligibility.eligible;
  }

  /// Selecting a supplier settles the whole request: see
  /// [selectionSettlesRequest].
  static bool selectionSettlesRequest(SupplierResponseStatus to) =>
      to == SupplierResponseStatus.selected;

  /// The buyer moves a response one step at a time — submitted → reviewed →
  /// shortlisted → selected — and may reject at any open step. Selected
  /// and rejected are final.
  ///
  /// Selecting one response is final for the request: every other open
  /// response is rejected and the request closes. There is no reopening and
  /// no changing supplier afterwards.
  static Set<SupplierResponseStatus> nextStatuses(SupplierResponseStatus from) {
    if (from.isFinal) return const {};
    return {
      switch (from) {
        SupplierResponseStatus.submitted => SupplierResponseStatus.reviewed,
        SupplierResponseStatus.reviewed => SupplierResponseStatus.shortlisted,
        _ => SupplierResponseStatus.selected,
      },
      SupplierResponseStatus.rejected,
    };
  }

  static bool canTransition(
    SupplierResponseStatus from,
    SupplierResponseStatus to,
  ) => nextStatuses(from).contains(to);
}

@immutable
class SupplierResponse {
  const SupplierResponse({
    required this.id,
    required this.requestId,
    required this.requestTitle,
    required this.buyer,
    required this.responder,
    required this.message,
    required this.status,
    required this.submittedAt,
    required this.updatedAt,
    this.proposedPrice,
    this.setupTime,
    this.projects = const [],
  });

  final String id;
  final String requestId;
  final String requestTitle;
  final CompanySummary buyer;

  /// Reference to the responding company's profile.
  final CompanySummary responder;
  final String message;
  final SupplierResponseStatus status;
  final DateTime submittedAt;
  final DateTime updatedAt;

  /// Free text, e.g. "SAR 180,000 all-in".
  final String? proposedPrice;

  /// Free text, e.g. "2 days on site" (approved 2026-09-28).
  final String? setupTime;

  /// The responder's company projects offered as evidence.
  final List<CompanyProject> projects;
}

enum SupplierResponseIssue { messageRequired, messageTooLong }

/// What a supplier company submits. No file attachments in the MVP.
@immutable
class SupplierResponseDraft {
  const SupplierResponseDraft({
    required this.requestId,
    required this.message,
    this.proposedPrice,
    this.setupTime,
    this.projectIds = const [],
  });

  final String requestId;
  final String message;
  final String? proposedPrice;

  /// Optional, e.g. "2 days on site".
  final String? setupTime;

  /// From the responder's own company portfolio.
  final List<String> projectIds;

  static const int messageMaxLength = 1000;

  List<SupplierResponseIssue> validate() => [
    if (message.trim().isEmpty) SupplierResponseIssue.messageRequired,
    if (message.trim().length > messageMaxLength)
      SupplierResponseIssue.messageTooLong,
  ];
}

/// Supplier requests and responses for the signed-in company, as responder
/// and as buyer. The backend enforces [SupplierResponseRules].
abstract interface class SupplierRequestsRepository {
  /// Open requests that invite this company's type, newest first.
  Future<List<Opportunity>> getInvitedRequests();

  Future<Opportunity> getRequest(String id);

  /// This company's responses, most recently updated first.
  Future<List<SupplierResponse>> getMyResponses();

  Future<SupplierResponse> submitResponse(SupplierResponseDraft draft);

  /// Responses to one of this company's own requests.
  Future<List<SupplierResponse>> getResponsesToMyRequest(String requestId);

  Future<SupplierResponse> getResponse(String id);

  /// Buyer only.
  Future<SupplierResponse> updateResponseStatus(
    String id,
    SupplierResponseStatus to,
  );
}
