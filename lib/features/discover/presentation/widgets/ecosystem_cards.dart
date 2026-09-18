import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_radii.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/generated/app_localizations.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../companies/domain/company.dart';
import '../../../companies/presentation/company_labels.dart';
import '../../../news/domain/article.dart';
import '../../../opportunities/presentation/widgets/opportunity_widgets.dart';
import '../../../professionals/domain/professional.dart';

extension AvailabilityPresentation on Availability {
  String label(AppLocalizations l10n) => switch (this) {
    Availability.available => l10n.availabilityAvailable,
    Availability.inProduction => l10n.availabilityInProduction,
    Availability.fullyBooked => l10n.availabilityFullyBooked,
  };

  Color color(AppColors c) => switch (this) {
    Availability.available => c.success,
    Availability.inProduction => c.primary,
    Availability.fullyBooked => c.textMuted,
  };
}

/// Carousel card — Home "Companies to Watch".
class CompanyCarouselCard extends StatelessWidget {
  const CompanyCarouselCard({
    super.key,
    required this.company,
    required this.onTap,
  });

  final Company company;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final l10n = context.l10n;
    return BOHCard(
      onTap: onTap,
      semanticLabel: '${company.name}. ${company.specialization}',
      padding: const EdgeInsets.all(AppSpacing.cardPadding),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              BOHIconCircle(
                icon: company.type.icon,
                size: 40,
                rounded: true,
                tone: BOHIconCircleTone.neutral,
              ),
              const Spacer(),
              if (company.verified)
                BOHTag(l10n.verifiedLabel, variant: BOHTagVariant.verified),
            ],
          ),
          const SizedBox(height: AppSpacing.s12),
          Text(
            company.name,
            style: context.text.cardTitle.copyWith(fontWeight: FontWeight.w700),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          Text(
            '${company.type.label(l10n)} · ${company.city}',
            style: context.text.bodySmall,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: AppSpacing.s12),
          const Spacer(),
          Divider(height: AppSpacing.s16, color: c.surfaceElevated),
          Row(
            children: [
              Expanded(
                child: BOHStatusLabel(
                  label: l10n.companyOpenOpportunities(
                    company.openOpportunities,
                  ),
                  color: c.primary,
                ),
              ),
              Icon(
                AppIcons.companies,
                size: AppSizes.iconMedium,
                color: c.textMuted,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Discover recommendation — company with a Follow action.
class CompanyRecommendationCard extends StatelessWidget {
  const CompanyRecommendationCard({
    super.key,
    required this.company,
    required this.onFollow,
    this.onTap,
  });

  final Company company;
  final VoidCallback onFollow;

  /// Opens the company's profile.
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final l10n = context.l10n;
    return BOHCard(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              BOHIconCircle(icon: company.type.icon, size: 52, rounded: true),
              const SizedBox(width: AppSpacing.s12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      company.name,
                      style: context.text.cardTitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (company.verified) ...[
                      const SizedBox(height: AppSpacing.s4),
                      BOHTag(
                        l10n.verifiedLabel,
                        variant: BOHTagVariant.verified,
                      ),
                    ],
                    const SizedBox(height: AppSpacing.s4),
                    Text(
                      '${company.type.label(l10n)} · ${company.specialization}',
                      style: context.text.body,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.s8),
              BOHButton(
                label: company.followed
                    ? l10n.actionFollowing
                    : l10n.actionFollow,
                variant: company.followed
                    ? BOHButtonVariant.ghost
                    : BOHButtonVariant.secondary,
                size: BOHButtonSize.small,
                shape: BOHButtonShape.pill,
                trailingIcon: null,
                leadingIcon: company.followed ? AppIcons.check : null,
                expand: false,
                onPressed: onFollow,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.s12),
          Row(
            children: [
              Icon(
                AppIcons.location,
                size: AppSizes.iconSmall,
                color: c.textMuted,
              ),
              const SizedBox(width: AppSpacing.s4),
              Expanded(
                child: Text(
                  company.city,
                  style: context.text.bodySmall,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              Icon(
                AppIcons.people,
                size: AppSizes.iconSmall,
                color: c.primaryText,
              ),
              const SizedBox(width: AppSpacing.s4),
              Text(
                l10n.companyCompletedProjects(company.completedProjects),
                style: context.text.bodySmall.copyWith(color: c.textPrimary),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Discover recommendation — professional with Connect.
class ProfessionalCard extends StatelessWidget {
  const ProfessionalCard({
    super.key,
    required this.professional,
    required this.onConnect,
  });

  final Professional professional;
  final VoidCallback onConnect;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final l10n = context.l10n;
    final p = professional;

    return BOHCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              BOHAvatar(
                name: p.name,
                image: p.avatar,
                size: BOHAvatarSize.medium,
                statusColor: p.availability.color(c),
              ),
              const SizedBox(width: AppSpacing.s12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      p.name,
                      style: context.text.cardTitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      p.role,
                      style: context.text.bodySmall,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.s8),
              BOHButton(
                label: p.connected ? l10n.actionRequested : l10n.actionConnect,
                variant: p.connected
                    ? BOHButtonVariant.ghost
                    : BOHButtonVariant.primary,
                size: BOHButtonSize.small,
                shape: BOHButtonShape.pill,
                trailingIcon: null,
                expand: false,
                onPressed: onConnect,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.s12),
          Wrap(
            spacing: AppSpacing.s8,
            runSpacing: AppSpacing.s8,
            children: [
              MatchPill(p.matchScore),
              BOHTag(
                l10n.yearsExperience(p.yearsExperience),
                variant: BOHTagVariant.neutral,
              ),
              for (final skill in p.skills)
                BOHTag(skill, variant: BOHTagVariant.neutral),
            ],
          ),
          const SizedBox(height: AppSpacing.s12),
          BOHStatusLabel(
            label: p.availability.label(l10n),
            color: p.availability.color(c),
          ),
        ],
      ),
    );
  }
}

/// Editorial hero — Home "Breaking briefing".
class ArticleHeroCard extends StatelessWidget {
  const ArticleHeroCard({
    super.key,
    required this.article,
    required this.onTap,
  });

  final Article article;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final l10n = context.l10n;
    const ink = AppColors.onPhoto;

    return BOHPressable(
      onTap: onTap,
      semanticLabel: '${article.title}. ${article.source}',
      child: Container(
        clipBehavior: Clip.antiAlias,
        decoration: BoxDecoration(
          color: c.surface,
          borderRadius: AppRadii.mediumAll,
          border: Border.all(color: c.borderSoft),
          boxShadow: const [],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AspectRatio(
              aspectRatio: 16 / 9,
              child: Stack(
                fit: StackFit.expand,
                children: [
                  BOHImage(image: article.image, scrim: BOHImageScrim.bottom),
                  if (article.breaking)
                    PositionedDirectional(
                      top: AppSpacing.s12,
                      start: AppSpacing.s12,
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.s8 + 2,
                          vertical: AppSpacing.s4,
                        ),
                        decoration: BoxDecoration(
                          color: c.primary,
                          borderRadius: AppRadii.pillAll,
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              width: 6,
                              height: 6,
                              decoration: BoxDecoration(
                                color: c.heroAccent,
                                shape: BoxShape.circle,
                              ),
                            ),
                            const SizedBox(width: AppSpacing.s4),
                            Text(
                              context.isArabic
                                  ? l10n.breakingBriefing
                                  : l10n.breakingBriefing.toUpperCase(),
                              style: AppTypography.caption.copyWith(
                                color: c.onPrimary,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  PositionedDirectional(
                    start: AppSpacing.s12,
                    end: AppSpacing.s12,
                    bottom: AppSpacing.s12,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(AppIcons.clock, size: 14, color: ink),
                            const SizedBox(width: AppSpacing.s4),
                            Flexible(
                              child: Text(
                                '${l10n.readTimeMinutes(article.readMinutes)} · ${article.source}',
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: AppTypography.caption.copyWith(
                                  color: ink.withValues(alpha: 0.85),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.s4),
                        Text(
                          article.title,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.h3.copyWith(
                            color: ink,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsetsDirectional.fromSTEB(
                AppSpacing.s16,
                AppSpacing.s4,
                AppSpacing.s4,
                AppSpacing.s4,
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      article.teaser,
                      style: context.text.bodySmall,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  BOHButton(
                    label: l10n.actionReadBriefing,
                    variant: BOHButtonVariant.text,
                    onPressed: onTap,
                  ),
                  Icon(
                    AppIcons.arrowForward,
                    size: AppSizes.iconSmall,
                    color: c.primaryText,
                  ),
                  const SizedBox(width: AppSpacing.s8),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
