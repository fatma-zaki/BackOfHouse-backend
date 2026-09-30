import 'package:flutter/gestures.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_colors.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/config/app_config.dart';
import '../../../../core/constants/app_assets.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/media/app_image.dart';
import '../../../../core/widgets/widgets.dart';

/// First screen for signed-out users: a stage photo fading into the page,
/// the community pitch and the two ways in.
class WelcomeScreen extends StatefulWidget {
  const WelcomeScreen({super.key});

  @override
  State<WelcomeScreen> createState() => _WelcomeScreenState();
}

class _WelcomeScreenState extends State<WelcomeScreen> {
  late final _termsTap = TapGestureRecognizer()
    ..onTap = () => launchUrl(
      Uri.parse(AppConfig.termsUrl),
      mode: LaunchMode.externalApplication,
    );

  /// The design's 440px photo, less the 40px its content overlaps (the
  /// photo is fully faded into the page there).
  static const double _photoHeight = 400;

  @override
  void dispose() {
    _termsTap.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    final c = context.colors;
    final text = context.text;
    final top = MediaQuery.paddingOf(context).top;
    // Preserve an interrupted deep link through the auth flow.
    final query = GoRouterState.of(context).uri.query;
    String withQuery(String path) => query.isEmpty ? path : '$path?$query';

    return BOHScaffold(
      body: LayoutBuilder(
        builder: (context, constraints) => SingleChildScrollView(
          child: ConstrainedBox(
            constraints: BoxConstraints(minHeight: constraints.maxHeight),
            child: IntrinsicHeight(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  SizedBox(
                    height: _photoHeight,
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        const BOHImage(
                          image: AppImage.asset(AppAssets.concertCrowd),
                        ),
                        Positioned(
                          top: 0,
                          left: 0,
                          right: 0,
                          height: 140 + top,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [
                                  AppColors.photoInk.withValues(alpha: 0.55),
                                  AppColors.photoInk.withValues(alpha: 0),
                                ],
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          left: 0,
                          right: 0,
                          bottom: 0,
                          height: 160,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                                colors: [
                                  c.background.withValues(alpha: 0),
                                  c.background,
                                ],
                              ),
                            ),
                          ),
                        ),
                        PositionedDirectional(
                          top: top + 12,
                          start: AppSpacing.formHorizontal,
                          end: AppSpacing.formHorizontal,
                          child: const Row(
                            children: [
                              BOHLogo(height: 44, onDark: true),
                              Spacer(),
                              BOHLanguageSwitch(onPhoto: true),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: SafeArea(
                      top: false,
                      minimum: const EdgeInsets.only(bottom: AppSpacing.s24),
                      child: Padding(
                        padding: const EdgeInsets.symmetric(
                          horizontal: AppSpacing.s24,
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.stretch,
                          children: [
                            BOHFadeSlide(
                              child: Align(
                                alignment: AlignmentDirectional.centerStart,
                                child: BOHEyebrow(
                                  l10n.welcomeEyebrow,
                                  lead: BOHEyebrowLead.rule,
                                  fontSize: 11,
                                  tracking: 2,
                                ),
                              ),
                            ),
                            const SizedBox(height: AppSpacing.s14),
                            BOHFadeSlide(
                              delay: BOHFadeSlide.stagger(1),
                              child: Semantics(
                                header: true,
                                child: Text.rich(
                                  TextSpan(
                                    text: l10n.welcomeTitleLead,
                                    children: [
                                      TextSpan(
                                        text: l10n.welcomeTitleAccent,
                                        style: TextStyle(
                                          color: c.headlineAccent,
                                        ),
                                      ),
                                    ],
                                  ),
                                  style: text.display,
                                ),
                              ),
                            ),
                            const SizedBox(height: AppSpacing.s14),
                            BOHFadeSlide(
                              delay: BOHFadeSlide.stagger(2),
                              child: Text(
                                l10n.welcomeSubtitle,
                                style: text.bodyLarge.copyWith(
                                  height: 22 / 14,
                                  color: c.textSecondary,
                                ),
                              ),
                            ),
                            const Spacer(),
                            const SizedBox(height: AppSpacing.s24),
                            BOHButton(
                              label: l10n.welcomeGetStarted,
                              size: BOHButtonSize.auth,
                              trailingIcon: null,
                              onPressed: () =>
                                  context.go(withQuery(AppRoutes.register)),
                            ),
                            const SizedBox(height: AppSpacing.s12),
                            BOHButton(
                              label: l10n.welcomeHaveAccount,
                              variant: BOHButtonVariant.ghost,
                              size: BOHButtonSize.auth,
                              trailingIcon: null,
                              onPressed: () =>
                                  context.go(withQuery(AppRoutes.login)),
                            ),
                            const SizedBox(height: AppSpacing.s14),
                            Text.rich(
                              TextSpan(
                                text: l10n.welcomeTermsLead,
                                children: [
                                  TextSpan(
                                    text: l10n.welcomeTermsLink,
                                    recognizer: _termsTap,
                                    style: TextStyle(
                                      color: c.primaryText,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                ],
                              ),
                              textAlign: TextAlign.center,
                              style: text.caption.copyWith(height: 16 / 11),
                            ),
                          ],
                        ),
                      ),
                    ),
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
