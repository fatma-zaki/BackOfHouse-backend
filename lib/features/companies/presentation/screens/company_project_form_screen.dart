import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/utils/date_formats.dart';
import '../../../../core/widgets/widgets.dart';
import '../../data/my_company_data.dart';
import '../../domain/company_project.dart';
import '../controllers/company_workspace_providers.dart';
import '../widgets/company_widgets.dart';

/// Add a project, or edit one when [projectId] is set.
class CompanyProjectFormScreen extends ConsumerWidget {
  const CompanyProjectFormScreen({super.key, this.projectId});

  final String? projectId;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final id = projectId;
    if (id == null) return const _Form();
    return AsyncBody<List<CompanyProject>>(
      value: ref.watch(myCompanyProjectsProvider),
      onRetry: () => ref.invalidate(myCompanyProjectsProvider),
      data: (projects) {
        final match = projects.where((p) => p.id == id).firstOrNull;
        if (match == null) {
          return BOHScaffold(
            appBar: const BOHAppBar(),
            body: BOHEmptyState(title: context.l10n.errorNotFound),
          );
        }
        return _Form(project: match);
      },
    );
  }
}

class _Form extends ConsumerStatefulWidget {
  const _Form({this.project});

  final CompanyProject? project;

  @override
  ConsumerState<_Form> createState() => _FormState();
}

class _FormState extends ConsumerState<_Form> {
  final _formKey = GlobalKey<FormState>();
  late final _title = TextEditingController(text: widget.project?.title);
  late final _description = TextEditingController(
    text: widget.project?.description,
  );
  late final _location = TextEditingController(text: widget.project?.location);
  late final _category = TextEditingController(text: widget.project?.category);
  late final _services = TextEditingController(
    text: widget.project?.services.join('\n'),
  );
  late final _client = TextEditingController(text: widget.project?.clientName);
  late DateTime _start = widget.project?.startedAt ?? DateTime.now();
  late DateTime? _end = widget.project?.endedAt;
  bool _showDateError = false;
  bool _saving = false;

  @override
  void dispose() {
    for (final c in [
      _title,
      _description,
      _location,
      _category,
      _services,
      _client,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  CompanyProjectDraft get _draft => CompanyProjectDraft(
    title: _title.text,
    description: _description.text,
    location: _location.text,
    category: _category.text,
    startedAt: _start,
    endedAt: _end,
    services: linesOf(_services.text),
    clientName: _client.text,
  );

  Future<void> _pick({required bool end}) async {
    final picked = await showDatePicker(
      context: context,
      initialDate: end ? (_end ?? _start) : _start,
      firstDate: DateTime(1990),
      lastDate: DateTime(DateTime.now().year + 5),
    );
    if (picked == null) return;
    setState(() {
      end ? _end = picked : _start = picked;
      _showDateError = false;
    });
  }

  Future<void> _save() async {
    final formOk = _formKey.currentState?.validate() ?? false;
    final issues = _draft.validate();
    setState(
      () =>
          _showDateError = issues.contains(CompanyProjectIssue.endsBeforeStart),
    );
    if (!formOk || issues.isNotEmpty) return;
    setState(() => _saving = true);
    final repo = ref.read(myCompanyRepositoryProvider);
    final id = widget.project?.id;
    final ok = await runCompanyAction(
      context,
      () =>
          id == null ? repo.addProject(_draft) : repo.updateProject(id, _draft),
      success: context.l10n.companyProjectSaved,
    );
    if (!mounted) return;
    setState(() => _saving = false);
    if (ok) {
      ref
        ..invalidate(myCompanyProjectsProvider)
        ..invalidate(myCompanyProvider);
      context.pop();
    }
  }

  Future<void> _delete() async {
    final project = widget.project!;
    final l10n = context.l10n;
    final confirmed = await confirmCompanyAction(
      context,
      title: l10n.companyProjectDeleteTitle,
      message: l10n.companyProjectDeleteBody(project.title),
      action: l10n.actionDelete,
    );
    if (!confirmed || !mounted) return;
    setState(() => _saving = true);
    final ok = await runCompanyAction(
      context,
      () => ref.read(myCompanyRepositoryProvider).deleteProject(project.id),
      success: l10n.companyProjectDeleted,
    );
    if (!mounted) return;
    setState(() => _saving = false);
    if (ok) {
      ref
        ..invalidate(myCompanyProjectsProvider)
        ..invalidate(myCompanyProvider);
      context.pop();
    }
  }

  String? _required(String? v) =>
      (v ?? '').trim().isEmpty ? context.l10n.fieldRequired : null;

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final date = AppDateFormats.mediumDate(context);
    const gap = SizedBox(height: AppSpacing.s14);

    return BOHScaffold(
      appBar: BOHAppBar(
        closeIcon: true,
        title: widget.project == null
            ? l10n.companyAddProject
            : l10n.companyEditProject,
        actions: [
          if (widget.project != null)
            BOHIconButton(
              icon: AppIcons.delete,
              semanticLabel: l10n.actionDelete,
              onPressed: _saving ? null : _delete,
            ),
        ],
      ),
      bottomNavigationBar: BOHActionBar(
        child: BOHButton(
          label: l10n.actionSave,
          size: BOHButtonSize.large,
          isLoading: _saving,
          trailingIcon: null,
          onPressed: _save,
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
            BOHTextField(
              controller: _title,
              label: l10n.fieldTitleLabel,
              textCapitalization: TextCapitalization.sentences,
              validator: _required,
              enabled: !_saving,
            ),
            gap,
            BOHTextField(
              controller: _description,
              label: l10n.fieldDescriptionLabel,
              minLines: 3,
              maxLines: 8,
              keyboardType: TextInputType.multiline,
              textCapitalization: TextCapitalization.sentences,
              validator: _required,
              enabled: !_saving,
            ),
            gap,
            BOHTextField(
              controller: _category,
              label: l10n.fieldCategoryLabel,
              hint: l10n.companyProjectCategoryHint,
              validator: _required,
              enabled: !_saving,
            ),
            gap,
            BOHTextField(
              controller: _location,
              label: l10n.fieldLocationLabel,
              prefixIcon: AppIcons.location,
              validator: _required,
              enabled: !_saving,
            ),
            gap,
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Expanded(
                  child: BOHSelectField(
                    label: l10n.companyProjectStartLabel,
                    value: date.format(_start),
                    icon: AppIcons.calendar,
                    onTap: _saving ? null : () => _pick(end: false),
                  ),
                ),
                const SizedBox(width: AppSpacing.s10),
                Expanded(
                  child: BOHSelectField(
                    label: l10n.companyProjectEndLabel,
                    value: _end == null ? null : date.format(_end!),
                    placeholder: l10n.companyProjectOngoing,
                    icon: AppIcons.calendar,
                    errorText: _showDateError
                        ? l10n.companyProjectEndsBeforeStart
                        : null,
                    onTap: _saving ? null : () => _pick(end: true),
                  ),
                ),
              ],
            ),
            if (_end != null)
              Align(
                alignment: AlignmentDirectional.centerEnd,
                child: BOHLinkButton(
                  label: l10n.companyClearDate,
                  arrow: false,
                  fontSize: 12,
                  onTap: _saving ? null : () => setState(() => _end = null),
                ),
              ),
            gap,
            BOHTextField(
              controller: _services,
              label: l10n.companyProjectServices,
              hint: l10n.fieldOnePerLine,
              minLines: 2,
              maxLines: 6,
              keyboardType: TextInputType.multiline,
              enabled: !_saving,
            ),
            gap,
            BOHTextField(
              controller: _client,
              label: l10n.companyProjectClient,
              hint: l10n.companyProjectClientHint,
              enabled: !_saving,
            ),
          ],
        ),
      ),
    );
  }
}
