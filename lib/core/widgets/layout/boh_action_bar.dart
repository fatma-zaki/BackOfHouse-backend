import 'dart:math' as math;

import 'package:flutter/material.dart';

import '../../../app/theme/app_radii.dart';
import '../../../app/theme/app_shadows.dart';
import '../../../app/theme/app_spacing.dart';
import '../../extensions/context_extensions.dart';

/// Pinned footer for a screen's main action — "Apply now", "Submit". A
/// surface sheet with a rounded top edge. Pass it as
/// `BOHScaffold.bottomNavigationBar`.
///
/// Use [BOHActionBar.pair] for "secondary + primary" (1 : 1.4), with an
/// optional [leading] (price, save button) and a [helper] line below.
class BOHActionBar extends StatelessWidget {
  const BOHActionBar({
    super.key,
    required this.child,
    this.leading,
    this.helper,
    this.plain = false,
  }) : secondary = null;

  const BOHActionBar.pair({
    super.key,
    required Widget this.secondary,
    required Widget primary,
    this.helper,
  }) : child = primary,
       leading = null,
       plain = false;

  /// The primary action (fills the remaining width).
  final Widget child;
  final Widget? secondary;

  /// Before the primary action: a price block or a square save button.
  final Widget? leading;
  final String? helper;

  /// No surface — buttons sit on the page ground (auth, confirmations).
  final bool plain;

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final bottom = math.max(MediaQuery.paddingOf(context).bottom, 16.0) + 14;

    final Widget actions = secondary != null
        ? Row(
            children: [
              Expanded(flex: 10, child: secondary!),
              const SizedBox(width: AppSpacing.s10),
              Expanded(flex: 14, child: child),
            ],
          )
        : leading != null
        ? Row(
            children: [
              leading!,
              const SizedBox(width: AppSpacing.s14),
              Expanded(child: child),
            ],
          )
        : child;

    final content = Padding(
      padding: EdgeInsets.fromLTRB(
        AppSpacing.formHorizontal,
        plain ? AppSpacing.s12 : AppSpacing.s14,
        AppSpacing.formHorizontal,
        bottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          actions,
          if (helper != null) ...[
            const SizedBox(height: AppSpacing.s8),
            Text(
              helper!,
              textAlign: TextAlign.center,
              style: context.text.caption,
            ),
          ],
        ],
      ),
    );

    if (plain) return content;
    return DecoratedBox(
      decoration: BoxDecoration(
        color: c.surface,
        borderRadius: AppRadii.sheetTop,
        border: Border(top: BorderSide(color: c.border)),
        boxShadow: AppShadows.nav(c),
      ),
      child: content,
    );
  }
}
