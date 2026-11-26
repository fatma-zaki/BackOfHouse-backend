import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
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
import '../controllers/auth_controller.dart';
import '../widgets/auth_feedback.dart';

/// Sign in with a one-time code sent by SMS: enter the number, then the
/// code. Reaches the same account as email or Google.
class PhoneSignInScreen extends ConsumerStatefulWidget {
  const PhoneSignInScreen({super.key});

  @override
  ConsumerState<PhoneSignInScreen> createState() => _PhoneSignInScreenState();
}

class _PhoneSignInScreenState extends ConsumerState<PhoneSignInScreen> {
  final _phoneForm = GlobalKey<FormState>();
  final _codeForm = GlobalKey<FormState>();
  final _phone = TextEditingController();
  final _code = TextEditingController();

  /// The E.164 number a code was sent to; `null` while entering the number.
  String? _sentTo;
  bool _sending = false;

  @override
  void dispose() {
    _phone.dispose();
    _code.dispose();
    super.dispose();
  }

  Future<void> _sendCode({bool resend = false}) async {
    final phone = resend ? _sentTo : Validators.normalisePhone(_phone.text);
    if (!resend && !(_phoneForm.currentState?.validate() ?? false)) return;
    if (phone == null) return;
    FocusScope.of(context).unfocus();
    setState(() => _sending = true);
    try {
      await ref.read(authRepositoryProvider).requestPhoneCode(phone);
      if (!mounted) return;
      setState(() => _sentTo = phone);
      if (resend) showAuthMessage(context, context.l10n.phoneCodeSent);
    } on Object catch (e) {
      if (mounted) showAuthMessage(context, context.l10n.error(e));
    } finally {
      if (mounted) setState(() => _sending = false);
    }
  }

  Future<void> _verify() async {
    if (!(_codeForm.currentState?.validate() ?? false)) return;
    FocusScope.of(context).unfocus();
    // Success navigation is the router's job (auth redirect).
    await ref
        .read(authControllerProvider.notifier)
        .signInWithPhoneCode(
          phone: _sentTo!,
          code: Validators.digits(_code.text),
        );
  }

  @override
  Widget build(BuildContext context) {
    listenForAuthErrors(ref, context);

    final l10n = context.l10n;
    final c = context.colors;
    final text = context.text;
    final verifying = ref.watch(
      authControllerProvider.select((s) => s.isLoading),
    );
    final query = GoRouterState.of(context).uri.query;
    final codeStep = _sentTo != null;

    return BOHScaffold(
      appBar: BOHAppBar(
        showBack: true,
        centerTitle: true,
        onBack: () => codeStep
            ? setState(() {
                _sentTo = null;
                _code.clear();
              })
            : context.go(
                query.isEmpty ? AppRoutes.login : '${AppRoutes.login}?$query',
              ),
        titleWidget: const BOHLogo(height: 38),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.s24,
          AppSpacing.s32,
          AppSpacing.s24,
          AppSpacing.s24,
        ),
        child: AnimatedSwitcher(
          duration: context.reduceMotion
              ? Duration.zero
              : const Duration(milliseconds: 250),
          child: codeStep
              ? Form(
                  key: _codeForm,
                  child: Column(
                    key: const ValueKey('code'),
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Semantics(
                        header: true,
                        child: Text(l10n.phoneCodeTitle, style: text.display),
                      ),
                      const SizedBox(height: AppSpacing.s6),
                      Text(
                        l10n.phoneCodeSubtitle(_sentTo!),
                        style: text.bodyLarge.copyWith(color: c.textSecondary),
                      ),
                      const SizedBox(height: 22),
                      BOHTextField(
                        controller: _code,
                        label: l10n.phoneCodeLabel,
                        hint: '••••••',
                        auth: true,
                        forceLtr: true,
                        autofocus: true,
                        keyboardType: TextInputType.number,
                        autofillHints: const [AutofillHints.oneTimeCode],
                        inputFormatters: [LengthLimitingTextInputFormatter(6)],
                        validator: l10n.validator(Validators.otpCode),
                        onSubmitted: (_) => _verify(),
                        enabled: !verifying,
                      ),
                      const SizedBox(height: 22),
                      BOHButton(
                        label: l10n.phoneVerifyCta,
                        size: BOHButtonSize.auth,
                        isLoading: verifying,
                        onPressed: _verify,
                      ),
                      const SizedBox(height: AppSpacing.s12),
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          BOHLinkButton(
                            label: l10n.phoneChangeNumber,
                            arrow: false,
                            onTap: verifying
                                ? null
                                : () => setState(() {
                                    _sentTo = null;
                                    _code.clear();
                                  }),
                          ),
                          BOHLinkButton(
                            label: l10n.phoneResendCode,
                            arrow: false,
                            onTap: _sending || verifying
                                ? null
                                : () => _sendCode(resend: true),
                          ),
                        ],
                      ),
                    ],
                  ),
                )
              : Form(
                  key: _phoneForm,
                  child: Column(
                    key: const ValueKey('phone'),
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      Semantics(
                        header: true,
                        child: Text.rich(
                          TextSpan(
                            text: l10n.phoneSignInTitle,
                            children: [
                              TextSpan(
                                text: l10n.phoneSignInTitleAccent,
                                style: TextStyle(color: c.headlineAccent),
                              ),
                            ],
                          ),
                          style: text.display,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.s6),
                      Text(
                        l10n.phoneSignInSubtitle,
                        style: text.bodyLarge.copyWith(color: c.textSecondary),
                      ),
                      const SizedBox(height: 22),
                      BOHTextField(
                        controller: _phone,
                        label: l10n.fieldPhoneLabel,
                        hint: l10n.fieldPhoneHint,
                        prefixIcon: AppIcons.smartphone,
                        auth: true,
                        forceLtr: true,
                        keyboardType: TextInputType.phone,
                        autofillHints: const [AutofillHints.telephoneNumber],
                        validator: l10n.validator(Validators.phone),
                        onSubmitted: (_) => _sendCode(),
                        enabled: !_sending,
                      ),
                      const SizedBox(height: 22),
                      BOHButton(
                        label: l10n.phoneSendCode,
                        size: BOHButtonSize.auth,
                        isLoading: _sending,
                        onPressed: _sendCode,
                      ),
                    ],
                  ),
                ),
        ),
      ),
    );
  }
}
