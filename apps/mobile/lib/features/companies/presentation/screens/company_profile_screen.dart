import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../auth/presentation/controllers/auth_controller.dart';
import '../../../profile/presentation/widgets/settings_sheet.dart';
import '../../data/my_company_data.dart';
import '../../domain/company.dart';
import '../../domain/company_capability.dart';
import '../../domain/company_membership.dart';
import '../controllers/company_workspace_providers.dart';
import '../widgets/company_widgets.dart';

/// The company's business identity as others see it, with edit access for
/// members allowed to edit the profile.
class CompanyProfileScreen extends ConsumerWidget {
  const CompanyProfileScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final canEdit =
        ref
            .watch(companyMembershipProvider)
            ?.can(CompanyPermission.editProfile) ??
        false;

    return BOHScaffold(
      body: AsyncBody<Company>(
        value: ref.watch(myCompanyProvider),
        onRetry: () => ref.invalidate(myCompanyProvider),
        data: (company) => BOHRefresh(
          onRefresh: () => ref.refresh(myCompanyProvider.future),
          child: CompanyPhotoPage(
            company: company,
            actions: [
              BOHIconButton(
                icon: AppIcons.share,
                iconSize: 18,
                visualSize: 40,
                semanticLabel: l10n.actionShare,
                variant: BOHIconButtonVariant.photo,
                onPressed: () => ScaffoldMessenger.of(context)
                  ..hideCurrentSnackBar()
                  ..showSnackBar(
                    SnackBar(content: Text(l10n.comingSoonMessage)),
                  ),
              ),
              BOHIconButton(
                icon: AppIcons.settings,
                iconSize: 18,
                visualSize: 40,
                semanticLabel: l10n.settingsTitle,
                variant: BOHIconButtonVariant.photo,
                onPressed: () => showSettingsSheet(context),
              ),
            ],
            body: _Body(company: company, canEdit: canEdit),
          ),
        ),
      ),
    );
  }
}

class _Body extends ConsumerWidget {
  const _Body({required this.company, required this.canEdit});

  final Company company;
  final bool canEdit;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final c = context.colors;
    final incomplete = company.description.isEmpty || company.city.isEmpty;
    final projects = ref.watch(myCompanyProjectsProvider).value;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        CompanyIdentity(
          company: company,
          projects: projects?.length ?? company.completedProjects,
          action: canEdit
              ? BOHButton(
                  label: l10n.profileEditProfile,
                  variant: BOHButtonVariant.secondary,
                  size: BOHButtonSize.compact,
                  trailingIcon: null,
                  expand: false,
                  onPressed: () => context.push(AppRoutes.companyProfileEdit),
                )
              : null,
        ),
        const SizedBox(height: AppSpacing.s16),
        BOHSectionHeader(
          title: l10n.companyNavPortfolio,
          size: BOHSectionSize.compact,
          trailing: canEdit
              ? BOHLinkButton(
                  label: l10n.companyAddProject,
                  icon: AppIcons.plus,
                  fontSize: 12,
                  onTap: () => context.push(AppRoutes.companyNewProject),
                )
              : null,
        ),
        const SizedBox(height: AppSpacing.s8),
        CompanyPortfolioGrid(
          projects: projects,
          emptyMessage: l10n.companyPortfolioEmptyMessage,
          onTap: canEdit
              ? (p) => context.push(AppRoutes.companyEditProject(p.id))
              : null,
        ),
        if (incomplete) ...[
          const SizedBox(height: AppSpacing.s16),
          BOHInfoNote(l10n.companyProfileIncomplete),
        ],
        CompanyAboutSections(company: company, showEmptyContact: true),
        const SizedBox(height: AppSpacing.s12),
        SectionCard(
          icon: AppIcons.shield,
          title: l10n.companyCapabilities,
          child: Text(
            company.capabilities.contains(
                  CompanyCapability.createSupplierRequest,
                )
                ? l10n.companyCanCreateSupplierRequests
                : l10n.companyCannotCreateSupplierRequests,
            style: context.text.bodySmall.copyWith(color: c.textSecondary),
          ),
        ),
        const SizedBox(height: AppSpacing.s16),
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
