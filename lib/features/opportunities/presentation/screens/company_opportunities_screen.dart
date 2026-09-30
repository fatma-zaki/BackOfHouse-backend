import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/utils/date_formats.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../companies/presentation/controllers/company_workspace_providers.dart';
import '../../../companies/presentation/widgets/company_widgets.dart';
import '../../domain/opportunity.dart';
import '../widgets/opportunity_widgets.dart';

enum _Filter { all, published, inReview, changesRequested, draft, closed }

/// The company's own listings in every publishing state (Listings tab).
class CompanyOpportunitiesScreen extends ConsumerStatefulWidget {
  const CompanyOpportunitiesScreen({super.key});

  @override
  ConsumerState<CompanyOpportunitiesScreen> createState() =>
      _CompanyOpportunitiesScreenState();
}

class _CompanyOpportunitiesScreenState
    extends ConsumerState<CompanyOpportunitiesScreen> {
  _Filter _filter = _Filter.all;

  bool _matches(Opportunity o, _Filter f) => switch (f) {
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

    return BOHScaffold(
      appBar: BOHAppBar.tab(
        title: l10n.companyListingsTitle,
        actions: [
          BOHIconButton(
            icon: AppIcons.plus,
            semanticLabel: l10n.companyNewListing,
            variant: BOHIconButtonVariant.filled,
            onPressed: () => context.push(AppRoutes.companyNewOpportunity),
          ),
        ],
      ),
      body: AsyncBody<List<Opportunity>>(
        value: ref.watch(myCompanyOpportunitiesProvider),
        onRetry: () => ref.invalidate(myCompanyOpportunitiesProvider),
        data: (all) {
          String label(_Filter f) => switch (f) {
            _Filter.all => l10n.filterAllCount(all.length),
            _Filter.draft => l10n.companyFilterDrafts,
            _Filter.changesRequested => l10n.companyFilterChanges,
            _Filter.inReview => l10n.opportunityStatusInReview,
            _Filter.published => l10n.opportunityStatusPublished,
            _Filter.closed => l10n.opportunityStatusClosed,
          };
          final visible = all.where((o) => _matches(o, _filter)).toList();

          return BOHRefresh(
            onRefresh: () => ref.refresh(myCompanyOpportunitiesProvider.future),
            child: ListView(
              padding: EdgeInsets.only(
                top: AppSpacing.s4,
                bottom: MediaQuery.paddingOf(context).bottom + AppSpacing.s32,
              ),
              children: [
                BOHFilterChips<_Filter>(
                  options: _Filter.values,
                  selected: _filter,
                  label: label,
                  padding: BOHScaffold.screenPadding,
                  onSelected: (f) => setState(() => _filter = f),
                ),
                const SizedBox(height: AppSpacing.s8),
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
                            actionLabel: l10n.companyNewListing,
                            onAction: () =>
                                context.push(AppRoutes.companyNewOpportunity),
                          ),
                        )
                      else
                        for (final o in visible)
                          Padding(
                            padding: const EdgeInsets.only(
                              bottom: AppSpacing.gridGap,
                            ),
                            child: CompanyOpportunityTile(opportunity: o),
                          ),
                      const SizedBox(height: AppSpacing.s4),
                      Text(
                        l10n.companyReviewNote,
                        textAlign: TextAlign.center,
                        style: context.text.caption,
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

/// A listing: type tag and status, title, terms, then its applicants and
/// the next action for its state.
class CompanyOpportunityTile extends StatelessWidget {
  const CompanyOpportunityTile({super.key, required this.opportunity});

  final Opportunity opportunity;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    final o = opportunity;
    final supplier = o.type == OpportunityType.supplierRequest;
    // A pending update is what needs attention on a live listing.
    final status = o.revision?.status == OpportunityStatus.changesRequested
        ? OpportunityStatus.changesRequested
        : o.status;
    final closesAt = o.closesAt;
    final terms = [
      opportunityTerms(
        l10n,
        type: o.type,
        employment: o.employment,
        duration: o.duration,
      ),
      if (o.city.isNotEmpty) o.city,
      if (closesAt != null && status == OpportunityStatus.published)
        l10n.opportunityClosesOn(
          AppDateFormats.monthDayShort(context).format(closesAt),
        ),
    ].join(' · ');

    void open() => context.push(AppRoutes.companyOpportunity(o.id));
    final (String action, VoidCallback onAction) = switch (status) {
      OpportunityStatus.published when !supplier => (
        l10n.companyListingApplicants,
        () => context.push(AppRoutes.companyApplicants(o.id)),
      ),
      OpportunityStatus.changesRequested => (
        l10n.companyListingEdit,
        () => context.push(
          o.status == OpportunityStatus.published
              ? AppRoutes.companyOpportunity(o.id)
              : AppRoutes.companyEditOpportunity(o.id),
        ),
      ),
      OpportunityStatus.draft => (
        l10n.companyListingContinue,
        () => context.push(AppRoutes.companyEditOpportunity(o.id)),
      ),
      _ => (l10n.companyListingView, open),
    };

    final meta = switch (status) {
      OpportunityStatus.published =>
        supplier
            ? l10n.supplierResponsesCount(o.applicants)
            : l10n.opportunityApplicants(o.applicants),
      OpportunityStatus.inReview => l10n.companyListingNotLive,
      _ => '—',
    };

    return BOHCard(
      onTap: open,
      tone: status == OpportunityStatus.changesRequested
          ? BOHCardTone.warning
          : BOHCardTone.normal,
      semanticLabel: [
        o.title.isEmpty ? l10n.companyUntitled : o.title,
        status.label(l10n),
        terms,
      ].join('. '),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              BOHTag(o.type.label(l10n), variant: BOHTagVariant.soft),
              const Spacer(),
              OpportunityStatusPill(status),
            ],
          ),
          const SizedBox(height: AppSpacing.s8),
          Text(
            o.title.isEmpty ? l10n.companyUntitled : o.title,
            style: context.text.cardTitle,
          ),
          const SizedBox(height: 2),
          Text(terms, style: context.text.bodySmall),
          const SizedBox(height: AppSpacing.s10),
          BOHCardFooter(
            leading: Row(
              children: [
                if (status == OpportunityStatus.published) ...[
                  Icon(AppIcons.people, size: 14, color: c.textSecondary),
                  const SizedBox(width: AppSpacing.s4),
                ],
                Flexible(
                  child: Text(
                    meta,
                    style: context.text.bodySmall,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
            trailing: BOHLinkButton(
              label: action,
              fontSize: 12,
              color: status == OpportunityStatus.changesRequested
                  ? c.statusWarning.foreground
                  : null,
              onTap: onAction,
            ),
          ),
        ],
      ),
    );
  }
}
