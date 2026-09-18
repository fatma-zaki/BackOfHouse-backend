import '../../../core/utils/paginated.dart';
import 'rewards_models.dart';

abstract interface class RewardsRepository {
  Future<PointsSummary> getSummary();

  Future<Paginated<PointsTransaction>> getTransactions(
    PointsFilter filter,
    PageRequest request,
  );

  /// `null` category returns every reward.
  Future<List<Reward>> getRewards({
    RewardCategory? category,
    String query = '',
  });

  Future<Reward> getReward(String id);

  /// Spends points. Throws `ApiException(insufficientPoints)` when the
  /// balance is too low.
  Future<Redemption> redeem(String rewardId);
}
