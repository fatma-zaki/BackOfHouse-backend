import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_radii.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/l10n_messages.dart';
import '../../../../core/utils/date_formats.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../applications/presentation/controllers/applications_providers.dart';
import '../../../applications/presentation/widgets/application_widgets.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
import '../../../rewards/presentation/controllers/rewards_providers.dart';
import '../../data/profile_data.dart';
import '../../domain/profile.dart';
import '../../domain/profile_status.dart';
import '../widgets/settings_sheet.dart';

void _comingSoon(BuildContext context) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(context.l10n.comingSoonMessage)));
}

/// The member's profile: identity and standing, applications, the
/// professional record and display settings.
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final profile = ref.watch(myProfileProvider);

    return BOHScaffold(
      appBar: BOHAppBar.tab(
        title: l10n.navProfile,
        actions: [
          BOHIconButton(
            icon: AppIcons.share,
            iconSize: 21,
            semanticLabel: l10n.actionShare,
            onPressed: () => _comingSoon(context),
          ),
          BOHIconButton(
            icon: AppIcons.settings,
            iconSize: 21,
            semanticLabel: l10n.settingsTitle,
            onPressed: () => showSettingsSheet(context),
          ),
        ],
      ),
      body: switch (profile) {
        AsyncData(:final value) => BOHRefresh(
          onRefresh: () => ref.refresh(myProfileProvider.future),
          child: _Body(profile: value),
        ),
        AsyncError(:final error) => BOHErrorState(
          error: error,
          onRetry: () => ref.invalidate(myProfileProvider),
        ),
        _ => const BOHLoadingState(),
      },
    );
  }
}

class _Body extends ConsumerWidget {
  const _Body({required this.profile});

  final Profile profile;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    const gap = SizedBox(height: AppSpacing.s16);
    const sectionGap = SizedBox(height: AppSpacing.s8);

    return ListView(
      padding: BOHScaffold.screenPadding.add(
        EdgeInsets.only(
          top: AppSpacing.s8,
          bottom: MediaQuery.paddingOf(context).bottom + AppSpacing.s32,
        ),
      ),
      children: [
        _Header(profile: profile),
        const SizedBox(height: AppSpacing.s12),
        Row(
          children: [
            Expanded(
              child: SizedBox(
                height: 42,
                child: BOHButton(
                  label: l10n.profileEditProfile,
                  size: BOHButtonSize.medium,
                  trailingIcon: null,
                  onPressed: () => context.push(AppRoutes.editProfile),
                ),
              ),
            ),
            if (!profile.verified) ...[
              const SizedBox(width: AppSpacing.s10),
              Expanded(
                child: SizedBox(
                  height: 42,
                  child: BOHButton(
                    label: l10n.profileGetVerified,
                    variant: BOHButtonVariant.secondary,
                    size: BOHButtonSize.medium,
                    trailingIcon: null,
                    onPressed: () => context.push(AppRoutes.getVerified),
                  ),
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: AppSpacing.s12),
        BOHStatStrip(
          items: [
            ('${profile.eventsAttended}', l10n.profileEventsAttended),
            ('${profile.visibilityScore}', l10n.profileVisibilityShort),
            (
              AppDateFormats.ltr('${profile.yearsExperience}+'),
              l10n.profileYearsShort,
            ),
          ],
        ),
        gap,
        BOHSectionHeader(
          title: l10n.profileMyApplications,
          size: BOHSectionSize.compact,
          onAction: () => context.push(AppRoutes.applications),
        ),
        sectionGap,
        const _Applications(),
        gap,
        BOHSectionHeader(
          title: l10n.profileExecutiveSummary,
          size: BOHSectionSize.compact,
        ),
        sectionGap,
        BOHCard(child: Text(profile.about, style: context.text.body)),
        gap,
        BOHSectionHeader(
          title: l10n.profileExperienceRecord,
          size: BOHSectionSize.compact,
          trailing: BOHMetaChip(l10n.profileYearsExp(profile.yearsExperience)),
        ),
        sectionGap,
        BOHCard(
          child: Column(
            children: [
              for (final (i, e) in profile.experience.indexed)
                _ExperienceItem(
                  experience: e,
                  isLast: i == profile.experience.length - 1,
                ),
            ],
          ),
        ),
        gap,
        BOHSectionHeader(
          title: l10n.profileSkillsTitle,
          size: BOHSectionSize.compact,
        ),
        sectionGap,
        Wrap(
          spacing: AppSpacing.s8,
          runSpacing: AppSpacing.s8,
          children: [
            for (final skill in profile.skills) BOHMetaChip(skill, large: true),
          ],
        ),
        if (profile.projects.isNotEmpty) ...[
          gap,
          BOHSectionHeader(
            title: l10n.profileSelectedProjects,
            size: BOHSectionSize.compact,
          ),
          sectionGap,
          GridView(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: AppSpacing.gridGap,
              mainAxisSpacing: AppSpacing.gridGap,
              mainAxisExtent: 138,
            ),
            children: [
              for (final project in profile.projects)
                BOHMediaTile(
                  image: project.image,
                  imageHeight: 70,
                  borderRadius: AppRadii.mediumAll,
                  padding: const EdgeInsets.fromLTRB(10, 8, 10, 10),
                  semanticLabel: '${project.title}, ${project.year}',
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        project.title,
                        style: context.text.labelMedium,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      Text(
                        '${project.category} · ${project.year}',
                        style: context.text.caption.copyWith(fontSize: 10.5),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
            ],
          ),
        ],
        if (profile.badges.isNotEmpty) ...[
          gap,
          BOHSectionHeader(
            title: l10n.profileBadges,
            size: BOHSectionSize.compact,
          ),
          sectionGap,
          BOHGroupedList(
            children: [
              for (final badge in profile.badges)
                BOHListTile(
                  leading: BOHIconCircle(
                    icon: badge.premium ? AppIcons.level : AppIcons.keynote,
                    size: AppSizes.iconTile,
                    rounded: true,
                    tone: badge.premium
                        ? BOHIconCircleTone.gold
                        : BOHIconCircleTone.brand,
                  ),
                  title: badge.title,
                  subtitle: badge.issuer,
                ),
            ],
          ),
        ],
        gap,
        const DisplaySettingsCard(),
        const SizedBox(height: AppSpacing.s12),
        BOHButton(
          label: l10n.actionSignOut,
          variant: BOHButtonVariant.ghost,
          size: BOHButtonSize.medium,
          leadingIcon: AppIcons.logOut,
          trailingIcon: null,
          onPressed: () => ref.read(authControllerProvider.notifier).logout(),
        ),
      ],
    );
  }
}

/// Identity card: photo, name, role, city, status tags and the points tile.
class _Header extends ConsumerWidget {
  const _Header({required this.profile});

  final Profile profile;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final c = context.colors;
    final summary = ref.watch(pointsSummaryProvider).value;

    return BOHCard(
      borderRadius: AppRadii.heroAll,
      padding: const EdgeInsets.all(AppSpacing.s16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          BOHAvatar(
            name: profile.name,
            image: profile.avatar,
            dimension: 72,
            ring: true,
            ringGap: c.surface,
            badge: BOHPressable(
              onTap: () => context.push(AppRoutes.editProfile),
              semanticLabel: l10n.profileAddPhoto,
              child: Container(
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  color: c.primary,
                  shape: BoxShape.circle,
                  border: Border.all(color: c.surface, width: 2),
                ),
                child: Icon(AppIcons.plus, size: 11, color: c.onPrimary),
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.s14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Semantics(
                  header: true,
                  child: Text(
                    profile.name,
                    style: context.text.h3.copyWith(
                      fontSize: 19,
                      height: 24 / 19,
                    ),
                  ),
                ),
                Text(
                  profile.headline,
                  style: context.text.labelMedium.copyWith(
                    color: c.primaryText,
                  ),
                ),
                const SizedBox(height: 2),
                Row(
                  children: [
                    Icon(AppIcons.location, size: 12, color: c.textSecondary),
                    const SizedBox(width: AppSpacing.s4),
                    Flexible(
                      child: Text(
                        profile.city,
                        style: context.text.bodySmall,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: AppSpacing.s8),
                Wrap(
                  spacing: AppSpacing.s6,
                  runSpacing: AppSpacing.s4,
                  children: [
                    BOHTag(
                      profile.status == ProfileStatus.student
                          ? l10n.profileStatusStudent
                          : l10n.profileStatusProfessional,
                      variant: BOHTagVariant.soft,
                    ),
                    if (profile.verified)
                      BOHTag(
                        l10n.verificationLevel(profile.verificationLevel),
                        variant: BOHTagVariant.verified,
                      )
                    else
                      BOHTag(
                        l10n.profileNotVerified,
                        variant: BOHTagVariant.outline,
                      ),
                  ],
                ),
              ],
            ),
          ),
          if (summary != null) ...[
            const SizedBox(width: AppSpacing.s8),
            BOHPressable(
              onTap: () => context.push(AppRoutes.myPoints),
              semanticLabel:
                  '${l10n.pointsAmount(summary.balance)}, '
                  '${l10n.pointsLevel(summary.level.number)}',
              child: Container(
                width: 76,
                padding: const EdgeInsets.symmetric(
                  vertical: AppSpacing.s10,
                  horizontal: AppSpacing.s6,
                ),
                decoration: BoxDecoration(
                  color: c.primaryTint,
                  borderRadius: AppRadii.mediumAll,
                ),
                child: Column(
                  children: [
                    const BOHGlyph(BOHGlyphType.star, size: 18),
                    const SizedBox(height: 2),
                    Text(
                      l10n.formatCount(summary.balance),
                      style: context.text.number(16),
                    ),
                    Text(
                      l10n.pointsLevel(summary.level.number),
                      style: context.text.caption.copyWith(
                        fontSize: 10,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _Applications extends ConsumerWidget {
  const _Applications();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final applications = ref.watch(myApplicationsProvider);
    return switch (applications) {
      AsyncData(:final value) when value.isEmpty => BOHCard(
        child: Text(
          l10n.applicationsEmptyActiveMessage,
          style: context.text.body,
        ),
      ),
      AsyncData(:final value) => BOHGroupedList(
        children: [
          for (final a in value.take(2))
            ApplicationRow(
              application: a,
              onTap: () => context.push(AppRoutes.applications),
            ),
        ],
      ),
      AsyncError() => const SizedBox.shrink(),
      _ => const BOHShimmer(
        child: BOHSkeleton(height: 124, borderRadius: AppRadii.largeAll),
      ),
    };
  }
}

/// Timeline entry: a dot (filled while current) on a hairline.
class _ExperienceItem extends StatelessWidget {
  const _ExperienceItem({required this.experience, required this.isLast});

  final Experience experience;
  final bool isLast;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    final start = experience.start.year;
    final end = experience.end?.year;
    final period = '$start – ${end ?? l10n.profilePresent}';

    return IntrinsicHeight(
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            width: 20,
            child: Column(
              children: [
                const SizedBox(height: 4),
                Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: experience.isCurrent ? c.primary : c.surface,
                    border: Border.all(color: c.primary, width: 1.5),
                  ),
                ),
                if (!isLast)
                  Expanded(child: Container(width: 1, color: c.primaryTint)),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.s12),
          Expanded(
            child: Padding(
              padding: EdgeInsets.only(bottom: isLast ? 0 : AppSpacing.s16),
              child: MergeSemantics(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            experience.role,
                            style: context.text.label,
                          ),
                        ),
                        if (experience.isCurrent)
                          BOHStatusBadge(
                            l10n.profilePresent,
                            tone: BOHStatusTone.success,
                          ),
                      ],
                    ),
                    Text(experience.company, style: context.text.bodySmall),
                    Text(period, style: context.text.caption),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
