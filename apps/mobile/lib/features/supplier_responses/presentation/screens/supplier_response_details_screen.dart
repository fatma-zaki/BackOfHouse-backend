import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/utils/date_formats.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../companies/data/my_company_data.dart';
import '../../../companies/presentation/controllers/company_workspace_providers.dart';
import '../../../companies/presentation/widgets/company_widgets.dart';
import '../../../opportunities/presentation/widgets/opportunity_widgets.dart';
import '../../data/supplier_requests_data.dart';
import '../../domain/supplier_response.dart';

/// One supplier response. The buyer manages its status; the responder
/// follows it.
class SupplierResponseDetailsScreen extends ConsumerWidget {
  const SupplierResponseDetailsScreen({super.key, required this.responseId});

  final String responseId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final own = ref.watch(companyMembershipProvider)?.company;
    final value = ref.watch(supplierResponseProvider(responseId));

    return BOHScaffold(
      appBar: BOHAppBar(title: l10n.supplierResponse),
      bottomNavigationBar: switch (value) {
        AsyncData(value: final r)
            when r.buyer.id == own?.id && !r.status.isFinal =>
          _BuyerActions(response: r),
        _ => null,
      },
      body: AsyncBody<SupplierResponse>(
        value: value,
        onRetry: () => ref.invalidate(supplierResponseProvider(responseId)),
        data: (r) => ListView(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.screenHorizontal,
            AppSpacing.s8,
            AppSpacing.screenHorizontal,
            AppSpacing.s32,
          ),
          children: [
            BOHCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SupplierResponseStatusPill(r.status),
                  const SizedBox(height: AppSpacing.s10),
                  Semantics(
                    header: true,
                    child: Text(r.requestTitle, style: context.text.h2),
                  ),
                  Text(
                    l10n.supplierForBuyer(r.buyer.name),
                    style: context.text.bodySmall,
                  ),
                  Text(
                    l10n.supplierSentOn(
                      AppDateFormats.mediumDate(context).format(r.submittedAt),
                    ),
                    style: context.text.caption,
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.s12),
            SectionCard(
              icon: AppIcons.companies,
              title: l10n.supplierRespondingCompany,
              child: CompanyByline(company: r.responder),
            ),
            const SizedBox(height: AppSpacing.s12),
            SectionCard(
              icon: AppIcons.comment,
              title: l10n.supplierMessage,
              child: Text(r.message, style: context.text.body),
            ),
            if (r.proposedPrice != null || r.setupTime != null) ...[
              const SizedBox(height: AppSpacing.s12),
              Row(
                children: [
                  if (r.proposedPrice case final price?)
                    Expanded(
                      child: BOHFieldTile(
                        label: l10n.supplierProposedPrice,
                        value: price,
                      ),
                    ),
                  if (r.proposedPrice != null && r.setupTime != null)
                    const SizedBox(width: AppSpacing.s10),
                  if (r.setupTime case final setup?)
                    Expanded(
                      child: BOHFieldTile(
                        label: l10n.supplierSetupTime,
                        value: setup,
                      ),
                    ),
                ],
              ),
            ],
            const SizedBox(height: AppSpacing.s16),
            BOHSectionHeader(
              title: l10n.supplierEvidence,
              size: BOHSectionSize.compact,
            ),
            const SizedBox(height: AppSpacing.s8),
            CompanyPortfolioGrid(
              projects: r.projects,
              emptyMessage: l10n.companyNoneIncluded,
            ),
          ],
        ),
      ),
    );
  }
}

class _BuyerActions extends ConsumerWidget {
  const _BuyerActions({required this.response});

  final SupplierResponse response;

  Future<void> _move(
    BuildContext context,
    WidgetRef ref,
    SupplierResponseStatus to,
  ) async {
    final l10n = context.l10n;
    if (to.isFinal) {
      final confirmed = await confirmCompanyAction(
        context,
        title: to == SupplierResponseStatus.selected
            ? l10n.supplierSelectTitle
            : l10n.companyRejectTitle,
        message: to == SupplierResponseStatus.selected
            ? l10n.supplierSelectBody(response.responder.name)
            : l10n.companyDecisionFinal(response.responder.name),
        action: to == SupplierResponseStatus.selected
            ? l10n.supplierSelect
            : l10n.companyRejectApplicant,
      );
      if (!confirmed || !context.mounted) return;
    }
    final ok = await runCompanyAction(
      context,
      () => ref
          .read(supplierRequestsRepositoryProvider)
          .updateResponseStatus(response.id, to),
      success: l10n.companyStatusUpdated(to.label(l10n)),
    );
    if (ok) {
      ref
        ..invalidate(supplierResponseProvider(response.id))
        ..invalidate(responsesToMyRequestProvider(response.requestId));
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final next = SupplierResponseRules.nextStatuses(response.status);
    final advance = next
        .where((s) => s != SupplierResponseStatus.rejected)
        .firstOrNull;

    final reject = next.contains(SupplierResponseStatus.rejected)
        ? BOHButton(
            label: l10n.companyRejectApplicant,
            variant: BOHButtonVariant.secondary,
            size: BOHButtonSize.large,
            trailingIcon: null,
            onPressed: () =>
                _move(context, ref, SupplierResponseStatus.rejected),
          )
        : null;
    final forward = advance == null
        ? null
        : BOHButton(
            label: switch (advance) {
              SupplierResponseStatus.reviewed => l10n.companyMarkReviewed,
              SupplierResponseStatus.shortlisted => l10n.companyShortlist,
              _ => l10n.supplierSelect,
            },
            size: BOHButtonSize.large,
            trailingIcon: null,
            onPressed: () => _move(context, ref, advance),
          );

    return switch ((reject, forward)) {
      (final r?, final f?) => BOHActionBar.pair(secondary: r, primary: f),
      (final only?, null) || (null, final only?) => BOHActionBar(child: only),
      _ => const SizedBox.shrink(),
    };
  }
}
