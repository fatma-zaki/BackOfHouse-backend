import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/utils/date_formats.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../companies/data/my_company_data.dart';
import '../../../companies/presentation/controllers/company_workspace_providers.dart';
import '../../../companies/presentation/widgets/company_widgets.dart';
import '../../../opportunities/domain/opportunity.dart';
import '../../../opportunities/presentation/widgets/opportunity_widgets.dart';
import '../../domain/supplier_response.dart';
import '../widgets/supplier_widgets.dart';

/// A supplier request. Invited suppliers see whether they may respond;
/// the buyer sees the responses it has received.
class SupplierRequestDetailsScreen extends ConsumerWidget {
  const SupplierRequestDetailsScreen({super.key, required this.requestId});

  final String requestId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final own = ref.watch(companyMembershipProvider)?.company;
    final request = ref.watch(supplierRequestProvider(requestId));
    final isBuyer = request.value?.company.id == own?.id;
    final myResponse = ref
        .watch(mySupplierResponsesProvider)
        .value
        ?.where((r) => r.requestId == requestId)
        .firstOrNull;

    return BOHScaffold(
      appBar: BOHAppBar(title: l10n.opportunityTypeSupplierRequest),
      bottomNavigationBar: switch (request) {
        AsyncData(value: final r) when own != null && !isBuyer => _Footer(
          eligibility: SupplierResponseRules.eligibility(
            request: r,
            responder: own,
            alreadyResponded: myResponse != null,
          ),
          requestId: r.id,
          myResponse: myResponse,
        ),
        _ => null,
      },
      body: AsyncBody<Opportunity>(
        value: request,
        onRetry: () => ref.invalidate(supplierRequestProvider(requestId)),
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
                  CompanyByline(company: r.company),
                  const SizedBox(height: AppSpacing.s12),
                  Semantics(
                    header: true,
                    child: Text(r.title, style: context.text.h1),
                  ),
                  const SizedBox(height: AppSpacing.s8),
                  Text(
                    [r.city, ?r.compensation].join(' · '),
                    style: context.text.bodySmall,
                  ),
                  Text(
                    [
                      postedAgo(l10n, r.postedAt),
                      if (r.closesAt case final closes?)
                        l10n.opportunityClosesOn(
                          AppDateFormats.mediumDate(context).format(closes),
                        ),
                    ].join(' · '),
                    style: context.text.caption,
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.s12),
            SectionCard(
              icon: AppIcons.supplierRequests,
              title: l10n.companySupplierTypes,
              child: SupplierTypesWrap(types: r.supplierTypes),
            ),
            const SizedBox(height: AppSpacing.s12),
            SectionCard(
              icon: AppIcons.report,
              title: l10n.opportunityOverview,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(r.summary, style: context.text.label),
                  const SizedBox(height: AppSpacing.s8),
                  Text(r.description, style: context.text.body),
                ],
              ),
            ),
            if (r.requirements.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.s12),
              SectionCard(
                icon: AppIcons.level,
                title: l10n.opportunityRequirements,
                child: Bulleted(items: r.requirements),
              ),
            ],
            if (isBuyer) ...[
              const SizedBox(height: AppSpacing.s16),
              BOHSectionHeader(
                title: l10n.supplierResponsesReceived,
                size: BOHSectionSize.compact,
              ),
              const SizedBox(height: AppSpacing.s8),
              AsyncBody<List<SupplierResponse>>(
                value: ref.watch(responsesToMyRequestProvider(r.id)),
                onRetry: () =>
                    ref.invalidate(responsesToMyRequestProvider(r.id)),
                data: (responses) => responses.isEmpty
                    ? BOHInfoNote(l10n.supplierNoResponsesYet)
                    : Column(
                        children: [
                          for (final response in responses)
                            Padding(
                              padding: const EdgeInsets.only(
                                bottom: AppSpacing.s12,
                              ),
                              child: SupplierResponseTile(
                                response: response,
                                asBuyer: true,
                                onTap: () => context.push(
                                  AppRoutes.companyResponse(response.id),
                                ),
                              ),
                            ),
                        ],
                      ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _Footer extends StatelessWidget {
  const _Footer({
    required this.eligibility,
    required this.requestId,
    required this.myResponse,
  });

  final SupplierResponseEligibility eligibility;
  final String requestId;
  final SupplierResponse? myResponse;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final response = myResponse;
    if (response != null) {
      return BOHActionBar(
        child: BOHButton(
          label: l10n.supplierViewMyResponse,
          variant: BOHButtonVariant.secondary,
          size: BOHButtonSize.large,
          onPressed: () => context.push(AppRoutes.companyResponse(response.id)),
        ),
      );
    }
    if (eligibility.isEligible) {
      return BOHActionBar(
        child: BOHButton(
          label: l10n.supplierRespond,
          size: BOHButtonSize.large,
          onPressed: () => context.push(AppRoutes.companyRespond(requestId)),
        ),
      );
    }
    return BOHActionBar(child: BOHInfoNote(eligibility.message(l10n)));
  }
}
