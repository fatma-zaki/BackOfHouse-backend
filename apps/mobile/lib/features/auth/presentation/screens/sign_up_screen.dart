import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/config/app_config.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/l10n_messages.dart';
import '../../../../core/utils/validators.dart';
import '../../../../core/widgets/widgets.dart';
import '../../../companies/domain/company_type.dart';
import '../../../companies/presentation/company_labels.dart';
import '../../../profile/domain/profile_status.dart';
import '../../domain/account_details.dart';
import '../../domain/account_type.dart';
import '../controllers/auth_controller.dart';
import '../widgets/account_type_selector.dart';
import '../widgets/auth_feedback.dart';

class SignUpScreen extends ConsumerStatefulWidget {
  const SignUpScreen({super.key});

  @override
  ConsumerState<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends ConsumerState<SignUpScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullName = TextEditingController();
  final _email = TextEditingController();
  final _phone = TextEditingController();
  final _password = TextEditingController();
  final _confirm = TextEditingController();
  final _companyName = TextEditingController();

  AccountType _accountType = AccountType.individual;
  CompanyType? _companyType;
  bool _showCompanyTypeError = false;
  bool _agreed = false;
  bool _student = false;

  late final TapGestureRecognizer _termsTap = TapGestureRecognizer()
    ..onTap = () => _open(AppConfig.termsUrl);
  late final TapGestureRecognizer _privacyTap = TapGestureRecognizer()
    ..onTap = () => _open(AppConfig.privacyUrl);

  @override
  void dispose() {
    for (final c in [
      _fullName,
      _email,
      _phone,
      _password,
      _confirm,
      _companyName,
    ]) {
      c.dispose();
    }
    _termsTap.dispose();
    _privacyTap.dispose();
    super.dispose();
  }

  Future<void> _open(String url) async {
    await launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication);
  }

  Future<void> _submit() async {
    final isCompany = _accountType == AccountType.company;
    setState(() => _showCompanyTypeError = isCompany && _companyType == null);
    final valid = _formKey.currentState?.validate() ?? false;
    if (!valid || _showCompanyTypeError) return;
    if (!_agreed) {
      showAuthMessage(context, context.l10n.mustAcceptTerms);
      return;
    }
    FocusScope.of(context).unfocus();
    await ref
        .read(authControllerProvider.notifier)
        .register(
          fullName: _fullName.text,
          email: _email.text,
          phone: _phone.text,
          password: _password.text,
          account: switch (_accountType) {
            AccountType.individual => IndividualAccountDetails(
              profileStatus: _student
                  ? ProfileStatus.student
                  : ProfileStatus.professional,
            ),
            AccountType.company => CompanyAccountDetails(
              companyName: _companyName.text,
              companyType: _companyType!,
            ),
          },
        );
  }

  @override
  Widget build(BuildContext context) {
    listenForAuthErrors(ref, context);

    final l10n = context.l10n;
    final c = context.colors;
    final isLoading = ref.watch(
      authControllerProvider.select((s) => s.isLoading),
    );
    final query = GoRouterState.of(context).uri.query;
    String withQuery(String path) => query.isEmpty ? path : '$path?$query';
    const gap = SizedBox(height: AppSpacing.s12);
    final linkStyle = context.text.bodySmall.copyWith(
      color: c.primaryText,
      fontWeight: FontWeight.w700,
    );

    return BOHScaffold(
      appBar: BOHAppBar(
        showBack: true,
        onBack: () => context.go(withQuery(AppRoutes.auth)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.formHorizontal,
          AppSpacing.s12,
          AppSpacing.formHorizontal,
          AppSpacing.s32,
        ),
        child: AutofillGroup(
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Semantics(
                  header: true,
                  child: Text(l10n.signUpTitle, style: context.text.titleXL),
                ),
                const SizedBox(height: AppSpacing.s4),
                Text(
                  l10n.signUpSubtitle,
                  style: context.text.body.copyWith(height: 19 / 13),
                ),
                const SizedBox(height: AppSpacing.s16),
                AccountTypeSelector(
                  selected: _accountType,
                  onChanged: isLoading
                      ? null
                      : (t) => setState(() => _accountType = t),
                ),
                const SizedBox(height: AppSpacing.s16),
                BOHTextField(
                  controller: _fullName,
                  label: l10n.fieldFullNameLabel,
                  hint: l10n.fieldFullNameHint,
                  prefixIcon: AppIcons.user,
                  textCapitalization: TextCapitalization.words,
                  textInputAction: TextInputAction.next,
                  autofillHints: const [AutofillHints.name],
                  validator: l10n.validator(Validators.fullName),
                  enabled: !isLoading,
                ),
                gap,
                BOHTextField(
                  controller: _email,
                  label: l10n.fieldEmailLabel,
                  hint: l10n.fieldEmailHint,
                  prefixIcon: AppIcons.email,
                  keyboardType: TextInputType.emailAddress,
                  forceLtr: true,
                  textInputAction: TextInputAction.next,
                  autofillHints: const [AutofillHints.email],
                  validator: l10n.validator(Validators.email),
                  enabled: !isLoading,
                ),
                gap,
                BOHTextField(
                  controller: _phone,
                  label: l10n.fieldPhoneLabel,
                  hint: l10n.fieldPhoneHint,
                  prefixIcon: AppIcons.smartphone,
                  keyboardType: TextInputType.phone,
                  forceLtr: true,
                  textInputAction: TextInputAction.next,
                  autofillHints: const [AutofillHints.telephoneNumber],
                  validator: l10n.validator(Validators.phone),
                  enabled: !isLoading,
                ),
                gap,
                BOHTextField(
                  controller: _password,
                  label: l10n.fieldPasswordLabel,
                  hint: l10n.fieldNewPasswordHint,
                  prefixIcon: AppIcons.password,
                  obscurable: true,
                  textInputAction: TextInputAction.next,
                  autofillHints: const [AutofillHints.newPassword],
                  validator: l10n.validator(Validators.password),
                  enabled: !isLoading,
                ),
                gap,
                BOHTextField(
                  controller: _confirm,
                  label: l10n.fieldConfirmPasswordLabel,
                  hint: l10n.fieldConfirmPasswordHint,
                  prefixIcon: AppIcons.password,
                  obscurable: true,
                  textInputAction: TextInputAction.done,
                  validator: l10n.validator(
                    (v) => Validators.confirmPassword(v, _password.text),
                  ),
                  onSubmitted: (_) => _submit(),
                  enabled: !isLoading,
                ),
                const SizedBox(height: AppSpacing.s16),
                if (_accountType == AccountType.individual)
                  BOHCheckBanner(
                    title: l10n.signUpStudentTitle,
                    subtitle: l10n.signUpStudentHint,
                    value: _student,
                    onChanged: isLoading
                        ? null
                        : (v) => setState(() => _student = v),
                  )
                else ...[
                  BOHTextField(
                    controller: _companyName,
                    label: l10n.fieldCompanyNameLabel,
                    hint: l10n.fieldCompanyNameHint,
                    prefixIcon: AppIcons.companies,
                    textCapitalization: TextCapitalization.words,
                    textInputAction: TextInputAction.done,
                    autofillHints: const [AutofillHints.organizationName],
                    validator: (v) => (v ?? '').trim().length < 2
                        ? l10n.fieldCompanyNameRequired
                        : null,
                    enabled: !isLoading,
                  ),
                  gap,
                  Text(l10n.companyTypeLabel, style: context.text.labelMedium),
                  const SizedBox(height: AppSpacing.s2),
                  Wrap(
                    spacing: AppSpacing.s8,
                    children: [
                      for (final type in CompanyType.values)
                        BOHCategoryChip(
                          label: type.label(l10n),
                          selected: _companyType == type,
                          onSelected: isLoading
                              ? null
                              : () => setState(() {
                                  _companyType = type;
                                  _showCompanyTypeError = false;
                                }),
                        ),
                    ],
                  ),
                  if (_showCompanyTypeError)
                    Semantics(
                      liveRegion: true,
                      child: Row(
                        children: [
                          Icon(
                            AppIcons.info,
                            size: AppSizes.iconSmall,
                            color: c.error,
                          ),
                          const SizedBox(width: AppSpacing.s8),
                          Expanded(
                            child: Text(
                              l10n.companyTypeRequired,
                              style: context.text.bodySmall.copyWith(
                                color: c.error,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
                const SizedBox(height: AppSpacing.s8),
                BOHCheckbox(
                  value: _agreed,
                  onChanged: isLoading
                      ? null
                      : (v) => setState(() => _agreed = v),
                  labelWidget: Text.rich(
                    TextSpan(
                      style: context.text.bodySmall,
                      children: [
                        TextSpan(text: l10n.agreePrefix),
                        TextSpan(
                          text: l10n.termsOfService,
                          style: linkStyle,
                          recognizer: _termsTap,
                        ),
                        TextSpan(text: l10n.agreeConjunction),
                        TextSpan(
                          text: l10n.privacyPolicy,
                          style: linkStyle,
                          recognizer: _privacyTap,
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.s16),
                BOHButton(
                  label: l10n.signUpCta,
                  size: BOHButtonSize.auth,
                  isLoading: isLoading,
                  onPressed: _submit,
                ),
                const SizedBox(height: AppSpacing.s8),
                Wrap(
                  alignment: WrapAlignment.center,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  spacing: AppSpacing.s4,
                  children: [
                    Text(l10n.haveAccountPrompt, style: context.text.body),
                    BOHButton(
                      label: l10n.logInLink,
                      variant: BOHButtonVariant.text,
                      onPressed: () => context.go(withQuery(AppRoutes.login)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
