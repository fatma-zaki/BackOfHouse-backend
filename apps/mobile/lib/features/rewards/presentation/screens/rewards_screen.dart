import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_radii.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../profile/data/profile_data.dart';
import '../../domain/rewards_models.dart';
import '../controllers/rewards_providers.dart';
import '../widgets/points_widgets.dart';
import '../widgets/redeem_flow.dart';
import '../widgets/rewards_labels.dart';

/// Rewards: points to spend, the Profile Highlight offer and the catalog.
class RewardsScreen extends ConsumerStatefulWidget {
  const RewardsScreen({super.key});

  @override
  ConsumerState<RewardsScreen> createState() => _RewardsScreenState();
}

class _RewardsScreenState extends ConsumerState<RewardsScreen> {
  RewardCategory? _category;

  RewardsQuery get _key => (category: _category, query: '');

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final summary = ref.watch(pointsSummaryProvider).value;
    final rewards = ref.watch(rewardsProvider(_key));
    // The highlight offer comes from the full catalog, whatever the filter.
    final all = ref.watch(rewardsProvider((category: null, query: ''))).value;
    final highlight = all
        ?.where((r) => r.kind == RewardKind.highlight && r.available)
        .firstOrNull;
    final profile = ref.watch(myProfileProvider).value;
    final balance = summary?.balance ?? 0;

    return BOHScaffold(
      appBar: BOHAppBar.tab(
        title: l10n.rewardsTitle,
        actions: [
          BOHLinkButton(
            label: l10n.rewardsHistory,
            icon: AppIcons.clock,
            onTap: () => context.push(AppRoutes.myPoints),
          ),
          const SizedBox(width: AppSpacing.s4),
        ],
      ),
      body: BOHRefresh(
        onRefresh: () async {
          ref
            ..invalidate(pointsSummaryProvider)
            ..invalidate(rewardsProvider(_key));
          await ref.read(rewardsProvider(_key).future);
        },
        child: CustomScrollView(
          slivers: [
            BOHSliverPadding(
              top: AppSpacing.s8,
              sliver: SliverList.list(
                children: [
                  if (summary == null)
                    const BOHShimmer(
                      child: BOHSkeleton(
                        height: 150,
                        borderRadius: AppRadii.heroAll,
                      ),
                    )
                  else
                    PointsHeroCard(
                      summary: summary,
                      onTap: () => context.push(AppRoutes.myPoints),
                    ),
                  if (highlight != null) ...[
                    const SizedBox(height: AppSpacing.s14),
                    HighlightOfferCard(
                      reward: highlight,
                      avatar: BOHAvatar(
                        name: profile?.name ?? '',
                        image: profile?.avatar,
                        dimension: 48,
                        ring: true,
                        ringGap: context.colors.surface,
                      ),
                      onRedeem: () => startRedeemFlow(context, ref, highlight),
                    ),
                  ],
                  const SizedBox(height: AppSpacing.s16),
                  BOHSectionHeader(title: l10n.rewardsCatalog),
                ],
              ),
            ),
            SliverToBoxAdapter(
              child: BOHFilterChips<RewardCategory?>(
                options: [null, ...RewardCategory.values],
                selected: _category,
                label: (c) => c?.label(l10n) ?? l10n.filterAll,
                padding: const EdgeInsetsDirectional.fromSTEB(
                  AppSpacing.screenHorizontal,
                  AppSpacing.s4,
                  AppSpacing.screenHorizontal,
                  AppSpacing.s8,
                ),
                onSelected: (c) => setState(() => _category = c),
              ),
            ),
            BOHSliverPadding(
              sliver: switch (rewards) {
                AsyncData(:final value) when value.isEmpty =>
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: BOHEmptyState(
                      icon: AppIcons.rewards,
                      title: l10n.rewardsEmptyTitle,
                      message: l10n.rewardsEmptyMessage,
                    ),
                  ),
                AsyncData(:final value) => SliverGrid.builder(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: AppSpacing.s12,
                    mainAxisSpacing: AppSpacing.s12,
                    mainAxisExtent: 166,
                  ),
                  itemCount: value.length,
                  itemBuilder: (context, i) => BOHFadeSlide(
                    delay: BOHFadeSlide.stagger(i),
                    child: RewardCard(
                      reward: value[i],
                      affordable: value[i].cost <= balance,
                      onTap: () => context.push(AppRoutes.reward(value[i].id)),
                    ),
                  ),
                ),
                AsyncError(:final error) => SliverFillRemaining(
                  hasScrollBody: false,
                  child: BOHErrorState(
                    error: error,
                    onRetry: () => ref.invalidate(rewardsProvider(_key)),
                  ),
                ),
                _ => const SliverToBoxAdapter(child: RewardListSkeleton()),
              },
            ),
            const BOHSliverBottomSpacer(),
          ],
        ),
      ),
    );
  }
}

/// Loading placeholder for the catalog grid.
class RewardListSkeleton extends StatelessWidget {
  const RewardListSkeleton({super.key});

  @override
  Widget build(BuildContext context) {
    Widget tile() => const Expanded(
      child: BOHSkeleton(height: 158, borderRadius: AppRadii.listCardAll),
    );
    return BOHShimmer(
      child: Column(
        children: [
          for (var i = 0; i < 2; i++) ...[
            if (i > 0) const SizedBox(height: AppSpacing.s12),
            Row(
              children: [
                tile(),
                const SizedBox(width: AppSpacing.s12),
                tile(),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
