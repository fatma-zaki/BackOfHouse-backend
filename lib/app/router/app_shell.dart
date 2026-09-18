import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../core/constants/app_icons.dart';
import '../../core/extensions/context_extensions.dart';
import '../../core/l10n/generated/app_localizations.dart';
import '../../core/widgets/widgets.dart';
import '../../features/auth/domain/account_type.dart';
import '../../features/auth/presentation/controllers/auth_controller.dart';

/// Signed-in frame for both account types: branch content under the one
/// floating navigation bar.
///
/// Individual: Home · Discover · News · Rewards · Profile.
/// Company:    Dashboard · Discover · News · Profile — the Dashboard opens
/// the company's opportunities, supplier requests and portfolio.
class AppShell extends ConsumerWidget {
  const AppShell({super.key, required this.navigationShell});

  final StatefulNavigationShell navigationShell;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tabs = _tabsFor(ref.watch(sessionAccountTypeProvider), context.l10n);
    final current = tabs.indexWhere(
      (t) => t.branch == navigationShell.currentIndex,
    );

    return BOHScaffold(
      ambient: false,
      body: navigationShell,
      bottomNavigationBar: BOHBottomNavigation(
        currentIndex: current < 0 ? 0 : current,
        onSelected: (index) {
          final branch = tabs[index].branch;
          navigationShell.goBranch(
            branch,
            // Re-tapping the active tab returns it to its root.
            initialLocation: branch == navigationShell.currentIndex,
          );
        },
        items: [for (final t in tabs) t.item],
      ),
    );
  }
}

/// Branch order in the router's shell route.
abstract final class _Branch {
  static const home = 0;
  static const discover = 1;
  static const news = 2;
  static const rewards = 3;
  static const profile = 4;
}

typedef _Tab = ({int branch, BOHNavItem item});

List<_Tab> _tabsFor(AccountType account, AppLocalizations l10n) =>
    switch (account) {
      AccountType.individual => [
        (
          branch: _Branch.home,
          item: BOHNavItem(icon: AppIcons.home, label: l10n.navHome),
        ),
        (
          branch: _Branch.discover,
          item: BOHNavItem(icon: AppIcons.discover, label: l10n.navDiscover),
        ),
        (
          branch: _Branch.news,
          item: BOHNavItem(icon: AppIcons.news, label: l10n.navNews),
        ),
        (
          branch: _Branch.rewards,
          item: BOHNavItem(icon: AppIcons.rewards, label: l10n.navRewards),
        ),
        (
          branch: _Branch.profile,
          item: BOHNavItem(icon: AppIcons.profile, label: l10n.navProfile),
        ),
      ],
      AccountType.company => [
        (
          branch: _Branch.home,
          item: BOHNavItem(
            icon: AppIcons.home,
            label: l10n.companyNavDashboard,
          ),
        ),
        (
          branch: _Branch.discover,
          item: BOHNavItem(icon: AppIcons.discover, label: l10n.navDiscover),
        ),
        (
          branch: _Branch.news,
          item: BOHNavItem(icon: AppIcons.news, label: l10n.navNews),
        ),
        (
          branch: _Branch.profile,
          item: BOHNavItem(icon: AppIcons.companies, label: l10n.navProfile),
        ),
      ],
    };
