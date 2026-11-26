/// Where an individual is in their career. A profile attribute, not an
/// account type; add states here as the product needs them.
enum ProfileStatus {
  professional('PROFESSIONAL'),
  student('STUDENT');

  const ProfileStatus(this.wireValue);

  final String wireValue;

  static ProfileStatus fromWire(String? value) =>
      ProfileStatus.values.firstWhere(
        (s) => s.wireValue == value?.toUpperCase(),
        orElse: () => professional,
      );
}
