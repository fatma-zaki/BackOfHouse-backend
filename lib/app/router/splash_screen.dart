import 'package:flutter/material.dart';

import '../../core/extensions/context_extensions.dart';
import '../../core/widgets/widgets.dart';
import '../theme/app_spacing.dart';

/// Held on screen while the stored session is restored: the logo, the
/// community line and a loading bar over a few quiet outline squares.
class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final l10n = context.l10n;

    Widget outline(double size, double turns) => Transform.rotate(
      angle: turns,
      child: Container(
        width: size,
        height: size,
        decoration: BoxDecoration(
          border: Border.all(color: c.border, width: 2),
        ),
      ),
    );
    Widget square(double size, double opacity) => Opacity(
      opacity: opacity,
      child: SizedBox.square(
        dimension: size,
        child: ColoredBox(color: c.primary),
      ),
    );
    Widget rule() => Container(width: 24, height: 2, color: c.primary);

    return BOHScaffold(
      body: Stack(
        children: [
          PositionedDirectional(top: 120, end: -60, child: outline(220, 0.21)),
          PositionedDirectional(
            bottom: 150,
            start: -70,
            child: outline(180, -0.17),
          ),
          PositionedDirectional(top: 250, start: 56, child: square(14, 0.5)),
          PositionedDirectional(bottom: 300, end: 64, child: square(10, 0.35)),
          Center(
            child: BOHFadeSlide(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const BOHLogo(height: 105),
                  const SizedBox(height: 22),
                  Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      rule(),
                      const SizedBox(width: AppSpacing.s12),
                      Flexible(
                        child: BOHEyebrow(
                          l10n.welcomeEyebrow,
                          fontSize: 11,
                          tracking: 2,
                        ),
                      ),
                      const SizedBox(width: AppSpacing.s12),
                      rule(),
                    ],
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 72,
            child: Semantics(
              liveRegion: true,
              label: l10n.stateLoading,
              child: Column(
                children: [
                  SizedBox(
                    width: 120,
                    child: LinearProgressIndicator(
                      minHeight: 4,
                      borderRadius: BorderRadius.circular(2),
                      color: c.primary,
                      backgroundColor: c.border,
                    ),
                  ),
                  const SizedBox(height: AppSpacing.s14),
                  ExcludeSemantics(
                    child: Text(l10n.stateLoading, style: context.text.caption),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
