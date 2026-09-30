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

/// Email and password sign-in, with Google and a phone code as the other
/// ways in.
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
    final c = context.colors;
    final text = context.text;
    final isLoading = ref.watch(
      authControllerProvider.select((s) => s.isLoading),
    );
    final query = GoRouterState.of(context).uri.query;
    String withQuery(String path) => query.isEmpty ? path : '$path?$query';

    return BOHScaffold(
      appBar: BOHAppBar(
        showBack: true,
        centerTitle: true,
        onBack: () => context.go(withQuery(AppRoutes.auth)),
        titleWidget: const BOHLogo(height: 38),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.s24,
          AppSpacing.s32,
          AppSpacing.s24,
          AppSpacing.s24,
        ),
        child: AutofillGroup(
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Semantics(
                  header: true,
                  child: Text.rich(
                    TextSpan(
                      text: l10n.signInTitle,
                      children: [
                        TextSpan(
                          text: l10n.signInTitleAccent,
                          style: TextStyle(color: c.headlineAccent),
                        ),
                      ],
                    ),
                    style: text.display,
                  ),
                ),
                const SizedBox(height: AppSpacing.s6),
                Text(
                  l10n.signInSubtitle,
                  style: text.bodyLarge.copyWith(color: c.textSecondary),
                ),
                const SizedBox(height: 22),
                BOHTextField(
                  controller: _email,
                  label: l10n.fieldEmailLabel,
                  hint: l10n.fieldEmailHint,
                  prefixIcon: AppIcons.email,
                  auth: true,
                  keyboardType: TextInputType.emailAddress,
                  forceLtr: true,
                  textInputAction: TextInputAction.next,
                  autofillHints: const [AutofillHints.email],
                  validator: l10n.validator(Validators.email),
                  enabled: !isLoading,
                ),
                const SizedBox(height: AppSpacing.s14),
                BOHTextField(
                  controller: _password,
                  label: l10n.fieldPasswordLabel,
                  labelTrailing: BOHLinkButton(
                    label: l10n.forgotPassword,
                    arrow: false,
                    fontSize: 12,
                    onTap: () => context.push(AppRoutes.resetPassword),
                  ),
                  hint: l10n.fieldPasswordHint,
                  prefixIcon: AppIcons.password,
                  auth: true,
                  obscurable: true,
                  textInputAction: TextInputAction.done,
                  autofillHints: const [AutofillHints.password],
                  validator: l10n.validator(Validators.passwordPresent),
                  onSubmitted: (_) => _submit(),
                  enabled: !isLoading,
                ),
                const SizedBox(height: 22),
                BOHButton(
                  label: l10n.signInCta,
                  size: BOHButtonSize.auth,
                  isLoading: isLoading,
                  onPressed: _submit,
                ),
                const SizedBox(height: 22),
                BOHDivider(label: l10n.orDivider),
                const SizedBox(height: 22),
                BOHButton(
                  label: l10n.continueWithGoogle,
                  variant: BOHButtonVariant.ghost,
                  size: BOHButtonSize.auth,
                  trailingIcon: null,
                  leading: Image.asset(AppAssets.googleLogo),
                  onPressed: isLoading ? null : () => showComingSoon(context),
                ),
                const SizedBox(height: AppSpacing.s12),
                BOHButton(
                  label: l10n.continueWithPhone,
                  variant: BOHButtonVariant.ghost,
                  size: BOHButtonSize.auth,
                  trailingIcon: null,
                  leadingIcon: AppIcons.smartphone,
                  onPressed: isLoading
                      ? null
                      : () => context.push(withQuery(AppRoutes.phoneLogin)),
                ),
                const SizedBox(height: AppSpacing.s32),
                Wrap(
                  alignment: WrapAlignment.center,
                  crossAxisAlignment: WrapCrossAlignment.center,
                  spacing: AppSpacing.s4,
                  children: [
                    Text(l10n.noAccountPrompt, style: text.body),
                    BOHButton(
                      label: l10n.createAccountLink,
                      variant: BOHButtonVariant.text,
                      onPressed: () =>
                          context.go(withQuery(AppRoutes.register)),
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
