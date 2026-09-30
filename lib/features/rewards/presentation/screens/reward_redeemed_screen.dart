import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/l10n_messages.dart';
import '../../../../core/utils/date_formats.dart';
import '../../../../core/widgets/widgets.dart';
import '../../domain/rewards_models.dart';
import '../controllers/rewards_providers.dart';
import '../widgets/rewards_labels.dart';

/// Shown right after a redemption: the coupon, its code, how to use it and
/// the new balance. Reads the redemption just made; reached any other way
/// it sends the member back to the reward.
class RewardRedeemedScreen extends ConsumerWidget {
  const RewardRedeemedScreen({super.key, required this.rewardId});

  final String rewardId;

  void _close(BuildContext context) =>
      context.canPop() ? context.pop() : context.go(AppRoutes.reward(rewardId));

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final redemption = ref.watch(redeemControllerProvider)?.value;

    return BOHScaffold(
      appBar: BOHAppBar(
        title: l10n.redeemedTitle,
        onBack: () => _close(context),
      ),
      bottomNavigationBar: BOHActionBar(
        child: BOHButton(
          label: l10n.actionDone,
          size: BOHButtonSize.large,
          trailingIcon: null,
          onPressed: () => _close(context),
        ),
      ),
      body: redemption == null || redemption.reward.id != rewardId
          ? BOHEmptyState(
              icon: AppIcons.rewards,
              title: l10n.redeemSuccessTitle,
              message: l10n.redeemSuccessBody,
            )
          : _Body(redemption: redemption),
    );
  }
}

class _Body extends StatelessWidget {
  const _Body({required this.redemption});

  final Redemption redemption;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    final text = context.text;
    final reward = redemption.reward;
    final before = redemption.remainingBalance + reward.cost;

    return ListView(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.formHorizontal,
        AppSpacing.s8,
        AppSpacing.formHorizontal,
        AppSpacing.s24,
      ),
      children: [
        BOHTicketCard(
          image: reward.image,
          imageHeight: 130,
          imageOverlay: BOHPhotoBadge(
            label: l10n.redeemedBadge,
            icon: AppIcons.check,
          ),
          body: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              BOHEyebrow(reward.category.label(l10n)),
              const SizedBox(height: AppSpacing.s4),
              Text(reward.title, style: text.h3),
              const SizedBox(height: AppSpacing.s2),
              Text(
                l10n.redeemedFor(l10n.formatCount(reward.cost)),
                style: text.bodySmall,
              ),
            ],
          ),
          footer: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(l10n.redeemedYourCode, style: text.labelMedium),
              const SizedBox(height: AppSpacing.s8),
              Semantics(
                liveRegion: true,
                child: BOHCodeBox(
                  code: redemption.code,
                  copyLabel: l10n.actionCopy,
                  onCopied: () => ScaffoldMessenger.of(context)
                    ..hideCurrentSnackBar()
                    ..showSnackBar(SnackBar(content: Text(l10n.codeCopied))),
                ),
              ),
            ],
          ),
        ),
        if (reward.steps.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.s20),
          BOHSectionHeader(
            title: l10n.redeemedHowToUse,
            size: BOHSectionSize.sub,
          ),
          for (final (i, step) in reward.steps.indexed) ...[
            if (i > 0) const SizedBox(height: AppSpacing.s10),
            BOHNumberedStep(number: i + 1, text: step),
          ],
        ],
        const SizedBox(height: AppSpacing.s20),
        BOHCard(
          child: MergeSemantics(
            child: Row(
              children: [
                Expanded(child: Text(l10n.redeemedBalance, style: text.label)),
                Text(
                  AppDateFormats.ltr(l10n.formatCount(before)),
                  style: text
                      .number(14, color: c.textSecondary)
                      .copyWith(decoration: TextDecoration.lineThrough),
                ),
                const SizedBox(width: AppSpacing.s8),
                Icon(AppIcons.arrowForward, size: 16, color: c.textSecondary),
                const SizedBox(width: AppSpacing.s8),
                Text(
                  AppDateFormats.ltr(
                    l10n.formatCount(redemption.remainingBalance),
                  ),
                  style: text.number(18, color: c.primaryText),
                ),
                const SizedBox(width: AppSpacing.s4),
                Text(l10n.redeemedPts, style: text.caption),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
