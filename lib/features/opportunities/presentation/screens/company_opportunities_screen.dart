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
import '../../domain/opportunity.dart';
import '../widgets/opportunity_widgets.dart';

enum _Filter { all, draft, changesRequested, inReview, published, closed }

/// The company's own listings in every publishing state.
class CompanyOpportunitiesScreen extends ConsumerStatefulWidget {
  const CompanyOpportunitiesScreen({super.key});

  @override
  ConsumerState<CompanyOpportunitiesScreen> createState() =>
      _CompanyOpportunitiesScreenState();
}

class _CompanyOpportunitiesScreenState
    extends ConsumerState<CompanyOpportunitiesScreen> {
  _Filter _filter = _Filter.all;

  bool _matches(Opportunity o) => switch (_filter) {
    _Filter.all => true,
    _Filter.draft => o.status == OpportunityStatus.draft,
    _Filter.changesRequested =>
      o.status == OpportunityStatus.changesRequested ||
          o.revision?.status == OpportunityStatus.changesRequested,
    _Filter.inReview => o.status == OpportunityStatus.inReview,
    _Filter.published => o.status == OpportunityStatus.published,
    _Filter.closed =>
      o.status == OpportunityStatus.closed ||
          o.status == OpportunityStatus.archived ||
          o.status == OpportunityStatus.paused,
  };

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    String label(_Filter f) => switch (f) {
      _Filter.all => l10n.filterAll,
      _Filter.draft => l10n.opportunityStatusDraft,
      _Filter.changesRequested => l10n.opportunityStatusChangesRequested,
      _Filter.inReview => l10n.opportunityStatusInReview,
      _Filter.published => l10n.opportunityStatusPublished,
      _Filter.closed => l10n.opportunityStatusClosed,
    };

    return BOHScaffold(
      appBar: BOHAppBar(
        title: l10n.companyMyOpportunities,
        actions: [
          BOHIconButton(
            icon: AppIcons.plus,
            semanticLabel: l10n.companyCreateOpportunity,
            onPressed: () => context.push(AppRoutes.companyNewOpportunity),
          ),
        ],
      ),
      body: AsyncBody<List<Opportunity>>(
        value: ref.watch(myCompanyOpportunitiesProvider),
        onRetry: () => ref.invalidate(myCompanyOpportunitiesProvider),
        data: (all) {
          final visible = all.where(_matches).toList();
          return BOHRefresh(
            onRefresh: () => ref.refresh(myCompanyOpportunitiesProvider.future),
            child: ListView(
              padding: EdgeInsets.only(
                top: AppSpacing.s8,
                bottom: MediaQuery.paddingOf(context).bottom + AppSpacing.s32,
              ),
              children: [
                Padding(
                  padding: BOHScaffold.screenPadding,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      BOHPageHeader(
                        title: l10n.companyMyOpportunities,
                        subtitle: l10n.companyOpportunitiesSubtitle,
                      ),
                      const SizedBox(height: AppSpacing.s12),
                      BOHInfoNote(
                        l10n.companyReviewNote,
                        icon: AppIcons.shield,
                      ),
                    ],
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
                      for (final f in _Filter.values)
                        Padding(
                          padding: const EdgeInsetsDirectional.only(
                            end: AppSpacing.s8,
                          ),
                          child: BOHCategoryChip(
                            label: label(f),
                            selected: _filter == f,
                            onSelected: () => setState(() => _filter = f),
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
                          height: 300,
                          child: BOHEmptyState(
                            icon: AppIcons.opportunities,
                            title: l10n.companyOpportunitiesEmptyTitle,
                            message: l10n.companyOpportunitiesEmptyMessage,
                            actionLabel: l10n.companyCreateOpportunity,
                            onAction: () =>
                                context.push(AppRoutes.companyNewOpportunity),
                          ),
                        )
                      else
                        for (final o in visible)
                          Padding(
                            padding: const EdgeInsets.only(
                              bottom: AppSpacing.s12,
                            ),
                            child: CompanyOpportunityTile(opportunity: o),
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

class CompanyOpportunityTile extends StatelessWidget {
  const CompanyOpportunityTile({super.key, required this.opportunity});

  final Opportunity opportunity;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final o = opportunity;
    final supplier = o.type == OpportunityType.supplierRequest;
    return WorkspaceTile(
      onTap: () => context.push(AppRoutes.companyOpportunity(o.id)),
      leading: BOHIconCircle(icon: o.type.icon, size: 40, rounded: true),
      title: o.title.isEmpty ? l10n.companyUntitled : o.title,
      subtitle: [
        opportunityTerms(
          l10n,
          type: o.type,
          employment: o.employment,
          duration: o.duration,
        ),
        if (o.city.isNotEmpty) o.city,
      ].join(' · '),
      caption: o.status == OpportunityStatus.published
          ? (supplier
                ? l10n.supplierResponsesCount(o.applicants)
                : l10n.opportunityApplicants(o.applicants))
          : null,
      trailing: OpportunityStatusPill(
        // A pending update is what needs attention on a live listing.
        o.revision?.status == OpportunityStatus.changesRequested
            ? OpportunityStatus.changesRequested
            : o.status,
      ),
    );
  }
}
