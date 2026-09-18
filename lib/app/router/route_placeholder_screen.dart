import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/config/app_config.dart';
import '../../core/constants/app_icons.dart';
import '../../core/extensions/context_extensions.dart';
import '../../core/l10n/generated/app_localizations.dart';
import '../../core/widgets/widgets.dart';
import '../../features/auth/presentation/controllers/auth_controller.dart';
import '../theme/app_spacing.dart';
import '../theme/theme_mode_controller.dart';
import 'app_routes.dart';

typedef TitleBuilder = String Function(AppLocalizations l10n);

/// Stand-in for routes whose feature screens are not built yet.
class RoutePlaceholderScreen extends ConsumerWidget {
  const RoutePlaceholderScreen({
    super.key,
    required this.title,
    this.icon = AppIcons.comingSoon,
    this.brandAppBar = false,
    this.showBack,
    this.showAccountActions = false,
  });

  final TitleBuilder title;
  final IconData icon;
  final bool brandAppBar;
  final bool? showBack;

  /// Language, appearance and sign out, until the profile screen exists.
  final bool showAccountActions;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final themeMode = ref.watch(themeModeControllerProvider);

    return BOHScaffold(
      appBar: brandAppBar
          ? BOHAppBar.brand(
              actions: [
                BOHIconButton(
                  icon: AppIcons.notifications,
                  semanticLabel: l10n.notificationsLabel,
                  onPressed: () => context.go(AppRoutes.notifications),
                ),
              ],
            )
          : BOHAppBar(title: title(l10n), showBack: showBack),
      body: ListView(
        padding: BOHScaffold.screenPadding.add(
          const EdgeInsets.symmetric(vertical: AppSpacing.s24),
        ),
        children: [
          SizedBox(
            height: 340,
            child: BOHEmptyState(
              icon: icon,
              title: l10n.comingSoonTitle,
              message: l10n.comingSoonMessage,
            ),
          ),
          if (showAccountActions) ...[
            BOHSectionHeader(title: l10n.themeLabel),
            const SizedBox(height: AppSpacing.s8),
            Wrap(
              spacing: AppSpacing.s8,
              children: [
                for (final (mode, label) in [
                  (ThemeMode.light, l10n.themeLight),
                  (ThemeMode.dark, l10n.themeDark),
                ])
                  BOHCategoryChip(
                    label: label,
                    selected: themeMode == mode,
                    onSelected: () => ref
                        .read(themeModeControllerProvider.notifier)
                        .setMode(mode),
                  ),
              ],
            ),
            const SizedBox(height: AppSpacing.s16),
            BOHSectionHeader(title: l10n.languageLabel),
            const Align(
              alignment: AlignmentDirectional.centerStart,
              child: BOHLanguageSwitch(),
            ),
            const SizedBox(height: AppSpacing.s32),
            if (!AppConfig.environment.isProd) ...[
              // Developer tooling; not shown in production builds.
              BOHButton(
                label: 'Design system',
                variant: BOHButtonVariant.secondary,
                onPressed: () => context.push(AppRoutes.designSystem),
              ),
              const SizedBox(height: AppSpacing.s12),
            ],
            BOHButton(
              label: l10n.actionSignOut,
              variant: BOHButtonVariant.ghost,
              leadingIcon: AppIcons.logOut,
              trailingIcon: null,
              onPressed: () =>
                  ref.read(authControllerProvider.notifier).logout(),
            ),
          ],
        ],
      ),
    );
  }
}
