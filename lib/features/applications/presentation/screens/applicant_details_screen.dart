import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/utils/date_formats.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../companies/presentation/controllers/company_workspace_providers.dart';
import '../../../companies/presentation/widgets/company_widgets.dart';
import '../../data/applicants_data.dart';
import '../../domain/application.dart';
import '../widgets/application_widgets.dart';

/// What a company may see of one application — public profile, selected
/// experience and projects, message — and the status steps it may take.
/// Contact details appear only as the data layer releases them.
class ApplicantDetailsScreen extends ConsumerWidget {
  const ApplicantDetailsScreen({super.key, required this.applicationId});

  final String applicationId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final value = ref.watch(applicantProvider(applicationId));

    return BOHScaffold(
      appBar: BOHAppBar(title: l10n.companyApplicant),
      bottomNavigationBar: switch (value) {
        AsyncData(value: final a) when a.status.isActive => _StatusActions(
          applicant: a,
        ),
        _ => null,
      },
      body: AsyncBody<ApplicantView>(
        value: value,
        onRetry: () => ref.invalidate(applicantProvider(applicationId)),
        data: (a) => _Body(applicant: a),
      ),
    );
  }
}

class _Body extends StatelessWidget {
  const _Body({required this.applicant});

  final ApplicantView applicant;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final a = applicant;
    final p = a.applicant;
    final monthYear = AppDateFormats.monthYear(context);

    return ListView(
      padding: BOHScaffold.screenPadding.add(
        const EdgeInsets.only(top: AppSpacing.s8, bottom: AppSpacing.s32),
      ),
      children: [
        BOHCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  BOHAvatar(
                    name: p.name,
                    image: p.avatar,
                    size: BOHAvatarSize.large,
                    verified: p.verified,
                  ),
                  const SizedBox(width: AppSpacing.s12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Semantics(
                          header: true,
                          child: Text(p.name, style: context.text.h2),
                        ),
                        Text(p.headline, style: context.text.bodySmall),
                        if (p.city.isNotEmpty)
                          Text(p.city, style: context.text.caption),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.s12),
              Wrap(
                spacing: AppSpacing.s8,
                runSpacing: AppSpacing.s8,
                children: [
                  ApplicationStatusTag(a.status),
                  if (p.verified)
                    BOHTag(
                      l10n.verificationLevel(p.verificationLevel),
                      variant: BOHTagVariant.verified,
                    ),
                ],
              ),
              const SizedBox(height: AppSpacing.s12),
              Text(
                '${a.opportunityTitle} · ${l10n.applicationReference(a.reference)}',
                style: context.text.caption,
              ),
              Text(
                l10n.applicationAppliedOn(
                  AppDateFormats.mediumDate(context).format(a.submittedAt),
                ),
                style: context.text.caption,
              ),
              const SizedBox(height: AppSpacing.s16),
              ApplicationPipeline(status: a.status),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.s12),
        _ContactCard(applicant: a),
        if (a.statement case final message?) ...[
          const SizedBox(height: AppSpacing.s12),
          SectionCard(
            icon: AppIcons.comment,
            title: l10n.applyStatementTitle,
            child: Text(message, style: context.text.body),
          ),
        ],
        const SizedBox(height: AppSpacing.s12),
        SectionCard(
          icon: AppIcons.job,
          title: l10n.applyExperienceTitle,
          child: a.experience.isEmpty
              ? Text(l10n.companyNoneIncluded, style: context.text.bodySmall)
              : Column(
                  children: [
                    for (final e in a.experience)
                      BOHListTile(
                        padding: const EdgeInsets.symmetric(
                          vertical: AppSpacing.s8,
                        ),
                        title: e.role,
                        subtitle: e.company,
                        caption: [
                          monthYear.format(e.start),
                          if (e.end case final end?)
                            monthYear.format(end)
                          else
                            l10n.profilePresent,
                        ].join(' – '),
                      ),
                  ],
                ),
        ),
        const SizedBox(height: AppSpacing.s12),
        SectionCard(
          icon: AppIcons.workshop,
          title: l10n.applyProjectsTitle,
          child: a.projects.isEmpty
              ? Text(l10n.companyNoneIncluded, style: context.text.bodySmall)
              : Column(
                  children: [
                    for (final project in a.projects)
                      BOHListTile(
                        padding: const EdgeInsets.symmetric(
                          vertical: AppSpacing.s8,
                        ),
                        title: project.title,
                        subtitle: project.role,
                        caption: '${project.year} · ${project.category}',
                      ),
                  ],
                ),
        ),
        if (p.skills.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.s12),
          SectionCard(
            icon: AppIcons.technology,
            title: l10n.opportunitySkills,
            child: Wrap(
              spacing: AppSpacing.s8,
              runSpacing: AppSpacing.s8,
              children: [
                for (final s in p.skills)
                  BOHTag(s, variant: BOHTagVariant.outline),
              ],
            ),
          ),
        ],
        const SizedBox(height: AppSpacing.s12),
        BOHInfoNote(l10n.companyDecisionNote, icon: AppIcons.shield),
      ],
    );
  }
}

/// Contact details stay hidden until the contact stage, and then show only
/// what the applicant shares. There is no in-app messaging.
class _ContactCard extends StatelessWidget {
  const _ContactCard({required this.applicant});

  final ApplicantView applicant;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final contact = applicant.contact;
    final unlocked = ApplicantPrivacy.contactUnlocked(applicant.status);

    return SectionCard(
      icon: unlocked ? AppIcons.email : AppIcons.hidden,
      title: l10n.companyApplicantContact,
      child: contact != null
          ? Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                DetailLine(icon: AppIcons.email, value: contact.email),
                DetailLine(icon: AppIcons.phone, value: contact.phone),
                Text(
                  l10n.companyContactOutsideApp,
                  style: context.text.caption,
                ),
              ],
            )
          : Text(
              unlocked
                  ? l10n.companyContactNotShared
                  : l10n.companyContactHidden,
              style: context.text.bodySmall,
            ),
    );
  }
}

/// The company's allowed next steps, straight from [ApplicationRules].
class _StatusActions extends ConsumerWidget {
  const _StatusActions({required this.applicant});

  final ApplicantView applicant;

  Future<void> _move(
    BuildContext context,
    WidgetRef ref,
    ApplicationStatus to,
  ) async {
    final l10n = context.l10n;
    final a = applicant;
    if (to == ApplicationStatus.accepted || to == ApplicationStatus.rejected) {
      final confirmed = await confirmCompanyAction(
        context,
        title: to == ApplicationStatus.accepted
            ? l10n.companyAcceptTitle
            : l10n.companyRejectTitle,
        message: l10n.companyDecisionFinal(a.applicant.name),
        action: to == ApplicationStatus.accepted
            ? l10n.companyAcceptApplicant
            : l10n.companyRejectApplicant,
      );
      if (!confirmed || !context.mounted) return;
    }
    final ok = await runCompanyAction(
      context,
      () => ref
          .read(applicantsRepositoryProvider)
          .updateStatus(a.applicationId, to),
      success: l10n.companyStatusUpdated(to.label(l10n)),
    );
    if (ok) {
      ref
        ..invalidate(applicantProvider(a.applicationId))
        ..invalidate(applicantsProvider(a.opportunityId));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final next = ApplicationRules.nextStatuses(
      applicant.status,
      ApplicationActor.company,
    );
    final advance = next
        .where((s) => s != ApplicationStatus.rejected)
        .firstOrNull;

    String advanceLabel(ApplicationStatus s) => switch (s) {
      ApplicationStatus.reviewed => l10n.companyMarkReviewed,
      ApplicationStatus.shortlisted => l10n.companyShortlist,
      ApplicationStatus.contact => l10n.companyMoveToContact,
      ApplicationStatus.accepted => l10n.companyAcceptApplicant,
      _ => s.label(l10n),
    };

    return BOHActionBar(
      child: Row(
        children: [
          if (next.contains(ApplicationStatus.rejected))
            Expanded(
              child: BOHButton(
                label: l10n.companyRejectApplicant,
                variant: BOHButtonVariant.ghost,
                trailingIcon: null,
                onPressed: () =>
                    _move(context, ref, ApplicationStatus.rejected),
              ),
            ),
          if (advance != null) ...[
            const SizedBox(width: AppSpacing.s8),
            Expanded(
              flex: 2,
              child: BOHButton(
                label: advanceLabel(advance),
                trailingIcon: null,
                onPressed: () => _move(context, ref, advance),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
