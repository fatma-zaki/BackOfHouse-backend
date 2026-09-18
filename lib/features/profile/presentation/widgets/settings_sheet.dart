import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/theme_mode_controller.dart';
import '../../../../core/config/app_config.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';

Future<void> showSettingsSheet(BuildContext context) =>
    showBOHSheet<void>(context, builder: (_) => const _SettingsSheet());

class _SettingsSheet extends ConsumerWidget {
  const _SettingsSheet();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final mode = ref.watch(themeModeControllerProvider);

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(l10n.settingsTitle, style: context.text.h2),
        const SizedBox(height: AppSpacing.s20),
        Text(l10n.themeLabel, style: context.text.label),
        const SizedBox(height: AppSpacing.s8),
        BOHSegmentedControl<ThemeMode>(
          segments: [
            (ThemeMode.light, l10n.themeLight),
            (ThemeMode.dark, l10n.themeDark),
          ],
          selected: mode == ThemeMode.dark ? ThemeMode.dark : ThemeMode.light,
          onChanged: (m) =>
              ref.read(themeModeControllerProvider.notifier).setMode(m),
        ),
        const SizedBox(height: AppSpacing.s20),
        Row(
          children: [
            Expanded(
              child: Text(l10n.languageLabel, style: context.text.label),
            ),
            const BOHLanguageSwitch(),
          ],
        ),
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
