import '../../features/auth/domain/account_type.dart';

/// Route paths. Screens navigate through these helpers, never string literals.
abstract final class AppRoutes {
  // ── Session gate ─────────────────────────────────────────────────────────
  /// Held while the stored session is restored. Not user-facing.
  static const String splash = '/splash';

  // ── Public ───────────────────────────────────────────────────────────────
  static const String auth = '/auth';
  static const String login = '/login';
  static const String register = '/register';
  static const String resetPassword = '/reset-password';

  // ── Signed in ────────────────────────────────────────────────────────────
  static const String home = '/';
  static const String discover = '/discover';
  static const String rewards = '/rewards';
  static const String myPoints = '/rewards/points';
  static const String profile = '/profile';
  static const String companies = '/companies';
  static const String courses = '/courses';
  static const String news = '/news';
  static const String events = '/events';
  static const String notifications = '/notifications';
  static const String opportunities = '/opportunities';
  static const String professionals = '/professionals';
  static const String applications = '/applications';

  static String company(String id) => '$companies/$id';
  static String opportunity(String id) => '$opportunities/$id';
  static String applyToOpportunity(String id) => '$opportunities/$id/apply';
  static String professional(String id) => '$professionals/$id';
  static String course(String id) => '$courses/$id';
  static String article(String id) => '$news/$id';
  static String event(String id) => '$events/$id';
  static String reward(String id) => '$rewards/$id';

  // ── Company account ──────────────────────────────────────────────────────
  // The company's own workspace lives under this prefix. Individuals never
  // open it; companies otherwise see only the shared areas below.
  static const String companyHome = '/company';
  static const String companyOpportunities = '/company/opportunities';
  static const String companyPortfolio = '/company/portfolio';
  static const String companyProfile = '/company/profile';
  static const String companyProfileEdit = '/company/profile/edit';
  static const String companySupplierRequests = '/company/supplier-requests';
  static const String companyNewOpportunity = '/company/opportunities/new';
  static const String companyNewProject = '/company/portfolio/new';

  static String companyOpportunity(String id) => '$companyOpportunities/$id';
  static String companyEditOpportunity(String id) =>
      '$companyOpportunities/$id/edit';
  static String companyApplicants(String opportunityId) =>
      '$companyOpportunities/$opportunityId/applicants';
  static String companyApplicant(String applicationId) =>
      '$companyHome/applicants/$applicationId';
  static String companyEditProject(String id) => '$companyPortfolio/$id/edit';
  static String companySupplierRequest(String id) =>
      '$companySupplierRequests/$id';
  static String companyRespond(String requestId) =>
      '$companySupplierRequests/$requestId/respond';
  static String companyResponse(String id) => '$companyHome/responses/$id';

  static bool isCompanyArea(String path) => _within(companyHome, path);

  /// Tabs both account types browse: Discover (with its events and
  /// directories) and News. Opportunities, applications, notifications and
  /// rewards stay individual; a company finds supplier requests in its
  /// workspace.
  static bool isSharedArea(String path) => [
    discover,
    events,
    news,
    companies,
    professionals,
    courses,
  ].any((root) => _within(root, path));

  static bool _within(String root, String path) =>
      path == root || path.startsWith('$root/');

  /// Where an account lands after signing in.
  static String homeFor(AccountType account) => switch (account) {
    AccountType.individual => home,
    AccountType.company => companyHome,
  };

  /// Whether a signed-in [account] may open [path].
  static bool allows(AccountType account, String path) => switch (account) {
    AccountType.individual => !isCompanyArea(path),
    AccountType.company => isCompanyArea(path) || isSharedArea(path),
  };

  /// The same tab root in the other account's area — both account types
  /// share one bottom bar, so its Home and Profile resolve per account.
  /// Null when [path] has no counterpart.
  static String? counterpartFor(AccountType account, String path) =>
      switch ((account, path)) {
        (AccountType.company, home) => companyHome,
        (AccountType.company, profile) => companyProfile,
        (AccountType.individual, companyHome) => home,
        (AccountType.individual, companyProfile) => profile,
        _ => null,
      };

  // ── Developer ────────────────────────────────────────────────────────────
  /// Component gallery. Registered outside production builds only.
  static const String designSystem = '/design-system';

  /// Reachable without a session.
  static const Set<String> public = {auth, login, register, resetPassword};

  /// Query parameter carrying the location a guard interrupted.
  static const String fromParam = 'from';
}
