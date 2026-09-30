import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/config/app_config.dart';
import '../../core/constants/app_icons.dart';
import '../../core/network/api_client.dart';
import '../../features/applications/presentation/screens/applicant_details_screen.dart';
import '../../features/applications/presentation/screens/applicants_screen.dart';
import '../../features/applications/presentation/screens/apply_screen.dart';
import '../../features/applications/presentation/screens/my_applications_screen.dart';
import '../../features/auth/domain/account_type.dart';
import '../../features/auth/presentation/controllers/auth_controller.dart';
import '../../features/auth/presentation/screens/phone_sign_in_screen.dart';
import '../../features/auth/presentation/screens/reset_password_screen.dart';
import '../../features/auth/presentation/screens/sign_in_screen.dart';
import '../../features/auth/presentation/screens/sign_up_screen.dart';
import '../../features/auth/presentation/screens/welcome_screen.dart';
import '../../features/companies/presentation/screens/companies_directory_screen.dart';
import '../../features/companies/presentation/screens/company_dashboard_screen.dart';
import '../../features/companies/presentation/screens/company_details_screen.dart';
import '../../features/companies/presentation/screens/company_profile_edit_screen.dart';
import '../../features/companies/presentation/screens/company_profile_screen.dart';
import '../../features/companies/presentation/screens/company_project_form_screen.dart';
import '../../features/design_system/presentation/design_system_screen.dart';
import '../../features/discover/presentation/screens/discover_screen.dart';
import '../../features/events/presentation/screens/event_details_screen.dart';
import '../../features/events/presentation/screens/event_registered_screen.dart';
import '../../features/events/presentation/screens/events_screen.dart';
import '../../features/home/presentation/screens/home_screen.dart';
import '../../features/news/presentation/screens/article_details_screen.dart';
import '../../features/news/presentation/screens/news_screen.dart';
import '../../features/notifications/presentation/screens/notifications_screen.dart';
import '../../features/opportunities/presentation/screens/company_opportunities_screen.dart';
import '../../features/opportunities/presentation/screens/company_opportunity_details_screen.dart';
import '../../features/opportunities/presentation/screens/opportunities_screen.dart';
import '../../features/opportunities/presentation/screens/opportunity_details_screen.dart';
import '../../features/opportunities/presentation/screens/opportunity_form_screen.dart';
import '../../features/professionals/presentation/screens/professionals_directory_screen.dart';
import '../../features/profile/presentation/screens/edit_profile_screen.dart';
import '../../features/profile/presentation/screens/get_verified_screen.dart';
import '../../features/profile/presentation/screens/profile_screen.dart';
import '../../features/rewards/presentation/screens/my_points_screen.dart';
import '../../features/rewards/presentation/screens/reward_details_screen.dart';
import '../../features/rewards/presentation/screens/reward_redeemed_screen.dart';
import '../../features/rewards/presentation/screens/rewards_screen.dart';
import '../../features/supplier_responses/presentation/screens/supplier_request_details_screen.dart';
import '../../features/supplier_responses/presentation/screens/supplier_requests_screen.dart';
import '../../features/supplier_responses/presentation/screens/supplier_response_details_screen.dart';
import '../../features/supplier_responses/presentation/screens/supplier_response_form_screen.dart';
import 'app_routes.dart';
import 'app_shell.dart';
import 'auth_guard.dart';
import 'route_placeholder_screen.dart';
import 'splash_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>(debugLabel: 'root');

/// Route table. Individuals and companies share one shell; the guard keeps
/// every account in its own area.
///
/// Individual tabs: Home · Discover · News · Rewards · Profile.
/// Company tabs: Dashboard · Listings · Suppliers · News · Profile; the
/// portfolio sits under the company profile. Screens
/// reached from a tab stay inside it (the navigation remains visible); event
/// and article details open above the shell because they are reachable from
/// every tab.
final routerProvider = Provider<GoRouter>((ref) {
  // Bridges Riverpod session changes into go_router's redirect pass.
  final refresh = ValueNotifier<({SessionStatus status, AccountType account})>((
    status: ref.read(sessionStatusProvider),
    account: ref.read(sessionAccountTypeProvider),
  ));
  ref.onDispose(refresh.dispose);
  ref
    ..listen(
      sessionStatusProvider,
      (_, next) =>
          refresh.value = (status: next, account: refresh.value.account),
    )
    ..listen(
      sessionAccountTypeProvider,
      (_, next) =>
          refresh.value = (status: refresh.value.status, account: next),
    );

  // A 401 anywhere clears tokens; re-resolve the session.
  ref.listen(sessionExpiredProvider, (_, _) {
    ref.invalidate(authControllerProvider);
  });

  final router = GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: AppRoutes.home,
    refreshListenable: refresh,
    redirect: (context, state) => AuthGuard.redirect(
      status: refresh.value.status,
      accountType: refresh.value.account,
      uri: state.uri,
      developerRoutesEnabled: !AppConfig.environment.isProd,
    ),
    routes: [
      GoRoute(path: AppRoutes.splash, builder: (_, _) => const SplashScreen()),
      GoRoute(path: AppRoutes.auth, builder: (_, _) => const WelcomeScreen()),
      GoRoute(path: AppRoutes.login, builder: (_, _) => const SignInScreen()),
      GoRoute(
        path: AppRoutes.phoneLogin,
        builder: (_, _) => const PhoneSignInScreen(),
      ),
      GoRoute(
        path: AppRoutes.register,
        builder: (_, _) => const SignUpScreen(),
      ),
      // The portfolio lives inside Company Profile; this path only hosts
      // the add/edit forms, above the shell.
      GoRoute(
        path: AppRoutes.companyPortfolio,
        redirect: (_, state) => state.fullPath == AppRoutes.companyPortfolio
            ? AppRoutes.companyProfile
            : null,
        routes: [
          GoRoute(
            path: 'new',
            builder: (_, _) => const CompanyProjectFormScreen(),
          ),
          GoRoute(
            path: ':id/edit',
            builder: (_, state) =>
                CompanyProjectFormScreen(projectId: state.pathParameters['id']),
          ),
        ],
      ),
      GoRoute(
        path: AppRoutes.resetPassword,
        builder: (_, _) => const ResetPasswordScreen(),
      ),
      // Above the shell: reached from Profile, Opportunities and after
      // applying.
      GoRoute(
        path: AppRoutes.applications,
        builder: (_, _) => const MyApplicationsScreen(),
      ),
      GoRoute(
        path: AppRoutes.designSystem,
        builder: (_, _) => const DesignSystemScreen(),
      ),

      // Company screens reached from several workspace areas.
      GoRoute(
        path: '${AppRoutes.companyHome}/applicants/:id',
        builder: (_, state) =>
            ApplicantDetailsScreen(applicationId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '${AppRoutes.companyHome}/responses/:id',
        builder: (_, state) => SupplierResponseDetailsScreen(
          responseId: state.pathParameters['id']!,
        ),
      ),

      // One shell and one bottom bar for both account types. Home and
      // Profile hold each account's own screen and the guard keeps every
      // account on its own. Branches 0–4 serve individuals (companies use
      // Home, News and Profile); 5–6 are the company's Listings and
      // Suppliers tabs.
      StatefulShellRoute.indexedStack(
        builder: (_, _, shell) => AppShell(navigationShell: shell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.home,
                builder: (_, _) => const HomeScreen(),
              ),
              GoRoute(
                path: AppRoutes.notifications,
                builder: (_, _) => const NotificationsScreen(),
              ),
              // The company's dashboard.
              GoRoute(
                path: AppRoutes.companyHome,
                builder: (_, _) => const CompanyDashboardScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.discover,
                builder: (_, _) => const DiscoverScreen(),
              ),
              GoRoute(
                path: AppRoutes.events,
                builder: (_, _) => const EventsScreen(),
                routes: [
                  GoRoute(
                    path: ':id',
                    parentNavigatorKey: _rootNavigatorKey,
                    builder: (_, state) => EventDetailsScreen(
                      eventId: state.pathParameters['id']!,
                    ),
                    routes: [
                      GoRoute(
                        path: 'registered',
                        parentNavigatorKey: _rootNavigatorKey,
                        builder: (_, state) => EventRegisteredScreen(
                          eventId: state.pathParameters['id']!,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              GoRoute(
                path: AppRoutes.opportunities,
                builder: (_, _) => const OpportunitiesScreen(),
                routes: [
                  GoRoute(
                    path: ':id',
                    parentNavigatorKey: _rootNavigatorKey,
                    builder: (_, state) => OpportunityDetailsScreen(
                      opportunityId: state.pathParameters['id']!,
                    ),
                    routes: [
                      GoRoute(
                        path: 'apply',
                        parentNavigatorKey: _rootNavigatorKey,
                        builder: (_, state) => ApplyScreen(
                          opportunityId: state.pathParameters['id']!,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              GoRoute(
                path: AppRoutes.professionals,
                builder: (_, _) => const ProfessionalsDirectoryScreen(),
              ),
              GoRoute(
                path: AppRoutes.companies,
                builder: (_, _) => const CompaniesDirectoryScreen(),
                routes: [
                  GoRoute(
                    path: ':id',
                    parentNavigatorKey: _rootNavigatorKey,
                    builder: (_, state) => CompanyDetailsScreen(
                      companyId: state.pathParameters['id']!,
                    ),
                  ),
                ],
              ),
              _placeholder(
                AppRoutes.courses,
                (l10n) => l10n.routeCourses,
                AppIcons.courses,
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.news,
                builder: (_, _) => const NewsScreen(),
                routes: [
                  GoRoute(
                    path: ':id',
                    parentNavigatorKey: _rootNavigatorKey,
                    builder: (_, state) => ArticleDetailsScreen(
                      articleId: state.pathParameters['id']!,
                    ),
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.rewards,
                builder: (_, _) => const RewardsScreen(),
                routes: [
                  // Declared before `:id` so it is not read as a reward id.
                  GoRoute(
                    path: 'points',
                    builder: (_, _) => const MyPointsScreen(),
                  ),
                  GoRoute(
                    path: ':id',
                    builder: (_, state) => RewardDetailsScreen(
                      rewardId: state.pathParameters['id']!,
                    ),
                    routes: [
                      GoRoute(
                        path: 'redeemed',
                        parentNavigatorKey: _rootNavigatorKey,
                        builder: (_, state) => RewardRedeemedScreen(
                          rewardId: state.pathParameters['id']!,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.profile,
                builder: (_, _) => const ProfileScreen(),
                routes: [
                  GoRoute(
                    path: 'edit',
                    parentNavigatorKey: _rootNavigatorKey,
                    builder: (_, _) => const EditProfileScreen(),
                  ),
                  GoRoute(
                    path: 'verify',
                    parentNavigatorKey: _rootNavigatorKey,
                    builder: (_, _) => const GetVerifiedScreen(),
                  ),
                ],
              ),
              GoRoute(
                path: AppRoutes.companyProfile,
                builder: (_, _) => const CompanyProfileScreen(),
                routes: [
                  GoRoute(
                    path: 'edit',
                    parentNavigatorKey: _rootNavigatorKey,
                    builder: (_, _) => const CompanyProfileEditScreen(),
                  ),
                ],
              ),
            ],
          ),
          // Company tabs: Listings and Suppliers.
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.companyOpportunities,
                builder: (_, _) => const CompanyOpportunitiesScreen(),
                routes: [
                  // Declared before `:id` so it is not read as an id.
                  GoRoute(
                    path: 'new',
                    parentNavigatorKey: _rootNavigatorKey,
                    builder: (_, _) => const OpportunityFormScreen(),
                  ),
                  GoRoute(
                    path: ':id',
                    parentNavigatorKey: _rootNavigatorKey,
                    builder: (_, state) => CompanyOpportunityDetailsScreen(
                      opportunityId: state.pathParameters['id']!,
                    ),
                    routes: [
                      GoRoute(
                        path: 'edit',
                        parentNavigatorKey: _rootNavigatorKey,
                        builder: (_, state) => OpportunityFormScreen(
                          opportunityId: state.pathParameters['id'],
                        ),
                      ),
                      GoRoute(
                        path: 'applicants',
                        parentNavigatorKey: _rootNavigatorKey,
                        builder: (_, state) => ApplicantsScreen(
                          opportunityId: state.pathParameters['id']!,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.companySupplierRequests,
                builder: (_, _) => const SupplierRequestsScreen(),
                routes: [
                  GoRoute(
                    path: ':id',
                    parentNavigatorKey: _rootNavigatorKey,
                    builder: (_, state) => SupplierRequestDetailsScreen(
                      requestId: state.pathParameters['id']!,
                    ),
                    routes: [
                      GoRoute(
                        path: 'respond',
                        parentNavigatorKey: _rootNavigatorKey,
                        builder: (_, state) => SupplierResponseFormScreen(
                          requestId: state.pathParameters['id']!,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    ],
  );

  ref.onDispose(router.dispose);
  return router;
});

/// Directory screens not built yet. Replace the builder as each lands.
GoRoute _placeholder(String path, TitleBuilder title, IconData icon) => GoRoute(
  path: path,
  builder: (_, _) => RoutePlaceholderScreen(title: title, icon: icon),
  routes: [
    GoRoute(
      path: ':id',
      parentNavigatorKey: _rootNavigatorKey,
      builder: (_, state) => RoutePlaceholderScreen(
        title: (l10n) => '${title(l10n)} · ${state.pathParameters['id']}',
        icon: icon,
      ),
    ),
  ],
);
