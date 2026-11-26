import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/app_radii.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/l10n_messages.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../companies/presentation/controllers/company_workspace_providers.dart';
import '../../../companies/presentation/widgets/company_widgets.dart';
import '../../domain/application.dart';
import '../widgets/applicant_actions.dart';
import '../widgets/application_widgets.dart';

/// What a company may see of one application — public profile, message,
/// selected experience and projects — and the single next step it may
/// take. Contact details appear only as the data layer releases them (from
/// the Contact stage, and only what the applicant shares).
class ApplicantDetailsScreen extends ConsumerWidget {
  const ApplicantDetailsScreen({super.key, required this.applicationId});

  final String applicationId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final value = ref.watch(applicantProvider(applicationId));

    return BOHScaffold(
      appBar: BOHAppBar(
        overline: l10n.companyApplicationFor,
        title: value.value?.opportunityTitle ?? l10n.companyApplicant,
      ),
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
    final c = context.colors;
    final a = applicant;
    final p = a.applicant;
    const gap = SizedBox(height: AppSpacing.s16);

    Widget subhead(String text) => Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.s8),
      child: Text(text, style: context.text.itemTitle),
    );

    return ListView(
      padding: BOHScaffold.screenPadding.add(
        const EdgeInsets.only(top: AppSpacing.s8, bottom: AppSpacing.s32),
      ),
      children: [
        BOHCard(
          borderRadius: AppRadii.heroAll,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Row(
                children: [
                  BOHAvatar(
                    name: p.name,
                    image: p.avatar,
                    dimension: 60,
                    ring: true,
                    ringGap: c.surface,
                    verified: p.verified,
                  ),
                  const SizedBox(width: AppSpacing.s14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Semantics(
                          header: true,
                          child: Text(p.name, style: context.text.h3),
                        ),
                        Text(
                          [
                            p.headline,
                            if (p.city.isNotEmpty) p.city,
                          ].join(' · '),
                          style: context.text.bodySmall,
                        ),
                        const SizedBox(height: AppSpacing.s6),
                        BOHStatusBadge(
                          l10n.applicantStatusApplied(
                            a.status.label(l10n),
                            l10n.relativeTime(a.submittedAt),
                          ),
                          tone: a.status.tone,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.s16),
              ApplicationPipeline(status: a.status),
            ],
          ),
        ),
        if (a.statement case final message?) ...[
          gap,
          subhead(l10n.companyMessageTitle),
          Container(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.s14,
              vertical: AppSpacing.s12,
            ),
            decoration: BoxDecoration(
              color: c.primaryTint,
              borderRadius: AppRadii.mediumAll,
            ),
            child: Text(
              message,
              style: context.text.body.copyWith(color: c.textPrimary),
            ),
          ),
        ],
        gap,
        subhead(l10n.companyExperienceShared),
        if (a.experience.isEmpty)
          Text(l10n.companyNoneIncluded, style: context.text.bodySmall)
        else
          BOHGroupedList(
            flat: true,
            children: [
              for (final e in a.experience)
                BOHListTile(
                  leading: const BOHIconCircle(
                    icon: AppIcons.job,
                    size: AppSizes.iconTile,
                    rounded: true,
                  ),
                  title: e.role,
                  subtitle: [
                    '${e.start.year} – ${e.end?.year ?? l10n.profilePresent}',
                    e.company,
                  ].join(' · '),
                ),
            ],
          ),
        gap,
        subhead(l10n.companyProjectsShared),
        if (a.projects.isEmpty)
          Text(l10n.companyNoneIncluded, style: context.text.bodySmall)
        else
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              for (final (i, project) in a.projects.take(2).indexed) ...[
                if (i > 0) const SizedBox(width: AppSpacing.gridGap),
                Expanded(
                  child: BOHMediaTile(
                    image: project.image,
                    imageHeight: 64,
                    borderRadius: AppRadii.inputAll,
                    padding: const EdgeInsets.fromLTRB(10, 6, 10, 8),
                    child: Text(
                      project.title,
                      style: context.text.labelMedium.copyWith(fontSize: 11),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
              ],
              if (a.projects.length == 1) ...[
                const SizedBox(width: AppSpacing.gridGap),
                const Expanded(child: SizedBox.shrink()),
              ],
            ],
          ),
        if (p.skills.isNotEmpty) ...[
          gap,
          subhead(l10n.opportunitySkills),
          Wrap(
            spacing: AppSpacing.s8,
            runSpacing: AppSpacing.s8,
            children: [for (final s in p.skills) BOHMetaChip(s, large: true)],
          ),
        ],
        gap,
        _Contact(applicant: a),
        const SizedBox(height: AppSpacing.s12),
        BOHInfoNote(l10n.companyDecisionNote, icon: AppIcons.shield),
      ],
    );
  }
}

/// Contact details stay hidden until the contact stage, and then show only
/// what the applicant shares. There is no in-app messaging.
class _Contact extends StatelessWidget {
  const _Contact({required this.applicant});

  final ApplicantView applicant;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final contact = applicant.contact;
    final unlocked = ApplicantPrivacy.contactUnlocked(applicant.status);

    if (contact == null) {
      return BOHBanner(
        unlocked ? l10n.companyContactNotShared : l10n.companyContactHidden,
        icon: AppIcons.password,
      );
    }
    return SectionCard(
      icon: AppIcons.email,
      title: l10n.companyApplicantContact,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          DetailLine(icon: AppIcons.email, value: contact.email),
          DetailLine(icon: AppIcons.phone, value: contact.phone),
          Text(l10n.companyContactOutsideApp, style: context.text.caption),
        ],
      ),
    );
  }
}

/// "Not selected" beside the single next step, from [ApplicationRules].
class _StatusActions extends ConsumerWidget {
  const _StatusActions({required this.applicant});

  final ApplicantView applicant;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final advance = nextApplicantStep(applicant.status);
    final reject = canRejectApplicant(applicant.status)
        ? BOHButton(
            label: l10n.companyRejectApplicant,
            variant: BOHButtonVariant.danger,
            trailingIcon: null,
            onPressed: () => moveApplicant(
              context,
              ref,
              applicant,
              ApplicationStatus.rejected,
            ),
          )
        : null;
    final forward = advance == null
        ? null
        : BOHButton(
            label: applicantStepLabel(l10n, advance),
            trailingIcon: null,
            onPressed: () => moveApplicant(context, ref, applicant, advance),
          );

    if (reject != null && forward != null) {
      return BOHActionBar.pair(secondary: reject, primary: forward);
    }
    return BOHActionBar(child: forward ?? reject ?? const SizedBox.shrink());
  }
}
