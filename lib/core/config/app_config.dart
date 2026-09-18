import 'app_environment.dart';

/// Compile-time configuration, resolved from `--dart-define` values.
///
/// Nothing here is read from a bundled `.env` file on purpose: values baked in
/// with `--dart-define` cannot be edited by unpacking the APK, and the
/// `--dart-define-from-file` JSON files under `config/` keep the commands short.
///
/// Run with:
///   flutter run --dart-define-from-file=config/dev.json
abstract final class AppConfig {
  static const String appName = 'Back Of House';

  static final AppEnvironment environment = AppEnvironment.fromName(
    const String.fromEnvironment('APP_ENV', defaultValue: 'dev'),
  );

  /// Root of the REST API.
  ///
  /// NOTE: the backend contract was not available when this was scaffolded.
  /// `https://backofhouse.space/api` is the reachable path on the marketing
  /// domain — confirm with the backend team and update `config/*.json`.
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'https://backofhouse.space/api',
  );

  /// Public marketing site, used for Terms, Privacy and "read on web" links.
  static const String webBaseUrl = String.fromEnvironment(
    'WEB_BASE_URL',
    defaultValue: 'https://backofhouse.space',
  );

  static const String termsUrl = '$webBaseUrl/terms-and-conditions';
  static const String privacyUrl = '$webBaseUrl/privacy-policy';

  /// Wire-level request/response logging. Never enable for release builds.
  static const bool enableNetworkLogging = bool.fromEnvironment(
    'ENABLE_NETWORK_LOGGING',
    defaultValue: true,
  );

  /// Serve repositories from in-memory mock data sources instead of the API.
  /// On by default until the backend contract lands, so a bare `flutter run`
  /// never points sign-in at an API that does not exist yet.
  /// `config/staging.json` and `config/prod.json` switch it off explicitly.
  static const bool useMockData = bool.fromEnvironment(
    'USE_MOCK_DATA',
    defaultValue: true,
  );

  static const Duration connectTimeout = Duration(seconds: 20);
  static const Duration receiveTimeout = Duration(seconds: 30);

  /// Title shown in the task switcher.
  static String get appTitle => '$appName${environment.titleSuffix}';
}
