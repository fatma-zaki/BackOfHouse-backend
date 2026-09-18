import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_motion.dart';
import '../../../../app/theme/app_radii.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/l10n_messages.dart';
import '../../../../core/utils/date_formats.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../opportunities/domain/opportunity.dart';
import '../../../opportunities/presentation/controllers/opportunities_providers.dart';
import '../../../opportunities/presentation/widgets/opportunity_widgets.dart';
import '../../../profile/data/profile_data.dart';
import '../../../profile/domain/profile.dart';
import '../../domain/application.dart';
import '../controllers/applications_providers.dart';

/// Apply in two steps: choose what to share, then review and submit.
class ApplyScreen extends ConsumerStatefulWidget {
  const ApplyScreen({super.key, required this.opportunityId});

  final String opportunityId;

  @override
  ConsumerState<ApplyScreen> createState() => _ApplyScreenState();
}

class _ApplyScreenState extends ConsumerState<ApplyScreen> {
  /// Once the form is showing, keep it: submitting creates the application
  /// this screen guards against, and it must not flash "already applied"
  /// while navigating away.
  bool _started = false;

  @override
  Widget build(BuildContext context) {
    final opportunityId = widget.opportunityId;
    final l10n = context.l10n;
    final opportunity = ref.watch(opportunityDetailProvider(opportunityId));
    final profile = ref.watch(myProfileProvider);
    final applicant = ref.watch(applicantProvider);
    final history =
        ref.watch(applicationsForOpportunityProvider(opportunityId)).value ??
        const <Application>[];
    final alreadyApplied = !ApplicationRules.canApplyAgain(history);

    return switch ((opportunity, profile)) {
      (AsyncData(value: final o), AsyncData(value: final p))
          when _started ||
              (o.eligibilityFor(applicant).isEligible && !alreadyApplied) =>
        _flow(o, p),
      (AsyncData(value: final o), AsyncData()) => BOHScaffold(
        appBar: BOHAppBar(title: l10n.applyTitle),
        body: BOHEmptyState(
          icon: AppIcons.opportunities,
          title: alreadyApplied
              ? l10n.applyAlreadyApplied
              : o.eligibilityFor(applicant).message(l10n),
          actionLabel: l10n.actionBack,
          onAction: () => context.pop(),
        ),
      ),
      (AsyncError(:final error), _) ||
      (_, AsyncError(:final error)) => BOHScaffold(
        appBar: BOHAppBar(title: l10n.applyTitle),
        body: BOHErrorState(
          error: error,
          onRetry: () => ref
            ..invalidate(opportunityDetailProvider(opportunityId))
            ..invalidate(myProfileProvider),
        ),
      ),
      _ => BOHScaffold(
        appBar: BOHAppBar(title: l10n.applyTitle),
        body: const BOHLoadingState(),
      ),
    };
  }

  Widget _flow(Opportunity opportunity, Profile profile) {
    _started = true;
    return _ApplyFlow(opportunity: opportunity, profile: profile);
  }
}

class _ApplyFlow extends ConsumerStatefulWidget {
  const _ApplyFlow({required this.opportunity, required this.profile});

  final Opportunity opportunity;
  final Profile profile;

  @override
  ConsumerState<_ApplyFlow> createState() => _ApplyFlowState();
}

class _ApplyFlowState extends ConsumerState<_ApplyFlow> {
  static const _steps = 2;

  int _step = 1;
  late final Set<String> _experienceIds = {
    for (final e in widget.profile.experience) e.id,
  };
  late final Set<String> _projectIds = {
    for (final p in widget.profile.projects) p.id,
  };
  final _statement = TextEditingController();
  bool _submitting = false;

  @override
  void dispose() {
    _statement.dispose();
    super.dispose();
  }

  void _continue() => setState(() => _step = 2);

  void _toggle(Set<String> ids, String id) =>
      setState(() => ids.contains(id) ? ids.remove(id) : ids.add(id));

  void _back() {
    if (_step > 1) {
      setState(() => _step--);
    } else {
      context.pop();
    }
  }

  Future<void> _submit() async {
    setState(() => _submitting = true);
    final messenger = ScaffoldMessenger.of(context);
    final l10n = context.l10n;
    try {
      await ref
          .read(myApplicationsProvider.notifier)
          .submit(
            ApplicationDraft(
              opportunityId: widget.opportunity.id,
              experienceIds: [
                for (final e in widget.profile.experience)
                  if (_experienceIds.contains(e.id)) e.id,
              ],
              projectIds: [
                for (final p in widget.profile.projects)
                  if (_projectIds.contains(p.id)) p.id,
              ],
              statement: _statement.text,
            ),
          );
      messenger
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text(l10n.applySubmittedMessage)));
      if (mounted) context.pushReplacement(AppRoutes.applications);
    } catch (error) {
      if (mounted) setState(() => _submitting = false);
      messenger
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text(l10n.error(error))));
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;

    return PopScope(
      canPop: _step == 1 && !_submitting,
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop && !_submitting) _back();
      },
      child: BOHScaffold(
        appBar: BOHAppBar(
          title: l10n.applyTitle,
          showBack: true,
          onBack: _back,
        ),
        bottomNavigationBar: BOHActionBar(
          child: _step == 1
              ? BOHButton(label: l10n.actionContinue, onPressed: _continue)
              : BOHButton(
                  label: l10n.actionSubmitApplication,
                  isLoading: _submitting,
                  onPressed: _submit,
                ),
        ),
        body: ListView(
          padding: BOHScaffold.screenPadding.add(
            const EdgeInsets.only(top: AppSpacing.s8, bottom: AppSpacing.s32),
          ),
          children: [
            _StepHeader(
              step: _step,
              total: _steps,
              title: _step == 1 ? l10n.applyStepProfile : l10n.applyStepReview,
            ),
            const SizedBox(height: AppSpacing.s16),
            _OpportunitySummary(opportunity: widget.opportunity),
            const SizedBox(height: AppSpacing.s16),
            AnimatedSwitcher(
              duration: context.reduceMotion ? Duration.zero : AppMotion.base,
              child: _step == 1
                  ? _ProfileStep(
                      key: const ValueKey(1),
                      profile: widget.profile,
                      experienceIds: _experienceIds,
                      projectIds: _projectIds,
                      onToggleExperience: (id) => _toggle(_experienceIds, id),
                      onToggleProject: (id) => _toggle(_projectIds, id),
                    )
                  : _ReviewStep(
                      key: const ValueKey(2),
                      opportunity: widget.opportunity,
                      profile: widget.profile,
                      experienceCount: _experienceIds.length,
                      projectCount: _projectIds.length,
                      statement: _statement,
                      enabled: !_submitting,
                    ),
            ),
            const SizedBox(height: AppSpacing.s16),
            Row(
              children: [
                Icon(
                  AppIcons.shield,
                  size: AppSizes.iconSmall,
                  color: c.textMuted,
                ),
                const SizedBox(width: AppSpacing.s8),
                Expanded(
                  child: Text(
                    l10n.applyDecisionNote(widget.opportunity.company.name),
                    style: context.text.caption,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _StepHeader extends StatelessWidget {
  const _StepHeader({
    required this.step,
    required this.total,
    required this.title,
  });

  final int step;
  final int total;
  final String title;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Semantics(
          liveRegion: true,
          child: Row(
            children: [
              BOHTag(l10n.applyStepOf(step, total)),
              const SizedBox(width: AppSpacing.s8),
              Expanded(child: Text(title, style: context.text.label)),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.s12),
        ExcludeSemantics(child: BOHProgressBar(value: step / total)),
      ],
    );
  }
}

class _OpportunitySummary extends StatelessWidget {
  const _OpportunitySummary({required this.opportunity});

  final Opportunity opportunity;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final o = opportunity;
    return BOHCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CompanyByline(company: o.company),
          const SizedBox(height: AppSpacing.s8),
          Text(o.title, style: context.text.cardTitle),
          const SizedBox(height: AppSpacing.s4),
          Text(
            [
              opportunityTerms(
                l10n,
                type: o.type,
                employment: o.employment,
                duration: o.duration,
              ),
              o.city,
              ?o.compensation,
            ].join(' · '),
            style: context.text.bodySmall,
          ),
        ],
      ),
    );
  }
}

class _ProfileStep extends StatelessWidget {
  const _ProfileStep({
    super.key,
    required this.profile,
    required this.experienceIds,
    required this.projectIds,
    required this.onToggleExperience,
    required this.onToggleProject,
  });

  final Profile profile;
  final Set<String> experienceIds;
  final Set<String> projectIds;
  final ValueChanged<String> onToggleExperience;
  final ValueChanged<String> onToggleProject;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    final monthYear = AppDateFormats.monthYear(context);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        BOHCard(
          child: Row(
            children: [
              BOHAvatar(
                name: profile.name,
                image: profile.avatar,
                size: BOHAvatarSize.medium,
                verified: profile.verified,
              ),
              const SizedBox(width: AppSpacing.s12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(profile.name, style: context.text.label),
                    Text(
                      profile.headline,
                      style: context.text.bodySmall,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (profile.verified) ...[
                      const SizedBox(height: AppSpacing.s4),
                      BOHTag(
                        l10n.verificationLevel(profile.verificationLevel),
                        variant: BOHTagVariant.verified,
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
        ),
        if (profile.experience.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.sectionSpacing),
          BOHSectionHeader(
            title: l10n.applyExperienceTitle,
            subtitle: l10n.applyExperienceSubtitle,
            trailing: Text(
              l10n.applySelectedCount(experienceIds.length),
              style: context.text.labelMedium.copyWith(color: c.primaryText),
            ),
          ),
          const SizedBox(height: AppSpacing.s12),
          for (final e in profile.experience)
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.s8),
              child: _ExperienceOption(
                title: e.role,
                subtitle: e.company,
                period: [
                  monthYear.format(e.start),
                  if (e.end case final end?)
                    monthYear.format(end)
                  else
                    l10n.profilePresent,
                ].join(' – '),
                selected: experienceIds.contains(e.id),
                onTap: () => onToggleExperience(e.id),
              ),
            ),
        ],
        if (profile.projects.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.sectionSpacing),
          BOHSectionHeader(
            title: l10n.applyProjectsTitle,
            subtitle: l10n.applyProjectsSubtitle,
            trailing: Text(
              l10n.applySelectedCount(projectIds.length),
              style: context.text.labelMedium.copyWith(color: c.primaryText),
            ),
          ),
          const SizedBox(height: AppSpacing.s12),
          for (final project in profile.projects)
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.s8),
              child: _ExperienceOption(
                title: project.title,
                subtitle: project.role,
                period: '${project.year} · ${project.category}',
                selected: projectIds.contains(project.id),
                onTap: () => onToggleProject(project.id),
              ),
            ),
        ],
        if (profile.skills.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.sectionSpacing),
          BOHSectionHeader(title: l10n.applySkillsTitle),
          const SizedBox(height: AppSpacing.s12),
          Wrap(
            spacing: AppSpacing.s8,
            runSpacing: AppSpacing.s8,
            children: [
              for (final s in profile.skills)
                BOHTag(s, variant: BOHTagVariant.outline),
            ],
          ),
        ],
      ],
    );
  }
}

class _ExperienceOption extends StatelessWidget {
  const _ExperienceOption({
    required this.title,
    required this.subtitle,
    required this.period,
    required this.selected,
    required this.onTap,
  });

  final String title;
  final String subtitle;
  final String period;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Semantics(
      checked: selected,
      child: BOHPressable(
        onTap: onTap,
        selected: selected,
        semanticLabel: '$title, $subtitle, $period',
        builder: (context, state) => AnimatedContainer(
          duration: AppMotion.fast,
          padding: const EdgeInsets.all(AppSpacing.cardPadding),
          decoration: BoxDecoration(
            color: selected ? c.primaryWash : c.surface,
            borderRadius: AppRadii.mediumAll,
            border: Border.all(color: selected ? c.primary : c.borderSoft),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      period,
                      style: context.text.caption.copyWith(
                        color: selected ? c.primaryText : c.textMuted,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(title, style: context.text.label),
                    Text(subtitle, style: context.text.bodySmall),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.s12),
              AnimatedContainer(
                duration: AppMotion.fast,
                width: 22,
                height: 22,
                decoration: BoxDecoration(
                  color: selected ? c.primary : c.surface,
                  borderRadius: BorderRadius.circular(6),
                  border: Border.all(
                    color: selected ? c.primary : c.textDisabled,
                    width: 1.5,
                  ),
                ),
                child: selected
                    ? Icon(AppIcons.check, size: 14, color: c.onPrimary)
                    : null,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _ReviewStep extends StatefulWidget {
  const _ReviewStep({
    super.key,
    required this.opportunity,
    required this.profile,
    required this.experienceCount,
    required this.projectCount,
    required this.statement,
    required this.enabled,
  });

  final Opportunity opportunity;
  final Profile profile;
  final int experienceCount;
  final int projectCount;
  final TextEditingController statement;
  final bool enabled;

  @override
  State<_ReviewStep> createState() => _ReviewStepState();
}

class _ReviewStepState extends State<_ReviewStep> {
  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    const max = ApplicationDraft.statementMaxLength;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        BOHSectionHeader(
          title: l10n.applyStatementTitle,
          trailing: Text(
            l10n.applyStatementOptional,
            style: context.text.labelMedium.copyWith(color: c.textMuted),
          ),
        ),
        const SizedBox(height: AppSpacing.s8),
        BOHTextField(
          controller: widget.statement,
          hint: l10n.applyStatementHint,
          minLines: 4,
          maxLines: 8,
          keyboardType: TextInputType.multiline,
          textCapitalization: TextCapitalization.sentences,
          inputFormatters: [LengthLimitingTextInputFormatter(max)],
          enabled: widget.enabled,
          onChanged: (_) => setState(() {}),
        ),
        const SizedBox(height: AppSpacing.s4),
        Align(
          alignment: AlignmentDirectional.centerEnd,
          child: Text(
            AppDateFormats.ltr('${widget.statement.text.length} / $max'),
            style: context.text.caption,
          ),
        ),
        const SizedBox(height: AppSpacing.s16),
        BOHSectionHeader(
          title: l10n.applyChecklistTitle(widget.opportunity.company.name),
        ),
        const SizedBox(height: AppSpacing.s8),
        BOHCard(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.s4),
          child: Column(
            children: [
              BOHListTile(
                leading: const BOHIconCircle(
                  icon: AppIcons.identity,
                  rounded: true,
                ),
                title: widget.profile.name,
                subtitle: l10n.applyChecklistProfile,
                trailing: const _Check(included: true),
              ),
              BOHListTile(
                leading: const BOHIconCircle(icon: AppIcons.job, rounded: true),
                title: l10n.applyChecklistExperience(widget.experienceCount),
                subtitle: l10n.applyExperienceTitle,
                trailing: _Check(included: widget.experienceCount > 0),
              ),
              BOHListTile(
                leading: const BOHIconCircle(
                  icon: AppIcons.workshop,
                  rounded: true,
                ),
                title: l10n.applyChecklistProjects(widget.projectCount),
                subtitle: l10n.applyProjectsTitle,
                trailing: _Check(included: widget.projectCount > 0),
              ),
              BOHListTile(
                leading: const BOHIconCircle(
                  icon: AppIcons.comment,
                  rounded: true,
                ),
                title: l10n.applyStatementTitle,
                subtitle: widget.statement.text.trim().isEmpty
                    ? l10n.applyStatementNotIncluded
                    : l10n.applyStatementIncluded,
                trailing: _Check(
                  included: widget.statement.text.trim().isNotEmpty,
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.s16),
        BOHInfoNote(
          l10n.applyPrivacyNote(widget.opportunity.company.name),
          icon: AppIcons.shield,
        ),
      ],
    );
  }
}

class _Check extends StatelessWidget {
  const _Check({required this.included});

  final bool included;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Icon(
      included ? AppIcons.success : AppIcons.info,
      size: AppSizes.iconMedium,
      color: included ? c.success : c.textMuted,
    );
  }
}
