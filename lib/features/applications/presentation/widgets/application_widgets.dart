import 'package:flutter/material.dart';

import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/generated/app_localizations.dart';
import '../../../../core/utils/date_formats.dart';
import '../../../../core/widgets/widgets.dart';
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

  BOHStatusTone get tone => switch (this) {
    ApplicationStatus.submitted => BOHStatusTone.info,
    ApplicationStatus.reviewed => BOHStatusTone.warning,
    ApplicationStatus.shortlisted => BOHStatusTone.success,
    ApplicationStatus.contact => BOHStatusTone.violet,
    ApplicationStatus.accepted => BOHStatusTone.success,
    ApplicationStatus.rejected ||
    ApplicationStatus.withdrawn => BOHStatusTone.neutral,
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

/// Status pill; the label carries the meaning.
class ApplicationStatusTag extends StatelessWidget {
  const ApplicationStatusTag(this.status, {super.key});

  final ApplicationStatus status;

  @override
  Widget build(BuildContext context) =>
      BOHStatusBadge(status.label(context.l10n), tone: status.tone);
}

/// The five official steps — Submitted, Reviewed, Shortlisted, Contact,
/// Decision — with the reached steps checked. The last step shows the
/// outcome once a decision exists. The company decides; this only reports.
class ApplicationPipeline extends StatelessWidget {
  const ApplicationPipeline({super.key, required this.status});

  final ApplicationStatus status;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    const stages = ApplicationStage.values;
    final current = status.stage.index;
    final decided = status.stage == ApplicationStage.decision;
    return BOHStatusTracker(
      semanticLabel:
          '${l10n.applicationStageOf(current + 1, stages.length)}: '
          '${status.label(l10n)}',
      reached: current,
      steps: [
        for (final stage in stages)
          stage == ApplicationStage.decision && decided
              ? status.label(l10n)
              : stage.label(l10n),
      ],
    );
  }
}

/// One application in My applications: company mark, role, company and
/// city, status; optionally the step tracker; applied date and an action.
class ApplicationCard extends StatelessWidget {
  const ApplicationCard({
    super.key,
    required this.application,
    required this.onOpen,
    this.onWithdraw,
    this.expanded = false,
  });

  final Application application;
  final VoidCallback onOpen;

  /// Shown for active applications only.
  final VoidCallback? onWithdraw;

  /// Highlighted card with the step tracker (the most recent application).
  final bool expanded;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    final a = application;

    return BOHCard(
      tone: expanded ? BOHCardTone.accent : BOHCardTone.normal,
      onTap: onOpen,
      semanticLabel:
          '${a.opportunityTitle}. ${a.company.name}. ${a.status.label(l10n)}',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              BOHCompanyLogo(name: a.company.name, size: 46),
              const SizedBox(width: AppSpacing.s12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      a.opportunityTitle,
                      style: context.text.itemTitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      '${a.company.name} · ${a.city}',
                      style: context.text.bodySmall,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.s8),
              ApplicationStatusTag(a.status),
            ],
          ),
          if (expanded) ...[
            const SizedBox(height: AppSpacing.s16),
            ApplicationPipeline(status: a.status),
          ],
          const SizedBox(height: AppSpacing.s12),
          BOHCardFooter(
            leading: Text(
              l10n.applicationAppliedOn(
                AppDateFormats.monthDayShort(context).format(a.submittedAt),
              ),
              style: context.text.caption,
            ),
            trailing: onWithdraw != null
                ? BOHLinkButton(
                    label: l10n.actionWithdraw,
                    arrow: false,
                    fontSize: 12,
                    color: c.error,
                    onTap: onWithdraw,
                  )
                : BOHLinkButton(
                    label: l10n.actionViewDetails,
                    fontSize: 12,
                    onTap: onOpen,
                  ),
          ),
        ],
      ),
    );
  }
}

/// Compact application row inside a grouped list — Profile.
class ApplicationRow extends StatelessWidget {
  const ApplicationRow({
    super.key,
    required this.application,
    required this.onTap,
  });

  final Application application;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final a = application;
    return BOHPressable(
      onTap: onTap,
      semanticLabel:
          '${a.opportunityTitle}. ${a.company.name}. '
          '${a.status.label(context.l10n)}',
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.s12,
          vertical: AppSpacing.s10,
        ),
        child: Row(
          children: [
            BOHCompanyLogo(name: a.company.name, size: 42),
            const SizedBox(width: AppSpacing.s12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    a.opportunityTitle,
                    style: context.text.label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    a.company.name,
                    style: context.text.caption,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            const SizedBox(width: AppSpacing.s8),
            ApplicationStatusTag(a.status),
          ],
        ),
      ),
    );
  }
}
