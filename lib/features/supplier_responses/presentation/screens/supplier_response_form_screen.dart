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
import '../../../companies/domain/company_project.dart';
import '../../../companies/presentation/controllers/company_workspace_providers.dart';
import '../../../companies/presentation/widgets/company_widgets.dart';
import '../../../opportunities/domain/opportunity.dart';
import '../../data/supplier_requests_data.dart';
import '../../domain/supplier_response.dart';
import '../widgets/supplier_widgets.dart';

/// Respond to a supplier request: message, optional price, and optional
/// company projects as evidence. No attachments.
class SupplierResponseFormScreen extends ConsumerWidget {
  const SupplierResponseFormScreen({super.key, required this.requestId});

  final String requestId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final l10n = context.l10n;
    final own = ref.watch(companyMembershipProvider)?.company;
    final responded =
        ref
            .watch(mySupplierResponsesProvider)
            .value
            ?.any((r) => r.requestId == requestId) ??
        false;

    return AsyncBody<(Opportunity, List<CompanyProject>)>(
      value: switch ((
        ref.watch(supplierRequestProvider(requestId)),
        ref.watch(myCompanyProjectsProvider),
      )) {
        (AsyncData(value: final r), AsyncData(value: final p)) => AsyncData((
          r,
          p,
        )),
        (AsyncError(:final error, :final stackTrace), _) ||
        (
          _,
          AsyncError(:final error, :final stackTrace),
        ) => AsyncError(error, stackTrace),
        _ => const AsyncLoading(),
      },
      onRetry: () => ref
        ..invalidate(supplierRequestProvider(requestId))
        ..invalidate(myCompanyProjectsProvider),
      data: (loaded) {
        final (request, projects) = loaded;
        final eligibility = own == null
            ? SupplierResponseEligibility.notInvited
            : SupplierResponseRules.eligibility(
                request: request,
                responder: own,
                alreadyResponded: responded,
              );
        if (!eligibility.isEligible) {
          return BOHScaffold(
            appBar: BOHAppBar(title: l10n.supplierRespond),
            body: BOHEmptyState(
              icon: AppIcons.supplierRequests,
              title: eligibility.message(l10n),
              actionLabel: l10n.actionBack,
              onAction: () => context.pop(),
            ),
          );
        }
        return _Form(request: request, projects: projects);
      },
    );
  }
}

class _Form extends ConsumerStatefulWidget {
  const _Form({required this.request, required this.projects});

  final Opportunity request;
  final List<CompanyProject> projects;

  @override
  ConsumerState<_Form> createState() => _FormState();
}

class _FormState extends ConsumerState<_Form> {
  final _formKey = GlobalKey<FormState>();
  final _message = TextEditingController();
  final _price = TextEditingController();
  final _setup = TextEditingController();
  final Set<String> _projectIds = {};
  bool _sending = false;

  @override
  void dispose() {
    _message.dispose();
    _price.dispose();
    _setup.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _sending = true);
    SupplierResponse? sent;
    final ok = await runCompanyAction(
      context,
      () async => sent = await ref
          .read(supplierRequestsRepositoryProvider)
          .submitResponse(
            SupplierResponseDraft(
              requestId: widget.request.id,
              message: _message.text,
              proposedPrice: _price.text.trim().isEmpty
                  ? null
                  : 'SAR ${_price.text.trim()}',
              setupTime: _setup.text,
              projectIds: [
                for (final p in widget.projects)
                  if (_projectIds.contains(p.id)) p.id,
              ],
            ),
          ),
      success: context.l10n.supplierResponseSent,
    );
    if (!mounted) return;
    setState(() => _sending = false);
    if (!ok) return;
    ref
      ..invalidate(mySupplierResponsesProvider)
      ..invalidate(invitedSupplierRequestsProvider);
    context.pushReplacement(AppRoutes.companyResponse(sent!.id));
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final r = widget.request;
    const max = SupplierResponseDraft.messageMaxLength;
    const gap = SizedBox(height: AppSpacing.s14);
    final closesAt = r.closesAt;

    return BOHScaffold(
      appBar: BOHAppBar(title: l10n.supplierYourResponse),
      bottomNavigationBar: BOHActionBar(
        child: BOHButton(
          label: l10n.supplierSendResponse,
          isLoading: _sending,
          trailingIcon: null,
          onPressed: _submit,
        ),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.formHorizontal,
            AppSpacing.s8,
            AppSpacing.formHorizontal,
            AppSpacing.s24,
          ),
          children: [
            BOHCard(
              tone: BOHCardTone.accent,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
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
                            ),
                            if (closesAt != null)
                              Text(
                                l10n.supplierRespondBy(
                                  AppDateFormats.monthDayShort(context)
                                      .format(closesAt),
                                ),
                                style: context.text.caption,
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: AppSpacing.s10),
                  Text(r.title, style: context.text.h3),
                  const SizedBox(height: 2),
                  Text(
                    [
                      if (r.compensation case final budget?)
                        '${l10n.supplierBudget} $budget',
                      if (r.city.isNotEmpty) r.city,
                    ].join(' · '),
                    style: context.text.bodySmall,
                  ),
                ],
              ),
            ),
            gap,
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: BOHTextField(
                    controller: _price,
                    label: l10n.supplierYourPrice,
                    prefixText: 'SAR',
                    hint: l10n.fieldOptional,
                    forceLtr: true,
                    keyboardType: TextInputType.number,
                    enabled: !_sending,
                  ),
                ),
                const SizedBox(width: AppSpacing.s10),
                Expanded(
                  child: BOHTextField(
                    controller: _setup,
                    label: l10n.supplierSetupTime,
                    hint: l10n.supplierSetupTimeHint,
                    enabled: !_sending,
                  ),
                ),
              ],
            ),
            gap,
            BOHTextField(
              controller: _message,
              label: l10n.supplierMessage,
              hint: l10n.supplierMessageHint,
              minLines: 4,
              maxLines: 10,
              maxLength: max,
              keyboardType: TextInputType.multiline,
              textCapitalization: TextCapitalization.sentences,
              enabled: !_sending,
              validator: (v) =>
                  SupplierResponseDraft(
                    requestId: r.id,
                    message: v ?? '',
                  ).validate().isEmpty
                  ? null
                  : l10n.fieldRequired,
            ),
            gap,
            Row(
              children: [
                Expanded(
                  child: Text(
                    l10n.supplierAttachProjects,
                    style: context.text.cardTitle,
                  ),
                ),
                if (_projectIds.isNotEmpty)
                  Text(
                    l10n.supplierSelectedCount(_projectIds.length),
                    style: context.text.caption,
                  ),
              ],
            ),
            const SizedBox(height: AppSpacing.s10),
            if (widget.projects.isEmpty)
              BOHInfoNote(l10n.supplierNoProjects)
            else
              Wrap(
                spacing: AppSpacing.s10,
                runSpacing: AppSpacing.s10,
                children: [
                  for (final p in widget.projects)
                    SizedBox(
                      width: 104,
                      child: BOHSelectableMediaTile(
                        label: p.title,
                        imageHeight: 58,
                        selected: _projectIds.contains(p.id),
                        onChanged: _sending
                            ? null
                            : (on) => setState(
                                () => on
                                    ? _projectIds.add(p.id)
                                    : _projectIds.remove(p.id),
                              ),
                      ),
                    ),
                ],
              ),
            gap,
            BOHBanner(
              l10n.supplierPrivateNote(r.company.name),
              tone: BOHBannerTone.privacy,
            ),
          ],
        ),
      ),
    );
  }
}
