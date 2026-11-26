import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/data/mock_support.dart';
import '../../../core/l10n/content_language.dart';
import '../../../core/utils/paginated.dart';
import '../domain/rewards_models.dart';
import '../domain/rewards_repository.dart';
import 'rewards_data_source.dart';
import 'rewards_mock_data_source.dart';

class RewardsRepositoryImpl implements RewardsRepository {
  const RewardsRepositoryImpl(this._source);

  final RewardsDataSource _source;

  @override
  Future<PointsSummary> getSummary() => _source.getSummary();

  @override
  Future<Paginated<PointsTransaction>> getTransactions(
    PointsFilter filter,
    PageRequest request,
  ) => _source.getTransactions(filter, request);

  @override
  Future<List<Reward>> getRewards({
    RewardCategory? category,
    String query = '',
  }) => _source.getRewards(category: category, query: query);

  @override
  Future<Reward> getReward(String id) => _source.getReward(id);

  @override
  Future<Redemption> redeem(String rewardId) => _source.redeem(rewardId);
}

/// Kept alive for the session so the in-memory balance survives navigation.
///
/// TODO(api): add `RewardsRemoteDataSource` and select it when
/// `AppConfig.useMockData` is false, once the points API contract exists.
final rewardsDataSourceProvider = Provider<RewardsDataSource>((ref) {
  return RewardsMockDataSource(
    language: () => ref.read(contentLanguageProvider),
    latency: ref.watch(mockLatencyProvider),
  );
});

final rewardsRepositoryProvider = Provider<RewardsRepository>(
  (ref) => RewardsRepositoryImpl(ref.watch(rewardsDataSourceProvider)),
);
