import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_radii.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/utils/date_formats.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../applications/domain/application.dart';
import '../../../applications/presentation/controllers/applications_providers.dart';
import '../../../applications/presentation/widgets/application_widgets.dart';
import '../../domain/opportunity.dart';
import '../controllers/opportunities_providers.dart';
import '../widgets/opportunity_widgets.dart';

/// One opportunity, any type. What the footer offers comes from the
/// domain: apply, view the existing application, or why neither applies.
class OpportunityDetailsScreen extends ConsumerWidget {
  const OpportunityDetailsScreen({super.key, required this.opportunityId});

  final String opportunityId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final opportunity = ref.watch(opportunityDetailProvider(opportunityId));
    final history =
        ref.watch(applicationsForOpportunityProvider(opportunityId)).value ??
        const <Application>[];
    final blocking = ApplicationRules.blockingApplication(history);

    return BOHScaffold(
      appBar: BOHAppBar(
        title:
            opportunity.value?.type.label(l10n) ?? l10n.directoryOpportunities,
      ),
      bottomNavigationBar: switch (opportunity) {
        AsyncData(:final value) => _Footer(
          opportunity: value,
          blocking: blocking,
        ),
        _ => null,
      },
      body: switch (opportunity) {
        AsyncData(:final value) => _Body(
          opportunity: value,
          // The application that decides what can happen next, else the
          // latest (withdrawn) one.
          application: blocking ?? history.firstOrNull,
        ),
        AsyncError(:final error) => BOHErrorState(
          error: error,
          onRetry: () =>
              ref.invalidate(opportunityDetailProvider(opportunityId)),
        ),
        _ => const BOHLoadingState(),
      },
    );
  }
}

class _Body extends StatelessWidget {
  const _Body({required this.opportunity, required this.application});

  final Opportunity opportunity;
  final Application? application;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final o = opportunity;

    return ListView(
      padding: BOHScaffold.screenPadding.add(
        const EdgeInsets.only(top: AppSpacing.s8, bottom: AppSpacing.s32),
      ),
      children: [
        _Header(opportunity: o),
        if (application case final app?) ...[
          const SizedBox(height: AppSpacing.s12),
          _ApplicationCard(application: app),
        ],
        if (o.matchReasons.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.s12),
          _Section(
            icon: AppIcons.match,
            title: l10n.opportunityWhyMatch,
            child: _Checklist(items: o.matchReasons),
          ),
        ],
        if (o.description.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.s12),
          _Section(
            icon: AppIcons.report,
            title: l10n.opportunityOverview,
            child: Text(o.description, style: context.text.body),
          ),
        ],
        if (o.responsibilities.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.s12),
          _Section(
            icon: AppIcons.check,
            title: l10n.opportunityResponsibilities,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                for (final (i, r) in o.responsibilities.indexed)
                  Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.s8),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _Number(i + 1),
                        const SizedBox(width: AppSpacing.s8),
                        Expanded(child: Text(r, style: context.text.body)),
                      ],
                    ),
                  ),
              ],
            ),
          ),
        ],
        if (o.requirements.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.s12),
          _Section(
            icon: AppIcons.level,
            title: l10n.opportunityRequirements,
            child: _Checklist(items: o.requirements),
          ),
        ],
        if (o.skills.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.s12),
          _Section(
            icon: AppIcons.technology,
            title: l10n.opportunitySkills,
            child: Wrap(
              spacing: AppSpacing.s8,
              runSpacing: AppSpacing.s8,
              children: [
                for (final s in o.skills)
                  BOHTag(s, variant: BOHTagVariant.outline),
              ],
            ),
          ),
        ],
        const SizedBox(height: AppSpacing.s12),
        BOHCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(l10n.opportunityPostedBy, style: context.text.caption),
              const SizedBox(height: AppSpacing.s8),
              CompanyByline(company: o.company),
              const SizedBox(height: AppSpacing.s12),
              BOHButton(
                label: l10n.actionViewCompany,
                variant: BOHButtonVariant.secondary,
                size: BOHButtonSize.small,
                onPressed: () => context.push(AppRoutes.company(o.company.id)),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

class _Header extends StatelessWidget {
  const _Header({required this.opportunity});

  final Opportunity opportunity;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final o = opportunity;
    final closesAt = o.closesAt;

    return BOHCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          CompanyByline(
            company: o.company,
            trailing: o.matchScore == null ? null : MatchPill(o.matchScore!),
          ),
          const SizedBox(height: AppSpacing.s12),
          Semantics(header: true, child: Text(o.title, style: context.text.h1)),
          const SizedBox(height: AppSpacing.s12),
          Wrap(
            spacing: AppSpacing.s8,
            runSpacing: AppSpacing.s8,
            children: [
              BOHTag(
                opportunityTerms(
                  l10n,
                  type: o.type,
                  employment: o.employment,
                  duration: o.duration,
                ),
                icon: o.type.icon,
              ),
              BOHTag(
                o.city,
                variant: BOHTagVariant.outline,
                icon: AppIcons.location,
              ),
              BOHTag(
                o.compensation ?? l10n.opportunityUnpaid,
                variant: BOHTagVariant.outline,
                icon: AppIcons.points,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.s12),
          Text(
            [
              postedAgo(l10n, o.postedAt),
              l10n.opportunityApplicants(o.applicants),
              if (closesAt != null && o.isOpenAt(DateTime.now()))
                l10n.opportunityClosesOn(
                  AppDateFormats.mediumDate(context).format(closesAt),
                ),
            ].join(' · '),
            style: context.text.caption,
          ),
        ],
      ),
    );
  }
}

class _ApplicationCard extends StatelessWidget {
  const _ApplicationCard({required this.application});

  final Application application;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    return Container(
      padding: const EdgeInsets.all(AppSpacing.cardPadding),
      decoration: BoxDecoration(
        color: c.primaryWash,
        borderRadius: AppRadii.mediumAll,
        border: Border.all(color: c.primaryTint),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  l10n.opportunityYourApplication,
                  style: context.text.label,
                ),
              ),
              ApplicationStatusTag(application.status),
            ],
          ),
          const SizedBox(height: AppSpacing.s16),
          ApplicationPipeline(status: application.status),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({
    required this.icon,
    required this.title,
    required this.child,
  });

  final IconData icon;
  final String title;
  final Widget child;

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
            ],
          ),
          const SizedBox(height: AppSpacing.s12),
          child,
        ],
      ),
    );
  }
}

class _Checklist extends StatelessWidget {
  const _Checklist({required this.items});

  final List<String> items;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final item in items)
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.s8),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Icon(
                    AppIcons.success,
                    size: AppSizes.iconSmall,
                    color: c.primaryText,
                  ),
                ),
                const SizedBox(width: AppSpacing.s8),
                Expanded(child: Text(item, style: context.text.body)),
              ],
            ),
          ),
      ],
    );
  }
}

class _Number extends StatelessWidget {
  const _Number(this.value);

  final int value;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Container(
      width: 22,
      height: 22,
      alignment: Alignment.center,
      decoration: BoxDecoration(color: c.primaryWash, shape: BoxShape.circle),
      child: Text(
        '$value',
        style: context.text.caption.copyWith(
          color: c.primaryText,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _Footer extends ConsumerWidget {
  const _Footer({required this.opportunity, required this.blocking});

  final Opportunity opportunity;

  /// From [ApplicationRules.blockingApplication].
  final Application? blocking;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final eligibility = opportunity.eligibilityFor(
      ref.watch(applicantProvider),
    );

    if (blocking != null) {
      return BOHActionBar(
        child: BOHButton(
          label: l10n.actionViewApplication,
          variant: BOHButtonVariant.secondary,
          onPressed: () => context.push(AppRoutes.applications),
        ),
      );
    }
    if (eligibility.isEligible) {
      return BOHActionBar(
        child: BOHButton(
          label: l10n.actionApplyNow,
          onPressed: () =>
              context.push(AppRoutes.applyToOpportunity(opportunity.id)),
        ),
      );
    }
    return BOHActionBar(child: BOHInfoNote(eligibility.message(l10n)));
  }
}
