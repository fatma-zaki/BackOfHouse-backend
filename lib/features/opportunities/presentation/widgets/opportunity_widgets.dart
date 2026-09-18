import 'package:flutter/material.dart';

import '../../../../app/theme/app_radii.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/generated/app_localizations.dart';
import '../../../../core/l10n/l10n_messages.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../companies/domain/company.dart';
import '../../../companies/presentation/company_labels.dart';
import '../../domain/opportunity.dart';

extension OpportunityTypePresentation on OpportunityType {
  String label(AppLocalizations l10n) => switch (this) {
    OpportunityType.job => l10n.opportunityTypeJob,
    OpportunityType.project => l10n.opportunityTypeProject,
    OpportunityType.coOp => l10n.opportunityTypeCoOp,
    OpportunityType.volunteering => l10n.opportunityTypeVolunteering,
    OpportunityType.supplierRequest => l10n.opportunityTypeSupplierRequest,
  };

  IconData get icon => switch (this) {
    OpportunityType.job => AppIcons.job,
    OpportunityType.project => AppIcons.workshop,
    OpportunityType.coOp => AppIcons.courses,
    OpportunityType.volunteering => AppIcons.heart,
    OpportunityType.supplierRequest => AppIcons.sectorLogistics,
  };
}

extension ApplicationEligibilityPresentation on ApplicationEligibility {
  /// Why the applicant cannot apply. Empty for [ApplicationEligibility.eligible].
  String message(AppLocalizations l10n) => switch (this) {
    ApplicationEligibility.eligible => '',
    ApplicationEligibility.companyFacing => l10n.applyNotAvailable,
    ApplicationEligibility.individualsOnly => l10n.applyIndividualsOnly,
    ApplicationEligibility.closed => l10n.opportunityClosed,
    ApplicationEligibility.studentsOnly => l10n.applyStudentsOnly,
  };
}

extension EmploymentTypePresentation on EmploymentType {
  String label(AppLocalizations l10n) => switch (this) {
    EmploymentType.fullTime => l10n.employmentFullTime,
    EmploymentType.partTime => l10n.employmentPartTime,
    EmploymentType.contract => l10n.employmentContract,
    EmploymentType.freelance => l10n.employmentFreelance,
  };
}

/// "Full-time" for a job, "Co-op Training · 6 months" otherwise.
String opportunityTerms(
  AppLocalizations l10n, {
  required OpportunityType type,
  EmploymentType? employment,
  String? duration,
}) => [employment?.label(l10n) ?? type.label(l10n), ?duration].join(' · ');

/// "98% Match" lavender pill.
class MatchPill extends StatelessWidget {
  const MatchPill(this.score, {super.key});

  final int score;

  @override
  Widget build(BuildContext context) {
    return BOHTag(context.l10n.matchPercent(score), icon: AppIcons.match);
  }
}

/// Company mark, name and verification, as the header of opportunity and
/// application cards.
class CompanyByline extends StatelessWidget {
  const CompanyByline({super.key, required this.company, this.trailing});

  final CompanySummary company;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    return Row(
      children: [
        BOHIconCircle(
          icon: company.type.icon,
          size: 40,
          rounded: true,
          tone: BOHIconCircleTone.neutral,
        ),
        const SizedBox(width: AppSpacing.s12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Flexible(
                    child: Text(
                      company.name,
                      style: context.text.label,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  if (company.verified) ...[
                    const SizedBox(width: AppSpacing.s4),
                    Icon(
                      AppIcons.verified,
                      size: AppSizes.iconSmall,
                      color: c.primaryText,
                      semanticLabel: l10n.verifiedLabel,
                    ),
                  ],
                ],
              ),
              Text(
                company.type.label(l10n),
                style: context.text.caption,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
        if (trailing != null) ...[
          const SizedBox(width: AppSpacing.s8),
          trailing!,
        ],
      ],
    );
  }
}

class OpportunityMeta extends StatelessWidget {
  const OpportunityMeta({
    super.key,
    required this.text,
    this.icon,
    this.strong = false,
  });

  final String text;
  final IconData? icon;
  final bool strong;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        if (icon != null) ...[
          Icon(icon, size: 14, color: c.textMuted),
          const SizedBox(width: AppSpacing.s4),
        ],
        Flexible(
          child: Text(
            text,
            style: context.text.bodySmall.copyWith(
              color: strong ? c.textPrimary : c.textSecondary,
              fontWeight: strong ? FontWeight.w600 : FontWeight.w400,
            ),
          ),
        ),
      ],
    );
  }
}

/// Any opportunity type in a list. With [showReasons], the match reasons
/// are listed — for the top recommendation.
class OpportunityCard extends StatelessWidget {
  const OpportunityCard({
    super.key,
    required this.opportunity,
    required this.onTap,
    this.showReasons = false,
  });

  final Opportunity opportunity;
  final VoidCallback onTap;
  final bool showReasons;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final l10n = context.l10n;
    final o = opportunity;
    final score = o.matchScore;

    return BOHCard(
      onTap: onTap,
      semanticLabel: [
        o.title,
        o.company.name,
        o.type.label(l10n),
        if (score != null) l10n.matchPercent(score),
      ].join('. '),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CompanyByline(
            company: o.company,
            trailing: score == null ? null : MatchPill(score),
          ),
          const SizedBox(height: AppSpacing.s12),
          Text(
            o.title,
            style: context.text.cardTitle,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: AppSpacing.s8),
          Wrap(
            spacing: AppSpacing.s12,
            runSpacing: AppSpacing.s4,
            children: [
              OpportunityMeta(icon: AppIcons.location, text: o.city),
              OpportunityMeta(
                icon: o.type.icon,
                text: opportunityTerms(
                  l10n,
                  type: o.type,
                  employment: o.employment,
                  duration: o.duration,
                ),
              ),
              if (o.compensation case final pay?)
                OpportunityMeta(text: pay, strong: true),
            ],
          ),
          if (showReasons && o.matchReasons.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.s12),
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(AppSpacing.s12),
              decoration: BoxDecoration(
                color: c.primaryWash,
                borderRadius: AppRadii.smallAll,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  for (final reason in o.matchReasons)
                    Padding(
                      padding: const EdgeInsets.symmetric(vertical: 2),
                      child: OpportunityMeta(
                        icon: AppIcons.success,
                        text: reason,
                      ),
                    ),
                ],
              ),
            ),
          ],
          const SizedBox(height: AppSpacing.s12),
          Divider(height: 1, color: c.borderSoft),
          const SizedBox(height: AppSpacing.s4),
          Row(
            children: [
              Expanded(
                child: Text(
                  '${postedAgo(l10n, o.postedAt)} · '
                  '${l10n.opportunityApplicants(o.applicants)}',
                  style: context.text.caption,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
              BOHButton(
                label: l10n.actionViewDetails,
                variant: BOHButtonVariant.text,
                expand: false,
                onPressed: onTap,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class OpportunityListSkeleton extends StatelessWidget {
  const OpportunityListSkeleton({super.key, this.count = 3});

  final int count;

  @override
  Widget build(BuildContext context) {
    return BOHShimmer(
      child: Column(
        children: [
          for (var i = 0; i < count; i++)
            const Padding(
              padding: EdgeInsets.only(bottom: AppSpacing.s12),
              child: BOHSkeleton(height: 170, borderRadius: AppRadii.mediumAll),
            ),
        ],
      ),
    );
  }
}

/// Error-safe relative time for cards.
String postedAgo(AppLocalizations l10n, DateTime date) =>
    l10n.postedAgo(l10n.relativeTime(date));
