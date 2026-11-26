/// How a company is classified for discovery, filtering and profile
/// presentation. It is not an account type and does not by itself decide
/// what a company may do.
enum CompanyType {
  eventOrganizer('EVENT_ORGANIZER'),
  supplier('SUPPLIER'),
  venue('VENUE'),
  production('PRODUCTION'),
  agency('AGENCY'),
  serviceProvider('SERVICE_PROVIDER'),
  other('OTHER');

  const CompanyType(this.wireValue);

  final String wireValue;

  static CompanyType fromWire(String? value) => CompanyType.values.firstWhere(
    (t) => t.wireValue == value?.toUpperCase(),
    orElse: () => other,
  );
}
