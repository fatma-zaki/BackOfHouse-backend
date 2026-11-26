import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/l10n_messages.dart';
import '../../../../core/widgets/widgets.dart';
import '../../domain/rewards_models.dart';
import '../controllers/rewards_providers.dart';
import 'points_widgets.dart';
import 'rewards_labels.dart';

/// Confirm → redeem → the redeemed screen with the code. Safe to call from any screen.
Future<void> startRedeemFlow(
  BuildContext context,
  WidgetRef ref,
  Reward reward,
) async {
  final confirmed = await showBOHSheet<bool>(
    context,
    builder: (_) => _ConfirmSheet(reward: reward),
  );
  if (confirmed != true || !context.mounted) return;

  final result = await ref
      .read(redeemControllerProvider.notifier)
      .redeem(reward.id);
  if (!context.mounted) return;

  if (result.hasError) {
    ScaffoldMessenger.of(context)
      ..hideCurrentSnackBar()
      ..showSnackBar(
        SnackBar(content: Text(context.l10n.error(result.error!))),
      );
    return;
  }

  await context.push<void>(AppRoutes.rewardRedeemed(reward.id));
}

class _ConfirmSheet extends StatelessWidget {
  const _ConfirmSheet({required this.reward});

  final Reward reward;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Center(child: BOHIconCircle(icon: reward.kind.icon, size: 64)),
        const SizedBox(height: AppSpacing.s16),
        Text(
          l10n.redeemConfirmTitle,
          style: context.text.h2,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: AppSpacing.s8),
        Text(
          reward.title,
          style: context.text.bodyLarge,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: AppSpacing.s12),
        Center(child: PointsCost(reward.cost, large: true)),
        const SizedBox(height: AppSpacing.s24),
        BOHButton(
          label: l10n.rewardRedeemFor(reward.cost),
          trailingIcon: null,
          onPressed: () => Navigator.of(context).pop(true),
        ),
        const SizedBox(height: AppSpacing.s8),
        BOHButton(
          label: l10n.actionCancel,
          variant: BOHButtonVariant.text,
          onPressed: () => Navigator.of(context).pop(false),
        ),
      ],
    );
  }
}
