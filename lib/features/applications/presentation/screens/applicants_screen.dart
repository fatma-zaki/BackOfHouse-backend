import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../companies/presentation/controllers/company_workspace_providers.dart';
import '../../../companies/presentation/widgets/company_widgets.dart';
import '../../domain/application.dart';
import '../widgets/application_widgets.dart';

/// Applicants to one of the company's listings, filterable by stage.
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
    final title = ref.watch(myCompanyOpportunityProvider(id)).value?.title;

    return BOHScaffold(
      appBar: BOHAppBar(title: l10n.companyApplicants),
      body: AsyncBody<List<ApplicantView>>(
        value: ref.watch(applicantsProvider(id)),
        onRetry: () => ref.invalidate(applicantsProvider(id)),
        data: (all) {
          final visible = [
            for (final a in all)
              if (_stage == null || a.status.stage == _stage) a,
          ];
          return BOHRefresh(
            onRefresh: () => ref.refresh(applicantsProvider(id).future),
            child: ListView(
              padding: EdgeInsets.only(
                top: AppSpacing.s8,
                bottom: MediaQuery.paddingOf(context).bottom + AppSpacing.s32,
              ),
              children: [
                Padding(
                  padding: BOHScaffold.screenPadding,
                  child: BOHPageHeader(
                    title: title ?? l10n.companyApplicants,
                    subtitle: l10n.opportunityApplicants(all.length),
                  ),
                ),
                SizedBox(
                  height: 64,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: BOHScaffold.screenPadding.add(
                      const EdgeInsets.symmetric(vertical: AppSpacing.s12),
                    ),
                    children: [
                      for (final stage in <ApplicationStage?>[
                        null,
                        ...ApplicationStage.values,
                      ])
                        Padding(
                          padding: const EdgeInsetsDirectional.only(
                            end: AppSpacing.s8,
                          ),
                          child: BOHCategoryChip(
                            label: stage?.label(l10n) ?? l10n.filterAll,
                            selected: _stage == stage,
                            onSelected: () => setState(() => _stage = stage),
                          ),
                        ),
                    ],
                  ),
                ),
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
                            child: WorkspaceTile(
                              onTap: () => context.push(
                                AppRoutes.companyApplicant(a.applicationId),
                              ),
                              leading: BOHAvatar(
                                name: a.applicant.name,
                                image: a.applicant.avatar,
                                size: BOHAvatarSize.medium,
                                verified: a.applicant.verified,
                              ),
                              title: a.applicant.name,
                              subtitle: a.applicant.headline,
                              caption: l10n.applicationReference(a.reference),
                              trailing: ApplicationStatusTag(a.status),
                            ),
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
