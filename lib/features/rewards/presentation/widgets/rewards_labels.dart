import 'package:flutter/widgets.dart';

import '../../../../core/constants/app_icons.dart';
import '../../../../core/l10n/generated/app_localizations.dart';
import '../../domain/rewards_models.dart';

extension MemberLevelL10n on MemberLevel {
  String label(AppLocalizations l10n) => switch (this) {
    MemberLevel.newcomer => l10n.levelNewcomer,
    MemberLevel.active => l10n.levelActive,
    MemberLevel.contributor => l10n.levelContributor,
    MemberLevel.leader => l10n.levelLeader,
  };
}

extension PointsActivityPresentation on PointsActivity {
  String label(AppLocalizations l10n) => switch (this) {
    PointsActivity.attendedWorkshop => l10n.activityAttendedWorkshop,
    PointsActivity.profileCompletion => l10n.activityProfileCompletion,
    PointsActivity.verifiedIdentity => l10n.activityVerifiedIdentity,
    PointsActivity.joinedEvent => l10n.activityJoinedEvent,
    PointsActivity.followedCompany => l10n.activityFollowedCompany,
    PointsActivity.redeemedReward => l10n.activityRedeemedReward,
  };

  IconData get icon => switch (this) {
    PointsActivity.attendedWorkshop => AppIcons.workshop,
    PointsActivity.profileCompletion => AppIcons.profileCompletion,
    PointsActivity.verifiedIdentity => AppIcons.identity,
    PointsActivity.joinedEvent => AppIcons.calendar,
    PointsActivity.followedCompany => AppIcons.follow,
    PointsActivity.redeemedReward => AppIcons.redeemed,
  };
}

extension RewardCategoryL10n on RewardCategory {
  String label(AppLocalizations l10n) => switch (this) {
    RewardCategory.learn => l10n.rewardCategoryLearn,
    RewardCategory.attend => l10n.rewardCategoryAttend,
    RewardCategory.career => l10n.rewardCategoryCareer,
    RewardCategory.community => l10n.rewardCategoryCommunity,
  };
}

extension RewardKindIcon on RewardKind {
  IconData get icon => switch (this) {
    RewardKind.course => AppIcons.courses,
    RewardKind.ticket => AppIcons.ticket,
    RewardKind.highlight => AppIcons.highlight,
    RewardKind.report => AppIcons.report,
    RewardKind.community => AppIcons.community,
  };
}

extension PointsFilterL10n on PointsFilter {
  String label(AppLocalizations l10n) => switch (this) {
    PointsFilter.all => l10n.filterAll,
    PointsFilter.earned => l10n.filterEarned,
    PointsFilter.redeemed => l10n.filterRedeemed,
  };
}
