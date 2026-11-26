import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../app/theme/app_radii.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_typography.dart';
import '../../../app/theme/theme_mode_controller.dart';
import '../../../core/constants/app_assets.dart';
import '../../../core/constants/app_icons.dart';
import '../../../core/extensions/context_extensions.dart';
import '../../../core/media/app_image.dart';
import '../../../core/widgets/widgets.dart';
import 'design_system_fixtures.dart';

/// Living reference for the design system: every token and component in
/// its states, in the active language and theme mode. Registered outside
/// production only.
///
/// Section labels and sample copy are English on purpose — this is
/// developer tooling.
class DesignSystemScreen extends ConsumerWidget {
  const DesignSystemScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dark = context.isDark;

    final sections = <(String, Widget)>[
      ('Color', const _Colors()),
      ('Typography', const _Typography()),
      ('Spacing & radii', const _SpacingRadii()),
      ('Buttons', const _Buttons()),
      ('Headers & sections', const _Headers()),
      ('Inputs', const _Inputs()),
      ('Selection', const _Selection()),
      ('Chips, tags & badges', const _Chips()),
      ('Cards', const _Cards()),
      ('Stats & progress', const _Stats()),
      ('Banners', const _Banners()),
      ('Avatars & glyphs', const _Avatars()),
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
        separatorBuilder: (_, _) => const SizedBox(height: AppSpacing.s32),
        itemBuilder: (context, i) {
          final (label, body) = sections[i];
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              BOHSectionHeader(
                title: '${(i + 1).toString().padLeft(2, '0')}  $label',
              ),
              const SizedBox(height: AppSpacing.s12),
              body,
            ],
          );
        },
      ),
    );
  }
}

const _gap = SizedBox(height: AppSpacing.s12, width: AppSpacing.s12);

const _photo = AppImage.asset(AppAssets.summit);
const _photo2 = AppImage.asset(AppAssets.event1);

Widget _wrap(List<Widget> children) => Wrap(
  spacing: AppSpacing.s8,
  runSpacing: AppSpacing.s8,
  crossAxisAlignment: WrapCrossAlignment.center,
  children: children,
);

class _Colors extends StatelessWidget {
  const _Colors();

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    Widget swatch(String name, Color fill, [Color? ink]) => SizedBox(
      width: 80,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            height: 40,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              color: fill,
              borderRadius: AppRadii.smallAll,
              border: Border.all(color: c.border),
            ),
            child: ink == null
                ? null
                : Text('Aa', style: context.text.label.copyWith(color: ink)),
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
    );
    return Wrap(
      spacing: AppSpacing.s8,
      runSpacing: AppSpacing.s12,
      children: [
        for (final (name, color) in galleryColorTokens(c)) swatch(name, color),
        for (final (name, tone) in galleryTones(c))
          swatch(name, tone.background, tone.foreground),
      ],
    );
  }
}

class _Typography extends StatelessWidget {
  const _Typography();

  @override
  Widget build(BuildContext context) {
    final t = context.text;
    final styles = <(String, TextStyle)>[
      ('display 30', t.display),
      ('titleXL 26', t.titleXL),
      ('h1 24', t.h1),
      ('title 22', t.title),
      ('appBarTitle 20', t.appBarTitle),
      ('h2 18', t.h2),
      ('h3 16', t.h3),
      ('cardTitle 15', t.cardTitle),
      ('itemTitle 14', t.itemTitle),
      ('bodyLarge 14', t.bodyLarge),
      ('body 13', t.body),
      ('label 13', t.label),
      ('labelMedium 12', t.labelMedium),
      ('bodySmall 12', t.bodySmall),
      ('caption 11', t.caption),
      ('badge 10.5', t.badge),
      ('eyebrow 10', t.eyebrow),
      ('tag 9.5', t.tag),
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final (name, style) in styles)
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.s8),
            child: Text(
              '$name — ${context.l10n.appName}',
              style: style,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        Text('1,250 · 26 · 09:30', style: t.number(26, lineHeight: 30)),
      ],
    );
  }
}

class _SpacingRadii extends StatelessWidget {
  const _SpacingRadii();

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    const radii = [
      ('tag', AppRadii.tag),
      ('small', AppRadii.small),
      ('input', AppRadii.input),
      ('medium', AppRadii.medium),
      ('listCard', AppRadii.listCard),
      ('large', AppRadii.large),
      ('hero', AppRadii.hero),
    ];
    const spaces = [4.0, 8.0, 10.0, 12.0, 14.0, 16.0, 20.0, 24.0];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _wrap([
          for (final (name, r) in radii)
            Column(
              children: [
                Container(
                  width: 56,
                  height: 44,
                  decoration: BoxDecoration(
                    color: c.primaryTint,
                    borderRadius: BorderRadius.circular(r),
                    border: Border.all(color: c.borderAccent),
                  ),
                ),
                Text(
                  '$name ${r.toStringAsFixed(0)}',
                  style: context.text.caption,
                ),
              ],
            ),
        ]),
        _gap,
        _wrap([
          for (final s in spaces)
            Column(
              children: [
                Container(width: s, height: 24, color: c.primary),
                Text(s.toStringAsFixed(0), style: context.text.caption),
              ],
            ),
        ]),
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
    void noop() {}
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        BOHButton(
          label: 'Create account',
          size: BOHButtonSize.auth,
          onPressed: noop,
        ),
        _gap,
        BOHButton(
          label: 'Sign in',
          variant: BOHButtonVariant.ghost,
          size: BOHButtonSize.auth,
          trailingIcon: null,
          onPressed: noop,
        ),
        _gap,
        BOHButton(
          label: 'Register',
          isLoading: _loading,
          onPressed: () async {
            setState(() => _loading = true);
            await Future<void>.delayed(const Duration(seconds: 2));
            if (mounted) setState(() => _loading = false);
          },
        ),
        _gap,
        BOHActionBar.pair(
          secondary: BOHButton(
            label: 'Save draft',
            variant: BOHButtonVariant.secondary,
            trailingIcon: null,
            onPressed: noop,
          ),
          primary: BOHButton(label: 'Submit', onPressed: noop),
        ),
        _gap,
        Row(
          children: [
            Expanded(
              child: BOHButton(
                label: 'Not selected',
                variant: BOHButtonVariant.danger,
                trailingIcon: null,
                onPressed: noop,
              ),
            ),
            _gap,
            const Expanded(
              child: BOHButton(label: 'Disabled', onPressed: null),
            ),
          ],
        ),
        _gap,
        _wrap([
          BOHButton(
            label: 'Respond',
            size: BOHButtonSize.medium,
            trailingIcon: null,
            expand: false,
            onPressed: noop,
          ),
          BOHButton(
            label: 'New listing',
            size: BOHButtonSize.small,
            leadingIcon: AppIcons.plus,
            trailingIcon: null,
            expand: false,
            onPressed: noop,
          ),
          BOHButton(
            label: 'Follow',
            size: BOHButtonSize.compact,
            variant: BOHButtonVariant.secondary,
            trailingIcon: null,
            expand: false,
            onPressed: noop,
          ),
          BOHButton(
            label: 'Read more',
            size: BOHButtonSize.compact,
            variant: BOHButtonVariant.overlay,
            expand: false,
            onPressed: noop,
          ),
          BOHLinkButton(label: 'View All', onTap: noop),
          BOHButton(
            label: 'Forgot password?',
            variant: BOHButtonVariant.text,
            onPressed: noop,
          ),
        ]),
        _gap,
        _wrap([
          BOHIconButton(
            icon: AppIcons.arrowBack,
            semanticLabel: 'Back',
            variant: BOHIconButtonVariant.outlined,
            onPressed: noop,
          ),
          BOHIconButton(
            icon: AppIcons.notifications,
            semanticLabel: 'Bell',
            showBadge: true,
            iconSize: 22,
            onPressed: noop,
          ),
          BOHIconButton(
            icon: AppIcons.plus,
            semanticLabel: 'Add',
            variant: BOHIconButtonVariant.filled,
            onPressed: noop,
          ),
          BOHIconButton(
            icon: AppIcons.close,
            semanticLabel: 'Clear',
            variant: BOHIconButtonVariant.soft,
            visualSize: 36,
            iconSize: 14,
            onPressed: noop,
          ),
          BOHIconButton(
            icon: AppIcons.bookmark,
            semanticLabel: 'Save',
            variant: BOHIconButtonVariant.outlined,
            visualSize: 40,
            iconSize: 18,
            color: context.colors.primaryText,
            onPressed: noop,
          ),
          Container(
            padding: const EdgeInsets.all(AppSpacing.s8),
            color: context.colors.primaryPressed,
            child: _wrap([
              BOHIconButton(
                icon: AppIcons.share,
                semanticLabel: 'Share',
                variant: BOHIconButtonVariant.photo,
                onPressed: noop,
              ),
              BOHIconButton(
                icon: AppIcons.bookmark,
                semanticLabel: 'Saved',
                variant: BOHIconButtonVariant.photo,
                active: true,
                onPressed: noop,
              ),
            ]),
          ),
        ]),
      ],
    );
  }
}

class _Headers extends StatelessWidget {
  const _Headers();

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    void noop() {}
    Widget framed(Widget child) => DecoratedBox(
      decoration: BoxDecoration(
        border: Border.all(color: c.border),
        borderRadius: AppRadii.smallAll,
      ),
      child: MediaQuery.removePadding(
        context: context,
        removeTop: true,
        child: child,
      ),
    );
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        framed(
          BOHAppBar.brand(
            actions: [
              BOHIconButton(
                icon: AppIcons.search,
                semanticLabel: 'Search',
                iconSize: 22,
                onPressed: noop,
              ),
              BOHIconButton(
                icon: AppIcons.notifications,
                semanticLabel: 'Bell',
                iconSize: 22,
                showBadge: true,
                onPressed: noop,
              ),
            ],
          ),
        ),
        _gap,
        framed(
          BOHAppBar.tab(
            title: 'Discover',
            actions: [
              BOHIconButton(
                icon: AppIcons.plus,
                semanticLabel: 'Add',
                variant: BOHIconButtonVariant.filled,
                onPressed: noop,
              ),
            ],
          ),
        ),
        _gap,
        framed(
          const BOHAppBar.company(
            title: 'Saudi Events Group',
            subtitle: 'Company workspace',
            verified: true,
            leading: BOHCompanyLogo(
              name: 'Saudi Events Group',
              image: AppImage.asset(AppAssets.companyLogoSeg),
              size: 40,
            ),
          ),
        ),
        _gap,
        framed(
          BOHAppBar(
            title: 'Applicants',
            subtitle: 'Senior Stage Manager · 12',
            showBack: true,
            onBack: noop,
          ),
        ),
        _gap,
        framed(
          BOHAppBar(
            showBack: true,
            closeIcon: true,
            onBack: noop,
            titleWidget: const Align(
              alignment: AlignmentDirectional.centerStart,
              child: BOHStepDashes(current: 1, total: 2, label: 'Step 1 of 2'),
            ),
          ),
        ),
        _gap,
        BOHSectionHeader(title: 'Featured event', onAction: noop),
        _gap,
        BOHSectionHeader(
          title: 'Opportunities for you',
          leadingIcon: AppIcons.opportunities,
          onAction: noop,
        ),
        _gap,
        const BOHSectionHeader(title: 'Requirements', size: BOHSectionSize.sub),
        _gap,
        const BOHEyebrow(
          'Latest news',
          lead: BOHEyebrowLead.skewBar,
          tracking: 3,
        ),
        _gap,
        const BOHEyebrow(
          'Saudi events community',
          lead: BOHEyebrowLead.rule,
          fontSize: 11,
          tracking: 2,
        ),
        _gap,
        const BOHEyebrow('Today', fontSize: 11),
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

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          const BOHTextField(
            hint: 'Email address',
            prefixIcon: AppIcons.email,
            auth: true,
            forceLtr: true,
          ),
          _gap,
          const BOHTextField(
            hint: 'Password',
            prefixIcon: AppIcons.password,
            obscurable: true,
            auth: true,
          ),
          _gap,
          BOHTextField(
            label: 'Job title',
            hint: 'Senior Stage Manager',
            validator: (v) => (v ?? '').isEmpty ? 'Required' : null,
          ),
          _gap,
          const BOHTextField(
            label: 'Proposed price',
            prefixText: 'SAR',
            hint: '40,000',
            forceLtr: true,
          ),
          _gap,
          const BOHTextField(
            label: 'Message',
            hint: 'Tell the company why you are a good fit',
            minLines: 4,
            maxLines: 6,
            maxLength: 500,
          ),
          _gap,
          BOHSelectField(label: 'Work setup', value: 'On-site', onTap: () {}),
          _gap,
          BOHSelectField(
            label: 'Closes on',
            placeholder: 'Pick a date',
            value: null,
            icon: AppIcons.calendar,
            onTap: () {},
          ),
          _gap,
          BOHSearchField(hint: 'Search events', onFilter: () {}),
          _gap,
          BOHButton(
            label: 'Validate',
            variant: BOHButtonVariant.secondary,
            trailingIcon: null,
            onPressed: () => _formKey.currentState!.validate(),
          ),
        ],
      ),
    );
  }
}

class _Selection extends StatefulWidget {
  const _Selection();

  @override
  State<_Selection> createState() => _SelectionState();
}

class _SelectionState extends State<_Selection> {
  bool _toggle = false;
  bool _check = true;
  bool _student = false;
  int _type = 0;
  String _tab = 'overview';
  String _mode = 'light';
  final _projects = <int>{0};

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        BOHSegmentedControl<String>(
          segments: const [
            ('overview', 'Overview'),
            ('agenda', 'Agenda'),
            ('venue', 'Venue'),
          ],
          selected: _tab,
          onChanged: (v) => setState(() => _tab = v),
        ),
        _gap,
        _wrap([
          BOHSegmentedControl<String>(
            style: BOHSegmentedStyle.compact,
            segments: const [('a', 'For you'), ('b', 'Latest')],
            selected: 'a',
            onChanged: (_) {},
          ),
          BOHSegmentedControl<String>(
            style: BOHSegmentedStyle.radio,
            segments: const [('light', 'Light'), ('dark', 'Dark')],
            selected: _mode,
            onChanged: (v) => setState(() => _mode = v),
          ),
        ]),
        _gap,
        Row(
          children: [
            for (var i = 0; i < 2; i++) ...[
              if (i > 0) _gap,
              Expanded(
                child: BOHRadioCard(
                  icon: i == 0 ? AppIcons.user : AppIcons.companies,
                  title: i == 0 ? 'Individual' : 'Company',
                  description: i == 0
                      ? 'Find work and grow your profile'
                      : 'Hire talent and find suppliers',
                  selected: _type == i,
                  onTap: () => setState(() => _type = i),
                ),
              ),
            ],
          ],
        ),
        _gap,
        BOHCheckBanner(
          title: "I'm currently a student",
          subtitle: 'Unlocks co-op training opportunities',
          value: _student,
          onChanged: (v) => setState(() => _student = v),
        ),
        _gap,
        BOHCheckCard(
          title: 'Stage Manager · Riyadh Season',
          subtitle: '2024 – present',
          value: _check,
          onChanged: (v) => setState(() => _check = v),
        ),
        _gap,
        BOHGroupedList(
          flat: true,
          children: [
            BOHToggleRow(
              label: 'Share my email',
              value: _toggle,
              showDivider: false,
              onChanged: (v) => setState(() => _toggle = v),
            ),
          ],
        ),
        _gap,
        Row(
          children: [
            for (var i = 0; i < 3; i++) ...[
              if (i > 0) const SizedBox(width: AppSpacing.s10),
              Expanded(
                child: BOHSelectableMediaTile(
                  label: 'Project ${i + 1}',
                  image: i.isEven ? _photo : _photo2,
                  selected: _projects.contains(i),
                  onChanged: (on) => setState(
                    () => on ? _projects.add(i) : _projects.remove(i),
                  ),
                ),
              ),
            ],
          ],
        ),
      ],
    );
  }
}

class _Chips extends StatefulWidget {
  const _Chips();

  @override
  State<_Chips> createState() => _ChipsState();
}

class _ChipsState extends State<_Chips> {
  int _filter = 0;
  int _category = 0;
  final _interests = <int>{1};

  @override
  Widget build(BuildContext context) {
    const filters = ['All', 'Live', 'In review', 'Drafts'];
    const categories = [
      (AppIcons.events, 'Events'),
      (AppIcons.opportunities, 'Jobs'),
      (AppIcons.companies, 'Companies'),
    ];
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _wrap([
          for (var i = 0; i < filters.length; i++)
            BOHCategoryChip(
              label: filters[i],
              selected: _filter == i,
              onSelected: () => setState(() => _filter = i),
            ),
        ]),
        _wrap([
          BOHCategoryChip(
            label: 'All',
            selected: true,
            style: BOHChipStyle.violet,
            count: 3,
            onSelected: () {},
          ),
          BOHCategoryChip(
            label: 'Events',
            selected: false,
            style: BOHChipStyle.violet,
            onSelected: () {},
          ),
        ]),
        _gap,
        _wrap([
          for (var i = 0; i < categories.length; i++)
            BOHCategoryChip(
              icon: categories[i].$1,
              label: categories[i].$2,
              selected: _category == i,
              onSelected: () => setState(() => _category = i),
            ),
        ]),
        _gap,
        _wrap([
          for (final (i, label) in const [
            'Lighting',
            'Rigging',
            'Sound',
          ].indexed)
            BOHSelectChip(
              label: label,
              selected: _interests.contains(i),
              onChanged: (on) =>
                  setState(() => on ? _interests.add(i) : _interests.remove(i)),
            ),
          BOHRemovableChip(
            label: 'Riyadh',
            removeLabel: 'Remove Riyadh',
            onRemove: () {},
          ),
        ]),
        _gap,
        _wrap(const [
          BOHTag('Conference'),
          BOHTag('Workshop', variant: BOHTagVariant.green),
          BOHTag('Networking', variant: BOHTagVariant.amber),
          BOHTag('Exhibition', variant: BOHTagVariant.blue),
          BOHTag('Flagship', variant: BOHTagVariant.solid, large: true),
          BOHTag('Job', variant: BOHTagVariant.soft),
          BOHTag('Not verified', variant: BOHTagVariant.outline),
          BOHTag('Highlighted', variant: BOHTagVariant.highlight),
          BOHTag('Verified', variant: BOHTagVariant.verified),
        ]),
        _gap,
        _wrap(const [
          BOHStatusBadge('Live', tone: BOHStatusTone.success, dot: true),
          BOHStatusBadge('In review', tone: BOHStatusTone.info, dot: true),
          BOHStatusBadge(
            'Changes requested',
            tone: BOHStatusTone.warning,
            dot: true,
          ),
          BOHStatusBadge('Draft', tone: BOHStatusTone.neutral, dot: true),
          BOHStatusBadge('Invited', tone: BOHStatusTone.violet),
          BOHStatusBadge('Not selected', tone: BOHStatusTone.error),
        ]),
        _gap,
        _wrap(const [
          BOHMetaChip('Stage management'),
          BOHMetaChip('Riyadh', large: true),
          BOHMetaChip(
            'Contact private',
            outline: true,
            icon: AppIcons.password,
          ),
        ]),
      ],
    );
  }
}

class _Cards extends StatelessWidget {
  const _Cards();

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final t = context.text;
    void noop() {}
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        BOHFadeImageCard(
          image: _photo,
          onTap: noop,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const BOHTag(
                'Flagship',
                variant: BOHTagVariant.solid,
                large: true,
              ),
              Text(
                'Riyadh Tech Summit 2026',
                style: t.h3.copyWith(fontSize: 17),
                maxLines: 2,
              ),
              Text(
                'Conference',
                style: t.labelMedium.copyWith(color: c.primaryText),
              ),
              BOHButton(
                label: 'Register',
                variant: BOHButtonVariant.secondary,
                size: BOHButtonSize.compact,
                expand: false,
                onPressed: noop,
              ),
            ],
          ),
        ),
        _gap,
        BOHCard(
          onTap: noop,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  BOHTag('Job', variant: BOHTagVariant.soft),
                  Spacer(),
                  BOHStatusBadge(
                    'Live',
                    tone: BOHStatusTone.success,
                    dot: true,
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.s8),
              Text('Senior Stage Manager', style: t.cardTitle),
              Text('Riyadh · Full-time', style: t.bodySmall),
              const SizedBox(height: AppSpacing.s10),
              BOHCardFooter(
                leading: Text('12 applicants', style: t.caption),
                trailing: BOHLinkButton(
                  label: 'Applicants',
                  fontSize: 12,
                  onTap: noop,
                ),
              ),
            ],
          ),
        ),
        _gap,
        const BOHCard(tone: BOHCardTone.warning, child: Text('Warning card')),
        _gap,
        const BOHCard(unread: true, child: Text('Unread card')),
        _gap,
        Row(
          children: [
            for (var i = 0; i < 2; i++) ...[
              if (i > 0) _gap,
              Expanded(
                child: BOHMediaTile(
                  image: i == 0 ? _photo : _photo2,
                  onTap: noop,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Backstage pass', style: t.label),
                      Text(
                        '500 pts',
                        style: t.number(15, color: c.primaryText),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
        _gap,
        BOHCard(
          child: Column(
            children: [
              const BOHInfoRow(
                icon: AppIcons.calendar,
                title: 'Thu, 15 Oct 2026',
                subtitle: '09:00 – 18:00',
              ),
              _gap,
              BOHInfoRow(
                icon: AppIcons.location,
                title: 'Riyadh Front',
                subtitle: 'Riyadh',
                trailing: BOHLinkButton(
                  label: 'Map',
                  arrow: false,
                  onTap: noop,
                ),
              ),
            ],
          ),
        ),
        _gap,
        const Row(
          children: [
            Expanded(
              child: BOHFieldTile(label: 'Budget', value: 'SAR 40K'),
            ),
            SizedBox(width: AppSpacing.s8),
            Expanded(
              child: BOHFieldTile(label: 'Respond by', value: '12 Oct'),
            ),
            SizedBox(width: AppSpacing.s8),
            BOHDateBlock(weekday: 'THU', day: '15', month: 'OCT'),
          ],
        ),
        _gap,
        BOHTicketCard(
          image: _photo,
          imageOverlay: const BOHTag(
            'Conference',
            variant: BOHTagVariant.solid,
            large: true,
          ),
          body: Text('Riyadh Tech Summit', style: t.h3),
          footer: Row(
            children: [
              const BOHQrTile(),
              _gap,
              Expanded(child: Text('Your event pass', style: t.label)),
            ],
          ),
        ),
      ],
    );
  }
}

class _Stats extends StatelessWidget {
  const _Stats();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const Row(
          children: [
            Expanded(
              child: BOHStatTile(
                label: 'New applicants',
                value: '24',
                delta: '+5 this week',
                highlight: true,
              ),
            ),
            SizedBox(width: AppSpacing.s10),
            Expanded(
              child: BOHStatTile(
                label: 'Profile views',
                value: '148',
                delta: '+18%',
              ),
            ),
          ],
        ),
        _gap,
        const BOHStatStrip(
          items: [
            ('12', 'Attended'),
            ('3', 'Applications'),
            ('1,250', 'Points'),
          ],
        ),
        _gap,
        const BOHStatStrip(
          violet: true,
          items: [('1,250', 'Balance'), ('1,850', 'Earned'), ('600', 'Spent')],
        ),
        _gap,
        const BOHProgressBar(value: 0.72),
        _gap,
        const BOHStatusTracker(
          steps: [
            'Submitted',
            'Reviewed',
            'Shortlisted',
            'Contact',
            'Decision',
          ],
          reached: 2,
        ),
        _gap,
        const BOHStepCard(
          number: 1,
          title: 'Identity document',
          subtitle: 'Uploaded',
          state: BOHStepState.done,
        ),
        _gap,
        BOHStepCard(
          number: 2,
          title: 'Proof of experience',
          subtitle: 'Certificate or letter',
          state: BOHStepState.current,
          action: BOHButton(
            label: 'Upload',
            size: BOHButtonSize.compact,
            variant: BOHButtonVariant.secondary,
            trailingIcon: null,
            expand: false,
            onPressed: () {},
          ),
        ),
        _gap,
        const BOHStepCard(
          number: 3,
          title: 'Review',
          state: BOHStepState.pending,
        ),
        _gap,
        const BOHNumberedStep(
          number: 1,
          text: 'Open the event and tap Register.',
        ),
        _gap,
        const BOHCheckBullet('5+ years managing large stages'),
        _gap,
        BOHCodeBox(code: 'BOH-7Q2K-91', copyLabel: 'Copy', onCopied: () {}),
      ],
    );
  }
}

class _Banners extends StatelessWidget {
  const _Banners();

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const BOHBanner(
          '',
          title: "You're eligible to apply",
          tone: BOHBannerTone.success,
        ),
        _gap,
        const BOHBanner(
          'Earn points when your attendance is verified.',
          tone: BOHBannerTone.warning,
        ),
        _gap,
        const BOHBanner(
          'Back of House reviews every listing before it goes live.',
          tone: BOHBannerTone.info,
        ),
        _gap,
        const BOHBanner(
          'Your email and phone stay private.',
          tone: BOHBannerTone.privacy,
        ),
        _gap,
        const BOHInfoNote(
          'Verification is never granted by points or payments.',
        ),
        _gap,
        const BOHBanner(
          'Safety is not a line item. It is the show.',
          tone: BOHBannerTone.quote,
        ),
        _gap,
        BOHAlertCard(
          title: "Changes requested on 'Stage Manager'",
          message: 'Add the shift pattern and the required certifications.',
          action: BOHLinkButton(
            label: 'Edit listing',
            fontSize: 12,
            color: context.colors.statusWarning.foreground,
            onTap: () {},
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
    final c = context.colors;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _wrap([
          const BOHAvatar(
            name: 'Fatma Zaki',
            image: AppImage.asset(AppAssets.avatarMember),
            dimension: 34,
            ring: true,
          ),
          const BOHAvatar(
            name: 'Fatma Zaki',
            image: AppImage.asset(AppAssets.avatarMember),
            dimension: 72,
            ring: true,
          ),
          const BOHAvatar(name: 'Omar Haddad', dimension: 50, verified: true),
          const BOHAvatar(name: 'Lina Saad', dimension: 46),
          const BOHAvatar(name: 'فهد المطيري', dimension: 40),
          BOHAvatar(
            name: 'Fatma Zaki',
            dimension: 76,
            ring: true,
            badge: Container(
              width: 30,
              height: 30,
              decoration: BoxDecoration(
                color: c.primary,
                shape: BoxShape.circle,
              ),
              child: Icon(AppIcons.camera, size: 14, color: c.onPrimary),
            ),
          ),
        ]),
        _gap,
        _wrap(const [
          BOHCompanyLogo(
            name: 'Saudi Events Group',
            image: AppImage.asset(AppAssets.companyLogoSeg),
            size: 40,
          ),
          BOHCompanyLogo(name: 'Nexa Production', size: 52),
          BOHGlyph(BOHGlyphType.verified, size: 18),
          BOHGlyph(BOHGlyphType.star, size: 20),
          BOHGlyph(BOHGlyphType.bookmark, size: 20),
          BOHGlyph(BOHGlyphType.quote, size: 26),
          BOHLogo(),
        ]),
        _gap,
        Text(
          'Logo on photo',
          style: AppTypography.caption.copyWith(color: c.textSecondary),
        ),
        Container(
          padding: const EdgeInsets.all(AppSpacing.s12),
          decoration: const BoxDecoration(
            image: DecorationImage(
              image: AssetImage(AppAssets.concertCrowd),
              fit: BoxFit.cover,
            ),
          ),
          child: const Row(
            children: [
              BOHLogo(height: 44, onDark: true),
              Spacer(),
              BOHLanguageSwitch(onPhoto: true),
            ],
          ),
        ),
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
  int _company = 0;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Column(
      children: [
        BOHBottomNavigation(
          currentIndex: _index,
          onSelected: (i) => setState(() => _index = i),
          items: [
            BOHNavItem(icon: AppIcons.home, label: l10n.navHome),
            BOHNavItem(icon: AppIcons.discover, label: l10n.navDiscover),
            BOHNavItem(
              icon: AppIcons.news,
              label: l10n.navNews,
              showBadge: true,
            ),
            BOHNavItem(icon: AppIcons.rewards, label: l10n.navRewards),
            BOHNavItem(icon: AppIcons.profile, label: l10n.navProfile),
          ],
        ),
        _gap,
        BOHBottomNavigation(
          currentIndex: _company,
          compactLabels: true,
          onSelected: (i) => setState(() => _company = i),
          items: const [
            BOHNavItem(icon: AppIcons.dashboard, label: 'Dashboard'),
            BOHNavItem(icon: AppIcons.opportunities, label: 'Listings'),
            BOHNavItem(icon: AppIcons.handshake, label: 'Suppliers'),
            BOHNavItem(icon: AppIcons.news, label: 'News'),
            BOHNavItem(icon: AppIcons.companies, label: 'Profile'),
          ],
        ),
      ],
    );
  }
}

class _States extends StatelessWidget {
  const _States();

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        SizedBox(
          height: 460,
          child: BOHEmptyState(
            title: 'No results for "stage lighting"',
            message: 'Try a different word or remove a filter.',
            actionLabel: 'Clear filters',
            onAction: () {},
            extra: _wrap([
              BOHCategoryChip(
                label: 'Riyadh',
                selected: false,
                onSelected: () {},
              ),
              BOHCategoryChip(
                label: 'Workshops',
                selected: false,
                onSelected: () {},
              ),
            ]),
          ),
        ),
        const SizedBox(height: 300, child: BOHErrorState()),
        const SizedBox(height: 200, child: BOHLoadingState()),
      ],
    );
  }
}
