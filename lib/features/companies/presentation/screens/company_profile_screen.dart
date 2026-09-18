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
import '../company_labels.dart';
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
      appBar: BOHAppBar(
        showBack: false,
        title: l10n.navProfile,
        actions: [
          BOHIconButton(
            icon: AppIcons.settings,
            semanticLabel: l10n.settingsTitle,
            onPressed: () => showSettingsSheet(context),
          ),
        ],
      ),
      body: AsyncBody<Company>(
        value: ref.watch(myCompanyProvider),
        onRetry: () => ref.invalidate(myCompanyProvider),
        data: (company) => BOHRefresh(
          onRefresh: () => ref.refresh(myCompanyProvider.future),
          child: _Body(company: company, canEdit: canEdit),
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

    return ListView(
      padding: BOHScaffold.screenPadding.add(
        EdgeInsets.only(
          top: AppSpacing.s8,
          bottom: MediaQuery.paddingOf(context).bottom + AppSpacing.s32,
        ),
      ),
      children: [
        BOHCard(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  BOHIconCircle(
                    icon: company.type.icon,
                    size: 56,
                    rounded: true,
                  ),
                  const SizedBox(width: AppSpacing.s12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Semantics(
                          header: true,
                          child: Text(company.name, style: context.text.h2),
                        ),
                        Text(
                          company.type.label(l10n),
                          style: context.text.bodySmall,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.s12),
              // Verification is a status of its own; it is not required to
              // use company features and nothing here grants it.
              BOHTag(
                company.verified ? l10n.verifiedLabel : l10n.companyNotVerified,
                variant: company.verified
                    ? BOHTagVariant.verified
                    : BOHTagVariant.neutral,
                icon: company.verified ? null : AppIcons.shield,
              ),
              const SizedBox(height: AppSpacing.s8),
              Text(
                l10n.companyVerificationReadOnly,
                style: context.text.caption,
              ),
              if (canEdit) ...[
                const SizedBox(height: AppSpacing.s16),
                BOHButton(
                  label: l10n.companyEditProfile,
                  variant: BOHButtonVariant.secondary,
                  size: BOHButtonSize.small,
                  leadingIcon: AppIcons.edit,
                  trailingIcon: null,
                  onPressed: () => context.push(AppRoutes.companyProfileEdit),
                ),
              ],
            ],
          ),
        ),
        if (incomplete) ...[
          const SizedBox(height: AppSpacing.s12),
          BOHInfoNote(l10n.companyProfileIncomplete),
        ],
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
        const SizedBox(height: AppSpacing.s12),
        SectionCard(
          icon: AppIcons.email,
          title: l10n.companyContact,
          child:
              (company.contactEmail ??
                      company.contactPhone ??
                      company.website) ==
                  null
              ? Text(l10n.companyContactEmpty, style: context.text.bodySmall)
              : Column(
                  children: [
                    DetailLine(
                      icon: AppIcons.email,
                      value: company.contactEmail,
                    ),
                    DetailLine(
                      icon: AppIcons.phone,
                      value: company.contactPhone,
                    ),
                    DetailLine(icon: AppIcons.website, value: company.website),
                  ],
                ),
        ),
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
