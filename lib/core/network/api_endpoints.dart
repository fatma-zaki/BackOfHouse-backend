/// Relative paths appended to `AppConfig.apiBaseUrl`.
///
/// Kept in one place so a backend contract change is a single-file edit.
abstract final class ApiEndpoints {
  // Auth
  static const String register = '/auth/register';
  static const String login = '/auth/login';
  static const String phoneCode = '/auth/phone/code';
  static const String phoneVerify = '/auth/phone/verify';
  static const String logout = '/auth/logout';
  static const String refresh = '/auth/refresh';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';
  static const String socialLogin = '/auth/social';

  // Profile
  static const String me = '/me';

  // Content
  static const String news = '/news';
  static String newsDetail(String id) => '/news/$id';
  static const String newsCategories = '/news/categories';
  static const String companies = '/companies';
  static const String courses = '/courses';
  static const String events = '/events';
}
