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
import '../../../opportunities/presentation/widgets/opportunity_widgets.dart';
import '../../domain/company.dart';
import '../controllers/company_directory_providers.dart';
import '../widgets/company_widgets.dart';

/// A company's public profile as members see it: identity, its open
/// opportunities and its delivered work. Verification is shown as a state,
/// never implied by follows, activity or listings.
class CompanyDetailsScreen extends ConsumerWidget {
  const CompanyDetailsScreen({super.key, required this.companyId});

  final String companyId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final provider = companyDetailProvider(companyId);

    return BOHScaffold(
      body: switch (ref.watch(provider)) {
        AsyncData(value: final company) => BOHRefresh(
          onRefresh: () {
            ref
              ..invalidate(companyProjectsProvider(companyId))
              ..invalidate(companyOpenOpportunitiesProvider(companyId));
            return ref.refresh(provider.future);
          },
          child: CompanyPhotoPage(
            company: company,
            leading: BOHIconButton(
              icon: AppIcons.arrowBack,
              semanticLabel: l10n.actionBack,
              variant: BOHIconButtonVariant.photo,
              onPressed: () => context.pop(),
            ),
            body: _Body(company: company),
          ),
        ),
        AsyncError(:final error) => Column(
          children: [
            BOHAppBar(title: l10n.companyDetailsTitle),
            Expanded(
              child: BOHErrorState(
                error: error,
                onRetry: () => ref.invalidate(provider),
              ),
            ),
          ],
        ),
        _ => Column(
          children: [
            BOHAppBar(title: l10n.companyDetailsTitle),
            const Expanded(child: BOHLoadingState()),
          ],
        ),
      },
    );
  }
}

class _Body extends ConsumerWidget {
  const _Body({required this.company});

  final Company company;

  Future<void> _toggleFollow(BuildContext context, WidgetRef ref) async {
    try {
      await ref.read(companyDetailProvider(company.id).notifier).toggleFollow();
      // Keep the directory's picks in step.
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
    // Opportunities here are the individual-facing listings; a company
    // browsing another company's profile has no use for them.
    final individual =
        ref.watch(sessionAccountTypeProvider) == AccountType.individual;
    final opportunities = individual
        ? ref.watch(companyOpenOpportunitiesProvider(company.id))
        : null;
    final projects = ref.watch(companyProjectsProvider(company.id));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        CompanyIdentity(
          company: company,
          projects: projects.value?.length ?? company.completedProjects,
          action: individual
              ? BOHButton(
                  label: company.followed
                      ? l10n.actionFollowing
                      : l10n.actionFollow,
                  variant: company.followed
                      ? BOHButtonVariant.secondary
                      : BOHButtonVariant.primary,
                  size: BOHButtonSize.compact,
                  leadingIcon: company.followed
                      ? AppIcons.check
                      : AppIcons.plus,
                  trailingIcon: null,
                  expand: false,
                  onPressed: () => _toggleFollow(context, ref),
                )
              : null,
        ),
        if (opportunities != null) ...[
          const SizedBox(height: AppSpacing.s16),
          BOHSectionHeader(
            title: l10n.companyDetailsOpportunities,
            size: BOHSectionSize.compact,
          ),
          const SizedBox(height: AppSpacing.s8),
          switch (opportunities) {
            AsyncValue(value: final items?) when items.isEmpty => BOHInfoNote(
              l10n.companyDetailsNoOpportunities,
            ),
            AsyncValue(value: final items?) => Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                for (final o in items)
                  Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.s10),
                    child: OpportunityRowCard(
                      opportunity: o,
                      onTap: () => context.push(AppRoutes.opportunity(o.id)),
                    ),
                  ),
              ],
            ),
            AsyncError(:final error) => _InlineError(
              error: error,
              onRetry: () =>
                  ref.invalidate(companyOpenOpportunitiesProvider(company.id)),
            ),
            _ => const BOHShimmer(
              child: BOHSkeleton(height: 80, borderRadius: AppRadii.mediumAll),
            ),
          },
        ],
        const SizedBox(height: AppSpacing.s16),
        BOHSectionHeader(
          title: l10n.companyNavPortfolio,
          size: BOHSectionSize.compact,
        ),
        const SizedBox(height: AppSpacing.s8),
        if (projects case AsyncError(:final error))
          _InlineError(
            error: error,
            onRetry: () => ref.invalidate(companyProjectsProvider(company.id)),
          )
        else
          CompanyPortfolioGrid(
            projects: projects.value,
            emptyMessage: l10n.companyDetailsNoProjects,
          ),
        CompanyAboutSections(company: company),
      ],
    );
  }
}

class _InlineError extends StatelessWidget {
  const _InlineError({required this.error, required this.onRetry});

  final Object error;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return Row(
      children: [
        Expanded(child: Text(l10n.error(error), style: context.text.bodySmall)),
        BOHButton(
          label: l10n.actionRetry,
          variant: BOHButtonVariant.text,
          trailingIcon: null,
          expand: false,
          onPressed: onRetry,
        ),
      ],
    );
  }
}
