/// The two kinds of account on Back Of House.
///
/// Suppliers, organizers, venues and the like are companies with a
/// `CompanyType`; students and professionals are individuals with a
/// `ProfileStatus`. Neither is an account type.
enum AccountType {
  individual('INDIVIDUAL'),
  company('COMPANY');

  const AccountType(this.wireValue);

  /// Value exchanged with the API.
  final String wireValue;

  /// Unknown values fall back to [individual]. The legacy sign-up values
  /// `professional`, `student` and `other` were all individuals.
  static AccountType fromWire(String? value) =>
      value?.toUpperCase() == company.wireValue ? company : individual;
}
