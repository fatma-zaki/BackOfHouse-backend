import 'package:backofhouse/app/theme/app_colors.dart';
import 'package:backofhouse/core/constants/app_icons.dart';
import 'package:backofhouse/core/l10n/generated/app_localizations.dart';
import 'package:backofhouse/core/l10n/l10n_messages.dart';
import 'package:backofhouse/core/media/app_image.dart';
import 'package:backofhouse/core/network/api_exception.dart';
import 'package:backofhouse/core/widgets/widgets.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import '../helpers/test_app.dart';

const _longTitle =
    'Saudi Events Industry Continues to Grow in 2025 With Record Attendance';

Widget _imageCard({VoidCallback? onTap}) => BOHImageCard(
  image: null,
  tag: const BOHTag('Industry'),
  title: _longTitle,
  description:
      'New reports show a significant increase in events, attendees, and '
      "investment in the Kingdom's events sector.",
  metadata: const ['2h ago', '5 min read'],
  onTap: onTap ?? () {},
);

Widget _nav({int index = 0, ValueChanged<int>? onSelected}) =>
    BOHBottomNavigation(
      currentIndex: index,
      onSelected: onSelected ?? (_) {},
      items: const [
        BOHNavItem(icon: AppIcons.home, label: 'Home'),
        BOHNavItem(icon: AppIcons.events, label: 'Events'),
        BOHNavItem(icon: AppIcons.news, label: 'News'),
        BOHNavItem(
          icon: AppIcons.notifications,
          label: 'Notifications',
          showBadge: true,
        ),
        BOHNavItem(icon: AppIcons.profile, label: 'Profile'),
      ],
    );

void main() {
  group('touch targets are at least 44×44', () {
    testWidgets('icon button, text button, pill chip, avatar', (tester) async {
      await pumpBoh(
        tester,
        Center(
          child: Wrap(
            children: [
              BOHIconButton(
                key: const Key('icon'),
                icon: AppIcons.search,
                semanticLabel: 'Search',
                onPressed: () {},
              ),
              BOHButton(
                key: const Key('text'),
                label: 'Go',
                variant: BOHButtonVariant.text,
                onPressed: () {},
              ),
              BOHCategoryChip(
                key: const Key('chip'),
                label: 'All',
                selected: true,
                onSelected: () {},
              ),
              BOHAvatar(
                key: const Key('avatar'),
                name: 'A B',
                size: BOHAvatarSize.small,
                onTap: () {},
              ),
            ],
          ),
        ),
      );

      for (final key in ['icon', 'text', 'chip', 'avatar']) {
        final size = tester.getSize(find.byKey(Key(key)));
        expect(size.width, greaterThanOrEqualTo(44), reason: key);
        expect(size.height, greaterThanOrEqualTo(44), reason: key);
      }
    });
  });

  group('semantics', () {
    testWidgets('icon button announces its label once, as a button', (
      tester,
    ) async {
      final handle = tester.ensureSemantics();
      await pumpBoh(
        tester,
        Center(
          child: BOHIconButton(
            icon: AppIcons.search,
            semanticLabel: 'Search',
            onPressed: () {},
          ),
        ),
      );
      expect(
        tester.getSemantics(find.byType(BOHIconButton)),
        isSemantics(
          label: 'Search',
          isButton: true,
          isEnabled: true,
          hasTapAction: true,
        ),
      );
      handle.dispose();
    });

    testWidgets('selected chip exposes selected state', (tester) async {
      final handle = tester.ensureSemantics();
      await pumpBoh(
        tester,
        Center(
          child: BOHCategoryChip(
            label: 'All',
            selected: true,
            onSelected: () {},
          ),
        ),
      );
      expect(
        tester.getSemantics(find.byType(BOHCategoryChip)),
        isSemantics(label: 'All', isSelected: true, isButton: true),
      );
      handle.dispose();
    });
  });

  group('state never relies on colour alone', () {
    testWidgets('text field error renders an icon and message', (tester) async {
      final formKey = GlobalKey<FormState>();
      await pumpBoh(
        tester,
        Padding(
          padding: const EdgeInsets.all(20),
          child: Form(
            key: formKey,
            child: BOHTextField(
              hint: 'Email',
              validator: (_) => 'Email address is required',
            ),
          ),
        ),
      );
      expect(find.text('Email address is required'), findsNothing);

      formKey.currentState!.validate();
      await tester.pumpAndSettle();

      expect(find.text('Email address is required'), findsOneWidget);
      expect(find.byIcon(AppIcons.info), findsOneWidget);
    });

    testWidgets('status tags always carry an icon', (tester) async {
      await pumpBoh(
        tester,
        const Column(
          children: [
            BOHTag('Live', variant: BOHTagVariant.success),
            BOHTag('Few seats', variant: BOHTagVariant.warning),
            BOHTag('Cancelled', variant: BOHTagVariant.error),
          ],
        ),
      );
      expect(find.byType(Icon), findsNWidgets(3));
    });

    testWidgets('active nav item is bolder, not just recoloured', (
      tester,
    ) async {
      await pumpBoh(
        tester,
        Align(alignment: Alignment.bottomCenter, child: _nav()),
      );
      FontWeight? weight(String label) =>
          tester.widget<Text>(find.text(label)).style?.fontWeight;
      expect(weight('Home'), FontWeight.w700);
      expect(weight('News'), FontWeight.w500);
    });
  });

  group('RTL', () {
    testWidgets('directional icons mirror, others do not', (tester) async {
      expect(AppIcons.arrowForward.matchTextDirection, isTrue);
      expect(AppIcons.arrowBack.matchTextDirection, isTrue);
      expect(AppIcons.search.matchTextDirection, isFalse);
    });

    testWidgets('nav order follows reading direction', (tester) async {
      await pumpBoh(
        tester,
        Align(alignment: Alignment.bottomCenter, child: _nav()),
        locale: const Locale('ar'),
      );
      final home = tester.getCenter(find.text('Home'));
      final more = tester.getCenter(find.text('Profile'));
      expect(home.dx, greaterThan(more.dx));
    });

    testWidgets('eyebrow is not tracked or uppercased in Arabic', (
      tester,
    ) async {
      await pumpBoh(
        tester,
        const BOHEyebrow('آخر الأخبار'),
        locale: const Locale('ar'),
      );
      final text = tester.widget<Text>(find.text('آخر الأخبار'));
      expect(text.style?.letterSpacing, 0);
    });
  });

  group('no overflow at 2× text on a 360pt screen', () {
    for (final (locale, brightness) in const [
      (Locale('en'), Brightness.light),
      (Locale('ar'), Brightness.light),
      (Locale('en'), Brightness.dark),
    ]) {
      testWidgets('image card, nav, section header, states '
          '(${locale.languageCode}, ${brightness.name})', (tester) async {
        await pumpBoh(
          tester,
          ListView(
            padding: const EdgeInsets.all(20),
            children: [
              BOHSectionHeader(title: 'Latest News', onAction: () {}),
              _imageCard(),
              const BOHImageCard(
                layout: BOHImageCardLayout.vertical,
                image: AppImage.placeholder,
                title: _longTitle,
                metadata: ['2h ago'],
              ),
              const BOHButton(label: 'Join the Community', onPressed: null),
              const SizedBox(height: 360, child: BOHErrorState()),
              _nav(),
            ],
          ),
          locale: locale,
          brightness: brightness,
          textScale: 2,
          size: const Size(360, 780),
        );
        await tester.pump(const Duration(milliseconds: 400));
        expect(tester.takeException(), isNull);
      });
    }
  });

  testWidgets('image fallback shows when no image is provided', (tester) async {
    await pumpBoh(
      tester,
      const SizedBox(width: 120, height: 80, child: BOHImage(image: null)),
    );
    expect(find.byIcon(AppIcons.imageUnavailable), findsOneWidget);
  });

  testWidgets('button shows a spinner and ignores taps while loading', (
    tester,
  ) async {
    var taps = 0;
    await pumpBoh(
      tester,
      Center(
        child: BOHButton(
          label: 'Log In',
          isLoading: true,
          onPressed: () => taps++,
        ),
      ),
    );
    expect(find.byType(CircularProgressIndicator), findsOneWidget);
    await tester.tap(find.byType(BOHButton));
    expect(taps, 0);
  });

  test('errors map to localized copy', () async {
    final en = await AppLocalizations.delegate.load(const Locale('en'));
    final ar = await AppLocalizations.delegate.load(const Locale('ar'));
    const offline = ApiException(type: ApiErrorType.noConnection);
    expect(en.error(offline), en.errorNoConnection);
    expect(ar.error(offline), isNot(en.errorNoConnection));
    expect(en.error(StateError('x')), en.errorUnknown);

    final now = DateTime(2026, 9, 13, 12);
    expect(
      en.relativeTime(now.subtract(const Duration(hours: 2)), now: now),
      '2h ago',
    );
    expect(
      ar.relativeTime(now.subtract(const Duration(hours: 2)), now: now),
      'قبل ساعتين',
    );
  });

  group('text colours meet WCAG AA (4.5:1) in both modes', () {
    double contrast(Color a, Color b) {
      final (l1, l2) = (a.computeLuminance(), b.computeLuminance());
      final (hi, lo) = l1 > l2 ? (l1, l2) : (l2, l1);
      return (hi + 0.05) / (lo + 0.05);
    }

    for (final c in const [AppColors.light, AppColors.dark]) {
      test(c.brightness.name, () {
        final pairs = {
          'textPrimary/background': (c.textPrimary, c.background),
          'textSecondary/surface': (c.textSecondary, c.surface),
          'primaryText/background': (c.primaryText, c.background),
          'onPrimary/primary': (c.onPrimary, c.primary),
          if (!c.isDark) ...{
            'textMuted/background': (c.textMuted, c.background),
            'primaryText/primaryTint': (c.primaryText, c.primaryTint),
            'error/surface': (c.error, c.surface),
            'success/surface': (c.success, c.surface),
          },
        };
        for (final MapEntry(:key, :value) in pairs.entries) {
          expect(
            contrast(value.$1, value.$2),
            greaterThanOrEqualTo(4.5),
            reason: key,
          );
        }
      });
    }
  });

  testWidgets('components follow the active theme mode', (tester) async {
    Future<Color?> fillOf(Brightness brightness) async {
      await pumpBoh(
        tester,
        const BOHCard(child: SizedBox(width: 40, height: 40)),
        brightness: brightness,
      );
      // MaterialApp animates between themes; read the settled colour.
      await tester.pumpAndSettle();
      final box = tester.widget<AnimatedContainer>(
        find.byType(AnimatedContainer),
      );
      return (box.decoration! as BoxDecoration).color;
    }

    expect(await fillOf(Brightness.light), AppColors.light.surface);
    expect(await fillOf(Brightness.dark), AppColors.dark.surface);
  });

  testWidgets('LTR fields keep numbers in order in Arabic', (tester) async {
    await pumpBoh(
      tester,
      const Padding(
        padding: EdgeInsets.all(20),
        child: BOHTextField(hint: '+966 50 123 4567', forceLtr: true),
      ),
      locale: const Locale('ar'),
    );
    final field = tester.widget<TextField>(find.byType(TextField));
    expect(field.textDirection, TextDirection.ltr);
    expect(field.textAlign, TextAlign.right);
    expect(field.decoration?.hintTextDirection, TextDirection.ltr);
  });

  test('avatar initials handle Arabic surnames with the definite article', () {
    expect(BOHAvatar.initialsOf('Fatma Zaki'), 'FZ');
    expect(BOHAvatar.initialsOf('فهد المطيري'), 'فم');
    expect(BOHAvatar.initialsOf('Sara'), 'S');
    expect(BOHAvatar.initialsOf('  '), '');
  });
}
