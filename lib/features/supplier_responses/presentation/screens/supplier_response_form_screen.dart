import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_motion.dart';
import '../../../../app/theme/app_radii.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
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
  final Set<String> _projectIds = {};
  bool _sending = false;

  @override
  void dispose() {
    _message.dispose();
    _price.dispose();
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
              proposedPrice: _price.text,
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
    final c = context.colors;
    const max = SupplierResponseDraft.messageMaxLength;

    return BOHScaffold(
      appBar: BOHAppBar(title: l10n.supplierRespond),
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
          padding: BOHScaffold.screenPadding.add(
            const EdgeInsets.symmetric(vertical: AppSpacing.s16),
          ),
          children: [
            BOHCard(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(widget.request.title, style: context.text.cardTitle),
                  Text(
                    l10n.supplierForBuyer(widget.request.company.name),
                    style: context.text.bodySmall,
                  ),
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.s16),
            BOHTextField(
              controller: _message,
              label: l10n.supplierMessage,
              hint: l10n.supplierMessageHint,
              minLines: 4,
              maxLines: 10,
              keyboardType: TextInputType.multiline,
              textCapitalization: TextCapitalization.sentences,
              inputFormatters: [LengthLimitingTextInputFormatter(max)],
              enabled: !_sending,
              validator: (v) =>
                  SupplierResponseDraft(
                    requestId: widget.request.id,
                    message: v ?? '',
                  ).validate().isEmpty
                  ? null
                  : l10n.fieldRequired,
            ),
            const SizedBox(height: AppSpacing.s16),
            BOHTextField(
              controller: _price,
              label: l10n.supplierProposedPrice,
              hint: l10n.fieldOptional,
              enabled: !_sending,
            ),
            const SizedBox(height: AppSpacing.sectionSpacing),
            BOHSectionHeader(
              title: l10n.supplierEvidence,
              subtitle: l10n.supplierEvidenceSubtitle,
            ),
            const SizedBox(height: AppSpacing.s12),
            if (widget.projects.isEmpty)
              BOHInfoNote(l10n.supplierNoProjects)
            else
              for (final p in widget.projects)
                Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.s8),
                  child: _ProjectOption(
                    project: p,
                    selected: _projectIds.contains(p.id),
                    onTap: _sending
                        ? null
                        : () => setState(
                            () => _projectIds.contains(p.id)
                                ? _projectIds.remove(p.id)
                                : _projectIds.add(p.id),
                          ),
                  ),
                ),
            const SizedBox(height: AppSpacing.s8),
            Text(
              l10n.supplierNoAttachments,
              style: context.text.caption.copyWith(color: c.textMuted),
            ),
          ],
        ),
      ),
    );
  }
}

class _ProjectOption extends StatelessWidget {
  const _ProjectOption({
    required this.project,
    required this.selected,
    required this.onTap,
  });

  final CompanyProject project;
  final bool selected;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return Semantics(
      checked: selected,
      child: BOHPressable(
        onTap: onTap,
        selected: selected,
        semanticLabel: project.title,
        builder: (context, state) => AnimatedContainer(
          duration: AppMotion.fast,
          padding: const EdgeInsets.all(AppSpacing.cardPadding),
          decoration: BoxDecoration(
            color: selected ? c.primaryWash : c.surface,
            borderRadius: AppRadii.mediumAll,
            border: Border.all(color: selected ? c.primary : c.borderSoft),
          ),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(project.title, style: context.text.label),
                    Text(
                      '${project.category} · ${project.location}',
                      style: context.text.bodySmall,
                    ),
                  ],
                ),
              ),
              Icon(
                selected ? AppIcons.success : AppIcons.plus,
                size: AppSizes.iconMedium,
                color: selected ? c.primary : c.textMuted,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
