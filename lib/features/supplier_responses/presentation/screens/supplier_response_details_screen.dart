import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/utils/date_formats.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../companies/data/my_company_data.dart';
import '../../../companies/presentation/controllers/company_workspace_providers.dart';
import '../../../companies/presentation/screens/company_portfolio_screen.dart';
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
          padding: BOHScaffold.screenPadding.add(
            const EdgeInsets.only(top: AppSpacing.s8, bottom: AppSpacing.s32),
          ),
          children: [
            BOHCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SupplierResponseStatusPill(r.status),
                  const SizedBox(height: AppSpacing.s12),
                  Text(r.requestTitle, style: context.text.h2),
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
            if (r.proposedPrice case final price?) ...[
              const SizedBox(height: AppSpacing.s12),
              SectionCard(
                icon: AppIcons.points,
                title: l10n.supplierProposedPrice,
                child: Text(price, style: context.text.label),
              ),
            ],
            const SizedBox(height: AppSpacing.sectionSpacing),
            BOHSectionHeader(title: l10n.supplierEvidence),
            const SizedBox(height: AppSpacing.s12),
            if (r.projects.isEmpty)
              BOHInfoNote(l10n.companyNoneIncluded)
            else
              for (final p in r.projects)
                Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.s12),
                  child: CompanyProjectCard(project: p),
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

    return BOHActionBar(
      child: Row(
        children: [
          if (next.contains(SupplierResponseStatus.rejected))
            Expanded(
              child: BOHButton(
                label: l10n.companyRejectApplicant,
                variant: BOHButtonVariant.ghost,
                trailingIcon: null,
                onPressed: () =>
                    _move(context, ref, SupplierResponseStatus.rejected),
              ),
            ),
          if (advance != null) ...[
            const SizedBox(width: AppSpacing.s8),
            Expanded(
              flex: 2,
              child: BOHButton(
                label: switch (advance) {
                  SupplierResponseStatus.reviewed => l10n.companyMarkReviewed,
                  SupplierResponseStatus.shortlisted => l10n.companyShortlist,
                  _ => l10n.supplierSelect,
                },
                trailingIcon: null,
                onPressed: () => _move(context, ref, advance),
              ),
            ),
          ],
        ],
      ),
    );
  }
}
