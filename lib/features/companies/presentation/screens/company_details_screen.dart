import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_radii.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/l10n_messages.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../auth/domain/account_type.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
import '../../../discover/presentation/controllers/discover_providers.dart';
import '../../../opportunities/domain/opportunity.dart';
import '../../../opportunities/presentation/widgets/opportunity_widgets.dart';
import '../../domain/company.dart';
import '../../domain/company_project.dart';
import '../company_labels.dart';
import '../controllers/company_directory_providers.dart';
import '../widgets/company_widgets.dart';
import 'company_portfolio_screen.dart';

/// A company's public profile as members see it: identity, what it does,
/// its open opportunities and its delivered work. Verification is shown as
/// a state, never implied by follows, activity or listings.
class CompanyDetailsScreen extends ConsumerWidget {
  const CompanyDetailsScreen({super.key, required this.companyId});

  final String companyId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final provider = companyDetailProvider(companyId);

    return BOHScaffold(
      appBar: BOHAppBar(title: context.l10n.companyDetailsTitle),
      body: AsyncBody<Company>(
        value: ref.watch(provider),
        onRetry: () => ref.invalidate(provider),
        data: (company) => BOHRefresh(
          onRefresh: () {
            ref
              ..invalidate(companyProjectsProvider(companyId))
              ..invalidate(companyOpenOpportunitiesProvider(companyId));
            return ref.refresh(provider.future);
          },
          child: _Body(company: company),
        ),
      ),
    );
  }
}

class _Body extends ConsumerWidget {
  const _Body({required this.company});

  final Company company;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    // Opportunities here are the individual-facing listings; a company
    // browsing another company's profile has no use for them.
    final individual =
        ref.watch(sessionAccountTypeProvider) == AccountType.individual;
    final opportunities = individual
        ? ref.watch(companyOpenOpportunitiesProvider(company.id))
        : null;
    final hasContact =
        (company.contactEmail ?? company.contactPhone ?? company.website) !=
        null;

    return ListView(
      padding: BOHScaffold.screenPadding.add(
        EdgeInsets.only(
          top: AppSpacing.s8,
          bottom: MediaQuery.paddingOf(context).bottom + AppSpacing.s32,
        ),
      ),
      children: [
        _Header(
          company: company,
          openCount: opportunities?.value?.length ?? company.openOpportunities,
        ),
        const SizedBox(height: AppSpacing.s12),
        SectionCard(
          icon: AppIcons.companies,
          title: l10n.companyAbout,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (company.description.isNotEmpty) ...[
                Text(company.description, style: context.text.body),
                const SizedBox(height: AppSpacing.s12),
              ],
              DetailLine(
                icon: AppIcons.job,
                label: l10n.companySpecialization,
                value: company.specialization,
              ),
              DetailLine(icon: AppIcons.location, value: company.city),
            ],
          ),
        ),
        if (company.services.isNotEmpty || company.industries.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.s12),
          SectionCard(
            icon: AppIcons.technology,
            title: l10n.companyServices,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Wrap(
                  spacing: AppSpacing.s8,
                  runSpacing: AppSpacing.s8,
                  children: [
                    for (final s in company.services)
                      BOHTag(s, variant: BOHTagVariant.outline),
                  ],
                ),
                if (company.industries.isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.s12),
                  Text(l10n.companyIndustries, style: context.text.caption),
                  const SizedBox(height: AppSpacing.s8),
                  Wrap(
                    spacing: AppSpacing.s8,
                    runSpacing: AppSpacing.s8,
                    children: [
                      for (final i in company.industries)
                        BOHTag(i, variant: BOHTagVariant.neutral),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
        if (hasContact) ...[
          const SizedBox(height: AppSpacing.s12),
          SectionCard(
            icon: AppIcons.email,
            title: l10n.companyContact,
            child: Column(
              children: [
                DetailLine(icon: AppIcons.email, value: company.contactEmail),
                DetailLine(icon: AppIcons.phone, value: company.contactPhone),
                DetailLine(icon: AppIcons.website, value: company.website),
              ],
            ),
          ),
        ],
        if (opportunities != null) ...[
          const SizedBox(height: AppSpacing.sectionSpacing),
          BOHSectionHeader(title: l10n.companyDetailsOpportunities),
          const SizedBox(height: AppSpacing.s12),
          _Section<Opportunity>(
            value: opportunities,
            empty: l10n.companyDetailsNoOpportunities,
            onRetry: () =>
                ref.invalidate(companyOpenOpportunitiesProvider(company.id)),
            itemBuilder: (o) => OpportunityCard(
              opportunity: o,
              onTap: () => context.push(AppRoutes.opportunity(o.id)),
            ),
          ),
        ],
        const SizedBox(height: AppSpacing.sectionSpacing),
        BOHSectionHeader(title: l10n.companyNavPortfolio),
        const SizedBox(height: AppSpacing.s12),
        _Section<CompanyProject>(
          value: ref.watch(companyProjectsProvider(company.id)),
          empty: l10n.companyDetailsNoProjects,
          onRetry: () => ref.invalidate(companyProjectsProvider(company.id)),
          itemBuilder: (p) => CompanyProjectCard(project: p),
        ),
      ],
    );
  }
}

class _Header extends ConsumerWidget {
  const _Header({required this.company, required this.openCount});

  final Company company;
  final int openCount;

  Future<void> _toggleFollow(BuildContext context, WidgetRef ref) async {
    try {
      await ref.read(companyDetailProvider(company.id).notifier).toggleFollow();
      // Keep Discover's recommendation card in step.
      ref.invalidate(companiesToWatchProvider);
    } catch (error) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context)
        ..hideCurrentSnackBar()
        ..showSnackBar(SnackBar(content: Text(context.l10n.error(error))));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final c = context.colors;

    return BOHCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              BOHIconCircle(icon: company.type.icon, size: 64, rounded: true),
              const SizedBox(width: AppSpacing.s12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Semantics(
                      header: true,
                      child: Text(company.name, style: context.text.h2),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      [
                        company.type.label(l10n),
                        if (company.specialization.isNotEmpty)
                          company.specialization,
                      ].join(' · '),
                      style: context.text.bodySmall,
                    ),
                    if (company.city.isNotEmpty) ...[
                      const SizedBox(height: AppSpacing.s4),
                      Row(
                        children: [
                          Icon(
                            AppIcons.location,
                            size: AppSizes.iconSmall,
                            color: c.textMuted,
                          ),
                          const SizedBox(width: AppSpacing.s4),
                          Flexible(
                            child: Text(
                              company.city,
                              style: context.text.caption,
                            ),
                          ),
                        ],
                      ),
                    ],
                    if (company.verified) ...[
                      const SizedBox(height: AppSpacing.s8),
                      BOHTag(
                        l10n.verifiedLabel,
                        variant: BOHTagVariant.verified,
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.s16),
          Container(
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.s12),
            decoration: BoxDecoration(
              color: c.primaryWash,
              borderRadius: AppRadii.mediumAll,
            ),
            child: IntrinsicHeight(
              child: Row(
                children: [
                  Expanded(
                    child: _Stat(
                      value: openCount,
                      label: l10n.companyDetailsOpportunitiesStat,
                    ),
                  ),
                  VerticalDivider(width: 1, color: c.border),
                  Expanded(
                    child: _Stat(
                      value: company.completedProjects,
                      label: l10n.companyDetailsProjectsStat,
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.s16),
          BOHButton(
            label: company.followed ? l10n.actionFollowing : l10n.actionFollow,
            variant: company.followed
                ? BOHButtonVariant.secondary
                : BOHButtonVariant.primary,
            leadingIcon: company.followed ? AppIcons.check : AppIcons.plus,
            trailingIcon: null,
            onPressed: () => _toggleFollow(context, ref),
          ),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  const _Stat({required this.value, required this.label});

  final int value;
  final String label;

  @override
  Widget build(BuildContext context) {
    return MergeSemantics(
      child: Column(
        children: [
          Text('$value', style: context.text.h2),
          Text(
            label,
            style: context.text.caption,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }
}

/// A list section that loads on its own: skeleton, inline retry, empty line
/// or the items.
class _Section<T> extends StatelessWidget {
  const _Section({
    required this.value,
    required this.empty,
    required this.onRetry,
    required this.itemBuilder,
  });

  final AsyncValue<List<T>> value;
  final String empty;
  final VoidCallback onRetry;
  final Widget Function(T item) itemBuilder;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return switch (value) {
      AsyncValue(value: final items?) when items.isEmpty => BOHInfoNote(empty),
      AsyncValue(value: final items?) => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          for (final item in items)
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.s12),
              child: itemBuilder(item),
            ),
        ],
      ),
      AsyncError(:final error) => Row(
        children: [
          Expanded(
            child: Text(l10n.error(error), style: context.text.bodySmall),
          ),
          BOHButton(
            label: l10n.actionRetry,
            variant: BOHButtonVariant.text,
            trailingIcon: null,
            expand: false,
            onPressed: onRetry,
          ),
        ],
      ),
      _ => const BOHShimmer(
        child: BOHSkeleton(height: 120, borderRadius: AppRadii.mediumAll),
      ),
    };
  }
}
