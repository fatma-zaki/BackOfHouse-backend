@Tags(['golden'])
library;

import 'dart:async';
import 'dart:io';

import 'package:backofhouse/app/app.dart';
import 'package:backofhouse/app/router/app_router.dart';
import 'package:backofhouse/app/router/app_routes.dart';
import 'package:backofhouse/app/theme/theme_mode_controller.dart';
import 'package:backofhouse/core/l10n/locale_controller.dart';
import 'package:backofhouse/features/auth/data/auth_mock_data_source.dart';
import 'package:backofhouse/features/auth/data/auth_repository_impl.dart';
import 'package:backofhouse/features/auth/domain/account_details.dart';
import 'package:backofhouse/features/auth/presentation/controllers/auth_controller.dart';
import 'package:backofhouse/features/companies/domain/company_type.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

import '../helpers/test_app.dart';

/// Visual reference renders with the real brand fonts and icons.
///
/// Font rasterisation differs per OS, so these are for review, not CI gating:
///   flutter test --tags golden --update-goldens
Future<void> _loadFonts() async {
  Future<void> family(String name, List<String> assets) async {
    final loader = FontLoader(name);
    for (final asset in assets) {
      loader.addFont(rootBundle.load(asset));
    }
    await loader.load();
  }

  await family('PlusJakartaSans', [
    for (final w in ['Regular', 'Medium', 'SemiBold', 'Bold'])
      'assets/fonts/PlusJakartaSans-$w.ttf',
  ]);
  await family('packages/lucide_icons_flutter/Lucide300', [
    'packages/lucide_icons_flutter/assets/build_font/LucideVariable-w300.ttf',
  ]);

  // Tests have no system font fallback; borrow an Arabic-capable face so RTL
  // renders are readable. Registered under the declared fallback family.
  const arabicFace = r'C:\Windows\Fonts\segoeui.ttf';
  if (File(arabicFace).existsSync()) {
    final bytes = File(arabicFace).readAsBytesSync();
    await (FontLoader(
      'Inter',
    )..addFont(Future.value(ByteData.sublistView(bytes)))).load();
  }
}

Future<ProviderContainer> _app(
  WidgetTester tester, {
  required Size size,
  String locale = 'en',
  ThemeMode mode = ThemeMode.light,
}) async {
  tester.view
    ..physicalSize = size * 2
    ..devicePixelRatio = 2;
  addTearDown(tester.view.reset);

  final container = ProviderContainer(
    overrides: [
      ...await baseOverrides(),
      authDataSourceProvider.overrideWithValue(
        AuthMockDataSource(latency: Duration.zero),
      ),
    ],
  );
  addTearDown(container.dispose);
  await container
      .read(localeControllerProvider.notifier)
      .setLocale(Locale(locale));
  await container.read(themeModeControllerProvider.notifier).setMode(mode);

  await tester.pumpWidget(
    UncontrolledProviderScope(
      container: container,
      child: const BackOfHouseApp(),
    ),
  );
  await _frames(tester);
  return container;
}

Future<void> _frames(WidgetTester tester, [int count = 10]) async {
  for (var i = 0; i < count; i++) {
    await tester.pump(const Duration(milliseconds: 100));
    // Image decoding runs on real async; give it time to land.
    if (i == 2) {
      await tester.runAsync(
        () => Future<void>.delayed(const Duration(milliseconds: 400)),
      );
    }
  }
}

Future<void> _capture(
  WidgetTester tester,
  ProviderContainer container,
  String route,
  String name,
) async {
  container.read(routerProvider).go(route);
  await _frames(tester);
  await expectLater(
    find.byType(BackOfHouseApp),
    matchesGoldenFile('renders/$name.png'),
  );
}

Future<ProviderContainer> _signedIn(
  WidgetTester tester, {
  required Size size,
  String locale = 'en',
  ThemeMode mode = ThemeMode.light,
}) async {
  final c = await _app(tester, size: size, locale: locale, mode: mode);
  c.read(routerProvider).go(AppRoutes.login);
  await _frames(tester);
  await tester.enterText(find.byType(EditableText).at(0), 'fatma@boh.sa');
  await tester.enterText(find.byType(EditableText).at(1), 'abc12345');
  await tester.testTextInput.receiveAction(TextInputAction.done);
  await _frames(tester);
  return c;
}

void main() {
  setUpAll(_loadFonts);
  const phone = Size(360, 780);
  const tall = Size(360, 2000);

  for (final locale in ['en', 'ar']) {
    testWidgets('auth screens ($locale)', (tester) async {
      final c = await _app(tester, size: phone, locale: locale);
      await _capture(tester, c, AppRoutes.auth, 'welcome_$locale');
      await _capture(tester, c, AppRoutes.login, 'login_$locale');
    });

    testWidgets('member screens ($locale)', (tester) async {
      final c = await _signedIn(tester, size: tall, locale: locale);
      await _capture(tester, c, AppRoutes.home, 'home_$locale');
      await _capture(tester, c, AppRoutes.rewards, 'rewards_$locale');
      await _capture(tester, c, AppRoutes.myPoints, 'my_points_$locale');
      await _capture(
        tester,
        c,
        AppRoutes.reward('course-10'),
        'reward_details_$locale',
      );
      await _capture(tester, c, AppRoutes.discover, 'discover_$locale');
      await _capture(tester, c, AppRoutes.events, 'events_$locale');
      await _capture(
        tester,
        c,
        AppRoutes.event('tech-innovation'),
        'event_details_$locale',
      );
      await _capture(
        tester,
        c,
        AppRoutes.opportunities,
        'opportunities_$locale',
      );
      await _capture(
        tester,
        c,
        AppRoutes.opportunity('midan-tech-lead'),
        'opportunity_details_$locale',
      );
      await _capture(
        tester,
        c,
        AppRoutes.applyToOpportunity('sound-stage-audio'),
        'apply_$locale',
      );
      await _capture(tester, c, AppRoutes.applications, 'applications_$locale');
      await _capture(tester, c, AppRoutes.news, 'news_$locale');
      await _capture(
        tester,
        c,
        AppRoutes.article('rigging-mandate-2026'),
        'article_details_$locale',
      );
      await _capture(
        tester,
        c,
        AppRoutes.notifications,
        'notifications_$locale',
      );
      await _capture(tester, c, AppRoutes.profile, 'profile_$locale');
    });
  }

  for (final locale in ['en', 'ar']) {
    testWidgets('company screens ($locale)', (tester) async {
      final c = await _app(tester, size: tall, locale: locale);
      // Timers only advance while the tester pumps, so do not await here.
      unawaited(
        c
            .read(authControllerProvider.notifier)
            .register(
              fullName: 'Lina Al-Saud',
              email: 'ops@lumen.sa',
              phone: '+966500000000',
              password: 'abc12345',
              account: const CompanyAccountDetails(
                companyName: 'Lumen Staging',
                companyType: CompanyType.production,
              ),
            ),
      );
      await _frames(tester);
      await _capture(
        tester,
        c,
        AppRoutes.companyHome,
        'company_dashboard_$locale',
      );
      await _capture(
        tester,
        c,
        AppRoutes.companyOpportunities,
        'company_opportunities_$locale',
      );
      await _capture(
        tester,
        c,
        AppRoutes.companyOpportunity('my-stage-manager'),
        'company_opportunity_$locale',
      );
      await _capture(
        tester,
        c,
        AppRoutes.companyNewOpportunity,
        'company_opportunity_form_$locale',
      );
      await _capture(
        tester,
        c,
        AppRoutes.companyApplicants('my-stage-manager'),
        'company_applicants_$locale',
      );
      await _capture(
        tester,
        c,
        AppRoutes.companyApplicant('applicant-noura'),
        'company_applicant_$locale',
      );
      await _capture(
        tester,
        c,
        AppRoutes.companyApplicant('applicant-reem'),
        'company_applicant_contact_$locale',
      );
      await _capture(
        tester,
        c,
        AppRoutes.companySupplierRequests,
        'company_supplier_requests_$locale',
      );
      await _capture(
        tester,
        c,
        AppRoutes.companySupplierRequest('request-led-wall'),
        'company_supplier_request_$locale',
      );
      await _capture(
        tester,
        c,
        AppRoutes.companyRespond('request-led-wall'),
        'company_supplier_respond_$locale',
      );
      await _capture(
        tester,
        c,
        AppRoutes.companyResponse('response-benchmark'),
        'company_supplier_response_$locale',
      );
      await _capture(
        tester,
        c,
        AppRoutes.companyPortfolio,
        'company_portfolio_$locale',
      );
      await _capture(
        tester,
        c,
        AppRoutes.companyProfile,
        'company_profile_$locale',
      );
    });
  }

  testWidgets('dark mode (en)', (tester) async {
    final c = await _signedIn(tester, size: tall, mode: ThemeMode.dark);
    await _capture(tester, c, AppRoutes.home, 'home_en_dark');
    await _capture(tester, c, AppRoutes.rewards, 'rewards_en_dark');
  });

  testWidgets('design system gallery (en)', (tester) async {
    final c = await _app(tester, size: const Size(393, 5200));
    await _capture(tester, c, AppRoutes.designSystem, 'gallery_en');
  });
}
