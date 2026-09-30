import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/generated/app_localizations.dart';
import '../../../companies/presentation/controllers/company_workspace_providers.dart';
import '../../../companies/presentation/widgets/company_widgets.dart';
import '../../data/applicants_data.dart';
import '../../domain/application.dart';
import 'application_widgets.dart';

/// The single next step a company may take from [status] — one step at a
/// time, straight from [ApplicationRules]. `null` when none remains.
ApplicationStatus? nextApplicantStep(ApplicationStatus status) =>
    ApplicationRules.nextStatuses(
      status,
      ApplicationActor.company,
    ).where((s) => s != ApplicationStatus.rejected).firstOrNull;

/// Whether the company may still mark the applicant "Not selected".
bool canRejectApplicant(ApplicationStatus status) =>
    ApplicationRules.nextStatuses(
      status,
      ApplicationActor.company,
    ).contains(ApplicationStatus.rejected);

/// Button label for moving to [to].
String applicantStepLabel(AppLocalizations l10n, ApplicationStatus to) =>
    switch (to) {
      ApplicationStatus.reviewed => l10n.companyMarkReviewed,
      ApplicationStatus.shortlisted => l10n.companyShortlist,
      ApplicationStatus.contact => l10n.companyMoveToContact,
      ApplicationStatus.accepted => l10n.companyAcceptApplicant,
      ApplicationStatus.rejected => l10n.companyRejectApplicant,
      _ => to.label(l10n),
    };

/// Moves [applicant] to [to]. Final decisions (accept, not selected) ask
/// for confirmation first. Refreshes what shows the applicant.
Future<void> moveApplicant(
  BuildContext context,
  WidgetRef ref,
  ApplicantView applicant,
  ApplicationStatus to,
) async {
  final l10n = context.l10n;
  if (to == ApplicationStatus.accepted || to == ApplicationStatus.rejected) {
    final confirmed = await confirmCompanyAction(
      context,
      title: to == ApplicationStatus.accepted
          ? l10n.companyAcceptTitle
          : l10n.companyRejectTitle,
      message: l10n.companyDecisionFinal(applicant.applicant.name),
      action: applicantStepLabel(l10n, to),
    );
    if (!confirmed || !context.mounted) return;
  }
  final ok = await runCompanyAction(
    context,
    () => ref
        .read(applicantsRepositoryProvider)
        .updateStatus(applicant.applicationId, to),
    success: l10n.companyStatusUpdated(to.label(l10n)),
  );
  if (ok) {
    ref
      ..invalidate(applicantProvider(applicant.applicationId))
      ..invalidate(applicantsProvider(applicant.opportunityId))
      ..invalidate(recentApplicantsProvider)
      ..invalidate(myCompanyStatsProvider);
  }
}
