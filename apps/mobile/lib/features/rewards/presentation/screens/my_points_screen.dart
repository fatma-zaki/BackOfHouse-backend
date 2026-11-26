import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/app_radii.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/l10n_messages.dart';
import '../../../../core/utils/date_formats.dart';
import '../../../../core/widgets/widgets.dart';
import '../../domain/rewards_models.dart';
import '../controllers/rewards_providers.dart';
import '../widgets/rewards_labels.dart';

/// Points history: balance, lifetime earned and spent, then every
/// transaction grouped by month.
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
    final items = history.value?.items ?? const <PointsTransaction>[];

    bool sameMonth(DateTime a, DateTime b) =>
        a.year == b.year && a.month == b.month;

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
                  AsyncData(:final value) => BOHStatStrip(
                    violet: true,
                    items: [
                      (
                        l10n.formatCount(value.balance),
                        l10n.pointsBalanceLabel,
                      ),
                      (l10n.formatCount(value.totalEarned), l10n.filterEarned),
                      (l10n.formatCount(value.totalSpent), l10n.filterRedeemed),
                    ],
                  ),
                  AsyncError(:final error) => SizedBox(
                    height: 200,
                    child: BOHErrorState(
                      error: error,
                      onRetry: () => ref.invalidate(pointsSummaryProvider),
                    ),
                  ),
                  _ => const BOHShimmer(
                    child: BOHSkeleton(
                      height: 76,
                      borderRadius: AppRadii.largeAll,
                    ),
                  ),
                },
              ),
            ),
            BOHSliverPadding(
              top: AppSpacing.s16,
              sliver: SliverToBoxAdapter(
                child: Semantics(
                  label: l10n.myPointsTitle,
                  child: BOHSegmentedControl<PointsFilter>(
                    segments: [
                      for (final f in PointsFilter.values) (f, f.label(l10n)),
                    ],
                    selected: _filter,
                    onChanged: (f) => setState(() => _filter = f),
                  ),
                ),
              ),
            ),
            BOHSliverPadding(
              top: AppSpacing.s16,
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
                itemBuilder: (context, t, i) {
                  final first = i == 0 || !sameMonth(items[i - 1].date, t.date);
                  final last =
                      i == items.length - 1 ||
                      !sameMonth(items[i + 1].date, t.date);
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      if (first)
                        Padding(
                          padding: EdgeInsets.only(
                            top: i == 0 ? 0 : AppSpacing.s16,
                            bottom: AppSpacing.s8,
                            left: AppSpacing.s4,
                            right: AppSpacing.s4,
                          ),
                          child: BOHEyebrow(
                            AppDateFormats.monthYearLong(context)
                                .format(t.date),
                            fontSize: 11,
                          ),
                        ),
                      _TransactionRow(transaction: t, first: first, last: last),
                    ],
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

/// One transaction inside its month's grouped card: rounded at the group's
/// ends, hairlines between rows.
class _TransactionRow extends StatelessWidget {
  const _TransactionRow({
    required this.transaction,
    required this.first,
    required this.last,
  });

  final PointsTransaction transaction;
  final bool first;
  final bool last;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    final t = transaction;
    final earned = t.isEarned;
    final amount = earned
        ? '+${l10n.formatCount(t.points)}'
        : '−${l10n.formatCount(-t.points)}';
    const r = Radius.circular(AppRadii.large);
    final date = AppDateFormats.monthDayShort(context).format(t.date);

    return MergeSemantics(
      child: CustomPaint(
        foregroundPainter: _GroupOutlinePainter(
          color: c.border,
          first: first,
          last: last,
        ),
        child: Container(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.s14,
            vertical: AppSpacing.s12,
          ),
          decoration: BoxDecoration(
            color: c.surface,
            borderRadius: BorderRadius.vertical(
              top: first ? r : Radius.zero,
              bottom: last ? r : Radius.zero,
            ),
          ),
          child: Row(
            children: [
              BOHIconCircle(
                icon: earned ? AppIcons.arrowUp : AppIcons.rewards,
                size: AppSizes.iconTile,
                rounded: true,
                tone: earned
                    ? BOHIconCircleTone.success
                    : BOHIconCircleTone.brand,
              ),
              const SizedBox(width: AppSpacing.s12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(t.activity.label(l10n), style: context.text.label),
                    Text(
                      t.detail.isEmpty ? date : '${t.detail} · $date',
                      style: context.text.caption,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.s8),
              Text(
                amount,
                textDirection: TextDirection.ltr,
                style: context.text.number(
                  14,
                  color: earned ? c.statusSuccess.foreground : c.primaryText,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Outline of one row in a grouped card: sides always, the rounded top on
/// the first row, the rounded bottom on the last and a hairline between.
class _GroupOutlinePainter extends CustomPainter {
  const _GroupOutlinePainter({
    required this.color,
    required this.first,
    required this.last,
  });

  final Color color;
  final bool first;
  final bool last;

  @override
  void paint(Canvas canvas, Size size) {
    const r = AppRadii.large;
    const h = 0.5;
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1;
    final w = size.width;
    final height = size.height;
    final path = Path()..moveTo(h, first ? r : 0);
    if (first) {
      path
        ..arcToPoint(const Offset(r, h), radius: const Radius.circular(r - h))
        ..lineTo(w - r, h)
        ..arcToPoint(Offset(w - h, r), radius: const Radius.circular(r - h));
    } else {
      path.moveTo(w - h, 0);
    }
    path.lineTo(w - h, last ? height - r : height);
    if (last) {
      path
        ..arcToPoint(
          Offset(w - r, height - h),
          radius: const Radius.circular(r - h),
        )
        ..lineTo(r, height - h)
        ..arcToPoint(
          Offset(h, height - r),
          radius: const Radius.circular(r - h),
        );
    } else {
      path
        ..moveTo(w - h, height - h)
        ..lineTo(h, height - h)
        ..moveTo(h, height);
    }
    path.lineTo(h, first ? r : 0);
    canvas.drawPath(path, paint);
  }

  @override
  bool shouldRepaint(_GroupOutlinePainter old) =>
      old.color != color || old.first != first || old.last != last;
}
