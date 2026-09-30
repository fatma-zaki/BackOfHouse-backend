import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_radii.dart';
import '../../../../app/theme/app_shadows.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/l10n_messages.dart';
import '../../../../core/widgets/widgets.dart';
import '../../domain/rewards_models.dart';
import 'rewards_labels.dart';

/// "Level 3 · 250 pts to Level 4" — the numbered points level. A rewards
/// concept only; never verification.
String pointsLevelLine(BuildContext context, PointsSummary summary) {
  final l10n = context.l10n;
  final next = summary.level.next;
  return next == null
      ? l10n.pointsTopLevel
      : l10n.pointsToLevel(summary.pointsToNextLevel, next.number);
}

/// Violet points card: balance to spend, progress through the current
/// points level and the level line.
class PointsHeroCard extends StatelessWidget {
  const PointsHeroCard({super.key, required this.summary, this.onTap});

  final PointsSummary summary;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final l10n = context.l10n;
    final text = context.text;
    final soft = c.onPrimary.withValues(alpha: 0.85);

    final card = Container(
      clipBehavior: Clip.antiAlias,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: c.primary,
        borderRadius: AppRadii.heroAll,
        boxShadow: AppShadows.violet(c, blur: 30, dy: 12),
      ),
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          // Decorative ring, as in the design.
          PositionedDirectional(
            top: -58,
            end: -48,
            child: Container(
              width: 150,
              height: 150,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(
                  color: c.onPrimary.withValues(alpha: 0.08),
                  width: 22,
                ),
              ),
            ),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: c.onPrimary.withValues(alpha: 0.18),
                      shape: BoxShape.circle,
                    ),
                    alignment: Alignment.center,
                    child: BOHGlyph(
                      BOHGlyphType.star,
                      size: 22,
                      color: c.onPrimary,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.s12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          l10n.pointsToSpend,
                          style: text.labelMedium.copyWith(
                            color: soft,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Text(
                          l10n.formatCount(summary.balance),
                          style: text
                              .number(32, lineHeight: 38, color: c.onPrimary)
                              .copyWith(letterSpacing: -0.5),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.s14),
              BOHProgressBar(value: summary.levelProgress, onViolet: true),
              const SizedBox(height: AppSpacing.s8),
              Row(
                children: [
                  Text(
                    l10n.pointsLevel(summary.level.number),
                    style: text.labelMedium.copyWith(color: c.onPrimary),
                  ),
                  const Spacer(),
                  Flexible(
                    flex: 3,
                    child: Text(
                      pointsLevelLine(context, summary),
                      textAlign: TextAlign.end,
                      style: text.bodySmall.copyWith(color: soft),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );

    if (onTap == null) return card;
    return BOHPressable(onTap: onTap, child: card);
  }
}

/// "Your member level" card with progress — Points history.
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
    return BOHCard(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              const BOHIconCircle(
                icon: AppIcons.level,
                size: AppSizes.iconTile,
                rounded: true,
              ),
              const SizedBox(width: AppSpacing.s12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      l10n.pointsLevel(summary.level.number),
                      style: context.text.label,
                    ),
                    Text(
                      summary.level.label(l10n),
                      style: context.text.bodySmall,
                    ),
                  ],
                ),
              ),
            ],
          ),
          if (showProgress) ...[
            const SizedBox(height: AppSpacing.s12),
            BOHProgressBar(value: summary.levelProgress),
            const SizedBox(height: AppSpacing.s6),
            Text(
              pointsLevelLine(context, summary),
              style: context.text.bodySmall,
            ),
          ],
        ],
      ),
    );
  }
}

/// "500 pts" in violet (muted when the member cannot afford it).
class PointsCost extends StatelessWidget {
  const PointsCost(
    this.points, {
    super.key,
    this.large = false,
    this.affordable = true,
  });

  final int points;
  final bool large;
  final bool affordable;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final l10n = context.l10n;
    final ink = affordable ? c.primaryText : c.textSecondary;
    return Semantics(
      label: l10n.pointsAmount(points),
      excludeSemantics: true,
      child: Text.rich(
        TextSpan(
          children: [
            TextSpan(
              text: l10n.formatCount(points),
              style: context.text.number(large ? 20 : 15, color: ink),
            ),
            TextSpan(
              text: ' ${l10n.pointsShortUnit}',
              style: context.text.caption.copyWith(color: ink),
            ),
          ],
        ),
      ),
    );
  }
}

/// Category label colour for reward tiles.
Color rewardCategoryColor(AppColors c, RewardCategory category) =>
    switch (category) {
      RewardCategory.learn => c.statusViolet.foreground,
      RewardCategory.attend => c.statusSuccess.foreground,
      RewardCategory.career => c.statusWarning.foreground,
      RewardCategory.community => c.statusInfo.foreground,
    };

/// Catalog tile: photo, category, title and cost.
class RewardCard extends StatelessWidget {
  const RewardCard({
    super.key,
    required this.reward,
    required this.onTap,
    this.affordable = true,
  });

  final Reward reward;
  final VoidCallback onTap;
  final bool affordable;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    final arabic = context.isArabic;
    final category = reward.category.label(l10n);

    return BOHMediaTile(
      image: reward.image,
      onTap: onTap,
      semanticLabel: '${reward.title}. ${l10n.pointsAmount(reward.cost)}',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            arabic ? category : category.toUpperCase(),
            style: context.text.tag.copyWith(
              color: rewardCategoryColor(c, reward.category),
              letterSpacing: arabic ? 0 : 1,
            ),
          ),
          const SizedBox(height: AppSpacing.s4),
          Text(
            reward.title,
            style: context.text.label.copyWith(height: 17 / 13),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: AppSpacing.s4),
          if (reward.available)
            PointsCost(reward.cost, affordable: affordable)
          else
            BOHTag(l10n.comingSoonTitle, variant: BOHTagVariant.outline),
        ],
      ),
    );
  }
}

/// Profile Highlight offer: a points reward that raises the member in the
/// Professionals list. Never verification, never paid placement.
class HighlightOfferCard extends StatelessWidget {
  const HighlightOfferCard({
    super.key,
    required this.reward,
    required this.avatar,
    required this.onRedeem,
  });

  final Reward reward;
  final Widget avatar;
  final VoidCallback? onRedeem;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final text = context.text;
    return BOHCard(
      tone: BOHCardTone.accent,
      borderRadius: AppRadii.largeAll,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              avatar,
              const SizedBox(width: AppSpacing.s12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    BOHTag(
                      l10n.rewardsHighlightTag,
                      variant: BOHTagVariant.soft,
                    ),
                    const SizedBox(height: AppSpacing.s6),
                    Text(reward.title, style: text.cardTitle),
                    const SizedBox(height: 2),
                    Text(
                      reward.description,
                      style: text.bodySmall.copyWith(height: 17 / 12),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.s12),
          SizedBox(
            height: 42,
            child: BOHButton(
              label: l10n.rewardRedeemFor(reward.cost),
              size: BOHButtonSize.medium,
              trailingIcon: null,
              onPressed: onRedeem,
            ),
          ),
          const SizedBox(height: AppSpacing.s8),
          Text(
            l10n.rewardsHighlightNote,
            textAlign: TextAlign.center,
            style: text.caption.copyWith(height: 15 / 11),
          ),
        ],
      ),
    );
  }
}
