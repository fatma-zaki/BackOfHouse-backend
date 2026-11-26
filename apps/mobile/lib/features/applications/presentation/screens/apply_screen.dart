import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/l10n_messages.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../opportunities/domain/opportunity.dart';
import '../../../opportunities/presentation/controllers/opportunities_providers.dart';
import '../../../opportunities/presentation/widgets/opportunity_widgets.dart';
import '../../../profile/data/profile_data.dart';
import '../../../profile/domain/profile.dart';
import '../../domain/application.dart';
import '../controllers/applications_providers.dart';

/// Apply on one page: the listing, the experience and projects to share,
/// an optional message and the privacy note. No CV upload; the company
/// decides.
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
    return _ApplyForm(opportunity: opportunity, profile: profile);
  }
}

class _ApplyForm extends ConsumerStatefulWidget {
  const _ApplyForm({required this.opportunity, required this.profile});

  final Opportunity opportunity;
  final Profile profile;

  @override
  ConsumerState<_ApplyForm> createState() => _ApplyFormState();
}

class _ApplyFormState extends ConsumerState<_ApplyForm> {
  late final Set<String> _experienceIds = {
    for (final e in widget.profile.experience) e.id,
  };
  late final Set<String> _projectIds = {
    for (final p in widget.profile.projects.take(1)) p.id,
  };
  final _statement = TextEditingController();
  bool _submitting = false;
  bool _showExperienceError = false;

  @override
  void dispose() {
    _statement.dispose();
    super.dispose();
  }

  void _toggle(Set<String> ids, String id, bool on) => setState(() {
    on ? ids.add(id) : ids.remove(id);
    if (ids == _experienceIds && ids.isNotEmpty) {
      _showExperienceError = false;
    }
  });

  Future<void> _submit() async {
    final draft = ApplicationDraft(
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
    );
    // The data layer enforces this too; explain it here before submitting.
    if (!draft.hasRequiredExperience) {
      setState(() => _showExperienceError = true);
      return;
    }

    setState(() => _submitting = true);
    final messenger = ScaffoldMessenger.of(context);
    final l10n = context.l10n;
    try {
      await ref.read(myApplicationsProvider.notifier).submit(draft);
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
    final text = context.text;
    final o = widget.opportunity;
    final p = widget.profile;

    Widget subhead(String title, {Widget? trailing}) => Row(
      children: [
        Expanded(child: Text(title, style: text.cardTitle)),
        ?trailing,
      ],
    );

    return BOHScaffold(
      appBar: BOHAppBar(title: l10n.applyTitle, showBack: !_submitting),
      bottomNavigationBar: BOHActionBar(
        child: BOHButton(
          label: l10n.actionSubmitApplication,
          isLoading: _submitting,
          onPressed: _submit,
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.screenHorizontal,
          AppSpacing.s8,
          AppSpacing.screenHorizontal,
          AppSpacing.s24,
        ),
        children: [
          OpportunityRowCard(opportunity: o, onTap: () => context.pop()),
          const SizedBox(height: AppSpacing.s20),
          subhead(
            l10n.applyExperienceTitle,
            trailing: Text(l10n.applyExperienceRequired, style: text.caption),
          ),
          const SizedBox(height: AppSpacing.s10),
          for (final e in p.experience)
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.s8),
              child: BOHCheckCard(
                title: e.role,
                subtitle: [
                  '${e.start.year} – ${e.end?.year ?? l10n.profilePresent}',
                  e.company,
                ].join(' · '),
                value: _experienceIds.contains(e.id),
                onChanged: _submitting
                    ? null
                    : (on) => _toggle(_experienceIds, e.id, on),
              ),
            ),
          if (_showExperienceError)
            Semantics(
              liveRegion: true,
              child: Row(
                children: [
                  Icon(AppIcons.info, size: 16, color: c.error),
                  const SizedBox(width: AppSpacing.s8),
                  Expanded(
                    child: Text(
                      l10n.applyExperienceMissing,
                      style: text.bodySmall.copyWith(color: c.error),
                    ),
                  ),
                ],
              ),
            ),
          if (p.projects.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.s16),
            subhead(l10n.applyProjectsTitle),
            const SizedBox(height: AppSpacing.s10),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (final (i, project) in p.projects.take(3).indexed) ...[
                  if (i > 0) const SizedBox(width: AppSpacing.s10),
                  Expanded(
                    child: BOHSelectableMediaTile(
                      label: project.title,
                      image: project.image,
                      selected: _projectIds.contains(project.id),
                      onChanged: _submitting
                          ? null
                          : (on) => _toggle(_projectIds, project.id, on),
                    ),
                  ),
                ],
                // Keep tiles at a third of the width when there are fewer.
                for (var i = p.projects.length; i < 3; i++) ...[
                  const SizedBox(width: AppSpacing.s10),
                  const Expanded(child: SizedBox.shrink()),
                ],
              ],
            ),
          ],
          const SizedBox(height: AppSpacing.s16),
          subhead(
            l10n.applyStatementTitle,
            trailing: Text(l10n.applyStatementOptional, style: text.caption),
          ),
          const SizedBox(height: AppSpacing.s10),
          BOHTextField(
            controller: _statement,
            hint: l10n.applyStatementHint,
            minLines: 4,
            maxLines: 8,
            maxLength: ApplicationDraft.statementMaxLength,
            keyboardType: TextInputType.multiline,
            textCapitalization: TextCapitalization.sentences,
            enabled: !_submitting,
          ),
          const SizedBox(height: AppSpacing.s12),
          BOHBanner(
            l10n.applyPrivacyNote(o.company.name),
            tone: BOHBannerTone.privacy,
          ),
        ],
      ),
    );
  }
}
