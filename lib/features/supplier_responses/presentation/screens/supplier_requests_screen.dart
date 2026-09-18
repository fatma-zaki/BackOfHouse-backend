import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../companies/data/my_company_data.dart';
import '../../../companies/domain/company_capability.dart';
import '../../../companies/presentation/controllers/company_workspace_providers.dart';
import '../../../companies/presentation/widgets/company_widgets.dart';
import '../../../opportunities/domain/opportunity.dart';
import '../../../opportunities/presentation/widgets/opportunity_widgets.dart';
import '../../domain/supplier_response.dart';
import '../widgets/supplier_widgets.dart';

enum _Tab { invited, responses }

/// Supplier requests that invite this company's type, and the responses it
/// has sent. Buyers manage their own requests under Opportunities.
class SupplierRequestsScreen extends ConsumerStatefulWidget {
  const SupplierRequestsScreen({super.key});

  @override
  ConsumerState<SupplierRequestsScreen> createState() =>
      _SupplierRequestsScreenState();
}

class _SupplierRequestsScreenState
    extends ConsumerState<SupplierRequestsScreen> {
  _Tab _tab = _Tab.invited;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final canCreate =
        ref
            .watch(companyMembershipProvider)
            ?.company
            .can(CompanyCapability.createSupplierRequest) ??
        false;

    return BOHScaffold(
      appBar: BOHAppBar(
        title: l10n.companyNavSupplierRequests,
        actions: [
          if (canCreate)
            BOHIconButton(
              icon: AppIcons.plus,
              semanticLabel: l10n.supplierCreateRequest,
              onPressed: () => context.push(AppRoutes.companyNewOpportunity),
            ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          ref
            ..invalidate(invitedSupplierRequestsProvider)
            ..invalidate(mySupplierResponsesProvider);
        },
        child: ListView(
          padding: BOHScaffold.screenPadding.add(
            EdgeInsets.only(
              top: AppSpacing.s8,
              bottom: MediaQuery.paddingOf(context).bottom + AppSpacing.s32,
            ),
          ),
          children: [
            BOHPageHeader(
              title: l10n.companyNavSupplierRequests,
              subtitle: l10n.supplierRequestsSubtitle,
            ),
            const SizedBox(height: AppSpacing.s16),
            BOHSegmentedControl<_Tab>(
              segments: [
                (_Tab.invited, l10n.supplierTabInvited),
                (_Tab.responses, l10n.supplierTabMyResponses),
              ],
              selected: _tab,
              onChanged: (t) => setState(() => _tab = t),
            ),
            const SizedBox(height: AppSpacing.s16),
            if (_tab == _Tab.invited)
              _Invited(ref: ref)
            else
              _Responses(ref: ref),
          ],
        ),
      ),
    );
  }
}

class _Invited extends StatelessWidget {
  const _Invited({required this.ref});

  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return AsyncBody<List<Opportunity>>(
      value: ref.watch(invitedSupplierRequestsProvider),
      onRetry: () => ref.invalidate(invitedSupplierRequestsProvider),
      data: (requests) => requests.isEmpty
          ? SizedBox(
              height: 300,
              child: BOHEmptyState(
                icon: AppIcons.supplierRequests,
                title: l10n.supplierInvitedEmptyTitle,
                message: l10n.supplierInvitedEmptyMessage,
              ),
            )
          : Column(
              children: [
                for (final r in requests)
                  Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.s12),
                    child: WorkspaceTile(
                      onTap: () =>
                          context.push(AppRoutes.companySupplierRequest(r.id)),
                      leading: const BOHIconCircle(
                        icon: AppIcons.supplierRequests,
                        size: 40,
                        rounded: true,
                      ),
                      title: r.title,
                      subtitle: l10n.supplierForBuyer(r.company.name),
                      caption: [
                        r.city,
                        postedAgo(l10n, r.postedAt),
                      ].join(' · '),
                    ),
                  ),
              ],
            ),
    );
  }
}

class _Responses extends StatelessWidget {
  const _Responses({required this.ref});

  final WidgetRef ref;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    return AsyncBody<List<SupplierResponse>>(
      value: ref.watch(mySupplierResponsesProvider),
      onRetry: () => ref.invalidate(mySupplierResponsesProvider),
      data: (responses) => responses.isEmpty
          ? SizedBox(
              height: 300,
              child: BOHEmptyState(
                icon: AppIcons.post,
                title: l10n.supplierResponsesEmptyTitle,
                message: l10n.supplierResponsesEmptyMessage,
              ),
            )
          : Column(
              children: [
                for (final r in responses)
                  Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.s12),
                    child: SupplierResponseTile(
                      response: r,
                      onTap: () =>
                          context.push(AppRoutes.companyResponse(r.id)),
                    ),
                  ),
              ],
            ),
    );
  }
}
