import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../../app/router/app_routes.dart';
import '../../../../app/theme/app_spacing.dart';
import '../../../../core/extensions/context_extensions.dart';
import '../../../../core/widgets/widgets.dart';

/// First screen for signed-out users.
class WelcomeScreen extends StatelessWidget {
  const WelcomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final l10n = context.l10n;
    // Preserve an interrupted deep link through the auth flow.
    final query = GoRouterState.of(context).uri.query;
    String withQuery(String path) => query.isEmpty ? path : '$path?$query';

    return BOHScaffold(
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) => SingleChildScrollView(
            padding: BOHScaffold.screenPadding,
            child: ConstrainedBox(
              constraints: BoxConstraints(minHeight: constraints.maxHeight),
              child: IntrinsicHeight(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    const SizedBox(height: AppSpacing.s24),
                    const Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        BOHLogo(size: 104),
                        Spacer(),
                        BOHLanguageSwitch(),
                      ],
                    ),
                    const Spacer(flex: 2),
                    const SizedBox(height: AppSpacing.s48),
                    BOHFadeSlide(child: BOHEyebrow(l10n.welcomeEyebrow)),
                    const SizedBox(height: AppSpacing.s16),
                    BOHFadeSlide(
                      delay: BOHFadeSlide.stagger(1),
                      child: BOHAccentText(
                        lead: l10n.welcomeTitleLead,
                        accent: l10n.welcomeTitleAccent,
                        style: context.text.display.copyWith(
                          fontSize: 40,
                          height: 48 / 40,
                        ),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.s20),
                    BOHFadeSlide(
                      delay: BOHFadeSlide.stagger(2),
                      child: Text(
                        l10n.welcomeSubtitle,
                        style: context.text.bodyLarge,
                      ),
                    ),
                    const Spacer(flex: 3),
                    const SizedBox(height: AppSpacing.s48),
                    BOHButton(
                      label: l10n.welcomeGetStarted,
                      shape: BOHButtonShape.pill,
                      onPressed: () =>
                          context.go(withQuery(AppRoutes.register)),
                    ),
                    const SizedBox(height: AppSpacing.s12),
                    Center(
                      child: BOHButton(
                        label: l10n.welcomeHaveAccount,
                        variant: BOHButtonVariant.text,
                        onPressed: () => context.go(withQuery(AppRoutes.login)),
                      ),
                    ),
                    const SizedBox(height: AppSpacing.s16),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
