import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_radii.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/media/app_image.dart';
import '../../../../core/widgets/widgets.dart';
import '../../domain/rewards_models.dart';
import '../controllers/rewards_providers.dart';
import '../widgets/points_widgets.dart';
import '../widgets/redeem_flow.dart';
import '../widgets/rewards_labels.dart';

class RewardsScreen extends ConsumerStatefulWidget {
  const RewardsScreen({super.key});

  @override
  ConsumerState<RewardsScreen> createState() => _RewardsScreenState();
}

class _RewardsScreenState extends ConsumerState<RewardsScreen> {
  RewardCategory? _category;
  String _query = '';
  bool _searching = false;

  RewardsQuery get _key => (category: _category, query: _query);

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final rewards = ref.watch(rewardsProvider(_key));

    return BOHScaffold(
      appBar: BOHAppBar(
        title: l10n.rewardsTitle,
        showBack: false,
        actions: [
          BOHIconButton(
            icon: _searching ? AppIcons.close : AppIcons.search,
            semanticLabel: _searching
                ? l10n.actionClearSearch
                : l10n.actionSearch,
            onPressed: () => setState(() {
              _searching = !_searching;
              if (!_searching) _query = '';
            }),
          ),
        ],
      ),
      body: BOHRefresh(
        onRefresh: () => ref.refresh(rewardsProvider(_key).future),
        child: CustomScrollView(
          slivers: [
            BOHSliverPadding(
              top: AppSpacing.s8,
              sliver: SliverList.list(
                children: [
                  if (_searching) ...[
                    BOHSearchField(
                      autofocus: true,
                      hint: l10n.rewardsSearchHint,
                      onChanged: (q) => setState(() => _query = q),
                    ),
                    const SizedBox(height: AppSpacing.s16),
                  ],
                  const _HeroBanner(),
                  const SizedBox(height: AppSpacing.s20),
                ],
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 44,
                child: ListView(
                  scrollDirection: Axis.horizontal,
                  padding: BOHScaffold.screenPadding,
                  children: [
                    for (final category in <RewardCategory?>[
                      null,
                      ...RewardCategory.values,
                    ])
                      Padding(
                        padding: const EdgeInsetsDirectional.only(
                          end: AppSpacing.s8,
                        ),
                        child: BOHCategoryChip(
                          label: category?.label(l10n) ?? l10n.filterAll,
                          selected: _category == category,
                          onSelected: () =>
                              setState(() => _category = category),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            BOHSliverPadding(
              top: AppSpacing.s24,
              sliver: SliverToBoxAdapter(
                child: Text(l10n.availableRewards, style: context.text.h3),
              ),
            ),
            BOHSliverPadding(
              top: AppSpacing.s12,
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
                AsyncData(:final value) => SliverList.separated(
                  itemCount: value.length,
                  separatorBuilder: (_, _) =>
                      const SizedBox(height: AppSpacing.s12),
                  itemBuilder: (context, i) => BOHFadeSlide(
                    delay: BOHFadeSlide.stagger(i),
                    child: RewardCard(
                      reward: value[i],
                      onTap: () => context.push(AppRoutes.reward(value[i].id)),
                      onRedeem: () => startRedeemFlow(context, ref, value[i]),
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

/// Photo banner: "Use your points to unlock exclusive benefits".
class _HeroBanner extends StatelessWidget {
  const _HeroBanner();

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    return ClipRRect(
      borderRadius: AppRadii.largeAll,
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: AlignmentDirectional.centerStart,
            end: AlignmentDirectional.centerEnd,
            colors: [c.heroStart, c.heroEnd],
          ),
        ),
        child: Stack(
          children: [
            PositionedDirectional(
              top: 0,
              bottom: 0,
              end: 0,
              width: 160,
              child: ShaderMask(
                blendMode: BlendMode.dstIn,
                shaderCallback: (bounds) =>
                    const LinearGradient(
                      begin: AlignmentDirectional.centerStart,
                      end: AlignmentDirectional.centerEnd,
                      colors: [Color(0x00000000), Color(0xB3000000)],
                    ).createShader(
                      bounds,
                      textDirection: Directionality.of(context),
                    ),
                child: const BOHImage(image: AppImage.placeholder),
              ),
            ),
            Padding(
              padding: const EdgeInsetsDirectional.fromSTEB(
                AppSpacing.s20,
                AppSpacing.s20,
                AppSpacing.s64 + AppSpacing.s32,
                AppSpacing.s20,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    l10n.rewardsHeroTitle,
                    style: AppTypography.h3.copyWith(color: AppColors.onPhoto),
                  ),
                  const SizedBox(height: AppSpacing.s8),
                  Text(
                    l10n.rewardsHeroBody,
                    style: AppTypography.bodySmall.copyWith(
                      color: AppColors.onPhoto.withValues(alpha: 0.85),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Loading placeholder for a list of [RewardCard]s.
class RewardListSkeleton extends StatelessWidget {
  const RewardListSkeleton({super.key, this.count = 3});

  final int count;

  @override
  Widget build(BuildContext context) {
    return BOHShimmer(
      child: Column(
        children: [
          for (var i = 0; i < count; i++)
            const Padding(
              padding: EdgeInsets.only(bottom: AppSpacing.s12),
              child: Row(
                children: [
                  BOHSkeleton.circle(size: 52),
                  SizedBox(width: AppSpacing.s16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        BOHSkeleton.line(height: 14),
                        SizedBox(height: AppSpacing.s8),
                        BOHSkeleton.line(width: 120, height: 12),
                        SizedBox(height: AppSpacing.s16),
                      ],
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }
}
