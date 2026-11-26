import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/widgets/widgets.dart';
import '../../domain/rewards_models.dart';
import '../controllers/rewards_providers.dart';
import '../widgets/points_widgets.dart';
import '../widgets/redeem_flow.dart';
import '../widgets/rewards_labels.dart';

/// A reward: what it is, what the member gets, how redeeming works, and the
/// redeem action (or how many points are still missing).
class RewardDetailsScreen extends ConsumerWidget {
  const RewardDetailsScreen({super.key, required this.rewardId});

  final String rewardId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final reward = ref.watch(rewardProvider(rewardId));
    final balance = ref.watch(pointsSummaryProvider).value?.balance;
    final redeeming = ref.watch(redeemControllerProvider)?.isLoading ?? false;

    return switch (reward) {
      AsyncData(:final value) => _Loaded(
        reward: value,
        balance: balance,
        redeeming: redeeming,
        onRedeem: () => startRedeemFlow(context, ref, value),
      ),
      AsyncError(:final error) => BOHScaffold(
        appBar: BOHAppBar(title: l10n.rewardDetailsTitle),
        body: BOHErrorState(
          error: error,
          onRetry: () => ref.invalidate(rewardProvider(rewardId)),
        ),
      ),
      _ => BOHScaffold(
        appBar: BOHAppBar(title: l10n.rewardDetailsTitle),
        body: const BOHLoadingState(),
      ),
    };
  }
}

class _Loaded extends StatelessWidget {
  const _Loaded({
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
    final text = context.text;
    final shortfall = balance == null ? 0 : reward.cost - balance!;
    final canRedeem = reward.available && balance != null && shortfall <= 0;

    return BOHScaffold(
      bottomNavigationBar: BOHActionBar(
        helper: reward.available && shortfall > 0
            ? l10n.rewardNeedMorePoints(shortfall)
            : null,
        child: BOHButton(
          label: reward.available
              ? l10n.rewardRedeemFor(reward.cost)
              : l10n.comingSoonTitle,
          size: BOHButtonSize.large,
          trailingIcon: null,
          isLoading: redeeming,
          onPressed: canRedeem ? onRedeem : null,
        ),
      ),
      body: BOHPhotoPage(
        image: reward.image,
        height: 250,
        leading: BOHIconButton(
          icon: AppIcons.arrowBack,
          semanticLabel: l10n.actionBack,
          variant: BOHIconButtonVariant.photo,
          onPressed: () => context.pop(),
        ),
        body: Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.screenHorizontal,
            AppSpacing.s20,
            AppSpacing.screenHorizontal,
            0,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              BOHEyebrow(reward.category.label(l10n)),
              const SizedBox(height: AppSpacing.s6),
              Semantics(
                header: true,
                child: Text(reward.title, style: text.h1),
              ),
              const SizedBox(height: AppSpacing.s10),
              PointsCost(reward.cost, large: true),
              const SizedBox(height: AppSpacing.s14),
              Text(reward.description, style: text.bodyLarge),
              if (reward.benefits.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.s20),
                BOHSectionHeader(
                  title: l10n.rewardWhatYouGet,
                  size: BOHSectionSize.sub,
                ),
                for (final (i, benefit) in reward.benefits.indexed) ...[
                  if (i > 0) const SizedBox(height: AppSpacing.s8),
                  BOHCheckBullet(benefit),
                ],
              ],
              if (reward.steps.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.s20),
                BOHSectionHeader(
                  title: l10n.rewardHowToRedeem,
                  size: BOHSectionSize.sub,
                ),
                for (final (i, step) in reward.steps.indexed) ...[
                  if (i > 0) const SizedBox(height: AppSpacing.s10),
                  BOHNumberedStep(number: i + 1, text: step),
                ],
              ],
              if (reward.note.isNotEmpty) ...[
                const SizedBox(height: AppSpacing.s20),
                BOHInfoNote(reward.note),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
