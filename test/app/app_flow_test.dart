import 'dart:async';

import 'package:backofhouse/app/app.dart';
import 'package:backofhouse/core/constants/app_icons.dart';
import 'package:backofhouse/features/auth/data/auth_mock_data_source.dart';
import 'package:backofhouse/features/auth/data/auth_repository_impl.dart';
import 'package:backofhouse/features/auth/domain/account_details.dart';
import 'package:backofhouse/features/auth/presentation/controllers/auth_controller.dart';
import 'package:backofhouse/features/companies/domain/company_type.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';

import '../helpers/test_app.dart';

Future<void> _launch(WidgetTester tester) async {
  tester.view
    ..physicalSize = const Size(393, 852) * 3
    ..devicePixelRatio = 3;
  addTearDown(tester.view.reset);

  await tester.pumpWidget(
    ProviderScope(
      overrides: [
        ...await baseOverrides(),
        authDataSourceProvider.overrideWithValue(
          AuthMockDataSource(latency: Duration.zero),
        ),
      ],
      child: const BackOfHouseApp(),
    ),
  );
  // Let the session restore resolve and the redirect land.
  await _settle(tester);
}

/// Router navigation resolves asynchronously and route transitions run for
/// ~350ms. `pumpAndSettle` cannot be used: the splash shimmer loops.
Future<void> _settle(WidgetTester tester) async {
  for (var i = 0; i < 6; i++) {
    await tester.pump(const Duration(milliseconds: 100));
  }
}

void main() {
  testWidgets('signed-out launch lands on the welcome screen', (tester) async {
    await _launch(tester);
    expect(find.text('Create account'), findsOneWidget);
    expect(
      find.textContaining('every experience.', findRichText: true),
      findsOneWidget,
    );
  });

  testWidgets('light mode is the default theme', (tester) async {
    await _launch(tester);
    final context = tester.element(find.text('Create account'));
    expect(Theme.of(context).brightness, Brightness.light);
  });

  testWidgets('join → register → log in → home shell', (tester) async {
    await _launch(tester);

    await tester.ensureVisible(find.text('Create account'));
    await tester.tap(find.text('Create account'));
    await _settle(tester);
    expect(find.text('Create your account'), findsWidgets);
    expect(find.text('Individual'), findsOneWidget);

    await tester.ensureVisible(find.text('Sign in'));
    await tester.tap(find.text('Sign in'));
    await _settle(tester);

    await tester.enterText(find.byType(EditableText).at(0), 'sara@crew.sa');
    await tester.enterText(find.byType(EditableText).at(1), 'abc12345');
    await tester.ensureVisible(find.text('Sign in').first);
    await tester.tap(find.text('Sign in').first);
    await _settle(tester);

    // Signed-in shell with the individual member's tabs and Home content.
    expect(find.textContaining('Good ', findRichText: true), findsOneWidget);
    for (final tab in ['Home', 'Discover', 'News', 'Rewards', 'Profile']) {
      expect(find.text(tab), findsWidgets);
    }
  });

  testWidgets('a company account lands in the company area', (tester) async {
    await _launch(tester);
    final container = ProviderScope.containerOf(
      tester.element(find.byType(BackOfHouseApp)),
    );
    // Timers only advance while the tester pumps, so do not await here.
    unawaited(
      container
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
    await _settle(tester);

    // The shared bottom bar with the company's tabs: no Discover, no
    // Rewards.
    for (final tab in [
      'Dashboard',
      'Listings',
      'Suppliers',
      'News',
      'Profile',
    ]) {
      expect(find.text(tab), findsWidgets, reason: tab);
    }
    expect(find.text('Rewards'), findsNothing);
    expect(find.text('Discover'), findsNothing);
    expect(find.textContaining('Welcome,'), findsNothing);

    // The dashboard: greeting, New listing and the workspace counts.
    expect(find.text('Lumen Staging'), findsOneWidget);
    for (final text in [
      'Welcome back',
      'New listing',
      'Live listings',
      'New applicants',
      'Supplier invites',
      'Profile views',
    ]) {
      expect(find.text(text), findsWidgets, reason: text);
    }

    // Profile resolves to the company's own profile.
    await tester.tap(find.text('Profile'));
    await _settle(tester);
    expect(find.text('Edit profile'), findsWidgets);

    // Listings and Suppliers are tabs of their own.
    await tester.tap(find.text('Listings'));
    await _settle(tester);
    expect(find.text('Opportunities'), findsWidgets);
    await tester.tap(find.text('Suppliers'));
    await _settle(tester);
    expect(find.text('Supplier requests'), findsWidgets);
  });

  testWidgets('invalid credentials show a localized message', (tester) async {
    await _launch(tester);
    await tester.ensureVisible(find.text('Sign in'));
    await tester.tap(find.text('Sign in'));
    await _settle(tester);

    await tester.enterText(find.byType(EditableText).at(0), 'sara@crew.sa');
    await tester.enterText(
      find.byType(EditableText).at(1),
      AuthMockDataSource.rejectedPassword,
    );
    await tester.ensureVisible(find.text('Sign in').first);
    await tester.tap(find.text('Sign in').first);
    await _settle(tester);

    expect(
      find.text("That email and password don't match an account."),
      findsOneWidget,
    );
  });

  testWidgets('points and rewards: redeem updates the balance', (tester) async {
    await _launch(tester);
    await tester.ensureVisible(find.text('Sign in'));
    await tester.tap(find.text('Sign in'));
    await _settle(tester);
    await tester.enterText(find.byType(EditableText).at(0), 'sara@crew.sa');
    await tester.enterText(find.byType(EditableText).at(1), 'abc12345');
    await tester.ensureVisible(find.text('Sign in').first);
    await tester.tap(find.text('Sign in').first);
    await _settle(tester);

    // Rewards tab → a catalog reward → redeem → confirm.
    await tester.tap(find.text('Rewards'));
    await _settle(tester);
    final reward = find.text('10% Off on Professional Courses');
    await tester.scrollUntilVisible(
      reward,
      200,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.tap(reward);
    await _settle(tester);
    await tester.ensureVisible(find.text('Redeem for 100 pts'));
    await tester.tap(find.text('Redeem for 100 pts'));
    await _settle(tester);
    await tester.tap(find.text('Redeem for 100 pts').last);
    await _settle(tester);

    expect(find.text('Your reward'), findsOneWidget);
    expect(find.text('Redeemed'), findsOneWidget);
    expect(find.textContaining('220'), findsOneWidget);

    await tester.tap(find.text('Done'));
    await _settle(tester);
    expect(find.text('Your reward'), findsNothing);
  });

  testWidgets('a member likes and comments on an article, then opens a '
      'company profile', (tester) async {
    await _launch(tester);
    await tester.ensureVisible(find.text('Sign in'));
    await tester.tap(find.text('Sign in'));
    await _settle(tester);
    await tester.enterText(find.byType(EditableText).at(0), 'sara@crew.sa');
    await tester.enterText(find.byType(EditableText).at(1), 'abc12345');
    await tester.ensureVisible(find.text('Sign in').first);
    await tester.tap(find.text('Sign in').first);
    await _settle(tester);

    final router = GoRouter.of(tester.element(find.text('News').first));
    unawaited(router.push('/news/rigging-mandate-2026'));
    await _settle(tester);

    // Like: the label and count change together.
    final like = find.text('Like · 214');
    await tester.scrollUntilVisible(
      like,
      200,
      scrollable: find.byType(Scrollable).first,
    );
    await tester.tap(like);
    await _settle(tester);
    expect(find.text('Liked · 215'), findsOneWidget);

    // Comment: posted at the top, count updated, deletable by its author.
    await tester.enterText(find.byType(EditableText).last, 'Great briefing');
    await tester.pump();
    await tester.tap(find.byIcon(AppIcons.send));
    await _settle(tester);
    expect(find.text('Great briefing'), findsOneWidget);
    expect(find.text('4 comments'), findsOneWidget);
    expect(find.bySemanticsLabel('Delete comment'), findsOneWidget);

    // A company's public profile.
    router.go('/discover');
    await _settle(tester);
    unawaited(router.push('/companies/nexa'));
    await _settle(tester);
    expect(find.text('Projects'), findsOneWidget);
    expect(find.text('Follow'), findsOneWidget);

    await tester.tap(find.text('Follow'));
    await _settle(tester);
    expect(find.text('Following'), findsOneWidget);

    await tester.scrollUntilVisible(
      find.text('Open opportunities'),
      200,
      scrollable: find.byType(Scrollable).first,
    );
    expect(find.text('Open opportunities'), findsOneWidget);
  });
}
