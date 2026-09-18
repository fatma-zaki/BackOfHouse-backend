import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/app_radii.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/l10n_messages.dart';
import '../../../../core/widgets/widgets.dart';
import '../../domain/rewards_models.dart';
import '../controllers/rewards_providers.dart';
import 'points_widgets.dart';
import 'rewards_labels.dart';

/// Confirm → redeem → show the code. Safe to call from any screen.
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

  await showBOHSheet<void>(
    context,
    builder: (_) => _SuccessSheet(redemption: result.value!),
  );
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

class _SuccessSheet extends StatelessWidget {
  const _SuccessSheet({required this.redemption});

  final Redemption redemption;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;

    return Column(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Center(
          child: Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: c.success.withValues(alpha: 0.12),
              shape: BoxShape.circle,
            ),
            child: Icon(AppIcons.success, size: 30, color: c.success),
          ),
        ),
        const SizedBox(height: AppSpacing.s16),
        Semantics(
          liveRegion: true,
          child: Text(
            l10n.redeemSuccessTitle,
            style: context.text.h2,
            textAlign: TextAlign.center,
          ),
        ),
        const SizedBox(height: AppSpacing.s8),
        Text(
          l10n.redeemSuccessBody,
          style: context.text.body,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: AppSpacing.s20),
        Container(
          padding: const EdgeInsetsDirectional.only(
            start: AppSpacing.s16,
            end: AppSpacing.s4,
          ),
          decoration: BoxDecoration(
            color: c.primaryWash,
            borderRadius: AppRadii.mediumAll,
            border: Border.all(color: c.primaryTint),
          ),
          child: Row(
            children: [
              Expanded(
                child: SelectableText(
                  redemption.code,
                  textDirection: TextDirection.ltr,
                  style: context.text.h3.copyWith(
                    color: c.primaryText,
                    letterSpacing: 1.5,
                  ),
                ),
              ),
              BOHIconButton(
                icon: AppIcons.copy,
                semanticLabel: l10n.actionCopyCode,
                color: c.primaryText,
                onPressed: () async {
                  await Clipboard.setData(ClipboardData(text: redemption.code));
                  if (!context.mounted) return;
                  ScaffoldMessenger.of(context)
                    ..hideCurrentSnackBar()
                    ..showSnackBar(SnackBar(content: Text(l10n.codeCopied)));
                },
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.s12),
        Text(
          l10n.pointsRemaining(redemption.remainingBalance),
          style: context.text.bodySmall,
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: AppSpacing.s24),
        BOHButton(
          label: l10n.actionDone,
          trailingIcon: null,
          onPressed: () => Navigator.of(context).pop(),
        ),
      ],
    );
  }
}
