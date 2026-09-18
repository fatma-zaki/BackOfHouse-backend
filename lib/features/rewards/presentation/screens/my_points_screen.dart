import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/utils/date_formats.dart';
import '../../../../core/widgets/widgets.dart';
import '../../domain/rewards_models.dart';
import '../controllers/rewards_providers.dart';
import '../widgets/points_widgets.dart';
import '../widgets/rewards_labels.dart';

class MyPointsScreen extends ConsumerStatefulWidget {
  const MyPointsScreen({super.key});

  @override
  ConsumerState<MyPointsScreen> createState() => _MyPointsScreenState();
}

class _MyPointsScreenState extends ConsumerState<MyPointsScreen> {
  PointsFilter _filter = PointsFilter.all;

  Future<void> _refresh() async {
    ref.invalidate(pointsSummaryProvider);
    await ref.read(pointsHistoryProvider(_filter).notifier).refresh();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final summary = ref.watch(pointsSummaryProvider);
    final history = ref.watch(pointsHistoryProvider(_filter));
    final dateFormat = AppDateFormats.mediumDate(context);

    return BOHScaffold(
      appBar: BOHAppBar(title: l10n.myPointsTitle),
      body: BOHRefresh(
        onRefresh: _refresh,
        child: CustomScrollView(
          slivers: [
            BOHSliverPadding(
              top: AppSpacing.s8,
              sliver: SliverToBoxAdapter(
                child: switch (summary) {
                  AsyncData(:final value) => Column(
                    children: [
                      PointsHeroCard.total(summary: value),
                      const SizedBox(height: AppSpacing.s16),
                      MemberLevelCard(summary: value, showProgress: true),
                    ],
                  ),
                  AsyncError(:final error) => SizedBox(
                    height: 280,
                    child: BOHErrorState(
                      error: error,
                      onRetry: () => ref.invalidate(pointsSummaryProvider),
                    ),
                  ),
                  _ => const BOHShimmer(
                    child: Column(
                      children: [
                        BOHSkeleton(height: 140),
                        SizedBox(height: AppSpacing.s16),
                        BOHSkeleton(height: 120),
                      ],
                    ),
                  ),
                },
              ),
            ),
            BOHSliverPadding(
              top: AppSpacing.s24,
              sliver: SliverToBoxAdapter(
                child: BOHSegmentedControl<PointsFilter>(
                  segments: [
                    for (final f in PointsFilter.values) (f, f.label(l10n)),
                  ],
                  selected: _filter,
                  onChanged: (f) => setState(() => _filter = f),
                ),
              ),
            ),
            BOHSliverPadding(
              top: AppSpacing.s24,
              sliver: SliverToBoxAdapter(
                child: Text(l10n.pointsHistoryTitle, style: context.text.h3),
              ),
            ),
            SliverPadding(
              padding: const EdgeInsetsDirectional.symmetric(
                horizontal: AppSpacing.s4,
                vertical: AppSpacing.s8,
              ),
              sliver: BOHPagedSliverList<PointsTransaction>(
                state: history,
                spacing: 0,
                emptyIcon: AppIcons.points,
                emptyTitle: l10n.pointsHistoryEmptyTitle,
                emptyMessage: l10n.pointsHistoryEmptyMessage,
                onLoadMore: () => ref
                    .read(pointsHistoryProvider(_filter).notifier)
                    .loadMore(),
                onRetry: () => ref.invalidate(pointsHistoryProvider(_filter)),
                itemBuilder: (context, t, _) => _TransactionTile(
                  transaction: t,
                  date: dateFormat.format(t.date),
                ),
              ),
            ),
            const BOHSliverBottomSpacer(),
          ],
        ),
      ),
    );
  }
}

class _TransactionTile extends StatelessWidget {
  const _TransactionTile({required this.transaction, required this.date});

  final PointsTransaction transaction;
  final String date;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final earned = transaction.isEarned;
    final amount = earned ? '+${transaction.points}' : '${transaction.points}';

    return BOHListTile(
      leading: BOHIconCircle(
        icon: transaction.activity.icon,
        tone: earned ? BOHIconCircleTone.brand : BOHIconCircleTone.neutral,
      ),
      title: transaction.activity.label(context.l10n),
      subtitle: transaction.detail,
      caption: date,
      trailing: Text(
        amount,
        textDirection: TextDirection.ltr,
        style: context.text.cardTitle.copyWith(
          color: earned ? c.success : c.textSecondary,
        ),
      ),
    );
  }
}
