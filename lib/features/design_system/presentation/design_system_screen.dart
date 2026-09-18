import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_radii.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/theme_mode_controller.dart';
import '../../../core/constants/app_icons.dart';
import '../../../core/extensions/context_extensions.dart';
import '../../../core/media/app_image.dart';
import '../../../core/widgets/widgets.dart';
import 'design_system_fixtures.dart';

/// Living reference for the design system: every token and component in
/// its states, in the active language and theme mode. Registered outside
/// production only.
///
/// Section labels are English on purpose — this is developer tooling.
class DesignSystemScreen extends ConsumerWidget {
  const DesignSystemScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final arabic = context.isArabic;
    final dark = context.isDark;

    final sections = <(String, Widget)>[
      ('Color', const _Colors()),
      ('Typography', const _Typography()),
      ('Spacing & radii', const _SpacingRadii()),
      ('Buttons', const _Buttons()),
      ('Inputs', const _Inputs()),
      ('Chips & tags', const _Chips()),
      ('Cards', _Cards(samples: GallerySample.of(arabic: arabic))),
      ('Avatars & headers', const _Avatars()),
      ('Navigation', const _Navigation()),
      ('States', const _States()),
    ];

    return BOHScaffold(
      appBar: BOHAppBar(
        title: 'Design System',
        actions: [
          BOHIconButton(
            icon: dark ? AppIcons.lightMode : AppIcons.darkMode,
            semanticLabel: context.l10n.themeLabel,
            onPressed: () => ref
                .read(themeModeControllerProvider.notifier)
                .setMode(dark ? ThemeMode.light : ThemeMode.dark),
          ),
          const BOHLanguageSwitch(),
        ],
      ),
      body: ListView.separated(
        padding: BOHScaffold.screenPadding.add(
          const EdgeInsets.only(top: AppSpacing.s16, bottom: AppSpacing.s64),
        ),
        itemCount: sections.length,
        separatorBuilder: (_, _) =>
            const SizedBox(height: AppSpacing.sectionSpacing),
        itemBuilder: (context, i) {
          final (label, body) = sections[i];
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              BOHEyebrow(
                '${(i + 1).toString().padLeft(2, '0')}  $label',
                showRule: true,
              ),
              const SizedBox(height: AppSpacing.s16),
              body,
            ],
          );
        },
      ),
    );
  }
}

const _gap = SizedBox(height: AppSpacing.s12, width: AppSpacing.s12);

class _Colors extends StatelessWidget {
  const _Colors();

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Wrap(
      spacing: AppSpacing.s8,
      runSpacing: AppSpacing.s12,
      children: [
        for (final (name, color) in galleryColorTokens(c))
          SizedBox(
            width: 80,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Container(
                  height: 40,
                  decoration: BoxDecoration(
                    color: color,
                    borderRadius: AppRadii.smallAll,
                    border: Border.all(color: c.border),
                  ),
                ),
                const SizedBox(height: AppSpacing.s4),
                Text(
                  name,
                  style: context.text.caption,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
      ],
    );
  }
}

class _Typography extends StatelessWidget {
  const _Typography();

  @override
  Widget build(BuildContext context) {
    final t = context.text;
    final styles = [
      ('Display 32/38', t.display),
      ('H1 28/34', t.h1),
      ('H2 22/28', t.h2),
      ('H3 18/24', t.h3),
      ('Body Large 16/24', t.bodyLarge),
      ('Body 14/21', t.body),
      ('Body Small 12/18', t.bodySmall),
      ('Caption 11/16', t.caption),
    ];
    final arabic = context.isArabic;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final (name, style) in styles)
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.s8),
            child: Text(name, style: style),
          ),
        const SizedBox(height: AppSpacing.s16),
        BOHAccentText(
          lead: arabic ? 'قطاع الفعاليات ' : 'The Events Industry Keeps ',
          accent: arabic ? 'ينمو' : 'Growing',
          trail: arabic ? ' في السعودية' : ' in Saudi Arabia',
        ),
      ],
    );
  }
}

class _SpacingRadii extends StatelessWidget {
  const _SpacingRadii();

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    const spacing = [
      AppSpacing.s4,
      AppSpacing.s8,
      AppSpacing.s12,
      AppSpacing.s16,
      AppSpacing.s20,
      AppSpacing.s24,
      AppSpacing.s32,
      AppSpacing.s40,
      AppSpacing.s48,
      AppSpacing.s64,
    ];
    const radii = [
      ('Small', AppRadii.small),
      ('Medium', AppRadii.medium),
      ('Large', AppRadii.large),
      ('Hero', AppRadii.hero),
      ('Pill', AppRadii.pill),
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Wrap(
          spacing: AppSpacing.s8,
          runSpacing: AppSpacing.s8,
          crossAxisAlignment: WrapCrossAlignment.end,
          children: [
            for (final s in spacing)
              Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Container(width: s, height: s, color: c.primaryTint),
                  Text('${s.toInt()}', style: context.text.caption),
                ],
              ),
          ],
        ),
        const SizedBox(height: AppSpacing.s20),
        Wrap(
          spacing: AppSpacing.s12,
          runSpacing: AppSpacing.s12,
          children: [
            for (final (name, r) in radii)
              Container(
                width: 88,
                height: 56,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: c.surface,
                  borderRadius: BorderRadius.circular(r),
                  border: Border.all(color: c.border),
                ),
                child: Text(name, style: context.text.bodySmall),
              ),
          ],
        ),
      ],
    );
  }
}

class _Buttons extends StatefulWidget {
  const _Buttons();

  @override
  State<_Buttons> createState() => _ButtonsState();
}

class _ButtonsState extends State<_Buttons> {
  bool _loading = false;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        BOHButton(
          label: l10n.signInCta,
          isLoading: _loading,
          onPressed: () async {
            setState(() => _loading = true);
            await Future<void>.delayed(const Duration(seconds: 2));
            if (mounted) setState(() => _loading = false);
          },
        ),
        _gap,
        BOHButton(
          label: l10n.welcomeGetStarted,
          shape: BOHButtonShape.pill,
          onPressed: () {},
        ),
        _gap,
        BOHSecondaryButton(label: l10n.actionViewAll, onPressed: () {}),
        _gap,
        BOHButton(
          label: l10n.continueWithGoogle,
          variant: BOHButtonVariant.ghost,
          trailingIcon: null,
          onPressed: () {},
        ),
        _gap,
        BOHButton(label: l10n.signUpCta, onPressed: null),
        _gap,
        Wrap(
          spacing: AppSpacing.s12,
          runSpacing: AppSpacing.s12,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            BOHButton(
              label: l10n.actionReadMore,
              variant: BOHButtonVariant.secondary,
              size: BOHButtonSize.small,
              expand: false,
              onPressed: () {},
            ),
            BOHButton(
              label: l10n.forgotPassword,
              variant: BOHButtonVariant.text,
              onPressed: () {},
            ),
            BOHIconButton(
              icon: AppIcons.arrowForward,
              semanticLabel: l10n.actionOpen,
              variant: BOHIconButtonVariant.filled,
              onPressed: () {},
            ),
            BOHIconButton(
              icon: AppIcons.arrowForward,
              semanticLabel: l10n.actionOpen,
              variant: BOHIconButtonVariant.outlined,
              onPressed: () {},
            ),
            BOHIconButton(
              icon: AppIcons.notifications,
              semanticLabel: l10n.notificationsLabel,
              showBadge: true,
              onPressed: () {},
            ),
            BOHIconButton(
              icon: AppIcons.arrowForward,
              semanticLabel: l10n.actionOpen,
              variant: BOHIconButtonVariant.filled,
              onPressed: null,
            ),
          ],
        ),
      ],
    );
  }
}

class _Inputs extends StatefulWidget {
  const _Inputs();

  @override
  State<_Inputs> createState() => _InputsState();
}

class _InputsState extends State<_Inputs> {
  final _formKey = GlobalKey<FormState>();
  bool _checked = true;

  @override
  void initState() {
    super.initState();
    // Show the error state without user interaction.
    WidgetsBinding.instance.addPostFrameCallback(
      (_) => _formKey.currentState?.validate(),
    );
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          BOHTextField(
            label: l10n.fieldEmailLabel,
            hint: l10n.fieldEmailHint,
            prefixIcon: AppIcons.email,
          ),
          _gap,
          BOHTextField(
            label: l10n.fieldPasswordLabel,
            hint: l10n.fieldPasswordHint,
            prefixIcon: AppIcons.password,
            obscurable: true,
            validator: (_) => l10n.validationPasswordRequired,
          ),
          _gap,
          BOHTextField(
            label: l10n.fieldPhoneLabel,
            hint: l10n.fieldPhoneHint,
            prefixIcon: AppIcons.phone,
            enabled: false,
          ),
          _gap,
          const BOHSearchField(),
          _gap,
          BOHCheckbox(
            value: _checked,
            label: l10n.mustAcceptTerms,
            onChanged: (v) => setState(() => _checked = v),
          ),
        ],
      ),
    );
  }
}

class _Chips extends StatefulWidget {
  const _Chips();

  @override
  State<_Chips> createState() => _ChipsState();
}

class _ChipsState extends State<_Chips> {
  int _tile = 0;
  int _pill = 0;

  @override
  Widget build(BuildContext context) {
    final arabic = context.isArabic;
    final tiles = [
      (AppIcons.categoryAll, arabic ? 'الكل' : 'All'),
      (AppIcons.industry, arabic ? 'القطاع' : 'Industry'),
      (AppIcons.trendingUp, arabic ? 'التوجهات' : 'Trends'),
      (AppIcons.technology, arabic ? 'التقنية' : 'Technology'),
      (AppIcons.saudiMarket, arabic ? 'السوق السعودي' : 'Saudi Market'),
      (AppIcons.tips, arabic ? 'نصائح' : 'Tips'),
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(
          height: 96,
          child: ListView.separated(
            scrollDirection: Axis.horizontal,
            clipBehavior: Clip.none,
            itemCount: tiles.length,
            separatorBuilder: (_, _) => const SizedBox(width: AppSpacing.s8),
            itemBuilder: (_, i) => BOHCategoryChip(
              icon: tiles[i].$1,
              label: tiles[i].$2,
              selected: _tile == i,
              onSelected: () => setState(() => _tile = i),
            ),
          ),
        ),
        _gap,
        Wrap(
          spacing: AppSpacing.s8,
          children: [
            for (var i = 0; i < 4; i++)
              BOHCategoryChip(
                label: tiles[i].$2,
                selected: _pill == i,
                onSelected: () => setState(() => _pill = i),
              ),
          ],
        ),
        _gap,
        Wrap(
          spacing: AppSpacing.s8,
          runSpacing: AppSpacing.s8,
          children: [
            for (final v in BOHTagVariant.values) BOHTag(v.name, variant: v),
          ],
        ),
      ],
    );
  }
}

class _Cards extends StatelessWidget {
  const _Cards({required this.samples});

  final List<GallerySample> samples;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final first = samples.first;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final s in samples) ...[
          BOHImageCard(
            image: s.image,
            tag: BOHTag(s.tag),
            title: s.title,
            description: s.description,
            metadata: s.meta,
            onTap: () {},
          ),
          _gap,
        ],
        const BOHShimmer(child: BOHImageCardSkeleton()),
        _gap,
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: BOHImageCard(
                layout: BOHImageCardLayout.vertical,
                image: first.image,
                tag: BOHTag(first.tag, variant: BOHTagVariant.solid),
                title: first.title,
                metadata: first.meta.take(1).toList(),
                onTap: () {},
              ),
            ),
            _gap,
            Expanded(
              child: BOHImageCard(
                layout: BOHImageCardLayout.overlay,
                image: first.image,
                tag: BOHTag(l10n.comingSoonTitle, variant: BOHTagVariant.gold),
                title: first.tag,
                onTap: () {},
              ),
            ),
          ],
        ),
        _gap,
        BOHCard(child: Text(first.description, style: context.text.body)),
        _gap,
        SizedBox(
          height: 180,
          child: Stack(
            fit: StackFit.expand,
            children: [
              const BOHImage(
                image: AppImage.placeholder,
                borderRadius: AppRadii.heroAll,
                scrim: BOHImageScrim.full,
              ),
              Align(
                alignment: AlignmentDirectional.bottomStart,
                child: Padding(
                  padding: const EdgeInsets.all(AppSpacing.s16),
                  child: BOHGlassCard(
                    child: Text(
                      l10n.brandMotto,
                      style: AppTypography.label.copyWith(
                        color: context.colors.textPrimary,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _Avatars extends StatelessWidget {
  const _Avatars();

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Wrap(
          spacing: AppSpacing.s16,
          crossAxisAlignment: WrapCrossAlignment.center,
          children: [
            const BOHAvatar(name: 'Sara Al-Qahtani', size: BOHAvatarSize.small),
            const BOHAvatar(name: 'Fatma Zaki'),
            const BOHAvatar(
              name: 'Crew',
              image: AppImage.placeholder,
              size: BOHAvatarSize.large,
              verified: true,
            ),
            BOHAvatar(
              name: context.isArabic ? 'نورة الدوسري' : 'Noura Al Dosari',
              size: BOHAvatarSize.large,
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.s24),
        BOHSectionHeader(title: l10n.routeEvents, onAction: () {}),
        const SizedBox(height: AppSpacing.s16),
        BOHDivider(label: l10n.orDivider),
        const SizedBox(height: AppSpacing.s16),
        const BOHDivider(fade: true),
        const SizedBox(height: AppSpacing.s16),
        const BOHLogo(),
      ],
    );
  }
}

class _Navigation extends StatefulWidget {
  const _Navigation();

  @override
  State<_Navigation> createState() => _NavigationState();
}

class _NavigationState extends State<_Navigation> {
  int _index = 0;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return MediaQuery.removePadding(
      context: context,
      removeBottom: true,
      child: BOHBottomNavigation(
        currentIndex: _index,
        onSelected: (i) => setState(() => _index = i),
        items: [
          BOHNavItem(icon: AppIcons.home, label: l10n.navHome),
          BOHNavItem(icon: AppIcons.discover, label: l10n.navDiscover),
          BOHNavItem(
            icon: AppIcons.rewards,
            label: l10n.navRewards,
            showBadge: true,
          ),
          BOHNavItem(icon: AppIcons.profile, label: l10n.navProfile),
        ],
      ),
    );
  }
}

class _States extends StatelessWidget {
  const _States();

  @override
  Widget build(BuildContext context) {
    Widget framed(Widget child) => Container(
      height: 300,
      margin: const EdgeInsets.only(bottom: AppSpacing.s12),
      decoration: BoxDecoration(
        color: context.colors.surface,
        borderRadius: AppRadii.mediumAll,
        border: Border.all(color: context.colors.borderSoft),
      ),
      child: child,
    );
    return Column(
      children: [
        framed(const BOHLoadingState()),
        framed(const BOHEmptyState()),
        framed(BOHErrorState(onRetry: () {})),
      ],
    );
  }
}
