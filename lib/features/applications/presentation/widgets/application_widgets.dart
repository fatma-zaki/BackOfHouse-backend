import 'package:flutter/material.dart';

import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_radii.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../app/theme/app_typography.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/generated/app_localizations.dart';
import '../../../../core/utils/date_formats.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../opportunities/presentation/widgets/opportunity_widgets.dart';
import '../../domain/application.dart';

extension ApplicationStatusPresentation on ApplicationStatus {
  String label(AppLocalizations l10n) => switch (this) {
    ApplicationStatus.submitted => l10n.applicationStatusSubmitted,
    ApplicationStatus.reviewed => l10n.applicationStatusReviewed,
    ApplicationStatus.shortlisted => l10n.applicationStatusShortlisted,
    ApplicationStatus.contact => l10n.applicationStatusContact,
    ApplicationStatus.accepted => l10n.applicationStatusAccepted,
    ApplicationStatus.rejected => l10n.applicationStatusRejected,
    ApplicationStatus.withdrawn => l10n.applicationStatusWithdrawn,
  };

  IconData get icon => switch (this) {
    ApplicationStatus.submitted => AppIcons.post,
    ApplicationStatus.reviewed => AppIcons.show,
    ApplicationStatus.shortlisted => AppIcons.success,
    ApplicationStatus.contact => AppIcons.email,
    ApplicationStatus.accepted => AppIcons.verified,
    ApplicationStatus.rejected => AppIcons.close,
    ApplicationStatus.withdrawn => AppIcons.logOut,
  };

  Color color(AppColors c) => switch (this) {
    ApplicationStatus.accepted => c.success,
    ApplicationStatus.rejected || ApplicationStatus.withdrawn => c.textMuted,
    _ => c.primaryText,
  };
}

extension ApplicationStagePresentation on ApplicationStage {
  String label(AppLocalizations l10n) => switch (this) {
    ApplicationStage.submitted => l10n.applicationStatusSubmitted,
    ApplicationStage.reviewed => l10n.applicationStatusReviewed,
    ApplicationStage.shortlisted => l10n.applicationStatusShortlisted,
    ApplicationStage.contact => l10n.applicationStatusContact,
    ApplicationStage.decision => l10n.applicationStageDecision,
  };
}

/// Status pill: icon plus label, so it never relies on colour.
class ApplicationStatusTag extends StatelessWidget {
  const ApplicationStatusTag(this.status, {super.key});

  final ApplicationStatus status;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final color = status.color(c);
    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.s8 + 2,
        vertical: AppSpacing.s4,
      ),
      decoration: BoxDecoration(
        color: color.withValues(alpha: c.isDark ? 0.16 : 0.10),
        borderRadius: AppRadii.pillAll,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(status.icon, size: 14, color: color),
          const SizedBox(width: AppSpacing.s4),
          Text(
            status.label(context.l10n),
            style: AppTypography.caption.copyWith(
              color: color,
              fontWeight: FontWeight.w700,
            ),
          ),
        ],
      ),
    );
  }
}

/// The five-step lifecycle with the current step marked. The last step
/// shows the outcome once a decision exists.
class ApplicationPipeline extends StatelessWidget {
  const ApplicationPipeline({super.key, required this.status});

  final ApplicationStatus status;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    const stages = ApplicationStage.values;
    final current = status.stage.index;

    return Semantics(
      label: l10n.applicationStageOf(current + 1, stages.length),
      value: status.label(l10n),
      child: ExcludeSemantics(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                for (final stage in stages) ...[
                  if (stage.index > 0)
                    Expanded(
                      child: Container(
                        height: 2,
                        color: stage.index <= current
                            ? c.primary
                            : c.borderSoft,
                      ),
                    ),
                  _StageDot(
                    done: stage.index < current,
                    current: stage.index == current,
                    closed:
                        stage == ApplicationStage.decision &&
                        status.stage == ApplicationStage.decision,
                  ),
                ],
              ],
            ),
            const SizedBox(height: AppSpacing.s8),
            Row(
              children: [
                for (final stage in stages)
                  Expanded(
                    // Shrink a long single word ("Shortlisted") rather than
                    // break it mid-word.
                    child: FittedBox(
                      fit: BoxFit.scaleDown,
                      alignment: switch (stage.index) {
                        0 => AlignmentDirectional.centerStart,
                        4 => AlignmentDirectional.centerEnd,
                        _ => AlignmentDirectional.center,
                      },
                      child: Text(
                        stage == ApplicationStage.decision &&
                                status.stage == ApplicationStage.decision
                            ? status.label(l10n)
                            : stage.label(l10n),
                        maxLines: 1,
                        style: AppTypography.caption.copyWith(
                          color: stage.index == current
                              ? c.primaryText
                              : c.textMuted,
                          fontWeight: stage.index == current
                              ? FontWeight.w700
                              : FontWeight.w500,
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StageDot extends StatelessWidget {
  const _StageDot({
    required this.done,
    required this.current,
    required this.closed,
  });

  final bool done;
  final bool current;
  final bool closed;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final filled = done || current;
    return Container(
      width: 22,
      height: 22,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: filled ? c.primary : c.surface,
        border: Border.all(color: filled ? c.primary : c.border, width: 1.5),
        boxShadow: current && !closed
            ? [BoxShadow(color: c.primaryTint, spreadRadius: 4)]
            : null,
      ),
      alignment: Alignment.center,
      child: done || closed
          ? Icon(AppIcons.check, size: 12, color: c.onPrimary)
          : current
          ? Container(
              width: 8,
              height: 8,
              decoration: BoxDecoration(
                color: c.onPrimary,
                shape: BoxShape.circle,
              ),
            )
          : null,
    );
  }
}

/// One application in My Applications.
class ApplicationCard extends StatelessWidget {
  const ApplicationCard({
    super.key,
    required this.application,
    required this.onOpen,
    this.onWithdraw,
  });

  final Application application;
  final VoidCallback onOpen;

  /// Shown for active applications only.
  final VoidCallback? onWithdraw;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    final a = application;
    final terms = opportunityTerms(
      l10n,
      type: a.opportunityType,
      employment: a.employment,
    );

    return BOHCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          CompanyByline(
            company: a.company,
            trailing: ApplicationStatusTag(a.status),
          ),
          const SizedBox(height: AppSpacing.s12),
          Text(a.opportunityTitle, style: context.text.cardTitle),
          const SizedBox(height: AppSpacing.s4),
          Text(
            [a.city, terms, ?a.compensation].join(' · '),
            style: context.text.bodySmall,
          ),
          const SizedBox(height: AppSpacing.s12),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.s12,
              vertical: AppSpacing.s8,
            ),
            decoration: BoxDecoration(
              color: c.backgroundSecondary,
              borderRadius: AppRadii.smallAll,
            ),
            child: Row(
              children: [
                Icon(
                  AppIcons.calendar,
                  size: AppSizes.iconSmall,
                  color: c.textMuted,
                ),
                const SizedBox(width: AppSpacing.s8),
                Expanded(
                  child: Text(
                    l10n.applicationAppliedOn(
                      AppDateFormats.mediumDate(context).format(a.submittedAt),
                    ),
                    style: context.text.bodySmall,
                  ),
                ),
                Text(
                  l10n.applicationReference(AppDateFormats.ltr(a.reference)),
                  style: context.text.caption,
                ),
              ],
            ),
          ),
          const SizedBox(height: AppSpacing.s16),
          ApplicationPipeline(status: a.status),
          const SizedBox(height: AppSpacing.s16),
          Row(
            children: [
              Expanded(
                child: BOHButton(
                  label: l10n.actionViewOpportunity,
                  variant: BOHButtonVariant.secondary,
                  size: BOHButtonSize.small,
                  onPressed: onOpen,
                ),
              ),
              if (onWithdraw != null) ...[
                const SizedBox(width: AppSpacing.s8),
                BOHButton(
                  label: l10n.actionWithdraw,
                  variant: BOHButtonVariant.ghost,
                  size: BOHButtonSize.small,
                  trailingIcon: null,
                  expand: false,
                  onPressed: onWithdraw,
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}
