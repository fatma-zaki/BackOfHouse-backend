import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
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

/// Applicants to one of the company's listings, filterable by stage. Each
/// card offers the single next step; decisions happen on the detail screen.
class ApplicantsScreen extends ConsumerStatefulWidget {
  const ApplicantsScreen({super.key, required this.opportunityId});

  final String opportunityId;

  @override
  ConsumerState<ApplicantsScreen> createState() => _ApplicantsScreenState();
}

class _ApplicantsScreenState extends ConsumerState<ApplicantsScreen> {
  ApplicationStage? _stage;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final id = widget.opportunityId;
    final listing = ref.watch(myCompanyOpportunityProvider(id)).value;
    final all = ref.watch(applicantsProvider(id));
    final count = all.value?.length ?? 0;

    return BOHScaffold(
      appBar: BOHAppBar(
        title: listing?.title ?? l10n.companyApplicants,
        subtitle: listing == null
            ? null
            : l10n.companyApplicantsSubtitle(count, listing.status.label(l10n)),
      ),
      body: AsyncBody<List<ApplicantView>>(
        value: all,
        onRetry: () => ref.invalidate(applicantsProvider(id)),
        data: (all) {
          int inStage(ApplicationStage s) =>
              all.where((a) => a.status.stage == s).length;
          final visible = [
            for (final a in all)
              if (_stage == null || a.status.stage == _stage) a,
          ];
          return BOHRefresh(
            onRefresh: () => ref.refresh(applicantsProvider(id).future),
            child: ListView(
              padding: EdgeInsets.only(
                top: AppSpacing.s4,
                bottom: MediaQuery.paddingOf(context).bottom + AppSpacing.s32,
              ),
              children: [
                BOHFilterChips<ApplicationStage?>(
                  options: [null, ...ApplicationStage.values],
                  selected: _stage,
                  label: (stage) => stage == null
                      ? l10n.filterAllCount(all.length)
                      : l10n.stageFilterCount(
                          stage.label(l10n),
                          inStage(stage),
                        ),
                  padding: BOHScaffold.screenPadding,
                  onSelected: (stage) => setState(() => _stage = stage),
                ),
                const SizedBox(height: AppSpacing.s8),
                Padding(
                  padding: BOHScaffold.screenPadding,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (visible.isEmpty)
                        SizedBox(
                          height: 280,
                          child: BOHEmptyState(
                            icon: AppIcons.applicants,
                            title: l10n.companyApplicantsEmpty,
                          ),
                        )
                      else
                        for (final a in visible)
                          Padding(
                            padding: const EdgeInsets.only(
                              bottom: AppSpacing.s12,
                            ),
                            child: _ApplicantCard(applicant: a),
                          ),
                    ],
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _ApplicantCard extends ConsumerWidget {
  const _ApplicantCard({required this.applicant});

  final ApplicantView applicant;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final a = applicant;
    final p = a.applicant;
    final next = nextApplicantStep(a.status);
    void open() => context.push(AppRoutes.companyApplicant(a.applicationId));

    return BOHCard(
      onTap: open,
      semanticLabel: '${p.name}. ${p.headline}. ${a.status.label(l10n)}',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              BOHAvatar(
                name: p.name,
                image: p.avatar,
                dimension: 46,
                verified: p.verified,
              ),
              const SizedBox(width: AppSpacing.s12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(p.name, style: context.text.itemTitle),
                    Text(
                      [p.headline, if (p.city.isNotEmpty) p.city].join(' · '),
                      style: context.text.bodySmall,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              Text(
                l10n.relativeTime(a.submittedAt),
                style: context.text.caption,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.s10),
          Wrap(
            spacing: AppSpacing.s6,
            runSpacing: AppSpacing.s6,
            children: [
              ApplicationStatusTag(a.status),
              BOHMetaChip(l10n.applicantExperienceCount(a.experience.length)),
              BOHMetaChip(l10n.applicantProjectCount(a.projects.length)),
              // Nothing about contact before the Contact stage.
              if (a.contact != null)
                BOHMetaChip(
                  l10n.applicantContactShared,
                  icon: AppIcons.email,
                  outline: true,
                ),
            ],
          ),
          if (a.statement case final message?) ...[
            const SizedBox(height: AppSpacing.s8),
            Text(
              message,
              style: context.text.bodySmall.copyWith(height: 18 / 12),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
          ],
          const SizedBox(height: AppSpacing.s12),
          Row(
            children: [
              Expanded(
                child: BOHButton(
                  label: l10n.companyViewApplication,
                  variant: BOHButtonVariant.ghost,
                  size: BOHButtonSize.small,
                  trailingIcon: null,
                  onPressed: open,
                ),
              ),
              // Accepting is a final decision; it is taken on the detail
              // screen. Other steps can be taken from here.
              if (next != null && next != ApplicationStatus.accepted) ...[
                const SizedBox(width: AppSpacing.s8),
                Expanded(
                  child: BOHButton(
                    label: applicantStepLabel(l10n, next),
                    size: BOHButtonSize.small,
                    trailingIcon: null,
                    onPressed: () => moveApplicant(context, ref, a, next),
                  ),
                ),
              ],
            ],
          ),
        ],
      ),
    );
  }
}
