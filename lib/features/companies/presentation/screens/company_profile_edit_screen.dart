import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/widgets/widgets.dart';
import '../../data/my_company_data.dart';
import '../../domain/company.dart';
import '../controllers/company_workspace_providers.dart';
import '../widgets/company_widgets.dart';

class CompanyProfileEditScreen extends ConsumerWidget {
  const CompanyProfileEditScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return AsyncBody<Company>(
      value: ref.watch(myCompanyProvider),
      onRetry: () => ref.invalidate(myCompanyProvider),
      data: (company) => _Form(company: company),
    );
  }
}

class _Form extends ConsumerStatefulWidget {
  const _Form({required this.company});

  final Company company;

  @override
  ConsumerState<_Form> createState() => _FormState();
}

class _FormState extends ConsumerState<_Form> {
  final _formKey = GlobalKey<FormState>();
  late final _specialization = TextEditingController(
    text: widget.company.specialization,
  );
  late final _city = TextEditingController(text: widget.company.city);
  late final _description = TextEditingController(
    text: widget.company.description,
  );
  late final _services = TextEditingController(
    text: widget.company.services.join('\n'),
  );
  late final _industries = TextEditingController(
    text: widget.company.industries.join('\n'),
  );
  late final _email = TextEditingController(
    text: widget.company.contactEmail ?? '',
  );
  late final _phone = TextEditingController(
    text: widget.company.contactPhone ?? '',
  );
  late final _website = TextEditingController(
    text: widget.company.website ?? '',
  );
  bool _saving = false;

  @override
  void dispose() {
    for (final c in [
      _specialization,
      _city,
      _description,
      _services,
      _industries,
      _email,
      _phone,
      _website,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  CompanyProfileDraft get _draft => CompanyProfileDraft(
    specialization: _specialization.text,
    city: _city.text,
    description: _description.text,
    services: linesOf(_services.text),
    industries: linesOf(_industries.text),
    contactEmail: _email.text,
    contactPhone: _phone.text,
    website: _website.text,
  );

  Future<void> _save() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    setState(() => _saving = true);
    final ok = await runCompanyAction(
      context,
      () => ref.read(myCompanyRepositoryProvider).updateProfile(_draft),
      success: context.l10n.companyProfileSaved,
    );
    if (!mounted) return;
    setState(() => _saving = false);
    if (ok) {
      ref.invalidate(myCompanyProvider);
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    const gap = SizedBox(height: AppSpacing.s16);

    return BOHScaffold(
      appBar: BOHAppBar(title: l10n.companyEditProfile),
      bottomNavigationBar: BOHActionBar(
        child: BOHButton(
          label: l10n.actionSave,
          isLoading: _saving,
          trailingIcon: null,
          onPressed: _save,
        ),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: BOHScaffold.screenPadding.add(
            const EdgeInsets.symmetric(vertical: AppSpacing.s16),
          ),
          children: [
            BOHInfoNote(
              l10n.companyIdentityNote(widget.company.name),
              icon: AppIcons.shield,
            ),
            gap,
            BOHTextField(
              controller: _description,
              label: l10n.companyAbout,
              hint: l10n.companyAboutHint,
              minLines: 3,
              maxLines: 8,
              keyboardType: TextInputType.multiline,
              textCapitalization: TextCapitalization.sentences,
              enabled: !_saving,
              validator: (v) =>
                  (v ?? '').trim().length >
                      CompanyProfileDraft.descriptionMaxLength
                  ? l10n.fieldTooLong(CompanyProfileDraft.descriptionMaxLength)
                  : null,
            ),
            gap,
            BOHTextField(
              controller: _specialization,
              label: l10n.companySpecialization,
              hint: l10n.companySpecializationHint,
              enabled: !_saving,
            ),
            gap,
            BOHTextField(
              controller: _city,
              label: l10n.fieldCityLabel,
              prefixIcon: AppIcons.location,
              enabled: !_saving,
            ),
            gap,
            BOHTextField(
              controller: _services,
              label: l10n.companyServices,
              hint: l10n.fieldOnePerLine,
              minLines: 2,
              maxLines: 6,
              keyboardType: TextInputType.multiline,
              enabled: !_saving,
            ),
            gap,
            BOHTextField(
              controller: _industries,
              label: l10n.companyIndustries,
              hint: l10n.fieldOnePerLine,
              minLines: 2,
              maxLines: 6,
              keyboardType: TextInputType.multiline,
              enabled: !_saving,
            ),
            gap,
            BOHTextField(
              controller: _email,
              label: l10n.fieldEmailLabel,
              prefixIcon: AppIcons.email,
              keyboardType: TextInputType.emailAddress,
              forceLtr: true,
              enabled: !_saving,
              validator: (v) =>
                  CompanyProfileDraft(contactEmail: v ?? '')
                      .validate()
                      .contains(CompanyProfileIssue.invalidEmail)
                  ? l10n.validationEmailInvalid
                  : null,
            ),
            gap,
            BOHTextField(
              controller: _phone,
              label: l10n.fieldPhoneLabel,
              prefixIcon: AppIcons.phone,
              keyboardType: TextInputType.phone,
              forceLtr: true,
              enabled: !_saving,
            ),
            gap,
            BOHTextField(
              controller: _website,
              label: l10n.companyWebsite,
              prefixIcon: AppIcons.website,
              keyboardType: TextInputType.url,
              forceLtr: true,
              enabled: !_saving,
            ),
          ],
        ),
      ),
    );
  }
}
