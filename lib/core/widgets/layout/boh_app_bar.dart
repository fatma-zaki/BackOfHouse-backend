import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import '../../../app/theme/app_spacing.dart';
import '../../constants/app_icons.dart';
import '../../extensions/context_extensions.dart';
import '../brand/boh_logo.dart';
import '../buttons/boh_icon_button.dart';

/// Frosted top bar. Two shapes, both from the Stitch system:
///
/// * [BOHAppBar.brand] — logo with "BACK OF HOUSE" overline and the section
///   title ("Home", "Discover"), for tab roots.
/// * [BOHAppBar.new]   — back button and title, for pushed screens.
class BOHAppBar extends StatelessWidget implements PreferredSizeWidget {
  const BOHAppBar({
    super.key,
    this.title,
    this.actions = const [],
    this.showBack,
    this.onBack,
  }) : _brand = false;

  const BOHAppBar.brand({super.key, this.title, this.actions = const []})
    : showBack = false,
      onBack = null,
      _brand = true;

  final String? title;
  final List<Widget> actions;

  /// Defaults to whether the route can pop.
  final bool? showBack;
  final VoidCallback? onBack;
  final bool _brand;

  @override
  Size get preferredSize => const Size.fromHeight(AppSizes.appBarHeight);

  @override
  Widget build(BuildContext context) {
    final c = context.colors;
    final canPop = showBack ?? GoRouter.of(context).canPop();

    final Widget leading = _brand
        ? Row(
            children: [
              const BOHLogo(size: 40),
              const SizedBox(width: AppSpacing.s12),
              Flexible(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      context.isArabic
                          ? context.l10n.appName
                          : context.l10n.appName.toUpperCase(),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: context.text.caption.copyWith(
                        color: c.textSecondary,
                        letterSpacing: context.isArabic ? 0 : 0.8,
                      ),
                    ),
                    if (title != null)
                      Semantics(
                        header: true,
                        child: Text(
                          title!,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: context.text.cardTitle.copyWith(
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ],
          )
        : Row(
            children: [
              if (canPop) ...[
                BOHIconButton(
                  icon: AppIcons.arrowBack,
                  semanticLabel: context.l10n.actionBack,
                  variant: BOHIconButtonVariant.tonal,
                  onPressed: onBack ?? () => context.pop(),
                ),
                const SizedBox(width: AppSpacing.s8),
              ],
              if (title != null)
                Flexible(
                  child: Semantics(
                    header: true,
                    child: Text(
                      title!,
                      style: context.text.h3,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ),
            ],
          );

    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 16, sigmaY: 16),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: c.glass,
            border: Border(bottom: BorderSide(color: c.borderSoft)),
          ),
          child: SafeArea(
            bottom: false,
            child: SizedBox(
              height: preferredSize.height,
              child: Padding(
                padding: const EdgeInsetsDirectional.only(
                  start: AppSpacing.screenHorizontal,
                  end: AppSpacing.screenHorizontal - AppSpacing.s8,
                ),
                child: Row(
                  children: [
                    Expanded(child: leading),
                    for (final action in actions) ...[
                      const SizedBox(width: AppSpacing.s4),
                      action,
                    ],
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
