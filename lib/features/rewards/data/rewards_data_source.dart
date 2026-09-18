import '../../../core/utils/paginated.dart';
import '../domain/rewards_models.dart';

/// Transport for points and rewards: the API client or the in-memory mock.
abstract interface class RewardsDataSource {
  Future<PointsSummary> getSummary();

  Future<Paginated<PointsTransaction>> getTransactions(
    PointsFilter filter,
    PageRequest request,
  );

  Future<List<Reward>> getRewards({
    RewardCategory? category,
    String query = '',
  });

  Future<Reward> getReward(String id);

  Future<Redemption> redeem(String rewardId);
}
