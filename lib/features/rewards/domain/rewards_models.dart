import 'package:flutter/foundation.dart';

import '../../../core/media/app_image.dart';

/// Numbered points levels a member moves through as they earn points
/// ("Level 3 · 250 pts to Level 4").
///
/// A points level is a Rewards concept only: it never grants, implies or
/// displays verification, and uses its own labels (never the verification
/// level wording).
enum MemberLevel {
  newcomer(0),
  active(100),
  contributor(500),
  leader(1500);

  const MemberLevel(this.floor);

  /// Points at which this level starts.
  final int floor;

  /// 1-based number shown to members.
  int get number => index + 1;

  /// The level after this one, or `null` at the top.
  MemberLevel? get next => index + 1 < values.length ? values[index + 1] : null;

  static MemberLevel forPoints(int points) =>
      values.lastWhere((l) => points >= l.floor);
}

@immutable
class PointsSummary {
  const PointsSummary({
    required this.balance,
    required this.earnedThisMonth,
    required this.level,
    required this.levelTarget,
    required this.nextBenefitAt,
    this.totalEarned = 0,
    this.totalSpent = 0,
  });

  /// Points available to spend.
  final int balance;
  final int earnedThisMonth;
  final MemberLevel level;

  /// Points needed to reach the next level (the current balance at the
  /// top level).
  final int levelTarget;

  /// Balance at which the next reward unlocks.
  final int nextBenefitAt;

  /// Lifetime points earned and spent (spent is positive).
  final int totalEarned;
  final int totalSpent;

  int get pointsToNextLevel => (levelTarget - balance).clamp(0, levelTarget);
  int get pointsToNextBenefit =>
      (nextBenefitAt - balance).clamp(0, nextBenefitAt);
  bool get isTopLevel => level.next == null;

  /// Progress through the current level, 0–1.
  double get levelProgress {
    if (isTopLevel) return 1;
    final span = levelTarget - level.floor;
    return span <= 0 ? 1 : ((balance - level.floor) / span).clamp(0, 1);
  }
}

/// Why points were earned or spent. The UI names each kind.
enum PointsActivity {
  attendedWorkshop,

  /// Attendance at an event, verified at the venue. Registering alone
  /// earns nothing.
  attendanceVerified,
  volunteerShiftCompleted,
  profileCompletion,
  verifiedIdentity,
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
