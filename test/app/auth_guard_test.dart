import 'package:backofhouse/app/router/app_routes.dart';
import 'package:backofhouse/app/router/auth_guard.dart';
import 'package:backofhouse/features/auth/domain/account_type.dart';
import 'package:flutter_test/flutter_test.dart';

String? redirect(
  SessionStatus status,
  String location, {
  bool developer = false,
  AccountType account = AccountType.individual,
}) => AuthGuard.redirect(
  status: status,
  uri: Uri.parse(location),
  accountType: account,
  developerRoutesEnabled: developer,
);

void main() {
  group('while restoring', () {
    test('holds on splash, remembering the deep link', () {
      expect(
        redirect(SessionStatus.restoring, '/news/42'),
        '/splash?from=%2Fnews%2F42',
      );
      expect(redirect(SessionStatus.restoring, AppRoutes.splash), isNull);
    });
  });

  group('signed out', () {
    test('protected routes go to /auth with from', () {
      expect(
        redirect(SessionStatus.unauthenticated, '/companies/7'),
        '/auth?from=%2Fcompanies%2F7',
      );
    });
    test('home does not carry a redundant from', () {
      expect(redirect(SessionStatus.unauthenticated, '/'), AppRoutes.auth);
    });
    test('public routes are open', () {
      for (final path in AppRoutes.public) {
        expect(redirect(SessionStatus.unauthenticated, path), isNull);
      }
    });
    test('splash forwards the remembered deep link', () {
      expect(
        redirect(SessionStatus.unauthenticated, '/splash?from=/events/3'),
        '/auth?from=%2Fevents%2F3',
      );
    });
  });

  group('signed in', () {
    test('auth screens bounce to the deep link, else home', () {
      expect(
        redirect(SessionStatus.authenticated, '/login?from=/news/42'),
        '/news/42',
      );
      expect(redirect(SessionStatus.authenticated, '/login'), AppRoutes.home);
      expect(redirect(SessionStatus.authenticated, '/splash'), AppRoutes.home);
    });
    test('protected routes are open', () {
      expect(redirect(SessionStatus.authenticated, '/courses/1'), isNull);
    });
    test('ignores off-app or gate targets in from', () {
      expect(
        redirect(SessionStatus.authenticated, '/login?from=//evil.com'),
        AppRoutes.home,
      );
      expect(
        redirect(SessionStatus.authenticated, '/login?from=https://evil.com'),
        AppRoutes.home,
      );
      expect(
        redirect(SessionStatus.authenticated, '/login?from=/register'),
        AppRoutes.home,
      );
    });
  });

  group('account areas', () {
    const company = AccountType.company;

    test('companies land in the company area after signing in', () {
      expect(
        redirect(SessionStatus.authenticated, '/login', account: company),
        AppRoutes.companyHome,
      );
      expect(
        redirect(SessionStatus.authenticated, '/splash', account: company),
        AppRoutes.companyHome,
      );
    });

    test('companies never see individual-only screens', () {
      for (final path in [
        AppRoutes.applications,
        AppRoutes.applyToOpportunity('midan-tech-lead'),
        AppRoutes.opportunities,
        AppRoutes.notifications,
        AppRoutes.rewards,
        AppRoutes.myPoints,
      ]) {
        expect(
          redirect(SessionStatus.authenticated, path, account: company),
          AppRoutes.companyHome,
          reason: path,
        );
      }
    });

    test('companies share only News with individuals', () {
      for (final path in [AppRoutes.news, AppRoutes.article('42')]) {
        expect(
          redirect(SessionStatus.authenticated, path, account: company),
          isNull,
          reason: path,
        );
      }
    });

    test('companies never see Discover or its directories', () {
      for (final path in [
        AppRoutes.discover,
        AppRoutes.events,
        AppRoutes.event('3'),
        AppRoutes.companies,
        AppRoutes.company('nexa'),
        AppRoutes.professionals,
        AppRoutes.courses,
      ]) {
        expect(
          redirect(SessionStatus.authenticated, path, account: company),
          AppRoutes.companyHome,
          reason: path,
        );
      }
    });

    test("shared tab roots resolve to the account's own screen", () {
      expect(
        redirect(SessionStatus.authenticated, AppRoutes.home, account: company),
        AppRoutes.companyHome,
      );
      expect(
        redirect(
          SessionStatus.authenticated,
          AppRoutes.profile,
          account: company,
        ),
        AppRoutes.companyProfile,
      );
      expect(
        redirect(SessionStatus.authenticated, AppRoutes.companyProfile),
        AppRoutes.profile,
      );
    });

    test('companies may open the company area', () {
      for (final path in [
        AppRoutes.companyHome,
        AppRoutes.companyOpportunities,
        AppRoutes.companySupplierRequests,
        AppRoutes.companyPortfolio,
        AppRoutes.companyProfile,
      ]) {
        expect(
          redirect(SessionStatus.authenticated, path, account: company),
          isNull,
        );
      }
    });

    test('a deep link into the other area is not honoured', () {
      expect(
        redirect(
          SessionStatus.authenticated,
          '/login?from=/applications',
          account: company,
        ),
        AppRoutes.companyHome,
      );
      expect(
        redirect(SessionStatus.authenticated, '/login?from=/company/profile'),
        AppRoutes.home,
      );
    });

    test('individuals never see company screens', () {
      expect(
        redirect(SessionStatus.authenticated, AppRoutes.companyOpportunities),
        AppRoutes.home,
      );
      // The public company directory is not the company area.
      expect(redirect(SessionStatus.authenticated, '/companies/nexa'), isNull);
    });
  });

  test('design system route is developer-only', () {
    expect(
      redirect(SessionStatus.authenticated, AppRoutes.designSystem),
      AppRoutes.home,
    );
    expect(
      redirect(
        SessionStatus.authenticated,
        AppRoutes.designSystem,
        developer: true,
      ),
      isNull,
    );
  });
}
