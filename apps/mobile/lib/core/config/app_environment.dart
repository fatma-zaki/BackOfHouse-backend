/// Build flavors. Selected at compile time via `--dart-define=APP_ENV=...`.
enum AppEnvironment {
  dev,
  staging,
  prod;

  static AppEnvironment fromName(String value) {
    return AppEnvironment.values.firstWhere(
      (e) => e.name == value.toLowerCase().trim(),
      orElse: () => AppEnvironment.dev,
    );
  }

  bool get isDev => this == AppEnvironment.dev;
  bool get isProd => this == AppEnvironment.prod;

  /// Suffix appended to the app title outside production, so testers can tell
  /// which build they are looking at.
  String get titleSuffix => switch (this) {
    AppEnvironment.dev => ' · DEV',
    AppEnvironment.staging => ' · STG',
    AppEnvironment.prod => '',
  };
}
