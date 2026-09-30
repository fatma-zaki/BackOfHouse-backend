import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/theme_mode_controller.dart';
import '../../../../core/config/app_config.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/locale_controller.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';

Future<void> showSettingsSheet(BuildContext context) =>
    showBOHSheet<void>(context, builder: (_) => const _SettingsSheet());

/// Appearance and Language as a grouped card of rows, each with a violet
/// segmented choice. Shared by both profiles and the settings sheet.
class DisplaySettingsCard extends ConsumerWidget {
  const DisplaySettingsCard({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final mode = ref.watch(themeModeControllerProvider);
    final language = Localizations.localeOf(context).languageCode;

    Widget row(IconData icon, String label, Widget control) => Padding(
      padding: const EdgeInsets.symmetric(horizontal: AppSpacing.s14),
      child: Row(
        children: [
          Icon(icon, size: 18, color: context.colors.primary),
          const SizedBox(width: AppSpacing.s10),
          Expanded(child: Text(label, style: context.text.label)),
          control,
        ],
      ),
    );

    return BOHGroupedList(
      flat: true,
      children: [
        row(
          AppIcons.appearance,
          l10n.themeLabel,
          BOHSegmentedControl<ThemeMode>(
            style: BOHSegmentedStyle.radio,
            segments: [
              (ThemeMode.light, l10n.themeLight),
              (ThemeMode.dark, l10n.themeDark),
            ],
            selected: mode == ThemeMode.dark ? ThemeMode.dark : ThemeMode.light,
            onChanged: (m) =>
                ref.read(themeModeControllerProvider.notifier).setMode(m),
          ),
        ),
        row(
          AppIcons.globe,
          l10n.languageLabel,
          BOHSegmentedControl<String>(
            style: BOHSegmentedStyle.radio,
            // Each language is named in its own script.
            segments: [
              ('en', l10n.languageEnglish),
              ('ar', l10n.languageArabic),
            ],
            selected: language,
            onChanged: (code) => ref
                .read(localeControllerProvider.notifier)
                .setLocale(Locale(code)),
          ),
        ),
      ],
    );
  }
}

class _SettingsSheet extends ConsumerWidget {
  const _SettingsSheet();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(l10n.settingsTitle, style: context.text.h2),
        const SizedBox(height: AppSpacing.s16),
        const DisplaySettingsCard(),
        const SizedBox(height: AppSpacing.s20),
        if (!AppConfig.environment.isProd) ...[
          // Developer tooling; not shown in production builds.
          BOHButton(
            label: 'Design system',
            variant: BOHButtonVariant.secondary,
            trailingIcon: null,
            onPressed: () {
              Navigator.of(context).pop();
              context.push(AppRoutes.designSystem);
            },
          ),
          const SizedBox(height: AppSpacing.s12),
        ],
        BOHButton(
          label: l10n.actionSignOut,
          variant: BOHButtonVariant.ghost,
          leadingIcon: AppIcons.logOut,
          trailingIcon: null,
          onPressed: () {
            Navigator.of(context).pop();
            ref.read(authControllerProvider.notifier).logout();
          },
        ),
      ],
    );
  }
}
