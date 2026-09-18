import 'package:flutter/material.dart';

import '../../../app/theme/app_spacing.dart';
import '../../extensions/context_extensions.dart';

/// Pinned footer for a screen's primary action — "Apply Now", "Submit".
/// Pass it as `BOHScaffold.bottomNavigationBar`.
class BOHActionBar extends StatelessWidget {
  const BOHActionBar({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: c.surface,
        border: Border(top: BorderSide(color: c.borderSoft)),
      ),
      child: SafeArea(
        top: false,
        minimum: const EdgeInsets.only(bottom: AppSpacing.s12),
        child: Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.screenHorizontal,
            AppSpacing.s12,
            AppSpacing.screenHorizontal,
            0,
          ),
          child: child,
        ),
      ),
    );
  }
}
