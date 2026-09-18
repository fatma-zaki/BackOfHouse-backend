import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_radii.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
import '../../data/profile_data.dart';
import '../../domain/profile.dart';
import '../../domain/profile_status.dart';
import '../widgets/settings_sheet.dart';

void _comingSoon(BuildContext context) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(context.l10n.comingSoonMessage)));
}

/// The member's professional dossier: standing, record, skills, work and
/// recognition.
class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final profile = ref.watch(myProfileProvider);

    return BOHScaffold(
      appBar: BOHAppBar(
        showBack: false,
        title: l10n.navProfile,
        actions: [
          BOHIconButton(
            icon: AppIcons.share,
            semanticLabel: l10n.actionShare,
            onPressed: () => _comingSoon(context),
          ),
          BOHIconButton(
            icon: AppIcons.settings,
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
    final c = context.colors;

    return ListView(
      padding: BOHScaffold.screenPadding.add(
        EdgeInsets.only(
          top: AppSpacing.s8,
          bottom: MediaQuery.paddingOf(context).bottom + AppSpacing.s32,
        ),
      ),
      children: [
        _Header(profile: profile),
        const SizedBox(height: AppSpacing.s20),
        IntrinsicHeight(
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                child: _StatCard(
                  label: l10n.profileVisibilityScore,
                  icon: AppIcons.trendingUp,
                  value: '${profile.visibilityScore}',
                  suffix: '/100',
                  hint: l10n.profileVisibilityHint,
                  progress: profile.visibilityScore / 100,
                ),
              ),
              const SizedBox(width: AppSpacing.s12),
              Expanded(
                child: _StatCard(
                  label: l10n.profileVerification,
                  icon: AppIcons.shield,
                  value: l10n.verificationLevel(profile.verificationLevel),
                  hint: l10n.profileVerificationHint,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.s12),
        _Section(
          icon: AppIcons.user,
          title: l10n.profileExecutiveSummary,
          child: Text(profile.about, style: context.text.body),
        ),
        const SizedBox(height: AppSpacing.s12),
        _Section(
          icon: AppIcons.job,
          title: l10n.profileExperienceRecord,
          trailing: BOHTag(l10n.profileYearsExp(profile.yearsExperience)),
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
        const SizedBox(height: AppSpacing.s12),
        _Section(
          icon: AppIcons.tips,
          title: l10n.profileSkillsTitle,
          trailing: BOHTag(
            l10n.verifiedCount(profile.skills.length),
            variant: BOHTagVariant.success,
          ),
          child: Wrap(
            spacing: AppSpacing.s8,
            runSpacing: AppSpacing.s8,
            children: [
              for (final skill in profile.skills)
                BOHTag(skill, variant: BOHTagVariant.neutral),
            ],
          ),
        ),
        if (profile.projects.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.sectionSpacing),
          BOHSectionHeader(title: l10n.profileSelectedProjects),
          const SizedBox(height: AppSpacing.s12),
          BOHCarousel(
            padding: EdgeInsets.zero,
            children: [
              for (final project in profile.projects)
                _ProjectCard(project: project),
            ],
          ),
        ],
        if (profile.badges.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.sectionSpacing),
          BOHSectionHeader(title: l10n.profileBadges),
          const SizedBox(height: AppSpacing.s12),
          BOHCard(
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.s4),
            child: Column(
              children: [
                for (final (i, badge) in profile.badges.indexed) ...[
                  if (i > 0)
                    Divider(
                      height: 1,
                      indent: AppSpacing.s16,
                      endIndent: AppSpacing.s16,
                      color: c.borderSoft,
                    ),
                  BOHListTile(
                    leading: BOHIconCircle(
                      icon: badge.premium ? AppIcons.level : AppIcons.keynote,
                      rounded: true,
                      tone: badge.premium
                          ? BOHIconCircleTone.gold
                          : BOHIconCircleTone.brand,
                    ),
                    title: badge.title,
                    subtitle: badge.issuer,
                  ),
                ],
              ],
            ),
          ),
        ],
        const SizedBox(height: AppSpacing.sectionSpacing),
        BOHButton(
          label: l10n.actionSignOut,
          variant: BOHButtonVariant.ghost,
          leadingIcon: AppIcons.logOut,
          trailingIcon: null,
          onPressed: () => ref.read(authControllerProvider.notifier).logout(),
        ),
      ],
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.profile});

  final Profile profile;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;

    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(3),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: c.primaryTint, width: 2),
          ),
          child: BOHAvatar(
            name: profile.name,
            image: profile.avatar,
            size: BOHAvatarSize.xlarge,
            verified: profile.verified,
          ),
        ),
        const SizedBox(height: AppSpacing.s12),
        Semantics(
          header: true,
          child: Text(
            profile.name,
            style: context.text.h1,
            textAlign: TextAlign.center,
          ),
        ),
        const SizedBox(height: AppSpacing.s4),
        Text(
          profile.headline,
          style: context.text.bodyLarge.copyWith(color: c.textPrimary),
          textAlign: TextAlign.center,
        ),
        if (profile.status == ProfileStatus.student) ...[
          const SizedBox(height: AppSpacing.s8),
          BOHTag(l10n.profileStatusStudent, icon: AppIcons.courses),
        ],
        const SizedBox(height: AppSpacing.s4),
        Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              AppIcons.location,
              size: AppSizes.iconSmall,
              color: c.textMuted,
            ),
            const SizedBox(width: AppSpacing.s4),
            Flexible(
              child: Text(
                '${profile.company} · ${profile.city}',
                style: context.text.bodySmall,
                textAlign: TextAlign.center,
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.s12),
        BOHStatusLabel(
          label: profile.availability,
          color: c.success,
          filled: true,
        ),
        const SizedBox(height: AppSpacing.s16),
        Row(
          children: [
            Expanded(
              child: BOHButton(
                label: l10n.profileEditProfile,
                leadingIcon: AppIcons.user,
                trailingIcon: null,
                size: BOHButtonSize.small,
                onPressed: () => _comingSoon(context),
              ),
            ),
            const SizedBox(width: AppSpacing.s8),
            Expanded(
              child: BOHButton(
                label: l10n.myPointsTitle,
                variant: BOHButtonVariant.secondary,
                leadingIcon: AppIcons.points,
                trailingIcon: null,
                size: BOHButtonSize.small,
                onPressed: () => context.push(AppRoutes.myPoints),
              ),
            ),
          ],
        ),
        const SizedBox(height: AppSpacing.s12),
        BOHCard(
          padding: EdgeInsets.zero,
          child: BOHListTile(
            leading: const BOHIconCircle(icon: AppIcons.job, rounded: true),
            title: l10n.applicationsTitle,
            subtitle: l10n.applicationsEntryHint,
            showChevron: true,
            onTap: () => context.push(AppRoutes.applications),
          ),
        ),
      ],
    );
  }
}

class _StatCard extends StatelessWidget {
  const _StatCard({
    required this.label,
    required this.icon,
    required this.value,
    required this.hint,
    this.suffix,
    this.progress,
  });

  final String label;
  final IconData icon;
  final String value;
  final String? suffix;
  final String hint;
  final double? progress;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return BOHCard(
      padding: const EdgeInsets.all(AppSpacing.s12),
      child: MergeSemantics(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(child: BOHEyebrow(label)),
                Icon(icon, size: AppSizes.iconSmall, color: c.primaryText),
              ],
            ),
            const SizedBox(height: AppSpacing.s8),
            Text.rich(
              TextSpan(
                children: [
                  TextSpan(text: value, style: context.text.h2),
                  if (suffix != null)
                    TextSpan(
                      text: suffix,
                      style: context.text.bodySmall.copyWith(
                        color: c.textMuted,
                      ),
                    ),
                ],
              ),
            ),
            if (progress != null) ...[
              const SizedBox(height: AppSpacing.s8),
              ExcludeSemantics(child: BOHProgressBar(value: progress!)),
            ],
            const SizedBox(height: AppSpacing.s8),
            Text(hint, style: context.text.caption),
          ],
        ),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({
    required this.icon,
    required this.title,
    required this.child,
    this.trailing,
  });

  final IconData icon;
  final String title;
  final Widget child;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return BOHCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: AppSizes.iconMedium, color: c.primaryText),
              const SizedBox(width: AppSpacing.s8),
              Expanded(
                child: Semantics(
                  header: true,
                  child: Text(title, style: context.text.cardTitle),
                ),
              ),
              ?trailing,
            ],
          ),
          const SizedBox(height: AppSpacing.s12),
          child,
        ],
      ),
    );
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
                          BOHTag(
                            l10n.profilePresent,
                            variant: BOHTagVariant.success,
                          ),
                      ],
                    ),
                    Text(experience.company, style: context.text.body),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Icon(AppIcons.calendar, size: 14, color: c.textMuted),
                        const SizedBox(width: AppSpacing.s4),
                        Text(period, style: context.text.caption),
                      ],
                    ),
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

class _ProjectCard extends StatelessWidget {
  const _ProjectCard({required this.project});

  final ProfileProject project;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return BOHCard(
      padding: EdgeInsets.zero,
      semanticLabel:
          '${project.title}, ${project.year}. ${project.category}. ${project.role}',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          SizedBox(
            height: 120,
            child: Stack(
              fit: StackFit.expand,
              children: [
                BOHImage(image: project.image),
                PositionedDirectional(
                  top: AppSpacing.s8,
                  start: AppSpacing.s8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.s8,
                      vertical: 2,
                    ),
                    decoration: BoxDecoration(
                      color: c.surface.withValues(alpha: 0.94),
                      borderRadius: AppRadii.pillAll,
                    ),
                    child: Text(
                      '${project.year}',
                      style: context.text.labelMedium,
                    ),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(AppSpacing.s12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  project.category,
                  style: context.text.caption.copyWith(color: c.primaryText),
                ),
                const SizedBox(height: 2),
                Text(
                  project.title,
                  style: context.text.label,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 2),
                Text(
                  project.role,
                  style: context.text.bodySmall,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
