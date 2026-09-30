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
import '../../../companies/presentation/company_labels.dart';
import '../../domain/opportunity.dart';
import '../controllers/opportunities_providers.dart';
import '../widgets/opportunity_widgets.dart';

void _comingSoon(BuildContext context) {
  ScaffoldMessenger.of(context)
    ..hideCurrentSnackBar()
    ..showSnackBar(SnackBar(content: Text(context.l10n.comingSoonMessage)));
}

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
    final eligibility = opportunity.value?.eligibilityFor(
      ref.watch(applicantProvider),
    );

    return BOHScaffold(
      appBar: BOHAppBar(
        title: l10n.opportunityDetailTitle,
        centerTitle: true,
        actions: [
          BOHIconButton(
            icon: AppIcons.share,
            iconSize: 19,
            semanticLabel: l10n.actionShare,
            variant: BOHIconButtonVariant.outlined,
            onPressed: () => _comingSoon(context),
          ),
        ],
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
          eligible: blocking == null && (eligibility?.isEligible ?? false),
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
  const _Body({
    required this.opportunity,
    required this.eligible,
    required this.application,
  });

  final Opportunity opportunity;
  final bool eligible;
  final Application? application;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final o = opportunity;
    const gap = SizedBox(height: AppSpacing.s16);
    const headerGap = SizedBox(height: AppSpacing.gridGap);

    return ListView(
      padding: BOHScaffold.screenPadding.add(
        const EdgeInsets.only(top: AppSpacing.s8, bottom: AppSpacing.s32),
      ),
      children: [
        _Header(opportunity: o),
        if (application case final app?) ...[
          const SizedBox(height: AppSpacing.s12),
          BOHCard(
            tone: BOHCardTone.accent,
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
                    ApplicationStatusTag(app.status),
                  ],
                ),
                const SizedBox(height: AppSpacing.s16),
                ApplicationPipeline(status: app.status),
              ],
            ),
          ),
        ] else if (eligible) ...[
          const SizedBox(height: AppSpacing.s12),
          BOHBanner(
            '',
            title: l10n.opportunityEligible,
            tone: BOHBannerTone.success,
          ),
        ],
        if (o.description.isNotEmpty) ...[
          gap,
          BOHSectionHeader(
            title: l10n.opportunityOverview,
            size: BOHSectionSize.sub,
          ),
          headerGap,
          Text(
            o.description,
            style: context.text.body.copyWith(
              color: context.colors.textPrimary,
            ),
          ),
        ],
        if (o.responsibilities.isNotEmpty) ...[
          gap,
          BOHSectionHeader(
            title: l10n.opportunityResponsibilities,
            size: BOHSectionSize.sub,
          ),
          headerGap,
          for (final (i, r) in o.responsibilities.indexed)
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.s8),
              child: BOHNumberedStep(number: i + 1, text: r),
            ),
        ],
        if (o.requirements.isNotEmpty) ...[
          gap,
          BOHSectionHeader(
            title: l10n.opportunityRequirements,
            size: BOHSectionSize.sub,
          ),
          headerGap,
          for (final r in o.requirements)
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.s8),
              child: BOHCheckBullet(r),
            ),
        ],
        if (o.skills.isNotEmpty) ...[
          gap,
          BOHSectionHeader(
            title: l10n.opportunitySkills,
            size: BOHSectionSize.sub,
          ),
          headerGap,
          Wrap(
            spacing: AppSpacing.s8,
            runSpacing: AppSpacing.s8,
            children: [for (final s in o.skills) BOHMetaChip(s, large: true)],
          ),
        ],
        gap,
        BOHCard(
          onTap: () => context.push(AppRoutes.company(o.company.id)),
          semanticLabel: '${l10n.actionViewCompany}: ${o.company.name}',
          child: Row(
            children: [
              BOHCompanyLogo(name: o.company.name, size: 44),
              const SizedBox(width: AppSpacing.s12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(l10n.opportunityPostedBy, style: context.text.caption),
                    Text(o.company.name, style: context.text.label),
                  ],
                ),
              ),
              BOHLinkButton(
                label: l10n.actionViewCompany,
                fontSize: 12,
                onTap: () => context.push(AppRoutes.company(o.company.id)),
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
      borderRadius: AppRadii.heroAll,
      padding: const EdgeInsets.all(AppSpacing.s16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              BOHCompanyLogo(name: o.company.name, size: 52),
              const SizedBox(width: AppSpacing.s12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Flexible(
                          child: Text(
                            o.company.name,
                            style: context.text.label,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                        if (o.company.verified) ...[
                          const SizedBox(width: 5),
                          BOHGlyph(
                            BOHGlyphType.verified,
                            size: 15,
                            semanticLabel: l10n.verifiedLabel,
                          ),
                        ],
                      ],
                    ),
                    Text(
                      o.company.type.label(l10n),
                      style: context.text.bodySmall,
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.s14),
          Semantics(
            header: true,
            child: Text(o.title, style: context.text.title),
          ),
          const SizedBox(height: AppSpacing.s10),
          Wrap(
            spacing: AppSpacing.s8,
            runSpacing: AppSpacing.s8,
            children: [
              BOHMetaChip(
                opportunityTerms(
                  l10n,
                  type: o.type,
                  employment: o.employment,
                  duration: o.duration,
                ),
                large: true,
              ),
              BOHMetaChip(o.city, large: true),
              if (o.workSetup case final setup?)
                BOHMetaChip(setup.label(l10n), large: true),
              if (o.compensation case final pay?) BOHMetaChip(pay, large: true),
            ],
          ),
          const SizedBox(height: AppSpacing.s10),
          Text(
            [
              postedAgo(l10n, o.postedAt),
              if (closesAt != null && o.isOpenAt(DateTime.now()))
                l10n.opportunityClosesOn(
                  AppDateFormats.monthDayShort(context).format(closesAt),
                ),
            ].join(' · '),
            style: context.text.caption,
          ),
        ],
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
        helper: l10n.opportunityApplyHint,
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
