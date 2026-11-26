import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_radii.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/l10n_messages.dart';
import '../../../../core/utils/date_formats.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../applications/domain/application.dart';
import '../../../opportunities/domain/opportunity.dart';
import '../../domain/company.dart';
import '../controllers/company_workspace_providers.dart';

/// The company's home tab: a greeting with "New listing", the basic
/// workspace counts, anything Back Of House sent back for changes, and the
/// newest applicants. No advanced analytics.
class CompanyDashboardScreen extends ConsumerWidget {
  const CompanyDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final company = ref.watch(myCompanyProvider).value;
    final stats = ref.watch(myCompanyStatsProvider);
    final opportunities = ref.watch(myCompanyOpportunitiesProvider).value;
    final changes = opportunities
        ?.where((o) => o.status == OpportunityStatus.changesRequested)
        .firstOrNull;

    return BOHScaffold(
      appBar: company == null
          ? BOHAppBar.tab(title: l10n.companyNavDashboard)
          : BOHAppBar.company(
              title: company.name,
              subtitle: l10n.companyWorkspaceSubtitle,
              verified: company.verified,
              leading: BOHCompanyLogo(name: company.name, size: 40),
            ),
      body: BOHRefresh(
        onRefresh: () async {
          ref
            ..invalidate(myCompanyProvider)
            ..invalidate(myCompanyStatsProvider)
            ..invalidate(myCompanyOpportunitiesProvider)
            ..invalidate(recentApplicantsProvider);
          await ref.read(myCompanyStatsProvider.future);
        },
        child: ListView(
          padding: BOHScaffold.screenPadding.add(
            EdgeInsets.only(
              top: AppSpacing.s8,
              bottom: MediaQuery.paddingOf(context).bottom + AppSpacing.s32,
            ),
          ),
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: Padding(
                    padding: const EdgeInsetsDirectional.only(
                      start: AppSpacing.s4,
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          AppDateFormats.weekdayDayMonth(context)
                              .format(DateTime.now()),
                          style: context.text.labelMedium.copyWith(
                            color: context.colors.textSecondary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        Semantics(
                          header: true,
                          child: Text(
                            l10n.companyWelcomeBack,
                            style: context.text.title,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                BOHButton(
                  label: l10n.companyNewListing,
                  size: BOHButtonSize.small,
                  leadingIcon: AppIcons.plus,
                  trailingIcon: null,
                  expand: false,
                  onPressed: () =>
                      context.push(AppRoutes.companyNewOpportunity),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.s16),
            switch (stats) {
              AsyncData(:final value) => _StatsGrid(stats: value),
              AsyncError(:final error) => SizedBox(
                height: 200,
                child: BOHErrorState(
                  error: error,
                  onRetry: () => ref.invalidate(myCompanyStatsProvider),
                ),
              ),
              _ => const BOHShimmer(
                child: BOHSkeleton(
                  height: 220,
                  borderRadius: AppRadii.largeAll,
                ),
              ),
            },
            if (changes != null) ...[
              const SizedBox(height: AppSpacing.s16),
              BOHAlertCard(
                title: l10n.companyChangesRequestedTitle(
                  AppDateFormats.isolate(changes.title),
                ),
                message: changes.reviewerNote ?? '',
                action: BOHLinkButton(
                  label: l10n.companyEditListing,
                  arrow: false,
                  fontSize: 12,
                  color: context.colors.statusWarning.foreground,
                  onTap: () => context.push(
                    AppRoutes.companyEditOpportunity(changes.id),
                  ),
                ),
              ),
            ],
            const SizedBox(height: AppSpacing.s16),
            BOHSectionHeader(
              title: l10n.companyRecentApplicants,
              size: BOHSectionSize.compact,
              actionArrow: false,
              onAction: () => context.go(AppRoutes.companyOpportunities),
            ),
            const SizedBox(height: AppSpacing.s8),
            const _RecentApplicants(),
          ],
        ),
      ),
    );
  }
}

class _StatsGrid extends StatelessWidget {
  const _StatsGrid({required this.stats});

  final CompanyStats stats;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final change = stats.profileViewsChangePercent;
    final tiles = [
      BOHStatTile(
        label: l10n.companyStatLiveListings,
        value: l10n.formatCount(stats.liveListings),
        onTap: () => context.go(AppRoutes.companyOpportunities),
      ),
      BOHStatTile(
        label: l10n.companyStatNewApplicants,
        value: l10n.formatCount(stats.newApplicants),
        delta: stats.newApplicantsThisWeek > 0
            ? l10n.companyStatThisWeek(stats.newApplicantsThisWeek)
            : null,
        highlight: true,
        onTap: () => context.go(AppRoutes.companyOpportunities),
      ),
      BOHStatTile(
        label: l10n.companyStatSupplierInvites,
        value: l10n.formatCount(stats.supplierInvites),
        onTap: () => context.go(AppRoutes.companySupplierRequests),
      ),
      BOHStatTile(
        label: l10n.companyStatProfileViews,
        value: l10n.formatCount(stats.profileViews),
        delta: change == null
            ? null
            : AppDateFormats.ltr(
                l10n.companyStatChange(change >= 0 ? '+' : '−', change.abs()),
              ),
      ),
    ];
    return Column(
      children: [
        for (var row = 0; row < tiles.length; row += 2) ...[
          if (row > 0) const SizedBox(height: AppSpacing.gridGap),
          IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Expanded(child: tiles[row]),
                const SizedBox(width: AppSpacing.gridGap),
                Expanded(child: tiles[row + 1]),
              ],
            ),
          ),
        ],
      ],
    );
  }
}

class _RecentApplicants extends ConsumerWidget {
  const _RecentApplicants();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final applicants = ref.watch(recentApplicantsProvider);
    return switch (applicants) {
      AsyncData(:final value) when value.isEmpty => BOHInfoNote(
        l10n.companyNoApplicantsYet,
      ),
      AsyncData(:final value) => BOHGroupedList(
        children: [for (final a in value.take(3)) _ApplicantRow(applicant: a)],
      ),
      AsyncError() => const SizedBox.shrink(),
      _ => const BOHShimmer(
        child: BOHSkeleton(height: 180, borderRadius: AppRadii.largeAll),
      ),
    };
  }
}

class _ApplicantRow extends StatelessWidget {
  const _ApplicantRow({required this.applicant});

  final ApplicantView applicant;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final a = applicant;
    final time = l10n.relativeTime(a.submittedAt);
    return BOHPressable(
      onTap: () => context.push(AppRoutes.companyApplicant(a.applicationId)),
      semanticLabel: '${a.applicant.name}. ${a.opportunityTitle}. $time',
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 11),
        child: Row(
          children: [
            BOHAvatar(name: a.applicant.name, dimension: 40),
            const SizedBox(width: AppSpacing.s12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(a.applicant.name, style: context.text.label),
                  Text(
                    a.opportunityTitle,
                    style: context.text.caption,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            Text(time, style: context.text.caption),
          ],
        ),
      ),
    );
  }
}
