import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../auth/domain/account_type.dart';
import '../../../discover/presentation/controllers/discover_providers.dart';
import '../../domain/opportunity.dart';
import '../controllers/opportunities_providers.dart';
import '../widgets/opportunity_widgets.dart';

/// Opportunities the signed-in account can act on, best match first. The
/// type chips come from the domain, so individuals never see supplier
/// requests.
class OpportunitiesScreen extends ConsumerStatefulWidget {
  const OpportunitiesScreen({super.key});

  @override
  ConsumerState<OpportunitiesScreen> createState() =>
      _OpportunitiesScreenState();
}

class _OpportunitiesScreenState extends ConsumerState<OpportunitiesScreen> {
  OpportunityType? _type;
  String _query = '';

  OpportunitiesQuery get _key => (type: _type, query: _query);

  bool get _filtering => _type != null || _query.trim().isNotEmpty;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    final account = ref.watch(accountTypeProvider);
    final types = OpportunityType.visibleTo(OpportunityAudience.of(account));
    final opportunities = ref.watch(opportunitiesProvider(_key));
    final active = ref.watch(directoryCountsProvider).value?.opportunities;

    return BOHScaffold(
      appBar: BOHAppBar(
        title: l10n.directoryOpportunities,
        actions: [
          if (account == AccountType.individual)
            BOHIconButton(
              icon: AppIcons.job,
              semanticLabel: l10n.applicationsTitle,
              onPressed: () => context.push(AppRoutes.applications),
            ),
        ],
      ),
      body: BOHRefresh(
        onRefresh: () =>
            ref.read(opportunitiesProvider(_key).notifier).refresh(),
        child: CustomScrollView(
          slivers: [
            BOHSliverPadding(
              top: AppSpacing.s8,
              sliver: SliverToBoxAdapter(
                child: BOHSearchField(
                  hint: l10n.opportunitiesSearchHint,
                  onChanged: (q) => setState(() => _query = q),
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: BOHFilterChips<OpportunityType?>(
                options: [null, ...types],
                selected: _type,
                label: (t) => t?.label(l10n) ?? l10n.filterAll,
                onSelected: (t) => setState(() => _type = t),
              ),
            ),
            BOHSliverPadding(
              top: AppSpacing.s4,
              sliver: BOHPagedSliverList<Opportunity>(
                state: opportunities,
                skeleton: const OpportunityListSkeleton(),
                emptyIcon: AppIcons.opportunities,
                emptyTitle: l10n.opportunitiesEmptyTitle,
                emptyMessage: l10n.opportunitiesEmptyMessage,
                onLoadMore: () =>
                    ref.read(opportunitiesProvider(_key).notifier).loadMore(),
                onRetry: () => ref.invalidate(opportunitiesProvider(_key)),
                itemBuilder: (context, o, i) {
                  void open() => context.push(AppRoutes.opportunity(o.id));
                  if (i == 0 && !_filtering && o.matchScore != null) {
                    return BOHFadeSlide(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          BOHSectionHeader(
                            title: l10n.opportunitiesRecommended,
                          ),
                          OpportunityCard(
                            opportunity: o,
                            showReasons: true,
                            onTap: open,
                          ),
                          const SizedBox(height: AppSpacing.sectionSpacing),
                          BOHSectionHeader(
                            title: l10n.opportunitiesOpen,
                            trailing: active == null
                                ? null
                                : Text(
                                    l10n.directoryOpportunitiesCount('$active'),
                                    style: context.text.labelMedium.copyWith(
                                      color: c.textSecondary,
                                    ),
                                  ),
                          ),
                        ],
                      ),
                    );
                  }
                  return BOHFadeSlide(
                    delay: BOHFadeSlide.stagger(i),
                    child: Padding(
                      padding: const EdgeInsets.only(bottom: AppSpacing.s10),
                      child: OpportunityRowCard(opportunity: o, onTap: open),
                    ),
                  );
                },
              ),
            ),
            const BOHSliverBottomSpacer(),
          ],
        ),
      ),
    );
  }
}
