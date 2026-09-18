import 'company_type.dart';

/// Things a company is enabled to do, independent of verification and of
/// payment. The backend grants them and enforces them; the app only reads
/// them to decide what to offer.
enum CompanyCapability {
  /// Post supplier requests to supplier companies (buyer role).
  createSupplierRequest('CREATE_SUPPLIER_REQUEST');

  const CompanyCapability(this.wireValue);

  final String wireValue;

  static CompanyCapability? fromWire(String? value) {
    for (final c in values) {
      if (c.wireValue == value?.toUpperCase()) return c;
    }
    return null;
  }

  /// Initial grants by company type, used when the API does not send
  /// capabilities. Extend here as more types become eligible.
  static Set<CompanyCapability> defaultsFor(CompanyType type) => switch (type) {
    CompanyType.eventOrganizer ||
    CompanyType.agency ||
    CompanyType.venue ||
    CompanyType.production => {createSupplierRequest},
    CompanyType.supplier ||
    CompanyType.serviceProvider ||
    CompanyType.other => const {},
  };
}
