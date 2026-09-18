import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_radii.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/widgets/widgets.dart';
import '../../domain/rewards_models.dart';
import 'rewards_labels.dart';

/// Plum hero card with the points balance.
///
/// * [PointsHeroCard.progress] — Home: balance, progress to the next
///   benefit and a hint line.
/// * [PointsHeroCard.total] — My Points: balance and this month's gain.
class PointsHeroCard extends StatelessWidget {
  const PointsHeroCard.progress({super.key, required this.summary, this.onTap})
    : _showProgress = true;

  const PointsHeroCard.total({super.key, required this.summary})
    : _showProgress = false,
      onTap = null;

  final PointsSummary summary;
  final VoidCallback? onTap;
  final bool _showProgress;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final l10n = context.l10n;
    const ink = AppColors.onPhoto;
    final muted = ink.withValues(alpha: 0.8);

    final card = Container(
      padding: const EdgeInsets.all(AppSpacing.s20),
      decoration: BoxDecoration(
        borderRadius: AppRadii.largeAll,
        gradient: LinearGradient(
          begin: AlignmentDirectional.topStart,
          end: AlignmentDirectional.bottomEnd,
          colors: [c.heroStart, c.heroEnd],
        ),
      ),
      child: Stack(
        children: [
          Positioned.fill(
            child: CustomPaint(painter: _WavePainter(rtl: context.isRtl)),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  const BOHIconCircle(
                    icon: AppIcons.points,
                    size: 52,
                    tone: BOHIconCircleTone.onHero,
                  ),
                  const SizedBox(width: AppSpacing.s16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _showProgress
                              ? (context.isArabic
                                    ? l10n.pointsYourPoints
                                    : l10n.pointsYourPoints.toUpperCase())
                              : l10n.pointsTotal,
                          style: AppTypography.label.copyWith(color: muted),
                        ),
                        const SizedBox(height: AppSpacing.s4),
                        Text.rich(
                          TextSpan(
                            children: [
                              TextSpan(
                                text: '${summary.balance}',
                                style: AppTypography.display.copyWith(
                                  color: ink,
                                  fontSize: 40,
                                  height: 1.1,
                                ),
                              ),
                              TextSpan(
                                text: '  ${l10n.pointsUnit}',
                                style: AppTypography.bodyLarge.copyWith(
                                  color: ink,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  if (onTap != null)
                    const Icon(
                      AppIcons.chevronForward,
                      color: ink,
                      size: AppSizes.iconMedium,
                    ),
                ],
              ),
              if (_showProgress) ...[
                const SizedBox(height: AppSpacing.s20),
                BOHProgressBar(
                  value: summary.balance / summary.nextBenefitAt,
                  color: c.heroAccent,
                  trackColor: const Color(0x33FFFFFF),
                  semanticLabel: l10n.pointsOfTarget(
                    '${summary.balance}',
                    '${summary.nextBenefitAt}',
                  ),
                ),
                const SizedBox(height: AppSpacing.s8),
                Align(
                  alignment: AlignmentDirectional.centerEnd,
                  child: Text(
                    '${summary.balance} / ${summary.nextBenefitAt}',
                    style: AppTypography.bodySmall.copyWith(color: muted),
                  ),
                ),
                const SizedBox(height: AppSpacing.s12),
                Row(
                  children: [
                    Icon(
                      AppIcons.rewards,
                      size: AppSizes.iconSmall,
                      color: c.heroAccent,
                    ),
                    const SizedBox(width: AppSpacing.s8),
                    Expanded(
                      child: Text(
                        l10n.pointsUntilBenefit(summary.pointsToNextBenefit),
                        style: AppTypography.bodySmall.copyWith(color: ink),
                      ),
                    ),
                  ],
                ),
              ] else ...[
                const SizedBox(height: AppSpacing.s12),
                Align(
                  alignment: AlignmentDirectional.centerEnd,
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        AppIcons.trendingUp,
                        size: AppSizes.iconSmall,
                        color: c.heroAccent,
                      ),
                      const SizedBox(width: AppSpacing.s4),
                      Text(
                        l10n.pointsThisMonth(summary.earnedThisMonth),
                        style: AppTypography.bodySmall.copyWith(color: ink),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );

    if (onTap == null) return card;
    return BOHPressable(onTap: onTap, child: card);
  }
}

/// Soft diagonal light across the hero card.
class _WavePainter extends CustomPainter {
  const _WavePainter({required this.rtl});

  final bool rtl;

  @override
  void paint(Canvas canvas, Size size) {
    if (rtl) {
      canvas
        ..translate(size.width, 0)
        ..scale(-1, 1);
    }
    final w = size.width;
    final h = size.height;
    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1
      ..color = const Color(0x1FFFFFFF);
    for (var i = 0; i < 3; i++) {
      final path = Path()
        ..moveTo(w * (0.45 + i * 0.12), -AppSpacing.s20)
        ..quadraticBezierTo(
          w * (0.7 + i * 0.1),
          h * 0.5,
          w * (0.6 + i * 0.16),
          h + AppSpacing.s20,
        );
      canvas.drawPath(path, paint);
    }
  }

  @override
  bool shouldRepaint(_WavePainter oldDelegate) => oldDelegate.rtl != rtl;
}

/// "Your member level · Active Member" with optional progress.
class MemberLevelCard extends StatelessWidget {
  const MemberLevelCard({
    super.key,
    required this.summary,
    this.showProgress = false,
    this.onTap,
  });

  final PointsSummary summary;
  final bool showProgress;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;

    return BOHCard(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const BOHIconCircle(icon: AppIcons.level),
              const SizedBox(width: AppSpacing.s16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(l10n.memberLevelLabel, style: context.text.caption),
                    const SizedBox(height: 2),
                    Text(
                      summary.level.label(l10n),
                      style: context.text.cardTitle,
                    ),
                  ],
                ),
              ),
              if (onTap != null)
                Icon(
                  AppIcons.chevronForward,
                  size: AppSizes.iconMedium,
                  color: c.textMuted,
                ),
            ],
          ),
          if (showProgress) ...[
            const SizedBox(height: AppSpacing.s16),
            BOHProgressBar(
              value: summary.levelProgress,
              semanticLabel: l10n.pointsOfTarget(
                '${summary.balance}',
                '${summary.levelTarget}',
              ),
            ),
            const SizedBox(height: AppSpacing.s8),
            Align(
              alignment: AlignmentDirectional.centerEnd,
              child: Text(
                '${summary.balance} / ${summary.levelTarget}',
                style: context.text.bodySmall,
              ),
            ),
            const SizedBox(height: AppSpacing.s8),
            Row(
              children: [
                Icon(
                  AppIcons.info,
                  size: AppSizes.iconSmall,
                  color: c.textMuted,
                ),
                const SizedBox(width: AppSpacing.s8),
                Expanded(
                  child: Text(
                    l10n.pointsToNextLevel(summary.pointsToNextLevel),
                    style: context.text.bodySmall,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}

/// Coin + "100 points".
class PointsCost extends StatelessWidget {
  const PointsCost(this.points, {super.key, this.large = false});

  final int points;
  final bool large;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Icon(
          AppIcons.points,
          size: large ? AppSizes.iconMedium : AppSizes.iconSmall,
          color: c.gold,
        ),
        const SizedBox(width: AppSpacing.s4),
        Flexible(
          child: Text(
            context.l10n.pointsAmount(points),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: (large ? context.text.bodyLarge : context.text.bodySmall)
                .copyWith(color: c.gold, fontWeight: FontWeight.w600),
          ),
        ),
      ],
    );
  }
}

/// Reward row: icon, title, cost and a Redeem action (or "Coming soon").
class RewardCard extends StatelessWidget {
  const RewardCard({
    super.key,
    required this.reward,
    required this.onTap,
    required this.onRedeem,
  });

  final Reward reward;
  final VoidCallback onTap;

  /// `null` hides the action (e.g. balance too low is shown on details).
  final VoidCallback? onRedeem;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;

    return BOHCard(
      onTap: onTap,
      semanticLabel: '${reward.title}. ${l10n.pointsAmount(reward.cost)}',
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          BOHIconCircle(icon: reward.kind.icon, size: 52),
          const SizedBox(width: AppSpacing.s16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        reward.title,
                        style: context.text.cardTitle,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                    Icon(
                      AppIcons.chevronForward,
                      size: AppSizes.iconMedium,
                      color: c.textMuted,
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.s8),
                Row(
                  children: [
                    // The cost yields space first so the action never clips.
                    Expanded(
                      child: Align(
                        alignment: AlignmentDirectional.centerStart,
                        child: PointsCost(reward.cost),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.s8),
                    if (!reward.available)
                      BOHTag(
                        l10n.comingSoonTitle,
                        variant: BOHTagVariant.outline,
                      )
                    else if (onRedeem != null)
                      BOHButton(
                        label: l10n.actionRedeem,
                        size: BOHButtonSize.small,
                        shape: BOHButtonShape.pill,
                        trailingIcon: null,
                        expand: false,
                        onPressed: onRedeem,
                      ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
