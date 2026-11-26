import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/l10n_messages.dart';
import '../../../../core/utils/date_formats.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../companies/data/my_company_data.dart';
import '../../../companies/domain/company_capability.dart';
import '../../../companies/presentation/company_labels.dart';
import '../../../companies/presentation/controllers/company_workspace_providers.dart';
import '../../../companies/presentation/widgets/company_widgets.dart';
import '../../../opportunities/domain/opportunity.dart';
import '../../../opportunities/presentation/screens/company_opportunities_screen.dart';
import '../../domain/supplier_response.dart';

enum _Tab { invited, responses, requests }

/// The Suppliers tab: requests open to this company's type, the responses
/// it has sent, and — for companies that may post them — its own requests.
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
    final invited = ref.watch(invitedSupplierRequestsProvider);
    final responses = ref.watch(mySupplierResponsesProvider);

    return BOHScaffold(
      appBar: BOHAppBar.tab(
        title: l10n.supplierRequestsTitle,
        actions: [
          if (canCreate)
            BOHIconButton(
              icon: AppIcons.plus,
              semanticLabel: l10n.supplierCreateRequest,
              variant: BOHIconButtonVariant.filled,
              onPressed: () => context.push(AppRoutes.companyNewOpportunity),
            ),
        ],
      ),
      body: BOHRefresh(
        onRefresh: () async {
          ref
            ..invalidate(invitedSupplierRequestsProvider)
            ..invalidate(mySupplierResponsesProvider)
            ..invalidate(myCompanyOpportunitiesProvider);
        },
        child: ListView(
          padding: BOHScaffold.screenPadding.add(
            EdgeInsets.only(
              top: AppSpacing.s4,
              bottom: MediaQuery.paddingOf(context).bottom + AppSpacing.s32,
            ),
          ),
          children: [
            BOHSegmentedControl<_Tab>(
              segments: [
                (
                  _Tab.invited,
                  l10n.supplierTabInvitedCount(invited.value?.length ?? 0),
                ),
                (
                  _Tab.responses,
                  l10n.supplierTabResponsesCount(responses.value?.length ?? 0),
                ),
                if (canCreate) (_Tab.requests, l10n.supplierTabMyRequests),
              ],
              selected: _tab,
              onChanged: (t) => setState(() => _tab = t),
            ),
            const SizedBox(height: AppSpacing.s14),
            switch (_tab) {
              _Tab.invited => _Invited(
                requests: invited,
                responses: responses.value ?? const [],
              ),
              _Tab.responses => _Responses(responses: responses),
              _Tab.requests => const _MyRequests(),
            },
          ],
        ),
      ),
    );
  }
}

class _Invited extends ConsumerWidget {
  const _Invited({required this.requests, required this.responses});

  final AsyncValue<List<Opportunity>> requests;
  final List<SupplierResponse> responses;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    return AsyncBody<List<Opportunity>>(
      value: requests,
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
                    child: SupplierRequestCard(
                      request: r,
                      response: responses
                          .where((x) => x.requestId == r.id)
                          .firstOrNull,
                    ),
                  ),
              ],
            ),
    );
  }
}

/// A supplier request: buyer, when it was posted (or that you responded),
/// the title, budget and deadline, invited types and city, and the action.
class SupplierRequestCard extends StatelessWidget {
  const SupplierRequestCard({super.key, required this.request, this.response});

  final Opportunity request;

  /// This company's response, when it already sent one.
  final SupplierResponse? response;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final r = request;
    final sent = response;
    final closesAt = r.closesAt;
    final dayMonth = AppDateFormats.monthDayShort(context);

    return BOHCard(
      tone: sent == null ? BOHCardTone.accentThin : BOHCardTone.normal,
      onTap: () => context.push(AppRoutes.companySupplierRequest(r.id)),
      semanticLabel: '${r.title}. ${r.company.name}',
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              BOHCompanyLogo(name: r.company.name, size: 40),
              const SizedBox(width: AppSpacing.s10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      r.company.name,
                      style: context.text.labelMedium,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      sent == null
                          ? l10n.supplierOpenToYourType(
                              l10n.relativeTime(r.postedAt),
                            )
                          : l10n.supplierYouResponded(
                              dayMonth.format(sent.submittedAt),
                            ),
                      style: context.text.caption,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              if (sent == null)
                BOHStatusBadge(
                  l10n.supplierBadgeOpen,
                  tone: BOHStatusTone.violet,
                )
              else
                SupplierResponseStatusPill(sent.status),
            ],
          ),
          const SizedBox(height: AppSpacing.s10),
          Text(r.title, style: context.text.h3),
          const SizedBox(height: AppSpacing.s10),
          Row(
            children: [
              Expanded(
                child: BOHFieldTile(
                  label: l10n.supplierBudget,
                  value: r.compensation ?? '—',
                ),
              ),
              const SizedBox(width: AppSpacing.s8),
              Expanded(
                child: BOHFieldTile(
                  label: l10n.supplierRespondByLabel,
                  value: closesAt == null ? '—' : dayMonth.format(closesAt),
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.s10),
          Wrap(
            spacing: AppSpacing.s6,
            runSpacing: AppSpacing.s6,
            children: [
              for (final t in r.supplierTypes) BOHMetaChip(t.label(l10n)),
              if (r.city.isNotEmpty) BOHMetaChip(r.city),
            ],
          ),
          const SizedBox(height: AppSpacing.s12),
          if (sent == null)
            BOHButton(
              label: l10n.supplierRespond,
              size: BOHButtonSize.medium,
              trailingIcon: null,
              onPressed: () => context.push(AppRoutes.companyRespond(r.id)),
            )
          else
            BOHButton(
              label: l10n.supplierViewMyResponse,
              variant: BOHButtonVariant.secondary,
              size: BOHButtonSize.medium,
              trailingIcon: null,
              onPressed: () => context.push(AppRoutes.companyResponse(sent.id)),
            ),
        ],
      ),
    );
  }
}

class _Responses extends ConsumerWidget {
  const _Responses({required this.responses});

  final AsyncValue<List<SupplierResponse>> responses;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final dayMonth = AppDateFormats.monthDayShort(context);
    return AsyncBody<List<SupplierResponse>>(
      value: responses,
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
                    child: BOHCard(
                      onTap: () =>
                          context.push(AppRoutes.companyResponse(r.id)),
                      semanticLabel: '${r.requestTitle}. ${r.buyer.name}',
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          Row(
                            children: [
                              BOHCompanyLogo(name: r.buyer.name, size: 40),
                              const SizedBox(width: AppSpacing.s10),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      r.buyer.name,
                                      style: context.text.labelMedium,
                                    ),
                                    Text(
                                      l10n.supplierYouResponded(
                                        dayMonth.format(r.submittedAt),
                                      ),
                                      style: context.text.caption,
                                    ),
                                  ],
                                ),
                              ),
                              SupplierResponseStatusPill(r.status),
                            ],
                          ),
                          const SizedBox(height: AppSpacing.s10),
                          Text(r.requestTitle, style: context.text.h3),
                          if ([?r.proposedPrice, ?r.setupTime] case final terms
                              when terms.isNotEmpty) ...[
                            const SizedBox(height: 2),
                            Text(
                              terms.join(' · '),
                              style: context.text.bodySmall,
                            ),
                          ],
                          const SizedBox(height: AppSpacing.s12),
                          BOHButton(
                            label: l10n.supplierViewMyResponse,
                            variant: BOHButtonVariant.secondary,
                            size: BOHButtonSize.medium,
                            trailingIcon: null,
                            onPressed: () =>
                                context.push(AppRoutes.companyResponse(r.id)),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
    );
  }
}

/// This company's own supplier requests (it is the buyer).
class _MyRequests extends ConsumerWidget {
  const _MyRequests();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    return AsyncBody<List<Opportunity>>(
      value: ref.watch(myCompanyOpportunitiesProvider),
      onRetry: () => ref.invalidate(myCompanyOpportunitiesProvider),
      data: (all) {
        final mine = [
          for (final o in all)
            if (o.type == OpportunityType.supplierRequest) o,
        ];
        if (mine.isEmpty) {
          return SizedBox(
            height: 300,
            child: BOHEmptyState(
              icon: AppIcons.supplierRequests,
              title: l10n.supplierMyRequestsEmpty,
              actionLabel: l10n.supplierCreateRequest,
              onAction: () => context.push(AppRoutes.companyNewOpportunity),
            ),
          );
        }
        return Column(
          children: [
            for (final o in mine)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.s12),
                child: CompanyOpportunityTile(opportunity: o),
              ),
          ],
        );
      },
    );
  }
}
