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
import '../../data/my_company_data.dart';
import '../../domain/company_project.dart';
import '../controllers/company_workspace_providers.dart';
import '../widgets/company_widgets.dart';

/// Work the company has delivered. Evidence for supplier responses.
class CompanyPortfolioScreen extends ConsumerWidget {
  const CompanyPortfolioScreen({super.key});

  Future<void> _delete(
    BuildContext context,
    WidgetRef ref,
    CompanyProject project,
  ) async {
    final l10n = context.l10n;
    final confirmed = await confirmCompanyAction(
      context,
      title: l10n.companyProjectDeleteTitle,
      message: l10n.companyProjectDeleteBody(project.title),
      action: l10n.actionDelete,
    );
    if (!confirmed || !context.mounted) return;
    final ok = await runCompanyAction(
      context,
      () => ref.read(myCompanyRepositoryProvider).deleteProject(project.id),
      success: l10n.companyProjectDeleted,
    );
    if (ok) ref.invalidate(myCompanyProjectsProvider);
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;

    return BOHScaffold(
      appBar: BOHAppBar(
        title: l10n.companyNavPortfolio,
        actions: [
          BOHIconButton(
            icon: AppIcons.plus,
            semanticLabel: l10n.companyAddProject,
            onPressed: () => context.push(AppRoutes.companyNewProject),
          ),
        ],
      ),
      body: AsyncBody<List<CompanyProject>>(
        value: ref.watch(myCompanyProjectsProvider),
        onRetry: () => ref.invalidate(myCompanyProjectsProvider),
        data: (projects) => BOHRefresh(
          onRefresh: () => ref.refresh(myCompanyProjectsProvider.future),
          child: ListView(
            padding: BOHScaffold.screenPadding.add(
              EdgeInsets.only(
                top: AppSpacing.s8,
                bottom: MediaQuery.paddingOf(context).bottom + AppSpacing.s32,
              ),
            ),
            children: [
              BOHPageHeader(
                title: l10n.companyNavPortfolio,
                subtitle: l10n.companyPortfolioSubtitle,
              ),
              const SizedBox(height: AppSpacing.s16),
              if (projects.isEmpty)
                SizedBox(
                  height: 320,
                  child: BOHEmptyState(
                    icon: AppIcons.workshop,
                    title: l10n.companyPortfolioEmptyTitle,
                    message: l10n.companyPortfolioEmptyMessage,
                    actionLabel: l10n.companyAddProject,
                    onAction: () => context.push(AppRoutes.companyNewProject),
                  ),
                )
              else
                for (final p in projects)
                  Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.s12),
                    child: CompanyProjectCard(
                      project: p,
                      onEdit: () =>
                          context.push(AppRoutes.companyEditProject(p.id)),
                      onDelete: () => _delete(context, ref, p),
                    ),
                  ),
            ],
          ),
        ),
      ),
    );
  }
}

class CompanyProjectCard extends StatelessWidget {
  const CompanyProjectCard({
    super.key,
    required this.project,
    this.onEdit,
    this.onDelete,
  });

  final CompanyProject project;
  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final p = project;
    final monthYear = AppDateFormats.monthYear(context);
    final period = {
      monthYear.format(p.startedAt),
      if (p.endedAt case final end?) monthYear.format(end),
    }.join(' – ');

    return BOHCard(
      padding: EdgeInsets.zero,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (p.images.isNotEmpty)
            BOHImage(
              image: p.images.first,
              aspectRatio: 16 / 7,
              borderRadius: const BorderRadius.vertical(
                top: Radius.circular(AppRadii.medium),
              ),
            ),
          Padding(
            padding: const EdgeInsets.all(AppSpacing.cardPadding),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                BOHEyebrow(p.category, color: context.colors.primaryText),
                const SizedBox(height: AppSpacing.s4),
                Text(p.title, style: context.text.cardTitle),
                const SizedBox(height: AppSpacing.s4),
                Text(
                  p.description,
                  style: context.text.bodySmall,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: AppSpacing.s8),
                Text(
                  [p.location, period].join(' · '),
                  style: context.text.caption,
                ),
                Text(
                  p.clientName ?? l10n.companyProjectClientConfidential,
                  style: context.text.caption,
                ),
                if (p.services.isNotEmpty) ...[
                  const SizedBox(height: AppSpacing.s8),
                  Wrap(
                    spacing: AppSpacing.s8,
                    runSpacing: AppSpacing.s8,
                    children: [
                      for (final s in p.services)
                        BOHTag(s, variant: BOHTagVariant.neutral),
                    ],
                  ),
                ],
                if (onEdit != null || onDelete != null) ...[
                  const SizedBox(height: AppSpacing.s8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      if (onDelete != null)
                        BOHIconButton(
                          icon: AppIcons.delete,
                          semanticLabel: l10n.actionDelete,
                          onPressed: onDelete,
                        ),
                      if (onEdit != null)
                        BOHIconButton(
                          icon: AppIcons.edit,
                          semanticLabel: l10n.actionEdit,
                          onPressed: onEdit,
                        ),
                    ],
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
