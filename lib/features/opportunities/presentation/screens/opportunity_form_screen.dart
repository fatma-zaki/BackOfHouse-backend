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
import '../../../companies/domain/company.dart';
import '../../../companies/domain/company_type.dart';
import '../../../companies/presentation/company_labels.dart';
import '../../../companies/presentation/controllers/company_workspace_providers.dart';
import '../../../companies/presentation/widgets/company_widgets.dart';
import '../../data/company_opportunities_data.dart';
import '../../domain/opportunity.dart';
import '../widgets/opportunity_widgets.dart';

/// One reusable form for every opportunity type; fields follow the type.
/// Creates a draft, or edits one when [opportunityId] is set.
class OpportunityFormScreen extends ConsumerWidget {
  const OpportunityFormScreen({super.key, this.opportunityId});

  final String? opportunityId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final company = ref.watch(companyMembershipProvider)?.company;
    if (company == null) return const SizedBox.shrink();
    final id = opportunityId;
    if (id == null) return _Form(company: company);
    return AsyncBody<Opportunity>(
      value: ref.watch(myCompanyOpportunityProvider(id)),
      onRetry: () => ref.invalidate(myCompanyOpportunityProvider(id)),
      data: (o) {
        // Published content is never edited in place: a live listing is
        // changed through its pending update, reviewed on its own.
        if (OpportunityLifecycle.isEditable(o.status)) {
          return _Form(
            company: company,
            opportunityId: o.id,
            initial: OpportunityDraft.of(o),
          );
        }
        if (o.revision case final revision?
            when OpportunityLifecycle.isEditable(revision.status)) {
          return _Form(
            company: company,
            opportunityId: o.id,
            initial: revision.draft,
            isRevision: true,
          );
        }
        return BOHScaffold(
          appBar: const BOHAppBar(),
          body: BOHEmptyState(
            icon: AppIcons.edit,
            title: context.l10n.companyOnlyDraftsEditable,
          ),
        );
      },
    );
  }
}

class _Form extends ConsumerStatefulWidget {
  const _Form({
    required this.company,
    this.opportunityId,
    this.initial,
    this.isRevision = false,
  });

  final CompanySummary company;

  /// `null` when creating a new draft.
  final String? opportunityId;
  final OpportunityDraft? initial;

  /// Editing the pending update of a published listing.
  final bool isRevision;

  @override
  ConsumerState<_Form> createState() => _FormState();
}

class _FormState extends ConsumerState<_Form> {
  final _formKey = GlobalKey<FormState>();
  late OpportunityType _type = widget.initial?.type ?? OpportunityType.job;
  late EmploymentType? _employment =
      widget.initial?.employment ?? EmploymentType.fullTime;
  late final Set<CompanyType> _supplierTypes = {
    ...?widget.initial?.supplierTypes,
  };
  late final _title = TextEditingController(text: widget.initial?.title);
  late final _city = TextEditingController(text: widget.initial?.city);
  late final _summary = TextEditingController(text: widget.initial?.summary);
  late final _description = TextEditingController(
    text: widget.initial?.description,
  );
  late final _compensation = TextEditingController(
    text: widget.initial?.compensation,
  );
  late final _duration = TextEditingController(text: widget.initial?.duration);
  late final _responsibilities = TextEditingController(
    text: widget.initial?.responsibilities.join('\n'),
  );
  late final _requirements = TextEditingController(
    text: widget.initial?.requirements.join('\n'),
  );
  late final _skills = TextEditingController(
    text: widget.initial?.skills.join('\n'),
  );
  late DateTime? _closesAt = widget.initial?.closesAt;
  late WorkSetup? _workSetup = widget.initial?.workSetup ?? WorkSetup.onSite;
  bool _showIssues = false;
  bool _saving = false;

  @override
  void dispose() {
    for (final c in [
      _title,
      _city,
      _summary,
      _description,
      _compensation,
      _duration,
      _responsibilities,
      _requirements,
      _skills,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  bool get _isSupplierRequest => _type == OpportunityType.supplierRequest;

  OpportunityDraft get _draft => OpportunityDraft(
    type: _type,
    title: _title.text,
    city: _city.text,
    summary: _summary.text,
    description: _description.text,
    employment: _type == OpportunityType.job ? _employment : null,
    compensation: _compensation.text,
    duration: _duration.text,
    responsibilities: _isSupplierRequest
        ? const []
        : linesOf(_responsibilities.text),
    requirements: linesOf(_requirements.text),
    skills: _isSupplierRequest ? const [] : linesOf(_skills.text),
    supplierTypes: _isSupplierRequest
        ? [
            for (final t in CompanyType.values)
              if (_supplierTypes.contains(t)) t,
          ]
        : const [],
    closesAt: _closesAt,
    workSetup: _isSupplierRequest ? null : _workSetup,
  );

  Future<void> _pickCloseDate() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _closesAt ?? now.add(const Duration(days: 30)),
      firstDate: now.add(const Duration(days: 1)),
      lastDate: now.add(const Duration(days: 365)),
    );
    if (picked != null) setState(() => _closesAt = picked);
  }

  /// Saves, then (unless editing a pending update) submits the draft for
  /// Back Of House review.
  Future<void> _saveAndSubmit() async {
    await _save(submit: true);
  }

  Future<void> _save({bool submit = false}) async {
    final formOk = _formKey.currentState?.validate() ?? false;
    final issues = _draft.validate(widget.company);
    setState(() => _showIssues = true);
    if (!formOk || issues.isNotEmpty) return;
    setState(() => _saving = true);
    final repo = ref.read(companyOpportunitiesRepositoryProvider);
    final id = widget.opportunityId;
    Opportunity? saved;
    final ok = await runCompanyAction(
      context,
      () async {
        saved = switch ((id, widget.isRevision)) {
          (null, _) => await repo.createDraft(_draft),
          (final id?, true) => await repo.updateRevision(id, _draft),
          (final id?, false) => await repo.updateDraft(id, _draft),
        };
        if (submit) {
          saved = widget.isRevision
              ? await repo.submitRevisionForReview(saved!.id)
              : await repo.submitForReview(saved!.id);
        }
      },
      success: submit
          ? context.l10n.companySubmittedForReview
          : widget.isRevision
          ? context.l10n.companyUpdateSaved
          : context.l10n.companyDraftSaved,
    );
    if (!mounted) return;
    setState(() => _saving = false);
    if (!ok) return;
    ref.invalidate(myCompanyOpportunitiesProvider);
    if (id != null) {
      ref.invalidate(myCompanyOpportunityProvider(id));
      context.pop();
    } else {
      context.pushReplacement(AppRoutes.companyOpportunity(saved!.id));
    }
  }

  String? _required(String? v) =>
      (v ?? '').trim().isEmpty ? context.l10n.fieldRequired : null;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    final types = OpportunityDraft.typesFor(widget.company);
    final supplierTypesMissing =
        _showIssues &&
        _draft
            .validate(widget.company)
            .contains(OpportunityDraftIssue.supplierTypesRequired);
    const gap = SizedBox(height: AppSpacing.s14);

    Widget lines(TextEditingController controller, String label) =>
        BOHTextField(
          controller: controller,
          label: label,
          hint: l10n.fieldOnePerLine,
          minLines: 2,
          maxLines: 8,
          keyboardType: TextInputType.multiline,
          textCapitalization: TextCapitalization.sentences,
          enabled: !_saving,
        );

    final closesInPast =
        _showIssues &&
        _draft
            .validate(widget.company)
            .contains(OpportunityDraftIssue.closesInPast);

    Widget fieldLabel(String text) => Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.s6),
      child: Text(text, style: context.text.labelMedium),
    );

    return BOHScaffold(
      appBar: BOHAppBar(
        closeIcon: true,
        title: switch ((widget.opportunityId, widget.isRevision)) {
          (null, _) => l10n.companyNewListing,
          (_, true) => l10n.companyEditUpdate,
          _ => l10n.companyEditOpportunity,
        },
      ),
      bottomNavigationBar: BOHActionBar.pair(
        secondary: BOHButton(
          label: widget.isRevision
              ? l10n.companySaveUpdate
              : l10n.companySaveDraft,
          variant: BOHButtonVariant.secondary,
          size: BOHButtonSize.large,
          trailingIcon: null,
          onPressed: _saving ? null : _save,
        ),
        primary: BOHButton(
          label: widget.isRevision
              ? l10n.companySubmitUpdate
              : l10n.companySubmitForReview,
          isLoading: _saving,
          trailingIcon: null,
          onPressed: _saveAndSubmit,
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
            fieldLabel(l10n.companyListingType),
            GridView.count(
              crossAxisCount: 4,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: AppSpacing.s8,
              mainAxisSpacing: AppSpacing.s8,
              childAspectRatio: 1.25,
              children: [
                for (final t in types)
                  BOHCategoryChip(
                    icon: t.icon,
                    label: t.label(l10n),
                    expandTile: true,
                    selected: _type == t,
                    // The type is fixed once a draft exists.
                    onSelected: widget.opportunityId != null || _saving
                        ? null
                        : () => setState(() => _type = t),
                  ),
              ],
            ),
            gap,
            BOHTextField(
              controller: _title,
              label: l10n.fieldTitleLabel,
              textCapitalization: TextCapitalization.sentences,
              validator: _required,
              enabled: !_saving,
            ),
            gap,
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: BOHTextField(
                    controller: _city,
                    label: l10n.fieldCityLabel,
                    validator: _required,
                    enabled: !_saving,
                  ),
                ),
                const SizedBox(width: AppSpacing.s10),
                Expanded(
                  child: BOHSelectField(
                    label: l10n.companyClosesOn,
                    value: _closesAt == null
                        ? null
                        : AppDateFormats.monthDayShort(context)
                              .format(_closesAt!),
                    placeholder: l10n.companyClosesOnPick,
                    icon: AppIcons.calendar,
                    errorText: closesInPast ? l10n.companyClosesInPast : null,
                    onTap: _saving ? null : _pickCloseDate,
                  ),
                ),
              ],
            ),
            if (_closesAt != null)
              Align(
                alignment: AlignmentDirectional.centerEnd,
                child: BOHLinkButton(
                  label: l10n.companyClearDate,
                  arrow: false,
                  fontSize: 12,
                  onTap: _saving
                      ? null
                      : () => setState(() => _closesAt = null),
                ),
              ),
            if (!_isSupplierRequest) ...[
              gap,
              fieldLabel(l10n.companyWorkSetup),
              Semantics(
                label: l10n.companyWorkSetup,
                child: BOHSegmentedControl<WorkSetup>(
                  segments: [
                    for (final w in WorkSetup.values) (w, w.label(l10n)),
                  ],
                  selected: _workSetup ?? WorkSetup.onSite,
                  onChanged: (w) => setState(() => _workSetup = w),
                ),
              ),
            ],
            gap,
            BOHTextField(
              controller: _summary,
              label: l10n.companyOpportunitySummary,
              hint: l10n.companyOpportunitySummaryHint,
              validator: _required,
              enabled: !_saving,
            ),
            gap,
            BOHTextField(
              controller: _description,
              label: l10n.fieldDescriptionLabel,
              minLines: 4,
              maxLines: 10,
              keyboardType: TextInputType.multiline,
              textCapitalization: TextCapitalization.sentences,
              validator: _required,
              enabled: !_saving,
            ),
            if (_type == OpportunityType.job) ...[
              gap,
              fieldLabel(l10n.companyEmploymentType),
              Wrap(
                spacing: AppSpacing.s8,
                children: [
                  for (final e in EmploymentType.values)
                    BOHCategoryChip(
                      label: e.label(l10n),
                      selected: _employment == e,
                      onSelected: _saving
                          ? null
                          : () => setState(() => _employment = e),
                    ),
                ],
              ),
            ],
            if (_isSupplierRequest) ...[
              gap,
              fieldLabel(l10n.companySupplierTypes),
              Text(
                l10n.companySupplierTypesHint,
                style: context.text.bodySmall,
              ),
              Wrap(
                spacing: AppSpacing.s8,
                children: [
                  for (final t in CompanyType.values)
                    BOHSelectChip(
                      label: t.label(l10n),
                      selected: _supplierTypes.contains(t),
                      onChanged: _saving
                          ? null
                          : (on) => setState(
                              () => on
                                  ? _supplierTypes.add(t)
                                  : _supplierTypes.remove(t),
                            ),
                    ),
                ],
              ),
              if (supplierTypesMissing)
                Text(
                  l10n.companySupplierTypesRequired,
                  style: context.text.bodySmall.copyWith(color: c.error),
                ),
            ],
            gap,
            BOHTextField(
              controller: _compensation,
              label: _isSupplierRequest
                  ? l10n.companyBudget
                  : l10n.companyCompensation,
              hint: l10n.fieldOptional,
              enabled: !_saving,
            ),
            if (_type != OpportunityType.job ||
                _employment == EmploymentType.contract) ...[
              gap,
              BOHTextField(
                controller: _duration,
                label: l10n.companyDuration,
                hint: l10n.fieldOptional,
                enabled: !_saving,
              ),
            ],
            if (!_isSupplierRequest) ...[
              gap,
              lines(_responsibilities, l10n.opportunityResponsibilities),
            ],
            gap,
            lines(_requirements, l10n.opportunityRequirements),
            if (!_isSupplierRequest) ...[
              gap,
              lines(_skills, l10n.opportunitySkills),
            ],
            gap,
            BOHBanner(
              widget.isRevision
                  ? l10n.companyUpdateNoteDraft
                  : l10n.companyReviewInfo,
              tone: BOHBannerTone.info,
            ),
          ],
        ),
      ),
    );
  }
}
