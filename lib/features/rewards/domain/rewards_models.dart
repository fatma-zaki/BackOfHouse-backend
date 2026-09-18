import 'package:flutter/foundation.dart';

import '../../../core/media/app_image.dart';

/// Tiers a member moves through as they earn points.
enum MemberLevel { newcomer, active, contributor, leader }

@immutable
class PointsSummary {
  const PointsSummary({
    required this.balance,
    required this.earnedThisMonth,
    required this.level,
    required this.levelTarget,
    required this.nextBenefitAt,
  });

  /// Points available to spend.
  final int balance;
  final int earnedThisMonth;
  final MemberLevel level;

  /// Lifetime points needed to reach the next level.
  final int levelTarget;

  /// Balance at which the next reward unlocks.
  final int nextBenefitAt;

  int get pointsToNextLevel => (levelTarget - balance).clamp(0, levelTarget);
  int get pointsToNextBenefit =>
      (nextBenefitAt - balance).clamp(0, nextBenefitAt);
  double get levelProgress => levelTarget == 0 ? 1 : balance / levelTarget;
}

/// Why points were earned or spent. The UI names each kind.
enum PointsActivity {
  attendedWorkshop,
  profileCompletion,
  verifiedIdentity,
  joinedEvent,
  followedCompany,
  redeemedReward,
}

enum PointsFilter { all, earned, redeemed }

@immutable
class PointsTransaction {
  const PointsTransaction({
    required this.id,
    required this.activity,
    required this.detail,
    required this.date,
    required this.points,
  });

  final String id;
  final PointsActivity activity;

  /// Context line, e.g. "Tech & Innovation in Events".
  final String detail;
  final DateTime date;

  /// Positive when earned, negative when redeemed.
  final int points;

  bool get isEarned => points >= 0;
}

enum RewardCategory { learn, attend, career, community }

/// Visual family for a reward's icon.
/// [highlight] is a temporary, points-funded visibility benefit. It is not
/// verification and not a paid Featured / Promoted placement.
enum RewardKind { course, ticket, highlight, report, community }

@immutable
class Reward {
  const Reward({
    required this.id,
    required this.category,
    required this.kind,
    required this.title,
    required this.description,
    required this.cost,
    required this.benefits,
    required this.steps,
    required this.note,
    this.image,
    this.available = true,
  });

  final String id;
  final RewardCategory category;
  final RewardKind kind;
  final String title;
  final String description;
  final int cost;
  final List<String> benefits;
  final List<String> steps;
  final String note;
  final AppImage? image;

  /// False for rewards announced but not yet redeemable ("Coming soon").
  final bool available;
}

@immutable
class Redemption {
  const Redemption({
    required this.reward,
    required this.code,
    required this.remainingBalance,
  });

  final Reward reward;
  final String code;
  final int remainingBalance;
}
