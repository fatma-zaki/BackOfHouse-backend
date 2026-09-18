import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/app_radii.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/widgets/widgets.dart';
import '../../domain/rewards_models.dart';
import '../controllers/rewards_providers.dart';
import '../widgets/points_widgets.dart';
import '../widgets/redeem_flow.dart';
import '../widgets/rewards_labels.dart';

class RewardDetailsScreen extends ConsumerWidget {
  const RewardDetailsScreen({super.key, required this.rewardId});

  final String rewardId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final reward = ref.watch(rewardProvider(rewardId));
    final balance = ref.watch(pointsSummaryProvider).value?.balance;
    final redeeming = ref.watch(redeemControllerProvider)?.isLoading ?? false;

    return BOHScaffold(
      appBar: BOHAppBar(title: l10n.rewardDetailsTitle),
      body: switch (reward) {
        AsyncData(:final value) => _Body(
          reward: value,
          balance: balance,
          redeeming: redeeming,
          onRedeem: () => startRedeemFlow(context, ref, value),
        ),
        AsyncError(:final error) => BOHErrorState(
          error: error,
          onRetry: () => ref.invalidate(rewardProvider(rewardId)),
        ),
        _ => const BOHLoadingState(),
      },
    );
  }
}

class _Body extends StatelessWidget {
  const _Body({
    required this.reward,
    required this.balance,
    required this.redeeming,
    required this.onRedeem,
  });

  final Reward reward;
  final int? balance;
  final bool redeeming;
  final VoidCallback onRedeem;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    final shortfall = balance == null ? 0 : reward.cost - balance!;
    final canRedeem = reward.available && balance != null && shortfall <= 0;

    return Column(
      children: [
        Expanded(
          child: ListView(
            padding: BOHScaffold.screenPadding.add(
              const EdgeInsets.only(top: AppSpacing.s8, bottom: AppSpacing.s24),
            ),
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  BOHImage(
                    image: reward.image,
                    height: 150,
                    width: double.infinity,
                    borderRadius: AppRadii.largeAll,
                  ),
                  PositionedDirectional(
                    start: AppSpacing.s16,
                    bottom: -36,
                    child: Container(
                      padding: const EdgeInsets.all(AppSpacing.s4),
                      decoration: BoxDecoration(
                        color: c.background,
                        shape: BoxShape.circle,
                      ),
                      child: BOHIconCircle(icon: reward.kind.icon, size: 72),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.s48),
              Semantics(
                header: true,
                child: Text(reward.title, style: context.text.h1),
              ),
              const SizedBox(height: AppSpacing.s12),
              Align(
                alignment: AlignmentDirectional.centerStart,
                child: PointsCost(reward.cost, large: true),
              ),
              const SizedBox(height: AppSpacing.s16),
              Text(reward.description, style: context.text.bodyLarge),
              const SizedBox(height: AppSpacing.s24),
              const BOHDivider(),
              const SizedBox(height: AppSpacing.s24),
              Text(l10n.rewardWhatYouGet, style: context.text.h3),
              const SizedBox(height: AppSpacing.s12),
              for (final benefit in reward.benefits)
                Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.s12),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Icon(
                        AppIcons.check,
                        size: AppSizes.iconMedium,
                        color: c.primary,
                      ),
                      const SizedBox(width: AppSpacing.s12),
                      Expanded(child: Text(benefit, style: context.text.body)),
                    ],
                  ),
                ),
              const SizedBox(height: AppSpacing.s12),
              const BOHDivider(),
              const SizedBox(height: AppSpacing.s24),
              Text(l10n.rewardHowToRedeem, style: context.text.h3),
              const SizedBox(height: AppSpacing.s12),
              for (var i = 0; i < reward.steps.length; i++)
                Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.s12),
                  child: Row(
                    children: [
                      Container(
                        width: 28,
                        height: 28,
                        alignment: Alignment.center,
                        decoration: BoxDecoration(
                          color: c.primary,
                          shape: BoxShape.circle,
                        ),
                        child: Text(
                          '${i + 1}',
                          style: context.text.label.copyWith(
                            color: c.onPrimary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                      const SizedBox(width: AppSpacing.s12),
                      Expanded(
                        child: Text(reward.steps[i], style: context.text.body),
                      ),
                    ],
                  ),
                ),
              const SizedBox(height: AppSpacing.s12),
              BOHInfoNote(reward.note),
            ],
          ),
        ),
        // Sticky action above the floating navigation.
        Padding(
          padding: BOHScaffold.screenPadding.add(
            EdgeInsets.only(
              top: AppSpacing.s8,
              bottom: MediaQuery.paddingOf(context).bottom + AppSpacing.s12,
            ),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (reward.available && shortfall > 0) ...[
                Text(
                  l10n.rewardNeedMorePoints(shortfall),
                  style: context.text.bodySmall,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: AppSpacing.s8),
              ],
              BOHButton(
                label: reward.available
                    ? l10n.rewardRedeemFor(reward.cost)
                    : l10n.comingSoonTitle,
                trailingIcon: null,
                isLoading: redeeming,
                onPressed: canRedeem ? onRedeem : null,
              ),
            ],
          ),
        ),
      ],
    );
  }
}
