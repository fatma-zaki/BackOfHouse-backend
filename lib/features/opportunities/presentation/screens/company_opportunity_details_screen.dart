import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/config/app_config.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/utils/date_formats.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../companies/data/company_workspace_mock.dart';
import '../../../companies/data/my_company_data.dart';
import '../../../companies/presentation/controllers/company_workspace_providers.dart';
import '../../../companies/presentation/widgets/company_widgets.dart';
import '../../../supplier_responses/presentation/widgets/supplier_widgets.dart';
import '../../data/company_opportunities_data.dart';
import '../../domain/opportunity.dart';
import '../widgets/opportunity_widgets.dart';

/// A company's own listing: content, publishing status and the next step
/// it may take, plus its applicants or supplier responses.
class CompanyOpportunityDetailsScreen extends ConsumerWidget {
  const CompanyOpportunityDetailsScreen({
    super.key,
    required this.opportunityId,
  });

  final String opportunityId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final value = ref.watch(myCompanyOpportunityProvider(opportunityId));

    return BOHScaffold(
      appBar: BOHAppBar(
        title: value.value?.type.label(l10n) ?? l10n.directoryOpportunities,
        actions: [
          if (value.value case final o?
              when OpportunityLifecycle.isEditable(o.status) ||
                  (o.revision != null &&
                      OpportunityLifecycle.isEditable(o.revision!.status)))
            BOHIconButton(
              icon: AppIcons.edit,
              semanticLabel: l10n.actionEdit,
              onPressed: () =>
                  context.push(AppRoutes.companyEditOpportunity(o.id)),
            ),
        ],
      ),
      bottomNavigationBar: switch (value) {
        AsyncData(value: final o) => _Actions(opportunity: o),
        _ => null,
      },
      body: AsyncBody<Opportunity>(
        value: value,
        onRetry: () =>
            ref.invalidate(myCompanyOpportunityProvider(opportunityId)),
        data: (o) => _Body(opportunity: o),
      ),
    );
  }
}

class _Body extends StatelessWidget {
  const _Body({required this.opportunity});

  final Opportunity opportunity;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final o = opportunity;
    final supplier = o.type == OpportunityType.supplierRequest;
    final closes = o.closesAt;

    return ListView(
      padding: BOHScaffold.screenPadding.add(
        const EdgeInsets.only(top: AppSpacing.s8, bottom: AppSpacing.s32),
      ),
      children: [
        BOHCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              OpportunityStatusPill(o.status),
              const SizedBox(height: AppSpacing.s12),
              Semantics(
                header: true,
                child: Text(
                  o.title.isEmpty ? l10n.companyUntitled : o.title,
                  style: context.text.h1,
                ),
              ),
              const SizedBox(height: AppSpacing.s8),
              Text(
                [
                  opportunityTerms(
                    l10n,
                    type: o.type,
                    employment: o.employment,
                    duration: o.duration,
                  ),
                  if (o.city.isNotEmpty) o.city,
                  ?o.compensation,
                ].join(' · '),
                style: context.text.bodySmall,
              ),
              if (closes != null) ...[
                const SizedBox(height: AppSpacing.s4),
                Text(
                  l10n.opportunityClosesOn(
                    AppDateFormats.mediumDate(context).format(closes),
                  ),
                  style: context.text.caption,
                ),
              ],
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.s12),
        BOHInfoNote(_statusNote(context, o.status), icon: o.status.icon),
        if (o.reviewerNote case final note?) ...[
          const SizedBox(height: AppSpacing.s12),
          SectionCard(
            icon: AppIcons.edit,
            title: l10n.companyReviewerNote,
            child: Text(note, style: context.text.body),
          ),
        ],
        if (o.revision case final revision?) ...[
          const SizedBox(height: AppSpacing.s12),
          SectionCard(
            icon: AppIcons.clock,
            title: l10n.companyPendingUpdate,
            trailing: OpportunityStatusPill(revision.status),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(switch (revision.status) {
                  OpportunityStatus.inReview => l10n.companyUpdateNoteInReview,
                  OpportunityStatus.changesRequested =>
                    l10n.companyUpdateNoteChangesRequested,
                  _ => l10n.companyUpdateNoteDraft,
                }, style: context.text.bodySmall),
                if (revision.reviewerNote case final note?) ...[
                  const SizedBox(height: AppSpacing.s8),
                  Text(l10n.companyReviewerNote, style: context.text.caption),
                  Text(note, style: context.text.body),
                ],
              ],
            ),
          ),
        ],
        if (o.status == OpportunityStatus.published ||
            o.status == OpportunityStatus.closed) ...[
          const SizedBox(height: AppSpacing.s12),
          BOHCard(
            padding: EdgeInsets.zero,
            child: BOHListTile(
              leading: BOHIconCircle(
                icon: supplier
                    ? AppIcons.supplierRequests
                    : AppIcons.applicants,
                rounded: true,
              ),
              title: supplier
                  ? l10n.supplierResponsesCount(o.applicants)
                  : l10n.opportunityApplicants(o.applicants),
              subtitle: supplier
                  ? l10n.supplierReviewResponses
                  : l10n.companyReviewApplicants,
              showChevron: true,
              onTap: () => context.push(
                supplier
                    ? AppRoutes.companySupplierRequest(o.id)
                    : AppRoutes.companyApplicants(o.id),
              ),
            ),
          ),
        ],
        if (supplier && o.supplierTypes.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.s12),
          SectionCard(
            icon: AppIcons.supplierRequests,
            title: l10n.companySupplierTypes,
            child: SupplierTypesWrap(types: o.supplierTypes),
          ),
        ],
        if (o.summary.isNotEmpty || o.description.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.s12),
          SectionCard(
            icon: AppIcons.report,
            title: l10n.opportunityOverview,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (o.summary.isNotEmpty)
                  Text(o.summary, style: context.text.label),
                if (o.description.isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.s8),
                  Text(o.description, style: context.text.body),
                ],
              ],
            ),
          ),
        ],
        if (o.responsibilities.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.s12),
          SectionCard(
            icon: AppIcons.check,
            title: l10n.opportunityResponsibilities,
            child: Bulleted(items: o.responsibilities),
          ),
        ],
        if (o.requirements.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.s12),
          SectionCard(
            icon: AppIcons.level,
            title: l10n.opportunityRequirements,
            child: Bulleted(items: o.requirements),
          ),
        ],
        if (o.skills.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.s12),
          SectionCard(
            icon: AppIcons.technology,
            title: l10n.opportunitySkills,
            child: Wrap(
              spacing: AppSpacing.s8,
              runSpacing: AppSpacing.s8,
              children: [
                for (final s in o.skills)
                  BOHTag(s, variant: BOHTagVariant.outline),
              ],
            ),
          ),
        ],
      ],
    );
  }

  String _statusNote(BuildContext context, OpportunityStatus status) {
    final l10n = context.l10n;
    return switch (status) {
      OpportunityStatus.draft => l10n.companyStatusNoteDraft,
      OpportunityStatus.inReview => l10n.companyStatusNoteInReview,
      OpportunityStatus.changesRequested =>
        l10n.companyStatusNoteChangesRequested,
      OpportunityStatus.published => l10n.companyStatusNotePublished,
      _ => l10n.companyStatusNoteClosed,
    };
  }
}

/// The company's next lifecycle step, straight from [OpportunityLifecycle].
class _Actions extends ConsumerWidget {
  const _Actions({required this.opportunity});

  final Opportunity opportunity;

  Future<void> _run(
    BuildContext context,
    WidgetRef ref,
    Future<Opportunity> Function() action,
    String success,
  ) async {
    final ok = await runCompanyAction(context, action, success: success);
    if (ok) {
      ref
        ..invalidate(myCompanyOpportunityProvider(opportunity.id))
        ..invalidate(myCompanyOpportunitiesProvider);
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final repo = ref.read(companyOpportunitiesRepositoryProvider);
    final o = opportunity;
    const company = OpportunityActor.company;
    bool can(OpportunityStatus to) =>
        OpportunityLifecycle.canTransition(o.status, to, company);

    final revision = o.revision;
    final buttons = <Widget>[
      // A pending update has its own review; the live listing stays up.
      if (revision != null &&
          OpportunityLifecycle.isEditable(revision.status)) ...[
        BOHButton(
          label: l10n.companySubmitUpdate,
          trailingIcon: null,
          onPressed: () => _run(
            context,
            ref,
            () => repo.submitRevisionForReview(o.id),
            l10n.companyUpdateSubmitted,
          ),
        ),
        BOHButton(
          label: l10n.companyEditUpdate,
          variant: BOHButtonVariant.secondary,
          trailingIcon: null,
          onPressed: () => context.push(AppRoutes.companyEditOpportunity(o.id)),
        ),
      ],
      if (OpportunityLifecycle.canStartRevision(o))
        BOHButton(
          label: l10n.companyProposeChanges,
          variant: BOHButtonVariant.secondary,
          trailingIcon: null,
          onPressed: () async {
            final ok = await runCompanyAction(
              context,
              () => repo.startRevision(o.id),
              success: l10n.companyUpdateStarted,
            );
            if (!ok || !context.mounted) return;
            ref
              ..invalidate(myCompanyOpportunityProvider(o.id))
              ..invalidate(myCompanyOpportunitiesProvider);
            await context.push(AppRoutes.companyEditOpportunity(o.id));
          },
        ),
      if (can(OpportunityStatus.inReview))
        BOHButton(
          label: l10n.companySubmitForReview,
          trailingIcon: null,
          onPressed: () async {
            final company = ref.read(companyMembershipProvider)?.company;
            if (company == null) return;
            final issues = OpportunityDraft.of(o).validate(company);
            if (issues.isNotEmpty) {
              ScaffoldMessenger.of(context)
                ..hideCurrentSnackBar()
                ..showSnackBar(
                  SnackBar(content: Text(l10n.companyDraftIncomplete)),
                );
              return;
            }
            await _run(
              context,
              ref,
              () => repo.submitForReview(o.id),
              l10n.companySubmittedForReview,
            );
          },
        ),
      if (can(OpportunityStatus.draft))
        BOHButton(
          label: l10n.companyReturnToDraft,
          variant: BOHButtonVariant.secondary,
          trailingIcon: null,
          onPressed: () => _run(
            context,
            ref,
            () => repo.returnToDraft(o.id),
            l10n.companyReturnedToDraft,
          ),
        ),
      // Development only: stands in for Back Of House's review, of the
      // listing or of its pending update.
      if ((o.status == OpportunityStatus.inReview ||
              revision?.status == OpportunityStatus.inReview) &&
          AppConfig.useMockData &&
          !AppConfig.environment.isProd) ...[
        BOHButton(
          label: l10n.companySimulateApproval,
          variant: BOHButtonVariant.ghost,
          trailingIcon: null,
          onPressed: () => _run(
            context,
            ref,
            () => ref
                .read(companyWorkspaceMockProvider)
                .completeReview(o.id, approve: true),
            l10n.companyPublished,
          ),
        ),
        BOHButton(
          label: l10n.companySimulateChangesRequested,
          variant: BOHButtonVariant.ghost,
          trailingIcon: null,
          onPressed: () => _run(
            context,
            ref,
            () => ref
                .read(companyWorkspaceMockProvider)
                .completeReview(
                  o.id,
                  approve: false,
                  note: l10n.companySimulateNote,
                ),
            l10n.companyChangesRequestedRecorded,
          ),
        ),
      ],
      if (can(OpportunityStatus.closed))
        BOHButton(
          label: l10n.companyCloseOpportunity,
          variant: BOHButtonVariant.ghost,
          trailingIcon: null,
          onPressed: () async {
            final confirmed = await confirmCompanyAction(
              context,
              title: l10n.companyCloseTitle,
              message: l10n.companyCloseBody,
              action: l10n.companyCloseOpportunity,
            );
            if (!confirmed || !context.mounted) return;
            await _run(
              context,
              ref,
              () => repo.close(o.id),
              l10n.companyClosed,
            );
          },
        ),
    ];
    if (buttons.isEmpty) return const SizedBox.shrink();
    return BOHActionBar(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          for (final (i, b) in buttons.indexed) ...[
            if (i > 0) const SizedBox(height: AppSpacing.s8),
            b,
          ],
        ],
      ),
    );
  }
}
