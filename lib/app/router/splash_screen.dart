import 'package:flutter/widgets.dart';

import '../../app/theme/app_spacing.dart';
import '../../core/widgets/widgets.dart';

/// Held on screen while the stored session is restored.
class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const BOHScaffold(
      glowAlignment: AlignmentDirectional.center,
      glowIntensity: 0.12,
      body: Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            BOHFadeSlide(child: BOHLogo(size: 104)),
            SizedBox(height: AppSpacing.s40),
            BOHShimmer(child: BOHSkeleton.line(width: 72, height: 2)),
          ],
        ),
      ),
    );
  }
}
