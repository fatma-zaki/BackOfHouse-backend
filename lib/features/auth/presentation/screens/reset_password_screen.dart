import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/constants/app_icons.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/l10n/l10n_messages.dart';
import '../../../../core/utils/validators.dart';
import '../../../../core/widgets/widgets.dart';
import '../../data/auth_repository_impl.dart';
import '../widgets/auth_feedback.dart';

/// Asks for a password reset link. The confirmation never says whether the
/// email has an account.
class ResetPasswordScreen extends ConsumerStatefulWidget {
  const ResetPasswordScreen({super.key});

  @override
  ConsumerState<ResetPasswordScreen> createState() =>
      _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends ConsumerState<ResetPasswordScreen> {
  final _form = GlobalKey<FormState>();
  final _email = TextEditingController();
  bool _sending = false;
  String? _sentTo;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    if (!(_form.currentState?.validate() ?? false)) return;
    final email = _email.text.trim();
    setState(() => _sending = true);
    try {
      await ref.read(authRepositoryProvider).requestPasswordReset(email);
      if (mounted) setState(() => _sentTo = email);
    } catch (e) {
      if (mounted) showAuthMessage(context, context.l10n.error(e));
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  void _backToSignIn() =>
      context.canPop() ? context.pop() : context.go(AppRoutes.login);

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    final text = context.text;
    final sentTo = _sentTo;

    return BOHScaffold(
      appBar: BOHAppBar(
        showBack: true,
        centerTitle: true,
        onBack: _backToSignIn,
        titleWidget: const BOHLogo(height: 38),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.s24,
          AppSpacing.s32,
          AppSpacing.s24,
          AppSpacing.s24,
        ),
        child: sentTo != null
            ? Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Semantics(
                    liveRegion: true,
                    child: BOHSuccessHero(
                      title: l10n.resetSentTitle,
                      message: l10n.resetSentBody(sentTo),
                    ),
                  ),
                  const SizedBox(height: AppSpacing.s24),
                  BOHButton(
                    label: l10n.resetBackToSignIn,
                    size: BOHButtonSize.auth,
                    trailingIcon: null,
                    onPressed: _backToSignIn,
                  ),
                ],
              )
            : Form(
                key: _form,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Semantics(
                      header: true,
                      child: Text(l10n.resetTitle, style: text.display),
                    ),
                    const SizedBox(height: AppSpacing.s6),
                    Text(
                      l10n.resetSubtitle,
                      style: text.bodyLarge.copyWith(color: c.textSecondary),
                    ),
                    const SizedBox(height: 22),
                    BOHTextField(
                      controller: _email,
                      label: l10n.fieldEmailLabel,
                      hint: l10n.fieldEmailHint,
                      prefixIcon: AppIcons.email,
                      auth: true,
                      forceLtr: true,
                      autofocus: true,
                      keyboardType: TextInputType.emailAddress,
                      autofillHints: const [AutofillHints.email],
                      validator: l10n.validator(Validators.email),
                      onSubmitted: (_) => _send(),
                      enabled: !_sending,
                    ),
                    const SizedBox(height: 22),
                    BOHButton(
                      label: l10n.resetCta,
                      size: BOHButtonSize.auth,
                      isLoading: _sending,
                      onPressed: _send,
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}
