import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/l10n/content_language.dart';
import '../../../../core/utils/paginated.dart';
import '../../data/rewards_repository_provider.dart';
import '../../domain/rewards_models.dart';

final pointsSummaryProvider = FutureProvider.autoDispose<PointsSummary>(
  (ref) => ref.watch(rewardsRepositoryProvider).getSummary(),
);

class PointsHistoryController extends PagedNotifier<PointsTransaction> {
  PointsHistoryController(this.filter);

  final PointsFilter filter;

  @override
  void watchDependencies() => ref.watch(contentLanguageProvider);

  @override
  Future<Paginated<PointsTransaction>> fetchPage(PageRequest request) =>
      ref.read(rewardsRepositoryProvider).getTransactions(filter, request);
}

final pointsHistoryProvider = AsyncNotifierProvider.autoDispose
    .family<
      PointsHistoryController,
      PagedState<PointsTransaction>,
      PointsFilter
    >(PointsHistoryController.new);

typedef RewardsQuery = ({RewardCategory? category, String query});

final rewardsProvider = FutureProvider.autoDispose
    .family<List<Reward>, RewardsQuery>((ref, q) {
      ref.watch(contentLanguageProvider);
      return ref
          .watch(rewardsRepositoryProvider)
          .getRewards(category: q.category, query: q.query);
    });

final rewardProvider = FutureProvider.autoDispose.family<Reward, String>((
  ref,
  id,
) {
  ref.watch(contentLanguageProvider);
  return ref.watch(rewardsRepositoryProvider).getReward(id);
});

/// Spends points on a reward and refreshes everything that shows a balance.
class RedeemController extends Notifier<AsyncValue<Redemption>?> {
  @override
  AsyncValue<Redemption>? build() => null;

  Future<AsyncValue<Redemption>> redeem(String rewardId) async {
    state = const AsyncLoading();
    final result = await AsyncValue.guard(
      () => ref.read(rewardsRepositoryProvider).redeem(rewardId),
    );
    state = result;
    if (result.hasValue) {
      ref
        ..invalidate(pointsSummaryProvider)
        ..invalidate(pointsHistoryProvider);
    }
    return result;
  }
}

/// Not auto-disposed: redeeming is started from screens that only read the
/// notifier, and the call must survive until the result is shown.
final redeemControllerProvider =
    NotifierProvider<RedeemController, AsyncValue<Redemption>?>(
      RedeemController.new,
    );
