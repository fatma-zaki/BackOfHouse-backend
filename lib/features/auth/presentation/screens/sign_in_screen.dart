import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_assets.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/l10n_messages.dart';
import '../../../../core/utils/validators.dart';
import '../../../../core/widgets/widgets.dart';
import '../controllers/auth_controller.dart';
import '../widgets/auth_feedback.dart';

class SignInScreen extends ConsumerStatefulWidget {
  const SignInScreen({super.key});

  @override
  ConsumerState<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends ConsumerState<SignInScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController();
  final _password = TextEditingController();

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!(_formKey.currentState?.validate() ?? false)) return;
    FocusScope.of(context).unfocus();
    // Success navigation is the router's job (auth redirect).
    await ref
        .read(authControllerProvider.notifier)
        .login(email: _email.text, password: _password.text);
  }

  @override
  Widget build(BuildContext context) {
    listenForAuthErrors(ref, context);

    final l10n = context.l10n;
    final isLoading = ref.watch(
      authControllerProvider.select((s) => s.isLoading),
    );
    final query = GoRouterState.of(context).uri.query;

    return BOHScaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: BOHScaffold.screenPadding.add(
            const EdgeInsets.symmetric(vertical: AppSpacing.s32),
          ),
          child: AutofillGroup(
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const BOHLogo(size: 84),
                  const SizedBox(height: AppSpacing.s32),
                  Semantics(
                    header: true,
                    child: Text(l10n.signInTitle, style: context.text.display),
                  ),
                  const SizedBox(height: AppSpacing.s12),
                  Text(l10n.signInSubtitle, style: context.text.bodyLarge),
                  const SizedBox(height: AppSpacing.s32),
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
                  const SizedBox(height: AppSpacing.s20),
                  BOHTextField(
                    controller: _password,
                    label: l10n.fieldPasswordLabel,
                    hint: l10n.fieldPasswordHint,
                    prefixIcon: AppIcons.password,
                    obscurable: true,
                    textInputAction: TextInputAction.done,
                    autofillHints: const [AutofillHints.password],
                    validator: l10n.validator(Validators.passwordPresent),
                    onSubmitted: (_) => _submit(),
                    enabled: !isLoading,
                  ),
                  Align(
                    alignment: AlignmentDirectional.centerEnd,
                    child: BOHButton(
                      label: l10n.forgotPassword,
                      variant: BOHButtonVariant.text,
                      onPressed: () => context.push(AppRoutes.resetPassword),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.s12),
                  BOHButton(
                    label: l10n.signInCta,
                    isLoading: isLoading,
                    onPressed: _submit,
                  ),
                  const SizedBox(height: AppSpacing.s24),
                  BOHDivider(label: l10n.orDivider),
                  const SizedBox(height: AppSpacing.s24),
                  BOHButton(
                    label: l10n.continueWithGoogle,
                    variant: BOHButtonVariant.ghost,
                    trailingIcon: null,
                    leading: Image.asset(AppAssets.googleLogo),
                    onPressed: isLoading ? null : () => showComingSoon(context),
                  ),
                  const SizedBox(height: AppSpacing.s24),
                  Wrap(
                    alignment: WrapAlignment.center,
                    crossAxisAlignment: WrapCrossAlignment.center,
                    spacing: AppSpacing.s4,
                    children: [
                      Text(l10n.noAccountPrompt, style: context.text.body),
                      BOHButton(
                        label: l10n.createAccountLink,
                        variant: BOHButtonVariant.text,
                        onPressed: () => context.go(
                          query.isEmpty
                              ? AppRoutes.register
                              : '${AppRoutes.register}?$query',
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
