import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../../app/theme/app_colors.dart';
import '../../../app/theme/app_spacing.dart';
import '../../../app/theme/app_theme.dart';
import '../../extensions/context_extensions.dart';
import 'boh_ambient_background.dart';

/// Screen root. Owns the ground, the status bar style for the active mode
/// and the bottom-navigation inset, so feature screens only describe content.
class BOHScaffold extends StatelessWidget {
  const BOHScaffold({
    super.key,
    required this.body,
    this.appBar,
    this.bottomNavigationBar,
    this.ambient = true,
    this.glowAlignment = AlignmentDirectional.topEnd,
    this.glowIntensity = 0.14,
    this.resizeToAvoidBottomInset = true,
  });

  final Widget body;
  final PreferredSizeWidget? appBar;
  final Widget? bottomNavigationBar;

  /// Paint [BOHAmbientBackground] (visible in dark mode) behind the page.
  final bool ambient;
  final AlignmentDirectional glowAlignment;
  final double glowIntensity;
  final bool resizeToAvoidBottomInset;

  /// Standard horizontal inset for screen content.
  static const EdgeInsetsDirectional screenPadding =
      EdgeInsetsDirectional.symmetric(horizontal: AppSpacing.screenHorizontal);

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final scaffold = Scaffold(
      backgroundColor: ambient ? AppColors.transparent : c.background,
      appBar: appBar,
      // The navigation floats; content scrolls beneath it and reads the
      // bar's height from MediaQuery padding.
      extendBody: bottomNavigationBar != null,
      bottomNavigationBar: bottomNavigationBar,
      resizeToAvoidBottomInset: resizeToAvoidBottomInset,
      body: body,
    );

    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: AppTheme.overlayFor(c.brightness),
      child: ambient
          ? Stack(
              fit: StackFit.expand,
              children: [
                BOHAmbientBackground(
                  glowAlignment: glowAlignment,
                  intensity: glowIntensity,
                ),
                scaffold,
              ],
            )
          : scaffold,
    );
  }
}
