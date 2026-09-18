import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../opportunities/domain/opportunity.dart';
import '../../../opportunities/presentation/screens/company_opportunities_screen.dart';
import '../company_labels.dart';
import '../controllers/company_workspace_providers.dart';
import '../widgets/company_widgets.dart';

/// The company's home tab and the door to its workspace: listing counts,
/// then one tile per area — opportunities, supplier requests, portfolio and
/// a new listing — then what is live. No analytics.
class CompanyDashboardScreen extends ConsumerWidget {
  const CompanyDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final company = ref.watch(myCompanyProvider).value;
    final opportunities = ref.watch(myCompanyOpportunitiesProvider);
    final invited = ref.watch(invitedSupplierRequestsProvider).value;
    final projects = ref.watch(myCompanyProjectsProvider).value;

    return BOHScaffold(
      appBar: BOHAppBar.brand(title: l10n.companyNavDashboard),
      body: BOHRefresh(
        onRefresh: () async {
          ref
            ..invalidate(myCompanyProvider)
            ..invalidate(myCompanyOpportunitiesProvider)
            ..invalidate(invitedSupplierRequestsProvider)
            ..invalidate(myCompanyProjectsProvider);
          await ref.read(myCompanyOpportunitiesProvider.future);
        },
        child: ListView(
          padding: BOHScaffold.screenPadding.add(
            EdgeInsets.only(
              top: AppSpacing.s12,
              bottom: MediaQuery.paddingOf(context).bottom + AppSpacing.s32,
            ),
          ),
          children: [
            if (company != null) ...[
              Row(
                children: [
                  BOHIconCircle(
                    icon: company.type.icon,
                    size: 48,
                    rounded: true,
                  ),
                  const SizedBox(width: AppSpacing.s12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Semantics(
                          header: true,
                          child: Text(company.name, style: context.text.h2),
                        ),
                        Text(
                          company.type.label(l10n),
                          style: context.text.bodySmall,
                        ),
                      ],
                    ),
                  ),
                  if (company.verified)
                    BOHTag(l10n.verifiedLabel, variant: BOHTagVariant.verified),
                ],
              ),
              const SizedBox(height: AppSpacing.s16),
            ],
            AsyncBody<List<Opportunity>>(
              value: opportunities,
              onRetry: () => ref.invalidate(myCompanyOpportunitiesProvider),
              data: (all) {
                int count(OpportunityStatus s) =>
                    all.where((o) => o.status == s).length;
                final published = all
                    .where((o) => o.status == OpportunityStatus.published)
                    .toList();
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    IntrinsicHeight(
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Expanded(
                            child: _Stat(
                              label: l10n.opportunityStatusPublished,
                              value: count(OpportunityStatus.published),
                              icon: AppIcons.success,
                            ),
                          ),
                          const SizedBox(width: AppSpacing.s8),
                          Expanded(
                            child: _Stat(
                              label: l10n.opportunityStatusInReview,
                              value: count(OpportunityStatus.inReview),
                              icon: AppIcons.clock,
                            ),
                          ),
                          const SizedBox(width: AppSpacing.s8),
                          Expanded(
                            child: _Stat(
                              label: l10n.opportunityStatusDraft,
                              value: count(OpportunityStatus.draft),
                              icon: AppIcons.edit,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sectionSpacing),
                    BOHSectionHeader(title: l10n.companyWorkspace),
                    const SizedBox(height: AppSpacing.s12),
                    _WorkspaceGrid(
                      tiles: [
                        BOHFeatureTile(
                          icon: AppIcons.opportunities,
                          title: l10n.companyMyOpportunities,
                          subtitle: l10n.companyListingsCount(all.length),
                          onTap: () =>
                              context.push(AppRoutes.companyOpportunities),
                        ),
                        BOHFeatureTile(
                          icon: AppIcons.supplierRequests,
                          tone: BOHIconCircleTone.success,
                          title: l10n.companyNavSupplierRequests,
                          subtitle: invited == null
                              ? l10n.supplierRequestsSubtitle
                              : l10n.supplierInvitedCount(invited.length),
                          onTap: () =>
                              context.push(AppRoutes.companySupplierRequests),
                        ),
                        BOHFeatureTile(
                          icon: AppIcons.workshop,
                          tone: BOHIconCircleTone.neutral,
                          title: l10n.companyNavPortfolio,
                          subtitle: projects == null
                              ? l10n.companyPortfolioSubtitle
                              : l10n.companyProjectsCount(projects.length),
                          onTap: () => context.push(AppRoutes.companyPortfolio),
                        ),
                        BOHFeatureTile(
                          icon: AppIcons.plus,
                          title: l10n.companyCreateOpportunity,
                          subtitle: l10n.companyCreateOpportunityShort,
                          onTap: () =>
                              context.push(AppRoutes.companyNewOpportunity),
                        ),
                      ],
                    ),
                    const SizedBox(height: AppSpacing.sectionSpacing),
                    BOHSectionHeader(
                      title: l10n.companyLiveOpportunities,
                      actionLabel: l10n.actionViewAll,
                      onAction: () =>
                          context.push(AppRoutes.companyOpportunities),
                    ),
                    const SizedBox(height: AppSpacing.s8),
                    if (published.isEmpty)
                      BOHInfoNote(l10n.companyNoLiveOpportunities)
                    else
                      for (final o in published.take(3))
                        Padding(
                          padding: const EdgeInsets.only(
                            bottom: AppSpacing.s12,
                          ),
                          child: CompanyOpportunityTile(opportunity: o),
                        ),
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.label, required this.value, required this.icon});

  final String label;
  final int value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return BOHCard(
      padding: const EdgeInsets.all(AppSpacing.s12),
      child: MergeSemantics(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, size: AppSizes.iconSmall, color: c.primaryText),
            const SizedBox(height: AppSpacing.s8),
            Text('$value', style: context.text.h2),
            Text(
              label,
              style: context.text.caption,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ],
        ),
      ),
    );
  }
}

/// Two tiles per row, each row as tall as its tallest tile.
class _WorkspaceGrid extends StatelessWidget {
  const _WorkspaceGrid({required this.tiles});

  final List<Widget> tiles;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        for (var row = 0; row < tiles.length; row += 2) ...[
          if (row > 0) const SizedBox(height: AppSpacing.s12),
          IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(child: tiles[row]),
                const SizedBox(width: AppSpacing.s12),
                Expanded(
                  child: row + 1 < tiles.length
                      ? tiles[row + 1]
                      : const SizedBox.shrink(),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}
